/**
 * weatherRecommendation.js
 *
 * Modular, multi-factor weather → outfit recommendation engine.
 *
 * ─── HOW IT WORKS ───────────────────────────────────────────────────────────
 *  getWeatherOutfitRec(weatherCtx) is the primary entry point.
 *  It receives a WeatherContext and returns an OutfitRecommendation.
 *
 *  Factors considered (in order of priority):
 *    1. Precipitation (rain/snow → waterproof outer)
 *    2. Feels-like temperature (more human than raw temp)
 *    3. Wind chill modifier
 *    4. Humidity comfort adjustment
 *    5. Time of day (morning cool-down, evening cooldown)
 *    6. Season calendar (spring/summer/fall/winter)
 *
 * ─── FUTURE AI INTEGRATION ──────────────────────────────────────────────────
 *  Replace `getWeatherOutfitRec` with an async call to your AI endpoint.
 *  The return shape (OutfitRecommendation) must remain stable.
 *  See `src/services/ai/aiService.js` for the AI service layer pattern.
 *
 * ─── ADDING NEW RECOMMENDATION RULES ────────────────────────────────────────
 *  1. Add a new entry to OUTFIT_RULES array below.
 *  2. Implement a `match(ctx)` predicate.
 *  3. The first matching rule wins (most specific first).
 */

import { zoneCoordiImg } from "../lib/localImages";

// ─── Type definitions (JSDoc) ─────────────────────────────────────────────────

/**
 * @typedef {Object} WeatherContext
 * @property {number}  temp          - Current temperature in °C
 * @property {number}  feelsLike     - Feels-like temperature in °C
 * @property {number}  humidity      - Relative humidity 0–100 %
 * @property {number}  wind          - Wind speed in m/s
 * @property {string}  conditionCode - "clear" | "cloudy" | "rain" | "snow" | "fog"
 * @property {number}  [rainMm]      - Today's rain forecast in mm (optional)
 * @property {number}  hour          - Current hour 0–23 (for time-of-day logic)
 * @property {string}  [season]      - "spring" | "summer" | "fall" | "winter" (optional, computed if absent)
 */

/**
 * @typedef {Object} OutfitPiece
 * @property {string}   label    - Human-readable item label (Korean)
 * @property {string}   emoji    - Representative emoji
 * @property {string[]} subcats  - Subcategory names matching mockClosetData SUBCATEGORIES
 * @property {string}   category - Main category: "아우터" | "상의" | "하의" | "신발" | "가방" | "액세서리"
 */

/**
 * @typedef {Object} WeatherTip
 * @property {string} icon  - Emoji icon
 * @property {string} label - Short tip text (Korean)
 */

/**
 * @typedef {Object} OutfitRecommendation
 * @property {string}       keyword      - Style label badge (Korean, short)
 * @property {string}       desc         - Weather-contextual recommendation sentence
 * @property {string}       image        - Curated Unsplash URL
 * @property {OutfitPiece[]} pieces      - Recommended pieces (outer → inner → bottom → shoes → acc)
 * @property {WeatherTip[]}  tips        - 2-3 contextual weather tips
 * @property {string}       tempBand     - Temperature band label for UI (e.g. "영하 강추위")
 * @property {string}       intensity    - "heavy" | "medium" | "light" — layering intensity
 * @property {string}       reason       - Why this recommendation was chosen (for debugging/AI training)
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derive season from current month.
 * @param {number} month - 1-based month (1=Jan)
 * @returns {"spring"|"summer"|"fall"|"winter"}
 */
export function getSeason(month) {
  if (month >= 3  && month <= 5)  return "spring";
  if (month >= 6  && month <= 8)  return "summer";
  if (month >= 9  && month <= 11) return "fall";
  return "winter";
}

/**
 * Compute effective temperature accounting for wind and humidity.
 * Wind chill: -0.5°C per m/s above 5 m/s.
 * Humidity discomfort: +0.5°C per 10% above 70% (only above 22°C).
 *
 * @param {WeatherContext} ctx
 * @returns {number} effectiveTemp
 */
