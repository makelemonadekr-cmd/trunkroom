import { useState } from "react";
import { STYLE_FILTER_OPTIONS } from "../../constants/styleCategories";
import { SEASON_FILTER_OPTIONS } from "../../constants/seasonFilters";
import { OUTFIT_DATA, getOutfitsByStyleAndSeason } from "../../constants/mockOutfitData";
import OutfitDetailScreen from "../../components/OutfitDetailScreen";
import CoordiEditorPage from "./CoordiEditorPage";
import LazyImage from "../../components/LazyImage";
import { isLiked, getLikeCount, toggleLike } from "../../lib/likesStore";

const DARK   = "#1a1a1a";
const YELLOW = "#F5C200";

// ─── Outfit card ──────────────────────────────────────────────────────────────

function OutfitCard({ board, onTap }) {
  // Initialise from persisted store so state survives page switches / remounts
  const [liked, setLiked] = useState(() => isLiked(board.id));
  const [likes, setLikes] = useState(() => getLikeCount(board.id, board.likes));

  function handleLike(e) {
    e.stopPropagation();
    const result = toggleLike(board.id, board.likes);
    setLiked(result.liked);
    setLikes(result.count);
  }

  return (
    <div
      className="relative rounded-2xl overflow-hidden active:opacity-90 transition-opacity"
      style={{ aspectRatio: "3/4", backgroundColor: board.color, cursor: "pointer" }}
      onClick={() => onTap?.(board)}
    >
      {/* Image */}
      <LazyImage
        src={board.previewImage}
        alt={board.title}
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
      />
      {/* Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.84) 0%, rgba(0,0,0,0.14) 55%, transparent 100%)",
        }}
      />
      {/* Top badges */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
        <div className="flex flex-col gap-1.5">
          {/* Style badge */}
          <span
            className="self-start px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide"
            style={{
              backgroundColor: "rgba(255,255,255,0.18)",
              color: "white",
              fontFamily: "'Spoqa Han Sans Neo', sans-serif",
              backdropFilter: "blur(6px)",
            }}
          >
            {board.style}
          </span>
          {/* Season badges */}
          {board.season.slice(0, 2).map((s) => (
            <span
              key={s}
              className="self-start px-2 py-0.5 rounded-full text-[9px] font-medium"
              style={{
                backgroundColor: "rgba(245,194,0,0.22)",
                color: "#F5C200",
                fontFamily: "'Spoqa Han Sans Neo', sans-serif",
                border: "1px solid rgba(245,194,0,0.3)",
              }}
            >
              {s}
            </span>
          ))}
        </div>
        {/* Like button */}
        <button
          onClick={handleLike}
          className="flex items-center gap-1 px-2 py-1 rounded-full"
          style={{ backgroundColor: "rgba(0,0,0,0.28)", backdropFilter: "blur(6px)" }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path
              d="M6.5 11L1.5 6.3C1.06 5.86 1 5.18 1 4.5C1 3.12 2.12 2 3.5 2C4.3 2 5.02 2.41 5.5 3.04L6.5 4.19L7.5 3.04C7.98 2.41 8.7 2 9.5 2C10.88 2 12 3.12 12 4.5C12 5.18 11.94 5.86 11.5 6.3L6.5 11Z"
              fill={liked ? "#E84040" : "none"}
              stroke={liked ? "#E84040" : "rgba(255,255,255,0.85)"}
              strokeWidth="1.2"
            />
          </svg>
          <span
            className="text-[10px] font-medium"
            style={{
              color: liked ? "#ff7070" : "rgba(255,255,255,0.85)",
              fontFamily: "'Spoqa Han Sans Neo', sans-serif",
            }}
          >
            {likes}
          </span>
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-3.5">
        <p
          className="text-[14px] font-bold text-white leading-snug mb-1.5"
          style={{ fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
        >
          {board.title}
        </p>
        <div className="flex flex-wrap gap-1 mb-1.5">
          {board.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[9px] px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: "rgba(255,255,255,0.13)",
                color: "rgba(255,255,255,0.78)",
                fontFamily: "'Spoqa Han Sans Neo', sans-serif",
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
        <p
          className="text-[11px]"
          style={{
            color: "rgba(255,255,255,0.45)",
            fontFamily: "'Spoqa Han Sans Neo', sans-serif",
          }}
        >
          {board.shortDesc}
        </p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CodiPage() {
  const [styleFilter,    setStyleFilter]    = useState("전체");
  const [seasonFilter,   setSeasonFilter]   = useState("전체");
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [editorOpen,     setEditorOpen]     = useState(false);
  const [editingCoordi,  setEditingCoordi]  = useState(null);

  const filtered = getOutfitsByStyleAndSeason(styleFilter, seasonFilter);

  return (
    <div className="relative flex flex-col h-full bg-white overflow-hidden">

      {/* Coordi editor overlay */}
      {editorOpen && (
        <CoordiEditorPage
          coordi={editingCoordi}
          onClose={() => { setEditorOpen(false); setEditingCoordi(null); }}
          onSaved={() => { setEditorOpen(false); setEditingCoordi(null); }}
        />
      )}

      {/* Outfit detail overlay */}
      {selectedOutfit && (
        <OutfitDetailScreen
          outfit={selectedOutfit}
          onBack={() => setSelectedOutfit(null)}
        />
      )}

      {/* ── Header ── */}
      <div
        className="shrink-0 flex items-center justify-between px-5 pt-4 pb-3"
        style={{ backgroundColor: "white" }}
      >
        <div>
          <p
            className="text-[11px] font-bold tracking-[0.14em] uppercase"
            style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            COORDINATION
          </p>
          <h1
            className="text-[20px] font-bold leading-tight"
            style={{ color: DARK, fontFamily: "'Spoqa Han Sans Neo', sans-serif", letterSpacing: "-0.03em" }}
          >
            코디 둘러보기
          </h1>
        </div>
        <button
          onClick={() => { setEditingCoordi(null); setEditorOpen(true); }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full active:opacity-70"
          style={{ backgroundColor: DARK }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 2V11M2 6.5H11" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span
            className="text-[12px] font-bold text-white"
            style={{ fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            내 코디 만들기
          </span>
        </button>
      </div>

      {/* ── 스타일 filter chips (horizontal scroll) ── */}
      <div className="shrink-0">
        <div
          className="flex overflow-x-auto px-5 gap-2 pb-3"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {STYLE_FILTER_OPTIONS.map((f) => {
            const isActive = styleFilter === f;
            return (
              <button
                key={f}
                onClick={() => setStyleFilter(f)}
                className="shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all"
                style={{
                  backgroundColor: isActive ? DARK : "#F2F2F2",
                  color:           isActive ? "white" : "#555",
                  fontFamily:      "'Spoqa Han Sans Neo', sans-serif",
                  border:          isActive ? `1.5px solid ${DARK}` : "1.5px solid transparent",
                }}
              >
                {f}
              </button>
            );
          })}
        </div>

        {/* ── Season filter row ── */}
        <div
          className="flex px-5 gap-2 pb-3"
          style={{ borderBottom: "1px solid #F0F0F0" }}
        >
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

      {/* ── Result count ── */}
      <div className="shrink-0 px-5 py-2">
        <p
          className="text-[11px]"
          style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
        >
          {styleFilter !== "전체" ? `${styleFilter} · ` : ""}
          {seasonFilter !== "전체" ? `${seasonFilter} · ` : ""}
          {filtered.length}개 코디
        </p>
      </div>

      {/* ── Grid ── */}
      <div
        className="flex-1 overflow-y-auto px-4 pb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <span style={{ fontSize: 32 }}>🔍</span>
            <p
              className="text-[13px]"
              style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
            >
              해당 스타일·시즌의 코디가 없어요
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((board) => (
              <OutfitCard key={board.id} board={board} onTap={setSelectedOutfit} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
