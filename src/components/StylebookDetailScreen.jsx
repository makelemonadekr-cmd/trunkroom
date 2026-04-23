/**
 * StylebookDetailScreen.jsx
 *
 * Editorial full-screen overlay for a saved Stylebook (coordi) entry.
 *
 * Layout:
 *   [Hero photo or mood-board grid]
 *     └── glassmorphic back/edit/delete buttons
 *     └── mood chip · visibility badge
 *     └── title + date (gradient overlay)
 *   [PALETTE — extracted color swatches + names]
 *   [착용 아이템 — horizontal item cards]
 *   [나만의 메모 — private memo with lock badge]
 *   [TRUNKROOM STYLEBOOK brand footer]
 */

import { useState } from "react";
import { CLOSET_ITEMS } from "../constants/mockClosetData";

const FONT   = "'Spoqa Han Sans Neo', sans-serif";
const DARK   = "#1a1a1a";
const YELLOW = "#F5C200";

const MOOD_MAP = {
  casual:  { label: "캐주얼",  emoji: "😎" },
  minimal: { label: "미니멀",  emoji: "⬜" },
  chic:    { label: "시크",    emoji: "💎" },
  comfy:   { label: "편안함",  emoji: "🌿" },
  date:    { label: "데이트",  emoji: "🌹" },
  office:  { label: "오피스",  emoji: "💼" },
  sporty:  { label: "스포티",  emoji: "⚡" },
  vintage: { label: "빈티지",  emoji: "📷" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [yr, mo, dy] = dateStr.split("-").map(Number);
  return `${yr}년 ${mo}월 ${dy}일`;
}

// ─── Hero fallback when no user photo exists ──────────────────────────────────
// Shows a 2×2 grid (or 1/2/3-item variants) of item images on the coordi bgColor.

function MoodBoardHero({ items, bgColor }) {
  const show = items.slice(0, 4);
  const bg   = bgColor || "#EBEBEB";

  if (show.length === 0) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ backgroundColor: bg }}
      >
        <span style={{ fontSize: 64, opacity: 0.12 }}>👗</span>
      </div>
    );
  }

  // 1 item
  if (show.length === 1) {
    return (
      <div className="w-full h-full" style={{ backgroundColor: bg }}>
        <img
          src={show[0].image}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
        />
      </div>
    );
  }

  // 2 items — side by side
  if (show.length === 2) {
    return (
      <div className="w-full h-full flex gap-0.5" style={{ backgroundColor: bg }}>
        {show.map((item) => (
          <div key={item.id} style={{ flex: 1, overflow: "hidden" }}>
            <img
              src={item.image}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
            />
          </div>
        ))}
      </div>
    );
  }

  // 3 items — left full-height, right 2-stack
  if (show.length === 3) {
    return (
      <div className="w-full h-full flex gap-0.5" style={{ backgroundColor: bg }}>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <img
            src={show[0].image}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
          />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {show.slice(1).map((item) => (
            <div key={item.id} style={{ flex: 1, overflow: "hidden" }}>
              <img
                src={item.image}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4 items — 2×2 grid
  return (
    <div
      className="w-full h-full"
      style={{ backgroundColor: bg, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
    >
      {show.map((item) => (
        <div key={item.id} style={{ overflow: "hidden" }}>
          <img
            src={item.image}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Glassmorphic icon button (hero overlay) ─────────────────────────────────
function GlassButton({ onClick, children, danger = false }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center rounded-full active:opacity-70"
      style={{
        width:                   36,
        height:                  36,
        backgroundColor:         danger ? "rgba(232,64,64,0.72)" : "rgba(255,255,255,0.18)",
        backdropFilter:          "blur(12px)",
        WebkitBackdropFilter:    "blur(12px)",
        border:                  "1px solid rgba(255,255,255,0.28)",
      }}
    >
      {children}
    </button>
  );
}

// ─── Color swatch chip ────────────────────────────────────────────────────────
function ColorSwatch({ color, size = 44 }) {
  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0" style={{ minWidth: size + 12 }}>
      <div
        style={{
          width:     size,
          height:    size,
          borderRadius: size / 2,
          backgroundColor: color.hex,
          boxShadow:       "0 3px 10px rgba(0,0,0,0.14), inset 0 1px 1px rgba(255,255,255,0.35)",
          border:          "2.5px solid rgba(255,255,255,0.95)",
        }}
      />
      <p
        className="text-center leading-tight"
        style={{ fontSize: 9, color: "#666", fontFamily: FONT, fontWeight: 500, maxWidth: size + 12 }}
      >
        {color.name}
      </p>
    </div>
  );
}

// ─── Item mini-card ───────────────────────────────────────────────────────────
function ItemCard({ item, onTap }) {
  return (
    <button
      className="shrink-0 flex flex-col items-start text-left active:opacity-70"
      style={{ width: 78 }}
      onClick={() => onTap?.(item)}
    >
      <div
        style={{
          width:           78,
          height:          98,
          borderRadius:    12,
          overflow:        "hidden",
          backgroundColor: "#F3F3F3",
          border:          "1px solid #EBEBEB",
        }}
      >
        {item.image && (
          <img
            src={item.image}
            alt={item.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
          />
        )}
      </div>
      <p
        className="mt-1.5 truncate w-full"
        style={{ fontSize: 8, color: "#BBBBBB", fontFamily: FONT, letterSpacing: "0.06em", textTransform: "uppercase" }}
      >
        {item.brand}
      </p>
      <p
        className="truncate w-full"
        style={{ fontSize: 10, color: DARK, fontFamily: FONT, fontWeight: 500, letterSpacing: "-0.01em" }}
      >
        {item.displayName ?? item.name}
      </p>
      {item.subcategory && (
        <p style={{ fontSize: 9, color: "#CCCCCC", fontFamily: FONT, marginTop: 1 }}>
          {item.subcategory}
        </p>
      )}
    </button>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionLabel({ text, badge }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <p
        className="text-[10px] font-bold tracking-[0.14em]"
        style={{ color: "#BBBBBB", fontFamily: FONT }}
      >
        {text}
      </p>
      {badge && (
        <span style={{ fontSize: 10, color: "#CCCCCC", fontFamily: FONT }}>{badge}</span>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * @param {object}   coordi          - full coordi/stylebook entry from coordiStore
 * @param {function} onBack          - close the detail view
 * @param {function} [onEdit]        - open the editor for this entry
 * @param {function} [onDelete]      - delete this entry by id
 * @param {function} [onProductSelect] - open ProductDetailPage for an item
 */
export default function StylebookDetailScreen({
  coordi,
  onBack,
  onEdit,
  onDelete,
  onProductSelect,
}) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Resolve item objects from stored IDs
  const items = (coordi.itemIds ?? [])
    .map((id) => CLOSET_ITEMS.find((i) => i.id === id))
    .filter(Boolean);

  const moodOpt      = coordi.mood ? MOOD_MAP[coordi.mood] : null;
  const hasPhoto     = !!coordi.photoUrl;
  const hasColors    = (coordi.extractedColors ?? []).length > 0;
  const hasMemo      = !!coordi.memo?.trim?.();
  const hasItems     = items.length > 0;

  return (
    <div className="absolute inset-0 z-[80] flex flex-col overflow-hidden bg-white">

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <div className="relative shrink-0" style={{ height: 310 }}>

        {/* Background image or mood-board grid */}
        {hasPhoto ? (
          <img
            src={coordi.photoUrl}
            alt={coordi.title}
            style={{
              position:       "absolute",
              inset:          0,
              width:          "100%",
              height:         "100%",
              objectFit:      "cover",
              objectPosition: "center top",
            }}
          />
        ) : (
          <MoodBoardHero items={items} bgColor={coordi.bgColor} />
        )}

        {/* Bottom gradient scrim */}
        <div
          style={{
            position:   "absolute",
            inset:      0,
            background: "linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.42) 48%, transparent 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Top bar: back + edit + delete */}
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-between"
          style={{ padding: "14px 16px" }}
        >
          <GlassButton onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8L10 13" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </GlassButton>

          <div className="flex items-center gap-2">
            {onEdit && (
              <GlassButton onClick={() => onEdit(coordi)}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 2.5L11.5 5L5 11.5H2.5V9L9 2.5Z" stroke="white" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
              </GlassButton>
            )}
            {onDelete && (
              <GlassButton onClick={() => setDeleteConfirm(true)}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M3 3H10M5 3V2H8V3" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
                  <path d="M4 5L4.5 11H8.5L9 5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </GlassButton>
            )}
          </div>
        </div>

        {/* Bottom overlay: chips + title + date */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">

          {/* Mood + visibility chips */}
          <div className="flex items-center gap-2 mb-2.5">
            {moodOpt && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: "rgba(255,255,255,0.16)",
                  backdropFilter:  "blur(10px)",
                  border:          "1px solid rgba(255,255,255,0.22)",
                }}
              >
                <span style={{ fontSize: 11 }}>{moodOpt.emoji}</span>
                <span className="text-[10px] font-bold text-white" style={{ fontFamily: FONT }}>
                  {moodOpt.label}
                </span>
              </div>
            )}
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: "rgba(255,255,255,0.12)",
                backdropFilter:  "blur(8px)",
                border:          "1px solid rgba(255,255,255,0.16)",
              }}
            >
              <span style={{ fontSize: 9 }}>{coordi.isPublic ? "🌐" : "🔒"}</span>
              <span
                className="text-[9px] font-medium"
                style={{ color: "rgba(255,255,255,0.80)", fontFamily: FONT }}
              >
                {coordi.isPublic ? "공개" : "비공개"}
              </span>
            </div>
          </div>

          {/* Title */}
          <h1
            className="font-bold leading-snug mb-1"
            style={{
              fontSize:    22,
              color:       "white",
              fontFamily:  FONT,
              letterSpacing: "-0.03em",
              textShadow:  "0 1px 10px rgba(0,0,0,0.3)",
            }}
          >
            {coordi.title || "제목 없음"}
          </h1>

          {/* Date */}
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.50)", fontFamily: FONT }}>
            {formatDate(coordi.dateStr)}
          </p>
        </div>
      </div>

      {/* ══ SCROLLABLE BODY ═══════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto bg-white" style={{ scrollbarWidth: "none" }}>

        {/* ── Color palette ─────────────────────────────────────────────── */}
        {hasColors && (
          <div className="px-5 pt-5 pb-5" style={{ borderBottom: "1px solid #F2F2F2" }}>
            <SectionLabel
              text="PALETTE"
              badge={`${coordi.extractedColors.length}가지 주요 컬러`}
            />
            <div
              className="flex gap-4 overflow-x-auto"
              style={{ scrollbarWidth: "none", paddingBottom: 4 }}
            >
              {coordi.extractedColors.map((c, i) => (
                <ColorSwatch key={i} color={c} size={44} />
              ))}
            </div>
          </div>
        )}

        {/* No palette placeholder — only if no photo was ever attached */}
        {!hasColors && !hasPhoto && (
          <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid #F2F2F2" }}>
            <SectionLabel text="PALETTE" />
            <div
              className="flex items-center gap-3 py-2 px-3 rounded-xl"
              style={{ backgroundColor: "#F9F9F9", border: "1px dashed #E0E0E0" }}
            >
              <span style={{ fontSize: 18, opacity: 0.5 }}>🎨</span>
              <p style={{ fontSize: 11, color: "#BBBBBB", fontFamily: FONT }}>
                착장 사진을 추가하면 컬러가 자동으로 분석돼요
              </p>
            </div>
          </div>
        )}

        {/* ── Linked closet items ────────────────────────────────────────── */}
        {hasItems && (
          <div className="px-5 pt-4 pb-5" style={{ borderBottom: "1px solid #F2F2F2" }}>
            <SectionLabel text="착용 아이템" badge={`${items.length}개`} />
            <div
              className="flex gap-3 overflow-x-auto"
              style={{ scrollbarWidth: "none", paddingBottom: 4 }}
            >
              {items.map((item) => (
                <ItemCard key={item.id} item={item} onTap={onProductSelect} />
              ))}
            </div>
          </div>
        )}

        {/* ── Private memo ──────────────────────────────────────────────── */}
        {hasMemo && (
          <div className="px-5 pt-4 pb-5" style={{ borderBottom: "1px solid #F2F2F2" }}>
            <div className="flex items-center gap-2 mb-2.5">
              <p
                className="text-[10px] font-bold tracking-[0.14em]"
                style={{ color: "#BBBBBB", fontFamily: FONT }}
              >
                나만의 메모
              </p>
              <div
                className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                style={{ backgroundColor: "#F2F2F2" }}
              >
                <svg width="8" height="8" viewBox="0 0 9 9" fill="none">
                  <rect x="1" y="4" width="7" height="5" rx="1" stroke="#C0C0C0" strokeWidth="0.9" />
                  <path d="M3 4V3a1.5 1.5 0 113 0v1" stroke="#C0C0C0" strokeWidth="0.9" />
                </svg>
                <span style={{ fontSize: 8, color: "#C0C0C0", fontFamily: FONT }}>비공개</span>
              </div>
            </div>
            <p
              className="leading-relaxed"
              style={{ fontSize: 13, color: "#444", fontFamily: FONT }}
            >
              {coordi.memo}
            </p>
          </div>
        )}

        {/* ── Brand footer ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-center py-10">
          <div className="flex items-center gap-3">
            <div style={{ width: 24, height: 1, backgroundColor: "#E8E8E8" }} />
            <p
              style={{
                fontSize:      8,
                letterSpacing: "0.22em",
                color:         "#D0D0D0",
                fontFamily:    FONT,
                textTransform: "uppercase",
              }}
            >
              TRUNKROOM STYLEBOOK
            </p>
            <div style={{ width: 24, height: 1, backgroundColor: "#E8E8E8" }} />
          </div>
        </div>
      </div>

      {/* ══ DELETE CONFIRMATION SHEET ════════════════════════════════════════ */}
      {deleteConfirm && (
        <div
          className="absolute inset-0 z-[90] flex items-end"
          style={{ backgroundColor: "rgba(0,0,0,0.42)" }}
          onClick={() => setDeleteConfirm(false)}
        >
          <div
            className="w-full rounded-t-3xl px-5 pt-6 pb-8 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <p
              className="text-[16px] font-bold text-center mb-1.5"
              style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}
            >
              스타일을 삭제할까요?
            </p>
            <p
              className="text-[12px] text-center mb-6"
              style={{ color: "#AAAAAA", fontFamily: FONT }}
            >
              삭제한 스타일은 복구할 수 없어요
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 h-12 rounded-xl text-[14px] font-medium"
                style={{ backgroundColor: "#F5F5F5", color: "#888", fontFamily: FONT }}
              >
                취소
              </button>
              <button
                onClick={() => {
                  onDelete?.(coordi.id);
                  setDeleteConfirm(false);
                }}
                className="flex-1 h-12 rounded-xl text-[14px] font-bold"
                style={{ backgroundColor: "#E84040", color: "white", fontFamily: FONT }}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
