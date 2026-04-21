import { useState } from "react";
import { MAIN_CATEGORIES } from "../constants/mockClosetData";
import { filterItemsBySearch } from "../lib/filterItemsBySearch";

// ─── Design tokens ────────────────────────────────────────────────────────────
const FONT    = "'Spoqa Han Sans Neo', sans-serif";
const DARK    = "#1a1a1a";
const GRAY    = "#888";
const LIGHT   = "#F5F5F5";
const DIVIDER = "#F0F0F0";
const YELLOW  = "#F5C200";

// ─── Static option lists ──────────────────────────────────────────────────────
const TOP_BRANDS = [
  "UNIQLO", "ZARA", "COS", "H&M", "ARKET",
  "MUSINSA STD", "ADIDAS", "NIKE", "LEVIS",
  "MAJE", "SANDRO", "TOTEME", "LULULEMON",
  "& OTHER STORIES", "CHAMPION", "STUSSY",
];

const CLOTHES_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "FREE"];
const SHOE_SIZES    = ["230", "235", "240", "245", "250", "255", "260"];
const CONDITIONS    = ["새상품급", "상태 좋음", "사용감 있음"];

const WEAR_OPTIONS = [
  { label: "미착용",    value: "never"  },
  { label: "1~5회",    value: "1-5"    },
  { label: "6~10회",   value: "6-10"   },
  { label: "10회 이상", value: "10plus" },
];

const PRICE_OPTIONS = [
  { label: "전체",       value: "all"       },
  { label: "5만원 이하", value: "under50k"  },
  { label: "5~10만원",   value: "50-100k"   },
  { label: "10~30만원",  value: "100-300k"  },
  { label: "30만원 초과", value: "over300k" },
];

// ─── Helper: toggle value in array ───────────────────────────────────────────
function toggleArr(arr, setArr, val) {
  setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <p
      className="text-[11px] font-bold tracking-[0.08em] uppercase mb-3"
      style={{ color: "#AAAAAA", fontFamily: FONT }}
    >
      {children}
    </p>
  );
}

