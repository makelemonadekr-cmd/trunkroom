import { useState, useRef } from "react";
import { zoneItemImg } from "../../lib/localImages";

const YELLOW = "#F5C200";

// ─── Mock similar items — local processed image library ───────────────────────
const SIMILAR_ITEMS = [
  {
    id: 101,
    brand: "COS",
    name: "리넨 오버셔츠",
    price: "34,000",
    condition: "S급",
    image: zoneItemImg("similar", "tops", 0),   // tops[76]
  },
  {
    id: 102,
    brand: "ZARA",
    name: "루즈핏 셔츠",
    price: "22,000",
    condition: "A급",
    image: zoneItemImg("similar", "tops", 1),   // tops[77]
  },
  {
    id: 103,
    brand: "UNIQLO",
    name: "옥스포드 셔츠",
    price: "18,000",
    condition: "A급",
    image: zoneItemImg("similar", "tops", 2),   // tops[78]
  },
  {
    id: 104,
    brand: "H&M",
    name: "베이직 셔츠",
    price: "15,000",
    condition: "B급",
    image: zoneItemImg("similar", "tops", 3),   // tops[79]
  },
];

const MOCK_COMMENTS = [
  {
    id: 1,
    username: "style_lover",
    avatar: null,
    text: "사이즈 실착 사진 받을 수 있나요??",
    time: "1분전",
    isReply: false,
  },
  {
    id: 2,
    username: "판매자",
    avatar: null,
    text: "네 가능합니다! DM 주세요 :)",
    time: "방금",
    isReply: true,
  },
  {
    id: 3,
    username: "fashion_k",
    avatar: null,
    text: "상품 문의 드려요, 어깨너비가 어떻게 되나요?",
    time: "5분전",
    isReply: false,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function PhotoCarousel({ images }) {
  const [current, setCurrent] = useState(0);
  const touchX = useRef(null);

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (dx < -30 && current < images.length - 1) setCurrent(c => c + 1);
    if (dx > 30 && current > 0) setCurrent(c => c - 1);
    touchX.current = null;
  };

  return (
    <div className="relative overflow-hidden bg-[#F5F5F5]" style={{ height: 340 }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div
        className="flex h-full"
        style={{
          width: `${images.length * 100}%`,
          transform: `translateX(-${(current / images.length) * 100}%)`,
          transition: "transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)",
        }}
      >
        {images.map((src, i) => (
          <div key={i} className="h-full shrink-0" style={{ width: `${100 / images.length}%` }}>
            <img src={src} alt="" className="w-full h-full" style={{ objectFit: "cover" }} />
          </div>
        ))}
      </div>
      {/* counter badge */}
      <div
        className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full"
        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      >
        <span className="text-[11px] text-white font-medium">
          {current + 1} / {images.length}
        </span>
      </div>
    </div>
  );
}

function ConditionBadge({ condition }) {
  const bg = condition === "S급" ? "#1a1a1a" : condition === "A급" ? "#555" : "#888";
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-sm text-white"
      style={{ backgroundColor: bg, fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
    >
      {condition}
    </span>
  );
}

function CommentItem({ comment }) {
  return (
    <div className={`flex gap-3 ${comment.isReply ? "pl-8" : ""}`}>
      <div
        className="flex items-center justify-center rounded-full shrink-0"
        style={{ width: 32, height: 32, backgroundColor: "#EBEBEB" }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="5" r="2.5" stroke="#AAA" strokeWidth="1.2" />
          <path d="M2 13C2 10.24 4.24 8 7 8C9.76 8 12 10.24 12 13" stroke="#AAA" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold" style={{ color: "#1a1a1a", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
            {comment.username}
          </span>
          <span className="text-[10px]" style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
            {comment.time}
          </span>
        </div>
        <p className="text-[13px] mt-0.5 leading-relaxed" style={{ color: "#333", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
          {comment.text}
        </p>
        <button className="mt-1">
          <span className="text-[11px]" style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
            답글 달기
          </span>
        </button>
      </div>
      <button className="shrink-0 self-start mt-1">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="4" cy="8" r="1.2" fill="#CCC" />
          <circle cx="8" cy="8" r="1.2" fill="#CCC" />
          <circle cx="12" cy="8" r="1.2" fill="#CCC" />
        </svg>
      </button>
    </div>
  );
}

function SimilarCard({ item }) {
  const [liked, setLiked] = useState(false);
  return (
    <div className="shrink-0 rounded-sm overflow-hidden bg-white" style={{ width: 130, marginRight: 10, scrollSnapAlign: "start" }}>
      <div className="relative overflow-hidden bg-[#F5F5F5]" style={{ height: 160 }}>
        <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full" style={{ objectFit: "cover" }} />
        <div className="absolute top-1.5 left-1.5">
          <ConditionBadge condition={item.condition} />
        </div>
        <button className="absolute bottom-1.5 right-1.5" onClick={() => setLiked(l => !l)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 15L3 9C2.17 8.17 2 7.04 2 6C2 3.79 3.79 2 6 2C7.32 2 8.52 2.65 9.38 3.62L9 4.3L8.62 3.62C8.48 3.65 7.68 2 6 2" fill={liked ? "#E84040" : "none"} stroke={liked ? "#E84040" : "rgba(0,0,0,0.3)"} strokeWidth="1.3" />
          </svg>
        </button>
      </div>
      <div className="px-2 pt-1.5 pb-2">
        <p className="text-[9px] uppercase tracking-wide truncate" style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>{item.brand}</p>
        <p className="text-[11px] font-medium truncate mt-0.5" style={{ color: "#222", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>{item.name}</p>
        <p className="text-[12px] font-bold mt-0.5" style={{ color: "#333", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>{item.price}원</p>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function ProductDetailPage({ product, onBack }) {
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState("");

  if (!product) return null;

  const images = [product.image, ...(SIMILAR_ITEMS.slice(0, 2).map(i => i.image))];

  return (
    <div className="absolute inset-0 z-30 bg-white flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 shrink-0 bg-white"
        style={{ height: 50, borderBottom: "1px solid #F0F0F0" }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 4L7 10L12.5 16" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex items-center gap-1">
          <button
            className="w-9 h-9 flex items-center justify-center"
            onClick={() => setLiked(l => !l)}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path
                d="M11 19L3.5 11.5C2.5 10.5 2 9.1 2 7.8C2 5.1 4.2 3 6.9 3C8.4 3 9.8 3.7 11 4.9C12.2 3.7 13.6 3 15.1 3C17.8 3 20 5.1 20 7.8C20 9.1 19.5 10.5 18.5 11.5L11 19Z"
                fill={liked ? "#E84040" : "none"}
                stroke={liked ? "#E84040" : "#333"}
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button className="w-9 h-9 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 7L11 3L7 7" stroke="#333" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11 3V13" stroke="#333" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M4 12V16C4 16.55 4.45 17 5 17H15C15.55 17 16 16.55 16 16V12" stroke="#333" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <button className="w-9 h-9 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="5" cy="10" r="1.5" fill="#333" />
              <circle cx="10" cy="10" r="1.5" fill="#333" />
              <circle cx="15" cy="10" r="1.5" fill="#333" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {/* Photo carousel */}
        <PhotoCarousel images={images} />

        {/* Product info */}
        <div className="px-5 pt-4 pb-3 bg-white" style={{ borderBottom: "1px solid #F5F5F5" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <ConditionBadge condition={product.condition} />
                <span className="text-[11px]" style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
                  방금 등록
                </span>
              </div>
              <p className="text-[11px] uppercase tracking-wide" style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
                {product.brand}
              </p>
              <h1
                className="text-[18px] font-bold mt-0.5 leading-tight"
                style={{ color: "#1a1a1a", fontFamily: "'Spoqa Han Sans Neo', sans-serif", letterSpacing: "-0.02em" }}
              >
                {product.name}
              </h1>
              <p
                className="text-[20px] font-bold mt-2"
                style={{ color: "#1a1a1a", fontFamily: "'Spoqa Han Sans Neo', sans-serif", letterSpacing: "-0.02em" }}
              >
                {product.price}원
              </p>
            </div>
          </div>
        </div>

        {/* Seller info */}
        <div className="px-5 py-4 bg-white flex items-center gap-3" style={{ borderBottom: "1px solid #F5F5F5" }}>
          <div
            className="flex items-center justify-center rounded-full shrink-0"
            style={{ width: 40, height: 40, backgroundColor: "#EBEBEB" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="6.5" r="3" stroke="#AAA" strokeWidth="1.3" />
              <path d="M2 17C2 13.69 5.13 11 9 11C12.87 11 16 13.69 16 17" stroke="#AAA" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold truncate" style={{ color: "#1a1a1a", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
              Clothsandalu
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <span style={{ color: YELLOW, fontSize: 11 }}>★★★★☆</span>
              <span className="text-[11px]" style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>4.2</span>
            </div>
          </div>
          <button
            className="px-4 py-1.5 rounded-sm text-[12px] font-bold"
            style={{
              border: "1.5px solid #1a1a1a",
              color: "#1a1a1a",
              fontFamily: "'Spoqa Han Sans Neo', sans-serif",
            }}
          >
            팔로우
          </button>
        </div>

        {/* Product details */}
        <div className="px-5 py-4 bg-white" style={{ borderBottom: "1px solid #F5F5F5" }}>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "카테고리", value: "상의" },
              { label: "사이즈", value: "M" },
              { label: "상태", value: product.condition },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center py-3 rounded-lg" style={{ backgroundColor: "#F8F8F8" }}>
                <p className="text-[10px]" style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>{label}</p>
                <p className="text-[13px] font-bold mt-0.5" style={{ color: "#1a1a1a", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>{value}</p>
              </div>
            ))}
          </div>
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: "#444", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            착용 횟수 3회 이내의 거의 새 상품입니다. 구매 후 보관만 하다가 판매하게 됐어요. 직거래 가능하며 택배 거래도 환영합니다. 상태 정말 좋습니다. 구매 전 궁금한 점 문의 주세요!
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 px-5 py-3 bg-white" style={{ borderBottom: "1px solid #F5F5F5" }}>
          {[
            { icon: "❤️", label: "좋아요", count: 24 },
            { icon: "🔖", label: "저장",   count: 18 },
            { icon: "👁️", label: "조회",   count: 312 },
          ].map(({ icon, label, count }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span style={{ fontSize: 14 }}>{icon}</span>
              <span className="text-[12px]" style={{ color: "#888", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
                {label} {count}
              </span>
            </div>
          ))}
        </div>

        {/* Similar items */}
        <div className="py-5 bg-white" style={{ borderBottom: "1px solid #F5F5F5" }}>
          <div className="flex items-center justify-between px-5 mb-3">
            <p className="text-[14px] font-bold" style={{ color: "#1a1a1a", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
              비슷한 상품
            </p>
            <button>
              <span className="text-[12px]" style={{ color: "#888", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>더보기</span>
            </button>
          </div>
          <div
            className="flex overflow-x-auto pl-5 pr-4"
            style={{ scrollbarWidth: "none", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
          >
            {SIMILAR_ITEMS.map(item => <SimilarCard key={item.id} item={item} />)}
            <div className="shrink-0 w-2" />
          </div>
        </div>

        {/* Comments */}
        <div className="px-5 py-5 bg-white">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[14px] font-bold" style={{ color: "#1a1a1a", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
              상품 문의 {MOCK_COMMENTS.length}
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {MOCK_COMMENTS.map(c => <CommentItem key={c.id} comment={c} />)}
          </div>
        </div>

        {/* bottom padding so content doesn't hide behind action bar */}
        <div style={{ height: 80 }} />
      </div>

      {/* ── Bottom action bar ── */}
      <div
        className="shrink-0 bg-white px-4 py-3 flex gap-3"
        style={{ borderTop: "1px solid #F0F0F0" }}
      >
        {/* Comment input trigger */}
        <button
          className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-sm"
          style={{ backgroundColor: "#F5F5F5" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14 2H2C1.45 2 1 2.45 1 3V10C1 10.55 1.45 11 2 11H5L8 14L11 11H14C14.55 11 15 10.55 15 10V3C15 2.45 14.55 2 14 2Z" stroke="#AAA" strokeWidth="1.3" strokeLinejoin="round" fill="none" />
          </svg>
          <span className="text-[12px]" style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
            문의하기
          </span>
        </button>
        {/* Price offer button */}
        <button
          className="px-4 py-2.5 rounded-sm"
          style={{
            backgroundColor: "#F5F5F5",
            border: "1.5px solid #1a1a1a",
            minWidth: 88,
          }}
        >
          <span
            className="text-[13px] font-bold"
            style={{ color: "#1a1a1a", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            가격 제안
          </span>
        </button>
        {/* Buy button */}
        <button
          className="px-5 py-2.5 rounded-sm"
          style={{ backgroundColor: "#1a1a1a", minWidth: 88 }}
        >
          <span
            className="text-[13px] font-bold text-white"
            style={{ fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            구매하기
          </span>
        </button>
      </div>
    </div>
  );
}
