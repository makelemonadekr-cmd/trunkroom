import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { saveCoordi } from "../../lib/coordiStore";
import { CLOSET_ITEMS } from "../../constants/mockClosetData";
import { compressImage, validateImageFile, fitDimensions, buildDataUrl } from "../../lib/imageUtils";

const FONT = "'Spoqa Han Sans Neo', sans-serif";
const DARK = "#1a1a1a";
const YELLOW = "#F5C200";
const LIGHT = "#F5F5F5";
const DIVIDER = "#F0F0F0";
const GRAY = "#888";
const RED = "#E84040";

const BG_PRESETS = ["#FFFFFF", "#F5F5F5", "#F5EED5", "#1a1a1a", "#2A3A4A", "#4A2A3A", "#FAFAFA", "#E8E0D5"];
const CATEGORIES = ["전체", "상의", "하의", "아우터", "원피스", "신발", "가방", "액세서리"];

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M12.5 4L7 10L12.5 16" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function ItemOnCanvas({ item, isSelected }) {
  return (
    <div
      data-item-id={item.id}
      style={{
        position: "absolute",
        left: item.x - item.width / 2,
        top: item.y - item.height / 2,
        width: item.width,
        height: item.height,
        transform: `rotate(${item.rotation}deg)`,
        transformOrigin: "center center",
        zIndex: item.zIndex,
        outline: isSelected ? "2px solid #F5C200" : "none",
        outlineOffset: 2,
        cursor: "grab",
        userSelect: "none",
        touchAction: "none",
      }}
    >
      <img
        src={item.imageUrl}
        style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none", userSelect: "none", display: "block" }}
        crossOrigin="anonymous"
        draggable={false}
        alt=""
      />
    </div>
  );
}