function effectiveTemp(ctx) {
  let t = ctx.feelsLike ?? ctx.temp;
  // Wind chill (only below 22°C)
  if (ctx.wind > 5 && t < 22) {
    t -= (ctx.wind - 5) * 0.5;
  }
  // Humidity discomfort (only above 22°C)
  if (ctx.humidity > 70 && t >= 22) {
    t += ((ctx.humidity - 70) / 10) * 0.5;
  }
  return Math.round(t);
}

/**
 * Time-of-day adjustment: mornings/evenings feel cooler.
 * -2°C for early morning (5–8), -1°C for late evening (20–23).
 *
 * @param {number} hour
 * @param {number} temp
 * @returns {number}
 */
function timeAdjustedTemp(hour, temp) {
  if (hour >= 5  && hour <= 8)  return temp - 2;
  if (hour >= 20 && hour <= 23) return temp - 1;
  return temp;
}

// ─── Weather outfit preview images — weather zone coordi[25-34] ───────────────
const WEATHER_IMGS = {
  snow:        zoneCoordiImg("weather", 0),
  heavyRain:   zoneCoordiImg("weather", 1),
  lightRain:   zoneCoordiImg("weather", 2),
  fog:         zoneCoordiImg("weather", 3),
  veryCold:    zoneCoordiImg("weather", 4),
  chilly:      zoneCoordiImg("weather", 5),
  mild:        zoneCoordiImg("weather", 6),
  comfortable: zoneCoordiImg("weather", 7),
  warm:        zoneCoordiImg("weather", 8),
  hot:         zoneCoordiImg("weather", 9),
};

// ─── Rule definitions ─────────────────────────────────────────────────────────
//
// Each rule: { id, match(ctx, eff), rec }
// `eff` = effective temperature (wind/humidity adjusted, time-of-day shifted)
// Rules are evaluated top-to-bottom; first match wins.
// Most specific rules (precipitation, extreme cold) must come first.

