import { useState, useEffect } from "react";
import FullListScreen from "./FullListScreen";
import AddClosetItemScreen from "../sell/AddClosetItemScreen";
import OutfitDetailScreen from "../../components/OutfitDetailScreen";
import CoordiEditorPage from "../codi/CoordiEditorPage";
import MySizePage from "./MySizePage";
import LazyImage from "../../components/LazyImage";
import { getAllCoordi, deleteCoordi } from "../../lib/coordiStore";
import StylebookDetailScreen from "../../components/StylebookDetailScreen";
import { isLiked, getLikeCount, toggleLike } from "../../lib/likesStore";
import {
  MAIN_CATEGORIES,
  CLOSET_ITEMS,
  getItemsByCategory,
} from "../../constants/mockClosetData";
import { STYLE_FILTER_OPTIONS } from "../../constants/styleCategories";
import { SEASON_FILTER_OPTIONS } from "../../constants/seasonFilters";
import { getOutfitsByStyleAndSeason } from "../../constants/mockOutfitData";
import { useFavorites } from "../../lib/favoritesStore";

const YELLOW = "#F5C200";
const DARK   = "#1a1a1a";
const FONT   = "'Spoqa Han Sans Neo', sans-serif";

// ─── Category list: "전체" + all main categories ──────────────────────────────
const CAT_ALL = { id: "전체", label: "전체", emoji: "✨" };
const CAT_SWIPE_LIST = [CAT_ALL, ...MAIN_CATEGORIES];

