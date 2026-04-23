import { useState, useEffect, useRef, useCallback } from "react";
import TopBar from "../../components/TopBar";
import LazyImage from "../../components/LazyImage";
import OutfitDetailScreen from "../../components/OutfitDetailScreen";
import { OUTFIT_DATA } from "../../constants/mockOutfitData";
import SearchFilterScreen from "../../components/SearchFilterScreen";
import FavoritesScreen from "../../components/FavoritesScreen";
import NotificationCenterScreen from "../../components/NotificationCenterScreen";
import { useFavorites } from "../../lib/favoritesStore";
import WeatherDetailScreen from "../weather/WeatherDetailScreen";
import FullListScreen from "../closet/FullListScreen";
import { useWeather, CONDITION_META } from "../../hooks/useWeather";
import {
  getWeatherOutfitRec,
  buildWeatherContext,
  getTempPref,
  setTempPref,
  TEMP_PREF_LABELS,
} from "../../services/weatherRecommendation";
import { getWearRecord, todayStr } from "../../lib/wearHistoryStore";
import {
  MAIN_CATEGORIES,
  SUBCATEGORIES,
  CLOSET_ITEMS,
  getItemsByCategory,
  getItemsBySubcategory,
} from "../../constants/mockClosetData";
import { filterClosetItemsByPiece } from "../../lib/filterClosetItemsByPiece";
import SimilarClosetScreen from "../../components/SimilarClosetScreen";
import {
  COMPANY_NAME, COMPANY_CEO, BUSINESS_NUMBER, TELECOM_REG_NUMBER,
  APP_VERSION,
  COMPANY_URL, SUPPORT_EMAIL, PARTNERSHIP_EMAIL,
  CUSTOMER_SERVICE_PHONE, SUPPORT_HOURS,
  openExternalUrl, openMailTo, openTel,
} from "../../constants/appConfig";
import { zoneItemImg, zoneCoordiImg } from "../../lib/localImages";

// ─── 2 banner slides ──────────────────────────────────────────────────────────
// Order: [0] mainimage (→ introducing), [1] banner2 (→ guide)
const BANNER_SLIDES = [
  {
    id: "main",
    image:     "/mainimage.jpg",
    detailKey: "introducing",   // which detail screen opens on tap
    label:     "TRUNK ROOM",
    title:     "트렁크룸과 함께해요",
    sub:       "자원을 아끼고 사랑하는 새로운 방법,\n쉬운 정리를 돕는 커뮤니티",
    cta:       "자세히 보기",
  },
  {
    id: "banner2",
    image:     "/banner2.png",
    detailKey: "guide",         // which detail screen opens on tap
    label:     "AI CLOSET",
    title:     "간단한 정리의 시작",
    sub:       "내 손안의 작은 AI 모바일 옷장",
    cta:       "가이드 보기",
  },
];

// Detail screen images keyed by detailKey above
const DETAIL_IMAGES = {
  introducing: { src: "/introducing.jpg", alt: "트렁크룸 소개" },
  guide:       { src: "/guide.jpg",       alt: "사용 가이드"   },
};

// ─── Detail screen (scrollable tall image) ───────────────────────────────────

function DetailScreen({ detailKey, onBack }) {
  const detail = DETAIL_IMAGES[detailKey];
  return (
    <div className="absolute inset-0 z-20 bg-black flex flex-col overflow-hidden">
      {/* Fixed back button */}
      <div className="absolute top-0 left-0 right-0 z-30 px-3 pt-3 pointer-events-none">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-10 h-10 rounded-full pointer-events-auto"
          style={{ backgroundColor: "rgba(255,255,255,0.88)", backdropFilter: "blur(10px)" }}
          aria-label="뒤로"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M12.5 4L7 10L12.5 16"
              stroke="#222"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Scrollable image — natural height, drag down to see all */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <img
          src={detail.src}
          alt={detail.alt}
          style={{ width: "100%", display: "block" }}
        />
      </div>
    </div>
  );
}

// ─── Today Record Card ────────────────────────────────────────────────────────
// Square card (aspect-ratio 1:1) centred on today's outfit.
// • Not recorded → yellow gradient with camera + CTA copy
// • Recorded     → dark card with item grid + "오늘의 코디 완성!" badge

function TodayRecordCard({ onRecordToday }) {
  const todayRecord = getWearRecord(todayStr());
  const hasRecord   = !!todayRecord;
  const FONT = "'Spoqa Han Sans Neo', sans-serif";

  // Gather item images for the "recorded" state
  const recordedItems = hasRecord
    ? (todayRecord.itemIds ?? [])
        .map((id) => CLOSET_ITEMS.find((i) => i.id === id))
        .filter(Boolean)
        .slice(0, 4)
    : [];

  return (
    <div className="px-4 pt-4 pb-1">
      <button
        className="relative w-full overflow-hidden rounded-2xl active:opacity-90"
        style={{ aspectRatio: "1 / 1", display: "block" }}
        onClick={onRecordToday}
      >
        {hasRecord ? (
          /* ── Recorded state ── */
          <>
            {/* Background: dark gradient */}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2e2e2e 100%)" }}
            />
            {/* Item grid */}
            <div className="absolute inset-0 p-5 flex flex-col gap-3">
              {/* 완료 badge */}
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                  style={{ backgroundColor: "#F5C200" }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5L3.8 7.5L8.5 2.5" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[11px] font-bold" style={{ color: "#1a1a1a", fontFamily: FONT }}>오늘의 코디 완성!</span>
                </div>
              </div>
              {/* Item thumbnails */}
              {recordedItems.length > 0 ? (
                <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: recordedItems.length === 1 ? "1fr" : "1fr 1fr" }}>
                  {recordedItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl overflow-hidden"
                      style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span style={{ fontSize: 32 }}>👗</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : todayRecord.photoUrl ? (
                <div className="flex-1 rounded-xl overflow-hidden">
                  <img
                    src={todayRecord.photoUrl}
                    alt="오늘의 코디"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <span style={{ fontSize: 64 }}>👗</span>
                </div>
              )}
              {/* Bottom label */}
              <p className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.55)", fontFamily: FONT }}>
                기록 수정하기 →
              </p>
            </div>
          </>
        ) : (
          /* ── Not recorded state ── */
          <>
            {/* Warm yellow gradient background */}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(145deg, #FFF3B0 0%, #FFE066 40%, #F5C200 100%)" }}
            />
            {/* Decorative circle */}
            <div
              className="absolute"
              style={{
                width: 260, height: 260,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.45)",
                top: -60, right: -60,
              }}
            />
            <div
              className="absolute"
              style={{
                width: 180, height: 180,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.3)",
                top: -20, right: -20,
              }}
            />
            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8">
              {/* Camera icon circle */}
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: 72, height: 72, backgroundColor: "rgba(255,255,255,0.65)", backdropFilter: "blur(8px)" }}
              >
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M12 6L10 9H6C4.9 9 4 9.9 4 11V24C4 25.1 4.9 26 6 26H26C27.1 26 28 25.1 28 24V11C28 9.9 27.1 9 26 9H22L20 6H12Z" stroke="#1a1a1a" strokeWidth="1.8" strokeLinejoin="round" />
                  <circle cx="16" cy="17" r="4.5" stroke="#1a1a1a" strokeWidth="1.8" />
                  <circle cx="23.5" cy="13" r="1" fill="#1a1a1a" />
                </svg>
              </div>
              {/* Copy */}
              <div className="text-center">
                <p className="text-[20px] font-bold leading-snug" style={{ color: "#1a1a1a", fontFamily: FONT, letterSpacing: "-0.03em" }}>
                  오늘의 착장을<br />기록해보세요
                </p>
                <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "rgba(0,0,0,0.45)", fontFamily: FONT }}>
                  사진을 찍거나 아이템을 선택해<br />나만의 코디를 남겨보세요
                </p>
              </div>
              {/* CTA pill */}
              <div
                className="flex items-center gap-2 px-5 py-2.5 rounded-full"
                style={{ backgroundColor: "#1a1a1a" }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5.5 2.5L9.5 7L5.5 11.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[13px] font-bold text-white" style={{ fontFamily: FONT }}>기록 시작하기</span>
              </div>
            </div>
          </>
        )}
      </button>
    </div>
  );
}

