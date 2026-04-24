import { useState, useRef } from "react";
import { zoneItemImg } from "../../lib/localImages";
import { MAIN_CATEGORIES } from "../../constants/mockClosetData";
import OutfitDetailScreen from "../../components/OutfitDetailScreen";
import { OUTFIT_DATA } from "../../constants/mockOutfitData";

const FONT   = "'Spoqa Han Sans Neo', sans-serif";
const DARK   = "#1a1a1a";

// ─── External sale channel config ────────────────────────────────────────────
const SALE_CHANNELS = {
  karrot:      { label: "당근마켓",  color: "#FF6F0F", bg: "#FFF4EE", emoji: "🥕" },
  bunjang:     { label: "번개장터",  color: "#0066FF", bg: "#EEF3FF", emoji: "⚡" },
  joonggonara: { label: "중고나라",  color: "#E31C23", bg: "#FFF0F0", emoji: "🛒" },
};

const MOCK_EXTERNAL_SALE = {
  channel: "karrot",
  url: "https://www.daangn.com/articles/example",
  listed: true,
};

// ─── Image shorthands ─────────────────────────────────────────────────────────
const I = (n) => zoneItemImg("similar", "tops", n);

// ─── Seller's items for sale ─────────────────────────────────────────────────
const SELLER_SALE_ITEMS = [
  { id: 101, brand: "COS",    name: "리넨 오버셔츠", price: "34,000", condition: "S급", image: I(0) },
  { id: 102, brand: "ZARA",   name: "루즈핏 셔츠",   price: "22,000", condition: "A급", image: I(1) },
  { id: 103, brand: "UNIQLO", name: "옥스포드 셔츠",  price: "18,000", condition: "A급", image: I(2) },
  { id: 104, brand: "H&M",    name: "베이직 셔츠",    price: "15,000", condition: "B급", image: I(3) },
];

// Seller's full closet
const SELLER_ALL_ITEMS = [
  ...SELLER_SALE_ITEMS,
  { id: 201, brand: "MAJE",              name: "화이트 블라우스",   price: "45,000", condition: "A급",    isForSale: false, image: I(1) },
  { id: 202, brand: "SANDRO",            name: "체크 재킷",         price: "78,000", condition: "S급",    isForSale: true,  image: I(0) },
  { id: 203, brand: "ARKET",             name: "슬림 트라우저",     price: "29,000", condition: "A급",    isForSale: true,  image: I(2) },
  { id: 204, brand: "& Other Stories",   name: "실크 미디 스커트",  price: "0",      condition: "상태 좋음", isForSale: false, image: I(3) },
];

// Seller's stylebooks
const SELLER_STYLEBOOKS = [
  { id: 1, title: "봄 레이어드 룩",    likeCount: 87,  images: [I(0), I(1), I(2), I(3)] },
  { id: 2, title: "캐주얼 데일리",     likeCount: 52,  images: [I(1), I(2)] },
  { id: 3, title: "미니멀 오피스",     likeCount: 134, images: [I(2), I(3)] },
  { id: 4, title: "주말 스트릿",       likeCount: 29,  images: [I(3), I(0), I(1)] },
];

const SELLER_TOTAL_LIKES = SELLER_STYLEBOOKS.reduce((s, b) => s + b.likeCount, 0);

// ─── Stylebooks that include this item (use outfit previewImage directly) ────
const MOCK_ITEM_STYLEBOOKS = [
  { id: 1, username: "style_y",   avatar: "🧣", outfitIndex: 0 },
  { id: 2, username: "closet_j",  avatar: "👗", outfitIndex: 2 },
  { id: 3, username: "minwear_k", avatar: "🧥", outfitIndex: 4 },
];

// ─── Mock item comments ───────────────────────────────────────────────────────
const MOCK_ITEM_COMMENTS = [
  { id: 1, username: "style_y",   avatar: "🧣", text: "이 아이템 색깔이 너무 예쁘네요! 어디서 구매하셨어요?", time: "2시간 전" },
  { id: 2, username: "closet_j",  avatar: "👗", text: "저도 비슷한 거 가지고 있는데 진짜 활용도 높아요 👍",    time: "5시간 전" },
  { id: 3, username: "minwear_k", avatar: "🧥", text: "사이즈 M이면 오버핏으로 입기 좋겠다",                   time: "어제"      },
];