// ─── Closet header ────────────────────────────────────────────────────────────
function ClosetHeader() {
  return (
    <div
      className="flex items-center justify-between px-5 bg-white shrink-0"
      style={{ height: 50, borderBottom: "1px solid #F0F0F0" }}
    >
      <div style={{ width: 34 }} />
      <h1
        className="text-[17px] font-bold"
        style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}
      >
        옷장
      </h1>
      <button className="w-[34px] h-[34px] flex items-center justify-center">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="3" stroke={DARK} strokeWidth="1.5" />
          <path d="M11 2V4M11 18V20M2 11H4M18 11H20M4.22 4.22L5.64 5.64M16.36 16.36L17.78 17.78M4.22 17.78L5.64 16.36M16.36 5.64L17.78 4.22" stroke={DARK} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────
function ProfileSection({ onSizePress }) {
  return (
    <div className="px-5 py-3.5 bg-white" style={{ borderBottom: "1px solid #F0F0F0" }}>
      <div className="flex items-center gap-4">
        <div
          className="flex items-center justify-center rounded-full shrink-0"
          style={{ width: 52, height: 52, backgroundColor: "#EBEBEB" }}
        >
          <img
            src="/officiallogo.png"
            alt="avatar"
            style={{ width: 28, height: 28, objectFit: "contain", opacity: 0.55 }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-[15px] font-bold truncate"
            style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}
          >
            나의 옷장
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[11px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>
              팔로워 <span style={{ color: "#555", fontWeight: 700 }}>2,125</span>
            </span>
            <span style={{ color: "#E0E0E0", fontSize: 10 }}>·</span>
            <span className="text-[11px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>
              팔로잉 <span style={{ color: "#555", fontWeight: 700 }}>835</span>
            </span>
          </div>
        </div>
        <button
          onClick={onSizePress}
          className="flex items-center gap-1 px-3 py-1.5 rounded-sm shrink-0 active:opacity-70"
          style={{ backgroundColor: "#F5F5F5", border: "1px solid #E8E8E8" }}
        >
          <span className="text-[12px] font-medium" style={{ color: "#333", fontFamily: FONT }}>내 사이즈</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2.5L7.5 6L4 9.5" stroke="#888" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Stats bar ───────────────────────────────────────────────────────────────
function SubStats() {
  const stats = [
    { label: "옷장의류", value: `${CLOSET_ITEMS.length}` },
    { label: "공개의류", value: "105" },
    { label: "팔로워",   value: "2,125" },
    { label: "후기",     value: "34"  },
  ];
  return (
    <div
      className="flex items-stretch bg-white"
      style={{ borderBottom: "1px solid #F0F0F0" }}
    >
      {stats.map((s, i) => (
        <div key={s.label} className="flex-1 flex flex-col items-center py-2 relative">
          {i > 0 && (
            <div
              className="absolute left-0 top-1.5 bottom-1.5"
              style={{ width: 1, backgroundColor: "#EEEEEE" }}
            />
          )}
          <p
            className="text-[13px] font-bold"
            style={{ color: s.highlight ? YELLOW : DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}
          >
            {s.value}
          </p>
          <p
            className="text-[9px] mt-0.5"
            style={{ color: "#BBBBBB", fontFamily: FONT }}
          >
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Sub-tabs ────────────────────────────────────────────────────────────────
function SubTabs({ active, onChange }) {
  const tabs = [
    { id: "clothing", label: "내 아이템" },
    { id: "codebook", label: "스타일북"  },
  ];
  return (
    <div className="flex bg-white" style={{ borderBottom: "1px solid #F0F0F0" }}>
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex-1 flex flex-col items-center pt-3 pb-0"
          >
            <span
              className="text-[13px] pb-2.5"
              style={{
                color:      isActive ? DARK : "#AAAAAA",
                fontFamily: FONT,
                fontWeight: isActive ? 700 : 400,
              }}
            >
              {tab.label}
            </span>
            <div
              style={{
                height:          2,
                width:           "100%",
                backgroundColor: isActive ? DARK : "transparent",
                borderRadius:    1,
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

// ─── Clothing item card with favorite heart ───────────────────────────────────
function ClothingItemCard({ item, onSelect }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(item.id);

  const imageSrc = item.image;

  return (
    <div
      className="rounded-xl overflow-hidden bg-white"
      style={{ border: "1px solid #F0F0F0", cursor: onSelect ? "pointer" : "default" }}
      onClick={() => onSelect?.(item)}
    >
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: "3/4" }}
      >
        <LazyImage
          src={imageSrc}
          alt={item.displayName ?? item.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
          crossOrigin="anonymous"
        />

        {/* Subcategory badge — bottom-left */}
        <div
          className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
        >
          <span className="text-[8px] font-bold text-white" style={{ fontFamily: FONT }}>
            {item.subcategory ?? item.subCategory}
          </span>
        </div>

        {/* Sale badge */}
        {item.isForSale && (
          <div
            className="absolute bottom-1.5 right-8 px-1.5 py-0.5 rounded-md"
            style={{ backgroundColor: YELLOW }}
          >
            <span className="text-[8px] font-bold" style={{ color: DARK, fontFamily: FONT }}>판매중</span>
          </div>
        )}

        {/* Favorite heart — top-right (spec #6) */}
        <button
          className="absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.88)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { e.stopPropagation(); toggleFavorite(item, "my_closet"); }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 12L1.5 6.5C1 6 1 5.5 1 4.8C1 3.2 2.5 2 4.2 2C5.1 2 5.9 2.5 6.5 3.1L7 3.7L7.5 3.1C8.1 2.5 8.9 2 9.8 2C11.5 2 13 3.2 13 4.8C13 5.5 12.9 6 12.5 6.5L7 12Z"
              fill={fav ? "#E84040" : "none"}
              stroke={fav ? "#E84040" : "#AAAAAA"}
              strokeWidth="1.3"
            />
          </svg>
        </button>
      </div>

      <div className="px-2 pt-1.5 pb-2.5">
        <p
          className="text-[9px] uppercase tracking-wide truncate"
          style={{ color: "#AAAAAA", fontFamily: FONT }}
        >
          {item.brand}
        </p>
        <p
          className="text-[11px] font-medium mt-0.5 truncate"
          style={{ color: DARK, fontFamily: FONT }}
        >
          {item.name}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: "#BBBBBB", fontFamily: FONT }}>
          {item.color} · {item.size}
        </p>
      </div>
    </div>
  );
}

// ─── Emoji-style category swipe row (spec #3) ─────────────────────────────────
function CategorySwipeRow({ active, onChange }) {
  return (
    <div
      className="flex overflow-x-auto gap-2.5 py-3"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        scrollSnapType: "x mandatory",
        paddingLeft: 20,
        paddingRight: 20,
      }}
    >
      {CAT_SWIPE_LIST.map((cat) => {
        const isActive = active === cat.label;
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.label)}
            className="shrink-0 flex flex-col items-center justify-center gap-1.5 rounded-xl transition-all"
            style={{
              width:           62,
              height:          62,
              backgroundColor: isActive ? DARK : "#F5F5F5",
              scrollSnapAlign: "start",
              transform:       isActive ? "scale(0.96)" : "scale(1)",
            }}
          >
            <span style={{ fontSize: 22 }}>{cat.emoji}</span>
            <span
              className="text-[10px] font-medium"
              style={{ color: isActive ? "white" : "#555", fontFamily: FONT }}
            >
              {cat.label}
            </span>
          </button>
        );
      })}
      <div className="shrink-0 w-2" />
    </div>
  );
}

// ─── 내 아이템 tab ────────────────────────────────────────────────────────────
function ClothingTab({ onMorePress, onItemSelect }) {
  const [catFilter, setCatFilter] = useState("전체");

  const filtered =
    catFilter === "전체" ? CLOSET_ITEMS : getItemsByCategory(catFilter);

  return (
    <div>
      {/* emoji swipe row */}
      <div className="bg-white" style={{ borderBottom: "1px solid #F4F4F4" }}>
        <CategorySwipeRow active={catFilter} onChange={setCatFilter} />
      </div>

      {/* Count + more button */}
      <div className="flex items-center justify-between px-5 py-2.5">
        <p className="text-[12px] font-medium" style={{ color: "#888", fontFamily: FONT }}>
          {catFilter === "전체" ? "전체" : catFilter} {filtered.length}개
        </p>
        {filtered.length > 0 && (
          <button
            onClick={() =>
              onMorePress({
                title: catFilter === "전체" ? "전체 아이템" : catFilter,
                items: filtered,
              })
            }
            className="flex items-center gap-0.5"
          >
            <span className="text-[12px]" style={{ color: "#888", fontFamily: FONT }}>더보기</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3L9 7L5 11" stroke="#888" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Item grid */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        {filtered.slice(0, 8).map((item) => (
          <ClothingItemCard key={item.id} item={item} onSelect={onItemSelect} />
        ))}
      </div>

      {filtered.length > 8 && (
        <div className="px-4 pb-6">
          <button
            onClick={() =>
              onMorePress({
                title: catFilter === "전체" ? "전체 아이템" : catFilter,
                items: filtered,
              })
            }
            className="w-full py-3 rounded-xl text-[13px] font-bold"
            style={{
              backgroundColor: "#F5F5F5",
              color:           "#555",
              fontFamily:      FONT,
              border:          "1px solid #EBEBEB",
            }}
          >
            {filtered.length - 8}개 더보기
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Community outfit card (used in CodibookTab → 커뮤니티 view) ─────────────
function CommunityOutfitCard({ outfit, onTap }) {
  const [liked, setLiked] = useState(() => isLiked(outfit.id));
  const [count, setCount] = useState(() => getLikeCount(outfit.id, outfit.likes ?? 0));

  function handleLike(e) {
    e.stopPropagation();
    const result = toggleLike(outfit.id, outfit.likes ?? 0);
    setLiked(result.liked);
    setCount(result.count);
  }

  const imgSrc = outfit.previewImage;

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
      />
      {/* Gradient */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.10) 55%, transparent 100%)" }}
      />
      {/* Top: style badge + like */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between">
        <span
          className="px-2 py-0.5 rounded-full text-[9px] font-bold"
          style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "white", backdropFilter: "blur(6px)", fontFamily: FONT }}
        >
          {outfit.style}
        </span>
        <button
          onClick={handleLike}
          className="flex items-center gap-1 px-2 py-1 rounded-full"
          style={{ backgroundColor: "rgba(0,0,0,0.28)", backdropFilter: "blur(6px)" }}
        >
          <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
            <path
              d="M6.5 11L1.5 6.3C1.06 5.86 1 5.18 1 4.5C1 3.12 2.12 2 3.5 2C4.3 2 5.02 2.41 5.5 3.04L6.5 4.19L7.5 3.04C7.98 2.41 8.7 2 9.5 2C10.88 2 12 3.12 12 4.5C12 5.18 11.94 5.86 11.5 6.3L6.5 11Z"
              fill={liked ? "#E84040" : "none"}
              stroke={liked ? "#E84040" : "rgba(255,255,255,0.85)"}
              strokeWidth="1.2"
            />
          </svg>
          <span className="text-[9px] font-medium" style={{ color: liked ? "#ff7070" : "rgba(255,255,255,0.85)", fontFamily: FONT }}>
            {count}
          </span>
        </button>
      </div>
      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
        <p className="text-[12px] font-bold text-white truncate mb-1" style={{ fontFamily: FONT }}>
          {outfit.title}
        </p>
        <div className="flex flex-wrap gap-1">
          {(outfit.tags ?? []).slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[8px] px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.13)", color: "rgba(255,255,255,0.78)", fontFamily: FONT }}
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 스타일북 tab ───────────────────────────────────────────────────────────────
function CodibookTab({ onOutfitTap, onViewMyCoordi, onEditMyCoordi, myCoordiRefresh }) {
  const [codebookView, setCodebookView] = useState("mine");       // "mine" | "community"
  const [styleFilter,  setStyleFilter]  = useState("전체");
  const [seasonFilter, setSeasonFilter] = useState("전체");
  const [myCoordi,     setMyCoordi]     = useState(() => getAllCoordi());
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Reload my coordi whenever the editor closes
  useEffect(() => {
    setMyCoordi(getAllCoordi());
  }, [myCoordiRefresh]);

  // Community outfits — likes persisted via likesStore
  const filtered = getOutfitsByStyleAndSeason(styleFilter, seasonFilter);

  function handleDeleteMyCoordi(id) {
    deleteCoordi(id);
    setMyCoordi(getAllCoordi());
    setDeleteConfirm(null);
  }

  return (
    <div>
      {/* ── Sub-tab toggle ── */}
      <div
        className="flex items-center gap-2 px-4 py-3 bg-white"
        style={{ borderBottom: "1px solid #F0F0F0" }}
      >
        {["mine", "community"].map((v) => {
          const active = codebookView === v;
          const label  = v === "mine" ? "내 스타일" : "커뮤니티";
          return (
            <button
              key={v}
              onClick={() => setCodebookView(v)}
              className="px-4 py-1.5 rounded-full text-[12px] font-bold transition-all"
              style={{
                backgroundColor: active ? DARK    : "#F2F2F2",
                color:           active ? "white" : "#777",
                fontFamily:      FONT,
              }}
            >
              {label}
              {v === "mine" && myCoordi.length > 0 && (
                <span
                  className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: active ? "rgba(255,255,255,0.25)" : "#E0E0E0", color: active ? "white" : "#888" }}
                >
                  {myCoordi.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── 내 스타일 view ── */}
      {codebookView === "mine" && (
        <div className="bg-white">
          {myCoordi.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 px-6">
              <span style={{ fontSize: 44 }}>✨</span>
              <p className="text-[14px] font-bold text-center" style={{ color: "#1a1a1a", fontFamily: FONT }}>
                아직 만든 스타일이 없어요
              </p>
              <p className="text-[12px] text-center leading-relaxed" style={{ color: "#AAAAAA", fontFamily: FONT }}>
                아래 버튼을 눌러 나만의 스타일을 만들어 보세요
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 px-4 py-4">
              {myCoordi.map((c) => (
                <div key={c.id} className="relative">
                  {/* Card */}
                  <button
                    onClick={() => onViewMyCoordi?.(c)}
                    className="w-full rounded-2xl overflow-hidden active:opacity-80"
                    style={{ aspectRatio: "3/4", backgroundColor: c.bgColor || "#F2F2F2", display: "block" }}
                  >
                    {c.thumbnail ? (
                      <img src={c.thumbnail} alt={c.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span style={{ fontSize: 40, opacity: 0.18 }}>👗</span>
                      </div>
                    )}
                    {/* Gradient */}
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%)" }}
                    />
                    {/* Bottom info */}
                    <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
                      <p className="text-white text-[12px] font-bold truncate" style={{ fontFamily: FONT }}>
                        {c.title || "제목 없음"}
                      </p>
                      <p className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.55)", fontFamily: FONT }}>
                        {c.updatedAt
                          ? new Date(c.updatedAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
                          : ""}
                      </p>
                    </div>
                  </button>
                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(c.id); }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 2L8 8M8 2L2 8" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 커뮤니티 view ── */}
      {codebookView === "community" && (
        <>
          {/* Style filter */}
          <div className="bg-white pt-3 pb-2">
            <p className="px-4 text-[10px] font-bold tracking-[0.12em] uppercase mb-2" style={{ color: "#AAAAAA", fontFamily: FONT }}>스타일</p>
            <div className="flex overflow-x-auto px-4 gap-2" style={{ scrollbarWidth: "none" }}>
              {STYLE_FILTER_OPTIONS.map((s) => {
                const isActive = styleFilter === s;
                return (
                  <button key={s} onClick={() => setStyleFilter(s)}
                    className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all"
                    style={{
                      backgroundColor: isActive ? DARK    : "#F2F2F2",
                      color:           isActive ? "white" : "#555",
                      fontFamily:      FONT,
                      border:          isActive ? `1.5px solid ${DARK}` : "1.5px solid transparent",
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Season filter */}
          <div className="bg-white pt-2 pb-3" style={{ borderBottom: "1px solid #F0F0F0" }}>
            <p className="px-4 text-[10px] font-bold tracking-[0.12em] uppercase mb-2" style={{ color: "#AAAAAA", fontFamily: FONT }}>시즌</p>
            <div className="flex px-4 gap-2">
              {SEASON_FILTER_OPTIONS.map((s) => {
                const isActive = seasonFilter === s;
                return (
                  <button key={s} onClick={() => setSeasonFilter(s)}
                    className="shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-all"
                    style={{
                      backgroundColor: isActive ? YELLOW : "#F9F9F9",
                      color:           isActive ? DARK   : "#888",
                      fontFamily:      FONT,
                      border:          isActive ? `1.5px solid ${YELLOW}` : "1.5px solid #EBEBEB",
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Result count */}
          <div className="px-4 py-2 bg-white">
            <p className="text-[11px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>
              {styleFilter !== "전체" ? `${styleFilter} · ` : ""}
              {seasonFilter !== "전체" ? `${seasonFilter} · ` : ""}
              {filtered.length}개 스타일
            </p>
          </div>

          {/* Community outfit grid */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <span style={{ fontSize: 36 }}>🔍</span>
              <p className="text-[13px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>해당 조건의 스타일이 없어요</p>
            </div>
          ) : (
            <div className="bg-white px-3 pt-2 pb-4">
              <div className="grid grid-cols-2 gap-2">
                {filtered.map((outfit) => (
                  <CommunityOutfitCard key={outfit.id} outfit={outfit} onTap={onOutfitTap} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation sheet */}
      {deleteConfirm && (
        <div className="absolute inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="w-full rounded-t-3xl px-5 pt-6 pb-8" style={{ backgroundColor: "white" }}>
            <p className="text-[16px] font-bold text-center mb-1" style={{ color: "#1a1a1a", fontFamily: FONT }}>스타일을 삭제할까요?</p>
            <p className="text-[13px] text-center mb-6" style={{ color: "#888", fontFamily: FONT }}>삭제한 스타일은 복구할 수 없어요</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 h-12 rounded-xl text-[14px] font-medium" style={{ backgroundColor: "#F5F5F5", color: "#888", fontFamily: FONT }}>
                취소
              </button>
              <button onClick={() => handleDeleteMyCoordi(deleteConfirm)} className="flex-1 h-12 rounded-xl text-[14px] font-bold" style={{ backgroundColor: "#E84040", color: "white", fontFamily: FONT }}>
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Root ─────────────────────────────────────────────────────────────────────
export default function ClosetPage({ onProductSelect }) {
  const [activeSubTab,    setActiveSubTab]    = useState("clothing");
  const [fullList,        setFullList]        = useState(null);
  const [addItemOpen,     setAddItemOpen]     = useState(false);
  const [outfitDetail,    setOutfitDetail]    = useState(null);
  const [editorOpen,      setEditorOpen]      = useState(false);
  const [editingCoordi,   setEditingCoordi]   = useState(null);
  const [coordiRefresh,   setCoordiRefresh]   = useState(0);
  const [mySizeOpen,      setMySizeOpen]      = useState(false);
  const [stylebookDetail, setStylebookDetail] = useState(null); // StylebookDetailScreen

  function openEditor(coordi = null) {
    setEditingCoordi(coordi);
    setEditorOpen(true);
  }

  function handleEditorClose() {
    setEditorOpen(false);
    setEditingCoordi(null);
    setCoordiRefresh((n) => n + 1);
  }

  function handleCTAPress() {
    if (activeSubTab === "codebook") {
      openEditor(null);
    } else {
      setAddItemOpen(true);
    }
  }

  const ctaLabel =
    activeSubTab === "codebook" ? "내 스타일 만들기" : "아이템 등록하기";

  return (
    <div className="relative flex flex-col h-full bg-white overflow-hidden">
      <ClosetHeader />

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <ProfileSection onSizePress={() => setMySizeOpen(true)} />
        <SubStats />
        <SubTabs active={activeSubTab} onChange={setActiveSubTab} />

        {activeSubTab === "clothing" && (
          <ClothingTab
            onMorePress={(data) => setFullList(data)}
            onItemSelect={onProductSelect}
          />
        )}
        {activeSubTab === "codebook" && (
          <CodibookTab
            onOutfitTap={(outfit) => setOutfitDetail(outfit)}
            onViewMyCoordi={(c) => setStylebookDetail(c)}
            onEditMyCoordi={(c) => openEditor(c)}
            myCoordiRefresh={coordiRefresh}
          />
        )}
      </div>

      {/* CTA: "아이템 등록하기" / "내 스타일 만들기" */}
      <div
        className="px-4 py-3 bg-white shrink-0"
        style={{ borderTop: "1px solid #F0F0F0" }}
      >
        <button
          onClick={handleCTAPress}
          className="w-full flex items-center justify-center gap-2 rounded-2xl transition-all active:opacity-80"
          style={{
            backgroundColor: "#F5C200",
            height:          52,
            fontFamily:      FONT,
            fontSize:        15,
            fontWeight:      700,
            color:           "#1a1a1a",
            letterSpacing:   "-0.01em",
            boxShadow:       "0 4px 16px rgba(245,194,0,0.30)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 3V15M3 9H15" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          {ctaLabel}
        </button>
      </div>

      {/* FullListScreen overlay */}
      {fullList && (
        <FullListScreen
          title={fullList.title}
          items={fullList.items}
          onBack={() => setFullList(null)}
          onItemSelect={onProductSelect}
        />
      )}

      {/* Outfit detail overlay */}
      {outfitDetail && (
        <OutfitDetailScreen
          outfit={outfitDetail}
          onBack={() => setOutfitDetail(null)}
        />
      )}

      {/* Stylebook detail overlay */}
      {stylebookDetail && (
        <StylebookDetailScreen
          coordi={stylebookDetail}
          onBack={() => setStylebookDetail(null)}
          onEdit={(c) => { setStylebookDetail(null); openEditor(c); }}
          onDelete={(id) => {
            deleteCoordi(id);
            setCoordiRefresh((n) => n + 1);
            setStylebookDetail(null);
          }}
          onProductSelect={onProductSelect}
        />
      )}

      {/* Coordi editor overlay */}
      {editorOpen && (
        <CoordiEditorPage
          coordi={editingCoordi}
          onClose={handleEditorClose}
          onSaved={handleEditorClose}
        />
      )}

      {/* AddClosetItemScreen overlay */}
      {addItemOpen && (
        <AddClosetItemScreen
          onClose={() => setAddItemOpen(false)}
          onSave={() => setAddItemOpen(false)}
        />
      )}

      {/* My Size overlay */}
      {mySizeOpen && (
        <MySizePage onClose={() => setMySizeOpen(false)} />
      )}
    </div>
  );
}
