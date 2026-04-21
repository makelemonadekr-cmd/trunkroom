import { useState } from "react";

const YELLOW = "#F5C200";

const STYLE_TAGS = [
  { id: "daily",      label: "데일리" },
  { id: "office",     label: "오피스" },
  { id: "weekend",    label: "주말룩" },
  { id: "date",       label: "데이트" },
  { id: "vacation",   label: "바캉스" },
  { id: "street",     label: "스트릿" },
  { id: "special",    label: "스페셜" },
  { id: "minimal",    label: "미니멀" },
  { id: "feminine",   label: "페미닌" },
  { id: "vintage",    label: "빈티지" },
];

const SEASONS = ["봄", "여름", "가을", "겨울"];

export default function StyleBookFilterSheet({ onClose, onApply }) {
  const [selectedStyles,  setSelectedStyles]  = useState([]);
  const [selectedSeasons, setSelectedSeasons] = useState([]);
  const [brandQuery,      setBrandQuery]      = useState("");

  function toggleArr(arr, setArr, val) {
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  }

  function handleReset() {
    setSelectedStyles([]);
    setSelectedSeasons([]);
    setBrandQuery("");
  }

  function handleApply() {
    onApply?.({ selectedStyles, selectedSeasons, brandQuery });
    onClose();
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      {/* Tap backdrop to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Sheet */}
      <div className="bg-white flex flex-col" style={{ borderRadius: "16px 16px 0 0", maxHeight: "75%" }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="rounded-full" style={{ width: 36, height: 4, backgroundColor: "#DDDDDD" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 shrink-0" style={{ borderBottom: "1px solid #F0F0F0" }}>
          <p className="text-[16px] font-bold" style={{ color: "#1a1a1a", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
            스타일북 필터
          </p>
          <button onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4L16 16M16 4L4 16" stroke="#333" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5" style={{ scrollbarWidth: "none" }}>

          {/* Style tags */}
          <FilterSection title="스타일">
            <div className="flex flex-wrap gap-2">
              {STYLE_TAGS.map(tag => {
                const active = selectedStyles.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleArr(selectedStyles, setSelectedStyles, tag.id)}
                    className="px-4 py-2 rounded-full text-[12px] font-medium"
                    style={{
                      backgroundColor: active ? YELLOW : "#F5F5F5",
                      color: active ? "#1a1a1a" : "#555",
                      fontFamily: "'Spoqa Han Sans Neo', sans-serif",
                      border: active ? `1.5px solid ${YELLOW}` : "1.5px solid transparent",
                    }}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </FilterSection>

          {/* Season */}
          <FilterSection title="시즌">
            <div className="flex gap-3">
              {SEASONS.map(s => {
                const active = selectedSeasons.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleArr(selectedSeasons, setSelectedSeasons, s)}
                    className="flex-1 py-3 rounded-lg text-[13px] font-medium"
                    style={{
                      backgroundColor: active ? "#FFFBEB" : "#F8F8F8",
                      color: active ? "#1a1a1a" : "#666",
                      fontFamily: "'Spoqa Han Sans Neo', sans-serif",
                      border: active ? `1.5px solid ${YELLOW}` : "1.5px solid transparent",
                    }}
                  >
                    {s}
                  </button>
                );
              })}
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
              초기화
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