const OUTFIT_RULES = [

  // ── Snow ──────────────────────────────────────────────────────────────────
  {
    id: "snow",
    match: (ctx) => ctx.conditionCode === "snow",
    rec: {
      keyword: "스노우 레이어드",
      desc:    "눈이 내려요. 방수 소재 패딩에 울 니트를 레이어드하고, 방수 부츠로 든든하게 완성해 보세요.",
      image:   WEATHER_IMGS.snow,
      intensity: "heavy",
      tempBand:  "눈 / 방한",
      tips: [
        { icon: "❄️", label: "방수 소재 아우터 필수" },
        { icon: "🧤", label: "장갑·귀마개 추천" },
        { icon: "👢", label: "방수 부츠 착용" },
      ],
      pieces: [
        { label: "패딩 코트",   emoji: "🧥", category: "아우터",   subcats: ["패딩", "다운재킷"] },
        { label: "울 니트",     emoji: "🧶", category: "상의",     subcats: ["니트/스웨터"] },
        { label: "히트텍 이너", emoji: "👕", category: "상의",     subcats: ["긴팔 티셔츠"] },
        { label: "두꺼운 팬츠", emoji: "👖", category: "하의",     subcats: ["슬랙스"] },
        { label: "방수 부츠",   emoji: "👢", category: "신발",     subcats: ["앵클 부츠"] },
        { label: "머플러",      emoji: "🧣", category: "액세서리", subcats: ["스카프"] },
      ],
    },
  },

  // ── Heavy rain ────────────────────────────────────────────────────────────
  {
    id: "heavy-rain",
    match: (ctx) => ctx.conditionCode === "rain" && (ctx.rainMm ?? 0) >= 10,
    rec: {
      keyword: "레인 프루프 룩",
      desc:    "비가 많이 내려요. 방수 트렌치코트를 메인으로 잡고, 어두운 팔레트로 비 오는 날 무드를 완성해 보세요.",
      image:   WEATHER_IMGS.heavyRain,
      intensity: "medium",
      tempBand:  "강우",
      tips: [
        { icon: "🌂", label: "우산 필수" },
        { icon: "🧥", label: "방수 코트 추천" },
        { icon: "👢", label: "방수 신발 추천" },
      ],
      pieces: [
        { label: "트렌치코트",  emoji: "🧥", category: "아우터",   subcats: ["트렌치코트"] },
        { label: "이너 니트",   emoji: "🧶", category: "상의",     subcats: ["니트/스웨터", "긴팔 티셔츠"] },
        { label: "슬랙스",      emoji: "👖", category: "하의",     subcats: ["슬랙스"] },
        { label: "앵클 부츠",   emoji: "👢", category: "신발",     subcats: ["앵클 부츠"] },
        { label: "숄더백",      emoji: "👜", category: "가방",     subcats: ["숄더백", "크로스백"] },
      ],
    },
  },

  // ── Light rain / drizzle ──────────────────────────────────────────────────
  {
    id: "light-rain",
    match: (ctx) => ctx.conditionCode === "rain",
    rec: {
      keyword: "라이트 레인 룩",
      desc:    "가벼운 비가 예보돼 있어요. 방수 아우터로 가볍게 레이어드하고 다크 팔레트를 선택해 보세요.",
      image:   WEATHER_IMGS.lightRain,
      intensity: "medium",
      tempBand:  "가랑비",
      tips: [
        { icon: "☂️", label: "간편 우산 챙기기" },
        { icon: "🧥", label: "방수 경량 아우터 추천" },
      ],
      pieces: [
        { label: "경량 트렌치", emoji: "🧥", category: "아우터",   subcats: ["트렌치코트", "점퍼"] },
        { label: "긴팔 탑",     emoji: "👕", category: "상의",     subcats: ["긴팔 티셔츠", "블라우스"] },
        { label: "슬랙스",      emoji: "👖", category: "하의",     subcats: ["슬랙스", "청바지"] },
        { label: "앵클 부츠",   emoji: "👢", category: "신발",     subcats: ["앵클 부츠", "로퍼"] },
        { label: "크로스백",    emoji: "👜", category: "가방",     subcats: ["크로스백", "숄더백"] },
      ],
    },
  },

  // ── Fog ───────────────────────────────────────────────────────────────────
  {
    id: "fog",
    match: (ctx) => ctx.conditionCode === "fog",
    rec: {
      keyword: "미스트 무드",
      desc:    "안개 낀 날이에요. 레이어링으로 체온을 유지하고, 차분한 뉴트럴 톤으로 안개 무드를 즐겨보세요.",
      image:   WEATHER_IMGS.fog,
      intensity: "medium",
      tempBand:  "안개",
      tips: [
        { icon: "🌫️", label: "시야 주의" },
        { icon: "🧥", label: "레이어드 필수" },
      ],
      pieces: [
        { label: "라이트 코트",  emoji: "🧥", category: "아우터",   subcats: ["울 코트", "트렌치코트"] },
        { label: "긴팔 탑",      emoji: "👕", category: "상의",     subcats: ["긴팔 티셔츠", "니트/스웨터"] },
        { label: "슬랙스",       emoji: "👖", category: "하의",     subcats: ["슬랙스"] },
        { label: "로퍼",         emoji: "👟", category: "신발",     subcats: ["로퍼"] },
      ],
    },
  },

  // ── Extreme cold ≤ 0°C ───────────────────────────────────────────────────
  {
    id: "extreme-cold",
    match: (_ctx, eff) => eff <= 0,
    rec: {
      keyword: "헤비 방한 룩",
      desc:    "영하권이에요. 롱 다운패딩으로 최대한 보온하고, 히트텍 이너를 꼭 챙겨보세요.",
      image:   WEATHER_IMGS.snow,
      intensity: "heavy",
      tempBand:  "영하 강추위",
      tips: [
        { icon: "🧤", label: "장갑·귀마개·머플러 필수" },
        { icon: "🧥", label: "롱 패딩 추천" },
        { icon: "🔥", label: "히트텍 이너 필수" },
      ],
      pieces: [
        { label: "롱 패딩",      emoji: "🧥", category: "아우터",   subcats: ["패딩", "다운재킷"] },
        { label: "울 니트",      emoji: "🧶", category: "상의",     subcats: ["니트/스웨터"] },
        { label: "히트텍",       emoji: "👕", category: "상의",     subcats: ["긴팔 티셔츠"] },
        { label: "기모 슬랙스",  emoji: "👖", category: "하의",     subcats: ["슬랙스"] },
        { label: "롱 부츠",      emoji: "👢", category: "신발",     subcats: ["앵클 부츠"] },
        { label: "머플러",       emoji: "🧣", category: "액세서리", subcats: ["스카프"] },
        { label: "모자",         emoji: "🧢", category: "액세서리", subcats: ["모자"] },
      ],
    },
  },

  // ── Very cold 1–5°C ──────────────────────────────────────────────────────
  {
    id: "very-cold",
    match: (_ctx, eff) => eff <= 5,
    rec: {
      keyword: "울 코트 레이어드",
      desc:    "꽤 추운 날이에요. 두꺼운 울 코트에 터틀넥을 더하면 타임리스한 겨울 스타일이 완성돼요.",
      image:   WEATHER_IMGS.veryCold,
      intensity: "heavy",
      tempBand:  "추위",
      tips: [
        { icon: "🧥", label: "두꺼운 코트 필수" },
        { icon: "🧤", label: "장갑 챙기기" },
      ],
      pieces: [
        { label: "울 롱 코트",   emoji: "🧥", category: "아우터",   subcats: ["울 코트", "오버핏코트"] },
        { label: "터틀넥",       emoji: "🧶", category: "상의",     subcats: ["니트/스웨터", "긴팔 티셔츠"] },
        { label: "슬랙스",       emoji: "👖", category: "하의",     subcats: ["슬랙스"] },
        { label: "앵클 부츠",    emoji: "👢", category: "신발",     subcats: ["앵클 부츠"] },
        { label: "숄더백",       emoji: "👜", category: "가방",     subcats: ["숄더백"] },
        { label: "머플러",       emoji: "🧣", category: "액세서리", subcats: ["스카프"] },
      ],
    },
  },

  // ── Cold 6–10°C ──────────────────────────────────────────────────────────
  {
    id: "cold",
    match: (_ctx, eff) => eff <= 10,
    rec: {
      keyword: "트렌치 레이어드",
      desc:    "일교차가 있는 쌀쌀한 날이에요. 트렌치코트 안에 가디건을 더해 든든하게 레이어드해 보세요.",
      image:   WEATHER_IMGS.lightRain,
      intensity: "medium",
      tempBand:  "쌀쌀함",
      tips: [
        { icon: "🧥", label: "레이어링 추천" },
        { icon: "🌬️", label: `바람 ${0}m/s — 체감 더 쌀쌀` },
      ],
      pieces: [
        { label: "트렌치코트",      emoji: "🧥", category: "아우터",   subcats: ["트렌치코트"] },
        { label: "가디건",          emoji: "🧶", category: "상의",     subcats: ["가디건"] },
        { label: "스트레이트 데님", emoji: "👖", category: "하의",     subcats: ["청바지"] },
        { label: "로퍼",            emoji: "👟", category: "신발",     subcats: ["로퍼"] },
        { label: "크로스백",        emoji: "👜", category: "가방",     subcats: ["크로스백", "숄더백"] },
      ],
    },
  },

  // ── Chilly 11–15°C ───────────────────────────────────────────────────────
  {
    id: "chilly",
    match: (_ctx, eff) => eff <= 15,
    rec: {
      keyword: "블레이저 스타일",
      desc:    "가을 바람이 살랑이는 날이에요. 테일러드 블레이저에 슬랙스를 매치하면 센스 있는 스타일이 완성돼요.",
      image:   WEATHER_IMGS.chilly,
      intensity: "medium",
      tempBand:  "선선함",
      tips: [
        { icon: "🧥", label: "블레이저 하나로 충분" },
        { icon: "👗", label: "레이어링 선택 사항" },
      ],
      pieces: [
        { label: "블레이저",   emoji: "🧥", category: "아우터",   subcats: ["블레이저"] },
        { label: "셔츠",       emoji: "👔", category: "상의",     subcats: ["셔츠", "블라우스"] },
        { label: "슬랙스",     emoji: "👖", category: "하의",     subcats: ["슬랙스"] },
        { label: "로퍼",       emoji: "👟", category: "신발",     subcats: ["로퍼"] },
        { label: "미니 백",    emoji: "👜", category: "가방",     subcats: ["미니백", "숄더백"] },
      ],
    },
  },

  // ── Mild 16–19°C ─────────────────────────────────────────────────────────
  {
    id: "mild",
    match: (_ctx, eff) => eff <= 19,
    rec: {
      keyword: "라이트 아우터",
      desc:    "가볍게 걸치기 좋은 날씨예요. 경량 집업이나 가디건으로 포인트 레이어링을 시도해 보세요.",
      image:   WEATHER_IMGS.mild,
      intensity: "light",
      tempBand:  "포근함",
      tips: [
        { icon: "🌤️", label: "야외 활동 최적 날씨" },
        { icon: "🧥", label: "저녁엔 가벼운 아우터 추천" },
      ],
      pieces: [
        { label: "집업 재킷",   emoji: "🧥", category: "아우터",   subcats: ["점퍼", "후리스"] },
        { label: "긴팔 탑",     emoji: "👕", category: "상의",     subcats: ["긴팔 티셔츠", "맨투맨"] },
        { label: "와이드 팬츠", emoji: "👖", category: "하의",     subcats: ["와이드팬츠", "슬랙스"] },
        { label: "스니커즈",    emoji: "👟", category: "신발",     subcats: ["스니커즈"] },
        { label: "크로스백",    emoji: "👜", category: "가방",     subcats: ["크로스백"] },
      ],
    },
  },

  // ── Comfortable 20–22°C ──────────────────────────────────────────────────
  {
    id: "comfortable",
    match: (_ctx, eff) => eff <= 22,
    rec: {
      keyword: "캐주얼 데일리",
      desc:    "긴팔 하나로 딱 좋을 쾌적한 날씨예요. 오버핏 맨투맨에 간결한 팬츠로 데일리 룩을 완성해 보세요.",
      image:   WEATHER_IMGS.comfortable,
      intensity: "light",
      tempBand:  "쾌적함",
      tips: [
        { icon: "☀️", label: "야외 활동 최적 날씨" },
      ],
      pieces: [
        { label: "오버핏 맨투맨", emoji: "👕", category: "상의",     subcats: ["맨투맨", "긴팔 티셔츠"] },
        { label: "스트레이트 팬츠", emoji: "👖", category: "하의",   subcats: ["청바지", "슬랙스"] },
        { label: "스니커즈",       emoji: "👟", category: "신발",    subcats: ["스니커즈"] },
        { label: "에코백",         emoji: "👜", category: "가방",    subcats: ["에코백", "토트백"] },
      ],
    },
  },

  // ── Warm 23–27°C ─────────────────────────────────────────────────────────
  {
    id: "warm",
    match: (_ctx, eff) => eff <= 27,
    rec: {
      keyword: "서머 캐주얼",
      desc:    "더위가 느껴지는 날이에요. 통기성 좋은 린넨 소재로 시원하고 여유롭게 입어보세요.",
      image:   WEATHER_IMGS.warm,
      intensity: "light",
      tempBand:  "더움",
      tips: [
        { icon: "🌞", label: "자외선 차단 필수" },
        { icon: "💧", label: "수분 보충 챙기기" },
      ],
      pieces: [
        { label: "린넨 셔츠",  emoji: "👔", category: "상의",     subcats: ["셔츠", "블라우스"] },
        { label: "반바지",     emoji: "🩳", category: "하의",     subcats: ["반바지", "미니스커트"] },
        { label: "샌들",       emoji: "🩴", category: "신발",     subcats: ["샌들", "뮬"] },
        { label: "에코백",     emoji: "👜", category: "가방",     subcats: ["에코백", "토트백"] },
        { label: "선글라스",   emoji: "🕶️", category: "액세서리", subcats: ["선글라스"] },
      ],
    },
  },

  // ── Hot > 27°C ───────────────────────────────────────────────────────────
  {
    id: "hot",
    match: () => true, // fallthrough — catches everything above 27°C
    rec: {
      keyword: "쿨 서머 미니멀",
      desc:    "무더운 날씨예요. 민소매 탑과 린넨 팬츠로 최대한 가볍고 시원하게 입어보세요.",
      image:   WEATHER_IMGS.hot,
      intensity: "light",
      tempBand:  "폭염",
      tips: [
        { icon: "🌡️", label: "자외선 지수 매우 높음" },
        { icon: "💧", label: "수분 보충 자주 챙기기" },
        { icon: "🎩", label: "챙 넓은 모자 추천" },
      ],
      pieces: [
        { label: "민소매 탑",    emoji: "👗", category: "상의",     subcats: ["탱크탑", "크롭탑"] },
        { label: "린넨 와이드",  emoji: "👖", category: "하의",     subcats: ["와이드팬츠", "미니스커트"] },
        { label: "오픈토 슈즈",  emoji: "🩴", category: "신발",     subcats: ["샌들", "뮬", "스포츠 샌들"] },
        { label: "토트백",       emoji: "👜", category: "가방",     subcats: ["토트백", "에코백"] },
        { label: "선글라스",     emoji: "🕶️", category: "액세서리", subcats: ["선글라스"] },
      ],
    },
  },
];