function ItemPickerSheet({ onClose, onSelectItem }) {
  const [catFilter, setCatFilter] = useState("전체");
  const filtered = catFilter === "전체"
    ? CLOSET_ITEMS
    : CLOSET_ITEMS.filter((item) => (item.mainCategory ?? item.category) === catFilter);

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl flex flex-col" style={{ maxHeight: "70%" }}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
          <p className="text-[15px] font-bold" style={{ color: DARK, fontFamily: FONT }}>내 아이템</p>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3L13 13M13 3L3 13" stroke={DARK} strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex overflow-x-auto px-4 gap-2 py-3 shrink-0" style={{ scrollbarWidth: "none" }}>
          {CATEGORIES.map((c) => {
            const active = catFilter === c;
            return (
              <button key={c} onClick={() => setCatFilter(c)}
                className="shrink-0 px-3 py-1.5 rounded-full text-[12px]"
                style={{
                  backgroundColor: active ? DARK : "#F2F2F2",
                  color: active ? "white" : "#555",
                  fontFamily: FONT,
                  fontWeight: active ? 700 : 500,
                }}>
                {c}
              </button>
            );
          })}
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4" style={{ scrollbarWidth: "none" }}>
          {filtered.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-[13px]" style={{ color: GRAY, fontFamily: FONT }}>아이템이 없어요</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {filtered.map((item) => (
                <button key={item.id} onClick={() => onSelectItem(item)}
                  className="rounded-xl overflow-hidden"
                  style={{ aspectRatio: "1", backgroundColor: "#F5F5F5", border: `1px solid ${DIVIDER}` }}>
                  <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BackgroundSheet({ bgColor, onSelectColor, onUploadBg, onClearBg, onClose }) {
  const bgFileRef = useRef(null);
  return (
    <div className="absolute inset-0 z-30 flex flex-col" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl">
        <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
          <p className="text-[15px] font-bold" style={{ color: DARK, fontFamily: FONT }}>배경</p>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3L13 13M13 3L3 13" stroke={DARK} strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-4 py-4">
          <p className="text-[11px] font-bold mb-2" style={{ color: GRAY, fontFamily: FONT }}>배경 색상</p>
          <div className="flex gap-2 flex-wrap mb-5">
            {BG_PRESETS.map((c) => (
              <button key={c} onClick={() => onSelectColor(c)}
                style={{
                  width: 40, height: 40, borderRadius: "50%", backgroundColor: c,
                  border: bgColor === c ? `3px solid ${YELLOW}` : `1px solid ${DIVIDER}`,
                }} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => bgFileRef.current?.click()} className="flex-1 py-3 rounded-xl text-[13px] font-bold" style={{ backgroundColor: DARK, color: "white", fontFamily: FONT }}>
              배경 이미지 업로드
            </button>
            <button onClick={onClearBg} className="flex-1 py-3 rounded-xl text-[13px] font-bold" style={{ backgroundColor: LIGHT, color: DARK, fontFamily: FONT }}>
              배경 이미지 제거
            </button>
          </div>
          <input ref={bgFileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const reader = new FileReader();
              reader.onload = (ev) => onUploadBg(ev.target.result);
              reader.readAsDataURL(f);
              e.target.value = "";
            }} />
        </div>
      </div>
    </div>
  );
}

function SaveSheet({ initialTitle, onClose, onSave, isSaving }) {
  const [title, setTitle] = useState(initialTitle || "");
  return (
    <div className="absolute inset-0 z-30 flex flex-col" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl px-5 pt-5 pb-8">
        <p className="text-[15px] font-bold mb-3 text-center" style={{ color: DARK, fontFamily: FONT }}>코디 저장</p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="코디 제목 (선택)"
          className="w-full px-4 py-3 rounded-xl text-[14px] mb-4"
          style={{ backgroundColor: LIGHT, fontFamily: FONT, color: DARK, border: "none", outline: "none" }}
        />
        <div className="flex gap-3">
          <button onClick={onClose} disabled={isSaving} className="flex-1 h-12 rounded-xl text-[14px] font-medium" style={{ backgroundColor: LIGHT, color: GRAY, fontFamily: FONT }}>
            취소
          </button>
          <button onClick={() => onSave(title)} disabled={isSaving} className="flex-1 h-12 rounded-xl text-[14px] font-bold" style={{ backgroundColor: YELLOW, color: DARK, fontFamily: FONT, opacity: isSaving ? 0.6 : 1 }}>
            {isSaving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CoordiEditorPage({ coordi, onClose, onSaved }) {
  const [items, setItems] = useState(coordi?.items ?? []);
  const [selectedId, setSelectedId] = useState(null);
  const [bgColor, setBgColor] = useState(coordi?.bgColor ?? "#FFFFFF");
  const [bgImage, setBgImage] = useState(coordi?.bgImage ?? null);
  const [activeSheet, setActiveSheet] = useState(null); // null | 'items' | 'bg' | 'save'
  const [hasChanges, setHasChanges] = useState(false);
  const [toast, setToast] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);

  const canvasRef = useRef(null);
  const gestureRef = useRef({ type: null });
  const fileInputRef = useRef(null);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  function updateItem(id, changes) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...changes } : item)));
    setHasChanges(true);
  }

  function getItemAtTouch(touch) {
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    return el?.closest("[data-item-id]")?.dataset.itemId ?? null;
  }

  function handleCanvasTouchStart(e) {
    const touches = e.touches;
    if (touches.length === 1) {
      const itemId = getItemAtTouch(touches[0]);
      if (itemId) {
        setSelectedId(itemId);
        const item = items.find((i) => i.id === itemId);
        if (!item) return;
        gestureRef.current = {
          type: "drag",
          itemId,
          startClientX: touches[0].clientX,
          startClientY: touches[0].clientY,
          startItemX: item.x,
          startItemY: item.y,
        };
      } else {
        setSelectedId(null);
        gestureRef.current = { type: null };
      }
    } else if (touches.length === 2 && selectedId) {
      const item = items.find((i) => i.id === selectedId);
      if (!item) return;
      const dx = touches[1].clientX - touches[0].clientX;
      const dy = touches[1].clientY - touches[0].clientY;
      gestureRef.current = {
        type: "transform",
        itemId: selectedId,
        startDist: Math.hypot(dx, dy),
        startAngle: Math.atan2(dy, dx),
        startWidth: item.width,
        startHeight: item.height,
        startRotation: item.rotation,
      };
    }
  }

  function handleCanvasTouchMove(e) {
    const g = gestureRef.current;
    if (!g.type) return;
    if (g.type === "drag" && e.touches.length >= 1) {
      const t = e.touches[0];
      const dx = t.clientX - g.startClientX;
      const dy = t.clientY - g.startClientY;
      updateItem(g.itemId, { x: g.startItemX + dx, y: g.startItemY + dy });
    } else if (g.type === "transform" && e.touches.length >= 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      const currentDist = Math.hypot(dx, dy);
      const currentAngle = Math.atan2(dy, dx);
      const scale = currentDist / g.startDist;
      const rotDelta = (currentAngle - g.startAngle) * (180 / Math.PI);
      updateItem(g.itemId, {
        width: Math.max(40, g.startWidth * scale),
        height: Math.max(40, g.startHeight * scale),
        rotation: g.startRotation + rotDelta,
      });
    }
  }

  function handleCanvasTouchEnd() {
    gestureRef.current = { type: null };
  }

  // Attach non-passive touch listeners
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ts = (e) => { e.preventDefault(); handleCanvasTouchStart(e); };
    const tm = (e) => { e.preventDefault(); handleCanvasTouchMove(e); };
    const te = (e) => { e.preventDefault(); handleCanvasTouchEnd(e); };
    el.addEventListener("touchstart", ts, { passive: false });
    el.addEventListener("touchmove", tm, { passive: false });
    el.addEventListener("touchend", te, { passive: false });
    el.addEventListener("touchcancel", te, { passive: false });
    return () => {
      el.removeEventListener("touchstart", ts);
      el.removeEventListener("touchmove", tm);
      el.removeEventListener("touchend", te);
      el.removeEventListener("touchcancel", te);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, selectedId]);

  // ── Item actions ────────────────────────────────────────────────────────────

  function bringForward() {
    if (!selectedId) return;
    setItems((prev) => {
      const maxZ = Math.max(...prev.map((i) => i.zIndex), 0);
      return prev.map((i) => (i.id === selectedId ? { ...i, zIndex: maxZ + 1 } : i));
    });
    setHasChanges(true);
  }
  function sendBackward() {
    if (!selectedId) return;
    setItems((prev) => prev.map((i) => (i.id === selectedId ? { ...i, zIndex: Math.max(1, i.zIndex - 1) } : i)));
    setHasChanges(true);
  }
  function duplicateItem() {
    if (!selectedId) return;
    const item = items.find((i) => i.id === selectedId);
    if (!item) return;
    const maxZ = Math.max(...items.map((i) => i.zIndex), 0);
    const newItem = { ...item, id: Date.now().toString(), x: item.x + 20, y: item.y + 20, zIndex: maxZ + 1 };
    setItems((prev) => [...prev, newItem]);
    setSelectedId(newItem.id);
    setHasChanges(true);
  }
  function deleteSelectedItem() {
    if (!selectedId) return;
    setItems((prev) => prev.filter((i) => i.id !== selectedId));
    setSelectedId(null);
    setHasChanges(true);
  }

  async function removeBackgroundOfSelected() {
    if (!selectedId) return;
    const item = items.find((i) => i.id === selectedId);
    if (!item) return;
    setRemovingBg(true);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = item.imageUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const brightness = (r + g + b) / 3;
        if (brightness > 230 && Math.max(r, g, b) - Math.min(r, g, b) < 30) {
          data[i + 3] = 0;
        } else if (brightness > 200 && Math.max(r, g, b) - Math.min(r, g, b) < 50) {
          data[i + 3] = Math.floor((255 - brightness) * 2);
        }
      }
      ctx.putImageData(imageData, 0, 0);
      const newUrl = canvas.toDataURL("image/png");
      updateItem(item.id, { imageUrl: newUrl });
      showToast("배경이 제거되었어요");
    } catch (e) {
      alert("배경 제거에 실패했어요. 다시 시도해주세요.");
    } finally {
      setRemovingBg(false);
    }
  }

  // ── File upload ─────────────────────────────────────────────────────────────

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    // Validate
    const { valid, error: fileError } = validateImageFile(file);
    if (!valid) { alert(fileError); return; }

    try {
      // Compress large uploads before adding to canvas
      const { dataUrl, width: srcW, height: srcH } = await compressImage(file, {
        maxDim: 1600, quality: 0.88,
      });
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const { width: w, height: h } = fitDimensions(srcW, srcH, rect.width, rect.height, 0.48);
      const maxZ = Math.max(...items.map((i) => i.zIndex), 0);
      const newItem = {
        id: Date.now().toString(),
        imageUrl: dataUrl,
        x: rect.width / 2,
        y: rect.height / 2,
        width: w,
        height: h,
        rotation: 0,
        zIndex: maxZ + 1,
      };
      setItems((prev) => [...prev, newItem]);
      setSelectedId(newItem.id);
      setHasChanges(true);
    } catch {
      alert("이미지를 불러올 수 없어요. 다른 파일을 선택해 주세요.");
    }
  }

  async function addItemFromCloset(item) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Load image to get natural dimensions for proper aspect ratio
    let w, h;
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = item.image; });
      const dims = fitDimensions(img.naturalWidth, img.naturalHeight, rect.width, rect.height, 0.45);
      w = dims.width; h = dims.height;
    } catch {
      // Fallback to square if image fails to load
      const side = Math.min(rect.width, rect.height) * 0.42;
      w = side; h = side;
    }

    const maxZ = Math.max(...items.map((i) => i.zIndex), 0);
    const newItem = {
      id: Date.now().toString(),
      imageUrl: item.image,
      x: rect.width / 2,
      y: rect.height / 2,
      width: w,
      height: h,
      rotation: 0,
      zIndex: maxZ + 1,
    };
    setItems((prev) => [...prev, newItem]);
    setSelectedId(newItem.id);
    setHasChanges(true);
    setActiveSheet(null);
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  async function exportCanvas() {
    const result = await html2canvas(canvasRef.current, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: bgColor,
      scale: 2,
      logging: false,
    });
    return result.toDataURL("image/png");
  }

  async function exportAndDownload() {
    setIsExporting(true);
    try {
      const dataUrl = await exportCanvas();
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `trunkroom-codi-${Date.now()}.png`;
      a.click();
      showToast("다운로드되었어요 ✓");
    } catch (e) {
      alert("다운로드에 실패했어요.");
    } finally {
      setIsExporting(false);
    }
  }

  async function shareImage() {
    setIsExporting(true);
    try {
      const dataUrl = await exportCanvas();
      if (navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "trunkroom-codi.png", { type: "image/png" });
        await navigator.share({ title: "내 코디", files: [file] });
      } else {
        // Fallback: download
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `trunkroom-codi-${Date.now()}.png`;
        a.click();
        showToast("다운로드되었어요 ✓");
      }
    } catch (e) {
      if (e.name !== "AbortError") alert("공유에 실패했어요.");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleSaveCoordi(title) {
    setIsSaving(true);
    try {
      const thumbnail = await exportCanvas();
      const coordiData = {
        id: coordi?.id ?? Date.now().toString(),
        title: title || `코디 ${new Date().toLocaleDateString("ko-KR")}`,
        thumbnail,
        items: items.map((item) => ({ ...item })),
        bgColor,
        bgImage,
        createdAt: coordi?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      };
      saveCoordi(coordiData);
      setHasChanges(false);
      setActiveSheet(null);
      showToast("저장되었어요 ✓");
      onSaved?.(coordiData);
    } catch (e) {
      alert("저장에 실패했어요.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleBack() {
    if (hasChanges) {
      if (window.confirm("저장하지 않은 변경사항이 있어요. 나가시겠어요?")) {
        onClose?.();
      }
    } else {
      onClose?.();
    }
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 h-14 bg-white" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
        <button onClick={handleBack} className="w-9 h-9 flex items-center justify-center"><BackIcon /></button>
        <h2 style={{ color: DARK, fontFamily: FONT, fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em" }}>
          {coordi ? "코디 수정" : "내 코디 만들기"}
        </h2>
        <button onClick={() => setActiveSheet("save")} className="px-3 py-1.5 rounded-full" style={{ backgroundColor: YELLOW }}>
          <span style={{ color: DARK, fontFamily: FONT, fontSize: 12, fontWeight: 700 }}>저장</span>
        </button>
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {/* Canvas (square) */}
        <div
          ref={canvasRef}
          style={{
            position: "relative",
            width: "100%",
            paddingBottom: "100%",
            overflow: "hidden",
            backgroundColor: bgColor,
            backgroundImage: bgImage ? `url(${bgImage})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
            touchAction: "none",
          }}
        >
          <div style={{ position: "absolute", inset: 0 }}>
            {[...items].sort((a, b) => a.zIndex - b.zIndex).map((item) => (
              <ItemOnCanvas key={item.id} item={item} isSelected={selectedId === item.id} />
            ))}
            {/* Empty state */}
            {items.length === 0 && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <span style={{ fontSize: 48, opacity: 0.3 }}>👗</span>
                <p style={{ color: "#CCCCCC", fontFamily: FONT, fontSize: 13, marginTop: 12, textAlign: "center", whiteSpace: "pre-line" }}>
                  {"내 아이템을 불러오거나\n사진을 업로드해서\n코디를 시작해보세요"}
                </p>
              </div>
            )}
            {/* Watermark */}
            <div style={{ position: "absolute", bottom: 8, right: 8, opacity: 0.35, pointerEvents: "none" }}>
              <img src="/officiallogo.png" alt="" style={{ width: 28, height: 28, objectFit: "contain" }} />
            </div>
          </div>
        </div>

        {/* Floating item toolbar (below canvas) */}
        {selectedId && (
          <div className="flex items-center justify-around px-3 py-2.5 bg-white" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
            <IconBtn label="앞으로" onClick={bringForward}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 14V4M5 8L9 4L13 8" stroke={DARK} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </IconBtn>
            <IconBtn label="뒤로" onClick={sendBackward}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 4V14M5 10L9 14L13 10" stroke={DARK} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </IconBtn>
            <IconBtn label="복제" onClick={duplicateItem}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="5" width="9" height="9" rx="1.5" stroke={DARK} strokeWidth="1.4"/><rect x="6" y="2" width="9" height="9" rx="1.5" stroke={DARK} strokeWidth="1.4"/></svg>
            </IconBtn>
            <IconBtn label={removingBg ? "제거 중" : "배경 제거"} onClick={removeBackgroundOfSelected} disabled={removingBg}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 3L15 15M3 15L15 3" stroke={DARK} strokeWidth="1.4" strokeLinecap="round"/><rect x="2.5" y="2.5" width="13" height="13" rx="2" stroke={DARK} strokeWidth="1.2"/></svg>
            </IconBtn>
            <IconBtn label="삭제" danger onClick={deleteSelectedItem}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 5H15M6 5V3.5C6 3.22 6.22 3 6.5 3H11.5C11.78 3 12 3.22 12 3.5V5M7 8V13M11 8V13M4.5 5L5.5 15H12.5L13.5 5" stroke={RED} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </IconBtn>
          </div>
        )}

        {/* Spacer */}
        <div style={{ height: 120 }} />
      </div>

      {/* Bottom toolbar */}
      <div className="shrink-0 bg-white" style={{ borderTop: `1px solid ${DIVIDER}` }}>
        <div className="flex items-center justify-around px-2 py-2.5">
          <ToolbarBtn label="내 아이템" onClick={() => setActiveSheet("items")}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="6" height="6" rx="1.2" stroke={DARK} strokeWidth="1.4"/><rect x="11" y="3" width="6" height="6" rx="1.2" stroke={DARK} strokeWidth="1.4"/><rect x="3" y="11" width="6" height="6" rx="1.2" stroke={DARK} strokeWidth="1.4"/><rect x="11" y="11" width="6" height="6" rx="1.2" stroke={DARK} strokeWidth="1.4"/></svg>
          </ToolbarBtn>
          <ToolbarBtn label="업로드" onClick={() => fileInputRef.current?.click()}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3V13M6 7L10 3L14 7" stroke={DARK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 14V16C3 16.55 3.45 17 4 17H16C16.55 17 17 16.55 17 16V14" stroke={DARK} strokeWidth="1.5" strokeLinecap="round"/></svg>
          </ToolbarBtn>
          <ToolbarBtn label="배경" onClick={() => setActiveSheet("bg")}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="2" stroke={DARK} strokeWidth="1.4"/><path d="M3 13L7 9L11 13L14 10L17 13" stroke={DARK} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="7" cy="7" r="1.2" fill={DARK}/></svg>
          </ToolbarBtn>
          <ToolbarBtn label="다운로드" onClick={exportAndDownload} disabled={isExporting}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3V13M6 9L10 13L14 9" stroke={DARK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 15V17H17V15" stroke={DARK} strokeWidth="1.5" strokeLinecap="round"/></svg>
          </ToolbarBtn>
          <ToolbarBtn label="공유" onClick={shareImage} disabled={isExporting}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="5" cy="10" r="2.3" stroke={DARK} strokeWidth="1.4"/><circle cx="15" cy="5" r="2.3" stroke={DARK} strokeWidth="1.4"/><circle cx="15" cy="15" r="2.3" stroke={DARK} strokeWidth="1.4"/><path d="M7 9L13 6M7 11L13 14" stroke={DARK} strokeWidth="1.3"/></svg>
          </ToolbarBtn>
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileUpload} />

      {/* Sheets */}
      {activeSheet === "items" && (
        <ItemPickerSheet onClose={() => setActiveSheet(null)} onSelectItem={addItemFromCloset} />
      )}
      {activeSheet === "bg" && (
        <BackgroundSheet
          bgColor={bgColor}
          onSelectColor={(c) => { setBgColor(c); setHasChanges(true); }}
          onUploadBg={(url) => { setBgImage(url); setHasChanges(true); }}
          onClearBg={() => { setBgImage(null); setHasChanges(true); }}
          onClose={() => setActiveSheet(null)}
        />
      )}
      {activeSheet === "save" && (
        <SaveSheet
          initialTitle={coordi?.title || ""}
          onClose={() => setActiveSheet(null)}
          onSave={handleSaveCoordi}
          isSaving={isSaving}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="absolute bottom-24 left-0 right-0 flex justify-center z-50 pointer-events-none">
          <div className="px-4 py-2.5 rounded-full" style={{ backgroundColor: DARK }}>
            <p className="text-white text-[13px] font-medium" style={{ fontFamily: FONT }}>{toast}</p>
          </div>
        </div>
      )}

      {/* Exporting overlay */}
      {(isExporting || isSaving) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
          <div className="px-5 py-4 rounded-2xl bg-white">
            <p className="text-[13px] font-bold" style={{ color: DARK, fontFamily: FONT }}>
              {isSaving ? "저장 중..." : "내보내는 중..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function IconBtn({ children, label, onClick, disabled, danger }) {
  return (
    <button onClick={onClick} disabled={disabled} className="flex flex-col items-center gap-0.5 px-2 py-1 active:opacity-60" style={{ opacity: disabled ? 0.5 : 1 }}>
      {children}
      <span className="text-[10px]" style={{ color: danger ? RED : DARK, fontFamily: FONT, fontWeight: 500 }}>{label}</span>
    </button>
  );
}

function ToolbarBtn({ children, label, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} className="flex flex-col items-center gap-1 px-2 active:opacity-60" style={{ opacity: disabled ? 0.5 : 1 }}>
      {children}
      <span className="text-[10px]" style={{ color: DARK, fontFamily: FONT, fontWeight: 500 }}>{label}</span>
    </button>
  );
}