// ─── Banner carousel (2 slides, infinite loop) ───────────────────────────────
//
// Infinite loop strategy — clone-wrap:
//   renderSlides = [slide1_clone, slide0, slide1, slide0_clone]
//   visualIndex starts at 1 → shows real slide 0 (mainimage)
//   Auto-advances every 4 s
//   When transition ends at index 0 (clone of last) → snap to real last (index 2)
//   When transition ends at index 3 (clone of first) → snap to real first (index 1)
//
const CAROUSEL_INTERVAL = 4000;

function BannerCarousel({ onBannerTap }) {
  const real   = BANNER_SLIDES;          // [main, banner2]
  const count  = real.length;            // 2

  // [banner2_clone, main, banner2, main_clone]
  const slides = [real[count - 1], ...real, real[0]];

  const [index,    setIndex]    = useState(1);   // start at real first
  const [animated, setAnimated] = useState(true);
  const timerRef = useRef(null);

  // touch tracking
  const touchX0    = useRef(null);
  const touchIndex0 = useRef(null);

  const jumpTo = useCallback((i, anim = true) => {
    setAnimated(anim);
    setIndex(i);
  }, []);

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIndex(prev => prev + 1);
      setAnimated(true);
    }, CAROUSEL_INTERVAL);
  }, []);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  const onTransitionEnd = () => {
    if (index === 0)               jumpTo(count, false);      // was at last-clone → snap to real last
    else if (index === count + 1)  jumpTo(1,     false);      // was at first-clone → snap to real first
  };

  const onTouchStart = (e) => {
    touchX0.current     = e.touches[0].clientX;
    touchIndex0.current = index;
    clearInterval(timerRef.current);
  };
  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchX0.current;
    if (Math.abs(dx) > 36) jumpTo(index + (dx < 0 ? 1 : -1), true);
    startTimer();
  };

  // dot index in [0, count-1]
  const dotIndex = ((index - 1 + count) % count);

  const handleTap = (slide) => {
    onBannerTap(slide.detailKey);
  };

  return (
    <div
      className="relative overflow-hidden"
      style={{ height: 300 }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Sliding track */}
      <div
        className="flex h-full"
        style={{
          width: `${slides.length * 100}%`,
          transform: `translateX(-${(index / slides.length) * 100}%)`,
          transition: animated ? "transform 0.44s cubic-bezier(0.25,0.46,0.45,0.94)" : "none",
        }}
        onTransitionEnd={onTransitionEnd}
      >
        {slides.map((slide, i) => (
          <div
            key={`${slide.id}-${i}`}
            className="relative h-full shrink-0 cursor-pointer"
            style={{ width: `${100 / slides.length}%` }}
            onClick={() => handleTap(slide)}
          >
            {/* Background image */}
            <img
              src={slide.image}
              alt={slide.title}
              className="absolute inset-0 w-full h-full"
              style={{ objectFit: "cover", objectPosition: "center" }}
            />
            {/* Dark gradient */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(12,12,12,0.84) 0%, rgba(12,12,12,0.22) 52%, transparent 100%)",
              }}
            />
            {/* Text overlay */}
            <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
              <p
                className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1.5"
                style={{
                  color: "rgba(255,255,255,0.52)",
                  fontFamily: "'Spoqa Han Sans Neo', sans-serif",
                }}
              >
                {slide.label}
              </p>
              <h2
                className="text-[21px] font-bold leading-snug text-white"
                style={{
                  fontFamily: "'Spoqa Han Sans Neo', sans-serif",
                  letterSpacing: "-0.025em",
                }}
              >
                {slide.title}
              </h2>
              <p
                className="text-[12px] mt-1 leading-relaxed whitespace-pre-line"
                style={{
                  color: "rgba(255,255,255,0.58)",
                  fontFamily: "'Spoqa Han Sans Neo', sans-serif",
                }}
              >
                {slide.sub}
              </p>
              {/* CTA pill */}
              <div
                className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: "rgba(255,255,255,0.14)",
                  backdropFilter: "blur(6px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <span
                  className="text-[11px] font-medium text-white"
                  style={{ fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
                >
                  {slide.cta}
                </span>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path
                    d="M3.5 2L7.5 5.5L3.5 9"
                    stroke="white"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination dots */}
      <div className="absolute bottom-4 right-5 flex gap-1.5 z-10">
        {real.map((_, i) => (
          <button
            key={i}
            onClick={() => { jumpTo(i + 1, true); startTimer(); }}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === dotIndex ? 18 : 5,
              height: 5,
              backgroundColor: i === dotIndex ? "white" : "rgba(255,255,255,0.36)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Closet mini card (dark variant) — used inside recommendation dark card ───

function ClosetMiniCardDark({ item, onTap }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <button
      onClick={() => onTap?.(item)}
      className="shrink-0 rounded-xl overflow-hidden text-left active:opacity-75"
      style={{ width: 86, marginRight: 8, scrollSnapAlign: "start", backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      <div className="relative overflow-hidden" style={{ height: 100, backgroundColor: "rgba(255,255,255,0.05)" }}>
        {!imgErr ? (
          <img
            src={item.image}
            alt={item.name}
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: "cover", objectPosition: "center top" }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="4" width="16" height="12" rx="2" stroke="rgba(255,255,255,0.25)" strokeWidth="1.3" />
              <circle cx="10" cy="10" r="3" stroke="rgba(255,255,255,0.25)" strokeWidth="1.3" />
            </svg>
          </div>
        )}
      </div>
      <div className="px-1.5 pt-1 pb-1.5">
        <p
          className="text-[8px] uppercase tracking-wide truncate"
          style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
        >
          {item.brand}
        </p>
        <p
          className="text-[9px] font-medium mt-0.5 leading-tight"
          style={{ color: "rgba(255,255,255,0.8)", fontFamily: "'Spoqa Han Sans Neo', sans-serif",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
        >
          {item.displayName ?? item.name}
        </p>
      </div>
    </button>
  );
}

// ─── Inline closet filter panel (expands inside recommendation card) ──────────

function ClosetItemsByPiece({ piece, onItemTap }) {
  const items = filterClosetItemsByPiece(piece);

  return (
    <div
      className="mt-4 pt-4"
      style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: 14 }}>{piece.emoji}</span>
          <p
            className="text-[12px] font-bold"
            style={{ color: "white", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            내 옷장 속 {piece.label}
          </p>
        </div>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full"
          style={{ backgroundColor: items.length > 0 ? "rgba(245,194,0,0.2)" : "rgba(255,255,255,0.1)", color: items.length > 0 ? "#F5C200" : "rgba(255,255,255,0.35)", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
        >
          {items.length > 0 ? `${items.length}개 보유` : "미보유"}
        </span>
      </div>

      {items.length === 0 ? (
        /* Empty state */
        <div
          className="rounded-xl px-4 py-4 flex items-center gap-3"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.12)" }}
        >
          <div
            className="flex items-center justify-center rounded-full shrink-0"
            style={{ width: 32, height: 32, backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 3V11M3 7H11" stroke="rgba(255,255,255,0.35)" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
              아직 등록된 아이템이 없어요
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.28)", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
              옷장에서 {piece.label}을(를) 추가해 보세요
            </p>
          </div>
        </div>
      ) : (
        /* Closet item scroll */
        <div
          className="flex overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", scrollSnapType: "x mandatory" }}
        >
          {items.map((item) => (
            <ClosetMiniCardDark key={item.id} item={item} onTap={onItemTap} />
          ))}
          <div className="shrink-0 w-2" />
        </div>
      )}
    </div>
  );
}

// ─── Weather section ──────────────────────────────────────────────────────────

const TEMP_PREFS = [
  { key: "cold",   label: "추위 탐", emoji: "🧊" },
  { key: "normal", label: "보통",    emoji: "😊" },
  { key: "warm",   label: "더위 탐", emoji: "🔥" },
];

function WeatherSection({ onExpand, onItemTap }) {
  const { weather, loading } = useWeather();
  const [selectedPiece, setSelectedPiece] = useState(null);

  // Skeleton while loading
  if (loading && !weather) {
    return (
      <div className="py-6 bg-white">
        <div className="flex items-end justify-between px-6 mb-4">
          <div>
            <p className="text-[11px] font-bold tracking-[0.12em] uppercase" style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>TODAY'S WEATHER</p>
            <h2 className="text-[17px] font-bold leading-tight" style={{ color: "#222", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>오늘의 날씨 & 추천 스타일</h2>
          </div>
        </div>
        <div className="mx-6 rounded-2xl overflow-hidden mb-4" style={{ backgroundColor: "#F5F5F5", height: 112 }}>
          <div className="animate-pulse h-full" style={{ backgroundColor: "#EBEBEB" }} />
        </div>
        <div className="mx-6 rounded-2xl overflow-hidden" style={{ backgroundColor: "#313439", height: 280 }}>
          <div className="animate-pulse h-full" style={{ backgroundColor: "rgba(255,255,255,0.04)" }} />
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const outfit = getWeatherOutfitRec(buildWeatherContext(weather, getTempPref()));
  const cond   = CONDITION_META[weather.conditionCode] || CONDITION_META.clear;

  function handlePieceTap(piece) {
    setSelectedPiece((prev) => prev?.label === piece.label ? null : piece);
  }

  return (
    <div className="py-6 bg-white">
      <div className="flex items-end justify-between px-6 mb-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.12em] uppercase" style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
            TODAY'S WEATHER
          </p>
          <h2 className="text-[17px] font-bold leading-tight" style={{ color: "#222", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
            오늘의 날씨 & 추천 스타일
          </h2>
        </div>
        <span className="text-[11px]" style={{ color: "#BBBBBB", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>{weather.location}</span>
      </div>

      {/* ── Weather card (taps → weather detail) ── */}
      <button
        className="mx-6 rounded-2xl overflow-hidden mb-4 w-[calc(100%-3rem)] text-left"
        style={{ backgroundColor: cond.bg }}
        onClick={onExpand}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <div className="flex items-end gap-1">
              <span className="text-[48px] font-thin leading-none" style={{ color: "#222", fontFamily: "system-ui, sans-serif", letterSpacing: "-0.04em" }}>{weather.temp}</span>
              <span className="text-[20px] mb-2" style={{ color: "#555" }}>°</span>
            </div>
            <p className="text-[13px] font-medium mt-0.5" style={{ color: "#555", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>{weather.condition}</p>
            <div className="flex gap-2 mt-1">
              <span className="text-[11px]" style={{ color: "#888", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>최고 {weather.high}°</span>
              <span className="text-[11px]" style={{ color: "#CCC" }}>|</span>
              <span className="text-[11px]" style={{ color: "#888", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>최저 {weather.low}°</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <span style={{ fontSize: 52, lineHeight: 1 }}>{cond.icon}</span>
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="text-[17px]">💧</span>
                <span className="text-[10px] mt-0.5" style={{ color: "#888", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>{weather.humidity}%</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[17px]">🍃</span>
                <span className="text-[10px] mt-0.5" style={{ color: "#888", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>{weather.wind}m/s</span>
              </div>
            </div>
          </div>
        </div>
        <div className="px-5 pb-4 flex items-center gap-2">
          <span className="text-[11px]" style={{ color: "#999", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>체감 {weather.feelsLike}°</span>
          <div className="flex-1 h-px" style={{ backgroundColor: "rgba(0,0,0,0.07)" }} />
          <div className="flex items-center gap-0.5">
            <span className="text-[10px]" style={{ color: "#BBBBBB", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>자세히</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 2.5L7.5 6L4 9.5" stroke="#CCCCCC" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </button>

      {/* ── 오늘의 트렁크룸 추천 스타일 card ── */}
      <div className="mx-6 rounded-2xl overflow-hidden" style={{ backgroundColor: "#313439" }}>

        {/* Editorial outfit image — aligned to recommendation theme */}
        <div className="relative" style={{ height: 158 }}>
          <LazyImage
            src={outfit.image}
            alt={outfit.keyword}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }}
            priority
          />
          {/* Gradient overlay — dark at bottom so text is readable */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(49,52,57,0.15) 0%, rgba(49,52,57,0.62) 60%, rgba(49,52,57,1) 100%)" }}
          />
          {/* Temp badge — top right */}
          <div className="absolute top-4 right-4">
            <span
              className="text-[13px] font-bold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "#F5C200", color: "#222", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
            >
              {weather.temp}°
            </span>
          </div>
          {/* Title overlay — bottom of image */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
            <p
              className="text-[10px] font-bold tracking-[0.18em] uppercase mb-1"
              style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
            >
              TRUNKROOM PICK
            </p>
            <h3
              className="text-[16px] font-bold text-white leading-tight"
              style={{ fontFamily: "'Spoqa Han Sans Neo', sans-serif", letterSpacing: "-0.025em" }}
            >
              오늘의 트렁크룸 추천 스타일
            </h3>
          </div>
        </div>

        {/* Content area */}
        <div className="px-5 pt-4 pb-5">
          {/* Keyword badge */}
          <div
            className="inline-flex items-center px-3 py-1 rounded-sm mb-3"
            style={{ backgroundColor: "rgba(245,194,0,0.14)", border: "1px solid rgba(245,194,0,0.28)" }}
          >
            <span
              className="text-[12px] font-bold"
              style={{ color: "#F5C200", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
            >
              {outfit.keyword}
            </span>
          </div>

          {/* Weather-aware recommendation copy */}
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: "rgba(255,255,255,0.72)", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            {outfit.desc}
          </p>

          {/* ── Piece chips (tappable → filters closet) ── */}
          <div
            className="mt-4 pt-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <p
                className="text-[11px] font-bold"
                style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'Spoqa Han Sans Neo', sans-serif", letterSpacing: "0.04em" }}
              >
                오늘의 추천 아이템
              </p>
              <p
                className="text-[10px]"
                style={{ color: "rgba(255,255,255,0.28)", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
              >
                탭하면 내 옷장에서 찾아드려요
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {outfit.pieces.map((piece) => {
                const isActive = selectedPiece?.label === piece.label;
                return (
                  <button
                    key={piece.label}
                    onClick={() => handlePieceTap(piece)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
                    style={{
                      backgroundColor: isActive ? "#F5C200"                    : "rgba(255,255,255,0.09)",
                      color:           isActive ? "#1a1a1a"                    : "rgba(255,255,255,0.78)",
                      border:          isActive ? "1.5px solid #F5C200"        : "1.5px solid rgba(255,255,255,0.14)",
                      fontFamily:      "'Spoqa Han Sans Neo', sans-serif",
                      transform:       isActive ? "scale(1.04)" : "scale(1)",
                    }}
                  >
                    <span style={{ fontSize: 12 }}>{piece.emoji}</span>
                    <span className="text-[11px] font-medium">{piece.label}</span>
                    {isActive && (
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path d="M1.5 4.5L3.7 6.5L7.5 2.5" stroke="#1a1a1a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Inline closet items (expands when piece is tapped) ── */}
          {selectedPiece && (
            <ClosetItemsByPiece piece={selectedPiece} onItemTap={onItemTap} />
          )}
        </div>
      </div>
    </div>
  );
}


// ─── Community "오늘 이거 입었어요" section ──────────────────────────────────
// Shows community outfit posts from today / last 7 days.
// Uses capsule flat-lay images as outfit thumbnails.

// ─── Community posts use 스타일 folder (coordi pool, community zone 60-79) ────
// Item listings use 옷 folder (items pool, homeListings zone)
const COMMUNITY_TODAY_POSTS = [
  {
    id: "c1",
    username: "minj_closet",
    avatar: "🧥",
    timeAgo: "방금",
    image: zoneCoordiImg("community", 0),
    mood: "미니멀",
    moodColor: "#E8E8E8",
    moodText: "#444",
    likes: 24,
  },
  {
    id: "c2",
    username: "stylegram_y",
    avatar: "👗",
    timeAgo: "1시간 전",
    image: zoneCoordiImg("community", 1),
    mood: "빈티지",
    moodColor: "#F5ECD7",
    moodText: "#7A5C2E",
    likes: 41,
  },
  {
    id: "c3",
    username: "daily.ootd_j",
    avatar: "🧣",
    timeAgo: "3시간 전",
    image: zoneCoordiImg("community", 2),
    mood: "캐주얼",
    moodColor: "#E3EEFF",
    moodText: "#2B5DD4",
    likes: 17,
  },
  {
    id: "c4",
    username: "codi_hana",
    avatar: "👔",
    timeAgo: "어제",
    image: zoneCoordiImg("community", 3),
    mood: "오피스",
    moodColor: "#E8F5E9",
    moodText: "#2E7D32",
    likes: 36,
  },
  {
    id: "c5",
    username: "fitcheck_s",
    avatar: "🌸",
    timeAgo: "어제",
    image: zoneCoordiImg("community", 4),
    mood: "페미닌",
    moodColor: "#FCE4EC",
    moodText: "#C2185B",
    likes: 52,
  },
  {
    id: "c6",
    username: "wearlog_k",
    avatar: "🖤",
    timeAgo: "2일 전",
    image: zoneCoordiImg("community", 5),
    mood: "시크",
    moodColor: "#F0F0F0",
    moodText: "#333",
    likes: 29,
  },
];

// ─── Community Style Detail Screen ───────────────────────────────────────────
// Opens when user taps a community post. Shows outfit photo + metadata + worn items.

function CommunityStyleDetailScreen({ post, onBack, onItemTap }) {
  const FONT = "'Spoqa Han Sans Neo', sans-serif";
  const [similarOpen, setSimilarOpen] = useState(false);

  // Pick a few sample closet items to "suggest" as worn items for the post
  // In a real app these would come from post.itemIds; here we pick plausible ones
  const suggestedItems = CLOSET_ITEMS
    .slice(0, 6)
    .filter((_, i) => [0, 2, 4].includes(i));

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-white overflow-hidden">
      {/* Similar closet items overlay */}
      {similarOpen && (
        <SimilarClosetScreen
          wornItems={suggestedItems}
          onBack={() => setSimilarOpen(false)}
          onItemTap={(item) => { setSimilarOpen(false); onItemTap?.(item); }}
        />
      )}

      {/* Hero image — scrollable */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {/* Full-bleed hero */}
        <div className="relative" style={{ height: 420 }}>
          <img
            src={post.image}
            alt={post.username}
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: "cover", objectPosition: "center top" }}
          />
          {/* Gradient */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.0) 100%)" }}
          />
          {/* Back button */}
          <button
            onClick={onBack}
            className="absolute top-4 left-4 w-9 h-9 flex items-center justify-center rounded-full active:opacity-70"
            style={{ backgroundColor: "rgba(255,255,255,0.88)", backdropFilter: "blur(10px)" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9L11 14" stroke="#222" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {/* Mood chip */}
          <div className="absolute top-4 right-4">
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: post.moodColor, color: post.moodText, fontFamily: FONT }}
            >
              {post.mood}
            </span>
          </div>
          {/* Bottom user info overlay */}
          <div
            className="absolute bottom-0 left-0 right-0 px-5 pb-5"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, transparent 100%)" }}
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[16px]"
                style={{ backgroundColor: "rgba(255,255,255,0.18)", backdropFilter: "blur(4px)" }}
              >
                {post.avatar}
              </div>
              <div>
                <p className="text-[13px] font-bold text-white" style={{ fontFamily: FONT }}>@{post.username}</p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.55)", fontFamily: FONT }}>{post.timeAgo}</p>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 12L1.5 6.5C1 6 1 5.5 1 4.8C1 3.2 2.5 2 4.2 2C5.1 2 5.9 2.5 6.5 3.1L7 3.7L7.5 3.1C8.1 2.5 8.9 2 9.8 2C11.5 2 13 3.2 13 4.8C13 5.5 12.9 6 12.5 6.5L7 12Z"
                    fill="rgba(255,255,255,0.8)" />
                </svg>
                <span className="text-[12px] font-bold text-white" style={{ fontFamily: FONT }}>{post.likes}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content body ── */}
        <div className="px-5 pt-5 pb-8">

          {/* Style summary */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className="text-[12px] font-bold px-3 py-1.5 rounded-full"
              style={{ backgroundColor: post.moodColor, color: post.moodText, fontFamily: FONT }}
            >
              {post.mood}
            </span>
            <span className="text-[11px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>{post.timeAgo} 스타일</span>
          </div>

          {/* Worn items section */}
          <div className="mb-5">
            <p
              className="text-[11px] font-bold tracking-[0.08em] uppercase mb-3"
              style={{ color: "#AAAAAA", fontFamily: FONT }}
            >
              착용한 아이템
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {suggestedItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onItemTap?.(item)}
                  className="flex flex-col text-left active:opacity-70"
                >
                  <div
                    className="rounded-xl overflow-hidden w-full relative"
                    style={{ aspectRatio: "3/4", backgroundColor: "#F5F2EC" }}
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{
                          width: "100%", height: "100%",
                          objectFit: "cover", objectPosition: "center top",
                          mixBlendMode: "multiply",
                        }}
                      />
                    )}
                    {/* Tap indicator */}
                    <div
                      className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "rgba(0,0,0,0.18)" }}
                    >
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M3 1.5L5.5 4L3 6.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-[10px] font-medium mt-1.5 truncate w-full" style={{ color: "#1a1a1a", fontFamily: FONT }}>
                    {item.displayName ?? item.name}
                  </p>
                  <p className="text-[9px] truncate w-full" style={{ color: "#AAAAAA", fontFamily: FONT }}>{item.brand}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: "#F0F0F0", marginBottom: 16 }} />

          {/* "나도 비슷하게 입어보기" CTA */}
          <button
            onClick={() => setSimilarOpen(true)}
            className="w-full rounded-2xl px-4 py-4 flex items-center justify-between active:opacity-80"
            style={{ backgroundColor: "#FEFCE8", border: "1.5px solid #EDD83A" }}
          >
            <div className="text-left">
              <p className="text-[13px] font-bold" style={{ color: "#1a1a1a", fontFamily: FONT }}>
                나도 비슷하게 코디해볼까?
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "#888", fontFamily: FONT }}>
                내 옷장에서 비슷한 아이템을 찾아드려요
              </p>
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#1a1a1a" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3L11 8L6 13" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function CommunityTodaySection({ onItemTap }) {
  const FONT = "'Spoqa Han Sans Neo', sans-serif";
  const [activePost, setActivePost] = useState(null);

  return (
    <>
      {/* Community post detail overlay */}
      {activePost && (
        <CommunityStyleDetailScreen
          post={activePost}
          onBack={() => setActivePost(null)}
          onItemTap={onItemTap}
        />
      )}

      <div className="py-6" style={{ backgroundColor: "#F8F8F8" }}>
        <SectionHeader en="COMMUNITY" ko="남들은 오늘 이거 입었어요" />

        {/* 2-column grid */}
        <div className="px-4 grid grid-cols-2 gap-3">
          {COMMUNITY_TODAY_POSTS.map((post) => (
            <button
              key={post.id}
              onClick={() => setActivePost(post)}
              className="relative rounded-2xl overflow-hidden text-left active:opacity-90"
              style={{ aspectRatio: "3 / 4", backgroundColor: "#E8E8E8" }}
            >
              {/* Outfit photo */}
              <img
                src={post.image}
                alt={post.username}
                className="absolute inset-0 w-full h-full"
                style={{ objectFit: "cover", objectPosition: "center top" }}
              />
              {/* Gradient overlay */}
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.10) 55%, transparent 100%)" }}
              />
              {/* Top: mood chip */}
              <div className="absolute top-2.5 left-2.5">
                <span
                  className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: post.moodColor, color: post.moodText, fontFamily: FONT }}
                >
                  {post.mood}
                </span>
              </div>
              {/* Top-right: heart + like count */}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M5 8.5L1.2 4.8C0.8 4.4 0.8 4 0.8 3.5C0.8 2.4 1.8 1.5 3.1 1.5C3.7 1.5 4.2 1.8 4.6 2.2L5 2.6L5.4 2.2C5.8 1.8 6.3 1.5 6.9 1.5C8.2 1.5 9.2 2.4 9.2 3.5C9.2 4 9.1 4.4 8.8 4.8L5 8.5Z"
                    fill="rgba(255,255,255,0.75)"
                  />
                </svg>
                <span className="text-[9px] font-bold" style={{ color: "rgba(255,255,255,0.85)", fontFamily: FONT }}>{post.likes}</span>
              </div>
              {/* Bottom: user info */}
              <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[11px]"
                    style={{ backgroundColor: "rgba(255,255,255,0.18)", backdropFilter: "blur(4px)" }}
                  >
                    {post.avatar}
                  </div>
                  <p className="text-[10px] font-bold text-white truncate" style={{ fontFamily: FONT }}>
                    @{post.username}
                  </p>
                </div>
                <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.50)", fontFamily: FONT }}>
                  {post.timeAgo}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* 더보기 button */}
        <div className="px-4 mt-4">
          <button
            className="w-full py-3 rounded-xl flex items-center justify-center gap-2"
            style={{ backgroundColor: "white", border: "1px solid #E8E8E8" }}
          >
            <span className="text-[13px] font-medium" style={{ color: "#444", fontFamily: FONT }}>커뮤니티 코디 더보기</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3L9 7L5 11" stroke="#888" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ en, ko, onMore }) {
  return (
    <div className="flex items-end justify-between px-6 mb-4">
      <div>
        <p className="text-[11px] font-bold tracking-[0.12em] uppercase" style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>{en}</p>
        <h2 className="text-[17px] font-bold leading-tight" style={{ color: "#222222", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>{ko}</h2>
      </div>
      {onMore && (
        <button className="flex items-center gap-1" onClick={onMore}>
          <span className="text-[12px]" style={{ color: "#888", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>더보기</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3L9 7L5 11" stroke="#888" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ─── Product data — from 옷 folder (items pool, homeListings zone) ────────────
// tops[40-59], bottoms[36-51], outerwear[30-39], dress[10]
// Each index is unique within the homeListings zone → no duplicates with closet.

const NEW_LISTINGS = [
  {
    id: 1,
    brand: "MUSINSA STANDARD",
    name: "오버핏 화이트 셔츠",
    price: "28,000",
    condition: "S급",
    image: zoneItemImg("homeListings", "tops", 0),
    fallback: "#F5F5F0",
  },
  {
    id: 2,
    brand: "LEVIS",
    name: "와이드 데님 팬츠",
    price: "45,000",
    condition: "A급",
    image: zoneItemImg("homeListings", "bottoms", 0),
    fallback: "#D4DCE8",
  },
  {
    id: 3,
    brand: "COS",
    name: "베이지 트렌치코트",
    price: "89,000",
    condition: "S급",
    image: zoneItemImg("homeListings", "outerwear", 0),
    fallback: "#E8E0D4",
  },
  {
    id: 4,
    brand: "ARKET",
    name: "크림 케이블 가디건",
    price: "65,000",
    condition: "A급",
    image: zoneItemImg("homeListings", "tops", 1),
    fallback: "#F0EAE0",
  },
  {
    id: 5,
    brand: "TOTEME",
    name: "버건디 와이드 팬츠",
    price: "79,000",
    condition: "S급",
    image: zoneItemImg("homeListings", "bottoms", 1),
    fallback: "#EDE0E4",
  },
  {
    id: 6,
    brand: "UNIQLO",
    name: "오버핏 그레이 니트",
    price: "41,000",
    condition: "S급",
    image: zoneItemImg("homeListings", "tops", 2),
    fallback: "#E8E8E8",
  },
];

const HOT_LISTINGS = [
  {
    id: 7,
    brand: "SANDRO",
    name: "아이보리 랩 코트",
    price: "198,000",
    condition: "S급",
    image: zoneItemImg("homeListings", "outerwear", 1),
    fallback: "#F5F2EC",
  },
  {
    id: 8,
    brand: "MAJE",
    name: "화이트 홀터넥 드레스",
    price: "115,000",
    condition: "S급",
    image: zoneItemImg("homeListings", "dress", 0),
    fallback: "#F5F5F0",
  },
  {
    id: 9,
    brand: "COS",
    name: "버건디 새틴 미디스커트",
    price: "62,000",
    condition: "A급",
    image: zoneItemImg("homeListings", "bottoms", 2),
    fallback: "#EAD8DC",
  },
  {
    id: 10,
    brand: "& OTHER STORIES",
    name: "네이비 더블 블레이저",
    price: "145,000",
    condition: "A급",
    image: zoneItemImg("homeListings", "outerwear", 2),
    fallback: "#D8DCE8",
  },
  {
    id: 11,
    brand: "ARKET",
    name: "초콜릿 롱 울코트",
    price: "248,000",
    condition: "S급",
    image: zoneItemImg("homeListings", "outerwear", 3),
    fallback: "#E0D4CC",
  },
  {
    id: 12,
    brand: "TOTEME",
    name: "버건디 스트럭처드 블레이저",
    price: "178,000",
    condition: "S급",
    image: zoneItemImg("homeListings", "outerwear", 4),
    fallback: "#EAD8DC",
  },
];

// MAIN_CATEGORIES and SUBCATEGORIES are now imported from mockClosetData

// STYLE_BOOKS — from 스타일 folder (coordi pool, styleBooks zone 35-44)
// outfitId links each book to a real OUTFIT_DATA entry for the detail screen.
const STYLE_BOOKS = [
  {
    id: 1, title: "City Minimal",  count: 24, color: "#1C1C1E",
    image: zoneCoordiImg("styleBooks", 0), outfitId: "outfit-002",
    tags: ["미니멀", "모노톤", "데일리"],
  },
  {
    id: 2, title: "Vintage Vibes", count: 18, color: "#6B5040",
    image: zoneCoordiImg("styleBooks", 1), outfitId: "outfit-020",
    tags: ["빈티지", "레트로", "웜톤"],
  },
  {
    id: 3, title: "Street Core",   count: 31, color: "#1A2A3A",
    image: zoneCoordiImg("styleBooks", 2), outfitId: "outfit-008",
    tags: ["스트릿", "오버핏", "캐주얼"],
  },
  {
    id: 4, title: "Clean Fit",     count: 15, color: "#3A3A3A",
    image: zoneCoordiImg("styleBooks", 3), outfitId: "outfit-015",
    tags: ["클린", "베이직", "오피스"],
  },
  {
    id: 5, title: "Feminine",      count: 22, color: "#7A3040",
    image: zoneCoordiImg("styleBooks", 4), outfitId: "outfit-005",
    tags: ["페미닌", "플로럴", "데이트"],
  },
];

// ─── Reusable components ──────────────────────────────────────────────────────

function HorizontalScroll({ children }) {
  return (
    <div
      className="flex overflow-x-auto pl-6 pr-4"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {children}
      <div className="shrink-0 w-2" />
    </div>
  );
}

function ProductCard({ item, wide = false, onSelect }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [imgError, setImgError] = useState(false);
  const w = wide ? 163 : 148;
  const h = wide ? 210 : 190;
  const fav = isFavorite(item.id);

  return (
    <div
      className="relative shrink-0 rounded-sm overflow-hidden bg-white"
      style={{ width: w, marginRight: 10, scrollSnapAlign: "start", cursor: "pointer" }}
      onClick={() => onSelect && onSelect(item)}
    >
      {/* Image area */}
      <div className="relative overflow-hidden" style={{ height: h, backgroundColor: item.fallback }}>
        {!imgError ? (
          <img
            src={item.image}
            alt={item.name}
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: "cover", objectPosition: "center top" }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-25">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="8" width="24" height="18" rx="2" stroke="#666" strokeWidth="1.5" />
              <circle cx="16" cy="17" r="5" stroke="#666" strokeWidth="1.5" />
              <path d="M12 8V6C12 5.45 12.45 5 13 5H19C19.55 5 20 5.45 20 6V8" stroke="#666" strokeWidth="1.5" />
            </svg>
          </div>
        )}
        {/* Subtle image scrim */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, transparent 30%)" }} />

        {/* Condition badge */}
        <div
          className="absolute top-2 left-2 px-2 py-0.5 rounded-sm text-[10px] font-bold"
          style={{
            backgroundColor: item.condition === "S급" ? "#333" : item.condition === "A급" ? "#555" : "#888",
            color: "white",
            fontFamily: "'Spoqa Han Sans Neo', sans-serif",
          }}
        >
          {item.condition}
        </div>

        {/* Favorite heart — top-right */}
        <button
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.88)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { e.stopPropagation(); toggleFavorite(item, "other_closet"); }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 12L1.5 6.5C1 6 1 5.5 1 4.8C1 3.2 2.5 2 4.2 2C5.1 2 5.9 2.5 6.5 3.1L7 3.7L7.5 3.1C8.1 2.5 8.9 2 9.8 2C11.5 2 13 3.2 13 4.8C13 5.5 12.9 6 12.5 6.5L7 12Z"
              fill={fav ? "#E84040" : "none"}
              stroke={fav ? "#E84040" : "#888"}
              strokeWidth="1.3"
            />
          </svg>
        </button>
      </div>

      {/* Info */}
      <div className="px-2 pt-2 pb-3">
        <p className="text-[10px] uppercase tracking-wide truncate" style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>{item.brand}</p>
        <p className="text-[12px] font-medium mt-0.5 truncate" style={{ color: "#222", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>{item.name}</p>
        <p className="text-[13px] font-bold mt-1" style={{ color: "#333", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>{item.price}원</p>
      </div>
    </div>
  );
}

// ─── Small closet item card for horizontal carousel ──────────────────────────
function ClosetMiniCard({ item, onSelect }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <button
      onClick={() => onSelect?.(item)}
      className="shrink-0 rounded-xl overflow-hidden bg-white text-left active:opacity-75"
      style={{ width: 110, marginRight: 10, scrollSnapAlign: "start", border: "1px solid #F0F0F0" }}
    >
      <div className="relative overflow-hidden" style={{ height: 130, backgroundColor: "#F5F5F5" }}>
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="6" width="18" height="13" rx="2" stroke="#999" strokeWidth="1.5" />
              <circle cx="12" cy="12.5" r="3.5" stroke="#999" strokeWidth="1.5" />
            </svg>
          </div>
        )}
      </div>
      <div className="px-2 pt-1.5 pb-2">
        <p className="text-[8px] uppercase tracking-wide truncate" style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>{item.brand}</p>
        <p className="text-[11px] font-medium mt-0.5 truncate" style={{ color: "#1a1a1a", fontFamily: "'Spoqa Han Sans Neo', sans-serif", lineHeight: 1.3 }}>{item.name}</p>
        <p className="text-[10px] mt-0.5 truncate" style={{ color: "#BBBBBB", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>{item.color}</p>
      </div>
    </button>
  );
}

// ─── Categories component ─────────────────────────────────────────────────────
function Categories({ onMorePress, onItemSelect }) {
  const [selected,  setSelected]  = useState(null);
  const [activeSub, setActiveSub] = useState(null);

  function handleCatClick(cat) {
    if (selected === cat.label) {
      setSelected(null);
      setActiveSub(null);
    } else {
      setSelected(cat.label);
      setActiveSub(SUBCATEGORIES[cat.label]?.[0] ?? null);
    }
  }

  const subs      = selected ? SUBCATEGORIES[selected] : null;
  const subItems  = activeSub ? getItemsBySubcategory(activeSub) : [];

  return (
    <div className="py-6 bg-white">
      <SectionHeader en="CATEGORIES" ko="내 옷장 속 카테고리" />
      <div className="grid grid-cols-4 gap-3 px-6">
        {MAIN_CATEGORIES.map((cat) => {
          const isActive = selected === cat.label;
          return (
            <button
              key={cat.id}
              onClick={() => handleCatClick(cat)}
              className="flex flex-col items-center gap-2 py-3 rounded-xl transition-all"
              style={{
                backgroundColor: isActive ? "#1a1a1a" : "#F5F5F5",
                transform: isActive ? "scale(0.97)" : "scale(1)",
              }}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span
                className="text-[11px] font-medium"
                style={{ color: isActive ? "white" : "#444", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
              >
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sub-category panel */}
      {subs && (
        <div className="mt-4 px-5">
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#F8F8F8" }}>
            {/* Sub-category chip row */}
            <div className="pt-3 pb-2">
              <p
                className="text-[10px] font-bold tracking-widest uppercase mb-2.5 px-3"
                style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
              >
                {selected} 세부 카테고리
              </p>
              <div
                className="flex overflow-x-auto px-3 gap-2"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {subs.map((sub) => {
                  const isSubActive = activeSub === sub;
                  return (
                    <button
                      key={sub}
                      onClick={() => setActiveSub(sub)}
                      className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all"
                      style={{
                        backgroundColor: isSubActive ? "#1a1a1a" : "white",
                        color:           isSubActive ? "white"   : "#555",
                        fontFamily:      "'Spoqa Han Sans Neo', sans-serif",
                        border:          isSubActive ? "1.5px solid #1a1a1a" : "1.5px solid #E8E8E8",
                        whiteSpace:      "nowrap",
                      }}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Horizontal item carousel for selected subcategory */}
            {activeSub && (
              <div className="pb-3">
                {subItems.length === 0 ? (
                  <p
                    className="text-[12px] px-4 py-3"
                    style={{ color: "#CCCCCC", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
                  >
                    등록된 아이템이 없어요
                  </p>
                ) : (
                  <>
                    <div
                      className="flex overflow-x-auto pl-3 pr-2 pb-1 pt-2"
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none", scrollSnapType: "x mandatory" }}
                    >
                      {subItems.map((item) => (
                        <ClosetMiniCard key={item.id} item={item} onSelect={onItemSelect} />
                      ))}
                      <div className="shrink-0 w-2" />
                    </div>
                    {/* 더보기 */}
                    <button
                      onClick={() => onMorePress({
                        title: `${selected} · ${activeSub}`,
                        items: subItems,
                      })}
                      className="mx-3 mt-1 flex items-center gap-1"
                    >
                      <span className="text-[11px] font-medium" style={{ color: "#888", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
                        {activeSub} 더보기 ({subItems.length})
                      </span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M4 2.5L7.5 6L4 9.5" stroke="#888" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StyleBook({ onFilterOpen, onOutfitTap }) {
  return (
    <div className="py-6" style={{ backgroundColor: "#F5F5F5" }}>
      <SectionHeader en="STYLE BOOK" ko="남의 옷장 인기 스타일" onMore={onFilterOpen} />
      <HorizontalScroll>
        {STYLE_BOOKS.map((book) => (
          <button
            key={book.id}
            className="shrink-0 rounded-2xl overflow-hidden mr-3 relative active:opacity-85 transition-opacity"
            style={{ width: 150, height: 210, backgroundColor: book.color, scrollSnapAlign: "start" }}
            onClick={() => onOutfitTap?.(book.outfitId)}
          >
            {/* Outfit photo */}
            <img
              src={book.image}
              alt={book.title}
              className="absolute inset-0 w-full h-full"
              style={{ objectFit: "cover", objectPosition: "center top" }}
            />
            {/* Gradient overlay */}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.18) 55%, transparent 100%)" }}
            />
            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-between p-3.5">
              {/* Top badge */}
              <div
                className="self-start px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.18)", backdropFilter: "blur(6px)" }}
              >
                <span className="text-[9px] font-bold tracking-widest uppercase text-white" style={{ fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
                  STYLE
                </span>
              </div>
              {/* Bottom info */}
              <div>
                <p className="text-[15px] font-bold text-white leading-tight" style={{ fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
                  {book.title}
                </p>
                {/* Style tags */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {book.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] mt-1.5" style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
                  {book.count}개 아이템
                </p>
              </div>
            </div>
          </button>
        ))}
      </HorizontalScroll>
    </div>
  );
}

function Footer({ onLegalOpen }) {
  const FGRAY = "rgba(255,255,255,0.38)";
  const FDIM  = "rgba(255,255,255,0.22)";
  const FNT   = "'Spoqa Han Sans Neo', sans-serif";
  const FLINK = "rgba(255,255,255,0.58)";

  const footerLinks = [
    { label: "회사소개",         onPress: () => openExternalUrl(COMPANY_URL) },
    { label: "제휴문의",         onPress: () => openMailTo(PARTNERSHIP_EMAIL, "[제휴문의] 트렁크룸") },
    { label: "개인정보처리방침", onPress: () => onLegalOpen?.("privacy") },
    { label: "이용약관",         onPress: () => onLegalOpen?.("terms") },
  ];

  return (
    <div className="px-5 pt-4 pb-5" style={{ backgroundColor: "#222" }}>

      {/* Brand row: logo + tagline */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <img
          src="/officiallogo.png"
          alt="트렁크룸"
          style={{ height: 22, filter: "brightness(0) invert(1)", opacity: 0.75 }}
        />
        <div>
          <p className="text-[11px] font-bold" style={{ color: "rgba(255,255,255,0.72)", fontFamily: FNT, letterSpacing: "-0.02em" }}>
            내일의 옷장, 트렁크룸
          </p>
          <p className="text-[9px]" style={{ color: FDIM, fontFamily: FNT }}>v{APP_VERSION}</p>
        </div>
      </div>

      {/* Nav links */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3">
        {footerLinks.map(({ label, onPress }) => (
          <button key={label} onClick={onPress}>
            <span className="text-[11px]" style={{ color: FGRAY, fontFamily: FNT }}>{label}</span>
          </button>
        ))}
      </div>

      <div className="border-t mb-3" style={{ borderColor: "rgba(255,255,255,0.09)" }} />

      {/* Contact info — single row */}
      <div className="flex items-center gap-4 mb-3">
        <button onClick={() => openTel(CUSTOMER_SERVICE_PHONE)} className="flex items-center gap-1.5">
          <span className="text-[10px]" style={{ color: FDIM, fontFamily: FNT }}>고객센터</span>
          <span className="text-[11px] font-bold" style={{ color: FLINK, fontFamily: FNT }}>{CUSTOMER_SERVICE_PHONE}</span>
        </button>
        <span style={{ color: "rgba(255,255,255,0.12)", fontSize: 10 }}>|</span>
        <button onClick={() => openMailTo(SUPPORT_EMAIL, "[문의] 트렁크룸")}>
          <span className="text-[11px]" style={{ color: FLINK, fontFamily: FNT }}>{SUPPORT_EMAIL}</span>
        </button>
      </div>

      {/* Company legal — compact three lines, smaller font */}
      <p className="text-[9px] leading-relaxed" style={{ color: FDIM, fontFamily: FNT }}>
        {COMPANY_NAME} · 대표이사 {COMPANY_CEO}<br />
        사업자등록번호 {BUSINESS_NUMBER}<br />
        통신사업자등록번호 {TELECOM_REG_NUMBER}<br />
        {SUPPORT_HOURS}
      </p>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function HomePage({ onProductSelect, onItemTap, onLegalOpen, onGoToRecord }) {
  const [activeDetail,    setActiveDetail]    = useState(null);
  const [weatherOpen,     setWeatherOpen]     = useState(false);
  const [fullList,        setFullList]        = useState(null); // { title, items }
  const [searchOpen,        setSearchOpen]        = useState(false);
  const [favoritesOpen,     setFavoritesOpen]     = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [selectedOutfit,    setSelectedOutfit]    = useState(null);

  function handleOutfitTap(outfitId) {
    const outfit = OUTFIT_DATA.find((o) => o.id === outfitId);
    if (outfit) setSelectedOutfit(outfit);
  }
  const { weather } = useWeather();

  function handleSearchResults(results, scope = "my") {
    setSearchOpen(false);
    const scopeLabel = scope === "public" ? "공개 옷장" : "내 옷장";
    setFullList({
      title: `${scopeLabel} 검색 결과 (${results.length}개)`,
      items: results,
    });
  }

  // ── Notification routing ──────────────────────────────────────────────────
  function handleNotificationAction(notification) {
    setNotificationsOpen(false);

    const { relatedRoute, relatedStyle } = notification;

    // "오래 안 입은 아이템" — items not worn in 1+ year or never worn
    if (relatedRoute === "unworn_list") {
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      const items = CLOSET_ITEMS.filter(
        (i) => !i.lastWornAt || new Date(i.lastWornAt) < cutoff
      );
      setFullList({ title: "오래 안 입은 아이템", items });
      return;
    }

    // "자주 입는 아이템" — sorted by wearCount desc
    if (relatedRoute === "worn_list") {
      const items = [...CLOSET_ITEMS]
        .filter((i) => (i.wearCount ?? 0) > 0)
        .sort((a, b) => (b.wearCount ?? 0) - (a.wearCount ?? 0))
        .slice(0, 20);
      setFullList({ title: "자주 입는 아이템 TOP 20", items });
      return;
    }

    // "판매 연결형" — long-unworn items as resale candidates
    if (relatedRoute === "sell_flow") {
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      const items = CLOSET_ITEMS.filter(
        (i) => !i.lastWornAt || new Date(i.lastWornAt) < cutoff
      );
      setFullList({ title: "판매 추천 아이템", items });
      return;
    }

    // "관리 필요" — items never worn (미착용 + 새상품급)
    if (relatedRoute === "manage_items") {
      const items = CLOSET_ITEMS.filter(
        (i) => (i.wearCount ?? 0) === 0 && !i.lastWornAt
      );
      setFullList({
        title: "관리가 필요한 아이템",
        items: items.length > 0 ? items : CLOSET_ITEMS.slice(0, 12),
      });
      return;
    }

    // "계절 전환" — items that include 봄 season
    if (relatedRoute === "seasonal_items") {
      const items = CLOSET_ITEMS.filter((i) => i.season?.includes("봄"));
      setFullList({ title: "봄 시즌 아이템", items });
      return;
    }

    // "팔로우한 옷장" — show a representative slice
    if (relatedRoute === "closet_view") {
      setFullList({
        title: "팔로우한 옷장 새 아이템",
        items: CLOSET_ITEMS.filter((i) => i.mainCategory === "아우터").slice(0, 15),
      });
      return;
    }

    // "스타일 기반" — filter by relatedStyle tag
    if (relatedRoute === "style_results") {
      const items = relatedStyle
        ? CLOSET_ITEMS.filter((i) => i.styleTags?.includes(relatedStyle))
        : [];
      setFullList({
        title: relatedStyle ? `${relatedStyle} 스타일 아이템` : "추천 아이템",
        items: items.length > 0 ? items : CLOSET_ITEMS.slice(0, 12),
      });
      return;
    }
  }

  return (
    <div className="relative flex flex-col h-full bg-white overflow-hidden">
      {/* Outfit detail overlay (style book taps) */}
      {selectedOutfit && (
        <OutfitDetailScreen outfit={selectedOutfit} onBack={() => setSelectedOutfit(null)} />
      )}

      {/* Detail screen overlay (banner taps) */}
      {activeDetail && (
        <DetailScreen detailKey={activeDetail} onBack={() => setActiveDetail(null)} />
      )}

      {/* Weather detail overlay */}
      {weatherOpen && (
        <WeatherDetailScreen weather={weather} onBack={() => setWeatherOpen(false)} />
      )}

      {/* Full list overlay (더보기 / search results) */}
      {fullList && (
        <FullListScreen
          title={fullList.title}
          items={fullList.items}
          onBack={() => setFullList(null)}
          onItemSelect={onProductSelect}
        />
      )}

      {/* Search / filter overlay */}
      {searchOpen && (
        <SearchFilterScreen
          onClose={() => setSearchOpen(false)}
          onSearch={handleSearchResults}
        />
      )}

      {/* Favorites overlay */}
      {favoritesOpen && (
        <FavoritesScreen onBack={() => setFavoritesOpen(false)} />
      )}

      {/* Notification center overlay */}
      {notificationsOpen && (
        <NotificationCenterScreen
          onBack={() => setNotificationsOpen(false)}
          onAction={handleNotificationAction}
        />
      )}


      <TopBar
        notificationCount={4}
        onSearchTap={() => setSearchOpen(true)}
        onFavoritesOpen={() => setFavoritesOpen(true)}
        onNotificationsOpen={() => setNotificationsOpen(true)}
      />

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>

        {/* ① Brand editorial banners — first impression */}
        <BannerCarousel onBannerTap={(key) => setActiveDetail(key)} />

        {/* ② Today's outfit record — square card, no weather */}
        <TodayRecordCard onRecordToday={onGoToRecord} />

        {/* ③ Weather + outfit recommendation (tap pieces to find closet items) */}
        <WeatherSection
          onExpand={() => setWeatherOpen(true)}
          onItemTap={onProductSelect}
        />

        {/* ④ My closet by category */}
        <Categories
          onMorePress={(data) => setFullList(data)}
          onItemSelect={onProductSelect}
        />

        {/* ⑤ Community — what others wore today / this week */}
        <CommunityTodaySection onItemTap={onItemTap} />

        {/* ⑥ Trending items from others' closets */}
        <div className="py-6 bg-white">
          <SectionHeader en="HOT LISTINGS" ko="남의 옷장 가장 인기있는 아이템" onMore={() => {}} />
          <HorizontalScroll>
            {HOT_LISTINGS.map((item) => <ProductCard key={item.id} item={item} wide onSelect={onProductSelect} />)}
          </HorizontalScroll>
        </div>

        <Footer onLegalOpen={onLegalOpen} />
      </div>
    </div>
  );
}
