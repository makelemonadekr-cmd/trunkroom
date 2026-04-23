/**
 * ClosetItemDetailScreen.jsx
 *
 * Full-screen detail view for a single closet item.
 * Accessible from anywhere in the app via onItemTap → App.currentItem.
 *
 * Shows:
 *   1. Hero item photo (full-width)
 *   2. Brand, name, all metadata fields
 *   3. Wear statistics (from wearHistoryStore)
 *   4. "이 아이템이 포함된 코디" — related outfit cards (from OUTFIT_DATA)
 *
 * Props:
 *   item       ClosetItem record from CLOSET_ITEMS / mockClosetData
 *   onBack     () => void
 *   onOutfitTap (outfit) => void   optional — open an outfit detail from here
 */

import { useState, useMemo } from "react";
import LazyImage from "./LazyImage";
import { OUTFIT_DATA, getOutfitsContainingItem } from "../constants/mockOutfitData";
import { getItemWearFrequency, getItemLastWornDates } from "../lib/wearHistoryStore";
import { isLiked, getLikeCount, toggleLike } from "../lib/likesStore";

const FONT    = "'Spoqa Han Sans Neo', sans-serif";
const DARK    = "#1a1a1a";
const YELLOW  = "#F5C200";
const DIVIDER = "#F0F0F0";

// ─── Season color map ─────────────────────────────────────────────────────────
const SEASON_COLORS = {
  봄:  { bg: "#FFF0F3", fg: "#E84A6A" },
  여름: { bg: "#E8F5FF", fg: "#0078C8" },
  가을: { bg: "#FFF4E8", fg: "#C86400" },
  겨울: { bg: "#F0F0FF", fg: "#3C3CC8" },
};

// ─── Category color map ───────────────────────────────────────────────────────
const CAT_COLORS = {
  "상의":     { bg: "#FFF8E1", fg: "#A07800" },
  "하의":     { bg: "#E8F0FF", fg: "#1A3A7A" },
  "아우터":   { bg: "#F5ECD8", fg: "#7A5C1E" },
  "원피스":   { bg: "#FDE8F0", fg: "#C62880" },
  "신발":     { bg: "#E8F5E9", fg: "#2E7D32" },
  "가방":     { bg: "#F3E8FF", fg: "#6A1B9A" },
  "액세서리": { bg: "#FFF3E0", fg: "#E65100" },
  "스포츠":   { bg: "#E0F7FA", fg: "#006064" },
};

// ─── Condition badges ─────────────────────────────────────────────────────────
const CONDITION_META = {
  "새 상품":     { emoji: "✨", color: "#2E7D32" },
  "거의 새 것":  { emoji: "⭐", color: "#1565C0" },
  "상태 좋음":   { emoji: "👍", color: "#4CAF50" },
  "사용감 있음": { emoji: "👀", color: "#FF8F00" },
  "상태 나쁨":   { emoji: "⚠️", color: "#E53935" },
};

