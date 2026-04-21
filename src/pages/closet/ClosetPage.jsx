import { useState } from "react";
import FilterChips from "../../components/FilterChips";
import FullListScreen from "./FullListScreen";
import {
  MAIN_CATEGORIES,
  CLOSET_ITEMS,
  getItemsByCategory,
} from "../../constants/mockClosetData";
import { STYLE_FILTER_OPTIONS } from "../../constants/styleCategories";
import { SEASON_FILTER_OPTIONS } from "../../constants/seasonFilters";
import { getOutfitsByStyleAndSeason } from "../../constants/mockOutfitData";

const YELLOW = "#F5C200";
const DARK   = "#1a1a1a";

// ─── Category filter options ──────────────────────────────────────────────────
const CAT_FILTERS = ["전체", ...MAIN_CATEGORIES.map((c) => c.label)];

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
        style={{ color: DARK, fontFamily: "'Spoqa Han Sans Neo', sans-serif", letterSpacing: "-0.02em" }}
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
function ProfileSection() {
  return (
    <div className="px-5 py-4 bg-white" style={{ borderBottom: "1px solid #F0F0F0" }}>
      <div className="flex items-center gap-4">
        <div
          className="flex items-center justify-center rounded-full shrink-0"
          style={{ width: 56, height: 56, backgroundColor: "#EBEBEB" }}
        >
          <img
            src="/officiallogo.png"
            alt="avatar"
            style={{ width: 32, height: 32, objectFit: "contain", opacity: 0.55 }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-[16px] font-bold truncate"
            style={{ color: DARK, fontFamily: "'Spoqa Han Sans Neo', sans-serif", letterSpacing: "-0.02em" }}
          >
            나의 옷장
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[11px]" style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
              팔로워 <span style={{ color: "#555", fontWeight: 700 }}>2,125</span>
            </span>
            <span style={{ color: "#E0E0E0", fontSize: 10 }}>·</span>
            <span className="text-[11px]" style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
              팔로잉 <span style={{ color: "#555", fontWeight: 700 }}>835</span>
            </span>
          </div>
        </div>
        <button
          className="flex items-center gap-1 px-3 py-1.5 rounded-sm shrink-0"
          style={{ backgroundColor: "#F5F5F5", border: "1px solid #E8E8E8" }}
        >
          <span className="text-[12px] font-medium" style={{ color: "#333", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>내 사이즈</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2.5L7.5 6L4 9.5" stroke="#888" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function SubStats() {
  const items = [
    { label: "옷장의류", value: `${CLOSET_ITEMS.length}` },
    { label: "공개의류", value: "105" },
    { label: "후기",     value: "34"  },
    { label: "쿠폰",     value: "280" },
  ];
  return (
    <div className="flex items-stretch bg-white" style={{ borderBottom: "1px solid #F0F0F0" }}>
      {items.map((item, i) => (
        <div key={item.label} className="flex-1 flex flex-col items-center py-2.5 relative">
          {i > 0 && <div className="absolute left-0 top-2 bottom-2" style={{ width: 1, backgroundColor: "#EEEEEE" }} />}
          <p className="text-[10px]" style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>{item.label}</p>
          <p className="text-[15px] font-bold mt-0.5" style={{ color: DARK, fontFamily: "'Spoqa Han Sans Neo', sans-serif", letterSpacing: "-0.02em" }}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function SubTabs({ active, onChange }) {
  const tabs = [
    { id: "clothing", label: "내 의류"  },
    { id: "codebook", label: "코디북"   },
    { id: "history",  label: "거래내역" },
  ];
  return (
    <div className="flex bg-white" style={{ borderBottom: "1px solid #F0F0F0" }}>
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)} className="flex-1 flex flex-col items-center pt-3 pb-0">
            <span
              className="text-[13px] pb-2.5"
              style={{ color: isActive ? DARK : "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif", fontWeight: isActive ? 700 : 400 }}
            >
              {tab.label}
            </span>
            <div style={{ height: 2, width: "100%", backgroundColor: isActive ? DARK : "transparent", borderRadius: 1 }} />
          </button>
        );
      })}
    </div>
  );
}

// ─── Clothing item card ────────────────────────────────────────────────────────
function ClothingItemCard({ item }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden bg-white" style={{ border: "1px solid #F0F0F0" }}>
      <div className="relative overflow-hidden" style={{ aspectRatio: "3/4", backgroundColor: "#F5F5F5" }}>
        {!imgErr ? (
          <img
            src={item.image}
            alt={item.name}
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: "cover", objectPosition: "center top" }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="3" y="7" width="22" height="16" rx="2" stroke="#999" strokeWidth="1.5" />
              <circle cx="14" cy="15" r="4" stroke="#999" strokeWidth="1.5" />
            </svg>
          </div>
        )}
        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
          <span className="text-[8px] font-bold text-white" style={{ fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
            {item.subcategory ?? item.subCategory}
          </span>
        </div>
        {item.isForSale && (
          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md" style={{ backgroundColor: YELLOW }}>
            <span className="text-[8px] font-bold" style={{ color: DARK, fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>판매중</span>
          </div>
        )}
      </div>
      <div className="px-2 pt-1.5 pb-2.5">
        <p className="text-[9px] uppercase tracking-wide truncate" style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>{item.brand}</p>
        <p className="text-[11px] font-medium mt-0.5 truncate" style={{ color: DARK, fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>{item.name}</p>
        <p className="text-[10px] mt-0.5" style={{ color: "#BBBBBB", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
          {item.color} · {item.size}
        </p>
      </div>
    </div>
  );
}

// ─── 내 의류 tab ──────────────────────────────────────────────────────────────
function ClothingTab({ onMorePress }) {
  const [catFilter, setCatFilter] = useState("전체");

  const filtered = catFilter === "전체" ? CLOSET_ITEMS : getItemsByCategory(catFilter);

  return (
    <div>
      <div className="py-3 bg-white" style={{ borderBottom: "1px solid #F4F4F4" }}>
        <FilterChips options={CAT_FILTERS} active={catFilter} onChange={setCatFilter} />
      </div>
      <div className="flex items-center justify-between px-5 py-3">
        <p className="text-[12px] font-medium" style={{ color: "#888", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
          {catFilter === "전체" ? "전체" : catFilter} {filtered.length}개
        </p>
        {filtered.length > 0 && (
          <button
            onClick={() => onMorePress({ title: catFilter === "전체" ? "전체 의류" : catFilter, items: filtered })}
            className="flex items-center gap-0.5"
          >
            <span className="text-[12px]" style={{ color: "#888", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>더보기</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3L9 7L5 11" stroke="#888" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        {filtered.slice(0, 8).map((item) => (
          <ClothingItemCard key={item.id} item={item} />
        ))}
      </div>
      {filtered.length > 8 && (
        <div className="px-4 pb-6">
          <button
            onClick={() => onMorePress({ title: catFilter === "전체" ? "전체 의류" : catFilter, items: filtered })}
            className="w-full py-3 rounded-xl text-[13px] font-bold"
            style={{ backgroundColor: "#F5F5F5", color: "#555", fontFamily: "'Spoqa Han Sans Neo', sans-serif", border: "1px solid #EBEBEB" }}
          >
            {filtered.length - 8}개 더보기
          </button>
        </div>
      )}
    </div>
  );
}

// ─── 코디북 tab (updated: 스타일 + 시즌 dual filter) ─────────────────────────
function CodibookTab() {
  const [styleFilter,  setStyleFilter]  = useState("전체");
  const [seasonFilter, setSeasonFilter] = useState("전체");
  const [liked,        setLiked]        = useState({});

  const toggle = (id) => setLiked((prev) => ({ ...prev, [id]: !prev[id] }));

  const filtered = getOutfitsByStyleAndSeason(styleFilter, seasonFilter);

  return (
    <div>
      {/* Row 1: 스타일 filter */}
      <div
        className="bg-white pt-3 pb-2"
        style={{ borderBottom: "none" }}
      >
        <p
          className="px-4 text-[10px] font-bold tracking-[0.12em] uppercase mb-2"
          style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
        >
          스타일
        </p>
        <div
          className="flex overflow-x-auto px-4 gap-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {STYLE_FILTER_OPTIONS.map((s) => {
            const isActive = styleFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStyleFilter(s)}
                className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all"
                style={{
                  backgroundColor: isActive ? DARK : "#F2F2F2",
                  color:           isActive ? "white" : "#555",
                  fontFamily:      "'Spoqa Han Sans Neo', sans-serif",
                  border:          isActive ? `1.5px solid ${DARK}` : "1.5px solid transparent",
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2: 시즌 filter */}
      <div className="bg-white pt-2 pb-3" style={{ borderBottom: "1px solid #F0F0F0" }}>
        <p
          className="px-4 text-[10px] font-bold tracking-[0.12em] uppercase mb-2"
          style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
        >
          시즌
        </p>
        <div className="flex px-4 gap-2">
          {SEASON_FILTER_OPTIONS.map((s) => {
            const isActive = seasonFilter === s;
            return (
              <button
                key={s}
                onClick={() => setSeasonFilter(s)}
                className="shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-all"
                style={{
                  backgroundColor: isActive ? YELLOW : "#F9F9F9",
                  color:           isActive ? DARK    : "#888",
                  fontFamily:      "'Spoqa Han Sans Neo', sans-serif",
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
        <p className="text-[11px]" style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
          {styleFilter !== "전체" ? `${styleFilter} · ` : ""}
          {seasonFilter !== "전체" ? `${seasonFilter} · ` : ""}
          {filtered.length}개 코디
        </p>
      </div>

      {/* Outfit grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <span style={{ fontSize: 36 }}>🔍</span>
          <p className="text-[13px]" style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
            해당 조건의 코디가 없어요
          </p>
        </div>
      ) : (
        <div className="bg-white px-3 pt-2 pb-4">
          <div className="grid grid-cols-2 gap-2">
            {filtered.map((outfit) => (
              <div key={outfit.id} className="relative rounded-2xl overflow-hidden bg-[#F5F5F5]">
                <img
                  src={outfit.previewImage}
                  alt={outfit.title}
                  style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
                />
                {/* Gradient overlay */}
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%)" }}
                />
                {/* Like button */}
                <button
                  onClick={() => toggle(outfit.id)}
                  className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.82)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M7 12L1.5 6.5C1 6 1 5.5 1 4.8C1 3.2 2.5 2 4.2 2C5.1 2 5.9 2.5 6.5 3.1L7 3.7L7.5 3.1C8.1 2.5 8.9 2 9.8 2C11.5 2 13 3.2 13 4.8C13 5.5 12.9 6 12.5 6.5L7 12Z"
                      fill={liked[outfit.id] ? "#E84040" : "none"}
                      stroke={liked[outfit.id] ? "#E84040" : "#888"}
                      strokeWidth="1.2"
                    />
                  </svg>
                </button>
                {/* Style + season badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[8px] font-bold"
                    style={{ backgroundColor: "rgba(0,0,0,0.55)", color: "white", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
                  >
                    {outfit.style}
                  </span>
                </div>
                {/* Bottom title */}
                <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5">
                  <p
                    className="text-white text-[11px] font-bold leading-snug"
                    style={{ fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
                  >
                    {outfit.title}
                  </p>
                  <p
                    className="text-[9px] mt-0.5"
                    style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
                  >
                    {outfit.season.join(" · ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 거래내역 tab ─────────────────────────────────────────────────────────────
function HistoryTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <span style={{ fontSize: 40 }}>📋</span>
      <p className="text-[14px] font-medium" style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>거래 내역이 없어요</p>
      <p className="text-[12px] text-center leading-relaxed" style={{ color: "#CCCCCC", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
        판매하거나 구매한 아이템이<br />이곳에 나타납니다
      </p>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function ClosetPage() {
  const [activeSubTab, setActiveSubTab] = useState("clothing");
  const [fullList,     setFullList]     = useState(null);

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      <ClosetHeader />

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <ProfileSection />
        <SubStats />
        <SubTabs active={activeSubTab} onChange={setActiveSubTab} />

        {activeSubTab === "clothing" && (
          <ClothingTab onMorePress={(data) => setFullList(data)} />
        )}
        {activeSubTab === "codebook" && <CodibookTab />}
        {activeSubTab === "history"  && <HistoryTab />}
      </div>

      {/* Sticky CTA */}
      <div className="px-4 py-3 bg-white shrink-0" style={{ borderTop: "1px solid #F0F0F0" }}>
        <button
          className="w-full flex items-center justify-center rounded-sm"
          style={{ backgroundColor: "#313439", height: 48, fontFamily: "'Spoqa Han Sans Neo', sans-serif", fontSize: 15, fontWeight: 700, color: "white", letterSpacing: "-0.01em" }}
        >
          코디 만들기
        </button>
      </div>

      {/* FullListScreen overlay */}
      {fullList && (
        <FullListScreen
          title={fullList.title}
          items={fullList.items}
          onBack={() => setFullList(null)}
        />
      )}
    </div>
  );
}
