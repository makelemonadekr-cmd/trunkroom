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

export function getOutfitRec(temp, conditionCode) {
  if (conditionCode === "rain")
    return { keyword: "레인 프루프 룩",   desc: "비 오는 날엔 방수 소재와 레이어링이 핵심이에요.",        tags: ["방수 재킷", "워터프루프 슈즈", "다크 팔레트"] };
  if (temp <= 4)
    return { keyword: "헤비 레이어드",    desc: "두꺼운 아우터로 온기를 잡아보세요.",                    tags: ["패딩 코트", "울 니트", "머플러"] };
  if (temp <= 8)
    return { keyword: "울 코트 룩",       desc: "롱 코트 하나로 완성되는 시즌리스 스타일.",              tags: ["울 코트", "터틀넥", "앵클 부츠"] };
  if (temp <= 11)
    return { keyword: "트렌치 레이어드",  desc: "트렌치 코트의 계절이에요.",                            tags: ["트렌치코트", "가디건", "스트레이트 데님"] };
  if (temp <= 16)
    return { keyword: "자켓 코디",        desc: "얇은 자켓이나 블레이저 하나면 완성.",                  tags: ["테일러드 자켓", "슬랙스", "로퍼"] };
  if (temp <= 19)
    return { keyword: "라이트 아우터",    desc: "가벼운 아우터 하나로 선선함을 즐겨보세요.",            tags: ["집업 재킷", "롱슬리브 티", "와이드 팬츠"] };
  if (temp <= 22)
    return { keyword: "캐주얼 롱슬리브",  desc: "긴팔 하나로 깔끔하게 완성되는 데일리 룩.",             tags: ["오버핏 롱슬리브", "크롭 팬츠", "스니커즈"] };
  if (temp <= 27)
    return { keyword: "서머 캐주얼",      desc: "통기성 좋은 소재로 시원하게 입어보세요.",              tags: ["린넨 셔츠", "반바지", "샌들"] };
  return   { keyword: "쿨 서머 미니멀",  desc: "최대한 가볍게, 소재로 말하는 여름 코디.",              tags: ["민소매 탑", "린넨 팬츠", "오픈토 슈즈"] };
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
