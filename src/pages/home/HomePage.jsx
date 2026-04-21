import { useState, useEffect, useRef, useCallback } from "react";
import TopBar from "../../components/TopBar";
import ProductFilterSheet from "../../components/ProductFilterSheet";
import StyleBookFilterSheet from "../../components/StyleBookFilterSheet";

// ─── Mock weather data ────────────────────────────────────────────────────────
// Replace MOCK_WEATHER with a real API call later.
// Recommended: https://api.openweathermap.org/data/2.5/weather?q=Seoul&appid=KEY&units=metric
const MOCK_WEATHER = {
  location: "서울",
  temp: 18,
  feelsLike: 16,
  condition: "맑음",
  conditionCode: "clear",
  high: 22,
  low: 12,
  humidity: 48,
  wind: 3.2,
};

function getOutfitRec(temp, conditionCode) {
  if (conditionCode === "rain") return { keyword: "레인 프루프 룩", desc: "비 오는 날엔 방수 소재와 레이어링이 핵심이에요.", tags: ["방수 재킷", "워터프루프 슈즈", "다크 팔레트"] };
  if (temp <= 4)  return { keyword: "헤비 레이어드",    desc: "두꺼운 아우터로 온기를 잡아보세요.",          tags: ["패딩 코트", "울 니트", "머플러"] };
  if (temp <= 8)  return { keyword: "울 코트 룩",       desc: "롱 코트 하나로 완성되는 시즌리스 스타일.",    tags: ["울 코트", "터틀넥", "앵클 부츠"] };
  if (temp <= 11) return { keyword: "트렌치 레이어드",  desc: "트렌치 코트의 계절이에요.",                  tags: ["트렌치코트", "가디건", "스트레이트 데님"] };
  if (temp <= 16) return { keyword: "자켓 코디",        desc: "얇은 자켓이나 블레이저 하나면 완성.",        tags: ["테일러드 자켓", "슬랙스", "로퍼"] };
  if (temp <= 19) return { keyword: "라이트 아우터",    desc: "가벼운 아우터 하나로 선선함을 즐겨보세요.", tags: ["집업 재킷", "롱슬리브 티", "와이드 팬츠"] };
  if (temp <= 22) return { keyword: "캐주얼 롱슬리브",  desc: "긴팔 하나로 깔끔하게 완성되는 데일리 룩.",   tags: ["오버핏 롱슬리브", "크롭 팬츠", "스니커즈"] };
  if (temp <= 27) return { keyword: "서머 캐주얼",      desc: "통기성 좋은 소재로 시원하게 입어보세요.",    tags: ["린넨 셔츠", "반바지", "샌들"] };
  return                  { keyword: "쿨 서머 미니멀",  desc: "최대한 가볍게, 소재로 말하는 여름 코디.",    tags: ["민소매 탑", "린넨 팬츠", "오픈토 슈즈"] };
}

const CONDITION_META = {
  clear:  { bg: "#FFF8E7", icon: "☀️", label: "맑음" },
  cloudy: { bg: "#F0F2F5", icon: "⛅",  label: "흐림" },
  rain:   { bg: "#EEF3FA", icon: "🌧️",  label: "비"   },
  snow:   { bg: "#F0F4FF", icon: "❄️",  label: "눈"   },
  fog:    { bg: "#F4F4F4", icon: "🌫️",  label: "안개" },
};

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

// ─── Weather section ──────────────────────────────────────────────────────────

