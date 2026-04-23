/**
 * StyleRecordFlow — Photo-first daily style recording wizard.
 *
 * Steps:  photo → analyzing → matching → draft → done
 *
 * Props:
 *   dateStr        YYYY-MM-DD to record for (defaults to today)
 *   existingRecord If editing an existing record, pass it here
 *   onSave(dateStr, record)  Called after quick save
 *   onClose()               Called when user dismisses
 *   onOpenStylebook(itemIds, photoUrl, dateStr)  CTA from done screen
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { CLOSET_ITEMS } from "../constants/mockClosetData";
import { useWeather }   from "../hooks/useWeather";
import { getTempPref }  from "../services/weatherRecommendation";

const FONT    = "'Spoqa Han Sans Neo', sans-serif";
const DARK    = "#1a1a1a";
const YELLOW  = "#F5C200";
const DIVIDER = "#F0F0F0";

// ─── Mood options (shared with RecordPage) ─────────────────────────────────────

const MOOD_OPTIONS = [
  { id: "casual",  label: "캐주얼",  emoji: "😎", bg: "#F5F5F5",  fg: "#555" },
  { id: "minimal", label: "미니멀",  emoji: "⬜", bg: "#1a1a1a",  fg: "white" },
  { id: "chic",    label: "시크",    emoji: "💎", bg: "#6B3A5E",  fg: "white" },
  { id: "comfy",   label: "편안함",  emoji: "🌿", bg: "#E8F5E9",  fg: "#2E7D32" },
  { id: "date",    label: "데이트",  emoji: "🌹", bg: "#FDE8E8",  fg: "#C62828" },
  { id: "office",  label: "오피스",  emoji: "💼", bg: "#E8EEF8",  fg: "#1A3A7A" },
  { id: "sporty",  label: "스포티",  emoji: "⚡", bg: "#FFF8E1",  fg: "#F57F17" },
  { id: "vintage", label: "빈티지",  emoji: "📷", bg: "#F5ECD8",  fg: "#7A5C1E" },
];

const TEMPLATES = [
  { id: "daily",     label: "빠른 기록",  emoji: "⚡", desc: "착용 아이템만 빠르게 기록해요"          },
  { id: "stylebook", label: "스타일북",   emoji: "📖", desc: "무드와 스타일을 자세히 남겨요"           },
  { id: "insight",   label: "인사이트",   emoji: "📊", desc: "날씨·착장 데이터를 분석해요"             },
];

// ─── Simulate AI analysis ─────────────────────────────────────────────────────
// Groups CLOSET_ITEMS by category and returns 3 candidates per category.
// In production this would be a real CV/AI call.

const MATCH_CATEGORIES = [
  { id: "상의",   emoji: "👕", label: "상의"   },
  { id: "하의",   emoji: "👖", label: "하의"   },
  { id: "아우터", emoji: "🧥", label: "아우터" },
  { id: "신발",   emoji: "👟", label: "신발"   },
];

function simulateAnalysis() {
  return MATCH_CATEGORIES.map((cat) => {
    const pool = CLOSET_ITEMS.filter((i) => i.mainCategory === cat.id);
    if (pool.length === 0) return null;
    // Shuffle deterministically using a simple hash
    const shuffled = [...pool].sort((a, b) =>
      (a.id.charCodeAt(a.id.length - 1) * 17) % 13 - (b.id.charCodeAt(b.id.length - 1) * 17) % 13
    );
    const suggestions = shuffled.slice(0, 3);
    return {
      categoryId:    cat.id,
      emoji:         cat.emoji,
      label:         cat.label,
      suggestions,
      status:        "pending",   // "confirmed" | "skipped" | "new"
      confirmedItem: suggestions[0] ?? null,
      activeSuggestionIdx: 0,
    };
  }).filter(Boolean);
}

// ─── CloseButton ──────────────────────────────────────────────────────────────

function CloseBtn({ onClose, light = false }) {
  return (
    <button
      onClick={onClose}
      className="w-9 h-9 flex items-center justify-center rounded-full active:opacity-70"
      style={{ backgroundColor: light ? "rgba(255,255,255,0.18)" : "#F2F2F2", backdropFilter: light ? "blur(12px)" : "none" }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 2L12 12M12 2L2 12" stroke={light ? "white" : DARK} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  );
}

// ─── STEP 1: Photo picker ──────────────────────────────────────────────────────

function PhotoStep({ onPhotoChosen, onClose }) {
  const [source,  setSource]  = useState(null);  // "camera" | "gallery"
  const fileInputRef          = useRef(null);

  // Trigger file input after source is chosen (300ms delay for animation)
  useEffect(() => {
    if (!source) return;
    const t = setTimeout(() => fileInputRef.current?.click(), 300);
    return () => clearTimeout(t);
  }, [source]);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) { setSource(null); return; }
    const reader = new FileReader();
    reader.onload = (ev) => onPhotoChosen(ev.target.result);
    reader.readAsDataURL(file);
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white">

      {/* Header */}
      <div className="flex items-center justify-between px-5 shrink-0" style={{ height: 52 }}>
        <CloseBtn onClose={onClose} />
        <h2 className="text-[16px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>
          오늘의 착장 기록
        </h2>
        <div style={{ width: 36 }} />
      </div>

      {/* Hero illustration */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        {/* Visual placeholder */}
        <div
          className="rounded-3xl flex items-center justify-center"
          style={{
            width: 200, height: 240,
            background: "linear-gradient(145deg, #FEFCE8 0%, #FFF8D6 100%)",
            border: "2px dashed #EDD83A",
          }}
        >
          <div className="flex flex-col items-center gap-3">
            <span style={{ fontSize: 56 }}>📸</span>
            <p className="text-[12px] font-bold text-center" style={{ color: "#A07800", fontFamily: FONT }}>
              오늘 착장 사진을<br />올려주세요
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[14px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.015em" }}>
            사진 한 장으로 시작해요
          </p>
          <p className="text-[12px] mt-1" style={{ color: "#888", fontFamily: FONT, lineHeight: 1.6 }}>
            전신 착장 사진을 올리면<br />AI가 아이템을 자동으로 찾아줄게요
          </p>
        </div>
      </div>

      {/* CTA buttons */}
      <div className="px-5 pb-8 flex flex-col gap-3 shrink-0">
        <button
          onClick={() => setSource("camera")}
          className="w-full flex items-center justify-center gap-3 rounded-2xl font-bold active:opacity-80 transition-opacity"
          style={{ height: 56, backgroundColor: YELLOW, color: DARK, fontFamily: FONT, fontSize: 15 }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="5" width="16" height="12" rx="2.5" stroke={DARK} strokeWidth="1.6" />
            <circle cx="10" cy="11" r="3.2" stroke={DARK} strokeWidth="1.6" />
            <path d="M7 5L8.5 2.5H11.5L13 5" stroke={DARK} strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          사진 촬영하기
        </button>

        <button
          onClick={() => setSource("gallery")}
          className="w-full flex items-center justify-center gap-3 rounded-2xl font-bold active:opacity-80 transition-opacity"
          style={{ height: 56, backgroundColor: "#F5F5F5", color: DARK, fontFamily: FONT, fontSize: 15 }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="2" width="16" height="16" rx="3" stroke={DARK} strokeWidth="1.6" />
            <circle cx="7" cy="7" r="1.5" stroke={DARK} strokeWidth="1.4" />
            <path d="M2 13L6.5 9L9.5 12L13 8.5L18 13" stroke={DARK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          갤러리에서 불러오기
        </button>

        <button
          onClick={() => onPhotoChosen(null)}
          className="w-full text-center py-2 active:opacity-60"
          style={{ color: "#AAAAAA", fontFamily: FONT, fontSize: 13 }}
        >
          사진 없이 기록하기
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture={source === "camera" ? "environment" : undefined}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

// ─── STEP 2: Analyzing ────────────────────────────────────────────────────────

function AnalyzingStep({ photoUrl, onDone }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar over 2.4 seconds, then advance
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return 100;
        return p + 4;
      });
    }, 80);
    const timer = setTimeout(onDone, 2500);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, []); // eslint-disable-line

  const labels = ["착장 인식 중…", "아이템 분류 중…", "내 옷장과 비교 중…", "거의 다 됐어요!"];
  const labelIdx = Math.min(Math.floor(progress / 25), labels.length - 1);

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-black">
      {/* Photo background */}
      {photoUrl ? (
        <img
          src={photoUrl}
          alt="outfit"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }}
        />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(145deg,#1a1a1a,#2d2d2d)" }} />
      )}

      {/* Dark scrim */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 60%)" }} />

      {/* Scanning line animation */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            left: 0, right: 0,
            height: 2,
            background: "linear-gradient(90deg, transparent 0%, #F5C200 30%, #FFE266 50%, #F5C200 70%, transparent 100%)",
            top: `${(progress / 100) * 85}%`,
            transition: "top 0.08s linear",
            opacity: 0.7,
            boxShadow: "0 0 12px 4px rgba(245,194,0,0.35)",
          }}
        />
      </div>

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 px-6 pb-12 flex flex-col items-center gap-4">
        {/* Spinner */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(245,194,0,0.18)", border: "1.5px solid rgba(245,194,0,0.4)" }}
        >
          <span style={{ fontSize: 26, animation: "spin 1.5s linear infinite" }}>✨</span>
        </div>

        <div className="text-center">
          <p className="text-[16px] font-bold text-white" style={{ fontFamily: FONT, letterSpacing: "-0.02em" }}>
            AI가 착장을 분석하고 있어요
          </p>
          <p className="text-[12px] mt-1" style={{ color: "rgba(255,255,255,0.5)", fontFamily: FONT }}>
            {labels[labelIdx]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full rounded-full overflow-hidden" style={{ height: 4, backgroundColor: "rgba(255,255,255,0.12)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: YELLOW, transition: "width 0.08s linear" }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── STEP 3: Item matching ─────────────────────────────────────────────────────

function CategoryPickerSheet({ categoryId, onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const items = useMemo(() => {
    const pool = CLOSET_ITEMS.filter((i) => i.mainCategory === categoryId);
    if (!query.trim()) return pool;
    const q = query.toLowerCase();
    return pool.filter((i) =>
      (i.displayName ?? i.name).toLowerCase().includes(q) || (i.brand ?? "").toLowerCase().includes(q)
    );
  }, [categoryId, query]);

  return (
    <div
      className="absolute inset-0 z-[70] flex items-end"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full rounded-t-3xl flex flex-col bg-white"
        style={{ maxHeight: "78%" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "#DDD" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0">
          <p className="text-[15px] font-bold" style={{ color: DARK, fontFamily: FONT }}>다른 {categoryId} 선택</p>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ backgroundColor: "#F2F2F2" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2L10 10M10 2L2 10" stroke={DARK} strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3 shrink-0">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="아이템 이름으로 검색"
            className="w-full px-4 py-2.5 rounded-xl text-[13px] outline-none"
            style={{ backgroundColor: "#F5F5F5", color: DARK, fontFamily: FONT }}
          />
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-5 pb-4" style={{ scrollbarWidth: "none" }}>
          {items.length === 0 ? (
            <p className="text-center py-8 text-[13px]" style={{ color: "#CCC", fontFamily: FONT }}>아이템이 없어요</p>
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="relative rounded-xl overflow-hidden active:opacity-80"
                  style={{ aspectRatio: "3/4", backgroundColor: "#F5F5F5" }}
                >
                  {item.image && (
                    <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
                  )}
                  <div
                    className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5 pt-5"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)" }}
                  >
                    <p className="text-[8px] font-bold text-white truncate" style={{ fontFamily: FONT }}>
                      {item.displayName ?? item.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MatchingStep({ photoUrl, matchResults, onUpdate, onNext, onClose }) {
  const [pickerFor, setPickerFor] = useState(null); // categoryId | null

  const confirmedCount = matchResults.filter((r) => r.status === "confirmed").length;
  const pendingCount   = matchResults.filter((r) => r.status === "pending").length;

  function confirm(idx) {
    onUpdate(idx, { status: "confirmed" });
  }

  function skip(idx) {
    onUpdate(idx, { status: "skipped", confirmedItem: null });
  }

  function swapItem(idx, item) {
    onUpdate(idx, { status: "confirmed", confirmedItem: item });
    setPickerFor(null);
  }

  function prevSuggestion(idx) {
    const r = matchResults[idx];
    const newSugIdx = (r.activeSuggestionIdx - 1 + r.suggestions.length) % r.suggestions.length;
    onUpdate(idx, {
      activeSuggestionIdx: newSugIdx,
      confirmedItem: r.suggestions[newSugIdx],
    });
  }

  function nextSuggestion(idx) {
    const r = matchResults[idx];
    const newSugIdx = (r.activeSuggestionIdx + 1) % r.suggestions.length;
    onUpdate(idx, {
      activeSuggestionIdx: newSugIdx,
      confirmedItem: r.suggestions[newSugIdx],
    });
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 shrink-0" style={{ height: 52 }}>
        <CloseBtn onClose={onClose} />
        <div className="text-center">
          <h2 className="text-[15px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>착용 아이템 확인</h2>
          <p className="text-[10px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>
            {confirmedCount > 0
              ? `${confirmedCount}개 확인됨 · ${pendingCount > 0 ? `${pendingCount}개 남음` : "완료!"}`
              : "오늘 입은 아이템을 확인해주세요"}
          </p>
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>

        {/* Photo strip */}
        {photoUrl && (
          <div className="px-5 pt-2 pb-4 flex justify-center">
            <div
              className="rounded-2xl overflow-hidden"
              style={{ width: 120, height: 150, backgroundColor: "#F0F0F0", flexShrink: 0, boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}
            >
              <img src={photoUrl} alt="outfit" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
            </div>
          </div>
        )}

        {/* AI badge */}
        <div className="flex justify-center mb-4">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: "#FEFCE8", border: "1px solid #EDD83A" }}
          >
            <span style={{ fontSize: 12 }}>✨</span>
            <p className="text-[11px] font-bold" style={{ color: "#A07800", fontFamily: FONT }}>
              AI가 찾은 아이템이에요. 맞는지 확인해주세요
            </p>
          </div>
        </div>

        {/* Per-category cards */}
        <div className="px-4 flex flex-col gap-3 pb-4">
          {matchResults.map((result, idx) => {
            const item     = result.confirmedItem;
            const isDone   = result.status !== "pending";
            const isSkip   = result.status === "skipped";

            return (
              <div
                key={result.categoryId}
                className="rounded-2xl overflow-hidden"
                style={{
                  border: `1.5px solid ${isDone ? (isSkip ? "#EEEEEE" : YELLOW) : DIVIDER}`,
                  backgroundColor: isDone ? (isSkip ? "#FAFAFA" : "#FEFCE8") : "white",
                  transition: "all 0.25s ease",
                }}
              >
                {/* Category header */}
                <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${isDone ? "transparent" : DIVIDER}` }}>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 18 }}>{result.emoji}</span>
                    <p className="text-[13px] font-bold" style={{ color: isDone && !isSkip ? "#A07800" : DARK, fontFamily: FONT }}>{result.label}</p>
                  </div>
                  {isDone && (
                    <div className="flex items-center gap-1.5">
                      <span style={{ fontSize: 11 }}>{isSkip ? "⏭️" : "✅"}</span>
                      <p className="text-[11px] font-medium" style={{ color: isSkip ? "#BBBBBB" : "#A07800", fontFamily: FONT }}>
                        {isSkip ? "건너뜀" : "확인됨"}
                      </p>
                      {!isSkip && (
                        <button
                          onClick={() => onUpdate(idx, { status: "pending" })}
                          className="ml-1 px-2 py-0.5 rounded-full text-[10px] active:opacity-70"
                          style={{ backgroundColor: "rgba(245,194,0,0.2)", color: "#A07800", fontFamily: FONT }}
                        >
                          수정
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Item row */}
                {!isDone && item && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Item image */}
                    <div className="relative rounded-xl overflow-hidden shrink-0" style={{ width: 64, height: 80, backgroundColor: "#F0F0F0" }}>
                      {item.image && (
                        <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
                      )}
                      {/* Suggestion nav — only if multiple */}
                      {result.suggestions.length > 1 && (
                        <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1">
                          {result.suggestions.map((_, si) => (
                            <div
                              key={si}
                              className="rounded-full"
                              style={{ width: 4, height: 4, backgroundColor: si === result.activeSuggestionIdx ? YELLOW : "rgba(255,255,255,0.6)" }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Item info + suggestion nav */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold truncate" style={{ color: DARK, fontFamily: FONT }}>
                            {item.displayName ?? item.name}
                          </p>
                          <p className="text-[11px] mt-0.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>{item.brand ?? ""}</p>
                        </div>
                        {result.suggestions.length > 1 && (
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => prevSuggestion(idx)}
                              className="w-6 h-6 flex items-center justify-center rounded-full active:opacity-60"
                              style={{ backgroundColor: "#F0F0F0" }}>
                              <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                                <path d="M6.5 2L3.5 5L6.5 8" stroke={DARK} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                            <button onClick={() => nextSuggestion(idx)}
                              className="w-6 h-6 flex items-center justify-center rounded-full active:opacity-60"
                              style={{ backgroundColor: "#F0F0F0" }}>
                              <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                                <path d="M3.5 2L6.5 5L3.5 8" stroke={DARK} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] mt-1.5" style={{ color: "#A07800", fontFamily: FONT }}>
                        AI 추천 아이템이에요 — 이 옷 입으셨나요?
                      </p>
                    </div>
                  </div>
                )}

                {/* Confirmed item summary */}
                {isDone && !isSkip && item && (
                  <div className="flex items-center gap-3 px-4 py-2.5">
                    <div className="rounded-xl overflow-hidden shrink-0" style={{ width: 40, height: 50, backgroundColor: "#F0F0F0" }}>
                      {item.image && <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold truncate" style={{ color: DARK, fontFamily: FONT }}>{item.displayName ?? item.name}</p>
                      <p className="text-[10px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>{item.brand ?? ""}</p>
                    </div>
                  </div>
                )}

                {/* Action row */}
                {!isDone && (
                  <div className="flex gap-2 px-4 pb-3">
                    <button
                      onClick={() => confirm(idx)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 font-bold active:opacity-80"
                      style={{ backgroundColor: YELLOW, color: DARK, fontFamily: FONT, fontSize: 13 }}
                    >
                      <span>✓</span> 맞아요
                    </button>
                    <button
                      onClick={() => setPickerFor(result.categoryId)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-xl py-2.5 font-medium active:opacity-80"
                      style={{ backgroundColor: "#F2F2F2", color: "#555", fontFamily: FONT, fontSize: 12 }}
                    >
                      🔄 다른 아이템
                    </button>
                    <button
                      onClick={() => skip(idx)}
                      className="flex items-center justify-center rounded-xl py-2.5 px-3 active:opacity-80"
                      style={{ backgroundColor: "#F2F2F2" }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 2L10 10M10 2L2 10" stroke="#AAAAAA" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Manual add hint */}
        <p className="text-center text-[11px] pb-6" style={{ color: "#CCCCCC", fontFamily: FONT }}>
          가방·액세서리는 다음 단계에서 추가할 수 있어요
        </p>
      </div>

      {/* CTA */}
      <div className="px-5 pb-8 pt-3 shrink-0" style={{ borderTop: `1px solid ${DIVIDER}` }}>
        <button
          onClick={onNext}
          disabled={confirmedCount === 0}
          className="w-full flex items-center justify-center rounded-2xl font-bold active:opacity-80 transition-all"
          style={{
            height: 56,
            backgroundColor: confirmedCount > 0 ? YELLOW : "#F2F2F2",
            color:           confirmedCount > 0 ? DARK   : "#BBBBBB",
            fontFamily:      FONT,
            fontSize:        15,
          }}
        >
          {confirmedCount > 0
            ? `${confirmedCount}개 아이템으로 기록 만들기 →`
            : "아이템을 하나 이상 확인해주세요"}
        </button>
      </div>

      {/* Category item picker */}
      {pickerFor && (
        <CategoryPickerSheet
          categoryId={pickerFor}
          onSelect={(item) => {
            const idx = matchResults.findIndex((r) => r.categoryId === pickerFor);
            if (idx !== -1) swapItem(idx, item);
          }}
          onClose={() => setPickerFor(null)}
        />
      )}
    </div>
  );
}

// ─── STEP 4: Draft editor ─────────────────────────────────────────────────────

function DraftStep({ photoUrl, confirmedItems, dateStr, weather, onSave, onClose }) {
  const [template,   setTemplate]   = useState("daily");
  const [mood,       setMood]       = useState(null);
  const [customMood, setCustomMood] = useState("");
  const [memo,       setMemo]       = useState("");
  const [isPublic,   setIsPublic]   = useState(false);

  // Format date label
  const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];
  const [yr, mo, dy] = dateStr.split("-").map(Number);
  const dow = new Date(yr, mo - 1, dy).getDay();
  const dateLabel = `${mo}월 ${dy}일 (${DAY_NAMES[dow]})`;

  const moodOpt = MOOD_OPTIONS.find((m) => m.id === mood);

  function handleSave() {
    onSave({
      itemIds:         confirmedItems.map((i) => i.id),
      photoUrl:        photoUrl ?? null,
      mood:            mood ?? null,
      customMood:      customMood.trim() || null,
      note:            "",        // public note kept empty by default
      memo:            memo,      // PRIVATE — never surfaced publicly
      isPublic,
      template,
      weatherSnapshot: weather ? {
        temp:      weather.temp,
        feelsLike: weather.feelsLike,
        condition: weather.condition,
        location:  weather.location,
      } : null,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 shrink-0" style={{ height: 52, borderBottom: `1px solid ${DIVIDER}` }}>
        <button onClick={onClose} className="flex items-center gap-1 active:opacity-60" style={{ color: "#888", fontFamily: FONT, fontSize: 13 }}>
          <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
            <path d="M6.5 1.5L2 6L6.5 10.5" stroke="#888" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          아이템 수정
        </button>
        <h2 className="text-[15px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>기록 작성</h2>
        <button
          onClick={handleSave}
          className="px-4 py-1.5 rounded-full text-[13px] font-bold active:opacity-80"
          style={{ backgroundColor: YELLOW, color: DARK, fontFamily: FONT }}
        >
          저장
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>

        {/* Hero — photo + item strip */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex gap-3 items-start">
            {/* Photo thumbnail */}
            <div className="relative shrink-0 rounded-2xl overflow-hidden" style={{ width: 88, height: 110, backgroundColor: "#F0F0F0" }}>
              {photoUrl ? (
                <img src={photoUrl} alt="outfit" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span style={{ fontSize: 28 }}>👗</span>
                </div>
              )}
            </div>

            {/* Item chips + date/weather */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold mb-2" style={{ color: "#AAAAAA", fontFamily: FONT, letterSpacing: "0.04em" }}>착용 아이템</p>
              <div className="flex flex-wrap gap-1.5">
                {confirmedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-1 px-2 py-1 rounded-full"
                    style={{ backgroundColor: "#F5F5F5" }}
                  >
                    <div className="rounded-full overflow-hidden shrink-0" style={{ width: 16, height: 16, backgroundColor: "#E0E0E0" }}>
                      {item.image && <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />}
                    </div>
                    <span className="text-[10px] font-medium truncate" style={{ color: DARK, fontFamily: FONT, maxWidth: 80 }}>
                      {item.displayName ?? item.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Date + weather */}
              <div className="flex items-center gap-2 mt-2.5">
                <span className="text-[10px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>📅 {dateLabel}</span>
                {weather && (
                  <span className="text-[10px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>
                    🌡️ {weather.temp}°C
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Template selector */}
        <div className="px-5 pb-4">
          <p className="text-[11px] font-bold mb-2.5" style={{ color: "#AAAAAA", fontFamily: FONT, letterSpacing: "0.04em" }}>
            기록 템플릿
          </p>
          <div className="flex gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className="flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl transition-all active:opacity-80"
                style={{
                  backgroundColor: template === t.id ? YELLOW : "#F5F5F5",
                  border:          template === t.id ? `1.5px solid ${YELLOW}` : "1.5px solid transparent",
                }}
              >
                <span style={{ fontSize: 20 }}>{t.emoji}</span>
                <p className="text-[11px] font-bold" style={{ color: template === t.id ? DARK : "#555", fontFamily: FONT }}>{t.label}</p>
              </button>
            ))}
          </div>
          <p className="text-[11px] mt-2" style={{ color: "#BBBBBB", fontFamily: FONT }}>
            {TEMPLATES.find((t) => t.id === template)?.desc ?? ""}
          </p>
        </div>

        <div className="mx-5 mb-4" style={{ height: 1, backgroundColor: DIVIDER }} />

        {/* Mood selector */}
        <div className="px-5 pb-4">
          <p className="text-[11px] font-bold mb-2.5" style={{ color: "#AAAAAA", fontFamily: FONT, letterSpacing: "0.04em" }}>
            오늘의 무드
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {MOOD_OPTIONS.map((opt) => {
              const isActive = mood === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setMood(isActive ? null : opt.id)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-medium transition-all active:opacity-80"
                  style={{
                    backgroundColor: isActive ? opt.bg    : "#F5F5F5",
                    color:           isActive ? opt.fg    : "#555",
                    border:          `1.5px solid ${isActive ? opt.bg : "transparent"}`,
                    fontFamily:      FONT,
                    transform:       isActive ? "scale(1.05)" : "scale(1)",
                  }}
                >
                  <span style={{ fontSize: 14 }}>{opt.emoji}</span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 나만의 무드 */}
        <div className="px-5 pb-4">
          <p className="text-[11px] font-bold mb-2" style={{ color: "#AAAAAA", fontFamily: FONT, letterSpacing: "0.04em" }}>
            나만의 무드 <span style={{ color: "#CCCCCC", fontWeight: 400 }}>(선택)</span>
          </p>
          <input
            type="text"
            value={customMood}
            onChange={(e) => setCustomMood(e.target.value)}
            placeholder="예: 봄 소풍 느낌, 완전 내 스타일, 오늘은 과감하게"
            className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
            style={{ backgroundColor: "#F5F5F5", color: DARK, fontFamily: FONT }}
          />
        </div>

        <div className="mx-5 mb-4" style={{ height: 1, backgroundColor: DIVIDER }} />

        {/* Private memo */}
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[11px] font-bold" style={{ color: "#AAAAAA", fontFamily: FONT, letterSpacing: "0.04em" }}>
              나만의 메모
            </p>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ backgroundColor: "#F0F0F0" }}>
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <rect x="1" y="4" width="7" height="5" rx="1" stroke="#AAAAAA" strokeWidth="0.9" />
                <path d="M3 4V3a1.5 1.5 0 113 0v1" stroke="#AAAAAA" strokeWidth="0.9" />
              </svg>
              <span className="text-[9px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>항상 비공개</span>
            </div>
          </div>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="어디서 입었는지, 어떤 느낌이었는지, 세탁 메모 등 나만의 기록을 남겨보세요"
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none"
            style={{ backgroundColor: "#F5F5F5", color: DARK, fontFamily: FONT, lineHeight: 1.6 }}
          />
        </div>

        {/* Public toggle */}
        <div
          className="mx-5 mb-6 rounded-2xl px-4 py-3.5 flex items-center justify-between"
          style={{ backgroundColor: "#F8F8F8", border: `1px solid ${DIVIDER}` }}
        >
          <div>
            <p className="text-[13px] font-bold" style={{ color: DARK, fontFamily: FONT }}>
              {isPublic ? "🌐 공개 코디" : "🔒 나만 보기"}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>
              {isPublic
                ? "다른 사람에게 코디가 공개됩니다. 메모는 항상 비공개입니다."
                : "나만 볼 수 있는 개인 코디입니다."}
            </p>
          </div>
          <button
            onClick={() => setIsPublic((v) => !v)}
            className="shrink-0 rounded-full transition-all"
            style={{ width: 48, height: 28, backgroundColor: isPublic ? YELLOW : "#DDD", position: "relative" }}
          >
            <div
              className="absolute top-1 rounded-full bg-white"
              style={{ width: 20, height: 20, left: isPublic ? 24 : 4, transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.18)" }}
            />
          </button>
        </div>

      </div>

      {/* Save button (also in header but larger here) */}
      <div className="px-5 pb-8 pt-3 shrink-0" style={{ borderTop: `1px solid ${DIVIDER}` }}>
        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center rounded-2xl font-bold active:opacity-80"
          style={{ height: 56, backgroundColor: YELLOW, color: DARK, fontFamily: FONT, fontSize: 15 }}
        >
          ⚡ 지금 저장하기
        </button>
      </div>
    </div>
  );
}

// ─── STEP 5: Done ─────────────────────────────────────────────────────────────

function DoneStep({ photoUrl, confirmedItems, dateStr, onClose, onOpenStylebook }) {
  const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];
  const [yr, mo, dy] = dateStr.split("-").map(Number);
  const dow = new Date(yr, mo - 1, dy).getDay();
  const dateLabel = `${mo}월 ${dy}일 (${DAY_NAMES[dow]})`;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white px-6">
      {/* Success icon */}
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ backgroundColor: "#FEFCE8", border: "2px solid #EDD83A" }}
      >
        <span style={{ fontSize: 40 }}>✅</span>
      </div>

      <h2 className="text-[22px] font-bold text-center mb-2" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.03em" }}>
        기록 완료!
      </h2>
      <p className="text-[13px] text-center mb-6" style={{ color: "#888", fontFamily: FONT }}>
        {dateLabel} 착장이 기록됐어요
      </p>

      {/* Item thumbnails */}
      <div className="flex gap-2 mb-8 justify-center">
        {photoUrl ? (
          <div className="rounded-2xl overflow-hidden" style={{ width: 80, height: 100, backgroundColor: "#F0F0F0", boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}>
            <img src={photoUrl} alt="outfit" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
          </div>
        ) : null}
        {confirmedItems.slice(0, photoUrl ? 3 : 4).map((item) => (
          <div key={item.id} className="rounded-2xl overflow-hidden" style={{ width: 60, height: 76, backgroundColor: "#F0F0F0", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
            {item.image && <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />}
          </div>
        ))}
        {confirmedItems.length > (photoUrl ? 3 : 4) && (
          <div className="rounded-2xl flex items-center justify-center" style={{ width: 60, height: 76, backgroundColor: "#F5F5F5" }}>
            <p className="text-[11px] font-bold" style={{ color: "#888", fontFamily: FONT }}>+{confirmedItems.length - (photoUrl ? 3 : 4)}</p>
          </div>
        )}
      </div>

      {/* Stylebook CTA */}
      {onOpenStylebook && (
        <button
          onClick={() => onOpenStylebook(confirmedItems.map((i) => i.id), photoUrl, dateStr)}
          className="w-full flex items-center justify-center gap-2.5 rounded-2xl mb-3 active:opacity-80"
          style={{
            height: 56,
            background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
            fontFamily: FONT,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="1" width="12" height="14" rx="2.5" stroke="white" strokeWidth="1.4" />
            <path d="M5 5H11M5 8H11M5 11H8.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span className="text-[14px] font-bold text-white">스타일북으로 꾸미기</span>
        </button>
      )}

      <button
        onClick={onClose}
        className="w-full flex items-center justify-center rounded-2xl active:opacity-80"
        style={{ height: 50, backgroundColor: "#F5F5F5", color: "#555", fontFamily: FONT, fontSize: 14, fontWeight: 600 }}
      >
        완료
      </button>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function StyleRecordFlow({
  dateStr,
  onSave,
  onClose,
  onOpenStylebook,
}) {
  const [step,         setStep]         = useState("photo");
  const [photoUrl,     setPhotoUrl]     = useState(null);
  const [matchResults, setMatchResults] = useState([]);

  const { weather } = useWeather();

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function handlePhotoChosen(dataUrl) {
    setPhotoUrl(dataUrl);  // may be null ("skip photo")
    const results = simulateAnalysis();
    setMatchResults(results);
    setStep("analyzing");
  }

  function handleAnalysisDone() {
    setStep("matching");
  }

  function updateMatchResult(idx, patch) {
    setMatchResults((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, ...patch } : r))
    );
  }

  function handleMatchingNext() {
    setStep("draft");
  }

  function handleDraftSave(draftData) {
    onSave(dateStr, draftData);
    setStep("done");
  }

  // Items confirmed in matching step
  const confirmedItems = matchResults
    .filter((r) => r.status === "confirmed" && r.confirmedItem)
    .map((r) => r.confirmedItem);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="absolute inset-0 z-50">
      {step === "photo" && (
        <PhotoStep
          onPhotoChosen={handlePhotoChosen}
          onClose={onClose}
        />
      )}

      {step === "analyzing" && (
        <AnalyzingStep
          photoUrl={photoUrl}
          onDone={handleAnalysisDone}
        />
      )}

      {step === "matching" && (
        <MatchingStep
          photoUrl={photoUrl}
          matchResults={matchResults}
          onUpdate={updateMatchResult}
          onNext={handleMatchingNext}
          onClose={onClose}
        />
      )}

      {step === "draft" && (
        <DraftStep
          photoUrl={photoUrl}
          confirmedItems={confirmedItems}
          dateStr={dateStr}
          weather={weather}
          onSave={handleDraftSave}
          onClose={() => setStep("matching")}
        />
      )}

      {step === "done" && (
        <DoneStep
          photoUrl={photoUrl}
          confirmedItems={confirmedItems}
          dateStr={dateStr}
          onClose={onClose}
          onOpenStylebook={onOpenStylebook}
        />
      )}
    </div>
  );
}