function Chip({ label, selected, onToggle, emoji }) {
  return (
    <button
      onClick={onToggle}
      className="shrink-0 flex items-center gap-1 px-3 h-8 rounded-full transition-colors"
      style={{
        backgroundColor: selected ? DARK : LIGHT,
        border: selected ? `1.5px solid ${DARK}` : `1.5px solid transparent`,
        fontFamily: FONT,
      }}
    >
      {emoji && <span style={{ fontSize: 13 }}>{emoji}</span>}
      <span
        className="text-[12px] font-medium"
        style={{ color: selected ? "white" : DARK }}
      >
        {label}
      </span>
      {selected && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 5L4.2 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

function RadioChip({ label, selected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className="shrink-0 flex items-center gap-1 px-3 h-8 rounded-full transition-colors"
      style={{
        backgroundColor: selected ? YELLOW : LIGHT,
        border: selected ? `1.5px solid ${YELLOW}` : `1.5px solid transparent`,
        fontFamily: FONT,
      }}
    >
      <span
        className="text-[12px] font-medium"
        style={{ color: selected ? DARK : GRAY }}
      >
        {label}
      </span>
    </button>
  );
}

function ToggleRow({ label, desc, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-[14px] font-medium" style={{ color: DARK, fontFamily: FONT }}>
          {label}
        </p>
        {desc && (
          <p className="text-[11px] mt-0.5" style={{ color: GRAY, fontFamily: FONT }}>
            {desc}
          </p>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        className="shrink-0 relative transition-colors"
        style={{
          width: 44,
          height: 26,
          borderRadius: 13,
          backgroundColor: value ? DARK : "#DDDDDD",
        }}
      >
        <span
          className="absolute transition-transform"
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: "white",
            top: 3,
            left: 3,
            transform: value ? "translateX(18px)" : "translateX(0)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            display: "block",
          }}
        />
      </button>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ children }) {
  return (
    <div
      className="px-5 py-5"
      style={{ borderBottom: `1px solid ${DIVIDER}` }}
    >
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SearchFilterScreen({ onClose, onSearch }) {
  const [keyword,       setKeyword]       = useState("");
  const [categories,    setCategories]    = useState([]);
  const [brands,        setBrands]        = useState([]);
  const [sizes,         setSizes]         = useState([]);
  const [conditions,    setConditions]    = useState([]);
  const [wearOption,    setWearOption]    = useState(null);
  const [notWornInYear, setNotWornInYear] = useState(false);
  const [priceOption,   setPriceOption]   = useState("all");
  const [hasBox,        setHasBox]        = useState(false);

  // Active filter count (for badge)
  const activeCount = [
    keyword.trim() ? 1 : 0,
    categories.length,
    brands.length,
    sizes.length,
    conditions.length,
    wearOption ? 1 : 0,
    notWornInYear ? 1 : 0,
    priceOption !== "all" ? 1 : 0,
    hasBox ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  function reset() {
    setKeyword(""); setCategories([]); setBrands([]); setSizes([]);
    setConditions([]); setWearOption(null); setNotWornInYear(false);
    setPriceOption("all"); setHasBox(false);
  }

  function handleSearch() {
    const results = filterItemsBySearch({
      keyword, categories, brands, sizes, conditions,
      wearOption, notWornInYear, priceOption, hasBox,
    });
    onSearch(results);
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-white">

      {/* ── Header ── */}
      <div
        className="shrink-0 flex items-center justify-between px-5 h-14"
        style={{ borderBottom: `1px solid ${DIVIDER}` }}
      >
        <div className="flex items-center gap-2">
          <h2
            className="text-[17px] font-bold"
            style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}
          >
            검색 / 필터
          </h2>
          {activeCount > 0 && (
            <span
              className="flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold text-white"
              style={{ backgroundColor: YELLOW, color: DARK }}
            >
              {activeCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ backgroundColor: LIGHT }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2L12 12M12 2L2 12" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* ── Scrollable sections ── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>

        {/* ① 검색어 */}
        <Section>
          <SectionTitle>검색어</SectionTitle>
          <div
            className="flex items-center gap-2 px-3 h-10 rounded-xl"
            style={{ backgroundColor: LIGHT }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="#AAAAAA" strokeWidth="1.4" />
              <path d="M10 10L13.5 13.5" stroke="#AAAAAA" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="브랜드, 아이템명, 스타일 태그 검색"
              className="flex-1 bg-transparent outline-none text-[13px]"
              style={{ color: DARK, fontFamily: FONT }}
            />
            {keyword && (
              <button onClick={() => setKeyword("")}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" fill="#CCCCCC" />
                  <path d="M5 5L9 9M9 5L5 9" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </Section>

        {/* ② 카테고리 */}
        <Section>
          <SectionTitle>카테고리</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {MAIN_CATEGORIES.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.label}
                emoji={cat.emoji}
                selected={categories.includes(cat.id)}
                onToggle={() => toggleArr(categories, setCategories, cat.id)}
              />
            ))}
          </div>
        </Section>

        {/* ③ 브랜드 */}
        <Section>
          <SectionTitle>브랜드</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {TOP_BRANDS.map((b) => (
              <Chip
                key={b}
                label={b}
                selected={brands.includes(b)}
                onToggle={() => toggleArr(brands, setBrands, b)}
              />
            ))}
          </div>
        </Section>

        {/* ④ 사이즈 */}
        <Section>
          <SectionTitle>사이즈</SectionTitle>
          <p className="text-[10px] mb-2" style={{ color: GRAY, fontFamily: FONT }}>의류</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {CLOTHES_SIZES.map((s) => (
              <Chip
                key={s}
                label={s}
                selected={sizes.includes(s)}
                onToggle={() => toggleArr(sizes, setSizes, s)}
              />
            ))}
          </div>
          <p className="text-[10px] mb-2" style={{ color: GRAY, fontFamily: FONT }}>신발 (mm)</p>
          <div className="flex flex-wrap gap-2">
            {SHOE_SIZES.map((s) => (
              <Chip
                key={s}
                label={s}
                selected={sizes.includes(s)}
                onToggle={() => toggleArr(sizes, setSizes, s)}
              />
            ))}
          </div>
        </Section>

        {/* ⑤ 상태 */}
        <Section>
          <SectionTitle>상태</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => (
              <Chip
                key={c}
                label={c}
                selected={conditions.includes(c)}
                onToggle={() => toggleArr(conditions, setConditions, c)}
              />
            ))}
          </div>
        </Section>

        {/* ⑥ 착용횟수 */}
        <Section>
          <SectionTitle>착용횟수</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {WEAR_OPTIONS.map((opt) => (
              <RadioChip
                key={opt.value}
                label={opt.label}
                selected={wearOption === opt.value}
                onSelect={() =>
                  setWearOption(wearOption === opt.value ? null : opt.value)
                }
              />
            ))}
          </div>
        </Section>

        {/* ⑦ 1년 안입은 옷 */}
        <Section>
          <ToggleRow
            label="1년 동안 안 입은 옷"
            desc="최근 1년간 착용 기록이 없는 아이템만 표시"
            value={notWornInYear}
            onChange={setNotWornInYear}
          />
        </Section>

        {/* ⑧ 가격범위 */}
        <Section>
          <SectionTitle>가격범위</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {PRICE_OPTIONS.map((opt) => (
              <RadioChip
                key={opt.value}
                label={opt.label}
                selected={priceOption === opt.value}
                onSelect={() => setPriceOption(opt.value)}
              />
            ))}
          </div>
        </Section>

        {/* ⑨ 박스여부 */}
        <Section>
          <ToggleRow
            label="박스 있는 아이템만"
            desc="정품 박스 또는 쇼핑백이 보관된 아이템"
            value={hasBox}
            onChange={setHasBox}
          />
        </Section>

        <div style={{ height: 8 }} />
      </div>

      {/* ── Bottom action bar ── */}
      <div
        className="shrink-0 flex gap-3 px-5 py-4"
        style={{ borderTop: `1px solid ${DIVIDER}`, backgroundColor: "white" }}
      >
        {/* 필터 초기화 */}
        <button
          onClick={reset}
          className="flex items-center justify-center h-12 rounded-xl px-4"
          style={{
            minWidth: 100,
            backgroundColor: LIGHT,
            fontFamily: FONT,
          }}
        >
          {activeCount > 0 && (
            <span
              className="mr-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: "#DDD", color: GRAY }}
            >
              {activeCount}
            </span>
          )}
          <span className="text-[13px] font-medium" style={{ color: GRAY }}>
            초기화
          </span>
        </button>

        {/* 검색하기 */}
        <button
          onClick={handleSearch}
          className="flex-1 flex items-center justify-center h-12 rounded-xl gap-1.5"
          style={{ backgroundColor: DARK, fontFamily: FONT }}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="white" strokeWidth="1.5" />
            <path d="M10 10L13.5 13.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-[14px] font-bold text-white">검색하기</span>
        </button>
      </div>
    </div>
  );
}
