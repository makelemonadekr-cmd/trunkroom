/**
 * OutfitDetailScreen.jsx
 *
 * Full-screen detail view for a single outfit / coordination card.
 * Shows:
 *   1. Hero outfit image with metadata overlay
 *   2. "이 스타일에 사용된 아이템" — item list resolved from outfit.itemIds
 *
 * Props:
 *   outfit  : outfit record from OUTFIT_DATA
 *   onBack  : () => void
 */

import { useState } from "react";
import { CLOSET_ITEMS } from "../constants/mockClosetData";
import LazyImage from "./LazyImage";

const FONT   = "'Spoqa Han Sans Neo', sans-serif";
const DARK   = "#1a1a1a";
const YELLOW = "#F5C200";

// ─── Single item row ──────────────────────────────────────────────────────────
function ItemRow({ item, last = false }) {
  const src = item.image;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{ borderBottom: last ? "none" : "1px solid #F5F5F5" }}
    >
      {/* Thumbnail */}
      <div
        className="rounded-xl overflow-hidden shrink-0"
        style={{ width: 56, height: 56 }}
      >
        <LazyImage
          src={src}
          alt={item.displayName ?? item.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
          crossOrigin="anonymous"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[10px] uppercase tracking-wide truncate"
          style={{ color: "#AAAAAA", fontFamily: FONT }}
        >
          {item.brand}
        </p>
        <p
          className="text-[13px] font-medium mt-0.5 truncate"
          style={{ color: DARK, fontFamily: FONT }}
        >
          {item.name}
        </p>
        <p
          className="text-[11px] mt-0.5"
          style={{ color: "#AAAAAA", fontFamily: FONT }}
        >
          {item.mainCategory} · {item.color}
        </p>
      </div>

      {/* Category badge */}
      <div className="shrink-0">
        <span
          className="px-2 py-0.5 rounded-md text-[10px] font-medium"
          style={{ backgroundColor: "#F5F5F5", color: "#888", fontFamily: FONT }}
        >
          {item.subcategory ?? item.subCategory ?? item.mainCategory}
        </span>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function OutfitDetailScreen({ outfit, onBack }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(outfit.likes ?? 0);

  function handleLike(e) {
    e.stopPropagation();
    setLiked((v) => !v);
    setLikes((n) => (liked ? n - 1 : n + 1));
  }

  // Resolve item records from CLOSET_ITEMS by itemIds
  const resolvedItems = (outfit.itemIds ?? [])
    .map((id) => CLOSET_ITEMS.find((item) => item.id === id))
    .filter(Boolean);

  // If none resolved, show first 3 CLOSET_ITEMS as a reasonable fallback
  const displayItems =
    resolvedItems.length > 0 ? resolvedItems : CLOSET_ITEMS.slice(0, 3);

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white overflow-hidden">

      {/* ── Hero image ── */}
      <div className="relative shrink-0" style={{ height: 320 }}>
        <LazyImage
          src={outfit.previewImage}
          alt={outfit.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
          priority
          crossOrigin="anonymous"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)",
          }}
        />

        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.88)", backdropFilter: "blur(8px)" }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 4L7 10L12.5 16" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Like button */}
        <button
          onClick={handleLike}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-2 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.88)", backdropFilter: "blur(8px)" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 12L1.5 6.5C1 6 1 5.5 1 4.8C1 3.2 2.5 2 4.2 2C5.1 2 5.9 2.5 6.5 3.1L7 3.7L7.5 3.1C8.1 2.5 8.9 2 9.8 2C11.5 2 13 3.2 13 4.8C13 5.5 12.9 6 12.5 6.5L7 12Z"
              fill={liked ? "#E84040" : "none"}
              stroke={liked ? "#E84040" : "#555"}
              strokeWidth="1.3"
            />
          </svg>
          <span
            className="text-[12px] font-medium"
            style={{ color: liked ? "#E84040" : "#555", fontFamily: FONT }}
          >
            {likes}
          </span>
        </button>

        {/* Style badge — top left (after back button) */}
        <div className="absolute top-[52px] left-4 flex flex-col gap-1.5">
          <span
            className="self-start px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide"
            style={{
              backgroundColor: "rgba(255,255,255,0.18)",
              color: "white",
              fontFamily: FONT,
              backdropFilter: "blur(6px)",
            }}
          >
            {outfit.style}
          </span>
        </div>

        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-5">
          {/* Season chips */}
          <div className="flex flex-wrap gap-1 mb-2">
            {outfit.season.map((s) => (
              <span
                key={s}
                className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: "rgba(245,194,0,0.22)",
                  color: YELLOW,
                  fontFamily: FONT,
                  border: "1px solid rgba(245,194,0,0.3)",
                }}
              >
                {s}
              </span>
            ))}
          </div>

          {/* Title */}
          <h2
            className="text-[19px] font-bold text-white leading-snug"
            style={{ fontFamily: FONT, letterSpacing: "-0.02em" }}
          >
            {outfit.title}
          </h2>

          {/* Short desc */}
          <p
            className="text-[12px] mt-1 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.62)", fontFamily: FONT }}
          >
            {outfit.shortDesc}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-2">
            {outfit.tags.map((tag) => (
              <span
                key={tag}
                className="text-[9px] px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: "rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.72)",
                  fontFamily: FONT,
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Item list ── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>

        {/* Section header */}
        <div
          className="px-4 pt-4 pb-3"
          style={{ borderBottom: "1px solid #F0F0F0" }}
        >
          <p
            className="text-[10px] font-bold tracking-[0.12em] uppercase mb-0.5"
            style={{ color: "#AAAAAA", fontFamily: FONT }}
          >
            ITEMS IN THIS LOOK
          </p>
          <div className="flex items-center justify-between">
            <h3
              className="text-[15px] font-bold"
              style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}
            >
              이 스타일에 사용된 아이템
            </h3>
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
              style={{ backgroundColor: DARK, color: "white", fontFamily: FONT }}
            >
              {displayItems.length}개
            </span>
          </div>
          <p
            className="text-[11px] mt-0.5"
            style={{ color: "#AAAAAA", fontFamily: FONT }}
          >
            매칭된 아이템으로 완성한 스타일이에요
          </p>
        </div>

        {/* Items */}
        <div className="bg-white">
          {displayItems.map((item, i) => (
            <ItemRow key={item.id} item={item} last={i === displayItems.length - 1} />
          ))}
        </div>

        {/* Bottom spacer */}
        <div style={{ height: 32 }} />
      </div>
    </div>
  );
}
