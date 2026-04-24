/**
 * SimilarClosetScreen.jsx
 *
 * Full-screen overlay shown when the user taps "나도 비슷하게 코디해볼까?"
 * on any style detail screen (community post, outfit detail, stylebook detail).
 *
 * Props:
 *   wornItems   ClosetItem[]   — items worn in the reference style
 *   onBack      () => void
 *   onItemTap   (item) => void — opens ClosetItemDetailScreen
 */

import { useMemo, useState } from "react";
import {
  findSimilarClosetItems,
  groupItemsByCategory,
} from "../lib/styleMatchUtils";
import ClosetItemDetailScreen from "./ClosetItemDetailScreen";

const FONT   = "'Spoqa Han Sans Neo', sans-serif";
const DARK   = "#1a1a1a";
const YELLOW = "#F5C200";
const CREAM  = "#F5F2EC";

// ─── Category label map ───────────────────────────────────────────────────────
const CAT_EMOJI = {
  "상의":   "👕",
  "하의":   "👖",
  "아우터": "🧥",
  "신발":   "👟",
  "가방":   "👜",
  "액세서리": "💍",
  "기타":   "🎁",
};

// ─── Single item card ─────────────────────────────────────────────────────────
function SimilarItemCard({ item, onTap }) {
  return (
    <button
      onClick={() => onTap?.(item)}
      className="flex flex-col items-start text-left active:opacity-70"
      style={{ width: 100 }}
    >
      <div
        className="overflow-hidden rounded-2xl"
        style={{
          width:           100,
          height:          124,
          backgroundColor: CREAM,
          border:          "1px solid #EBEBEB",
        }}
      >
        {item.image && (
          <img
            src={item.image}
            alt={item.displayName ?? item.name}
            style={{
              width:          "100%",
              height:         "100%",
              objectFit:      "cover",
              objectPosition: "center top",
              mixBlendMode:   "multiply",
            }}
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
        style={{ fontSize: 11, color: DARK, fontFamily: FONT, fontWeight: 600, letterSpacing: "-0.01em" }}
      >
        {item.displayName ?? item.name}
      </p>
      <p style={{ fontSize: 9, color: "#AAAAAA", fontFamily: FONT, marginTop: 1 }}>
        {item.subCategory ?? item.subcategory ?? item.mainCategory ?? item.category}
      </p>
    </button>
  );
}

// ─── Category group section ───────────────────────────────────────────────────
function CategorySection({ category, items, onItemTap }) {
  const emoji = CAT_EMOJI[category] ?? "👗";
  return (
    <div className="mb-6">
      {/* Section header */}
      <div className="flex items-center gap-2 px-5 mb-3">
        <span style={{ fontSize: 14 }}>{emoji}</span>
        <p
          className="text-[12px] font-bold"
          style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.01em" }}
        >
          {category}
        </p>
        <span
          className="ml-1 px-2 py-0.5 rounded-full text-[9px] font-bold"
          style={{ backgroundColor: "#F0F0F0", color: "#888", fontFamily: FONT }}
        >
          {items.length}개
        </span>
      </div>

      {/* Horizontal scroll */}
      <div
        className="flex gap-3 overflow-x-auto"
        style={{ paddingLeft: 20, paddingRight: 20, scrollbarWidth: "none" }}
      >
        {items.map((item) => (
          <SimilarItemCard key={item.id} item={item} onTap={onItemTap} />
        ))}
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function SimilarClosetScreen({ wornItems = [], onBack, onItemTap }) {
  const [selectedItem, setSelectedItem] = useState(null);

  const similar = useMemo(
    () => findSimilarClosetItems(wornItems),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wornItems.map((i) => i.id).join(",")]
  );

  const groups = useMemo(() => groupItemsByCategory(similar), [similar]);

  return (
    <div className="absolute inset-0 z-[90] flex flex-col bg-white overflow-hidden">

      {/* ── Header ── */}
      <div
        className="shrink-0 flex items-center gap-3 px-4 pt-4 pb-4"
        style={{ borderBottom: "1px solid #F0F0F0" }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full shrink-0 active:opacity-70"
          style={{ backgroundColor: "#F5F5F5" }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p
            className="text-[8px] font-bold tracking-[0.14em] uppercase mb-0.5"
            style={{ color: "#AAAAAA", fontFamily: FONT }}
          >
            MY CLOSET MATCH
          </p>
          <h2
            className="text-[16px] font-bold leading-tight"
            style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}
          >
            나도 비슷하게 코디해볼까?
          </h2>
        </div>
      </div>

      {/* ── Subtitle banner ── */}
      <div
        className="shrink-0 mx-4 mt-4 mb-2 rounded-2xl px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: "#FEFCE8", border: `1.5px solid ${YELLOW}` }}
      >
        <span style={{ fontSize: 20 }}>✨</span>
        <div>
          <p className="text-[12px] font-bold" style={{ color: DARK, fontFamily: FONT }}>
            내 옷장에서 찾은 유사 아이템
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: "#888", fontFamily: FONT }}>
            스타일 키워드 기반으로 비슷한 아이템을 추천해요
          </p>
        </div>
      </div>

      {/* ── Scrollable results ── */}
      <div className="flex-1 overflow-y-auto pt-4" style={{ scrollbarWidth: "none" }}>
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-8">
            <span style={{ fontSize: 48, opacity: 0.3 }}>🔍</span>
            <p
              className="text-[14px] font-bold mt-4 text-center"
              style={{ color: "#BBBBBB", fontFamily: FONT }}
            >
              유사한 아이템을 찾지 못했어요
            </p>
            <p
              className="text-[12px] mt-1.5 text-center"
              style={{ color: "#CCCCCC", fontFamily: FONT }}
            >
              옷장에 더 많은 아이템을 추가해보세요
            </p>
          </div>
        ) : (
          <>
            {groups.map(({ category, items }) => (
              <CategorySection
                key={category}
                category={category}
                items={items}
                onItemTap={(item) => setSelectedItem(item)}
              />
            ))}
            <div style={{ height: 32 }} />
          </>
        )}
      </div>

      {/* ── ClosetItemDetailScreen overlay ── */}
      {selectedItem && (
        <ClosetItemDetailScreen
          item={selectedItem}
          onBack={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
