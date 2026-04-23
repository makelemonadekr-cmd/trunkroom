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

import { useState, useCallback } from "react";
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

/** Filter chip row — horizontal scroll */
function FilterRow({ options, active, onChange, accent = DARK }) {
  return (
    <div className="flex overflow-x-auto gap-2 px-4" style={{ scrollbarWidth: "none" }}>
      {options.map((f) => {
        const isAct = active === f;
        return (
          <button
            key={f}
            onClick={() => onChange(f)}
            className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all"
            style={{
              backgroundColor: isAct ? accent : "#F2F2F2",
              color: isAct ? (accent === YELLOW ? DARK : "white") : "#555",
              fontFamily: FONT,
              border: isAct ? `1.5px solid ${accent}` : "1.5px solid transparent",
              whiteSpace: "nowrap",
            }}
          >
            {f}
          </button>
        );
      })}
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
              className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md"
              style={{ backgroundColor: YELLOW }}
            >
              <span className="text-[8px] font-bold" style={{ color: DARK, fontFamily: FONT }}>판매중</span>
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
          {item.isForSale && item.price > 0 ? (
            <p className="text-[12px] font-bold mt-0.5" style={{ color: DARK, fontFamily: FONT }}>
              {item.price.toLocaleString()}원
            </p>
          ) : (
            <p className="text-[11px] mt-0.5" style={{ color: "#BBBBBB", fontFamily: FONT }}>
              {item.color} · {item.size}
            </p>
          )}
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
  { label: "전체",    emoji: "✨" },
  { label: "상의",    emoji: "👕" },
  { label: "하의",    emoji: "👖" },
  { label: "아우터",  emoji: "🧥" },
  { label: "원피스",  emoji: "👗" },
  { label: "신발",    emoji: "👟" },
  { label: "가방",    emoji: "👜" },
  { label: "액세서리",emoji: "💍" },
  { label: "스포츠",  emoji: "🎽" },
];

function PublicItemsTab({ onItemTap, onSellerTap, saleFilterActive, onSaleFilterClear }) {
  const [catFilter, setCatFilter] = useState("전체");

  const source = saleFilterActive ? getAllForSaleItems() : getAllPublicItems();

  const filtered = catFilter === "전체"
    ? source
    : source.filter((i) => (i.mainCategory ?? i.category) === catFilter);

  return (
    <div>
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
          <button
            onClick={onSaleFilterClear}
            className="text-[11px] font-medium active:opacity-70"
            style={{ color: "#9A7B00", fontFamily: FONT }}
          >
            전체 보기
          </button>
        </div>
      )}

      {/* Category filter — emoji square buttons (horizontal scroll) */}
      <div
        className="flex overflow-x-auto gap-2.5 py-3"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", paddingLeft: 16, paddingRight: 16 }}
      >
        {CAT_LIST.map((cat) => {
          const isActive = catFilter === cat.label;
          return (
            <button
              key={cat.label}
              onClick={() => setCatFilter(cat.label)}
              className="shrink-0 flex flex-col items-center justify-center gap-1.5 rounded-xl transition-all active:scale-95"
              style={{
                width: 62,
                height: 62,
                backgroundColor: isActive ? DARK : "#F5F5F5",
                transform: isActive ? "scale(0.96)" : "scale(1)",
              }}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>{cat.emoji}</span>
              <span
                className="text-[10px] font-medium"
                style={{ color: isActive ? "white" : "#555", fontFamily: FONT }}
              >
                {cat.label}
              </span>
            </button>
          );
        })}
        <div className="shrink-0 w-1" />
      </div>

      {/* Count */}
      <div className="px-4 pb-2">
        <p className="text-[11px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>
          {catFilter !== "전체" ? `${catFilter} · ` : ""}
          {filtered.length}개 아이템
          {saleFilterActive ? " (판매중)" : ""}
        </p>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-2">
          <span style={{ fontSize: 36 }}>🔍</span>
          <p className="text-[13px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>해당 카테고리 아이템이 없어요</p>
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
  const [styleFilter,  setStyleFilter]  = useState("전체");
  const [seasonFilter, setSeasonFilter] = useState("전체");

  const allOutfits = getAllPublicOutfits();

  const filtered = allOutfits.filter((o) => {
    const styleOk  = styleFilter  === "전체" || o.style === styleFilter;
    const seasonOk = seasonFilter === "전체" || (o.season ?? []).includes(seasonFilter);
    return styleOk && seasonOk;
  });

  return (
    <div>
      {/* Style filter */}
      <div className="pt-3 pb-2">
        <p className="px-4 text-[10px] font-bold tracking-[0.12em] uppercase mb-2" style={{ color: "#AAAAAA", fontFamily: FONT }}>스타일</p>
        <FilterRow options={STYLE_FILTER_OPTIONS} active={styleFilter} onChange={setStyleFilter} />
      </div>
      {/* Season filter */}
      <div className="pt-1 pb-3" style={{ borderBottom: "1px solid #F0F0F0" }}>
        <p className="px-4 text-[10px] font-bold tracking-[0.12em] uppercase mb-2" style={{ color: "#AAAAAA", fontFamily: FONT }}>시즌</p>
        <FilterRow options={SEASON_FILTER_OPTIONS} active={seasonFilter} onChange={setSeasonFilter} accent={YELLOW} />
      </div>
      {/* Count */}
      <div className="px-4 py-2">
        <p className="text-[11px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>
          {styleFilter !== "전체" ? `${styleFilter} · ` : ""}
          {seasonFilter !== "전체" ? `${seasonFilter} · ` : ""}
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

function SellerCard({ seller, onTap, onFollowChange }) {
  const [following,      setFollowing]      = useState(() => isFollowing(seller.id));
  const [localFollowers, setLocalFollowers] = useState(seller.followers);

  const previewItems = getSellerItems(seller.id).slice(0, 3);

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
          {/* Avatar */}
          <div
            className="rounded-full overflow-hidden shrink-0"
            style={{ width: 46, height: 46, border: "2px solid #F0F0F0" }}
          >
            <LazyImage
              src={seller.profileImage}
              alt={seller.displayName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          {/* Name + username */}
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
            <p className="text-[12px] mt-0.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>
              @{seller.username}
            </p>
          </div>

          {/* Follow button */}
          <button
            onClick={handleFollow}
            className="shrink-0 px-4 py-1.5 rounded-lg text-[12px] font-bold active:opacity-70 transition-opacity"
            style={{
              backgroundColor: following ? "#F5F5F5" : DARK,
              color:           following ? "#555"    : "white",
              border:          following ? "1.5px solid #E0E0E0" : "none",
              fontFamily:      FONT,
              minWidth: 72,
            }}
          >
            {following ? "팔로잉" : "팔로우"}
          </button>
        </div>

        {/* ── Row 2: bio ── */}
        <p
          className="text-[13px] leading-snug mb-3"
          style={{
            color: "#444",
            fontFamily: FONT,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {seller.bio}
        </p>

        {/* ── Row 3: item thumbnail strip ── */}
        <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden mb-3" style={{ height: 130 }}>
          {previewItems.map((item) => {
            const src = item.image?.includes("unsplash.com")
              ? unsplashUrl(item.image, 240)
              : item.image;
            return (
              <div key={item.id} className="overflow-hidden" style={{ backgroundColor: "#F5F5F5" }}>
                <LazyImage
                  src={src}
                  alt={item.displayName ?? item.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
                  responsive={item.image?.includes("unsplash.com")}
                />
              </div>
            );
          })}
          {previewItems.length < 3 &&
            Array(3 - previewItems.length).fill(0).map((_, i) => (
              <div key={`ph-${i}`} style={{ backgroundColor: "#F0F0F0" }} />
            ))
          }
        </div>

        {/* ── Row 4: stats row ── */}
        <div className="flex items-center gap-4">
          <span
            className="text-[9px] px-2 py-0.5 rounded-full font-bold"
            style={{ backgroundColor: "rgba(245,194,0,0.14)", color: "#9A7B00", fontFamily: FONT }}
          >
            {seller.styleLabel}
          </span>
          <span className="text-[11px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>
            팔로워 <span style={{ color: "#555", fontWeight: 700 }}>{localFollowers.toLocaleString()}</span>
          </span>
          <span className="text-[11px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>
            아이템 <span style={{ color: "#555", fontWeight: 700 }}>{previewItems.length > 0 ? getSellerItems(seller.id).length : 0}</span>
          </span>
          <div className="flex items-center gap-1 ml-auto">
            <span style={{ fontSize: 11 }}>⭐</span>
            <span className="text-[11px] font-bold" style={{ color: DARK, fontFamily: FONT }}>{seller.rating}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function SellerListTab({ onSellerTap }) {
  const [sellerView,     setSellerView]     = useState("all"); // "all" | "following"
  const [followRevision, setFollowRevision] = useState(0);     // bumped on any follow toggle

  // Re-read localStorage on each revision so the "팔로우 중" list stays current
  const followed   = SELLER_PROFILES.filter((s) => isFollowing(s.id));
  // followRevision is read in the filter call above — eslint might warn but it is intentional
  void followRevision;

  const displayed  = sellerView === "all" ? SELLER_PROFILES : followed;

  return (
    <div>
      {/* all / following toggle */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid #F0F0F0" }}>
        {[
          { id: "all",       label: "전체 셀러",   count: SELLER_PROFILES.length },
          { id: "following", label: "팔로우 중",   count: followed.length },
        ].map(({ id, label, count }) => {
          const isAct = sellerView === id;
          return (
            <button
              key={id}
              onClick={() => setSellerView(id)}
              className="px-4 py-1.5 rounded-full text-[12px] font-bold transition-all"
              style={{
                backgroundColor: isAct ? DARK    : "#F2F2F2",
                color:           isAct ? "white" : "#777",
                fontFamily:      FONT,
              }}
            >
              {label}
              {count > 0 && (
                <span
                  className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: isAct ? "rgba(255,255,255,0.25)" : "#E0E0E0", color: isAct ? "white" : "#888" }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
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

export default function DiscoveryPage() {
  const [subTab,          setSubTab]          = useState("sellers"); // "sellers" | "items" | "codebook"
  const [saleFilterActive, setSaleFilterActive] = useState(false);

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
    setSaleFilterActive(true);
    setSubTab("items");
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
          style={{ backgroundColor: "rgba(245,194,0,0.12)", border: "1.5px solid rgba(245,194,0,0.4)" }}
        >
          <span style={{ fontSize: 13 }}>🛍️</span>
          <span
            className="text-[11px] font-bold"
            style={{ color: "#9A7B00", fontFamily: FONT, lineHeight: 1.2 }}
          >
            판매중
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
          <SellerListTab onSellerTap={openSeller} />
        )}
      </div>
    </div>
  );
}
