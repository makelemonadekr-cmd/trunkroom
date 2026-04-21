/**
 * FavoritesScreen.jsx
 *
 * Full-screen favorites view with two tabs:
 *   - 내 옷장 속 즐겨찾기  (my_closet)
 *   - 남의 옷장 속 즐겨찾기 (other_closet)
 */

import { useState } from "react";
import { useFavorites } from "../lib/favoritesStore";

const FONT   = "'Spoqa Han Sans Neo', sans-serif";
const DARK   = "#1a1a1a";
const YELLOW = "#F5C200";

// ─── Single item card in the favorites grid ───────────────────────────────────

function FavoriteCard({ item, onRemove }) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div className="rounded-xl overflow-hidden bg-white" style={{ border: "1px solid #F0F0F0" }}>
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
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="3" y="7" width="22" height="16" rx="2" stroke="#999" strokeWidth="1.5" />
              <circle cx="14" cy="15" r="4" stroke="#999" strokeWidth="1.5" />
            </svg>
          </div>
        )}

        {/* Subcategory badge */}
        {(item.subCategory ?? item.subcategory) && (
          <div
            className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md"
            style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          >
            <span className="text-[8px] font-bold text-white" style={{ fontFamily: FONT }}>
              {item.subCategory ?? item.subcategory}
            </span>
          </div>
        )}

        {/* Remove favorite (active heart) */}
        <button
          onClick={() => onRemove(item)}
          className="absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 12L1.5 6.5C1 6 1 5.5 1 4.8C1 3.2 2.5 2 4.2 2C5.1 2 5.9 2.5 6.5 3.1L7 3.7L7.5 3.1C8.1 2.5 8.9 2 9.8 2C11.5 2 13 3.2 13 4.8C13 5.5 12.9 6 12.5 6.5L7 12Z"
              fill="#E84040"
              stroke="#E84040"
              strokeWidth="1.2"
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
          {item.displayName ?? item.name}
        </p>
        {item.color && item.size && (
          <p className="text-[10px] mt-0.5" style={{ color: "#BBBBBB", fontFamily: FONT }}>
            {item.color} · {item.size}
          </p>
        )}
        {item.price > 0 && (
          <p className="text-[11px] font-bold mt-1" style={{ color: DARK, fontFamily: FONT }}>
            {item.price.toLocaleString()}원
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 px-8">
      <span style={{ fontSize: 48 }}>🤍</span>
      <p
        className="text-[14px] font-medium text-center"
        style={{ color: "#AAAAAA", fontFamily: FONT }}
      >
        아직 즐겨찾기한 아이템이 없어요
      </p>
      <p
        className="text-[12px] text-center leading-relaxed"
        style={{ color: "#CCCCCC", fontFamily: FONT }}
      >
        {label === "my"
          ? "내 옷장 아이템의 하트를 눌러\n저장해보세요"
          : "다른 사람의 아이템 하트를 눌러\n저장해보세요"}
      </p>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function FavoritesScreen({ onBack }) {
  const [activeTab, setActiveTab] = useState("my"); // "my" | "others"
  const { myClosetFavorites, otherClosetFavorites, toggleFavorite } = useFavorites();

  const tabs = [
    { id: "my",     label: "내 옷장 속 즐겨찾기",   items: myClosetFavorites,     sourceType: "my_closet"    },
    { id: "others", label: "남의 옷장 속 즐겨찾기",  items: otherClosetFavorites,  sourceType: "other_closet" },
  ];

  const current = tabs.find((t) => t.id === activeTab);

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-white">

      {/* ── Header ── */}
      <div
        className="shrink-0 flex items-center justify-between px-4 h-14"
        style={{ borderBottom: "1px solid #F0F0F0" }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M12.5 4L7 10L12.5 16"
              stroke={DARK}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <h2
            className="text-[17px] font-bold"
            style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}
          >
            즐겨찾기
          </h2>
          {myClosetFavorites.length + otherClosetFavorites.length > 0 && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: YELLOW, color: DARK, fontFamily: FONT }}
            >
              {myClosetFavorites.length + otherClosetFavorites.length}
            </span>
          )}
        </div>

        <div style={{ width: 36 }} />
      </div>

      {/* ── Segment tabs ── */}
      <div
        className="shrink-0 flex"
        style={{ borderBottom: "1px solid #F0F0F0" }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex flex-col items-center pt-3.5 pb-0"
            >
              <div className="flex items-center justify-center gap-1.5 pb-3">
                <span
                  className="text-[12px]"
                  style={{
                    color:      isActive ? DARK : "#AAAAAA",
                    fontWeight: isActive ? 700  : 400,
                    fontFamily: FONT,
                  }}
                >
                  {tab.label}
                </span>
                {tab.items.length > 0 && (
                  <span
                    className="text-[9px] font-bold px-1.5 rounded-full"
                    style={{
                      backgroundColor: isActive ? YELLOW : "#F0F0F0",
                      color:           isActive ? DARK   : "#AAAAAA",
                      fontFamily:      FONT,
                      lineHeight:      "16px",
                    }}
                  >
                    {tab.items.length}
                  </span>
                )}
              </div>
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

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {current.items.length === 0 ? (
          <EmptyState label={activeTab} />
        ) : (
          <div className="grid grid-cols-2 gap-3 px-4 pt-4 pb-6">
            {current.items.map((item) => (
              <FavoriteCard
                key={item.id}
                item={item}
                onRemove={(item) => toggleFavorite(item, current.sourceType)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
