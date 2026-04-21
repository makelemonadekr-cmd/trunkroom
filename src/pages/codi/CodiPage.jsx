import { useState } from "react";

// ─── Sample outfit boards ─────────────────────────────────────────────────────

const OUTFIT_BOARDS = [
  {
    id: 1,
    title: "봄 데이트 코디",
    style: "페미닌",
    season: "봄",
    items: 4,
    likes: 128,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80&fit=crop",
    tags: ["플로럴", "미디드레스", "로퍼"],
    color: "#7A3040",
  },
  {
    id: 2,
    title: "미니멀 오피스 룩",
    style: "미니멀",
    season: "사계절",
    items: 5,
    likes: 94,
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=80&fit=crop",
    tags: ["슬랙스", "블레이저", "로퍼"],
    color: "#2C2C2C",
  },
  {
    id: 3,
    title: "캐주얼 위켄드",
    style: "캐주얼",
    season: "봄/여름",
    items: 3,
    likes: 211,
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80&fit=crop",
    tags: ["데님", "스니커즈", "오버핏"],
    color: "#1C3A5C",
  },
  {
    id: 4,
    title: "빈티지 스트릿",
    style: "스트릿",
    season: "가을",
    items: 6,
    likes: 175,
    image: "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=400&q=80&fit=crop",
    tags: ["빈티지", "레이어드", "카고팬츠"],
    color: "#3A2A1A",
  },
  {
    id: 5,
    title: "클린 서머",
    style: "미니멀",
    season: "여름",
    items: 3,
    likes: 88,
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&q=80&fit=crop",
    tags: ["린넨", "와이드팬츠", "샌들"],
    color: "#1A4A3A",
  },
  {
    id: 6,
    title: "워너비 겨울 코디",
    style: "트렌디",
    season: "겨울",
    items: 5,
    likes: 302,
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80&fit=crop",
    tags: ["울코트", "터틀넥", "앵클부츠"],
    color: "#2A1A3A",
  },
];

const STYLE_FILTERS = ["전체", "미니멀", "캐주얼", "페미닌", "스트릿", "트렌디"];

const SEASON_FILTERS = ["봄", "여름", "가을", "겨울"];

// ─── Sub-components ───────────────────────────────────────────────────────────

function OutfitCard({ board }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(board.likes);

  function handleLike(e) {
    e.stopPropagation();
    setLiked((v) => !v);
    setLikes((n) => (liked ? n - 1 : n + 1));
  }

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{ aspectRatio: "3/4", backgroundColor: board.color, cursor: "pointer" }}
    >
      {/* Image */}
      <img
        src={board.image}
        alt={board.title}
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: "cover", objectPosition: "center top" }}
      />
      {/* Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.14) 55%, transparent 100%)",
        }}
      />
      {/* Top badges */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
        <div className="flex flex-col gap-1.5">
          <span
            className="self-start px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase"
            style={{
              backgroundColor: "rgba(255,255,255,0.18)",
              color: "white",
              fontFamily: "'Spoqa Han Sans Neo', sans-serif",
              backdropFilter: "blur(6px)",
            }}
          >
            {board.style}
          </span>
          <span
            className="self-start px-2 py-0.5 rounded-full text-[9px] font-medium"
            style={{
              backgroundColor: "rgba(245,194,0,0.22)",
              color: "#F5C200",
              fontFamily: "'Spoqa Han Sans Neo', sans-serif",
              border: "1px solid rgba(245,194,0,0.3)",
            }}
          >
            {board.season}
          </span>
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
          {board.tags.map((tag) => (
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
          {board.items}개 아이템
        </p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CodiPage() {
  const [styleFilter,  setStyleFilter]  = useState("전체");
  const [seasonFilter, setSeasonFilter] = useState(null);

  const filtered = OUTFIT_BOARDS.filter((b) => {
    const styleOk  = styleFilter === "전체" || b.style === styleFilter;
    const seasonOk = !seasonFilter || b.season.includes(seasonFilter);
    return styleOk && seasonOk;
  });

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Top bar */}
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
            style={{ color: "#1a1a1a", fontFamily: "'Spoqa Han Sans Neo', sans-serif", letterSpacing: "-0.03em" }}
          >
            코디 둘러보기
          </h1>
        </div>
        {/* "내 코디 만들기" button */}
        <button
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full"
          style={{ backgroundColor: "#1a1a1a" }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 2V11M2 6.5H11" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span
            className="text-[12px] font-bold"
            style={{ color: "white", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            코디 만들기
          </span>
        </button>
      </div>

      {/* Style filter chips */}
      <div
        className="shrink-0 flex overflow-x-auto px-5 gap-2 pb-3"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {STYLE_FILTERS.map((f) => {
          const isActive = styleFilter === f;
          return (
            <button
              key={f}
              onClick={() => setStyleFilter(f)}
              className="shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all"
              style={{
                backgroundColor: isActive ? "#1a1a1a" : "#F2F2F2",
                color: isActive ? "white" : "#555",
                fontFamily: "'Spoqa Han Sans Neo', sans-serif",
                border: isActive ? "1.5px solid #1a1a1a" : "1.5px solid transparent",
              }}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* Season filter */}
      <div className="shrink-0 flex px-5 gap-2 pb-4">
        {SEASON_FILTERS.map((s) => {
          const isActive = seasonFilter === s;
          return (
            <button
              key={s}
              onClick={() => setSeasonFilter(isActive ? null : s)}
              className="shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-all"
              style={{
                backgroundColor: isActive ? "#F5C200" : "#F9F9F9",
                color: isActive ? "#1a1a1a" : "#888",
                fontFamily: "'Spoqa Han Sans Neo', sans-serif",
                border: isActive ? "1.5px solid #F5C200" : "1.5px solid #EBEBEB",
              }}
            >
              {s}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="shrink-0 mx-5 mb-3" style={{ height: 1, backgroundColor: "#F0F0F0" }} />

      {/* Grid */}
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
              해당 조건의 코디가 없어요
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((board) => (
              <OutfitCard key={board.id} board={board} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
