/**
 * OutfitCanvasEditor.jsx
 *
 * Canvas-based outfit composer for "오늘의 코디 만들기".
 * Worn items are placed as draggable/resizable image layers on a coloured canvas.
 * On save the canvas is composited to a JPEG data URL (= the style thumbnail).
 *
 * Props
 *   initialItemIds  string[]  – closet item IDs to pre-populate
 *   dateStr         string    – "YYYY-MM-DD" used as default title
 *   onSave          fn(entry) – called after coordi entry is persisted
 *   onClose         fn()      – called when user presses ← back
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { CLOSET_ITEMS, MAIN_CATEGORIES } from "../constants/mockClosetData";
import { saveCoordi } from "../lib/coordiStore";
import { extractColors } from "../lib/colorExtractor";

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT    = "'Spoqa Han Sans Neo', sans-serif";
const DARK    = "#1a1a1a";
const YELLOW  = "#F5C200";
const DIVIDER = "#F0F0F0";

// Canvas logical size in CSS px — also used for off-screen compositing
const CW = 327;   // canvas width  (375 phone − 24px side padding × 2)
const CH = 400;   // canvas height

const BG_OPTIONS = [
  { label: "화이트",    value: "#FFFFFF" },
  { label: "아이보리",  value: "#FAF8F3" },
  { label: "그레이",    value: "#F2F2F2" },
  { label: "베이지",    value: "#F5ECD8" },
  { label: "크림",      value: "#FFFDE8" },
  { label: "블랙",      value: "#1A1A1A" },
  { label: "네이비",    value: "#1A2A4A" },
  { label: "라벤더",    value: "#EEE8F8" },
  { label: "민트",      value: "#E8F5F2" },
  { label: "로즈",      value: "#F8EEF0" },
];

const CAT_FILTER = ["전체", "상의", "하의", "아우터", "원피스", "신발", "가방", "액세서리"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _uc = 1;
const uid = () => `ci-${_uc++}`;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Auto-arrange up to N items in a tidy grid on the canvas */
function getInitialPlacements(n) {
  const pad = 28, gap = 10;
  const aw  = CW - pad * 2;
  if (n === 0) return [];
  if (n === 1) {
    const w = 176, h = Math.round(w * 1.28);
    return [{ w, h, x: Math.round((CW - w) / 2), y: Math.round((CH - h) / 2) }];
  }
  if (n === 2) {
    const w = Math.round((aw - gap) / 2), h = Math.round(w * 1.28);
    const y = Math.round((CH - h) / 2);
    return [
      { w, h, x: pad,           y },
      { w, h, x: pad + w + gap, y },
    ];
  }
  // 3-6 items → 2-column grid
  const w  = Math.round((aw - gap) / 2), h = Math.round(w * 1.28);
  const rows = Math.ceil(n / 2);
  const th   = rows * h + (rows - 1) * gap;
  const sy   = Math.max(pad, Math.round((CH - th) / 2));
  return Array.from({ length: n }, (_, i) => ({
    w, h,
    x: pad + (i % 2) * (w + gap),
    y: sy + Math.floor(i / 2) * (h + gap),
  }));
}

/**
 * Off-screen canvas compositing.
 * Renders all layers onto a 2× canvas and returns a JPEG data URL.
 */
async function composeToDataUrl(items, bgColor) {
  const scale = 2;
  const oc    = document.createElement("canvas");
  oc.width    = CW * scale;
  oc.height   = CH * scale;
  const ctx   = oc.getContext("2d");
  ctx.scale(scale, scale);

  // background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, CW, CH);

  // draw items in ascending z-order
  const sorted = [...items].sort((a, b) => a.zIndex - b.zIndex);
  for (const item of sorted) {
    await new Promise((resolve) => {
      const img       = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (item.bgRemoved) {
          // Pixel-level white background removal
          const tmp = document.createElement("canvas");
          tmp.width  = img.naturalWidth;
          tmp.height = img.naturalHeight;
          const tc   = tmp.getContext("2d");
          tc.drawImage(img, 0, 0);
          try {
            const px = tc.getImageData(0, 0, tmp.width, tmp.height);
            for (let i = 0; i < px.data.length; i += 4) {
              if (px.data[i] > 228 && px.data[i + 1] > 228 && px.data[i + 2] > 228)
                px.data[i + 3] = 0;
            }
            tc.putImageData(px, 0, 0);
            ctx.drawImage(tmp, item.x, item.y, item.w, item.h);
          } catch {
            ctx.drawImage(img, item.x, item.y, item.w, item.h);
          }
        } else {
          ctx.drawImage(img, item.x, item.y, item.w, item.h);
        }
        resolve();
      };
      img.onerror = resolve;
      img.src = item.imgSrc;
    });
  }
  return oc.toDataURL("image/jpeg", 0.88);
}

