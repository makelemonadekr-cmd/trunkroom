import { useState, useEffect, useMemo } from "react";
import FullListScreen from "./FullListScreen";
import AddClosetItemScreen from "../sell/AddClosetItemScreen";
import MySizePage from "./MySizePage";
import LazyImage from "../../components/LazyImage";
import {
  MAIN_CATEGORIES,
  CLOSET_ITEMS,
  getItemsByCategory,
} from "../../constants/mockClosetData";
import { useFavorites } from "../../lib/favoritesStore";
import { getTempPref, setTempPref } from "../../services/weatherRecommendation";

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

// ─── Temperature preference section ──────────────────────────────────────────
const TEMP_PREFS = [
  { key: "cold",   label: "추위탐", emoji: "🧊" },
  { key: "normal", label: "보통",   emoji: "😊" },
  { key: "warm",   label: "더위탐", emoji: "🔥" },
];

function TempPrefSection() {
  const [pref, setPrefState] = useState(() => getTempPref());

  function handleChange(key) {
    setPrefState(key);
    setTempPref(key);
  }

  return (
    <div
      className="mx-4 mb-3 rounded-2xl px-4 py-3 flex items-center gap-3"
      style={{ backgroundColor: "#F8F8F8", border: "1px solid #EEEEEE" }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-bold tracking-[0.1em] uppercase mb-0.5" style={{ color: "#BBBBBB", fontFamily: FONT }}>
          BODY TEMP PREFERENCE
        </p>
        <p className="text-[12px] font-bold" style={{ color: DARK, fontFamily: FONT }}>체온 성향</p>
      </div>
      <div className="flex gap-1.5">
        {TEMP_PREFS.map((p) => {
          const isActive = pref === p.key;
          return (
            <button
              key={p.key}
              onClick={() => handleChange(p.key)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
              style={{
                backgroundColor: isActive ? DARK    : "white",
                color:           isActive ? "white" : "#666",
                border:          isActive ? `1.5px solid ${DARK}` : "1.5px solid #E8E8E8",
                fontFamily:      FONT,
              }}
            >
              <span style={{ fontSize: 11 }}>{p.emoji}</span>
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>
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

// ─── Filter bottom-sheet ──────────────────────────────────────────────────────
const SEASON_OPTS   = ["봄", "여름", "가을", "겨울"];
const MATERIAL_OPTS = ["면", "울", "데님", "니트", "린넨", "폴리에스터", "가죽", "시폰", "벨벳"];

function FilterSheet({ filters, onApply, onClose }) {
  const [local, setLocal] = useState(filters);

  // Derive unique colors + brands from actual data
  const allColors = useMemo(
    () => [...new Set(CLOSET_ITEMS.map((i) => i.color).filter(Boolean))].sort(),
    []
  );
  const allBrands = useMemo(
    () => [...new Set(CLOSET_ITEMS.map((i) => i.brand).filter(Boolean))].sort(),
    []
  );

  function toggle(key, value) {
    setLocal((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  }

  const activeCount = Object.values(local).flat().length;

  const chipStyle = (active) => ({
    backgroundColor: active ? DARK    : "#F5F5F5",
    color:           active ? "white" : "#555",
    border:          active ? `1px solid ${DARK}` : "1px solid transparent",
    fontFamily:      FONT,
  });

  return (
    <div
      className="absolute inset-0 z-50 flex items-end"
      style={{ backgroundColor: "rgba(0,0,0,0.42)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full rounded-t-3xl bg-white" style={{ maxHeight: "82%" }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-0">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "#DDD" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid #F0F0F0" }}>
          <h3 className="text-[16px] font-bold" style={{ color: DARK, fontFamily: FONT }}>필터</h3>
          <button
            onClick={() => { setLocal({ season: [], color: [], brand: [], material: [] }); }}
            className="text-[12px]" style={{ color: "#AAAAAA", fontFamily: FONT }}
          >
            초기화
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-5" style={{ scrollbarWidth: "none", maxHeight: "56vh" }}>

          {/* Season */}
          <div>
            <p className="text-[11px] font-bold mb-2.5 tracking-[0.08em] uppercase" style={{ color: "#AAAAAA", fontFamily: FONT }}>시즌</p>
            <div className="flex flex-wrap gap-2">
              {SEASON_OPTS.map((s) => (
                <button key={s} onClick={() => toggle("season", s)}
                  className="px-3.5 py-1.5 rounded-full text-[12px] font-medium"
                  style={chipStyle(local.season.includes(s))}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <p className="text-[11px] font-bold mb-2.5 tracking-[0.08em] uppercase" style={{ color: "#AAAAAA", fontFamily: FONT }}>색상</p>
            <div className="flex flex-wrap gap-2">
              {allColors.map((c) => (
                <button key={c} onClick={() => toggle("color", c)}
                  className="px-3.5 py-1.5 rounded-full text-[12px] font-medium"
                  style={chipStyle(local.color.includes(c))}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Brand */}
          <div>
            <p className="text-[11px] font-bold mb-2.5 tracking-[0.08em] uppercase" style={{ color: "#AAAAAA", fontFamily: FONT }}>브랜드</p>
            <div className="flex flex-wrap gap-2">
              {allBrands.map((b) => (
                <button key={b} onClick={() => toggle("brand", b)}
                  className="px-3.5 py-1.5 rounded-full text-[12px] font-medium"
                  style={chipStyle(local.brand.includes(b))}>
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Material */}
          <div>
            <p className="text-[11px] font-bold mb-2.5 tracking-[0.08em] uppercase" style={{ color: "#AAAAAA", fontFamily: FONT }}>소재</p>
            <div className="flex flex-wrap gap-2">
              {MATERIAL_OPTS.map((m) => (
                <button key={m} onClick={() => toggle("material", m)}
                  className="px-3.5 py-1.5 rounded-full text-[12px] font-medium"
                  style={chipStyle(local.material.includes(m))}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Apply button */}
        <div className="px-5 pt-3 pb-6" style={{ borderTop: "1px solid #F0F0F0" }}>
          <button
            onClick={() => { onApply(local); onClose(); }}
            className="w-full h-12 rounded-2xl text-[15px] font-bold"
            style={{ backgroundColor: DARK, color: "white", fontFamily: FONT }}
          >
            {activeCount > 0 ? `${activeCount}개 필터 적용하기` : "적용하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Active filter chips bar ──────────────────────────────────────────────────
function ActiveFilterBar({ filters, onRemove }) {
  const chips = [];
  Object.entries(filters).forEach(([key, values]) => {
    values.forEach((v) => chips.push({ key, value: v }));
  });
  if (chips.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-2" style={{ scrollbarWidth: "none" }}>
      {chips.map(({ key, value }) => (
        <button
          key={`${key}-${value}`}
          onClick={() => onRemove(key, value)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium"
          style={{ backgroundColor: "#1a1a1a", color: "white", fontFamily: FONT }}
        >
          {value}
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 1L7 7M7 1L1 7" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// ─── 내 아이템 tab ────────────────────────────────────────────────────────────
function ClothingTab({ onMorePress, onItemTap, onFilterOpen }) {
  const [catFilter,     setCatFilter]     = useState("전체");
  const [filters,       setFilters]       = useState({ season: [], color: [], brand: [], material: [] });
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const activeFilterCount = Object.values(filters).flat().length;

  const filtered = useMemo(() => {
    let items = catFilter === "전체" ? CLOSET_ITEMS : getItemsByCategory(catFilter);
    if (filters.season.length   > 0) items = items.filter((i) => i.season?.some((s) => filters.season.includes(s)));
    if (filters.color.length    > 0) items = items.filter((i) => filters.color.includes(i.color));
    if (filters.brand.length    > 0) items = items.filter((i) => filters.brand.includes(i.brand));
    if (filters.material.length > 0) items = items.filter((i) => filters.material.includes(i.material));
    return items;
  }, [catFilter, filters]);

  function removeFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: prev[key].filter((v) => v !== value) }));
  }

  const listTitle = catFilter === "전체" ? "전체 아이템" : catFilter;

  return (
    <div>
      {/* Category emoji swipe row */}
      <div className="bg-white" style={{ borderBottom: "1px solid #F4F4F4" }}>
        <CategorySwipeRow active={catFilter} onChange={setCatFilter} />
      </div>

      {/* Count row + filter button */}
      <div className="flex items-center justify-between px-5 py-2.5">
        <p className="text-[12px] font-medium" style={{ color: "#888", fontFamily: FONT }}>
          {catFilter === "전체" ? "전체" : catFilter} {filtered.length}개
          {activeFilterCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold"
              style={{ backgroundColor: DARK, color: "white", fontFamily: FONT }}>
              필터 {activeFilterCount}
            </span>
          )}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterSheetOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: activeFilterCount > 0 ? DARK : "#F2F2F2",
              color:           activeFilterCount > 0 ? "white" : "#555",
              fontFamily:      FONT,
              fontSize:        12,
              fontWeight:      activeFilterCount > 0 ? 700 : 500,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1.5 3H10.5M3 6H9M5 9H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            필터{activeFilterCount > 0 ? ` ${activeFilterCount}` : ""}
          </button>
          {filtered.length > 0 && (
            <button onClick={() => onMorePress({ title: listTitle, items: filtered })}
              className="flex items-center gap-0.5">
              <span className="text-[12px]" style={{ color: "#888", fontFamily: FONT }}>더보기</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3L9 7L5 11" stroke="#888" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Active filter chips */}
      <ActiveFilterBar filters={filters} onRemove={removeFilter} />

      {/* Item grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-8">
          <span style={{ fontSize: 40, opacity: 0.3 }}>🔍</span>
          <p className="text-[14px] font-bold mt-3 text-center" style={{ color: "#BBBBBB", fontFamily: FONT }}>
            조건에 맞는 아이템이 없어요
          </p>
          <button onClick={() => setFilters({ season: [], color: [], brand: [], material: [] })}
            className="mt-3 px-4 py-2 rounded-full text-[12px] font-medium"
            style={{ backgroundColor: "#F2F2F2", color: "#555", fontFamily: FONT }}>
            필터 초기화
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 px-4 pb-4">
            {filtered.slice(0, 8).map((item) => (
              <ClothingItemCard key={item.id} item={item} onSelect={onItemTap} />
            ))}
          </div>
          {filtered.length > 8 && (
            <div className="px-4 pb-6">
              <button
                onClick={() => onMorePress({ title: listTitle, items: filtered })}
                className="w-full py-3 rounded-xl text-[13px] font-bold"
                style={{ backgroundColor: "#F5F5F5", color: "#555", fontFamily: FONT, border: "1px solid #EBEBEB" }}
              >
                {filtered.length - 8}개 더보기
              </button>
            </div>
          )}
        </>
      )}

      {/* Filter bottom-sheet */}
      {filterSheetOpen && (
        <FilterSheet
          filters={filters}
          onApply={(f) => setFilters(f)}
          onClose={() => setFilterSheetOpen(false)}
        />
      )}
    </div>
  );
}





// ─── Photo source picker bottom sheet ────────────────────────────────────────
// Shown when user taps "아이템 등록하기" — asks whether to take a photo or pick from gallery.

function PhotoSourceSheet({ onSelect, onClose }) {
  const options = [
    {
      key:   "camera",
      emoji: "📸",
      title: "사진 촬영",
      desc:  "지금 바로 옷 사진을 찍어요",
    },
    {
      key:   "gallery",
      emoji: "🖼️",
      title: "사진 불러오기",
      desc:  "갤러리에서 사진을 선택해요",
    },
  ];

  return (
    <div
      className="absolute inset-0 z-50 flex items-end"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full rounded-t-3xl bg-white pb-8">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "#DDD" }} />
        </div>

        {/* Header */}
        <div className="px-5 pb-5">
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase" style={{ color: "#AAAAAA", fontFamily: FONT }}>ADD ITEM</p>
          <h3 className="text-[18px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.025em" }}>
            어떻게 사진을 추가할까요?
          </h3>
          <p className="text-[12px] mt-1" style={{ color: "#AAAAAA", fontFamily: FONT }}>
            AI가 사진을 분석해서 카테고리·소재·색상을 자동으로 입력해드려요
          </p>
        </div>

        {/* Options */}
        <div className="px-4 flex flex-col gap-3">
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => onSelect(opt.key)}
              className="flex items-center gap-4 px-4 py-4 rounded-2xl active:opacity-80 text-left"
              style={{ backgroundColor: "#F8F8F8", border: "1.5px solid #F0F0F0" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: YELLOW, fontSize: 22 }}
              >
                {opt.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold" style={{ color: DARK, fontFamily: FONT }}>{opt.title}</p>
                <p className="text-[12px] mt-0.5" style={{ color: "#888", fontFamily: FONT }}>{opt.desc}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <path d="M6 3L11 8L6 13" stroke="#CCCCCC" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function ClosetPage({ onProductSelect, onItemTap }) {
  const [fullList,        setFullList]        = useState(null);
  const [addItemOpen,     setAddItemOpen]     = useState(false);
  const [photoSource,     setPhotoSource]     = useState(null);
  const [showSourceSheet, setShowSourceSheet] = useState(false);
  const [mySizeOpen,      setMySizeOpen]      = useState(false);

  function handleSourceSelect(source) {
    setPhotoSource(source);
    setShowSourceSheet(false);
    setAddItemOpen(true);
  }

  return (
    <div className="relative flex flex-col h-full bg-white overflow-hidden">
      <ClosetHeader />

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <ProfileSection onSizePress={() => setMySizeOpen(true)} />
        <SubStats />

        {/* ── Temperature preference ── */}
        <div className="pt-3">
          <TempPrefSection />
        </div>

        {/* ── Items + filters ── */}
        <ClothingTab
          onMorePress={(data) => setFullList(data)}
          onItemTap={onItemTap}
        />
      </div>

      {/* CTA: 아이템 등록하기 */}
      <div className="px-4 py-3 bg-white shrink-0" style={{ borderTop: "1px solid #F0F0F0" }}>
        <button
          onClick={() => setShowSourceSheet(true)}
          className="w-full flex items-center justify-center gap-2 rounded-2xl transition-all active:opacity-80"
          style={{
            backgroundColor: YELLOW,
            height:          52,
            fontFamily:      FONT,
            fontSize:        15,
            fontWeight:      700,
            color:           DARK,
            letterSpacing:   "-0.01em",
            boxShadow:       "0 4px 16px rgba(245,194,0,0.30)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 3V15M3 9H15" stroke={DARK} strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          아이템 등록하기
        </button>
      </div>

      {/* FullListScreen overlay */}
      {fullList && (
        <FullListScreen
          title={fullList.title}
          items={fullList.items}
          onBack={() => setFullList(null)}
          onItemSelect={onItemTap ?? onProductSelect}
        />
      )}

      {/* Photo source picker sheet */}
      {showSourceSheet && (
        <PhotoSourceSheet
          onSelect={handleSourceSelect}
          onClose={() => setShowSourceSheet(false)}
        />
      )}

      {/* AddClosetItemScreen overlay */}
      {addItemOpen && (
        <AddClosetItemScreen
          photoSource={photoSource}
          onClose={() => { setAddItemOpen(false); setPhotoSource(null); }}
          onSave={() => { setAddItemOpen(false); setPhotoSource(null); }}
        />
      )}

      {/* My Size overlay */}
      {mySizeOpen && (
        <MySizePage onClose={() => setMySizeOpen(false)} />
      )}
    </div>
  );
}