// ─── Main recommendation function ────────────────────────────────────────────

/**
 * Get an outfit recommendation based on current weather context.
 *
 * @param {WeatherContext} ctx
 * @returns {OutfitRecommendation}
 */
export function getWeatherOutfitRec(ctx) {
  const safe = {
    temp:          ctx?.temp          ?? 20,
    feelsLike:     ctx?.feelsLike     ?? ctx?.temp ?? 20,
    humidity:      ctx?.humidity      ?? 50,
    wind:          ctx?.wind          ?? 0,
    conditionCode: ctx?.conditionCode ?? "clear",
    rainMm:        ctx?.rainMm        ?? 0,
    hour:          ctx?.hour          ?? new Date().getHours(),
  };

  const eff = timeAdjustedTemp(safe.hour, effectiveTemp(safe));

  const rule = OUTFIT_RULES.find((r) => r.match(safe, eff));
  if (!rule) {
    // Should never happen (last rule is a catch-all), but guard anyway
    return OUTFIT_RULES[OUTFIT_RULES.length - 1].rec;
  }

  // Inject dynamic tip values (e.g. wind speed)
  const rec = { ...rule.rec, reason: rule.id, effectiveTemp: eff };
  rec.tips = rec.tips.map((tip) =>
    tip.label.includes("${0}") ? { ...tip, label: tip.label.replace("${0}", safe.wind) } : tip
  );

  return rec;
}

