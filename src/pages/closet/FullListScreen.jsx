import { useState } from "react";
import FilterChips from "../../components/FilterChips";

const DARK = "#1a1a1a";

// ─── Single item card ─────────────────────────────────────────────────────────

function ClosetItemCard({ item, onSelect }) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div
      className="rounded-xl overflow-hidden bg-white"
      style={{ border: "1px solid #F0F0F0", cursor: onSelect ? "pointer" : "default" }}
      onClick={() => onSelect?.(item)}
    >
      {/* Image */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: "3/4", backgroundColor: "#F5F5F5" }}
      >
        {!imgErr ? (
          <img
            src={item.image}
            alt={item.name}
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: "cover", objectPosition: "center top" }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-25">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="8" width="24" height="18" rx="2" stroke="#666" strokeWidth="1.5" />
              <circle cx="16" cy="17" r="5" stroke="#666" strokeWidth="1.5" />
            </svg>
          </div>
        )}
        {/* Category badge */}
        <div
          className="absolute top-2 left-2 px-2 py-0.5 rounded-md"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <span
            className="text-[9px] font-bold text-white"
            style={{ fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            {item.subcategory}
          </span>
        </div>
        {/* For-sale badge */}
        {item.isForSale && (
          <div
            className="absolute top-2 right-2 px-2 py-0.5 rounded-md"
            style={{ backgroundColor: "#F5C200" }}
          >
            <span
              className="text-[9px] font-bold"
              style={{ color: DARK, fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
            >
              판매중
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-2.5 pt-2 pb-3">
        <p
          className="text-[9px] uppercase tracking-wide truncate"
          style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
        >
          {item.brand}
        </p>
        <p
          className="text-[12px] font-medium mt-0.5 truncate"
          style={{ color: DARK, fontFamily: "'Spoqa Han Sans Neo', sans-serif", lineHeight: 1.3 }}
        >
          {item.name}
        </p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span
            className="text-[10px] font-medium"
            style={{ color: "#888", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            {item.color}
          </span>
          <span style={{ color: "#DDD", fontSize: 10 }}>·</span>
          <span
            className="text-[10px]"
            style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            {item.size}
          </span>
        </div>
        {/* Season tags */}
        <div className="flex flex-wrap gap-1 mt-1.5">
          {item.season.map((s) => (
            <span
              key={s}
              className="text-[9px] px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: "#F5F5F5",
                color: "#888",
                fontFamily: "'Spoqa Han Sans Neo', sans-serif",
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

/**
 * FullListScreen
 *
 * Props:
 *   title       : string         — screen title, e.g. "상의 · 반팔 티셔츠"
 *   items       : ClosetItem[]   — items to display
 *   allSubcats  : string[]|null  — if provided, shows sub-filter chips
 *   onBack      : () => void
 */
export default function FullListScreen({ title, items = [], allSubcats = null, onBack, onItemSelect }) {
  const [subFilter, setSubFilter] = useState("전체");

  const filterOptions = allSubcats ? ["전체", ...allSubcats] : null;

  const visible = (!filterOptions || subFilter === "전체")
    ? items
    : items.filter((i) => i.subcategory === subFilter);

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white overflow-hidden">
      {/* ── Header ── */}
      <div
        className="shrink-0 flex items-center gap-3 px-4 pt-4 pb-3"
        style={{ borderBottom: "1px solid #F0F0F0" }}
      >
        <button
          onClick={onBack}
          className="flex items-center justify-center rounded-full shrink-0"
          style={{ width: 34, height: 34, backgroundColor: "#F2F2F2" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 3L5 8L10 13"
              stroke={DARK}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1
            className="text-[17px] font-bold truncate"
            style={{ color: DARK, fontFamily: "'Spoqa Han Sans Neo', sans-serif", letterSpacing: "-0.02em" }}
          >
            {title}
          </h1>
          <p
            className="text-[11px]"
            style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            {visible.length}개 아이템
          </p>
        </div>
      </div>

      {/* ── Sub-filter chips (optional) ── */}
      {filterOptions && (
        <div className="shrink-0 pt-3 pb-2" style={{ borderBottom: "1px solid #F4F4F4" }}>
          <FilterChips
            options={filterOptions}
            active={subFilter}
            onChange={setSubFilter}
          />
        </div>
      )}

      {/* ── Grid ── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <span style={{ fontSize: 36 }}>🔍</span>
            <p
              className="text-[13px]"
              style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
            >
              해당 카테고리에 아이템이 없어요
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {visible.map((item) => (
              <ClosetItemCard key={item.id} item={item} onSelect={onItemSelect} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