// ─── Season colors ────────────────────────────────────────────────────────────
const SEASON_STYLE = {
  봄:  { color: "#D4436A", bg: "#FFF0F3" },
  여름: { color: "#1C7ED6", bg: "#EEF5FF" },
  가을: { color: "#C2601A", bg: "#FFF4EC" },
  겨울: { color: "#6D56D8", bg: "#F2EEFF" },
};

function getCategoryEmoji(mainCategory) {
  return MAIN_CATEGORIES.find(c => c.id === mainCategory)?.emoji ?? "👕";
}

// ─── Stylebook collage card ───────────────────────────────────────────────────
function StylebookCollage({ images, size = 120, height = 130 }) {
  const imgs = images.slice(0, 4);
  const count = imgs.length;

  if (count === 1) {
    return (
      <div className="w-full h-full overflow-hidden rounded-xl">
        <img src={imgs[0]} alt="" className="w-full h-full" style={{ objectFit: "cover" }} />
      </div>
    );
  }
  if (count === 2) {
    return (
      <div className="w-full h-full flex gap-px overflow-hidden rounded-xl">
        {imgs.map((src, i) => (
          <div key={i} className="flex-1 overflow-hidden">
            <img src={src} alt="" className="w-full h-full" style={{ objectFit: "cover" }} />
          </div>
        ))}
      </div>
    );
  }
  if (count === 3) {
    return (
      <div className="w-full h-full flex gap-px overflow-hidden rounded-xl">
        <div className="flex-1 overflow-hidden">
          <img src={imgs[0]} alt="" className="w-full h-full" style={{ objectFit: "cover" }} />
        </div>
        <div className="flex-1 flex flex-col gap-px">
          <div className="flex-1 overflow-hidden">
            <img src={imgs[1]} alt="" className="w-full h-full" style={{ objectFit: "cover" }} />
          </div>
          <div className="flex-1 overflow-hidden">
            <img src={imgs[2]} alt="" className="w-full h-full" style={{ objectFit: "cover" }} />
          </div>
        </div>
      </div>
    );
  }
  // 4 images — 2×2 grid
  return (
    <div className="w-full h-full grid grid-cols-2 gap-px overflow-hidden rounded-xl">
      {imgs.map((src, i) => (
        <div key={i} className="overflow-hidden">
          <img src={src} alt="" className="w-full h-full" style={{ objectFit: "cover" }} />
        </div>
      ))}
    </div>
  );
}

// ─── Photo carousel ───────────────────────────────────────────────────────────
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
      {/* Bottom-right: page counter */}
      <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full"
        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
        <span className="text-[11px] text-white font-medium">{current + 1} / {images.length}</span>
      </div>
    </div>
  );
}

