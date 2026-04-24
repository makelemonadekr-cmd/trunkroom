/**
 * DiscoveryPage.jsx  —  "발견" tab (4th bottom tab, id: "discover")
 *
 * Public discovery / browsing / shopping-discovery experience.
 * Replaces the old "코디" personal creation tab.
 *
 * Structure:
 *   Header: "발견" title + "판매중인 상품 모아보기" CTA
 *   Sub-tabs: [공개 아이템] [스타일북] [셀러]
 *
 * Personal coordi creation ("내 스타일 만들기") has been moved to
 * the "내 옷장" (closet) tab → 스타일북 sub-tab.
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import LazyImage             from "../../components/LazyImage";
import OutfitDetailScreen    from "../../components/OutfitDetailScreen";
import ProductDetailPage     from "../product/ProductDetailPage";
import SellerProfilePage     from "./SellerProfilePage";
import { unsplashUrl }       from "../../lib/imageUtils";
import { isLiked, getLikeCount, toggleLike } from "../../lib/likesStore";
import { isFollowing, toggleFollow } from "../../lib/followStore";
import {
  SELLER_PROFILES,
  getAllPublicItems,
  getAllForSaleItems,
  getAllPublicOutfits,
  getSellerItems,
  getSellerOutfits,
  toProductShape,
} from "../../constants/mockSellerData";
import { STYLE_FILTER_OPTIONS } from "../../constants/styleCategories";
import { SEASON_FILTER_OPTIONS } from "../../constants/seasonFilters";

const FONT   = "'Spoqa Han Sans Neo', sans-serif";
const DARK   = "#1a1a1a";
const YELLOW = "#F5C200";

// ─── Color map (for public items filter) ──────────────────────────────────────
const COLOR_HEX = {
  "블랙":"#1a1a1a","화이트":"#F8F8F8","그레이":"#888888","라이트그레이":"#CCCCCC",
  "네이비":"#1B2A5E","베이지":"#D4B896","브라운":"#7B4F2E","카키":"#6B6B3A",
  "블루":"#2060CC","스카이블루":"#87CEEB","레드":"#CC2020","핑크":"#F4A0B0",
  "옐로우":"#F5C200","그린":"#3A8A3A","민트":"#5EC8C0","퍼플":"#7B4FA0",
  "바이올렛":"#8B6FBF","오렌지":"#E87020","아이보리":"#F5F0E0","크림":"#F8F4E8",
  "와인":"#722020","머스타드":"#C89B20","올리브":"#7A7A30","코랄":"#F07060","라벤더":"#B0A0D0",
};
function isLightColor(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return (r*299+g*587+b*114)/1000 > 155;
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function SellerAvatar({ seller, size = 24 }) {
  if (!seller) return null;
  return (
    <div
      className="rounded-full overflow-hidden border border-white shrink-0"
      style={{ width: size, height: size }}
    >
      <LazyImage
        src={seller.profileImage}
        alt={seller.displayName}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
}

// ─── 1. 공개 아이템 tab ────────────────────────────────────────────────────────

function PublicItemCard({ item, onTap, onSellerTap }) {
  const imgSrc = item.image?.includes("unsplash.com")
    ? unsplashUrl(item.image, 320)
    : item.image;

  return (
    <button
      className="w-full text-left active:opacity-80 transition-opacity"
      onClick={() => onTap?.(toProductShape(item))}
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid #F0F0F0", backgroundColor: "white" }}
      >
        {/* Image */}
        <div className="relative" style={{ aspectRatio: "3/4" }}>
          <LazyImage
            src={imgSrc}
            alt={item.displayName ?? item.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
            responsive={item.image?.includes("unsplash.com")}
          />
          {item.isForSale && (
            <div
              className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full"
              style={{ backgroundColor: "rgba(26,26,26,0.72)", backdropFilter: "blur(6px)" }}
            >
              <div className="rounded-full shrink-0" style={{ width: 5, height: 5, backgroundColor: YELLOW }} />
              <span className="text-[9px] font-bold text-white" style={{ fontFamily: FONT }}>판매중</span>
            </div>
          )}
        </div>
        {/* Info */}
        <div className="px-2.5 py-2">
          <p className="text-[10px] uppercase tracking-wide truncate mb-0.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>
            {item.brand}
          </p>
          <p className="text-[12px] font-medium truncate" style={{ color: DARK, fontFamily: FONT }}>
            {item.displayName ?? item.name}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "#BBBBBB", fontFamily: FONT }}>
            {item.color} · {item.size}
          </p>
          {/* Seller row */}
          {item.seller && (
            <button
              className="flex items-center gap-1.5 mt-2 active:opacity-70"
              onClick={(e) => { e.stopPropagation(); onSellerTap?.(item.seller.id); }}
            >
              <SellerAvatar seller={item.seller} size={18} />
              <span className="text-[10px]" style={{ color: "#888", fontFamily: FONT }}>
                {item.seller.displayName}
              </span>
              {item.seller.verified && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="5" cy="5" r="4.5" fill={YELLOW} />
                  <path d="M3 5L4.5 6.5L7 4" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </button>
  );
}

const CAT_LIST = [
  { label: "전체",     emoji: "✨" },
  { label: "상의",     emoji: "👕" },
  { label: "하의",     emoji: "👖" },
  { label: "아우터",   emoji: "🧥" },
  { label: "원피스",   emoji: "👗" },
  { label: "신발",     emoji: "👟" },
  { label: "가방",     emoji: "👜" },
  { label: "액세서리", emoji: "💍" },
  { label: "스포츠",   emoji: "🎽" },
];

const SEASONS_PUB = ["봄", "여름", "가을", "겨울"];

function PublicItemsTab({ onItemTap, onSellerTap, saleFilterActive, onSaleFilterClear }) {
  const [itemView,      setItemView]     = useState("all"); // "all" | "following"
  const [followRev,     setFollowRev]    = useState(0);
  const [openPanel,     setOpenPanel]    = useState(null);
  const [catFilters,    setCatFilters]   = useState([]);
  const [colorFilters,  setColorFilters] = useState([]);
  const [seasonFilters, setSeasonFilters] = useState([]);
  const [brandFilters,  setBrandFilters] = useState([]);
  void followRev;

  // IDs of sellers the user follows
  const followedSellerIds = useMemo(
    () => SELLER_PROFILES.filter((s) => isFollowing(s.id)).map((s) => s.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [followRev]
  );

  const source = useMemo(() => {
    const base = saleFilterActive ? getAllForSaleItems() : getAllPublicItems();
    if (itemView === "following") return base.filter((i) => followedSellerIds.includes(i.sellerId));
    return base;
  }, [saleFilterActive, itemView, followedSellerIds]);

  function togglePanel(key) { setOpenPanel((p) => p === key ? null : p === null ? key : key); }
  function toggle(setter, val) {
    setter((prev) => prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]);
  }
  function resetAll() {
    setCatFilters([]); setColorFilters([]); setSeasonFilters([]); setBrandFilters([]);
    setOpenPanel(null);
  }

  const colorOptions = useMemo(() => {
    const base = catFilters.length === 0 ? source : source.filter((i) => catFilters.includes(i.mainCategory ?? i.category));
    return [...new Set(base.map((i) => i.color).filter(Boolean))].sort();
  }, [source, catFilters]);

  const brandOptions = useMemo(() => {
    const counts = {};
    source.forEach((i) => { if (i.brand) counts[i.brand] = (counts[i.brand] ?? 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([b]) => b);
  }, [source]);

  const filtered = useMemo(() => {
    let items = source;
    if (catFilters.length    > 0) items = items.filter((i) => catFilters.includes(i.mainCategory ?? i.category));
    if (colorFilters.length  > 0) items = items.filter((i) => colorFilters.includes(i.color));
    if (seasonFilters.length > 0) items = items.filter((i) => (i.season ?? []).some((s) => seasonFilters.includes(s)));
    if (brandFilters.length  > 0) items = items.filter((i) => brandFilters.includes(i.brand));
    return items;
  }, [source, catFilters, colorFilters, seasonFilters, brandFilters]);

  const totalActive = catFilters.length + colorFilters.length + seasonFilters.length + brandFilters.length;

  function chipLabel(key) {
    if (key === "category") {
      if (catFilters.length === 0) return "카테고리";
      return catFilters.length === 1 ? catFilters[0] : `카테고리 ${catFilters.length}`;
    }
    if (key === "color")  return colorFilters.length  ? `색상 ${colorFilters.length}`   : "색상";
    if (key === "season") return seasonFilters.length ? `계절 ${seasonFilters.length}`  : "계절";
    if (key === "brand")  return brandFilters.length  ? `브랜드 ${brandFilters.length}` : "브랜드";
  }
  function chipActive(key) {
    if (key === "category") return catFilters.length > 0;
    if (key === "color")    return colorFilters.length > 0;
    if (key === "season")   return seasonFilters.length > 0;
    if (key === "brand")    return brandFilters.length > 0;
  }

  const CHIPS = ["category", "color", "season", "brand"];

  return (
    <div>
      {/* ── Segmented control: 전체 / 팔로우 중 ── */}
      <div className="px-4 pt-3 pb-1" style={{ borderBottom: "1px solid #F0F0F0" }}>
        <div className="flex rounded-xl p-1" style={{ backgroundColor: "#F0F0F0" }}>
          {[
            { id: "following", label: "팔로우 중" },
            { id: "all",       label: "전체"      },
          ].map(({ id, label }) => {
            const isAct = itemView === id;
            const followingCount = (() => {
              const base = saleFilterActive ? getAllForSaleItems() : getAllPublicItems();
              return base.filter((i) => followedSellerIds.includes(i.sellerId)).length;
            })();
            const showBadge = id === "following" && followingCount > 0;
            return (
              <button
                key={id}
                onClick={() => { setItemView(id); setFollowRev((n) => n + 1); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all active:opacity-80"
                style={{
                  backgroundColor: isAct ? "white" : "transparent",
                  boxShadow: isAct ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                }}
              >
                <span className="text-[13px]" style={{ color: isAct ? DARK : "#888", fontWeight: isAct ? 700 : 500, fontFamily: FONT }}>
                  {label}
                </span>
                {showBadge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: isAct ? DARK : "rgba(0,0,0,0.12)", color: isAct ? "white" : "#666", fontFamily: FONT, fontWeight: 700 }}>
                    {followingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sale mode banner */}
      {saleFilterActive && (
        <div
          className="flex items-center justify-between px-4 py-2.5 mx-4 mt-3 rounded-xl"
          style={{ backgroundColor: "rgba(245,194,0,0.12)", border: "1px solid rgba(245,194,0,0.3)" }}
        >
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 14 }}>🛍️</span>
            <span className="text-[12px] font-bold" style={{ color: "#9A7B00", fontFamily: FONT }}>
              판매중인 상품만 보는 중
            </span>
          </div>
          <button onClick={onSaleFilterClear} className="text-[11px] font-medium active:opacity-70" style={{ color: "#9A7B00", fontFamily: FONT }}>
            전체 보기
          </button>
        </div>
      )}

      {/* ── 필터 칩 row ── */}
      <div className="flex gap-2 px-4 pt-3 pb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {totalActive > 0 && (
          <button
            onClick={resetAll}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full active:opacity-70"
            style={{ backgroundColor: "#F2F2F2" }}
          >
            <span className="text-[11px] font-medium" style={{ color: "#888", fontFamily: FONT }}>초기화</span>
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path d="M1.5 1.5L7.5 7.5M7.5 1.5L1.5 7.5" stroke="#888" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        )}
        {CHIPS.map((key) => {
          const active = chipActive(key);
          const open   = openPanel === key;
          return (
            <button
              key={key}
              onClick={() => togglePanel(key)}
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full active:opacity-75"
              style={{ backgroundColor: active || open ? DARK : "#F2F2F2" }}
            >
              <span className="text-[12px] font-medium whitespace-nowrap" style={{ color: active || open ? "white" : "#555", fontFamily: FONT }}>
                {chipLabel(key)}
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s" }}>
                <path d="M2.5 4.5L6 8L9.5 4.5" stroke={active || open ? "white" : "#888"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          );
        })}
      </div>

      {/* ── 카테고리 패널 ── */}
      {openPanel === "category" && (
        <div className="px-4 pb-4 pt-3" style={{ borderTop: "1px solid #F0F0F0" }}>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => { setCatFilters([]); setOpenPanel(null); }}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl active:opacity-70"
              style={{ aspectRatio: "1", backgroundColor: catFilters.length === 0 ? DARK : "#F2F2F2" }}
            >
              <span style={{ fontSize: 20 }}>✨</span>
              <span className="text-[10px] font-medium" style={{ color: catFilters.length === 0 ? "white" : "#555", fontFamily: FONT }}>전체</span>
            </button>
            {CAT_LIST.slice(1).map((cat) => {
              const isActive = catFilters.includes(cat.label);
              return (
                <button key={cat.label}
                  onClick={() => toggle(setCatFilters, cat.label)}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl active:opacity-70"
                  style={{ aspectRatio: "1", backgroundColor: isActive ? DARK : "#F2F2F2" }}
                >
                  <span style={{ fontSize: 20 }}>{cat.emoji}</span>
                  <span className="text-[10px] font-medium" style={{ color: isActive ? "white" : "#555", fontFamily: FONT }}>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 색상 패널 ── */}
      {openPanel === "color" && (
        <div className="flex gap-4 px-4 pb-4 pt-3 overflow-x-auto" style={{ borderTop: "1px solid #F0F0F0", scrollbarWidth: "none" }}>
          {colorOptions.map((color) => {
            const isActive = colorFilters.includes(color);
            const hex      = COLOR_HEX[color] ?? "#CCCCCC";
            const light    = isLightColor(hex);
            return (
              <button key={color} onClick={() => toggle(setColorFilters, color)}
                className="shrink-0 flex flex-col items-center gap-1.5 active:opacity-70">
                <div className="rounded-full flex items-center justify-center" style={{
                  width: 32, height: 32, backgroundColor: hex,
                  border: isActive ? `2.5px solid ${DARK}` : light ? "1.5px solid rgba(0,0,0,0.15)" : "1.5px solid rgba(255,255,255,0.2)",
                  boxShadow: isActive ? "0 0 0 1.5px white inset" : "none",
                }}>
                  {isActive && (
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M2 5.5L4.5 8L9 3" stroke={light ? "#1a1a1a" : "white"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-[9px]" style={{ color: isActive ? DARK : "#AAAAAA", fontFamily: FONT, fontWeight: isActive ? 700 : 400 }}>{color}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── 계절 패널 ── */}
      {openPanel === "season" && (
        <div className="flex gap-2 px-4 pb-4 pt-3" style={{ borderTop: "1px solid #F0F0F0" }}>
          {SEASONS_PUB.map((s) => {
            const isActive = seasonFilters.includes(s);
            const emoji    = s === "봄" ? "🌸" : s === "여름" ? "☀️" : s === "가을" ? "🍂" : "❄️";
            return (
              <button key={s} onClick={() => toggle(setSeasonFilters, s)}
                className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl active:opacity-70"
                style={{ backgroundColor: isActive ? DARK : "#F2F2F2" }}>
                <span style={{ fontSize: 20 }}>{emoji}</span>
                <span className="text-[11px] font-medium" style={{ color: isActive ? "white" : "#555", fontFamily: FONT }}>{s}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── 브랜드 패널 ── */}
      {openPanel === "brand" && (
        <div className="flex gap-2.5 px-4 pb-4 pt-3 overflow-x-auto flex-wrap" style={{ borderTop: "1px solid #F0F0F0", scrollbarWidth: "none" }}>
          {brandOptions.map((brand) => {
            const isActive = brandFilters.includes(brand);
            return (
              <button key={brand} onClick={() => toggle(setBrandFilters, brand)}
                className="shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium active:opacity-70"
                style={{ backgroundColor: isActive ? DARK : "#F2F2F2", color: isActive ? "white" : "#555", fontFamily: FONT }}>
                {brand}
              </button>
            );
          })}
        </div>
      )}

      {/* Count */}
      <div className="px-4 py-2">
        <p className="text-[11px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>
          {totalActive > 0 ? `필터 적용 중 · ` : ""}
          {filtered.length}개 아이템{saleFilterActive ? " (판매중)" : ""}
        </p>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-2">
          <span style={{ fontSize: 36 }}>🔍</span>
          <p className="text-[13px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>해당 조건의 아이템이 없어요</p>
          <button onClick={resetAll} className="mt-1 px-4 py-1.5 rounded-full text-[12px] font-medium"
            style={{ backgroundColor: "#F2F2F2", color: "#555", fontFamily: FONT }}>필터 초기화</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pb-6">
          {filtered.map((item) => (
            <PublicItemCard
              key={`${item.id}-${item.sellerId}`}
              item={item}
              onTap={onItemTap}
              onSellerTap={onSellerTap}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 2. 스타일북 tab ────────────────────────────────────────────────────────────

function CodibookOutfitCard({ outfit, onTap, onSellerTap }) {
  const [liked, setLiked] = useState(() => isLiked(outfit.id));
  const [count, setCount] = useState(() => getLikeCount(outfit.id, outfit.likes ?? 0));

  function handleLike(e) {
    e.stopPropagation();
    const r = toggleLike(outfit.id, outfit.likes ?? 0);
    setLiked(r.liked);
    setCount(r.count);
  }

  const imgSrc = outfit.previewImage?.includes("unsplash.com")
    ? unsplashUrl(outfit.previewImage, 400)
    : outfit.previewImage;

  return (
    <div
      className="relative rounded-2xl overflow-hidden active:opacity-90 transition-opacity"
      style={{ aspectRatio: "3/4", backgroundColor: outfit.color || "#EEE", cursor: "pointer" }}
      onClick={() => onTap?.(outfit)}
    >
      <LazyImage
        src={imgSrc}
        alt={outfit.title}
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
        responsive={outfit.previewImage?.includes("unsplash.com")}
      />
      {/* Gradient */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.10) 55%, transparent 100%)" }}
      />
      {/* Like button */}
      <button
        onClick={handleLike}
        className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-full"
        style={{ backgroundColor: "rgba(0,0,0,0.28)", backdropFilter: "blur(6px)" }}
      >
        <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
          <path d="M6.5 11L1.5 6.3C1.06 5.86 1 5.18 1 4.5C1 3.12 2.12 2 3.5 2C4.3 2 5.02 2.41 5.5 3.04L6.5 4.19L7.5 3.04C7.98 2.41 8.7 2 9.5 2C10.88 2 12 3.12 12 4.5C12 5.18 11.94 5.86 11.5 6.3L6.5 11Z"
            fill={liked ? "#E84040" : "none"} stroke={liked ? "#E84040" : "rgba(255,255,255,0.85)"} strokeWidth="1.2" />
        </svg>
        <span className="text-[9px]" style={{ color: liked ? "#ff7070" : "rgba(255,255,255,0.85)", fontFamily: FONT }}>
          {count}
        </span>
      </button>
      {/* Style + season badge */}
      <div className="absolute top-2.5 left-2.5">
        <span
          className="px-2 py-0.5 rounded-full text-[9px] font-bold"
          style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "white", backdropFilter: "blur(6px)", fontFamily: FONT }}
        >
          {outfit.style}
        </span>
      </div>
      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
        <p className="text-[13px] font-bold text-white truncate mb-1" style={{ fontFamily: FONT }}>
          {outfit.title}
        </p>
        {/* Seller row */}
        {outfit.seller && (
          <button
            className="flex items-center gap-1.5 active:opacity-70"
            onClick={(e) => { e.stopPropagation(); onSellerTap?.(outfit.seller.id); }}
          >
            <SellerAvatar seller={outfit.seller} size={18} />
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.75)", fontFamily: FONT }}>
              {outfit.seller.displayName}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

function CodibookDiscoveryTab({ onOutfitTap, onSellerTap }) {
  const [outfitView,   setOutfitView]   = useState("all"); // "all" | "following"
  const [followRev,    setFollowRev]    = useState(0);
  const [styleFilter,  setStyleFilter]  = useState("전체");
  const [seasonFilter, setSeasonFilter] = useState("전체");
  const [openPanel,    setOpenPanel]    = useState(null); // "style" | "season"
  void followRev;

  const followedSellerIds = useMemo(
    () => SELLER_PROFILES.filter((s) => isFollowing(s.id)).map((s) => s.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [followRev]
  );

  const allOutfits = useMemo(() => {
    const base = getAllPublicOutfits();
    if (outfitView === "following") return base.filter((o) => followedSellerIds.includes(o.seller?.id));
    return base;
  }, [outfitView, followedSellerIds]);

  const followingCount = useMemo(
    () => getAllPublicOutfits().filter((o) => followedSellerIds.includes(o.seller?.id)).length,
    [followedSellerIds]
  );

  const filtered = allOutfits.filter((o) => {
    const styleOk  = styleFilter  === "전체" || o.style === styleFilter;
    const seasonOk = seasonFilter === "전체" || (o.season ?? []).includes(seasonFilter);
    return styleOk && seasonOk;
  });

  const styleActive  = styleFilter  !== "전체";
  const seasonActive = seasonFilter !== "전체";
  const totalActive  = (styleActive ? 1 : 0) + (seasonActive ? 1 : 0);

  function togglePanel(key) { setOpenPanel((p) => p === key ? null : key); }

  return (
    <div>
      {/* ── Segmented control: 팔로우 중 / 전체 ── */}
      <div className="px-4 pt-3 pb-1" style={{ borderBottom: "1px solid #F0F0F0" }}>
        <div className="flex rounded-xl p-1" style={{ backgroundColor: "#F0F0F0" }}>
          {[
            { id: "following", label: "팔로우 중" },
            { id: "all",       label: "전체"      },
          ].map(({ id, label }) => {
            const isAct = outfitView === id;
            const showBadge = id === "following" && followingCount > 0;
            return (
              <button
                key={id}
                onClick={() => { setOutfitView(id); setFollowRev((n) => n + 1); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all active:opacity-80"
                style={{
                  backgroundColor: isAct ? "white" : "transparent",
                  boxShadow: isAct ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                }}
              >
                <span className="text-[13px]" style={{ color: isAct ? DARK : "#888", fontWeight: isAct ? 700 : 500, fontFamily: FONT }}>
                  {label}
                </span>
                {showBadge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: isAct ? DARK : "rgba(0,0,0,0.12)", color: isAct ? "white" : "#666", fontFamily: FONT, fontWeight: 700 }}>
                    {followingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 필터 칩 row ── */}
      <div className="flex gap-2 px-4 pt-3 pb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {totalActive > 0 && (
          <button
            onClick={() => { setStyleFilter("전체"); setSeasonFilter("전체"); setOpenPanel(null); }}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full active:opacity-70"
            style={{ backgroundColor: "#F2F2F2" }}
          >
            <span className="text-[11px] font-medium" style={{ color: "#888", fontFamily: FONT }}>초기화</span>
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path d="M1.5 1.5L7.5 7.5M7.5 1.5L1.5 7.5" stroke="#888" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        )}

        {/* 스타일 chip */}
        {[
          { key: "style",  label: styleActive  ? styleFilter  : "스타일", active: styleActive },
          { key: "season", label: seasonActive ? seasonFilter : "시즌",   active: seasonActive },
        ].map(({ key, label, active }) => {
          const open = openPanel === key;
          return (
            <button key={key} onClick={() => togglePanel(key)}
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full active:opacity-75"
              style={{ backgroundColor: active || open ? DARK : "#F2F2F2" }}>
              <span className="text-[12px] font-medium whitespace-nowrap" style={{ color: active || open ? "white" : "#555", fontFamily: FONT }}>
                {label}
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s" }}>
                <path d="M2.5 4.5L6 8L9.5 4.5" stroke={active || open ? "white" : "#888"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          );
        })}
      </div>

      {/* ── 스타일 패널 ── */}
      {openPanel === "style" && (
        <div className="px-4 pb-4 pt-3 flex flex-wrap gap-2" style={{ borderTop: "1px solid #F0F0F0" }}>
          {STYLE_FILTER_OPTIONS.map((s) => {
            const isActive = styleFilter === s;
            return (
              <button key={s}
                onClick={() => { setStyleFilter(s); setOpenPanel(null); }}
                className="px-3.5 py-1.5 rounded-full text-[12px] font-medium active:opacity-70"
                style={{ backgroundColor: isActive ? DARK : "#F2F2F2", color: isActive ? "white" : "#555", fontFamily: FONT }}>
                {s}
              </button>
            );
          })}
        </div>
      )}

      {/* ── 시즌 패널 ── */}
      {openPanel === "season" && (
        <div className="flex gap-2 px-4 pb-4 pt-3" style={{ borderTop: "1px solid #F0F0F0" }}>
          {SEASON_FILTER_OPTIONS.map((s) => {
            const isActive = seasonFilter === s;
            const emoji    = s === "봄" ? "🌸" : s === "여름" ? "☀️" : s === "가을" ? "🍂" : s === "겨울" ? "❄️" : "✨";
            return (
              <button key={s}
                onClick={() => { setSeasonFilter(s); setOpenPanel(null); }}
                className="flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl active:opacity-70"
                style={{ backgroundColor: isActive ? DARK : "#F2F2F2" }}>
                <span style={{ fontSize: 18 }}>{emoji}</span>
                <span className="text-[11px] font-medium" style={{ color: isActive ? "white" : "#555", fontFamily: FONT }}>{s}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Count */}
      <div className="px-4 py-2">
        <p className="text-[11px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>
          {styleActive  ? `${styleFilter} · `  : ""}
          {seasonActive ? `${seasonFilter} · ` : ""}
          {filtered.length}개 스타일
        </p>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-2">
          <span style={{ fontSize: 36 }}>🔍</span>
          <p className="text-[13px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>해당 조건의 스타일이 없어요</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pb-6">
          {filtered.map((outfit) => (
            <CodibookOutfitCard
              key={`${outfit.id}-${outfit.seller?.id}`}
              outfit={outfit}
              onTap={onOutfitTap}
              onSellerTap={onSellerTap}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 3. 셀러 tab ──────────────────────────────────────────────────────────────

function SellerCard({ seller, onTap, onFollowChange, onOutfitPreviewTap, onItemPreviewTap }) {
  const [following,      setFollowing]      = useState(() => isFollowing(seller.id));
  const [localFollowers, setLocalFollowers] = useState(seller.followers);

  const sellerItems   = useMemo(() => getSellerItems(seller.id),   [seller.id]);
  const sellerOutfits = useMemo(() => getSellerOutfits(seller.id), [seller.id]);

  // Most-liked outfit (sort descending by likes)
  const topOutfit = useMemo(
    () => [...sellerOutfits].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))[0] ?? null,
    [sellerOutfits]
  );
  // Top 2 items
  const topItems = sellerItems.slice(0, 2);

  // Aggregate stats
  const totalHearts  = sellerOutfits.reduce((sum, o) => sum + (o.likes ?? 0), 0);
  const forSaleCount = sellerItems.filter((i) => i.isForSale).length;

  function handleFollow(e) {
    e.stopPropagation();
    const r = toggleFollow(seller.id);
    setFollowing(r.following);
    setLocalFollowers((n) => r.following ? n + 1 : n - 1);
    onFollowChange?.();
  }

  return (
    <button
      className="w-full text-left active:bg-gray-50 transition-colors"
      style={{ borderBottom: "1px solid #F0F0F0", backgroundColor: "white" }}
      onClick={() => onTap?.(seller)}
    >
      <div className="px-4 pt-4 pb-4">

        {/* ── Row 1: profile header ── */}
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-full overflow-hidden shrink-0" style={{ width: 46, height: 46, border: "2px solid #F0F0F0" }}>
            <LazyImage src={seller.profileImage} alt={seller.displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[15px] font-bold leading-tight" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>
                {seller.displayName}
              </p>
              {seller.verified && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6.5" fill={YELLOW} />
                  <path d="M4 7L6 9L10 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <p className="text-[12px] mt-0.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>@{seller.username}</p>
          </div>
          <button
            onClick={handleFollow}
            className="shrink-0 px-4 py-1.5 rounded-lg text-[12px] font-bold active:opacity-70 transition-opacity"
            style={{
              backgroundColor: following ? "#F5F5F5" : DARK,
              color:           following ? "#555"    : "white",
              border:          following ? "1.5px solid #E0E0E0" : "none",
              fontFamily: FONT, minWidth: 72,
            }}
          >
            {following ? "팔로잉" : "팔로우"}
          </button>
        </div>

        {/* ── Row 2: bio ── */}
        <p className="text-[13px] leading-snug mb-3"
          style={{ color: "#444", fontFamily: FONT, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {seller.bio}
        </p>

        {/* ── Row 3: [top outfit] [item1] [item2] ── */}
        <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden mb-3" style={{ height: 130 }}>
          {/* Most-liked outfit */}
          {topOutfit ? (
            <button
              className="relative overflow-hidden active:opacity-75"
              style={{ backgroundColor: "#F5F5F5" }}
              onClick={(e) => { e.stopPropagation(); onOutfitPreviewTap?.(topOutfit); }}
            >
              <LazyImage
                src={topOutfit.previewImage?.includes("unsplash.com") ? unsplashUrl(topOutfit.previewImage, 240) : topOutfit.previewImage}
                alt={topOutfit.title}
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
                responsive={topOutfit.previewImage?.includes("unsplash.com")}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)" }} />
              {/* "스타일" badge */}
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "rgba(0,0,0,0.50)" }}>
                <span className="text-[7px] font-bold text-white" style={{ fontFamily: FONT }}>스타일</span>
              </div>
              {/* Heart count */}
              <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5">
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path d="M5 8.5L1 4.7C0.6 4.3 0.6 3.7 0.6 3.3C0.6 2.2 1.6 1.5 2.8 1.5C3.4 1.5 4 1.8 4.4 2.3L5 2.9L5.6 2.3C6 1.8 6.6 1.5 7.2 1.5C8.4 1.5 9.4 2.2 9.4 3.3C9.4 3.7 9.3 4.3 9 4.7L5 8.5Z"
                    fill="rgba(255,120,120,0.9)" />
                </svg>
                <span className="text-[8px] font-bold" style={{ color: "rgba(255,255,255,0.9)", fontFamily: FONT }}>{topOutfit.likes ?? 0}</span>
              </div>
            </button>
          ) : (
            <div style={{ backgroundColor: "#F0F0F0" }} />
          )}

          {/* Top 2 items */}
          {topItems.map((item) => {
            const src = item.image?.includes("unsplash.com") ? unsplashUrl(item.image, 240) : item.image;
            return (
              <button
                key={item.id}
                className="relative overflow-hidden active:opacity-75"
                style={{ backgroundColor: "#F5F5F5" }}
                onClick={(e) => { e.stopPropagation(); onItemPreviewTap?.(toProductShape(item)); }}
              >
                <LazyImage
                  src={src}
                  alt={item.displayName ?? item.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
                  responsive={item.image?.includes("unsplash.com")}
                />
              </button>
            );
          })}
          {topItems.length < 2 && Array(2 - topItems.length).fill(0).map((_, i) => (
            <div key={`ph-${i}`} style={{ backgroundColor: "#F0F0F0" }} />
          ))}
        </div>

        {/* ── Row 4: stats ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[11px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>
            팔로워 <span style={{ color: "#555", fontWeight: 700 }}>{localFollowers.toLocaleString()}</span>
          </span>
          <span className="text-[11px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>
            아이템 <span style={{ color: "#555", fontWeight: 700 }}>{sellerItems.length}</span>
          </span>
          <span className="text-[11px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>
            하트 <span style={{ color: "#555", fontWeight: 700 }}>{totalHearts.toLocaleString()}</span>
          </span>
          <span className="text-[11px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>
            판매중 <span style={{ color: forSaleCount > 0 ? DARK : "#AAAAAA", fontWeight: 700 }}>{forSaleCount}</span>
          </span>
        </div>
      </div>
    </button>
  );
}

function SellerListTab({ onSellerTap, onOutfitPreviewTap, onItemPreviewTap }) {
  const [sellerView,     setSellerView]     = useState("all"); // "all" | "following"
  const [followRevision, setFollowRevision] = useState(0);

  const followed  = SELLER_PROFILES.filter((s) => isFollowing(s.id));
  void followRevision; // intentional — forces re-render on follow toggle

  const displayed = sellerView === "all" ? SELLER_PROFILES : followed;

  return (
    <div>
      {/* ── Segmented control ── */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid #F0F0F0" }}>
        <div
          className="flex rounded-xl p-1"
          style={{ backgroundColor: "#F0F0F0" }}
        >
          {[
            { id: "following", label: "팔로우 중", count: followed.length },
            { id: "all",       label: "전체 셀러", count: null            },
          ].map(({ id, label, count }) => {
            const isAct = sellerView === id;
            return (
              <button
                key={id}
                onClick={() => setSellerView(id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all active:opacity-80"
                style={{
                  backgroundColor: isAct ? "white" : "transparent",
                  boxShadow: isAct ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                }}
              >
                <span
                  className="text-[13px]"
                  style={{ color: isAct ? DARK : "#888", fontWeight: isAct ? 700 : 500, fontFamily: FONT }}
                >
                  {label}
                </span>
                {count !== null && count > 0 && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: isAct ? DARK : "rgba(0,0,0,0.12)",
                      color: isAct ? "white" : "#666",
                      fontFamily: FONT,
                      fontWeight: 700,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-2 px-6">
          <span style={{ fontSize: 40 }}>👤</span>
          <p className="text-[14px] font-bold text-center" style={{ color: "#1a1a1a", fontFamily: FONT }}>
            팔로우 중인 셀러가 없어요
          </p>
          <p className="text-[12px] text-center leading-relaxed" style={{ color: "#AAAAAA", fontFamily: FONT }}>
            마음에 드는 셀러를 팔로우하면<br />여기에 모아볼 수 있어요
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {displayed.map((seller) => (
            <SellerCard
              key={seller.id}
              seller={seller}
              onTap={onSellerTap}
              onFollowChange={() => setFollowRevision((n) => n + 1)}
              onOutfitPreviewTap={onOutfitPreviewTap}
              onItemPreviewTap={onItemPreviewTap}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sub-tab bar ──────────────────────────────────────────────────────────────

const SUB_TABS = [
  { id: "sellers",  label: "셀러"       },
  { id: "items",    label: "공개 아이템" },
  { id: "codebook", label: "스타일북"     },
];

function SubTabBar({ active, onChange }) {
  return (
    <div
      className="flex shrink-0"
      style={{ borderBottom: "2px solid #F0F0F0", backgroundColor: "white" }}
    >
      {SUB_TABS.map(({ id, label }) => {
        const isAct = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="flex-1 flex flex-col items-center pt-3 pb-0"
          >
            <span
              className="text-[13px] pb-2.5"
              style={{ color: isAct ? DARK : "#AAAAAA", fontFamily: FONT, fontWeight: isAct ? 700 : 400 }}
            >
              {label}
            </span>
            <div style={{ height: 2, width: "100%", backgroundColor: isAct ? DARK : "transparent", borderRadius: 1 }} />
          </button>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DiscoveryPage({ initialTab }) {
  const [subTab,          setSubTab]          = useState(initialTab ?? "sellers"); // "sellers" | "items" | "codebook"
  const [saleFilterActive, setSaleFilterActive] = useState(false);

  useEffect(() => {
    if (initialTab) setSubTab(initialTab);
  }, [initialTab]);

  // Overlay state
  const [selectedItem,    setSelectedItem]    = useState(null);  // product shape
  const [selectedOutfit,  setSelectedOutfit]  = useState(null);  // outfit object
  const [selectedSeller,  setSelectedSeller]  = useState(null);  // seller profile

  // Resolve full seller profile from id (used when tapping a seller mini-stub)
  const openSeller = useCallback((sellerIdOrObj) => {
    if (typeof sellerIdOrObj === "string") {
      const seller = SELLER_PROFILES.find((s) => s.id === sellerIdOrObj);
      if (seller) setSelectedSeller(seller);
    } else {
      setSelectedSeller(sellerIdOrObj);
    }
  }, []);

  function handleSaleFilterActivate() {
    if (saleFilterActive) {
      setSaleFilterActive(false); // 이미 활성 상태면 해제 → 전체로 복귀
    } else {
      setSaleFilterActive(true);
      setSubTab("items");
    }
  }

  return (
    <div className="relative flex flex-col h-full bg-white overflow-hidden">

      {/* ── Overlays ── */}
      {/* SellerProfilePage manages its own item/outfit sub-overlays internally */}
      {selectedSeller && (
        <SellerProfilePage
          seller={selectedSeller}
          onBack={() => setSelectedSeller(null)}
        />
      )}
      {/* Direct outfit detail (from 스타일북 tab, no seller context) */}
      {selectedOutfit && (
        <OutfitDetailScreen
          outfit={selectedOutfit}
          onBack={() => setSelectedOutfit(null)}
        />
      )}
      {/* Direct item detail (from 공개 아이템 tab, no seller context) */}
      {selectedItem && (
        <ProductDetailPage
          product={selectedItem}
          onBack={() => setSelectedItem(null)}
        />
      )}

      {/* ── Header ── */}
      <div
        className="shrink-0 flex items-center justify-between px-5 pt-4 pb-3 bg-white"
        style={{ borderBottom: "1px solid #F5F5F5" }}
      >
        <div>
          <p
            className="text-[11px] font-bold tracking-[0.14em] uppercase"
            style={{ color: "#AAAAAA", fontFamily: FONT }}
          >
            DISCOVER
          </p>
          <h1
            className="text-[20px] font-bold leading-tight"
            style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.03em" }}
          >
            남의 옷장 둘러보기
          </h1>
        </div>
        {/* 판매중인 상품 모아보기 CTA */}
        <button
          onClick={handleSaleFilterActivate}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl active:opacity-70"
          style={{
            backgroundColor: saleFilterActive ? YELLOW       : "rgba(245,194,0,0.12)",
            border:          saleFilterActive ? "1.5px solid #D4A800" : "1.5px solid rgba(245,194,0,0.4)",
          }}
        >
          <span style={{ fontSize: 13 }}>🛍️</span>
          <span
            className="text-[11px] font-bold"
            style={{ color: saleFilterActive ? DARK : "#9A7B00", fontFamily: FONT, lineHeight: 1.2 }}
          >
            판매중인 상품
          </span>
        </button>
      </div>

      {/* ── Sub-tab switcher ── */}
      <SubTabBar active={subTab} onChange={(id) => { setSubTab(id); if (id !== "items") setSaleFilterActive(false); }} />

      {/* ── Scrollable content area ── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {subTab === "items" && (
          <PublicItemsTab
            onItemTap={setSelectedItem}
            onSellerTap={openSeller}
            saleFilterActive={saleFilterActive}
            onSaleFilterClear={() => setSaleFilterActive(false)}
          />
        )}
        {subTab === "codebook" && (
          <CodibookDiscoveryTab
            onOutfitTap={setSelectedOutfit}
            onSellerTap={openSeller}
          />
        )}
        {subTab === "sellers" && (
          <SellerListTab
            onSellerTap={openSeller}
            onOutfitPreviewTap={setSelectedOutfit}
            onItemPreviewTap={setSelectedItem}
          />
        )}
      </div>
    </div>
  );
}