function WeatherSection() {
  const weather = MOCK_WEATHER;
  const outfit  = getOutfitRec(weather.temp, weather.conditionCode);
  const cond    = CONDITION_META[weather.conditionCode] || CONDITION_META.clear;

  return (
    <div className="py-6 bg-white">
      <div className="flex items-end justify-between px-6 mb-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.12em] uppercase" style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
            TODAY'S WEATHER
          </p>
          <h2 className="text-[17px] font-bold leading-tight" style={{ color: "#222", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
            오늘의 날씨 & 추천 코디
          </h2>
        </div>
        <span className="text-[11px]" style={{ color: "#BBBBBB", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>{weather.location}</span>
      </div>

      {/* Weather card */}
      <div className="mx-6 rounded-2xl overflow-hidden mb-4" style={{ backgroundColor: cond.bg }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <div className="flex items-end gap-1">
              <span className="text-[48px] font-thin leading-none" style={{ color: "#222", fontFamily: "system-ui, sans-serif", letterSpacing: "-0.04em" }}>{weather.temp}</span>
              <span className="text-[20px] mb-2" style={{ color: "#555" }}>°</span>
            </div>
            <p className="text-[13px] font-medium mt-0.5" style={{ color: "#555", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>{cond.label}</p>
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
        </div>
      </div>

      {/* Outfit recommendation */}
      <div className="mx-6 rounded-2xl px-5 py-5" style={{ backgroundColor: "#313439" }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: "rgba(255,255,255,0.38)", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>STYLE PICK</p>
            <h3 className="text-[16px] font-bold text-white mt-0.5 leading-tight" style={{ fontFamily: "'Spoqa Han Sans Neo', sans-serif", letterSpacing: "-0.02em" }}>오늘의 추천 코디</h3>
          </div>
          <span className="text-[13px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#F5C200", color: "#222", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>{weather.temp}°</span>
        </div>
        <div className="inline-block px-3 py-1 rounded-sm mb-3" style={{ backgroundColor: "rgba(245,194,0,0.14)", border: "1px solid rgba(245,194,0,0.28)" }}>
          <span className="text-[12px] font-bold" style={{ color: "#F5C200", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>{outfit.keyword}</span>
        </div>
        <p className="text-[13px] leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.62)", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>{outfit.desc}</p>
        <div className="flex flex-wrap gap-2">
          {outfit.tags.map((tag) => (
            <span key={tag} className="text-[11px] px-3 py-1.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.72)", fontFamily: "'Spoqa Han Sans Neo', sans-serif", border: "1px solid rgba(255,255,255,0.11)" }}>{tag}</span>
          ))}
        </div>
      </div>
    </div>
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

// ─── Product data with real clothing images (Unsplash CDN) ───────────────────
// These are sample fashion images for prototype use.
// Replace each `image` URL with your actual product photo URLs when going live.

const NEW_LISTINGS = [
  {
    id: 1,
    brand: "MUSINSA STANDARD",
    name: "오버핏 코튼 셔츠",
    price: "28,000",
    condition: "S급",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&q=75&fit=crop",
    fallback: "#E8D5C4",
  },
  {
    id: 2,
    brand: "ZARA",
    name: "와이드 데님 팬츠",
    price: "45,000",
    condition: "A급",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=300&q=75&fit=crop",
    fallback: "#C4D4E8",
  },
  {
    id: 3,
    brand: "COS",
    name: "리넨 블렌드 재킷",
    price: "62,000",
    condition: "S급",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&q=75&fit=crop",
    fallback: "#D4E8C4",
  },
  {
    id: 4,
    brand: "ALAND",
    name: "니트 가디건",
    price: "35,000",
    condition: "B급",
    image: "https://images.unsplash.com/photo-1583744946564-b52d5a0ebe68?w=300&q=75&fit=crop",
    fallback: "#E8C4D4",
  },
  {
    id: 5,
    brand: "H&M",
    name: "슬림 트라우저",
    price: "19,000",
    condition: "A급",
    image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=300&q=75&fit=crop",
    fallback: "#E8E4C4",
  },
  {
    id: 6,
    brand: "UNIQLO",
    name: "메리노 울 니트",
    price: "41,000",
    condition: "S급",
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300&q=75&fit=crop",
    fallback: "#D4C4E8",
  },
];

const HOT_LISTINGS = [
  {
    id: 7,
    brand: "MAJE",
    name: "플로럴 미디 드레스",
    price: "89,000",
    condition: "S급",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=75&fit=crop",
    fallback: "#F2E0D0",
  },
  {
    id: 8,
    brand: "SANDRO",
    name: "실크 브이넥 블라우스",
    price: "115,000",
    condition: "S급",
    image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=300&q=75&fit=crop",
    fallback: "#E8DCF0",
  },
  {
    id: 9,
    brand: "COS",
    name: "와이드 리넨 팬츠",
    price: "62,000",
    condition: "A급",
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&q=75&fit=crop",
    fallback: "#D4E0EC",
  },
  {
    id: 10,
    brand: "& OTHER STORIES",
    name: "리브드 니트 카디건",
    price: "74,000",
    condition: "A급",
    image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=300&q=75&fit=crop",
    fallback: "#F0E8D4",
  },
  {
    id: 11,
    brand: "ARKET",
    name: "플리츠 미니스커트",
    price: "48,000",
    condition: "S급",
    image: "https://images.unsplash.com/photo-1548549557-dbe9946621da?w=300&q=75&fit=crop",
    fallback: "#E8F0D4",
  },
  {
    id: 12,
    brand: "TOTEME",
    name: "오버핏 트렌치코트",
    price: "198,000",
    condition: "S급",
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=300&q=75&fit=crop",
    fallback: "#E0D8D0",
  },
];

const CATEGORIES = [
  { id: 1, label: "상의",     emoji: "👕" },
  { id: 2, label: "하의",     emoji: "👖" },
  { id: 3, label: "아우터",   emoji: "🧥" },
  { id: 4, label: "원피스",   emoji: "👗" },
  { id: 5, label: "신발",     emoji: "👟" },
  { id: 6, label: "가방",     emoji: "👜" },
  { id: 7, label: "액세서리", emoji: "💍" },
  { id: 8, label: "스포츠",   emoji: "🎽" },
];

const CAT_SUBS = {
  상의:     ["반팔 티셔츠", "긴팔 티셔츠", "셔츠/블라우스", "니트/스웨터", "후드티"],
  하의:     ["데님 팬츠", "슬랙스", "미니스커트", "미디스커트", "조거팬츠"],
  아우터:   ["트렌치코트", "패딩", "블레이저", "코트", "가디건"],
  원피스:   ["미니 원피스", "미디 원피스", "맥시 원피스", "점프수트", "니트 원피스"],
  신발:     ["스니커즈", "로퍼", "힐/펌프스", "부츠", "샌들"],
  가방:     ["숄더백", "크로스백", "토트백", "클러치", "백팩"],
  액세서리: ["목걸이", "귀걸이", "반지", "선글라스", "벨트"],
  스포츠:   ["레깅스", "스포츠 브라", "트레이닝 팬츠", "윈드브레이커", "운동화"],
};

const STYLE_BOOKS = [
  {
    id: 1, title: "City Minimal",  count: 24, color: "#1C1C1E",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&q=80&fit=crop",
    tags: ["미니멀", "모노톤", "데일리"],
  },
  {
    id: 2, title: "Vintage Vibes", count: 18, color: "#6B5040",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&q=80&fit=crop",
    tags: ["빈티지", "레트로", "웜톤"],
  },
  {
    id: 3, title: "Street Core",   count: 31, color: "#1A2A3A",
    image: "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=300&q=80&fit=crop",
    tags: ["스트릿", "오버핏", "캐주얼"],
  },
  {
    id: 4, title: "Clean Fit",     count: 15, color: "#3A3A3A",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300&q=80&fit=crop",
    tags: ["클린", "베이직", "오피스"],
  },
  {
    id: 5, title: "Feminine",      count: 22, color: "#7A3040",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=80&fit=crop",
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
  const [liked,    setLiked]    = useState(false);
  const [imgError, setImgError] = useState(false);
  const w = wide ? 163 : 148;
  const h = wide ? 210 : 190;

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
          /* Fallback color block if image fails */
          <div className="absolute inset-0 flex items-center justify-center opacity-25">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="8" width="24" height="18" rx="2" stroke="#666" strokeWidth="1.5" />
              <circle cx="16" cy="17" r="5" stroke="#666" strokeWidth="1.5" />
              <path d="M12 8V6C12 5.45 12.45 5 13 5H19C19.55 5 20 5.45 20 6V8" stroke="#666" strokeWidth="1.5" />
            </svg>
          </div>
        )}
        {/* Subtle image scrim so badges read cleanly */}
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

        {/* Like */}
        <button className="absolute bottom-2 right-2" onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 17L3 10C2.17 9.17 2 8.04 2 7C2 4.79 3.79 3 6 3C7.32 3 8.52 3.65 9.38 4.62L10 5.3L10.62 4.62C11.48 3.65 12.68 3 14 3C16.21 3 18 4.79 18 7C18 8.04 17.83 9.17 17 10L10 17Z"
              fill={liked ? "#E84040" : "none"}
              stroke={liked ? "#E84040" : "rgba(255,255,255,0.85)"}
              strokeWidth="1.4"
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

function Categories() {
  const [selected, setSelected] = useState(null);
  const [activeSub, setActiveSub] = useState(null);

  function handleCatClick(cat) {
    if (selected === cat.label) {
      setSelected(null);
      setActiveSub(null);
    } else {
      setSelected(cat.label);
      setActiveSub(CAT_SUBS[cat.label]?.[0] ?? null);
    }
  }

  const subs = selected ? CAT_SUBS[selected] : null;

  return (
    <div className="py-6 bg-white">
      <SectionHeader en="CATEGORIES" ko="내 옷장 속 카테고리" />
      <div className="grid grid-cols-4 gap-3 px-6">
        {CATEGORIES.map((cat) => {
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

      {/* Sub-category tags */}
      {subs && (
        <div className="mt-4 px-5">
          <div
            className="p-3 rounded-2xl"
            style={{ backgroundColor: "#F8F8F8" }}
          >
            <p className="text-[10px] font-bold tracking-widest uppercase mb-2.5 px-1" style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
              {selected} 세부 카테고리
            </p>
            <div className="flex flex-wrap gap-2">
              {subs.map((sub) => {
                const isSubActive = activeSub === sub;
                return (
                  <button
                    key={sub}
                    onClick={() => setActiveSub(sub)}
                    className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
                    style={{
                      backgroundColor: isSubActive ? "#1a1a1a" : "white",
                      color: isSubActive ? "white" : "#555",
                      fontFamily: "'Spoqa Han Sans Neo', sans-serif",
                      border: isSubActive ? "1.5px solid #1a1a1a" : "1.5px solid #E8E8E8",
                    }}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StyleBook({ onFilterOpen }) {
  return (
    <div className="py-6" style={{ backgroundColor: "#F5F5F5" }}>
      <SectionHeader en="STYLE BOOK" ko="인기 스타일 속 아이템" onMore={onFilterOpen} />
      <HorizontalScroll>
        {STYLE_BOOKS.map((book) => (
          <div
            key={book.id}
            className="shrink-0 rounded-2xl overflow-hidden mr-3 relative"
            style={{ width: 150, height: 210, backgroundColor: book.color, scrollSnapAlign: "start" }}
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
          </div>
        ))}
      </HorizontalScroll>
    </div>
  );
}

function Footer() {
  return (
    <div className="px-6 py-8" style={{ backgroundColor: "#222" }}>
      <img src="/officiallogo.png" alt="Trunk room" style={{ height: 28, filter: "brightness(0) invert(1)", opacity: 0.85, marginBottom: 20 }} />
      <div className="flex flex-wrap gap-5 mb-5">
        {["회사소개", "제휴문의", "개인정보취급방침", "이용약관"].map((item) => (
          <button key={item}>
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.38)", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>{item}</span>
          </button>
        ))}
      </div>
      <div className="border-t mb-5" style={{ borderColor: "rgba(255,255,255,0.09)" }} />
      <div className="flex gap-8 mb-5">
        <div>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.38)", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>고객센터</p>
          <p className="text-[13px] font-bold mt-1" style={{ color: "rgba(255,255,255,0.82)", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>1800-8474</p>
        </div>
        <div>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.38)", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>이메일</p>
          <p className="text-[12px] font-medium mt-1" style={{ color: "rgba(255,255,255,0.62)", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>hello@trunkroom.co.kr</p>
        </div>
      </div>
      <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.28)", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
        (주)메이크레모네이드 · 대표이사 홍길동<br />
        사업자등록번호 000-00-00000<br />
        상담 운영시간 10:00–17:00 (주말 및 공휴일 휴무)
      </p>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function HomePage({ onProductSelect }) {
  const [activeDetail,    setActiveDetail]    = useState(null);
  const [filterSheet,     setFilterSheet]     = useState(null); // null | "product" | "stylebook"

  return (
    <div className="relative flex flex-col h-full bg-white overflow-hidden">
      {/* Detail screen overlay */}
      {activeDetail && (
        <DetailScreen detailKey={activeDetail} onBack={() => setActiveDetail(null)} />
      )}

      {/* Filter overlays */}
      {filterSheet === "product" && (
        <ProductFilterSheet onClose={() => setFilterSheet(null)} onApply={() => {}} />
      )}
      {filterSheet === "stylebook" && (
        <StyleBookFilterSheet onClose={() => setFilterSheet(null)} onApply={() => {}} />
      )}

      <TopBar notificationCount={4} onFilter={() => setFilterSheet("product")} />

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>

        {/* Carousel — 2 banners */}
        <BannerCarousel onBannerTap={(key) => setActiveDetail(key)} />

        {/* NEW LISTINGS */}
        <div className="py-6 bg-white">
          <SectionHeader en="NEW LISTINGS" ko="새로 등록된 아이템" onMore={() => {}} />
          <HorizontalScroll>
            {NEW_LISTINGS.map((item) => <ProductCard key={item.id} item={item} onSelect={onProductSelect} />)}
          </HorizontalScroll>
        </div>

        {/* Weather + Outfit */}
        <WeatherSection />

        {/* Categories */}
        <Categories />

        {/* Style Book */}
        <StyleBook onFilterOpen={() => setFilterSheet("stylebook")} />

        {/* HOT LISTINGS */}
        <div className="py-6 bg-white">
          <SectionHeader en="HOT LISTINGS" ko="가장 인기 있는 아이템" onMore={() => {}} />
          <HorizontalScroll>
            {HOT_LISTINGS.map((item) => <ProductCard key={item.id} item={item} wide onSelect={onProductSelect} />)}
          </HorizontalScroll>
        </div>

        <Footer />
      </div>
    </div>
  );
}