// ─── Seller screen (tabs: 아이템 / 스타일북) ──────────────────────────────────
function SellerScreen({ sellerName, onBack }) {
  const [tab, setTab] = useState("items"); // "items" | "stylebooks"

  return (
    <div className="absolute inset-0 z-40 bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 shrink-0 bg-white"
        style={{ height: 50, borderBottom: "1px solid #F0F0F0" }}>
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 4L7 10L12.5 16" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="text-[14px] font-bold" style={{ color: DARK, fontFamily: FONT }}>{sellerName}의 옷장</p>
        {/* Total likes */}
        <div className="flex items-center gap-1 pr-1">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 12L2.2 7.2C1.5 6.5 1.5 5.4 1.5 4.8C1.5 3.3 2.8 2 4.4 2C5.2 2 5.9 2.4 6.4 2.9L7 3.5L7.6 2.9C8.1 2.4 8.8 2 9.6 2C11.2 2 12.5 3.3 12.5 4.8C12.5 5.4 12.4 6.5 11.8 7.2L7 12Z"
              fill="#E84040" stroke="#E84040" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
          <span className="text-[12px] font-bold" style={{ color: "#E84040", fontFamily: FONT }}>
            {SELLER_TOTAL_LIKES.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Seller info bar */}
      <div className="px-4 py-3 flex items-center gap-3 shrink-0"
        style={{ borderBottom: "1px solid #F0F0F0", backgroundColor: "#FAFAFA" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#EBEBEB" }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="6.5" r="3" stroke="#AAA" strokeWidth="1.3" />
            <path d="M2 17C2 13.69 5.13 11 9 11C12.87 11 16 13.69 16 17" stroke="#AAA" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold" style={{ color: DARK, fontFamily: FONT }}>{sellerName}</p>
          <p className="text-[11px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>
            전체 아이템 {SELLER_ALL_ITEMS.length}개 · 스타일북 {SELLER_STYLEBOOKS.length}개
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex shrink-0 px-4 gap-4" style={{ borderBottom: "1px solid #F0F0F0" }}>
        {[
          { key: "items",      label: "아이템" },
          { key: "stylebooks", label: "스타일북" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="py-2.5 text-[13px] font-bold relative"
            style={{ color: tab === t.key ? DARK : "#AAAAAA", fontFamily: FONT }}>
            {t.label}
            {tab === t.key && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                style={{ backgroundColor: DARK }} />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {tab === "items" ? (
          <div className="grid grid-cols-2 gap-px bg-gray-100">
            {SELLER_ALL_ITEMS.map(item => (
              <button key={item.id} className="relative bg-white active:opacity-80">
                <div className="relative overflow-hidden" style={{ paddingBottom: "110%" }}>
                  <img src={item.image} alt={item.name}
                    className="absolute inset-0 w-full h-full" style={{ objectFit: "cover" }} />
                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm text-white"
                      style={{ backgroundColor: item.condition === "S급" ? "#1a1a1a" : item.condition === "A급" ? "#555" : "#888", fontFamily: FONT }}>
                      {item.condition}
                    </span>
                  </div>
                  {item.isForSale === false && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
                      <span className="text-[9px] text-white font-medium" style={{ fontFamily: FONT }}>비매품</span>
                    </div>
                  )}
                </div>
                <div className="px-2.5 pt-2 pb-3 text-left">
                  <p className="text-[9px] uppercase tracking-wide" style={{ color: "#AAAAAA", fontFamily: FONT }}>{item.brand}</p>
                  <p className="text-[12px] font-semibold mt-0.5 truncate" style={{ color: DARK, fontFamily: FONT }}>{item.name}</p>
                  {item.isForSale !== false && item.price !== "0" && (
                    <p className="text-[12px] font-bold mt-0.5" style={{ color: DARK, fontFamily: FONT }}>{item.price}원</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Stylebooks grid */
          <div className="grid grid-cols-2 gap-3 p-4">
            {SELLER_STYLEBOOKS.map(book => (
              <button key={book.id} className="text-left active:opacity-80">
                <div style={{ height: 130 }}>
                  <StylebookCollage images={book.images} />
                </div>
                <div className="mt-1.5">
                  <p className="text-[12px] font-semibold truncate" style={{ color: DARK, fontFamily: FONT }}>{book.title}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                      <path d="M7 12L2.2 7.2C1.5 6.5 1.5 5.4 1.5 4.8C1.5 3.3 2.8 2 4.4 2C5.2 2 5.9 2.4 6.4 2.9L7 3.5L7.6 2.9C8.1 2.4 8.8 2 9.6 2C11.2 2 12.5 3.3 12.5 4.8C12.5 5.4 12.4 6.5 11.8 7.2L7 12Z"
                        fill="#AAAAAA" />
                    </svg>
                    <span className="text-[11px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>{book.likeCount}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function ProductDetailPage({ product, onBack }) {
  const [liked,             setLiked]             = useState(false);
  const [followed,          setFollowed]           = useState(false);
  const [commentText,       setCommentText]        = useState("");
  const [comments,          setComments]           = useState(MOCK_ITEM_COMMENTS);
  const [showSeller,        setShowSeller]         = useState(false);
  const [activeOutfit,      setActiveOutfit]       = useState(null); // OutfitDetailScreen
  const [selectedSellerItem, setSelectedSellerItem] = useState(null); // nested ProductDetailPage
  const commentInputRef = useRef(null);

  if (!product) return null;

  const images = [product.image, ...(SELLER_SALE_ITEMS.slice(0, 2).map(i => i.image))];

  const mainCat    = product.mainCategory ?? product.category ?? "상의";
  const subCat     = product.subCategory  ?? product.subcategory ?? "";
  const catEmoji   = getCategoryEmoji(mainCat);
  const catDisplay = subCat ? `${catEmoji} ${subCat}` : `${catEmoji} ${mainCat}`;

  const seasons   = Array.isArray(product.season) ? product.season : (product.season ? [product.season] : ["봄", "가을"]);
  const styleTags = product.styleTags ?? product.tags?.slice(0, 3) ?? ["미니멀", "캐주얼"];

  const sellerName = "Clothsandalu";

  async function handleShare() {
    const shareData = {
      title: `${product.brand} ${product.name ?? product.displayName}`,
      text: `트렁크룸에서 발견한 아이템을 공유해요!`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("링크가 클립보드에 복사됐어요!");
      }
    } catch (_) {}
  }

  function submitComment() {
    if (!commentText.trim()) return;
    setComments(prev => [{ id: Date.now(), username: "나", avatar: "😊", text: commentText.trim(), time: "방금" }, ...prev]);
    setCommentText("");
  }

  return (
    <div className="absolute inset-0 z-30 bg-white flex flex-col overflow-hidden">
      {/* ── Header — back + share only ── */}
      <div className="flex items-center justify-between px-4 shrink-0 bg-white"
        style={{ height: 50, borderBottom: "1px solid #F0F0F0" }}>
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 4L7 10L12.5 16" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {/* Share button only */}
        <button onClick={handleShare} className="w-9 h-9 flex items-center justify-center active:opacity-60">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 7L11 3L7 7" stroke="#333" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11 3V13" stroke="#333" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M4 12V16C4 16.55 4.45 17 5 17H15C15.55 17 16 16.55 16 16V12" stroke="#333" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <PhotoCarousel images={images} />

        {/* ── Product info ── */}
        <div className="px-5 pt-4 pb-4 bg-white" style={{ borderBottom: "1px solid #F5F5F5" }}>
          {/* Brand row — condition badge + timestamp right-aligned */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-[14px] font-bold uppercase tracking-wide flex-1 min-w-0 truncate"
              style={{ color: "#888", fontFamily: FONT }}>
              {product.brand}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px]" style={{ color: "#BBBBBB", fontFamily: FONT }}>방금 등록</span>
              {/* Condition badge */}
              {(() => {
                const cond = product.condition ?? "S급";
                const bg = cond === "S급" ? "#1a1a1a" : cond === "A급" ? "#555" : cond === "새상품급" ? "#0066CC" : "#888";
                return (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm text-white"
                    style={{ backgroundColor: bg, fontFamily: FONT }}>{cond}</span>
                );
              })()}
            </div>
          </div>
          {/* Name */}
          <h1 className="text-[18px] font-bold leading-tight mt-0.5"
            style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>
            {product.name ?? product.displayName}
          </h1>
          {/* Season + style tags */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {seasons.map(s => {
              const st = SEASON_STYLE[s] ?? { color: "#888", bg: "#F5F5F5" };
              return (
                <span key={s} className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: st.bg, color: st.color, fontFamily: FONT }}>{s}</span>
              );
            })}
            {styleTags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "#F2F2F2", color: "#555", fontFamily: FONT }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* ── Seller row — tappable → SellerScreen ── */}
        <button
          onClick={() => setShowSeller(true)}
          className="w-full px-5 py-4 bg-white flex items-center gap-3 active:bg-gray-50"
          style={{ borderBottom: "1px solid #F5F5F5" }}
        >
          <div className="flex items-center justify-center rounded-full shrink-0"
            style={{ width: 40, height: 40, backgroundColor: "#EBEBEB" }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="6.5" r="3" stroke="#AAA" strokeWidth="1.3" />
              <path d="M2 17C2 13.69 5.13 11 9 11C12.87 11 16 13.69 16 17" stroke="#AAA" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[13px] font-bold truncate" style={{ color: DARK, fontFamily: FONT }}>{sellerName}</p>
            <p className="text-[11px] mt-0.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>
              아이템 {SELLER_ALL_ITEMS.length} · 스타일북 {SELLER_STYLEBOOKS.length}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setFollowed(f => !f); }}
              className="px-3.5 py-1.5 rounded-lg text-[12px] font-bold transition-all"
              style={{
                backgroundColor: followed ? DARK : "white",
                border: `1.5px solid ${followed ? DARK : "#DDDDDD"}`,
                color: followed ? "white" : DARK,
                fontFamily: FONT,
              }}
            >{followed ? "팔로잉" : "팔로우"}</button>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3L9 7L5 11" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </button>

        {/* ── External sale banner ── */}
        {MOCK_EXTERNAL_SALE.listed && (() => {
          const ch = SALE_CHANNELS[MOCK_EXTERNAL_SALE.channel];
          return (
            <div className="px-5 py-3 bg-white" style={{ borderBottom: "1px solid #F5F5F5" }}>
              <button
                onClick={() => window.open(MOCK_EXTERNAL_SALE.url, "_blank")}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl active:opacity-80"
                style={{ backgroundColor: ch.bg, border: `1.5px solid ${ch.color}33` }}
              >
                <span style={{ fontSize: 22, flexShrink: 0 }}>{ch.emoji}</span>
                <div className="flex-1 text-left">
                  <p className="text-[13px] font-bold" style={{ color: ch.color, fontFamily: FONT }}>{ch.label}에서 판매 중</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "#888", fontFamily: FONT }}>외부 판매글 보기 · 탭하면 이동해요</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M5 3L9 7L5 11" stroke={ch.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          );
        })()}

        {/* ── Product meta + owner memo ── */}
        <div className="px-5 py-4 bg-white" style={{ borderBottom: "1px solid #F5F5F5" }}>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "카테고리", value: catDisplay },
              { label: "사이즈",   value: product.size ?? "M" },
              { label: "구매가격", value: `${(product.price ?? 89000).toLocaleString()}원` },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center py-3 rounded-xl"
                style={{ backgroundColor: "#F8F8F8" }}>
                <p className="text-[10px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>{label}</p>
                <p className="text-[12px] font-bold mt-0.5 text-center px-1 leading-snug"
                  style={{ color: DARK, fontFamily: FONT }}>{value}</p>
              </div>
            ))}
          </div>
          {/* Owner memo */}
          <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "#FAFAFA", border: "1px solid #F0F0F0" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5"
              style={{ color: "#BBBBBB", fontFamily: FONT }}>소유자 메모</p>
            <p className="text-[13px] leading-relaxed" style={{ color: "#555", fontFamily: FONT }}>
              2022년 봄에 구매했어요. 색감이 너무 예뻐서 샀는데 요즘 잘 안 입게 됐어요.
              딱 두 시즌 정도 착용했고 보관 상태 좋습니다. 원래 정가 89,000원이었어요.
            </p>
          </div>
        </div>

        {/* ── 이 아이템으로 만든 스타일북 ── */}
        <div className="py-5 bg-white" style={{ borderBottom: "1px solid #F5F5F5" }}>
          <div className="flex items-center justify-between px-5 mb-3">
            <p className="text-[14px] font-bold" style={{ color: DARK, fontFamily: FONT }}>이 아이템으로 만든 스타일북</p>
            <button><span className="text-[12px]" style={{ color: "#888", fontFamily: FONT }}>더보기</span></button>
          </div>
          <div className="flex overflow-x-auto pl-5 pr-4 gap-3"
            style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
            {MOCK_ITEM_STYLEBOOKS.map(book => {
              const outfit = OUTFIT_DATA[book.outfitIndex] ?? OUTFIT_DATA[0];
              return (
                <button key={book.id} onClick={() => setActiveOutfit(outfit)}
                  className="shrink-0 text-left active:opacity-80" style={{ width: 130 }}>
                  {/* Use the real outfit previewImage (same as 발견>스타일북) */}
                  <div className="rounded-xl overflow-hidden" style={{ height: 160, backgroundColor: "#F5F5F5" }}>
                    <img src={outfit.previewImage} alt={outfit.title}
                      className="w-full h-full" style={{ objectFit: "cover", objectPosition: "center top" }} />
                  </div>
                  <div className="mt-1.5">
                    <p className="text-[12px] font-semibold truncate" style={{ color: DARK, fontFamily: FONT }}>{outfit.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span style={{ fontSize: 12 }}>{book.avatar}</span>
                      <span className="text-[10px] truncate" style={{ color: "#888", fontFamily: FONT }}>@{book.username}</span>
                      <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                        <path d="M7 12L2.2 7.2C1.5 6.5 1.5 5.4 1.5 4.8C1.5 3.3 2.8 2 4.4 2C5.2 2 5.9 2.4 6.4 2.9L7 3.5L7.6 2.9C8.1 2.4 8.8 2 9.6 2C11.2 2 12.5 3.3 12.5 4.8C12.5 5.4 12.4 6.5 11.8 7.2L7 12Z"
                          fill="#AAAAAA" />
                      </svg>
                      <span className="text-[10px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>{outfit.likes}</span>
                    </div>
                  </div>
                </button>
              );
            })}
            <div className="shrink-0 w-1" />
          </div>
        </div>

        {/* ── 같은 옷장 주인이 판매중이에요 ── */}
        <div className="py-5 bg-white" style={{ borderBottom: "1px solid #F5F5F5" }}>
          <div className="flex items-center justify-between px-5 mb-3">
            <p className="text-[14px] font-bold" style={{ color: DARK, fontFamily: FONT }}>같은 옷장 주인이 판매중이에요</p>
            <button onClick={() => setShowSeller(true)}>
              <span className="text-[12px]" style={{ color: "#888", fontFamily: FONT }}>더보기</span>
            </button>
          </div>
          <div className="flex overflow-x-auto gap-3"
            style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
            <div className="shrink-0" style={{ width: 8 }} />
            {SELLER_SALE_ITEMS.map(item => (
              <button key={item.id} onClick={() => setSelectedSellerItem(item)}
                className="shrink-0 rounded-xl overflow-hidden bg-white active:opacity-80 text-left"
                style={{ width: 120, border: "1px solid #F0F0F0" }}>
                <div className="relative overflow-hidden bg-[#F5F5F5]" style={{ height: 130 }}>
                  <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full"
                    style={{ objectFit: "cover" }} />
                  <div className="absolute top-1.5 left-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm text-white"
                      style={{ backgroundColor: item.condition === "S급" ? "#1a1a1a" : item.condition === "A급" ? "#555" : "#888", fontFamily: FONT }}>
                      {item.condition}
                    </span>
                  </div>
                </div>
                <div className="px-2.5 pt-1.5 pb-2.5">
                  <p className="text-[9px] uppercase tracking-wide truncate" style={{ color: "#AAAAAA", fontFamily: FONT }}>{item.brand}</p>
                  <p className="text-[11px] font-semibold truncate mt-0.5" style={{ color: "#222", fontFamily: FONT }}>{item.name}</p>
                  <p className="text-[12px] font-bold mt-0.5" style={{ color: DARK, fontFamily: FONT }}>{item.price}원</p>
                </div>
              </button>
            ))}
            <div className="shrink-0 w-2" />
          </div>
        </div>

        {/* ── 댓글 ── */}
        <div className="px-5 pt-5 pb-3 bg-white">
          <p className="text-[14px] font-bold mb-4" style={{ color: DARK, fontFamily: FONT }}>댓글 {comments.length}</p>
          <div className="flex flex-col gap-4">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[15px]"
                  style={{ backgroundColor: "#F5F5F5" }}>{c.avatar}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold" style={{ color: DARK, fontFamily: FONT }}>{c.username}</span>
                    <span className="text-[10px]" style={{ color: "#CCCCCC", fontFamily: FONT }}>{c.time}</span>
                  </div>
                  <p className="text-[13px] mt-0.5 leading-relaxed" style={{ color: "#444", fontFamily: FONT }}>{c.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div ref={commentInputRef} className="mt-4 flex gap-2 items-center">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
              placeholder="댓글을 남겨보세요..."
              className="flex-1 px-3 py-2.5 rounded-xl text-[13px] outline-none"
              style={{ backgroundColor: "#F5F5F5", border: "1px solid #EEEEEE", fontFamily: FONT, color: DARK }}
            />
            <button onClick={submitComment}
              className="px-3 py-2.5 rounded-xl text-[12px] font-bold transition-all"
              style={{ backgroundColor: commentText.trim() ? DARK : "#EEEEEE", color: commentText.trim() ? "white" : "#AAAAAA", fontFamily: FONT }}>
              등록
            </button>
          </div>
        </div>

        <div style={{ height: 80 }} />
      </div>

      {/* ── Bottom action bar ── */}
      <div className="shrink-0 bg-white px-4 py-3 flex gap-2.5" style={{ borderTop: "1px solid #F0F0F0" }}>
        <button
          onClick={() => commentInputRef.current?.querySelector("input")?.focus()}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl"
          style={{ backgroundColor: "#F5F5F5", border: "1px solid #E8E8E8" }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M13 2H3C2.45 2 2 2.45 2 3V10C2 10.55 2.45 11 3 11H6L8 13.5L10 11H13C13.55 11 14 10.55 14 10V3C14 2.45 13.55 2 13 2Z"
              stroke="#555" strokeWidth="1.3" strokeLinejoin="round" fill="none" />
          </svg>
          <span className="text-[12px] font-semibold" style={{ color: "#444", fontFamily: FONT }}>댓글 남기기</span>
        </button>
        <button
          onClick={() => setLiked(l => !l)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all"
          style={{ backgroundColor: liked ? "#FFF0F0" : "#F5F5F5", border: liked ? "1px solid #FFBBBB" : "1px solid #E8E8E8" }}>
          <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
            <path d="M7 12L2.2 7.2C1.5 6.5 1.5 5.4 1.5 4.8C1.5 3.3 2.8 2 4.4 2C5.2 2 5.9 2.4 6.4 2.9L7 3.5L7.6 2.9C8.1 2.4 8.8 2 9.6 2C11.2 2 12.5 3.3 12.5 4.8C12.5 5.4 12.4 6.5 11.8 7.2L7 12Z"
              fill={liked ? "#E84040" : "none"} stroke={liked ? "#E84040" : "#555"} strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
          <span className="text-[12px] font-semibold" style={{ color: liked ? "#E84040" : "#444", fontFamily: FONT }}>
            {liked ? `좋아요 ${(product.likes ?? 24) + 1}` : "좋아요 하기"}
          </span>
        </button>
      </div>

      {/* ── Seller overlay ── */}
      {showSeller && (
        <SellerScreen sellerName={sellerName} onBack={() => setShowSeller(false)} />
      )}

      {/* ── Stylebook detail overlay ── */}
      {activeOutfit && (
        <div className="absolute inset-0 z-50">
          <OutfitDetailScreen outfit={activeOutfit} onBack={() => setActiveOutfit(null)} />
        </div>
      )}

      {/* ── Seller item detail overlay (nested ProductDetailPage) ── */}
      {selectedSellerItem && (
        <ProductDetailPage
          product={selectedSellerItem}
          onBack={() => setSelectedSellerItem(null)}
        />
      )}
    </div>
  );
}