// ─── Related outfit mini-card ─────────────────────────────────────────────────
function OutfitMiniCard({ outfit, onTap }) {
  const [liked, setLiked] = useState(() => isLiked(outfit.id));
  const [likes, setLikes] = useState(() => getLikeCount(outfit.id, outfit.likes));

  function handleLike(e) {
    e.stopPropagation();
    const result = toggleLike(outfit.id, outfit.likes);
    setLiked(result.liked);
    setLikes(result.count);
  }

  return (
    <button
      onClick={() => onTap?.(outfit)}
      className="shrink-0 relative rounded-2xl overflow-hidden active:opacity-90"
      style={{ width: 130, aspectRatio: "3/4", backgroundColor: outfit.color ?? "#2C2C2C" }}
    >
      <LazyImage
        src={outfit.previewImage}
        alt={outfit.title}
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
      />
      {/* Gradient */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)" }}
      />
      {/* Like */}
      <button
        onClick={handleLike}
        className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
        style={{ backgroundColor: "rgba(0,0,0,0.32)", backdropFilter: "blur(6px)" }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path
            d="M5 8.5L1.2 4.8C0.8 4.4 0.8 4 0.8 3.5C0.8 2.4 1.7 1.5 2.8 1.5C3.4 1.5 3.9 1.8 5 3L5 3L6.1 1.8C6.5 1.5 7.1 1.5 7.5 1.5C8.6 1.5 9.2 2.4 9.2 3.5C9.2 4 9.2 4.4 8.8 4.8L5 8.5Z"
            fill={liked ? "#E84040" : "none"}
            stroke={liked ? "#E84040" : "rgba(255,255,255,0.75)"}
            strokeWidth="1"
          />
        </svg>
        <span className="text-[9px]" style={{ color: liked ? "#ff8080" : "rgba(255,255,255,0.75)", fontFamily: FONT }}>{likes}</span>
      </button>
      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <p className="text-[10px] font-bold text-white truncate" style={{ fontFamily: FONT }}>{outfit.title}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {outfit.season.slice(0, 2).map((s) => (
            <span key={s} className="text-[8px] px-1 py-0.5 rounded"
              style={{ backgroundColor: "rgba(245,194,0,0.22)", color: YELLOW, fontFamily: FONT }}>
              {s}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

// ─── Metadata chip ────────────────────────────────────────────────────────────
function Chip({ label, value, accent = false }) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2 rounded-xl" style={{ backgroundColor: accent ? "#FEFCE8" : "#F5F5F5", border: `1px solid ${accent ? "#EDD83A" : "transparent"}` }}>
      <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: accent ? "#A07800" : "#AAAAAA", fontFamily: FONT }}>
        {label}
      </p>
      <p className="text-[12px] font-bold" style={{ color: accent ? "#A07800" : DARK, fontFamily: FONT }}>
        {value}
      </p>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function ClosetItemDetailScreen({ item, onBack, onOutfitTap }) {
  const wearFreq     = useMemo(() => getItemWearFrequency(), []);
  const lastWornMap  = useMemo(() => getItemLastWornDates(), []);
  const wearCount    = wearFreq.get(item.id) ?? 0;
  const lastWornDate = lastWornMap.get(item.id) ?? null;

  const relatedOutfits = useMemo(
    () => getOutfitsContainingItem(item.id, item),
    [item]
  );

  const catColor  = CAT_COLORS[item.mainCategory ?? item.category] ?? { bg: "#F5F5F5", fg: "#555" };
  const condMeta  = CONDITION_META[item.condition] ?? { emoji: "📦", color: "#888" };

  const seasons   = Array.isArray(item.season) ? item.season : [item.season].filter(Boolean);
  const tags      = Array.isArray(item.tags) ? item.tags : [];
  const styleTags = Array.isArray(item.styleTags) ? item.styleTags : [];

  // Format last worn
  function formatLastWorn(dateStr) {
    if (!dateStr) return "착용 기록 없음";
    const d = new Date(dateStr + "T12:00:00");
    const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diff === 0) return "오늘";
    if (diff === 1) return "어제";
    if (diff < 7)  return `${diff}일 전`;
    if (diff < 30) return `${Math.floor(diff / 7)}주 전`;
    return `${Math.floor(diff / 30)}개월 전`;
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-white overflow-hidden">

      {/* ── Hero image ── */}
      <div className="relative shrink-0" style={{ height: 340 }}>
        <LazyImage
          src={item.image}
          alt={item.displayName ?? item.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
          priority
          crossOrigin="anonymous"
        />

        {/* Gradient at bottom */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.05) 50%, transparent 100%)" }}
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

        {/* Category badge — top right */}
        <div
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ backgroundColor: catColor.bg, backdropFilter: "blur(8px)" }}
        >
          <span className="text-[11px] font-bold" style={{ color: catColor.fg, fontFamily: FONT }}>
            {item.mainCategory ?? item.category}
          </span>
        </div>

        {/* Hero info overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
          {/* Brand */}
          <p className="text-[11px] font-bold tracking-widest uppercase mb-1" style={{ color: "rgba(255,255,255,0.55)", fontFamily: FONT }}>
            {item.brand}
          </p>
          {/* Name */}
          <h2 className="text-[20px] font-bold text-white leading-tight" style={{ fontFamily: FONT, letterSpacing: "-0.025em" }}>
            {item.displayName ?? item.name}
          </h2>
          {/* Sub category + condition */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.75)", fontFamily: FONT }}>
              {item.subCategory ?? item.subcategory}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.75)", fontFamily: FONT }}>
              {condMeta.emoji} {item.condition}
            </span>
          </div>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>

        {/* ── Wear stats row ── */}
        <div className="flex border-b" style={{ borderColor: DIVIDER }}>
          <div className="flex-1 flex flex-col items-center py-3.5" style={{ borderRight: `1px solid ${DIVIDER}` }}>
            <p className="text-[22px] font-bold" style={{ color: wearCount > 0 ? DARK : "#CCCCCC", fontFamily: FONT, letterSpacing: "-0.03em" }}>
              {wearCount}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>총 착용 횟수</p>
          </div>
          <div className="flex-1 flex flex-col items-center py-3.5">
            <p className="text-[15px] font-bold" style={{ color: lastWornDate ? DARK : "#CCCCCC", fontFamily: FONT }}>
              {formatLastWorn(lastWornDate)}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>마지막 착용</p>
          </div>
        </div>

        {/* ── Metadata chips ── */}
        <div className="px-5 pt-5 pb-4">
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase mb-3" style={{ color: "#AAAAAA", fontFamily: FONT }}>
            아이템 정보
          </p>
          <div className="flex flex-wrap gap-2">
            <Chip label="색상"   value={item.color} />
            <Chip label="사이즈" value={item.size} />
            {item.material && <Chip label="소재" value={item.material} />}
            <Chip label="상태"   value={item.condition} accent />
            {item.price > 0 && (
              <Chip label="구매가" value={`₩${item.price.toLocaleString()}`} />
            )}
          </div>
        </div>

        {/* ── Season badges ── */}
        {seasons.length > 0 && (
          <div className="px-5 pb-4">
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase mb-2.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>
              시즌
            </p>
            <div className="flex flex-wrap gap-2">
              {seasons.map((s) => {
                const sc = SEASON_COLORS[s] ?? { bg: "#F5F5F5", fg: "#555" };
                return (
                  <span key={s} className="px-3 py-1.5 rounded-full text-[12px] font-bold"
                    style={{ backgroundColor: sc.bg, color: sc.fg, fontFamily: FONT }}>
                    {s === "봄" ? "🌸" : s === "여름" ? "☀️" : s === "가을" ? "🍂" : "❄️"} {s}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Style tags ── */}
        {(styleTags.length > 0 || tags.length > 0) && (
          <div className="px-5 pb-4">
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase mb-2.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>
              스타일 태그
            </p>
            <div className="flex flex-wrap gap-2">
              {styleTags.map((t) => (
                <span key={t} className="px-3 py-1.5 rounded-full text-[11px] font-bold"
                  style={{ backgroundColor: "#1a1a1a", color: "white", fontFamily: FONT }}>
                  {t}
                </span>
              ))}
              {tags.slice(0, 6).map((t) => (
                <span key={t} className="px-3 py-1.5 rounded-full text-[11px] font-medium"
                  style={{ backgroundColor: "#F5F5F5", color: "#555", fontFamily: FONT }}>
                  #{t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Custom mood ── */}
        {item.customMood && (
          <div className="px-5 pb-4">
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase mb-2" style={{ color: "#AAAAAA", fontFamily: FONT }}>나만의 무드</p>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl" style={{ backgroundColor: "#FEFCE8", border: "1px solid #EDD83A" }}>
              <span style={{ fontSize: 16 }}>✨</span>
              <p className="text-[13px] font-medium" style={{ color: "#A07800", fontFamily: FONT }}>{item.customMood}</p>
            </div>
          </div>
        )}

        {/* ── Divider ── */}
        <div className="mx-5 mb-5" style={{ height: 1, backgroundColor: DIVIDER }} />

        {/* ── Related outfits ── */}
        {relatedOutfits.length > 0 && (
          <div className="pb-6">
            <div className="flex items-center justify-between px-5 mb-3">
              <div>
                <p className="text-[10px] font-bold tracking-[0.12em] uppercase" style={{ color: "#AAAAAA", fontFamily: FONT }}>
                  THIS ITEM IN A LOOK
                </p>
                <h3 className="text-[15px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>
                  이 아이템이 포함된 코디
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                style={{ backgroundColor: DARK, color: "white", fontFamily: FONT }}>
                {relatedOutfits.length}개
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto px-5" style={{ scrollbarWidth: "none" }}>
              {relatedOutfits.map((outfit) => (
                <OutfitMiniCard key={outfit.id} outfit={outfit} onTap={onOutfitTap} />
              ))}
              <div className="shrink-0 w-1" />
            </div>
          </div>
        )}

        {/* ── If no outfits ── */}
        {relatedOutfits.length === 0 && (
          <div className="px-5 pb-8 flex flex-col items-center gap-2 py-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#F5F5F5" }}>
              <span style={{ fontSize: 26 }}>🧥</span>
            </div>
            <p className="text-[12px] font-bold" style={{ color: DARK, fontFamily: FONT }}>아직 코디에 포함되지 않았어요</p>
            <p className="text-[11px] text-center" style={{ color: "#AAAAAA", fontFamily: FONT }}>
              기록을 쌓으면 이 아이템을 활용한<br />코디 추천이 나타나요
            </p>
          </div>
        )}

        {/* Bottom padding */}
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
