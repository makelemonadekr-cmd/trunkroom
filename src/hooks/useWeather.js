/**
 * useWeather — Real weather data via Open-Meteo (free, no API key required).
 *
 * ─── HOW TO SWAP PROVIDERS LATER ───────────────────────────────────────────
 *  1. Replace `fetchFromOpenMeteo` with your own function.
 *  2. Return an object matching the shape described in `buildWeatherObject`.
 *  3. If you need an API key, add it as:
 *       export const WEATHER_API_KEY = "YOUR_KEY_HERE";
 *     then use it inside your fetch function.
 *
 * ─── TO CHANGE THE FALLBACK CITY ───────────────────────────────────────────
 *  Edit FALLBACK_LOCATION below.
 * ───────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from "react";

// ── Configuration ─────────────────────────────────────────────────────────────

export const WEATHER_PROVIDER = "Open-Meteo (api.open-meteo.com — no API key)";

// Used when geolocation is denied or unavailable.
// Replace with any lat/lon + Korean city name.
export const FALLBACK_LOCATION = {
  lat:  37.5665,
  lon:  126.9780,
  name: "서울",
};

// ── WMO weather code decoder ──────────────────────────────────────────────────

export function decodeWMO(code) {
  if (code === 0)        return { label: "맑음",       conditionCode: "clear"  };
  if (code <= 2)         return { label: "대체로 맑음", conditionCode: "clear"  };
  if (code === 3)        return { label: "흐림",        conditionCode: "cloudy" };
  if (code <= 48)        return { label: "안개",        conditionCode: "fog"    };
  if (code <= 55)        return { label: "이슬비",      conditionCode: "rain"   };
  if (code <= 65)        return { label: "비",          conditionCode: "rain"   };
  if (code <= 77)        return { label: "눈",          conditionCode: "snow"   };
  if (code <= 82)        return { label: "소나기",      conditionCode: "rain"   };
  return                        { label: "뇌우",        conditionCode: "rain"   };
}

// ── Condition visual metadata ─────────────────────────────────────────────────

export const CONDITION_META = {
  clear:  { bg: "#FFF8E7", icon: "☀️"  },
  cloudy: { bg: "#F0F2F5", icon: "⛅"   },
  rain:   { bg: "#EEF3FA", icon: "🌧️"  },
  snow:   { bg: "#F0F4FF", icon: "❄️"  },
  fog:    { bg: "#F4F4F4", icon: "🌫️"  },
};

// ── Outfit recommendation ─────────────────────────────────────────────────────
//
// Each record includes:
//   keyword    — short style label shown as a badge
//   desc       — weather-aware, fashion-natural recommendation sentence
//   image      — curated editorial Unsplash image matching the look
//   pieces     — tappable outfit pieces: { label, emoji, subcats[] }
//                subcats must match subcategory names in mockClosetData.js
//
export function getOutfitRec(temp, conditionCode) {
  if (conditionCode === "rain")
    return {
      keyword: "레인 프루프 룩",
      desc: "오늘은 비가 내려요. 방수 소재 아우터로 레이어드하고 다크 팔레트로 비 오는 날 무드를 완성해 보세요.",
      image: "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=500&q=85&fit=crop",
      pieces: [
        { label: "트렌치코트", emoji: "🧥", subcats: ["트렌치코트"] },
        { label: "슬랙스",    emoji: "👖", subcats: ["슬랙스"] },
        { label: "앵클 부츠", emoji: "👢", subcats: ["앵클 부츠"] },
        { label: "숄더백",    emoji: "👜", subcats: ["숄더백", "크로스백"] },
      ],
    };
  if (temp <= 4)
    return {
      keyword: "헤비 레이어드",
      desc: `체감 온도가 매우 낮아요. 두꺼운 패딩이나 롱 다운으로 든든하게 레이어드하고, 울 니트로 체온을 잡아보세요.`,
      image: "https://images.unsplash.com/photo-1512036666432-2181c1f26420?w=500&q=85&fit=crop",
      pieces: [
        { label: "패딩",      emoji: "🧥", subcats: ["패딩", "다운재킷"] },
        { label: "울 니트",   emoji: "🧶", subcats: ["니트/스웨터"] },
        { label: "슬랙스",    emoji: "👖", subcats: ["슬랙스", "청바지"] },
        { label: "앵클 부츠", emoji: "👢", subcats: ["앵클 부츠"] },
      ],
    };
  if (temp <= 8)
    return {
      keyword: "울 코트 룩",
      desc: "꽤 쌀쌀한 날이에요. 롱 울 코트에 터틀넥을 더하면 타임리스한 겨울 코디가 완성돼요. 앵클 부츠로 마무리하면 완벽해요.",
      image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=500&q=85&fit=crop",
      pieces: [
        { label: "울 코트",   emoji: "🧥", subcats: ["울 코트", "오버핏코트"] },
        { label: "터틀넥",    emoji: "👕", subcats: ["긴팔 티셔츠", "니트/스웨터"] },
        { label: "슬랙스",    emoji: "👖", subcats: ["슬랙스"] },
        { label: "앵클 부츠", emoji: "👢", subcats: ["앵클 부츠"] },
      ],
    };
  if (temp <= 11)
    return {
      keyword: "트렌치 레이어드",
      desc: "일교차가 있는 선선한 날이에요. 트렌치코트로 가볍게 레이어드하기 딱 좋아요. 가디건과 스트레이트 데님으로 완성해 보세요.",
      image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&q=85&fit=crop",
      pieces: [
        { label: "트렌치코트",     emoji: "🧥", subcats: ["트렌치코트"] },
        { label: "가디건",         emoji: "🧶", subcats: ["가디건"] },
        { label: "스트레이트 데님", emoji: "👖", subcats: ["청바지"] },
        { label: "로퍼",           emoji: "👟", subcats: ["로퍼"] },
      ],
    };
  if (temp <= 16)
    return {
      keyword: "블레이저 코디",
      desc: "가을 바람이 살랑이는 날이에요. 테일러드 블레이저에 슬랙스를 매치하면 센스 있는 코디가 완성돼요.",
      image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&q=85&fit=crop",
      pieces: [
        { label: "블레이저", emoji: "🧥", subcats: ["블레이저"] },
        { label: "슬랙스",  emoji: "👖", subcats: ["슬랙스"] },
        { label: "셔츠",    emoji: "👔", subcats: ["셔츠"] },
        { label: "로퍼",    emoji: "👟", subcats: ["로퍼"] },
      ],
    };
  if (temp <= 19)
    return {
      keyword: "라이트 아우터",
      desc: "선선한 바람이 느껴지는 날이에요. 가벼운 집업이나 가디건으로 레이어드하고, 와이드 팬츠로 여유 있게 완성해 보세요.",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&q=85&fit=crop",
      pieces: [
        { label: "집업 재킷",  emoji: "🧥", subcats: ["점퍼", "후드티"] },
        { label: "긴팔",       emoji: "👕", subcats: ["긴팔 티셔츠", "맨투맨"] },
        { label: "와이드 팬츠", emoji: "👖", subcats: ["와이드팬츠"] },
        { label: "스니커즈",   emoji: "👟", subcats: ["스니커즈"] },
      ],
    };
  if (temp <= 22)
    return {
      keyword: "캐주얼 롱슬리브",
      desc: "긴팔 하나로 딱 좋을 쾌적한 날씨예요. 오버핏 맨투맨에 깔끔한 팬츠를 더해 간결한 데일리 룩을 완성해 보세요.",
      image: "https://images.unsplash.com/photo-1556906781-9a412961a28d?w=500&q=85&fit=crop",
      pieces: [
        { label: "오버핏 긴팔", emoji: "👕", subcats: ["긴팔 티셔츠", "맨투맨"] },
        { label: "크롭 팬츠",  emoji: "👖", subcats: ["청바지", "슬랙스"] },
        { label: "스니커즈",   emoji: "👟", subcats: ["스니커즈"] },
      ],
    };
  if (temp <= 27)
    return {
      keyword: "서머 캐주얼",
      desc: "더위가 느껴지는 날이에요. 통기성 좋은 린넨 소재로 시원하고 여유롭게 입어보세요. 샌들로 가볍게 마무리해요.",
      image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=500&q=85&fit=crop",
      pieces: [
        { label: "린넨 셔츠",  emoji: "👔", subcats: ["셔츠", "블라우스"] },
        { label: "반바지",     emoji: "🩳", subcats: ["반바지", "미니스커트"] },
        { label: "샌들",       emoji: "🩴", subcats: ["샌들", "뮬"] },
        { label: "에코백",     emoji: "👜", subcats: ["에코백", "토트백"] },
      ],
    };
  return {
    keyword: "쿨 서머 미니멀",
    desc: "무더운 날씨예요. 최대한 가볍게, 민소매 탑과 린넨 팬츠로 시원한 미니멀 서머 룩을 완성해 보세요.",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=85&fit=crop",
    pieces: [
      { label: "민소매 탑",   emoji: "👗", subcats: ["탱크탑", "크롭탑"] },
      { label: "린넨 팬츠",  emoji: "👖", subcats: ["와이드팬츠"] },
      { label: "오픈토 슈즈", emoji: "🩴", subcats: ["샌들", "뮬", "스포츠 샌들"] },
      { label: "미니 원피스", emoji: "👗", subcats: ["미니 원피스", "캐주얼 원피스"] },
    ],
  };
}

// ── Open-Meteo fetcher (replace this function to swap providers) ──────────────

async function fetchFromOpenMeteo(lat, lon, locationName) {
  const params = new URLSearchParams({
    latitude:      lat,
    longitude:     lon,
    current:       "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code",
    hourly:        "temperature_2m,weather_code",
    daily:         "temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum",
    timezone:      "auto",
    forecast_days: 5,
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error("Open-Meteo fetch failed");
  const raw = await res.json();

  const c    = raw.current;
  const cond = decodeWMO(c.weather_code);
  const now  = new Date();

  // ── Hourly (next 12 slots from now) ──
  const hIdx = raw.hourly.time.findIndex(t => new Date(t) >= now);
  const safeHIdx = hIdx === -1 ? 0 : hIdx;
  const hours = raw.hourly.time.slice(safeHIdx, safeHIdx + 12).map((t, i) => ({
    label:     `${new Date(t).getHours()}시`,
    temp:      Math.round(raw.hourly.temperature_2m[safeHIdx + i]),
    condition: decodeWMO(raw.hourly.weather_code[safeHIdx + i]),
  }));

  // ── 5-day forecast ──
  const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];
  const forecast = raw.daily.time.map((date, i) => ({
    day:       i === 0 ? "오늘" : DAY_KO[new Date(date).getDay()],
    high:      Math.round(raw.daily.temperature_2m_max[i]),
    low:       Math.round(raw.daily.temperature_2m_min[i]),
    condition: decodeWMO(raw.daily.weather_code[i]),
    rain:      Math.round(raw.daily.precipitation_sum[i] ?? 0),
  }));

  return {
    location:      locationName,
    temp:          Math.round(c.temperature_2m),
    feelsLike:     Math.round(c.apparent_temperature),
    humidity:      Math.round(c.relative_humidity_2m),
    wind:          Math.round(c.wind_speed_10m * 10) / 10,
    conditionCode: cond.conditionCode,
    condition:     cond.label,
    high:          forecast[0]?.high,
    low:           forecast[0]?.low,
    hours,
    forecast,
    fetchedAt:     new Date(),
  };
}

// ── Reverse geocode lat/lon → Korean city name ────────────────────────────────

async function reverseGeocode(lat, lon) {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ko`,
      { headers: { "User-Agent": "TrunkRoom-App/1.0" } }
    );
    const data = await res.json();
    return (
      data.address?.city   ||
      data.address?.town   ||
      data.address?.county ||
      data.address?.state  ||
      "현재 위치"
    );
  } catch {
    return "현재 위치";
  }
}

// ── Main hook ─────────────────────────────────────────────────────────────────

export function useWeather() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLive,  setIsLive]  = useState(false); // false until real API responds

  useEffect(() => {
    let active = true;

    async function load(lat, lon, name) {
      try {
        const data = await fetchFromOpenMeteo(lat, lon, name);
        if (active) { setWeather(data); setIsLive(true); setLoading(false); }
      } catch {
        if (active) setLoading(false); // show skeleton / mock
      }
    }

    // 1. Immediately load fallback (Seoul or configured city)
    load(FALLBACK_LOCATION.lat, FALLBACK_LOCATION.lon, FALLBACK_LOCATION.name);

    // 2. Try to upgrade to user's actual location
    navigator.geolocation?.getCurrentPosition(
      async ({ coords }) => {
        const name = await reverseGeocode(coords.latitude, coords.longitude);
        load(coords.latitude, coords.longitude, name);
      },
      () => { /* permission denied — fallback already loading */ },
      { timeout: 6000, maximumAge: 300_000 }
    );

    return () => { active = false; };
  }, []);

  return { weather, loading, isLive };
}
