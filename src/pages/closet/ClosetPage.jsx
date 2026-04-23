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
import {
  getItemWearFrequency,
  getItemLastWornDates,
  localDateStr,
} from "../../lib/wearHistoryStore";
import { getItemsNeedingWash } from "../../lib/laundryStore";

const YELLOW = "#F5C200";
const DARK   = "#1a1a1a";
const FONT   = "'Spoqa Han Sans Neo', sans-serif";

// ─── Category list: "전체" + all main categories ──────────────────────────────
const CAT_ALL = { id: "전체", label: "전체", emoji: "✨" };
const CAT_SWIPE_LIST = [CAT_ALL, ...MAIN_CATEGORIES];

// ─── Closet header ────────────────────────────────────────────────────────────
function ClosetHeader({ onAddItem }) {
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
      <button
        onClick={onAddItem}
        className="w-[34px] h-[34px] flex items-center justify-center rounded-full active:opacity-70"
        style={{ backgroundColor: "#F2F2F2" }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3V13M3 8H13" stroke={DARK} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────
function ProfileSection({ onSizePress }) {
  return (
    <div className="px-5 py-3.5 bg-white" style={{ borderBottom: "1px solid #F0F0F0" }}>
      <div className="flex items-center gap-3">
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
            윤킴의 옷장
          </p>
          <button
            onClick={onSizePress}
            className="flex items-center gap-1 mt-1 active:opacity-70"
          >
            <span className="text-[12px] font-medium" style={{ color: "#666666", fontFamily: FONT }}>내 정보 · 내 사이즈</span>
            <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
              <path d="M3.5 2L6.5 5L3.5 8" stroke="#888888" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[14px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>20</span>
            <span className="text-[9px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>팔로워</span>
          </div>
          <div style={{ width: 1, height: 24, backgroundColor: "#EEEEEE" }} />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[14px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>18</span>
            <span className="text-[9px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>팔로잉</span>
          </div>
        </div>
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

// ─── Color hex map ─────────────────────────────────────────────────────────────
const COLOR_HEX = {
  "블랙":        "#1a1a1a",
  "화이트":      "#F8F8F8",
  "그레이":      "#888888",
  "라이트그레이":"#CCCCCC",
  "네이비":      "#1B2A5E",
  "베이지":      "#D4B896",
  "브라운":      "#7B4F2E",
  "카키":        "#6B6B3A",
  "블루":        "#2060CC",
  "스카이블루":  "#87CEEB",
  "레드":        "#CC2020",
  "핑크":        "#F4A0B0",
  "옐로우":      "#F5C200",
  "그린":        "#3A8A3A",
  "민트":        "#5EC8C0",
  "퍼플":        "#7B4FA0",
  "바이올렛":    "#8B6FBF",
  "오렌지":      "#E87020",
  "아이보리":    "#F5F0E0",
  "크림":        "#F8F4E8",
  "와인":        "#722020",
  "머스타드":    "#C89B20",
  "올리브":      "#7A7A30",
  "코랄":        "#F07060",
  "라벤더":      "#B0A0D0",
};

function isLightColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}

// ─── Placeholder (kept for reference, no longer rendered) ────────────────────
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

// ─── 옷장 인사이트 entry row ──────────────────────────────────────────────────
function InsightsBanner({ onInsights }) {
  return (
    <div className="mx-4 mt-3 mb-1 rounded-2xl overflow-hidden" style={{ border: "1px solid #FDE68A" }}>
      <button
        onClick={onInsights}
        className="w-full flex items-center gap-3 px-4 py-4 text-left active:opacity-75 transition-opacity"
        style={{ backgroundColor: "#FFFBEB" }}
      >
        {/* Emoji icon */}
        <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>👀</span>

        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>
            옷장 인사이트
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "#B8912A", fontFamily: FONT }}>
            카테고리 · 착용 패턴 · 브랜드 분석
          </p>
        </div>

        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0">
          <path d="M5.5 3L10 7.5L5.5 12" stroke="#D4A832" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

// ─── 내 옷장 관리 팁 (collapsible) ────────────────────────────────────────────
function TipsBanner({ onTipAction }) {
  const [tipsOpen, setTipsOpen] = useState(false);

  const { longUnwornItems, laundryItems } = useMemo(() => {
    const lastWorn = getItemLastWornDates();
    const today    = localDateStr(new Date());
    const longUnwornItems = CLOSET_ITEMS.filter((item) => {
      const lw = lastWorn.get(item.id);
      if (!lw) return true;
      return Math.floor((new Date(today) - new Date(lw + "T12:00:00")) / 86400000) >= 90;
    });
    const laundryRaw   = getItemsNeedingWash(2);
    const laundryItems = laundryRaw.map(({ itemId }) => CLOSET_ITEMS.find((i) => i.id === itemId)).filter(Boolean);
    return { longUnwornItems, laundryItems };
  }, []);

  const tipCount = longUnwornItems.length + laundryItems.length;

  return (
    <div className="mx-4 mb-3 rounded-2xl overflow-hidden" style={{ border: "1px solid #EEEEEE" }}>
      {/* Toggle header */}
      <button
        onClick={() => setTipsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 active:opacity-80 bg-white"
      >
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 26, lineHeight: 1 }}>💡</span>
          <p className="text-[14px] font-bold" style={{ color: DARK, fontFamily: FONT }}>내 옷장 관리 팁</p>
          {tipCount > 0 && (
            <span
              className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
              style={{
                backgroundColor: tipsOpen ? "#EEEEEE" : "#EEF2FF",
                color:           tipsOpen ? "#888"    : "#3050A0",
                fontFamily: FONT,
              }}
            >
              {tipCount}
            </span>
          )}
        </div>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          style={{ transform: tipsOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.22s", flexShrink: 0 }}
        >
          <path d="M4 6L8 10L12 6" stroke="#BBBBBB" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Tip cards */}
      {tipsOpen && (
        <div className="flex flex-col gap-2 px-3 pb-3 bg-white" style={{ borderTop: "1px solid #F4F4F4" }}>
          <div style={{ height: 4 }} />
          <button
            onClick={() => onTipAction({ title: "오래 안 입은 아이템", items: longUnwornItems })}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 active:opacity-75 text-left w-full"
            style={{ backgroundColor: "#EEF2FF", border: "1px solid #DDE5FF" }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>❄️</span>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold" style={{ color: "#3050A0", fontFamily: FONT }}>
                {longUnwornItems.length}개 아이템이 잠들어 있어요
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "#8898CC", fontFamily: FONT }}>
                90일 이상 미착용 · 판매 또는 기부 고려해보세요
              </p>
            </div>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M4.5 2L9 6.5L4.5 11" stroke="#8898CC" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {laundryItems.length > 0 && (
            <button
              onClick={() => onTipAction({ title: "세탁이 필요한 아이템", items: laundryItems })}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 active:opacity-75 text-left w-full"
              style={{ backgroundColor: "#FFF8EE", border: "1px solid #FFE8C8" }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>🧺</span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold" style={{ color: "#8A5010", fontFamily: FONT }}>
                  {laundryItems.length}개 아이템 세탁이 필요해요
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "#C09050", fontFamily: FONT }}>
                  최근 착용 후 세탁 기록이 없어요
                </p>
              </div>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M4.5 2L9 6.5L4.5 11" stroke="#C09050" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 소재 파생 (mock 데이터에 material 필드 없음 → 카테고리+ID로 결정론적 배정) ──
const MATERIALS_BY_CAT = {
  "상의":     ["면", "폴리에스터", "니트", "린넨", "레이온", "울"],
  "하의":     ["데님", "면", "폴리에스터", "울", "레이온", "코듀로이"],
  "아우터":   ["울", "폴리에스터", "나일론", "가죽", "코튼"],
  "원피스":   ["면", "폴리에스터", "실크", "레이온", "린넨"],
  "신발":     ["가죽", "합성피혁", "캔버스", "스웨이드"],
  "가방":     ["가죽", "합성피혁", "캔버스", "나일론"],
  "액세서리": ["금속", "가죽", "실버", "골드"],
  "스포츠":   ["폴리에스터", "나일론", "스판덱스"],
};
function getItemMaterial(item) {
  const list = MATERIALS_BY_CAT[item.mainCategory] ?? ["면", "폴리에스터"];
  return list[item.id % list.length];
}

// ─── 내 아이템 tab ────────────────────────────────────────────────────────────
const SEASONS = ["봄", "여름", "가을", "겨울"];

function ClothingTab({ onMorePress, onItemTap }) {
  const [openPanel,      setOpenPanel]     = useState(null);
  const [catFilters,     setCatFilters]    = useState([]);
  const [subCatFilters,  setSubCatFilters] = useState([]);
  const [colorFilters,   setColorFilters]  = useState([]);
  const [seasonFilters,  setSeasonFilters] = useState([]);
  const [matFilters,     setMatFilters]    = useState([]);
  const [brandFilters,   setBrandFilters]  = useState([]);
  const [wearFilter,     setWearFilter]    = useState(null); // "high"|"low"|"none"

  // 메인 카테고리 바뀌면 세부 카테고리 초기화
  useEffect(() => { setSubCatFilters([]); }, [catFilters]);

  function togglePanel(key) {
    setOpenPanel((prev) => (prev === key ? null : key));
  }
  function toggle(setter, val) {
    setter((prev) => prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]);
  }
  function resetAll() {
    setCatFilters([]); setSubCatFilters([]);
    setColorFilters([]); setSeasonFilters([]); setMatFilters([]); setBrandFilters([]);
    setWearFilter(null);
    setOpenPanel(null);
  }

  const subCategories = useMemo(() => {
    if (catFilters.length === 0) return [];
    const base = CLOSET_ITEMS.filter((i) => catFilters.includes(i.mainCategory));
    return [...new Set(base.map((i) => i.subCategory ?? i.subcategory).filter(Boolean))].sort();
  }, [catFilters]);

  const colorOptions = useMemo(() => {
    const base = catFilters.length === 0 ? CLOSET_ITEMS : CLOSET_ITEMS.filter((i) => catFilters.includes(i.mainCategory));
    return [...new Set(base.map((i) => i.color).filter(Boolean))].sort();
  }, [catFilters]);

  const materialOptions = useMemo(() => {
    const base = catFilters.length === 0 ? CLOSET_ITEMS : CLOSET_ITEMS.filter((i) => catFilters.includes(i.mainCategory));
    return [...new Set(base.map(getItemMaterial))].sort();
  }, [catFilters]);

  const filtered = useMemo(() => {
    let items = CLOSET_ITEMS;
    if (catFilters.length    > 0) items = items.filter((i) => catFilters.includes(i.mainCategory));
    if (subCatFilters.length > 0) items = items.filter((i) => subCatFilters.includes(i.subCategory ?? i.subcategory));
    if (colorFilters.length  > 0) items = items.filter((i) => colorFilters.includes(i.color));
    if (seasonFilters.length > 0) items = items.filter((i) => (i.season ?? []).some((s) => seasonFilters.includes(s)));
    if (matFilters.length    > 0) items = items.filter((i) => matFilters.includes(getItemMaterial(i)));
    if (brandFilters.length  > 0) items = items.filter((i) => brandFilters.includes(i.brand));
    if (wearFilter) {
      const freq = getItemWearFrequency();
      if (wearFilter === "high")  items = items.filter((i) => (freq.get(i.id) ?? 0) >= 5);
      if (wearFilter === "low")   items = items.filter((i) => (freq.get(i.id) ?? 0) > 0 && (freq.get(i.id) ?? 0) < 5);
      if (wearFilter === "none")  items = items.filter((i) => !(freq.get(i.id) ?? 0));
    }
    return items;
  }, [catFilters, subCatFilters, colorFilters, seasonFilters, matFilters, brandFilters, wearFilter]);

  const brandOptions = useMemo(() => {
    const counts = {};
    CLOSET_ITEMS.forEach((i) => { if (i.brand) counts[i.brand] = (counts[i.brand] ?? 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([b]) => b);
  }, []);

  const totalActive = catFilters.length + subCatFilters.length
    + colorFilters.length + seasonFilters.length + matFilters.length + brandFilters.length
    + (wearFilter ? 1 : 0);

  // Chip display label
  function chipLabel(key) {
    if (key === "category") {
      if (subCatFilters.length > 0) return subCatFilters.length === 1 ? subCatFilters[0] : `세부 ${subCatFilters.length}`;
      if (catFilters.length === 1)  return catFilters[0];
      if (catFilters.length  > 1)   return `카테고리 ${catFilters.length}`;
      return "카테고리";
    }
    if (key === "color")    return colorFilters.length  ? `색상 ${colorFilters.length}`    : "색상";
    if (key === "season")   return seasonFilters.length ? `계절 ${seasonFilters.length}`   : "계절";
    if (key === "material")  return matFilters.length   ? `소재 ${matFilters.length}`     : "소재";
    if (key === "brand")     return brandFilters.length ? `브랜드 ${brandFilters.length}` : "브랜드";
    if (key === "wearcount") {
      if (wearFilter === "high") return "많이 착용";
      if (wearFilter === "low")  return "보통";
      if (wearFilter === "none") return "미착용";
      return "착용횟수";
    }
  }
  function chipActive(key) {
    if (key === "category")  return catFilters.length > 0 || subCatFilters.length > 0;
    if (key === "color")     return colorFilters.length  > 0;
    if (key === "season")    return seasonFilters.length > 0;
    if (key === "material")  return matFilters.length    > 0;
    if (key === "brand")     return brandFilters.length  > 0;
    if (key === "wearcount") return !!wearFilter;
  }

  const CHIPS = ["category", "color", "season", "brand", "material", "wearcount"];

  return (
    <div>
      {/* ── 섹션 헤더 ── */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <p className="text-[15px] font-semibold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>
          옷장 속 아이템
        </p>
        <div className="flex items-center gap-2">
          {totalActive > 0 && (
            <button
              onClick={resetAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full active:opacity-70"
              style={{ backgroundColor: "#F2F2F2" }}
            >
              <span className="text-[10px] font-medium" style={{ color: "#888", fontFamily: FONT }}>초기화</span>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="#888" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onMorePress({ title: catFilters.length === 0 ? "전체 아이템" : catFilters.join(" · "), items: filtered })}
            className="flex items-center gap-1 active:opacity-70"
          >
            <span className="text-[12px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>총 {filtered.length}개</span>
            <span className="text-[12px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>전체보기</span>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M4.5 2.5L8.5 6.5L4.5 10.5" stroke="#AAAAAA" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── 필터 칩 row ── */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {CHIPS.map((key) => {
          const active = chipActive(key);
          const open   = openPanel === key;
          return (
            <button
              key={key}
              onClick={() => togglePanel(key)}
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full active:opacity-75"
              style={{
                backgroundColor: active || open ? DARK : "#F2F2F2",
                border: "none",
                transition: "background-color 0.15s",
              }}
            >
              <span
                className="text-[12px] font-medium whitespace-nowrap"
                style={{ color: active || open ? "white" : "#555", fontFamily: FONT }}
              >
                {chipLabel(key)}
              </span>
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none"
                style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s" }}
              >
                <path d="M2.5 4.5L6 8L9.5 4.5" stroke={active || open ? "white" : "#888"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          );
        })}
      </div>

      {/* ── 카테고리 패널 (정방형 그리드) ── */}
      {openPanel === "category" && (
        <div className="px-4 pb-4 pt-3" style={{ borderTop: "1px solid #F0F0F0" }}>
          {/* 전체 + 메인 카테고리 — 4열 정방형 */}
          <div className="grid grid-cols-4 gap-2">
            {/* 전체 버튼 — 선택 없을 때 활성, 누르면 전체 해제 */}
            <button
              onClick={() => { setCatFilters([]); setSubCatFilters([]); }}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl active:opacity-70"
              style={{ aspectRatio: "1", backgroundColor: catFilters.length === 0 ? DARK : "#F2F2F2" }}
            >
              <span style={{ fontSize: 20 }}>✨</span>
              <span className="text-[10px] font-medium" style={{ color: catFilters.length === 0 ? "white" : "#555", fontFamily: FONT }}>전체</span>
            </button>
            {MAIN_CATEGORIES.map((cat) => {
              const isActive = catFilters.includes(cat.label);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggle(setCatFilters, cat.label)}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl active:opacity-70"
                  style={{ aspectRatio: "1", backgroundColor: isActive ? DARK : "#F2F2F2" }}
                >
                  <span style={{ fontSize: 20 }}>{cat.emoji}</span>
                  <span className="text-[10px] font-medium" style={{ color: isActive ? "white" : "#555", fontFamily: FONT }}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 세부 카테고리 — 다중 선택 */}
          {subCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 mt-2" style={{ borderTop: "1px solid #F4F4F4" }}>
              {subCategories.map((sub) => (
                <button
                  key={sub}
                  onClick={() => toggle(setSubCatFilters, sub)}
                  className="px-3 py-1.5 rounded-full text-[11px] font-medium active:opacity-70"
                  style={{ backgroundColor: subCatFilters.includes(sub) ? "#444" : "#EBEBEB", color: subCatFilters.includes(sub) ? "white" : "#666", fontFamily: FONT }}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 색상 패널 (한 줄 가로 스크롤) ── */}
      {openPanel === "color" && (
        <div
          className="flex gap-4 px-4 pb-4 pt-3 overflow-x-auto"
          style={{ borderTop: "1px solid #F0F0F0", scrollbarWidth: "none" }}
        >
          {colorOptions.map((color) => {
            const isActive = colorFilters.includes(color);
            const hex      = COLOR_HEX[color] ?? "#CCCCCC";
            const light    = isLightColor(hex);
            return (
              <button
                key={color}
                onClick={() => toggle(setColorFilters, color)}
                className="shrink-0 flex flex-col items-center gap-1.5 active:opacity-70"
              >
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: 32, height: 32,
                    backgroundColor: hex,
                    border: isActive ? `2.5px solid ${DARK}` : light ? "1.5px solid rgba(0,0,0,0.15)" : "1.5px solid rgba(255,255,255,0.2)",
                    boxShadow: isActive ? "0 0 0 1.5px white inset" : "none",
                  }}
                >
                  {isActive && (
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M2 5.5L4.5 8L9 3" stroke={light ? "#1a1a1a" : "white"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-[9px]" style={{ color: isActive ? DARK : "#AAAAAA", fontFamily: FONT, fontWeight: isActive ? 700 : 400 }}>
                  {color}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── 계절 패널 ── */}
      {openPanel === "season" && (
        <div className="px-4 pb-4 pt-3 flex gap-2" style={{ borderTop: "1px solid #F0F0F0" }}>
          {SEASONS.map((s) => {
            const isActive = seasonFilters.includes(s);
            const emoji    = s === "봄" ? "🌸" : s === "여름" ? "☀️" : s === "가을" ? "🍂" : "❄️";
            return (
              <button
                key={s}
                onClick={() => toggle(setSeasonFilters, s)}
                className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl active:opacity-70"
                style={{ backgroundColor: isActive ? DARK : "#F2F2F2" }}
              >
                <span style={{ fontSize: 20 }}>{emoji}</span>
                <span className="text-[11px] font-medium" style={{ color: isActive ? "white" : "#555", fontFamily: FONT }}>
                  {s}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── 소재 패널 ── */}
      {openPanel === "material" && (
        <div className="px-4 pb-4 pt-3 flex flex-wrap gap-2" style={{ borderTop: "1px solid #F0F0F0" }}>
          {materialOptions.map((mat) => {
            const isActive = matFilters.includes(mat);
            return (
              <button
                key={mat}
                onClick={() => toggle(setMatFilters, mat)}
                className="px-3 py-1.5 rounded-full text-[12px] font-medium active:opacity-70"
                style={{ backgroundColor: isActive ? DARK : "#F2F2F2", color: isActive ? "white" : "#555", fontFamily: FONT }}
              >
                {mat}
              </button>
            );
          })}
        </div>
      )}

      {/* ── 브랜드 패널 (한 줄 가로 스크롤) ── */}
      {openPanel === "brand" && (
        <div
          className="flex gap-2.5 px-4 pb-4 pt-3 overflow-x-auto"
          style={{ borderTop: "1px solid #F0F0F0", scrollbarWidth: "none" }}
        >
          {brandOptions.map((brand) => {
            const isActive = brandFilters.includes(brand);
            return (
              <button
                key={brand}
                onClick={() => toggle(setBrandFilters, brand)}
                className="shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium active:opacity-70"
                style={{ backgroundColor: isActive ? DARK : "#F2F2F2", color: isActive ? "white" : "#555", fontFamily: FONT }}
              >
                {brand}
              </button>
            );
          })}
        </div>
      )}

      {/* ── 착용횟수 패널 ── */}
      {openPanel === "wearcount" && (
        <div className="flex gap-2 px-4 pb-4 pt-3" style={{ borderTop: "1px solid #F0F0F0" }}>
          {[
            { key: "high", label: "많이 착용", desc: "5회+", emoji: "🔥" },
            { key: "low",  label: "보통",      desc: "1-4회", emoji: "👕" },
            { key: "none", label: "미착용",    desc: "0회",   emoji: "❄️" },
          ].map(({ key, label, desc, emoji }) => {
            const isActive = wearFilter === key;
            return (
              <button
                key={key}
                onClick={() => setWearFilter(wearFilter === key ? null : key)}
                className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl active:opacity-70"
                style={{ backgroundColor: isActive ? DARK : "#F2F2F2" }}
              >
                <span style={{ fontSize: 20 }}>{emoji}</span>
                <span className="text-[11px] font-semibold" style={{ color: isActive ? "white" : "#555", fontFamily: FONT }}>{label}</span>
                <span className="text-[9px]" style={{ color: isActive ? "rgba(255,255,255,0.6)" : "#AAAAAA", fontFamily: FONT }}>{desc}</span>
              </button>
            );
          })}
        </div>
      )}


      {/* ── 아이템 그리드 ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-8">
          <span style={{ fontSize: 40, opacity: 0.3 }}>🔍</span>
          <p className="text-[14px] font-bold mt-3 text-center" style={{ color: "#BBBBBB", fontFamily: FONT }}>
            조건에 맞는 아이템이 없어요
          </p>
          <button
            onClick={resetAll}
            className="mt-3 px-4 py-2 rounded-full text-[12px] font-medium"
            style={{ backgroundColor: "#F2F2F2", color: "#555", fontFamily: FONT }}
          >
            필터 초기화
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 px-4 pt-3 pb-4">
            {filtered.slice(0, 8).map((item) => (
              <ClothingItemCard key={item.id} item={item} onSelect={onItemTap} />
            ))}
          </div>
          {filtered.length > 8 && (
            <div className="px-4 pb-6">
              <button
                onClick={() => onMorePress({ title: catFilters.length === 0 ? "전체 아이템" : catFilters.join(" · "), items: filtered })}
                className="w-full py-3 rounded-xl text-[13px] font-bold"
                style={{ backgroundColor: "#F5F5F5", color: "#555", fontFamily: FONT, border: "1px solid #EBEBEB" }}
              >
                {filtered.length - 8}개 더보기
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}





// ─── Insights ─────────────────────────────────────────────────────────────────

const CAT_COLORS = {
  "상의":     "#F5C200",
  "하의":     "#4A90D9",
  "아우터":   "#6B5040",
  "원피스":   "#E84040",
  "신발":     "#50A060",
  "가방":     "#8060C0",
  "액세서리": "#F08030",
  "스포츠":   "#4080A0",
};

const DIVIDER = "#F0F0F0";

function DonutChart({ data, total }) {
  const R = 38;
  const cx = 50, cy = 50;
  const circumference = 2 * Math.PI * R;
  let offsetSoFar = 0;
  const segments = data.map((d) => {
    const pct    = total > 0 ? d.count / total : 0;
    const length = pct * circumference;
    const seg    = { ...d, offset: offsetSoFar, length };
    offsetSoFar += length;
    return seg;
  });
  return (
    <svg viewBox="0 0 100 100" style={{ width: 120, height: 120 }}>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#F2F2F2" strokeWidth="14" />
      {segments.filter((s) => s.length > 0).map((seg) => (
        <circle key={seg.label} cx={cx} cy={cy} r={R} fill="none"
          stroke={seg.color} strokeWidth="14"
          strokeDasharray={`${seg.length} ${circumference - seg.length}`}
          strokeDashoffset={`${-(seg.offset - circumference / 4)}`}
        />
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="16" fontWeight="bold" fill={DARK} fontFamily={FONT}>{total}</text>
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize="7" fill="#AAAAAA" fontFamily={FONT}>아이템</text>
    </svg>
  );
}

function InsightsSection({ onMore }) {
  const catData = useMemo(() => {
    const counts = {};
    CLOSET_ITEMS.forEach((item) => {
      const cat = item.mainCategory ?? "기타";
      counts[cat] = (counts[cat] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count, color: CAT_COLORS[label] ?? "#CCC" }))
      .sort((a, b) => b.count - a.count);
  }, []);
  const total = CLOSET_ITEMS.length;

  return (
    <div className="mx-4 mb-4 rounded-2xl overflow-hidden" style={{ border: `1px solid ${DIVIDER}`, backgroundColor: "white" }}>
      <div className="px-4 pt-4 pb-2 flex items-center justify-between" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#AAAAAA", fontFamily: FONT }}>MY CLOSET INSIGHTS</p>
          <h3 className="text-[15px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>내 옷장 인사이트</h3>
        </div>
        <button onClick={onMore} className="flex items-center gap-1 px-3 py-1.5 rounded-full active:opacity-70" style={{ backgroundColor: "#F2F2F2" }}>
          <span className="text-[12px] font-medium" style={{ color: "#666", fontFamily: FONT }}>더보기</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4.5 2L7.5 6L4.5 10" stroke="#888" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="flex px-4 pt-4 pb-4 gap-5">
        <div className="flex flex-col items-center gap-2 shrink-0">
          <DonutChart data={catData} total={total} />
          <p className="text-[10px] text-center" style={{ color: "#AAAAAA", fontFamily: FONT }}>카테고리 분포</p>
        </div>
        <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
          {catData.slice(0, 5).map((d) => {
            const pct = Math.round((d.count / total) * 100);
            return (
              <div key={d.label} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-[11px] truncate" style={{ color: "#555", fontFamily: FONT, flex: 1 }}>{d.label}</span>
                <span className="text-[11px] font-bold shrink-0" style={{ color: DARK, fontFamily: FONT }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InsightsDetailScreen({ onBack }) {
  const total       = CLOSET_ITEMS.length;
  const wearFreq    = useMemo(() => getItemWearFrequency(), []);
  const lastWornMap = useMemo(() => getItemLastWornDates(), []);
  const todayLocal  = useMemo(() => localDateStr(new Date()), []);

  const catData = useMemo(() => {
    const counts = {};
    CLOSET_ITEMS.forEach((item) => {
      const cat = item.mainCategory ?? "기타";
      counts[cat] = (counts[cat] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count, color: CAT_COLORS[label] ?? "#CCC" }))
      .sort((a, b) => b.count - a.count);
  }, []);

  const catWearData = useMemo(() => {
    const catFreq = {};
    wearFreq.forEach((count, itemId) => {
      const item = CLOSET_ITEMS.find((i) => i.id === itemId);
      if (!item) return;
      const cat = item.mainCategory ?? "기타";
      catFreq[cat] = (catFreq[cat] ?? 0) + count;
    });
    return Object.entries(catFreq)
      .map(([label, count]) => ({
        label, count,
        color: CAT_COLORS[label] ?? "#CCC",
        emoji: MAIN_CATEGORIES.find((c) => c.label === label)?.emoji ?? "👗",
      }))
      .sort((a, b) => b.count - a.count);
  }, [wearFreq]);

  const topWorn = useMemo(() =>
    CLOSET_ITEMS
      .filter((item) => wearFreq.has(item.id))
      .sort((a, b) => (wearFreq.get(b.id) ?? 0) - (wearFreq.get(a.id) ?? 0))
      .slice(0, 6)
      .map((item) => ({ item, count: wearFreq.get(item.id) ?? 0 })),
  [wearFreq]);

  const dormantItems = useMemo(() =>
    CLOSET_ITEMS.filter((item) => {
      const lw = lastWornMap.get(item.id);
      if (!lw) return true;
      return Math.floor((new Date(todayLocal) - new Date(lw + "T12:00:00")) / 86400000) >= 30;
    }).length,
  [lastWornMap, todayLocal]);

  const brandData = useMemo(() => {
    const counts = {};
    CLOSET_ITEMS.forEach((item) => {
      const b = item.brand ?? "기타";
      counts[b] = (counts[b] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, []);

  const seasonData = useMemo(() => {
    const counts = { 봄: 0, 여름: 0, 가을: 0, 겨울: 0 };
    CLOSET_ITEMS.forEach((item) => {
      (item.season ?? []).forEach((s) => { if (counts[s] !== undefined) counts[s]++; });
    });
    return Object.entries(counts).map(([label, count]) => ({ label, count }));
  }, []);

  const wornCount    = CLOSET_ITEMS.filter((i) => wearFreq.has(i.id)).length;
  const laundryCount = getItemsNeedingWash(2).length;
  const maxCatWear   = catWearData[0]?.count ?? 1;
  const maxBrand     = brandData[0]?.[1]     ?? 1;
  const maxSeason    = Math.max(...seasonData.map((s) => s.count), 1);
  const SEASON_CLR   = { 봄: "#FFB7C5", 여름: "#80D8A0", 가을: "#F5A843", 겨울: "#87B5E8" };

  return (
    <div className="absolute inset-0 z-[70] flex flex-col bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-4 shrink-0" style={{ height: 52, borderBottom: `1px solid ${DIVIDER}` }}>
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full active:opacity-70" style={{ backgroundColor: "#F2F2F2" }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#AAAAAA", fontFamily: FONT }}>MY CLOSET INSIGHTS</p>
          <h2 className="text-[15px] font-bold leading-tight" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>내 옷장 인사이트</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <div className="px-4 pt-4 pb-8 flex flex-col gap-5">

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: "총 아이템",     value: total,         unit: "개", color: "#1a1a1a", bg: "#F8F8F8" },
              { label: "착용 아이템",   value: wornCount,     unit: "개", color: "#2E7D32", bg: "#E8F5E9" },
              { label: "미착용 아이템", value: dormantItems,  unit: "개", color: "#C62828", bg: "#FDE8E8" },
              { label: "세탁 필요",     value: laundryCount,  unit: "개", color: "#E65100", bg: "#FFF3E0" },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl px-4 py-3.5" style={{ backgroundColor: card.bg }}>
                <p className="text-[26px] font-bold leading-none" style={{ color: card.color, fontFamily: FONT, letterSpacing: "-0.04em" }}>
                  {card.value}<span className="text-[14px] font-medium ml-1">{card.unit}</span>
                </p>
                <p className="text-[11px] mt-1" style={{ color: "rgba(0,0,0,0.48)", fontFamily: FONT }}>{card.label}</p>
              </div>
            ))}
          </div>

          {/* Category distribution */}
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${DIVIDER}` }}>
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
              <p className="text-[12px] font-bold" style={{ color: DARK, fontFamily: FONT }}>카테고리 분포</p>
            </div>
            <div className="px-4 py-4 flex gap-5 items-center">
              <DonutChart data={catData} total={total} />
              <div className="flex-1 flex flex-col gap-2 min-w-0">
                {catData.map((d) => {
                  const pct = Math.round((d.count / total) * 100);
                  return (
                    <div key={d.label} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-[11px] flex-1 truncate" style={{ color: "#555", fontFamily: FONT }}>{d.label}</span>
                      <span className="text-[10px] shrink-0" style={{ color: "#AAA", fontFamily: FONT }}>{d.count}개</span>
                      <span className="text-[11px] font-bold shrink-0 w-8 text-right" style={{ color: DARK, fontFamily: FONT }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Category wear frequency */}
          {catWearData.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${DIVIDER}` }}>
              <div className="px-4 py-3" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
                <p className="text-[12px] font-bold" style={{ color: DARK, fontFamily: FONT }}>카테고리별 착용 횟수</p>
              </div>
              <div className="px-4 py-4 flex flex-col gap-2.5">
                {catWearData.map((d) => (
                  <div key={d.label} className="flex items-center gap-2">
                    <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{d.emoji}</span>
                    <span className="text-[11px] shrink-0" style={{ color: "#555", fontFamily: FONT, width: 36 }}>{d.label}</span>
                    <div className="flex-1 rounded-full overflow-hidden" style={{ height: 8, backgroundColor: "#F0F0F0" }}>
                      <div className="h-full rounded-full" style={{ width: `${(d.count / maxCatWear) * 100}%`, backgroundColor: d.color, transition: "width 0.4s" }} />
                    </div>
                    <span className="text-[11px] font-bold shrink-0 w-8 text-right" style={{ color: DARK, fontFamily: FONT }}>{d.count}회</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top worn items */}
          {topWorn.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${DIVIDER}` }}>
              <div className="px-4 py-3" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
                <p className="text-[12px] font-bold" style={{ color: DARK, fontFamily: FONT }}>자주 입는 아이템 TOP {topWorn.length}</p>
              </div>
              <div className="px-4 py-4 grid grid-cols-3 gap-3">
                {topWorn.map(({ item, count }, rank) => (
                  <div key={item.id} className="flex flex-col">
                    <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "3/4", backgroundColor: "#F5F5F5" }}>
                      {item.image && <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />}
                      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: rank < 3 ? YELLOW : "#E8E8E8" }}>
                        <span className="text-[8px] font-bold" style={{ color: rank < 3 ? DARK : "#666", fontFamily: FONT }}>{count}회</span>
                      </div>
                    </div>
                    <p className="text-[10px] font-medium mt-1 truncate" style={{ color: DARK, fontFamily: FONT }}>{item.displayName ?? item.name}</p>
                    <p className="text-[9px] truncate" style={{ color: "#AAAAAA", fontFamily: FONT }}>{item.brand}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Brand top 5 */}
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${DIVIDER}` }}>
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
              <p className="text-[12px] font-bold" style={{ color: DARK, fontFamily: FONT }}>브랜드 TOP 5</p>
            </div>
            <div className="px-4 py-4 flex flex-col gap-2.5">
              {brandData.map(([brand, count], i) => (
                <div key={brand} className="flex items-center gap-2.5">
                  <span className="text-[10px] font-bold w-4 text-right shrink-0" style={{ color: i < 3 ? "#A07800" : "#BBBBBB", fontFamily: FONT }}>{i + 1}</span>
                  <span className="text-[11px] flex-1 truncate" style={{ color: "#444", fontFamily: FONT }}>{brand}</span>
                  <div className="rounded-full overflow-hidden" style={{ width: 80, height: 7, backgroundColor: "#F0F0F0" }}>
                    <div className="h-full rounded-full" style={{ width: `${(count / maxBrand) * 100}%`, backgroundColor: i === 0 ? YELLOW : i === 1 ? "#DDCF80" : "#E8E8E8" }} />
                  </div>
                  <span className="text-[11px] font-bold shrink-0 w-8 text-right" style={{ color: DARK, fontFamily: FONT }}>{count}개</span>
                </div>
              ))}
            </div>
          </div>

          {/* Season distribution */}
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${DIVIDER}` }}>
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
              <p className="text-[12px] font-bold" style={{ color: DARK, fontFamily: FONT }}>시즌 분포</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>아이템은 여러 시즌에 중복 집계돼요</p>
            </div>
            <div className="px-4 py-4 grid grid-cols-4 gap-2">
              {seasonData.map(({ label, count }) => (
                <div key={label} className="flex flex-col items-center gap-1.5">
                  <div className="w-full rounded-xl flex items-end justify-center pb-1.5" style={{ height: 60, backgroundColor: SEASON_CLR[label] + "33" }}>
                    <div className="w-5 rounded-lg" style={{ height: `${Math.max(8, (count / maxSeason) * 40)}px`, backgroundColor: SEASON_CLR[label] }} />
                  </div>
                  <p className="text-[11px] font-bold" style={{ color: DARK, fontFamily: FONT }}>{label}</p>
                  <p className="text-[10px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>{count}개</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dormant items summary */}
          <div className="rounded-2xl px-4 py-4 flex items-center gap-4" style={{ backgroundColor: "#FFF8F0", border: "1px solid #FFE0B2" }}>
            <span style={{ fontSize: 32, lineHeight: 1 }}>🧊</span>
            <div>
              <p className="text-[14px] font-bold" style={{ color: DARK, fontFamily: FONT }}>
                {dormantItems}개의 아이템이 쉬고 있어요
              </p>
              <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "#888", fontFamily: FONT }}>
                30일 이상 착용 기록이 없는 아이템이에요.{"\n"}옷장 앞자리로 꺼내보는 건 어떨까요?
              </p>
            </div>
          </div>

        </div>
      </div>
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
  const [showInsights,    setShowInsights]    = useState(false);

  function handleSourceSelect(source) {
    setPhotoSource(source);
    setShowSourceSheet(false);
    setAddItemOpen(true);
  }

  return (
    <div className="relative flex flex-col h-full bg-white overflow-hidden">
      <ClosetHeader onAddItem={() => setShowSourceSheet(true)} />

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <ProfileSection onSizePress={() => setMySizeOpen(true)} />

        {/* ── 옷장 인사이트 ── */}
        <InsightsBanner onInsights={() => setShowInsights(true)} />

        {/* ── 관리 팁 ── */}
        <TipsBanner onTipAction={(data) => setFullList(data)} />

        {/* ── Items + filters ── */}
        <ClothingTab
          onMorePress={(data) => setFullList(data)}
          onItemTap={onItemTap}
        />

        <div style={{ height: 24 }} />
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

      {/* Insights detail overlay */}
      {showInsights && (
        <InsightsDetailScreen onBack={() => setShowInsights(false)} />
      )}
    </div>
  );
}
