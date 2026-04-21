import { useState } from "react";

const YELLOW = "#F5C200";

const ITEM_TYPES = ["전체", "의류", "신발", "가방", "액세서리"];

const CATEGORIES = [
  { id: "top",    label: "TOP",    icon: "👕" },
  { id: "bottom", label: "BOTTOM", icon: "👖" },
  { id: "outer",  label: "OUTER",  icon: "🧥" },
  { id: "ops",    label: "OPS",    icon: "👗" },
  { id: "bag",    label: "BAG",    icon: "👜" },
  { id: "shoes",  label: "SHOES",  icon: "👟" },
  { id: "acc",    label: "ACC",    icon: "💍" },
  { id: "others", label: "OTHERS", icon: "🎽" },
];

const CONDITIONS = ["S급", "A급", "B급"];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "FREE"];

export default function ProductFilterSheet({ onClose, onApply }) {
  const [selectedType,       setSelectedType]       = useState("전체");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [selectedSizes,      setSelectedSizes]      = useState([]);
  const [minPrice,           setMinPrice]           = useState(0);
  const [maxPrice,           setMaxPrice]           = useState(500000);
  const [brandQuery,         setBrandQuery]         = useState("");
  const [boxOnly,            setBoxOnly]            = useState(false);

  function toggleArr(arr, setArr, val) {
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  }

  function handleReset() {
    setSelectedType("전체");
    setSelectedCategories([]);
    setSelectedConditions([]);
    setSelectedSizes([]);
    setMinPrice(0);
    setMaxPrice(500000);
    setBrandQuery("");
    setBoxOnly(false);
  }

  function handleApply() {
    onApply?.({ selectedType, selectedCategories, selectedConditions, selectedSizes, minPrice, maxPrice, brandQuery, boxOnly });
    onClose();
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      {/* Tap backdrop to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Sheet */}
      <div className="bg-white flex flex-col" style={{ borderRadius: "16px 16px 0 0", maxHeight: "85%", minHeight: "60%" }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="rounded-full" style={{ width: 36, height: 4, backgroundColor: "#DDDDDD" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 shrink-0" style={{ borderBottom: "1px solid #F0F0F0" }}>
          <p className="text-[16px] font-bold" style={{ color: "#1a1a1a", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
            필터
          </p>
          <button onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4L16 16M16 4L4 16" stroke="#333" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5" style={{ scrollbarWidth: "none" }}>

          {/* Item type */}
          <FilterSection title="상품 유형">
            <div className="flex flex-wrap gap-2">
              {ITEM_TYPES.map(t => (
                <Chip key={t} label={t} active={selectedType === t} onToggle={() => setSelectedType(t)} />
              ))}
            </div>
          </FilterSection>

          {/* Category */}
          <FilterSection title="카테고리">
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(cat => {
                const active = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleArr(selectedCategories, setSelectedCategories, cat.id)}
                    className="flex flex-col items-center py-3 rounded-lg"
                    style={{
                      backgroundColor: active ? "#FFFBEB" : "#F8F8F8",
                      border: active ? `1.5px solid ${YELLOW}` : "1.5px solid transparent",
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{cat.icon}</span>
                    <span className="text-[10px] font-medium mt-1" style={{ color: active ? "#1a1a1a" : "#666", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </FilterSection>

          {/* Condition */}
          <FilterSection title="상태">
            <div className="flex gap-2">
              {CONDITIONS.map(c => (
                <Chip key={c} label={c} active={selectedConditions.includes(c)} onToggle={() => toggleArr(selectedConditions, setSelectedConditions, c)} />
              ))}
            </div>
          </FilterSection>

          {/* Size */}
          <FilterSection title="사이즈">
            <div className="flex flex-wrap gap-2">
              {SIZES.map(s => (
                <Chip key={s} label={s} active={selectedSizes.includes(s)} onToggle={() => toggleArr(selectedSizes, setSelectedSizes, s)} />
              ))}
            </div>
          </FilterSection>

          {/* Brand search */}
          <FilterSection title="브랜드">
            <div
              className="flex items-center gap-2 px-3 rounded-lg"
              style={{ backgroundColor: "#F5F5F5", height: 40 }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="#AAA" strokeWidth="1.4" />
                <path d="M11 11L14 14" stroke="#AAA" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input
                value={brandQuery}
                onChange={e => setBrandQuery(e.target.value)}
                placeholder="브랜드 검색"
                className="flex-1 bg-transparent text-[13px] outline-none"
                style={{ color: "#333", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
              />
            </div>
          </FilterSection>

          {/* Price range */}
          <FilterSection title="가격">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-medium" style={{ color: "#1a1a1a", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
                {minPrice.toLocaleString()}원
              </span>
              <span className="text-[12px]" style={{ color: "#AAAAAA" }}>–</span>
              <span className="text-[13px] font-medium" style={{ color: "#1a1a1a", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
                {maxPrice >= 500000 ? "500,000원+" : `${maxPrice.toLocaleString()}원`}
              </span>
            </div>
            <input
              type="range" min={0} max={500000} step={10000}
              value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: YELLOW }}
            />
          </FilterSection>

          {/* Box toggle */}
          <FilterSection title="박스 여부">
            <button
              onClick={() => setBoxOnly(b => !b)}
              className="flex items-center gap-3"
            >
              <div
                className="rounded-full transition-colors duration-200"
                style={{
                  width: 44,
                  height: 24,
                  backgroundColor: boxOnly ? YELLOW : "#E0E0E0",
                  position: "relative",
                }}
              >
                <div
                  className="rounded-full bg-white absolute top-0.5 transition-all duration-200"
                  style={{
                    width: 20,
                    height: 20,
                    left: boxOnly ? 22 : 2,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }}
                />
              </div>
              <span className="text-[13px]" style={{ color: "#444", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
                박스 있는 상품만 보기
              </span>
            </button>
          </FilterSection>

          <div style={{ height: 24 }} />
        </div>

        {/* Footer buttons */}
        <div className="shrink-0 flex gap-3 px-5 py-4" style={{ borderTop: "1px solid #F0F0F0" }}>
          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-sm"
            style={{ backgroundColor: "#F5F5F5", minWidth: 90 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7C2 4.24 4.24 2 7 2C8.56 2 9.96 2.7 10.9 3.8L9 5.5H13V1.5L11.4 3.1C10.2 1.8 8.7 1 7 1C3.69 1 1 3.69 1 7H2Z" fill="#666" />
              <path d="M12 7C12 9.76 9.76 12 7 12C5.44 12 4.04 11.3 3.1 10.2L5 8.5H1V12.5L2.6 10.9C3.8 12.2 5.3 13 7 13C10.31 13 13 10.31 13 7H12Z" fill="#666" />
            </svg>
            <span className="text-[13px] font-medium" style={{ color: "#666", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
              필터 초기화
            </span>
          </button>
          <button
            onClick={handleApply}
            className="flex-1 flex items-center justify-center py-3 rounded-sm"
            style={{ backgroundColor: "#1a1a1a" }}
          >
            <span className="text-[14px] font-bold text-white" style={{ fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
              필터 적용하기
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterSection({ title, children }) {
  return (
    <div className="py-5" style={{ borderBottom: "1px solid #F5F5F5" }}>
      <p className="text-[13px] font-bold mb-3" style={{ color: "#1a1a1a", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function Chip({ label, active, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="px-3 py-1.5 rounded-full text-[12px] font-medium"
      style={{
        backgroundColor: active ? "#1a1a1a" : "#F5F5F5",
        color: active ? "white" : "#555",
        fontFamily: "'Spoqa Han Sans Neo', sans-serif",
        border: active ? "1.5px solid #1a1a1a" : "1.5px solid transparent",
      }}
    >
      {label}
    </button>
  );
}
