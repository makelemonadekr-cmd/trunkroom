/**
 * StylebookTemplateEditor.jsx
 *
 * Interactive 4:5 stylebook card editor.
 * Each item box: drag · pinch-scale · twist-rotate · delete (×)
 * When selected, a floating action bar appears inside the canvas:
 *   [뒤로] [앞으로] [배경 제거]
 *
 * Props:
 *   photoUrl          string | null
 *   items             ClosetItem[]
 *   layerOrders       number[]          optional z-order per item (0 = bottom)
 *   width             number            container px  (height = width × 1.25)
 *   onTransformsChange(transforms[])
 *   onDeleteItem(idx)
 *   onSelectionChange(idx | null)
 *   onBringForward(idx)
 *   onSendBackward(idx)
 *   onRemoveBg(idx)
 *   bgRemoving        boolean
 *   bgRemoveError     string | null
 */

import { useState, useRef, useCallback, useEffect } from "react";

const FONT   = "'Spoqa Han Sans Neo', sans-serif";
const YELLOW = "#F5C200";

// ─── Slot configs ──────────────────────────────────────────────────────────────
const SLOT_CONFIGS = {
  1: [{ right: '5%', top: '30%', width: '42%', height: '35%' }],
  2: [
    { left: '3%',  top: '25%', width: '42%', height: '32%' },
    { right: '3%', top: '25%', width: '42%', height: '32%' },
  ],
  3: [
    { left: '3%',  top: '22%', width: '42%', height: '38%' },
    { right: '3%', top: '5%',  width: '42%', height: '27%' },
    { right: '3%', top: '37%', width: '42%', height: '27%' },
  ],
  4: [
    { left: '3%',  top: '7%',  width: '42%', height: '27%' },
    { left: '3%',  top: '40%', width: '42%', height: '27%' },
    { right: '3%', top: '7%',  width: '42%', height: '27%' },
    { right: '3%', top: '40%', width: '42%', height: '27%' },
  ],
  5: [
    { left: '3%',  top: '6%',  width: '42%', height: '27%' },
    { left: '3%',  top: '59%', width: '42%', height: '27%' },
    { right: '3%', top: '5%',  width: '42%', height: '24%' },
    { right: '3%', top: '34%', width: '42%', height: '24%' },
    { right: '3%', top: '64%', width: '42%', height: '24%' },
  ],
  6: [
    { left: '3%',  top: '4%',  width: '42%', height: '23%' },
    { left: '3%',  top: '32%', width: '42%', height: '23%' },
    { left: '3%',  top: '61%', width: '42%', height: '23%' },
    { right: '3%', top: '4%',  width: '42%', height: '23%' },
    { right: '3%', top: '32%', width: '42%', height: '23%' },
    { right: '3%', top: '61%', width: '42%', height: '23%' },
  ],
};

function pct(str) { return parseFloat(str) / 100; }
function computeRects(slots, W, H) {
  return slots.map((slot) => {
    const w = W * pct(slot.width);
    const h = H * pct(slot.height);
    const y = H * pct(slot.top);
    const x = slot.left !== undefined
      ? W * pct(slot.left)
      : W * (1 - pct(slot.right)) - w;
    return { x, y, w, h };
  });
}