// ─── SVG Icon components ──────────────────────────────────────────────────────

function IcoForward() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M4 16V8.5C4 7.12 5.12 6 6.5 6H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 2L16 6L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IcoBack() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M16 4V11.5C16 12.88 14.88 14 13.5 14H4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 18L4 14L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IcoCopy() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 13V4C4 2.9 4.9 2 6 2H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IcoEraser() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 17H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 17L2 14L11 5L17 11L12 17" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
function IcoTrash() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M7 2H13M3 5H17M15 5L14.2 15.6C14.1 16.4 13.4 17 12.6 17H7.4C6.6 17 5.9 16.4 5.8 15.6L5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}
function IcoGrid() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="2" y="2"   width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="12" y="2"  width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="12"  width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="12" y="12" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function IcoUpload() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 14V4M7 8L11 4L15 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16V18C4 18.6 4.4 19 5 19H17C17.6 19 18 18.6 18 18V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IcoBg() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="2" y="2" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="8" r="2" fill="currentColor" />
      <path d="M2 14L7 9L11 13L14 10L20 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IcoDownload() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 4V14M7 10L11 14L15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16V18C4 18.6 4.4 19 5 19H17C17.6 19 18 18.6 18 18V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IcoShare() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="17" cy="5"  r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5"  cy="11" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17" cy="17" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7.5 10L14.5 6M7.5 12L14.5 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IcoResize() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2 8L8 2M5 8H8V5" stroke={DARK} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OutfitCanvasEditor({
  initialItemIds = [],
  dateStr,
  onSave,
  onClose,
}) {
  // ── Canvas items state ──────────────────────────────────────────────────────
  const [items, setItems] = useState(() => {
    const imgs = initialItemIds
      .map((id) => CLOSET_ITEMS.find((ci) => ci.id === id)?.image)
      .filter(Boolean);
    const pl = getInitialPlacements(imgs.length);
    return imgs.map((imgSrc, i) => ({
      id:        uid(),
      imgSrc,
      x:         pl[i].x,
      y:         pl[i].y,
      w:         pl[i].w,
      h:         pl[i].h,
      zIndex:    i + 1,
      bgRemoved: false,
    }));
  });

  const [selectedId,  setSelectedId]  = useState(null);
  const [bgColor,     setBgColor]     = useState("#FFFFFF");
  const [activeTool,  setActiveTool]  = useState(null); // "items" | "bg" | null
  const [catFilter,   setCatFilter]   = useState("전체");
  const [showSave,    setShowSave]    = useState(false);
  const [styleName,   setStyleName]   = useState("");
  const [saving,      setSaving]      = useState(false);

  // Keep a ref to items so touch callbacks never go stale
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  const dragRef   = useRef(null);  // { type, id, stx, sty, sx, sy, sw, sh }
  const canvasRef = useRef(null);
  const fileRef   = useRef(null);

  const selected = items.find((i) => i.id === selectedId) ?? null;
  const maxZ     = items.length ? Math.max(...items.map((i) => i.zIndex)) : 0;

  // ── Non-passive touchmove on canvas (prevents scroll during drag) ───────────
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onMove = (e) => {
      if (!dragRef.current) return;
      e.preventDefault();
      const t  = e.touches[0];
      const dr = dragRef.current;
      const dx = t.clientX - dr.stx;
      const dy = t.clientY - dr.sty;

      if (dr.type === "move") {
        setItems((prev) =>
          prev.map((item) =>
            item.id === dr.id
              ? {
                  ...item,
                  x: clamp(dr.sx + dx, -item.w * 0.5, CW - item.w * 0.5),
                  y: clamp(dr.sy + dy, -item.h * 0.5, CH - item.h * 0.5),
                }
              : item
          )
        );
      } else {
        // resize — preserve aspect ratio
        const nw    = clamp(dr.sw + dx, 48, CW - dr.sx + 30);
        const ratio = dr.sh / dr.sw;
        setItems((prev) =>
          prev.map((item) =>
            item.id === dr.id
              ? { ...item, w: Math.round(nw), h: Math.round(nw * ratio) }
              : item
          )
        );
      }
    };
    el.addEventListener("touchmove", onMove, { passive: false });
    return () => el.removeEventListener("touchmove", onMove);
  }, []);

  const onCanvasTouchEnd = useCallback(() => { dragRef.current = null; }, []);

  // ── Item-level touch start (move or resize) ──────────────────────────────────
  const onItemTouchStart = useCallback((e, id, type = "move") => {
    e.stopPropagation();
    const t    = e.touches[0];
    const item = itemsRef.current.find((i) => i.id === id);
    if (!item) return;
    setSelectedId(id);
    // bring to front
    setItems((prev) => {
      const mz = Math.max(...prev.map((i) => i.zIndex));
      return prev.map((i) => (i.id === id ? { ...i, zIndex: mz + 1 } : i));
    });
    dragRef.current = {
      type, id,
      stx: t.clientX, sty: t.clientY,
      sx: item.x, sy: item.y, sw: item.w, sh: item.h,
    };
  }, []);

  // ── Item operations ──────────────────────────────────────────────────────────
  const bringForward = () => {
    if (!selectedId) return;
    setItems((prev) => prev.map((i) => (i.id === selectedId ? { ...i, zIndex: maxZ + 1 } : i)));
  };
  const sendBackward = () => {
    if (!selectedId) return;
    const minZ = Math.min(...items.map((i) => i.zIndex));
    setItems((prev) => prev.map((i) => (i.id === selectedId ? { ...i, zIndex: minZ - 1 } : i)));
  };
  const duplicateSelected = () => {
    if (!selected) return;
    setItems((prev) => [
      ...prev,
      { ...selected, id: uid(), x: selected.x + 14, y: selected.y + 14, zIndex: maxZ + 1 },
    ]);
  };
  const toggleBgRemove = () => {
    if (!selectedId) return;
    setItems((prev) => prev.map((i) => (i.id === selectedId ? { ...i, bgRemoved: !i.bgRemoved } : i)));
  };
  const deleteSelected = () => {
    if (!selectedId) return;
    setItems((prev) => prev.filter((i) => i.id !== selectedId));
    setSelectedId(null);
  };

  function addItemToCanvas(imgSrc) {
    const w = 136, h = Math.round(w * 1.28);
    setItems((prev) => {
      const mz = prev.length ? Math.max(...prev.map((i) => i.zIndex)) : 0;
      return [
        ...prev,
        {
          id:        uid(),
          imgSrc,
          x:         Math.round((CW - w) / 2),
          y:         Math.round((CH - h) / 2),
          w, h,
          zIndex:    mz + 1,
          bgRemoved: false,
        },
      ];
    });
    setActiveTool(null);
  }

  // ── File upload (add photo to canvas) ───────────────────────────────────────
  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const fr = new FileReader();
    fr.onload = (ev) => addItemToCanvas(ev.target.result);
    fr.readAsDataURL(f);
    e.target.value = "";
  }

  // ── Download ─────────────────────────────────────────────────────────────────
  async function handleDownload() {
    const dataUrl = await composeToDataUrl(items, bgColor);
    const a       = document.createElement("a");
    a.href        = dataUrl;
    a.download    = `style-${Date.now()}.jpg`;
    a.click();
  }

  // ── Save ──────────────────────────────────────────────────────────────────────
  async function handleConfirmSave() {
    setSaving(true);
    try {
      const dataUrl = await composeToDataUrl(items, bgColor);
      const colors  = await extractColors(dataUrl, 5);
      const entry   = {
        id:              `coordi-${Date.now()}`,
        title:           styleName.trim() || `${dateStr ?? ""} 스타일`.trim(),
        mood:            null,
        memo:            "",
        isPublic:        false,
        itemIds:         [...initialItemIds],
        thumbnail:       dataUrl,
        bgColor,
        dateStr:         dateStr ?? null,
        photoUrl:        dataUrl,
        extractedColors: colors,
        updatedAt:       new Date().toISOString(),
      };
      saveCoordi(entry);
      onSave?.(entry);
    } finally {
      setSaving(false);
      setShowSave(false);
    }
  }

  // ── Filtered items for picker ─────────────────────────────────────────────────
  const pickerItems = CLOSET_ITEMS.filter(
    (i) => i.image && (catFilter === "전체" || i.mainCategory === catFilter)
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="absolute inset-0 z-[60] flex flex-col bg-white overflow-hidden">

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{ height: 52, borderBottom: `1px solid ${DIVIDER}` }}
      >
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ backgroundColor: "#F2F2F2" }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="text-[16px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>
          내 코디 만들기
        </p>
        <button
          onClick={() => setShowSave(true)}
          className="px-4 py-1.5 rounded-full text-[13px] font-bold"
          style={{ backgroundColor: YELLOW, color: DARK, fontFamily: FONT }}
        >
          저장
        </button>
      </div>

      {/* ── Canvas ── */}
      <div className="flex-1 flex flex-col items-center justify-center overflow-hidden py-3">
        <div
          ref={canvasRef}
          className="relative select-none"
          style={{
            width:           CW,
            height:          CH,
            backgroundColor: bgColor,
            borderRadius:    14,
            overflow:        "hidden",
            boxShadow:       "0 3px 24px rgba(0,0,0,0.13)",
            touchAction:     "none",
            flexShrink:      0,
          }}
          onTouchEnd={onCanvasTouchEnd}
          onTouchCancel={onCanvasTouchEnd}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedId(null); }}
        >
          {/* Item layers */}
          {[...items]
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((item) => {
              const isSel = item.id === selectedId;
              return (
                <div
                  key={item.id}
                  style={{
                    position:  "absolute",
                    left:      item.x,
                    top:       item.y,
                    width:     item.w,
                    height:    item.h,
                    zIndex:    item.zIndex,
                    outline:   isSel ? `2.5px solid ${YELLOW}` : "none",
                    outlineOffset: 1,
                    borderRadius:  3,
                    touchAction:   "none",
                    cursor:        "grab",
                  }}
                  onTouchStart={(e) => onItemTouchStart(e, item.id, "move")}
                  onClick={(e) => { e.stopPropagation(); setSelectedId(item.id); }}
                >
                  <img
                    src={item.imgSrc}
                    alt=""
                    draggable={false}
                    style={{
                      width:         "100%",
                      height:        "100%",
                      objectFit:     "cover",
                      objectPosition:"center top",
                      display:       "block",
                      userSelect:    "none",
                      pointerEvents: "none",
                      /* mix-blend-mode: multiply visually removes white bg */
                      mixBlendMode:  item.bgRemoved ? "multiply" : "normal",
                    }}
                  />
                  {/* Resize handle — bottom-right */}
                  {isSel && (
                    <div
                      style={{
                        position:        "absolute",
                        bottom:          -9,
                        right:           -9,
                        width:           22,
                        height:          22,
                        backgroundColor: YELLOW,
                        border:          "2.5px solid white",
                        borderRadius:    "50%",
                        display:         "flex",
                        alignItems:      "center",
                        justifyContent:  "center",
                        cursor:          "nwse-resize",
                        touchAction:     "none",
                        zIndex:          99,
                      }}
                      onTouchStart={(e) => { e.stopPropagation(); onItemTouchStart(e, item.id, "resize"); }}
                    >
                      <IcoResize />
                    </div>
                  )}
                </div>
              );
            })}

          {/* Empty state hint */}
          {items.length === 0 && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-2"
              style={{ pointerEvents: "none" }}
            >
              <span style={{ fontSize: 40, opacity: 0.15 }}>👗</span>
              <p className="text-[12px]" style={{ color: "#C8C8C8", fontFamily: FONT }}>
                아래에서 아이템을 추가하세요
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Action toolbar (layer/edit ops) ── */}
      <div
        className="shrink-0 flex items-center justify-around px-5 py-2"
        style={{ borderTop: `1px solid ${DIVIDER}`, borderBottom: `1px solid ${DIVIDER}` }}
      >
        {[
          { label: "앞으로",   icon: <IcoForward />,  fn: bringForward },
          { label: "뒤로",     icon: <IcoBack />,     fn: sendBackward },
          { label: "복제",     icon: <IcoCopy />,     fn: duplicateSelected },
          { label: "배경 제거",icon: <IcoEraser />,   fn: toggleBgRemove, accent: selected?.bgRemoved },
          { label: "삭제",     icon: <IcoTrash />,    fn: deleteSelected, danger: true },
        ].map(({ label, icon, fn, accent, danger }) => (
          <button
            key={label}
            onClick={fn}
            disabled={!selected}
            className="flex flex-col items-center gap-1"
            style={{
              opacity:    selected ? 1 : 0.28,
              color:      danger ? "#E84040" : accent ? YELLOW : "#555",
              transition: "opacity 0.15s",
            }}
          >
            <span style={{ display: "flex" }}>{icon}</span>
            <span className="text-[9px] font-medium" style={{ fontFamily: FONT }}>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Bottom toolbar ── */}
      <div className="shrink-0 flex items-center" style={{ height: 70 }}>
        {[
          { id: "items",    label: "내 아이템", Icon: IcoGrid     },
          { id: "upload",   label: "업로드",   Icon: IcoUpload   },
          { id: "bg",       label: "배경",     Icon: IcoBg       },
          { id: "download", label: "다운로드", Icon: IcoDownload },
          { id: "share",    label: "공유",     Icon: IcoShare    },
        ].map(({ id, label, Icon }) => {
          const isActive = activeTool === id;
          return (
            <button
              key={id}
              className="flex-1 flex flex-col items-center justify-center gap-1.5"
              style={{ color: isActive ? YELLOW : "#888" }}
              onClick={() => {
                if (id === "upload")   { fileRef.current?.click(); return; }
                if (id === "download") { handleDownload(); return; }
                if (id === "share")    { return; /* TODO */ }
                setActiveTool(isActive ? null : id);
              }}
            >
              <Icon />
              <span className="text-[10px] font-medium" style={{ fontFamily: FONT }}>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {/* ── Item picker bottom sheet ── */}
      {activeTool === "items" && (
        <div
          className="absolute inset-0 z-20 flex items-end"
          style={{ backgroundColor: "rgba(0,0,0,0.36)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setActiveTool(null); }}
        >
          <div className="w-full rounded-t-3xl bg-white" style={{ maxHeight: "60%", display: "flex", flexDirection: "column" }}>
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "#DDD" }} />
            </div>
            {/* Category filter */}
            <div className="shrink-0 px-4 pb-2">
              <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {CAT_FILTER.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCatFilter(cat)}
                    className="shrink-0 px-3 py-1 rounded-full text-[11px] font-medium"
                    style={{
                      backgroundColor: catFilter === cat ? DARK    : "#F2F2F2",
                      color:           catFilter === cat ? "white" : "#666",
                      fontFamily:      FONT,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-6" style={{ scrollbarWidth: "none" }}>
              <div className="grid grid-cols-4 gap-2">
                {pickerItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addItemToCanvas(item.image)}
                    className="rounded-xl overflow-hidden active:opacity-70"
                    style={{ aspectRatio: "3/4", backgroundColor: "#F5F5F5" }}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Background colour picker ── */}
      {activeTool === "bg" && (
        <div
          className="absolute inset-0 z-20 flex items-end"
          style={{ backgroundColor: "rgba(0,0,0,0.36)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setActiveTool(null); }}
        >
          <div className="w-full rounded-t-3xl bg-white px-5 pt-4 pb-8">
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "#DDD" }} />
            </div>
            <p className="text-[13px] font-bold mb-4" style={{ color: DARK, fontFamily: FONT }}>배경 색상</p>
            <div className="flex flex-wrap gap-4">
              {BG_OPTIONS.map(({ label, value }) => {
                const isActive = bgColor === value;
                return (
                  <button
                    key={value}
                    onClick={() => { setBgColor(value); setActiveTool(null); }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div
                      className="rounded-full"
                      style={{
                        width:       42,
                        height:      42,
                        backgroundColor: value,
                        border:      isActive ? `3px solid ${YELLOW}` : "2px solid #E0E0E0",
                        boxShadow:   isActive ? `0 0 0 2px ${YELLOW}` : "none",
                      }}
                    />
                    <span className="text-[9px]" style={{ color: "#888", fontFamily: FONT }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Save sheet ── */}
      {showSave && (
        <div
          className="absolute inset-0 z-30 flex items-end"
          style={{ backgroundColor: "rgba(0,0,0,0.48)" }}
        >
          <div className="w-full rounded-t-3xl bg-white px-5 pt-4 pb-8">
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "#DDD" }} />
            </div>
            <p className="text-[15px] font-bold mb-1" style={{ color: DARK, fontFamily: FONT }}>스타일 저장하기</p>
            <p className="text-[12px] mb-4" style={{ color: "#AAAAAA", fontFamily: FONT }}>
              캔버스 이미지가 스타일북에 저장돼요
            </p>
            <input
              type="text"
              value={styleName}
              onChange={(e) => setStyleName(e.target.value)}
              placeholder="스타일 이름 (선택)"
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none mb-4"
              style={{ backgroundColor: "#F5F5F5", color: DARK, fontFamily: FONT }}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowSave(false)}
                className="flex-1 h-12 rounded-xl text-[14px] font-medium"
                style={{ backgroundColor: "#F5F5F5", color: "#888", fontFamily: FONT }}
              >
                취소
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={saving}
                className="flex-1 h-12 rounded-xl text-[14px] font-bold"
                style={{
                  backgroundColor: saving ? "#E8E8E8" : YELLOW,
                  color:           saving ? "#AAAAAA" : DARK,
                  fontFamily:      FONT,
                }}
              >
                {saving ? "저장 중..." : "저장하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
