/**
 * WeatherDetailScreen.jsx
 *
 * Full-screen weather detail + outfit recommendation.
 * Now powered by weatherRecommendation.js for multi-factor rec logic.
 */

import { useState } from "react";
import { CONDITION_META } from "../../hooks/useWeather";
import {
  getWeatherOutfitRec,
  buildWeatherContext,
  getTempBandLabel,
  matchClosetToRec,
} from "../../services/weatherRecommendation";
import LazyImage from "../../components/LazyImage";
import { getClosetItems } from "../../lib/closetStore";
import { unsplashUrl } from "../../lib/imageUtils";

const FONT = "'Spoqa Han Sans Neo', sans-serif";

// ─── Hourly scroll ────────────────────────────────────────────────────────────

function HourlyScroll({ hours }) {
  if (!hours?.length) return null;

  return (
    <div className="mb-5">
      <p className="label-row">시간별 예보</p>
      <div
        className="flex overflow-x-auto px-5 gap-3 pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {hours.map((h, i) => {
          const meta = CONDITION_META[h.condition?.conditionCode] ?? CONDITION_META.clear;
          return (
            <div
              key={i}
              className="flex flex-col items-center shrink-0 rounded-2xl py-3 px-3"
              style={{
                backgroundColor: i === 0 ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
                minWidth: 56,
              }}
            >
              <span
                style={{
                  fontSize:   11,
                  fontFamily: FONT,
                  color:      i === 0 ? "white" : "rgba(255,255,255,0.5)",
                  fontWeight: i === 0 ? 700 : 400,
                  marginBottom: 8,
                  display: "block",
                }}
              >
                {i === 0 ? "지금" : h.label}
              </span>
              <span style={{ fontSize: 20, lineHeight: 1, marginBottom: 8 }}>{meta.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "white", fontFamily: "system-ui" }}>
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
  if (!forecast?.length) return null;

  return (
    <div className="mb-5">
      <p className="label-row">5일 예보</p>
      <div className="mx-5 rounded-2xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
        {forecast.map((day, i) => {
          const meta = CONDITION_META[day.condition?.conditionCode] ?? CONDITION_META.clear;
          return (
            <div
              key={i}
              className="flex items-center px-4 py-3"
              style={{ borderBottom: i < forecast.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}
            >
              <span style={{ fontFamily: FONT, fontSize: 13, color: i === 0 ? "white" : "rgba(255,255,255,0.65)", width: 36, fontWeight: i === 0 ? 700 : 400 }}>
                {day.day}
              </span>
              <span style={{ fontSize: 18, marginRight: 6 }}>{meta.icon}</span>
              <span style={{ fontFamily: FONT, fontSize: 11, color: "rgba(255,255,255,0.45)", flex: 1 }}>
                {day.condition?.label ?? ""}
                {day.rain > 0 && (
                  <span style={{ color: "#7ab8f5", marginLeft: 4 }}>💧{day.rain}mm</span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 13, fontWeight: 700, color: "white", fontFamily: "system-ui" }}>
                  {day.high}°
                </span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", fontFamily: "system-ui" }}>
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

function StatCell({ emoji, label, value, sub }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl py-4"
      style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
    >
      <span style={{ fontSize: 22, marginBottom: 6 }}>{emoji}</span>
      <span style={{ fontFamily: FONT, fontSize: 11, color: "rgba(255,255,255,0.42)", marginBottom: 2 }}>
        {label}
      </span>
      <span style={{ fontFamily: "system-ui", fontSize: 15, fontWeight: 700, color: "white" }}>
        {value}
      </span>
      {sub && (
        <span style={{ fontFamily: FONT, fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>
          {sub}
        </span>
      )}
    </div>
  );
}

// ─── Outfit pieces chips ──────────────────────────────────────────────────────

function PieceChip({ piece, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl shrink-0 transition-all active:opacity-75"
      style={{
        backgroundColor: isSelected ? "rgba(245,194,0,0.22)" : "rgba(255,255,255,0.10)",
        border: isSelected ? "1px solid rgba(245,194,0,0.55)" : "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <span style={{ fontSize: 14 }}>{piece.emoji}</span>
      <span style={{ fontFamily: FONT, fontSize: 12, color: isSelected ? "#F5C200" : "rgba(255,255,255,0.82)", fontWeight: isSelected ? 700 : 500 }}>
        {piece.label}
      </span>
      {isSelected && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 1 }}>
          <path d="M2 5L4 7L8 3" stroke="#F5C200" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
}

// ─── Closet match panel ───────────────────────────────────────────────────────

function ClosetMatchPanel({ piece, items, onClose }) {
  return (
    <div
      className="rounded-2xl overflow-hidden mt-3"
      style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(245,194,0,0.22)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 15 }}>{piece.emoji}</span>
          <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.82)" }}>
            내 옷장 속 {piece.label}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.10)" }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 2L8 8M8 2L2 8" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-1.5">
          <span style={{ fontSize: 26 }}>🔍</span>
          <p style={{ fontFamily: FONT, fontSize: 12, color: "rgba(255,255,255,0.38)", textAlign: "center" }}>
            이 카테고리의 아이템이 없어요
          </p>
          <p style={{ fontFamily: FONT, fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center" }}>
            옷장에 아이템을 추가해보세요
          </p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto px-4 py-3" style={{ scrollbarWidth: "none" }}>
          {items.map((item) => {
            const imgSrc = item.image?.includes("unsplash.com")
              ? unsplashUrl(item.image, 240)
              : item.image;
            return (
              <div key={item.id} className="flex flex-col items-center shrink-0" style={{ width: 72 }}>
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ width: 72, height: 90, backgroundColor: "rgba(255,255,255,0.05)" }}
                >
                  <LazyImage
                    src={imgSrc}
                    alt={item.displayName ?? item.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
                    responsive={item.image?.includes("unsplash.com")}
                  />
                </div>
                <p
                  className="mt-1.5 text-center leading-tight"
                  style={{ fontFamily: FONT, fontSize: 9, color: "rgba(255,255,255,0.55)", width: "100%", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
                >
                  {item.displayName ?? item.name}
                </p>
                {item.color && (
                  <p style={{ fontFamily: FONT, fontSize: 8, color: "rgba(255,255,255,0.28)", marginTop: 1 }}>
                    {item.color}
                  </p>
                )}
              </div>
            );
          })}
          <div className="shrink-0 w-1" />
        </div>
      )}
    </div>
  );
}

// ─── Weather tips row ─────────────────────────────────────────────────────────

function TipsRow({ tips }) {
  if (!tips?.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {tips.map((tip, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
        >
          <span style={{ fontSize: 12 }}>{tip.icon}</span>
          <span style={{ fontFamily: FONT, fontSize: 11, color: "rgba(255,255,255,0.60)" }}>
            {tip.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function WeatherDetailScreen({ weather, onBack }) {
  const [selectedPiece, setSelectedPiece] = useState(null); // piece label string | null

  if (!weather) return null;

  const cond        = CONDITION_META[weather.conditionCode] ?? CONDITION_META.clear;
  const ctx         = buildWeatherContext(weather);
  const outfit      = getWeatherOutfitRec(ctx);
  const closetItems = getClosetItems();
  const matchedMap  = matchClosetToRec(outfit, closetItems); // { [label]: ClosetItem[] }

  function handlePieceTap(piece) {
    setSelectedPiece((prev) => (prev === piece.label ? null : piece.label));
  }

  const BG_GRADIENT = {
    clear:  "linear-gradient(160deg, #1a3a5c 0%, #2d5a8e 40%, #4a8bbf 100%)",
    cloudy: "linear-gradient(160deg, #2c2c3e 0%, #3d3d55 40%, #555570 100%)",
    rain:   "linear-gradient(160deg, #1c2a3a 0%, #243649 40%, #2f4a61 100%)",
    snow:   "linear-gradient(160deg, #1e2a40 0%, #2a3a55 40%, #3a5070 100%)",
    fog:    "linear-gradient(160deg, #2a2a30 0%, #3a3a44 40%, #4a4a56 100%)",
  };
  const bgGradient = BG_GRADIENT[weather.conditionCode] ?? BG_GRADIENT.clear;

  const tempBand = getTempBandLabel(weather.feelsLike ?? weather.temp);

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col overflow-hidden"
      style={{ background: bgGradient }}
    >
      {/* Inline style for label rows */}
      <style>{`
        .label-row {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.38);
          font-family: ${FONT};
          padding: 0 20px 12px;
        }
      `}</style>

      {/* Back button */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-3 pointer-events-none">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 pointer-events-auto active:opacity-70"
          style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            backdropFilter:  "blur(10px)",
            borderRadius:    20,
            padding:         "6px 14px 6px 10px",
            border:          "1px solid rgba(255,255,255,0.18)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: "white" }}>홈</span>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>

        {/* ── Hero ── */}
        <div className="flex flex-col items-center pt-16 pb-8 px-5">
          {/* Location */}
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full mb-4"
            style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1C4.07 1 2.5 2.57 2.5 4.5C2.5 7.25 6 11 6 11C6 11 9.5 7.25 9.5 4.5C9.5 2.57 7.93 1 6 1Z" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" fill="none" />
              <circle cx="6" cy="4.5" r="1.2" fill="rgba(255,255,255,0.7)" />
            </svg>
            <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.75)" }}>
              {weather.location}
            </span>
          </div>

          {/* Temperature */}
          <div className="flex items-start">
            <span style={{ fontSize: 88, fontWeight: 100, color: "white", lineHeight: 1, fontFamily: "system-ui", letterSpacing: "-0.05em" }}>
              {weather.temp}
            </span>
            <span style={{ fontSize: 36, color: "rgba(255,255,255,0.7)", marginTop: 10, fontFamily: "system-ui" }}>°</span>
          </div>

          {/* Condition icon + label */}
          <div className="flex items-center gap-2 mt-1 mb-1">
            <span style={{ fontSize: 28 }}>{cond.icon}</span>
            <span style={{ fontFamily: FONT, fontSize: 17, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>
              {weather.condition}
            </span>
          </div>

          {/* High / low + temp band */}
          <div className="flex items-center gap-3 mt-1">
            <span style={{ fontFamily: FONT, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
              최고 {weather.high}° / 최저 {weather.low}°
            </span>
            <div
              className="px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
            >
              <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.65)" }}>
                {tempBand}
              </span>
            </div>
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div className="grid grid-cols-3 gap-3 mx-5 mb-6">
          <StatCell
            emoji="🌡️"
            label="체감온도"
            value={`${weather.feelsLike}°`}
            sub={outfit.effectiveTemp !== weather.feelsLike ? `실질 ${outfit.effectiveTemp}°` : undefined}
          />
          <StatCell emoji="💧" label="습도" value={`${weather.humidity}%`} />
          <StatCell
            emoji="🍃"
            label="바람"
            value={`${weather.wind}m/s`}
            sub={weather.wind > 5 ? "체감 -1~2°C" : undefined}
          />
        </div>

        {/* ── Hourly ── */}
        <HourlyScroll hours={weather.hours} />

        {/* ── 5-day forecast ── */}
        <ForecastRow forecast={weather.forecast} />

        {/* ── Outfit recommendation ── */}
        <div className="mx-5 mb-8">
          <p className="label-row" style={{ paddingLeft: 0 }}>오늘의 추천 스타일</p>

          {/* Rec card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.10)" }}
          >
            {/* Hero image */}
            <div style={{ position: "relative", height: 180, backgroundColor: "rgba(255,255,255,0.05)" }}>
              <LazyImage
                src={outfit.image}
                alt={outfit.keyword}
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 25%" }}
                priority
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)",
                }}
              />
              {/* Overlay badges */}
              <div style={{ position: "absolute", bottom: 12, left: 14, right: 14, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                <div>
                  <div
                    className="inline-block px-2.5 py-0.5 rounded-sm mb-1.5"
                    style={{ backgroundColor: "rgba(245,194,0,0.18)", border: "1px solid rgba(245,194,0,0.35)" }}
                  >
                    <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: "#F5C200" }}>
                      {outfit.keyword}
                    </span>
                  </div>
                  <p style={{ fontFamily: FONT, fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>
                    {outfit.desc}
                  </p>
                </div>
                <span
                  className="ml-3 shrink-0 px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: "#F5C200", fontFamily: FONT, fontSize: 12, fontWeight: 700, color: "#222" }}
                >
                  {weather.temp}°
                </span>
              </div>
            </div>

            {/* Pieces */}
            <div style={{ backgroundColor: "rgba(255,255,255,0.06)", padding: "14px 14px 10px" }}>
              <div className="flex items-center justify-between mb-2.5">
                <p style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  추천 아이템
                </p>
                <p style={{ fontFamily: FONT, fontSize: 9, color: "rgba(255,255,255,0.28)" }}>
                  탭하면 내 옷장 아이템을 볼 수 있어요
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {outfit.pieces.map((piece, i) => (
                  <PieceChip
                    key={i}
                    piece={piece}
                    isSelected={selectedPiece === piece.label}
                    onClick={() => handlePieceTap(piece)}
                  />
                ))}
              </div>

              {/* Closet match panel */}
              {selectedPiece && (() => {
                const piece = outfit.pieces.find((p) => p.label === selectedPiece);
                const items = matchedMap[selectedPiece] ?? [];
                return piece ? (
                  <ClosetMatchPanel
                    piece={piece}
                    items={items}
                    onClose={() => setSelectedPiece(null)}
                  />
                ) : null;
              })()}

              {/* Tips */}
              <TipsRow tips={outfit.tips} />
            </div>
          </div>
        </div>

        {/* Attribution */}
        <p
          style={{ textAlign: "center", fontSize: 10, paddingBottom: 24, color: "rgba(255,255,255,0.22)", fontFamily: FONT }}
        >
          Open-Meteo · 날씨 정보
        </p>
      </div>
    </div>
  );
}