// ─── Single item box ──────────────────────────────────────────────────────────
function ItemBox({ item, rect, transform, baseZIndex = 1, isSelected, onSelect, onUpdate, onDelete }) {
  const { dx = 0, dy = 0, scale = 1, rotation = 0 } = transform;
  const gestureRef = useRef(null);

  function handleTouchStart(e) {
    e.stopPropagation();
    onSelect();
    const t = e.touches;
    if (t.length === 1) {
      gestureRef.current = { mode: "drag", tx0: t[0].clientX, ty0: t[0].clientY, dx0: dx, dy0: dy };
    } else if (t.length >= 2) {
      const ddx = t[1].clientX - t[0].clientX;
      const ddy = t[1].clientY - t[0].clientY;
      gestureRef.current = {
        mode: "pinch",
        dist0: Math.hypot(ddx, ddy), angle0: Math.atan2(ddy, ddx),
        mx0: (t[0].clientX + t[1].clientX) / 2, my0: (t[0].clientY + t[1].clientY) / 2,
        dx0: dx, dy0: dy, scale0: scale, rot0: rotation,
      };
    }
  }

  function handleTouchMove(e) {
    e.stopPropagation();
    const g = gestureRef.current;
    if (!g) return;
    const t = e.touches;

    // If a second finger appeared while we were in drag mode (e.g. second finger
    // landed outside the item box so handleTouchStart didn't see it), upgrade to pinch.
    if (g.mode === "drag" && t.length >= 2) {
      const ddx = t[1].clientX - t[0].clientX;
      const ddy = t[1].clientY - t[0].clientY;
      gestureRef.current = {
        mode:   "pinch",
        dist0:  Math.hypot(ddx, ddy),
        angle0: Math.atan2(ddy, ddx),
        mx0:    (t[0].clientX + t[1].clientX) / 2,
        my0:    (t[0].clientY + t[1].clientY) / 2,
        dx0: dx, dy0: dy, scale0: scale, rot0: rotation,
      };
      return;
    }

    if (g.mode === "drag" && t.length >= 1) {
      onUpdate({ dx: g.dx0 + (t[0].clientX - g.tx0), dy: g.dy0 + (t[0].clientY - g.ty0), scale, rotation });
    } else if (g.mode === "pinch" && t.length >= 2) {
      const ddx = t[1].clientX - t[0].clientX;
      const ddy = t[1].clientY - t[0].clientY;
      onUpdate({
        dx: g.dx0 + ((t[0].clientX + t[1].clientX) / 2 - g.mx0),
        dy: g.dy0 + ((t[0].clientY + t[1].clientY) / 2 - g.my0),
        scale:    Math.max(0.25, Math.min(3.5, g.scale0 * (Math.hypot(ddx, ddy) / g.dist0))),
        rotation: g.rot0 + (Math.atan2(ddy, ddx) - g.angle0) * (180 / Math.PI),
      });
    } else if (g.mode === "pinch" && t.length === 1) {
      // One finger lifted — downgrade to drag from current position
      gestureRef.current = { mode: "drag", tx0: t[0].clientX, ty0: t[0].clientY, dx0: dx, dy0: dy };
    }
  }

  function handleTouchEnd() { gestureRef.current = null; }

  const mouseRef = useRef(null);
  function handleMouseDown(e) {
    e.stopPropagation();
    onSelect();
    mouseRef.current = { mx0: e.clientX, my0: e.clientY, dx0: dx, dy0: dy };
    function onMove(ev) {
      const m = mouseRef.current;
      if (!m) return;
      onUpdate({ dx: m.dx0 + (ev.clientX - m.mx0), dy: m.dy0 + (ev.clientY - m.my0), scale, rotation });
    }
    function onUp() {
      mouseRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}   /* prevent synthetic click from bubbling to canvas */
      style={{
        position:        "absolute",
        left:            rect.x,
        top:             rect.y,
        width:           rect.w,
        height:          rect.h,
        transform:       `translate(${dx}px,${dy}px) scale(${scale}) rotate(${rotation}deg)`,
        transformOrigin: "center center",
        backgroundColor: "rgba(255,255,255,0.96)",
        borderRadius:    10,
        overflow:        "visible",
        boxShadow:       isSelected
          ? `0 0 0 2.5px ${YELLOW}, 0 4px 18px rgba(0,0,0,0.22)`
          : "0 3px 14px rgba(0,0,0,0.18)",
        border:          isSelected ? "none" : "1.5px solid rgba(255,255,255,0.85)",
        touchAction:     "none",
        userSelect:      "none",
        cursor:          "grab",
        zIndex:          isSelected ? 50 : baseZIndex,
        willChange:      "transform",
      }}
    >
      {/* Image content */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {item.image ? (
          <img src={item.image} alt={item.displayName ?? item.name ?? ""}
            style={{ width: "100%", height: "100%", objectFit: "contain", padding: "8%", pointerEvents: "none", draggable: false }} />
        ) : (
          <span style={{ fontSize: 20, opacity: 0.3 }}>👗</span>
        )}
      </div>

      {/* Corner handles */}
      {isSelected && [
        { top: -4, left: -4 }, { top: -4, right: -4 },
        { bottom: -4, left: -4 }, { bottom: -4, right: -4 },
      ].map((pos, i) => (
        <div key={i} style={{ position: "absolute", ...pos, width: 10, height: 10, borderRadius: 3, backgroundColor: YELLOW, border: "1.5px solid white", pointerEvents: "none", zIndex: 11 }} />
      ))}

      {/* Delete × */}
      {isSelected && (
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => { e.stopPropagation(); onDelete(); }}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{ position: "absolute", top: -10, right: -10, width: 22, height: 22, borderRadius: "50%", backgroundColor: "#FF3B30", border: "2.5px solid white", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 13, cursor: "pointer", touchAction: "none" }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 1L7 7M7 1L1 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function StylebookTemplateEditor({
  photoUrl = null,
  items = [],
  layerOrders = null,
  width = 280,
  onTransformsChange,
  onDeleteItem,
  onSelectionChange,
  onBringForward,
  onSendBackward,
  onRemoveBg,
  bgRemoving = false,
  bgRemoveError = null,
}) {
  const height = Math.round(width * 1.25);
  const count  = Math.max(1, Math.min(6, items.length));
  const slots  = SLOT_CONFIGS[count] ?? SLOT_CONFIGS[6];
  const rects  = computeRects(slots.slice(0, items.length), width, height);

  const [transforms, setTransforms] = useState(() =>
    items.map(() => ({ dx: 0, dy: 0, scale: 1, rotation: 0 }))
  );
  const [selectedIdx, setSelectedIdx] = useState(null);

  // Sync transforms when items are added externally
  useEffect(() => {
    setTransforms((prev) => {
      if (prev.length === items.length) return prev;
      if (prev.length > items.length) return prev.slice(0, items.length);
      const extra = Array(items.length - prev.length).fill(null).map(() => ({ dx: 0, dy: 0, scale: 1, rotation: 0 }));
      return [...prev, ...extra];
    });
  }, [items.length]);

  const updateTransform = useCallback((idx, next) => {
    setTransforms((prev) => {
      const updated = prev.map((t, i) => (i === idx ? { ...t, ...next } : t));
      onTransformsChange?.(updated);
      return updated;
    });
  }, [onTransformsChange]);

  const handleDeleteItem = useCallback((idx) => {
    setTransforms((prev) => prev.filter((_, i) => i !== idx));
    setSelectedIdx(null);
    onSelectionChange?.(null);
    onDeleteItem?.(idx);
  }, [onDeleteItem, onSelectionChange]);

  function deselect() { setSelectedIdx(null); onSelectionChange?.(null); }

  // Layer info for selected item
  const selLayer    = selectedIdx !== null ? (layerOrders?.[selectedIdx] ?? selectedIdx) : 0;
  const canGoBack   = selectedIdx !== null && selLayer > 0;
  const canGoFront  = selectedIdx !== null && selLayer < items.length - 1;

  return (
    <div
      style={{ position: "relative", width, height, borderRadius: 14, overflow: "hidden", backgroundColor: "#D8D8D8", flexShrink: 0, touchAction: "none" }}
      onClick={deselect}
    >
      {/* Background photo */}
      {photoUrl ? (
        <img src={photoUrl} alt="outfit"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", pointerEvents: "none" }} />
      ) : (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <rect x="2" y="5" width="26" height="20" rx="3" stroke="#BBBBBB" strokeWidth="1.8" />
            <circle cx="15" cy="15" r="5" stroke="#BBBBBB" strokeWidth="1.8" />
            <path d="M11 5L13 2H17L19 5" stroke="#BBBBBB" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <p style={{ fontSize: 9, color: "#BBBBBB", fontFamily: FONT }}>배경 사진을 추가하세요</p>
        </div>
      )}

      {/* Item boxes */}
      {items.map((item, i) =>
        rects[i] ? (
          <ItemBox
            key={item.id ?? i}
            item={item}
            rect={rects[i]}
            transform={transforms[i] ?? { dx: 0, dy: 0, scale: 1, rotation: 0 }}
            baseZIndex={(layerOrders?.[i] ?? i) + 1}
            isSelected={selectedIdx === i}
            onSelect={() => { setSelectedIdx(i); onSelectionChange?.(i); }}
            onUpdate={(t) => updateTransform(i, t)}
            onDelete={() => handleDeleteItem(i)}
          />
        ) : null
      )}

      {/* ── Bottom overlay: floating action bar or hint ── */}
      <div
        style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, pointerEvents: "none", zIndex: 30 }}
      >
        {selectedIdx !== null ? (
          <>
            {/* Action bar */}
            <div
              style={{ display: "flex", alignItems: "stretch", backgroundColor: "rgba(18,18,18,0.90)", backdropFilter: "blur(14px)", borderRadius: 22, overflow: "hidden", pointerEvents: "auto" }}
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {/* 뒤로 */}
              <button
                onClick={() => onSendBackward?.(selectedIdx)}
                disabled={!canGoBack}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "8px 16px", opacity: canGoBack ? 1 : 0.3, background: "none", border: "none", cursor: canGoBack ? "pointer" : "default" }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1.5" y="4.5" width="9" height="9" rx="2" stroke="white" strokeWidth="1.4" />
                  <rect x="5.5" y="1.5" width="9" height="9" rx="2" fill="rgba(18,18,18,0.9)" stroke="rgba(255,255,255,0.45)" strokeWidth="1.4" />
                </svg>
                <span style={{ color: "white", fontSize: 9, fontFamily: FONT, fontWeight: 700, whiteSpace: "nowrap" }}>뒤로</span>
              </button>

              <div style={{ width: 1, backgroundColor: "rgba(255,255,255,0.15)" }} />

              {/* 앞으로 */}
              <button
                onClick={() => onBringForward?.(selectedIdx)}
                disabled={!canGoFront}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "8px 16px", opacity: canGoFront ? 1 : 0.3, background: "none", border: "none", cursor: canGoFront ? "pointer" : "default" }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="5.5" y="1.5" width="9" height="9" rx="2" stroke="white" strokeWidth="1.4" />
                  <rect x="1.5" y="4.5" width="9" height="9" rx="2" fill="rgba(18,18,18,0.9)" stroke="rgba(255,255,255,0.45)" strokeWidth="1.4" />
                  <rect x="5.5" y="1.5" width="9" height="9" rx="2" fill="rgba(18,18,18,0.9)" stroke="white" strokeWidth="1.4" />
                </svg>
                <span style={{ color: "white", fontSize: 9, fontFamily: FONT, fontWeight: 700, whiteSpace: "nowrap" }}>앞으로</span>
              </button>

              <div style={{ width: 1, backgroundColor: "rgba(255,255,255,0.15)" }} />

              {/* 배경 제거 */}
              <button
                onClick={() => { if (!bgRemoving) onRemoveBg?.(selectedIdx); }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "8px 16px", background: "none", border: "none", cursor: bgRemoving ? "default" : "pointer" }}
              >
                {bgRemoving ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                    <path d="M8 1.5A6.5 6.5 0 1 1 1.5 8" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1.5" y="1.5" width="13" height="13" rx="3" stroke="white" strokeWidth="1.3" strokeDasharray="2.5 2" />
                    <path d="M5 8h6M8 5v6" stroke={YELLOW} strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                )}
                <span style={{ color: bgRemoveError ? "#FF6B6B" : "white", fontSize: 9, fontFamily: FONT, fontWeight: 700, whiteSpace: "nowrap" }}>
                  {bgRemoving ? "처리중…" : bgRemoveError ? "실패" : "배경 제거"}
                </span>
              </button>
            </div>

            {/* Sub-hint */}
            <div style={{ backgroundColor: "rgba(0,0,0,0.42)", backdropFilter: "blur(6px)", borderRadius: 99, padding: "3px 10px" }}>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.75)", fontFamily: FONT, whiteSpace: "nowrap" }}>
                핀치로 크기·회전  ·  드래그로 이동  ·  × 삭제
              </p>
            </div>
          </>
        ) : items.length > 0 ? (
          <div style={{ backgroundColor: "rgba(0,0,0,0.48)", backdropFilter: "blur(6px)", borderRadius: 99, padding: "3px 10px" }}>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.85)", fontFamily: FONT, whiteSpace: "nowrap" }}>
              아이템을 터치해서 편집하세요
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
