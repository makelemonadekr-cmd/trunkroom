import { useState } from "react";

// ─── Sold item mock data ──────────────────────────────────────────────────────
const SELLING_ITEMS = [
  {
    id: 1,
    brand: "MAJE",
    name: "플로럴 미디 드레스",
    price: "89,000",
    status: "판매중",
    views: 42,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=75&fit=crop",
    fallback: "#F2E0D0",
  },
  {
    id: 2,
    brand: "COS",
    name: "와이드 리넨 팬츠",
    price: "62,000",
    status: "판매중",
    views: 18,
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&q=75&fit=crop",
    fallback: "#D4E0EC",
  },
  {
    id: 3,
    brand: "TOTEME",
    name: "오버핏 트렌치코트",
    price: "198,000",
    status: "예약중",
    views: 91,
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=300&q=75&fit=crop",
    fallback: "#E0D8D0",
  },
];

const YELLOW = "#F5C200";
const DARK   = "#1a1a1a";

// ─── Action button ────────────────────────────────────────────────────────────

function ActionButton({ icon, label, sublabel, onClick, accent = false }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2.5"
      style={{ flex: 1 }}
    >
      {/* Circle */}
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: 64,
          height: 64,
          backgroundColor: accent ? YELLOW : "#F5F5F5",
          boxShadow: accent
            ? "0 4px 14px rgba(245,194,0,0.35)"
            : "0 2px 8px rgba(0,0,0,0.07)",
        }}
      >
        {icon}
      </div>
      {/* Labels */}
      <div className="flex flex-col items-center gap-0.5">
        <span
          className="text-[12px] font-bold leading-tight text-center"
          style={{ color: DARK, fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
        >
          {label}
        </span>
        {sublabel && (
          <span
            className="text-[10px] leading-tight text-center"
            style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            {sublabel}
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Icon: lightning bolt (빠른 판매) ─────────────────────────────────────────
function QuickIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path
        d="M14.5 3L5 15H13L11.5 23L21 11H13L14.5 3Z"
        fill={DARK}
        stroke={DARK}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Icon: hanger (옷장 판매) ─────────────────────────────────────────────────
function ClosetIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path d="M13 4C13 4 11 5.2 11 6.8C11 7.9 11.9 8.5 13 8.8" stroke={DARK} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M13 4C13 4 15 5.2 15 6.8C15 7.9 14.1 8.5 13 8.8" stroke={DARK} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M13 8.8L4 16H22L13 8.8Z" stroke={DARK} strokeWidth="1.6" strokeLinejoin="round" fill="rgba(26,26,26,0.08)" />
      <path d="M4 16H22" stroke={DARK} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// ─── Icon: bag (클린아웃) ─────────────────────────────────────────────────────
function BagIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <rect x="4" y="9" width="18" height="13" rx="2.5" stroke={DARK} strokeWidth="1.6" fill="rgba(26,26,26,0.08)" />
      <path d="M9 9V8C9 5.79 10.79 4 13 4C15.21 4 17 5.79 17 8V9" stroke={DARK} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 13H17" stroke={DARK} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// ─── Promo banner ─────────────────────────────────────────────────────────────

function PromoBanner({ onPress }) {
  return (
    <button
      onClick={onPress}
      className="relative rounded-2xl overflow-hidden mx-5"
      style={{ height: 160 }}
    >
      {/* Background image */}
      <img
        src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=700&q=80&fit=crop"
        alt="클린아웃백"
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: "cover", objectPosition: "center" }}
      />
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, rgba(10,10,10,0.80) 0%, rgba(10,10,10,0.40) 55%, transparent 100%)",
        }}
      />
      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-between p-5">
        {/* Top badge */}
        <div
          className="self-start px-2.5 py-1 rounded-full"
          style={{ backgroundColor: YELLOW }}
        >
          <span
            className="text-[10px] font-bold tracking-widest uppercase"
            style={{ color: DARK, fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            CLEANOUT BAG
          </span>
        </div>
        {/* Bottom text */}
        <div>
          <h3
            className="text-[20px] font-bold text-white leading-snug"
            style={{ fontFamily: "'Spoqa Han Sans Neo', sans-serif", letterSpacing: "-0.03em" }}
          >
            클린아웃백이 뭐죠?
          </h3>
          <div className="flex items-center gap-1 mt-1">
            <span
              className="text-[12px] font-medium"
              style={{ color: "rgba(255,255,255,0.72)", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
            >
              더 알아보기
            </span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M5 3L9 7L5 11"
                stroke="rgba(255,255,255,0.72)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Selling items list ───────────────────────────────────────────────────────

function SellingItemsList() {
  if (SELLING_ITEMS.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 pb-10">
        <span style={{ fontSize: 44 }}>🛍️</span>
        <p
          className="text-[14px] font-medium"
          style={{ color: "#BBBBBB", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
        >
          판매 중인 아이템이 없어요
        </p>
        <p
          className="text-[12px] text-center leading-relaxed"
          style={{ color: "#CCCCCC", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
        >
          아이템을 등록하고 판매를 시작해보세요
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-5 pb-6">
      {SELLING_ITEMS.map((item) => {
        const statusColor =
          item.status === "판매중" ? "#2ECC71" :
          item.status === "예약중" ? "#F5C200" : "#AAAAAA";

        return (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-xl p-3"
            style={{ backgroundColor: "#FAFAFA", border: "1px solid #F0F0F0" }}
          >
            {/* Thumbnail */}
            <div
              className="rounded-xl overflow-hidden shrink-0"
              style={{ width: 64, height: 64, backgroundColor: item.fallback }}
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full"
                style={{ objectFit: "cover", objectPosition: "center top" }}
              />
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p
                className="text-[10px] uppercase tracking-wide"
                style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
              >
                {item.brand}
              </p>
              <p
                className="text-[13px] font-medium truncate mt-0.5"
                style={{ color: "#222", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
              >
                {item.name}
              </p>
              <p
                className="text-[13px] font-bold mt-0.5"
                style={{ color: DARK, fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
              >
                {item.price}원
              </p>
            </div>
            {/* Right side */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${statusColor}18`,
                  color: statusColor,
                  fontFamily: "'Spoqa Han Sans Neo', sans-serif",
                }}
              >
                {item.status}
              </span>
              <span
                className="text-[10px]"
                style={{ color: "#CCCCCC", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
              >
                조회 {item.views}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SellPage({ onQuickSell, onSellFromCloset, onCleanout }) {
  const [activeTab, setActiveTab] = useState("sell"); // "sell" | "selling"

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* ── Header ── */}
      <div className="shrink-0 px-5 pt-5 pb-0">
        <h1
          className="text-[22px] font-bold"
          style={{ color: DARK, fontFamily: "'Spoqa Han Sans Neo', sans-serif", letterSpacing: "-0.03em" }}
        >
          판매
        </h1>

        {/* Segment control */}
        <div
          className="flex mt-4 rounded-xl p-1"
          style={{ backgroundColor: "#F2F2F2" }}
        >
          {[
            { id: "sell",    label: "판매하기"       },
            { id: "selling", label: "판매중인 아이템" },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex-1 py-2 rounded-lg text-[13px] font-medium transition-all"
              style={{
                backgroundColor: activeTab === id ? "white" : "transparent",
                color:           activeTab === id ? DARK    : "#AAAAAA",
                fontFamily:      "'Spoqa Han Sans Neo', sans-serif",
                fontWeight:      activeTab === id ? 700 : 500,
                boxShadow:       activeTab === id ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {activeTab === "sell" ? (
          <>
            {/* Divider */}
            <div className="mx-5 mt-5 mb-6" style={{ height: 1, backgroundColor: "#F0F0F0" }} />

            {/* Section label */}
            <div className="px-5 mb-5">
              <p
                className="text-[11px] font-bold tracking-[0.14em] uppercase"
                style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
              >
                판매 방법 선택
              </p>
            </div>

            {/* 3 action buttons */}
            <div className="flex items-start justify-between px-8 mb-8">
              <ActionButton
                icon={<QuickIcon />}
                label="빠른 판매"
                sublabel="등록"
                onClick={onQuickSell}
                accent
              />
              <ActionButton
                icon={<ClosetIcon />}
                label="내 옷장 속"
                sublabel="아이템 판매"
                onClick={onSellFromCloset}
              />
              <ActionButton
                icon={<BagIcon />}
                label="클린아웃백"
                sublabel="신청"
                onClick={onCleanout}
              />
            </div>

            {/* Tips section */}
            <div className="mx-5 mt-5 mb-6 rounded-2xl p-4" style={{ backgroundColor: "#FAFAFA", border: "1px solid #F0F0F0" }}>
              <p
                className="text-[11px] font-bold tracking-[0.1em] uppercase mb-3"
                style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
              >
                판매 팁
              </p>
              {[
                { emoji: "📸", text: "밝은 곳에서 여러 각도로 촬영하면 판매가 빨라요" },
                { emoji: "🏷️", text: "브랜드와 사이즈를 정확히 입력해 주세요"          },
                { emoji: "📦", text: "상태 설명이 자세할수록 신뢰도가 높아져요"         },
              ].map(({ emoji, text }) => (
                <div key={text} className="flex items-start gap-2.5 mb-2 last:mb-0">
                  <span style={{ fontSize: 14, lineHeight: "20px" }}>{emoji}</span>
                  <p
                    className="text-[12px] leading-5"
                    style={{ color: "#666", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
                  >
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mx-5 mt-5 mb-4" style={{ height: 1, backgroundColor: "#F0F0F0" }} />
            <SellingItemsList />
          </>
        )}
      </div>
    </div>
  );
}