/**
 * Build a WeatherContext from a useWeather() result.
 * Handles missing fields gracefully.
 *
 * @param {object} weather - from useWeather() hook
 * @returns {WeatherContext}
 */
export function buildWeatherContext(weather) {
  if (!weather) return null;
  const now = new Date();
  return {
    temp:          weather.temp,
    feelsLike:     weather.feelsLike,
    humidity:      weather.humidity,
    wind:          weather.wind,
    conditionCode: weather.conditionCode,
    rainMm:        weather.forecast?.[0]?.rain ?? 0,
    hour:          now.getHours(),
    season:        getSeason(now.getMonth() + 1),
  };
}

/**
 * Get a temperature band label without computing a full recommendation.
 * Useful for quick UI labels.
 *
 * @param {number} feelsLike
 * @returns {string}
 */
export function getTempBandLabel(feelsLike) {
  if (feelsLike <= 0)  return "영하 강추위";
  if (feelsLike <= 5)  return "추위";
  if (feelsLike <= 10) return "쌀쌀함";
  if (feelsLike <= 15) return "선선함";
  if (feelsLike <= 19) return "포근함";
  if (feelsLike <= 22) return "쾌적함";
  if (feelsLike <= 27) return "더움";
  return "폭염";
}

/**
 * Get contextual layering advice string.
 *
 * @param {"heavy"|"medium"|"light"} intensity
 * @returns {string}
 */
export function getLayeringAdvice(intensity) {
  const map = {
    heavy:  "두꺼운 레이어링 — 3단계 이상",
    medium: "가벼운 레이어링 — 2단계",
    light:  "단품 착장 가능",
  };
  return map[intensity] ?? "";
}

// ─── Closet-based recommendation ─────────────────────────────────────────────

/**
 * Filter user's closet items that match the recommended outfit pieces.
 * Returns a map of { category: ClosetItem[] }.
 *
 * @param {OutfitRecommendation} rec
 * @param {ClosetItem[]} closetItems
 * @returns {Record<string, ClosetItem[]>}
 */
export function matchClosetToRec(rec, closetItems) {
  const result = {};
  for (const piece of rec.pieces) {
    const matches = closetItems.filter(
      (item) =>
        piece.subcats.includes(item.subCategory) ||
        piece.subcats.includes(item.subcategory)
    );
    if (matches.length > 0) {
      result[piece.label] = matches.slice(0, 3); // up to 3 matches per piece
    }
  }
  return result;
}
