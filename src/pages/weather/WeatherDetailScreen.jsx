import { CONDITION_META, getOutfitRec } from "../../hooks/useWeather";

// ─── Hourly scroll ────────────────────────────────────────────────────────────

function HourlyScroll({ hours, conditionCode }) {
  if (!hours || hours.length === 0) return null;

  return (
    <div className="mb-5">
      <p
        className="text-[11px] font-bold tracking-[0.14em] uppercase mb-3 px-5"
        style={{ color: "rgba(255,255,255,0.38)", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
      >
        시간별 예보
      </p>
      <div
        className="flex overflow-x-auto px-5 gap-3"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {hours.map((h, i) => {
          const meta = CONDITION_META[h.condition?.conditionCode] || CONDITION_META.clear;
          return (
            <div
              key={i}
              className="flex flex-col items-center shrink-0 rounded-2xl py-3 px-3"
              style={{
                backgroundColor:
                  i === 0
                    ? "rgba(255,255,255,0.18)"
                    : "rgba(255,255,255,0.08)",
                minWidth: 54,
              }}
            >
              <span
                className="text-[11px] mb-2"
                style={{
                  color: i === 0 ? "white" : "rgba(255,255,255,0.5)",
                  fontFamily: "'Spoqa Han Sans Neo', sans-serif",
                  fontWeight: i === 0 ? 700 : 400,
                }}
              >
                {i === 0 ? "지금" : h.label}
              </span>
              <span style={{ fontSize: 20, lineHeight: 1, marginBottom: 8 }}>{meta.icon}</span>
              <span
                className="text-[13px] font-bold"
                style={{ color: "white", fontFamily: "system-ui, sans-serif" }}
              >
                {h.temp}°
              </span>
            </div>
          );
        })}
        <div className="shrink-0 w-1" />
      </div>
    </div>
  );
}

// ─── 5-day forecast ───────────────────────────────────────────────────────────

function ForecastRow({ forecast }) {
  if (!forecast || forecast.length === 0) return null;

  return (
    <div className="mb-5">
      <p
        className="text-[11px] font-bold tracking-[0.14em] uppercase mb-3 px-5"
        style={{ color: "rgba(255,255,255,0.38)", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
      >
        5일 예보
      </p>
      <div
        className="mx-5 rounded-2xl overflow-hidden"
        style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
      >
        {forecast.map((day, i) => {
          const meta = CONDITION_META[day.condition?.conditionCode] || CONDITION_META.clear;
          const isToday = i === 0;
          return (
            <div
              key={i}
              className="flex items-center px-4 py-3"
              style={{
                borderBottom:
                  i < forecast.length - 1
                    ? "1px solid rgba(255,255,255,0.07)"
                    : "none",
              }}
            >
              {/* Day label */}
              <span
                className="text-[13px] font-medium"
                style={{
                  color: isToday ? "white" : "rgba(255,255,255,0.65)",
                  fontFamily: "'Spoqa Han Sans Neo', sans-serif",
                  width: 36,
                  fontWeight: isToday ? 700 : 400,
                }}
              >
                {day.day}
              </span>
              {/* Weather icon */}
              <span style={{ fontSize: 18, marginRight: 6 }}>{meta.icon}</span>
              {/* Condition label */}
              <span
                className="text-[11px] flex-1"
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontFamily: "'Spoqa Han Sans Neo', sans-serif",
                }}
              >
                {day.condition?.label || ""}
                {day.rain > 0 && (
                  <span style={{ color: "#7ab8f5", marginLeft: 4 }}>
                    💧{day.rain}mm
                  </span>
                )}
              </span>
              {/* High / Low */}
              <div className="flex items-center gap-2">
                <span
                  className="text-[13px] font-bold"
                  style={{ color: "white", fontFamily: "system-ui, sans-serif" }}
                >
                  {day.high}°
                </span>
                <span
                  className="text-[12px]"
                  style={{
                    color: "rgba(255,255,255,0.38)",
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  / {day.low}°
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Stats grid ───────────────────────────────────────────────────────────────

function StatCell({ emoji, label, value }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl py-4"
      style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
    >
      <span style={{ fontSize: 22, marginBottom: 6 }}>{emoji}</span>
      <span
        className="text-[11px] mb-1"
        style={{
          color: "rgba(255,255,255,0.42)",
          fontFamily: "'Spoqa Han Sans Neo', sans-serif",
        }}
      >
        {label}
      </span>
      <span
        className="text-[15px] font-bold"
        style={{ color: "white", fontFamily: "system-ui, sans-serif" }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function WeatherDetailScreen({ weather, onBack }) {
  if (!weather) return null;

  const cond   = CONDITION_META[weather.conditionCode] || CONDITION_META.clear;
  const outfit = getOutfitRec(weather.temp, weather.conditionCode);

  // Dynamic gradient based on condition
  const BG_GRADIENT = {
    clear:  "linear-gradient(160deg, #1a3a5c 0%, #2d5a8e 40%, #4a8bbf 100%)",
    cloudy: "linear-gradient(160deg, #2c2c3e 0%, #3d3d55 40%, #555570 100%)",
    rain:   "linear-gradient(160deg, #1c2a3a 0%, #243649 40%, #2f4a61 100%)",
    snow:   "linear-gradient(160deg, #1e2a40 0%, #2a3a55 40%, #3a5070 100%)",
    fog:    "linear-gradient(160deg, #2a2a30 0%, #3a3a44 40%, #4a4a56 100%)",
  };
  const bgGradient = BG_GRADIENT[weather.conditionCode] || BG_GRADIENT.clear;

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col overflow-hidden"
      style={{ background: bgGradient }}
    >
      {/* Back button */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-3 pointer-events-none">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 pointer-events-auto"
          style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(10px)",
            borderRadius: 20,
            padding: "6px 14px 6px 10px",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M11 4L6 9L11 14"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            className="text-[13px] font-medium text-white"
            style={{ fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            홈
          </span>
        </button>
      </div>

      {/* Scrollable content */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* ── Hero section ── */}
        <div className="flex flex-col items-center pt-16 pb-8 px-5">
          {/* Location */}
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full mb-4"
            style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 1C4.07 1 2.5 2.57 2.5 4.5C2.5 7.25 6 11 6 11C6 11 9.5 7.25 9.5 4.5C9.5 2.57 7.93 1 6 1Z"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="1.2"
                fill="none"
              />
              <circle cx="6" cy="4.5" r="1.2" fill="rgba(255,255,255,0.7)" />
            </svg>
            <span
              className="text-[12px] font-medium"
              style={{
                color: "rgba(255,255,255,0.75)",
                fontFamily: "'Spoqa Han Sans Neo', sans-serif",
              }}
            >
              {weather.location}
            </span>
          </div>

          {/* Big temp */}
          <div className="flex items-start">
            <span
              style={{
                fontSize: 88,
                fontWeight: 100,
                color: "white",
                lineHeight: 1,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "-0.05em",
              }}
            >
              {weather.temp}
            </span>
            <span
              style={{
                fontSize: 36,
                color: "rgba(255,255,255,0.7)",
                marginTop: 10,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              °
            </span>
          </div>

          {/* Weather icon + label */}
          <div className="flex items-center gap-2 mt-1 mb-1">
            <span style={{ fontSize: 28 }}>{cond.icon}</span>
            <span
              className="text-[17px] font-medium"
              style={{
                color: "rgba(255,255,255,0.85)",
                fontFamily: "'Spoqa Han Sans Neo', sans-serif",
              }}
            >
              {weather.condition}
            </span>
          </div>

          {/* High / Low */}
          <div className="flex items-center gap-3 mt-1">
            <span
              className="text-[14px]"
              style={{
                color: "rgba(255,255,255,0.6)",
                fontFamily: "'Spoqa Han Sans Neo', sans-serif",
              }}
            >
              최고 {weather.high}° / 최저 {weather.low}°
            </span>
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div className="grid grid-cols-3 gap-3 mx-5 mb-5">
          <StatCell emoji="🌡️" label="체감" value={`${weather.feelsLike}°`} />
          <StatCell emoji="💧" label="습도" value={`${weather.humidity}%`} />
          <StatCell emoji="🍃" label="바람" value={`${weather.wind}m/s`} />
        </div>

        {/* ── Hourly forecast ── */}
        <HourlyScroll hours={weather.hours} conditionCode={weather.conditionCode} />

        {/* ── 5-day forecast ── */}
        <ForecastRow forecast={weather.forecast} />

        {/* ── Outfit recommendation ── */}
        <div className="mx-5 mb-8">
          <p
            className="text-[11px] font-bold tracking-[0.14em] uppercase mb-3"
            style={{
              color: "rgba(255,255,255,0.38)",
              fontFamily: "'Spoqa Han Sans Neo', sans-serif",
            }}
          >
            오늘의 추천 코디
          </p>
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div
                  className="inline-block px-2.5 py-1 rounded-sm mb-2"
                  style={{
                    backgroundColor: "rgba(245,194,0,0.14)",
                    border: "1px solid rgba(245,194,0,0.3)",
                  }}
                >
                  <span
                    className="text-[12px] font-bold"
                    style={{
                      color: "#F5C200",
                      fontFamily: "'Spoqa Han Sans Neo', sans-serif",
                    }}
                  >
                    {outfit.keyword}
                  </span>
                </div>
                <p
                  className="text-[13px] leading-relaxed"
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    fontFamily: "'Spoqa Han Sans Neo', sans-serif",
                  }}
                >
                  {outfit.desc}
                </p>
              </div>
              <span
                className="text-[13px] font-bold px-2.5 py-1 rounded-full shrink-0 ml-3"
                style={{
                  backgroundColor: "#F5C200",
                  color: "#222",
                  fontFamily: "'Spoqa Han Sans Neo', sans-serif",
                }}
              >
                {weather.temp}°
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {outfit.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-3 py-1.5 rounded-full"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.07)",
                    color: "rgba(255,255,255,0.72)",
                    fontFamily: "'Spoqa Han Sans Neo', sans-serif",
                    border: "1px solid rgba(255,255,255,0.11)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Attribution */}
        <p
          className="text-center text-[10px] pb-6"
          style={{
            color: "rgba(255,255,255,0.22)",
            fontFamily: "'Spoqa Han Sans Neo', sans-serif",
          }}
        >
          Open-Meteo · 날씨 정보
        </p>
      </div>
    </div>
  );
}
