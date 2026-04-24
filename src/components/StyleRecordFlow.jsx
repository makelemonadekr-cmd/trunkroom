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
import OutfitCanvasEditor from "./OutfitCanvasEditor";
import StylebookTemplate  from "./StylebookTemplate";

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
  { id: "daily",     label: "빠른 기록",          emoji: "⚡", desc: "착용 아이템만 빠르게 기록해요" },
  { id: "stylebook", label: "스타일북 직접 꾸미기", emoji: "📖", desc: "손가락으로 꾸미는 나만의 스타일북" },
];

// ─── Simulate AI analysis ─────────────────────────────────────────────────────
// Groups CLOSET_ITEMS by category and returns 3 candidates per category.
// In production this would be a real CV/AI call.

const MATCH_CATEGORIES = [
  { id: "상의",     emoji: "👕", label: "상의"     },
  { id: "하의",     emoji: "👖", label: "하의"     },
  { id: "아우터",   emoji: "🧥", label: "아우터"   },
  { id: "원피스",   emoji: "👗", label: "원피스"   },
  { id: "신발",     emoji: "👟", label: "신발"     },
  { id: "가방",     emoji: "👜", label: "가방"     },
  { id: "액세서리", emoji: "💍", label: "액세서리" },
  { id: "스포츠",   emoji: "🎽", label: "스포츠"   },
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
  const [source,     setSource]     = useState(null);   // "camera" | "gallery"
  const [showPicker, setShowPicker] = useState(false);  // bottom sheet
  const fileInputRef                = useRef(null);

  // Trigger file input after source is chosen (300ms delay for sheet close animation)
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

  function pickSource(src) {
    setShowPicker(false);
    setSource(src);
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white">

      {/* Header */}
      <div className="flex items-center justify-between px-5 shrink-0" style={{ height: 52 }}>
        <CloseBtn onClose={onClose} />
        <h2 className="text-[16px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>
          오늘의 스타일 기록
        </h2>
        <div style={{ width: 36 }} />
      </div>

      {/* Hero — tap to open picker */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <button
          onClick={() => setShowPicker(true)}
          className="flex flex-col items-center justify-center rounded-3xl active:opacity-75 transition-opacity"
          style={{
            width: 200, height: 240,
            background: "linear-gradient(145deg, #FEFCE8 0%, #FFF8D6 100%)",
            border: "2px dashed #EDD83A",
          }}
        >
          <span style={{ fontSize: 56 }}>📸</span>
          <p className="text-[13px] font-bold text-center mt-3" style={{ color: "#A07800", fontFamily: FONT, lineHeight: 1.5 }}>
            오늘 스타일 사진을<br />올려주세요
          </p>
        </button>

        <div className="text-center">
          <p className="text-[14px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.015em" }}>
            사진 한 장으로 시작해요
          </p>
          <p className="text-[12px] mt-1.5" style={{ color: "#888", fontFamily: FONT, lineHeight: 1.65 }}>
            전신 착장 사진을 올리면<br />AI가 아이템을 자동으로 찾아줄게요
          </p>
        </div>
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

      {/* ── Photo source picker bottom sheet ── */}
      {showPicker && (
        <>
          {/* Scrim */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.4)", zIndex: 60 }}
            onClick={() => setShowPicker(false)}
          />
          {/* Sheet */}
          <div
            className="absolute left-0 right-0 bottom-0 flex flex-col"
            style={{
              zIndex:          61,
              backgroundColor: "white",
              borderRadius:    "20px 20px 0 0",
              padding:         "8px 20px 36px",
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-2 pb-5">
              <div className="rounded-full" style={{ width: 36, height: 4, backgroundColor: "#E0E0E0" }} />
            </div>

            <p className="text-[13px] font-bold mb-4" style={{ color: "#AAAAAA", fontFamily: FONT, letterSpacing: "0.04em" }}>
              사진 선택
            </p>

            {/* 촬영하기 */}
            <button
              onClick={() => pickSource("camera")}
              className="w-full flex items-center gap-4 rounded-2xl active:opacity-75 mb-3"
              style={{ height: 58, backgroundColor: YELLOW, paddingLeft: 20, paddingRight: 20 }}
            >
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="5" width="16" height="12" rx="2.5" stroke={DARK} strokeWidth="1.6" />
                <circle cx="10" cy="11" r="3.2" stroke={DARK} strokeWidth="1.6" />
                <path d="M7 5L8.5 2.5H11.5L13 5" stroke={DARK} strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <span className="text-[15px] font-bold" style={{ color: DARK, fontFamily: FONT }}>사진 촬영하기</span>
            </button>

            {/* 갤러리 */}
            <button
              onClick={() => pickSource("gallery")}
              className="w-full flex items-center gap-4 rounded-2xl active:opacity-75 mb-3"
              style={{ height: 58, backgroundColor: "#F5F5F5", paddingLeft: 20, paddingRight: 20 }}
            >
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="16" height="16" rx="3" stroke={DARK} strokeWidth="1.6" />
                <circle cx="7" cy="7" r="1.5" stroke={DARK} strokeWidth="1.4" />
                <path d="M2 13L6.5 9L9.5 12L13 8.5L18 13" stroke={DARK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[15px] font-bold" style={{ color: DARK, fontFamily: FONT }}>갤러리에서 불러오기</span>
            </button>

            {/* 사진 없이 */}
            <button
              onClick={() => { setShowPicker(false); onPhotoChosen(null); }}
              className="w-full text-center py-3 active:opacity-60"
              style={{ color: "#AAAAAA", fontFamily: FONT, fontSize: 13 }}
            >
              사진 없이 기록하기
            </button>
          </div>
        </>
      )}
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

      </div>

      {/* CTA */}
      <div className="px-5 pb-8 pt-3 shrink-0 flex flex-col gap-2" style={{ borderTop: `1px solid ${DIVIDER}` }}>
        <button
          onClick={onNext}
          className="w-full flex items-center justify-center rounded-2xl font-bold active:opacity-80 transition-all"
          style={{
            height:          56,
            backgroundColor: YELLOW,
            color:           DARK,
            fontFamily:      FONT,
            fontSize:        15,
          }}
        >
          {`${confirmedCount}개 아이템으로 스타일 만들기 →`}
        </button>

        {confirmedCount === 0 && (
          <button
            onClick={onClose}
            className="w-full text-center py-2 active:opacity-60"
            style={{ color: "#AAAAAA", fontFamily: FONT, fontSize: 13 }}
          >
            원하는 아이템이 없어요. 추가 먼저 하러가기
          </button>
        )}
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
// Three sub-steps:
//   "layout"  – square template preview (photo left | items right) + date + template picker
//   "preview" – polished template card output (daily path only)
//   "info"    – mood, memo, public toggle → save

// Helper: renders worn-items grid in the right column of the template card
function ItemsGrid({ items }) {
  if (items.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#EEEEEE" }}>
        <span style={{ fontSize: 20, opacity: 0.28 }}>📦</span>
      </div>
    );
  }
  if (items.length <= 2) {
    return (
      <>
        {items.map((item) => (
          <div key={item.id} style={{ flex: 1, overflow: "hidden", backgroundColor: "#F0F0F0" }}>
            {item.image && <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />}
          </div>
        ))}
      </>
    );
  }
  return (
    <>
      <div style={{ flex: 1, display: "flex", gap: 3 }}>
        {items.slice(0, 2).map((item) => (
          <div key={item.id} style={{ flex: 1, overflow: "hidden", backgroundColor: "#F0F0F0" }}>
            {item.image && <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: "flex", gap: 3 }}>
        {items.slice(2, 4).map((item) => (
          <div key={item.id} style={{ flex: 1, overflow: "hidden", backgroundColor: "#F0F0F0" }}>
            {item.image && <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />}
          </div>
        ))}
        {items.length === 3 && <div style={{ flex: 1 }} />}
      </div>
    </>
  );
}

function DraftStep({ photoUrl, confirmedItems, dateStr: initDateStr, weather, onSave, onClose }) {
  const [subStep,            setSubStep]            = useState("layout");
  const [template,           setTemplate]           = useState("daily");   // "daily" | "stylebook"
  const [stylebookTemplateId, setStylobookTemplateId] = useState("A");     // "A" | "B" for quick template
  const [selectedDate,       setSelectedDate]       = useState(initDateStr);
  const [mood,               setMood]               = useState(null);
  const [customMood,         setCustomMood]         = useState("");
  const [memo,               setMemo]               = useState("");
  const [isPublic,           setIsPublic]           = useState(false);
  const [showCanvas,         setShowCanvas]         = useState(false);
  const dateInputRef = useRef(null);

  const D_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

  function toDs(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  function fmtDate(ds) {
    const [y, m, d] = ds.split("-").map(Number);
    return `${m}월 ${d}일 (${D_NAMES[new Date(y, m - 1, d).getDay()]})`;
  }
  function offsetDay(n) {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + n);
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    if (dt > now) return;
    setSelectedDate(toDs(dt));
  }
  const todayDs = toDs(new Date());

  function buildRecord(extra = {}) {
    return {
      itemIds:         confirmedItems.map((i) => i.id),
      photoUrl:        photoUrl ?? null,
      mood:            mood ?? null,
      customMood:      customMood.trim() || null,
      note:            "",
      memo,
      isPublic,
      template,
      weatherSnapshot: weather
        ? { temp: weather.temp, feelsLike: weather.feelsLike, condition: weather.condition, location: weather.location }
        : null,
      updatedAt: new Date().toISOString(),
      ...extra,
    };
  }

  // ── Canvas editor overlay (스타일북 직접 꾸미기) ─────────────────────────────
  if (showCanvas) {
    return (
      <OutfitCanvasEditor
        initialItemIds={confirmedItems.map((i) => i.id)}
        dateStr={selectedDate}
        onSave={() => {
          setShowCanvas(false);
          // Also save the wear record alongside the coordi that OutfitCanvasEditor already saved
          onSave(selectedDate, buildRecord({ template: "stylebook", isPublic: false, mood: null, memo: "" }));
        }}
        onClose={() => setShowCanvas(false)}
      />
    );
  }

  // ── Sub-step 1: Layout ───────────────────────────────────────────────────────
  if (subStep === "layout") {
    const isQuick = template === "daily";

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
          <div style={{ width: 60 }} />
        </div>

        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>

          {/* ── Mode selector ── */}
          <div className="px-4 pt-4 pb-3 flex gap-2.5">
            {[
              { id: "daily",     icon: "⚡", label: "빠른 스타일 생성", desc: "템플릿을 이용해 기록해요" },
              { id: "stylebook", icon: "✏️", label: "스타일 편집",     desc: "직접 손가락으로 꾸미는 나만의 스타일" },
            ].map((mode) => {
              const active = template === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setTemplate(mode.id)}
                  className="flex-1 flex flex-col items-start px-3.5 py-3 rounded-2xl text-left active:opacity-80 transition-all"
                  style={{
                    backgroundColor: active ? "#FEFCE8" : "#F8F8F8",
                    border: `1.5px solid ${active ? "#EDD83A" : "#EEEEEE"}`,
                  }}
                >
                  <span style={{ fontSize: 20, marginBottom: 4 }}>{mode.icon}</span>
                  <p className="text-[12px] font-bold leading-tight" style={{ color: active ? "#A07800" : DARK, fontFamily: FONT }}>{mode.label}</p>
                  <p className="text-[9px] mt-1 leading-tight" style={{ color: active ? "#B8920A" : "#AAAAAA", fontFamily: FONT }}>{mode.desc}</p>
                </button>
              );
            })}
          </div>

          {/* ── Dynamic preview ── */}
          {isQuick ? (
            /* 빠른 스타일 생성 — StylebookTemplate 4:5 preview */
            <div className="px-4 pb-3 flex flex-col items-center">
              {/* A / B sub-selector */}
              <div className="flex gap-2 w-full mb-3">
                {[
                  { id: "A", label: "Template A", desc: "선명한 배경" },
                  { id: "B", label: "Template B", desc: "부드러운 배경" },
                ].map((t) => {
                  const on = stylebookTemplateId === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setStylobookTemplateId(t.id)}
                      className="flex-1 py-2.5 rounded-xl flex flex-col items-center gap-0.5 transition-all active:opacity-70"
                      style={{
                        backgroundColor: on ? "#FEFCE8" : "#F5F5F5",
                        border: on ? "1.5px solid #EDD83A" : "1.5px solid transparent",
                      }}
                    >
                      <p className="text-[11px] font-bold" style={{ color: on ? "#A07800" : "#888", fontFamily: FONT }}>{t.label}</p>
                      <p className="text-[9px]" style={{ color: on ? "#B8920A" : "#BBBBBB", fontFamily: FONT }}>{t.desc}</p>
                    </button>
                  );
                })}
              </div>
              <StylebookTemplate
                photoUrl={photoUrl}
                items={confirmedItems}
                template={stylebookTemplateId}
                width={280}
              />
            </div>
          ) : (
            /* 스타일 편집 — 좌/우 분할 프리뷰 (템플릿 미적용) */
            <div className="px-4 pb-3">
              <div
                className="w-full rounded-2xl overflow-hidden"
                style={{ aspectRatio: "1 / 1", backgroundColor: "#F0F0F0", display: "flex" }}
              >
                <div style={{ width: "50%", height: "100%", overflow: "hidden", flexShrink: 0 }}>
                  {photoUrl ? (
                    <img src={photoUrl} alt="outfit" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", backgroundColor: "#E8E8E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 36 }}>👗</span>
                    </div>
                  )}
                </div>
                <div style={{ width: 3, backgroundColor: "white", flexShrink: 0 }} />
                <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: 3, padding: 3 }}>
                  <ItemsGrid items={confirmedItems} />
                </div>
              </div>
              <p className="text-[11px] mt-2 text-center" style={{ color: "#CCCCCC", fontFamily: FONT }}>
                다음에서 직접 꾸밀 수 있어요
              </p>
            </div>
          )}

          {/* ── Worn items (horizontal scroll) ── */}
          <div className="px-4 pb-4">
            <p className="text-[11px] font-bold mb-2.5" style={{ color: "#AAAAAA", fontFamily: FONT, letterSpacing: "0.04em" }}>
              착용 아이템 {confirmedItems.length}개
            </p>
            {confirmedItems.length === 0 ? (
              <p className="text-[12px]" style={{ color: "#CCCCCC", fontFamily: FONT }}>선택된 아이템이 없어요</p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {confirmedItems.map((item) => (
                  <div key={item.id} className="shrink-0 flex flex-col gap-1" style={{ width: 72 }}>
                    <div className="rounded-xl overflow-hidden" style={{ width: 72, height: 90, backgroundColor: "#F0F0F0" }}>
                      {item.image && <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />}
                    </div>
                    <p className="text-[9px] font-bold truncate" style={{ color: DARK, fontFamily: FONT }}>{item.displayName ?? item.name}</p>
                    <p className="text-[8px] truncate" style={{ color: "#AAAAAA", fontFamily: FONT }}>{item.brand ?? ""}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Date picker ── */}
          <div className="px-4 pb-8">
            <p className="text-[11px] font-bold mb-2" style={{ color: "#AAAAAA", fontFamily: FONT, letterSpacing: "0.04em" }}>날짜</p>
            <div className="flex items-center gap-2">
              <button onClick={() => offsetDay(-1)} className="w-9 h-9 flex items-center justify-center rounded-full active:opacity-60 shrink-0" style={{ backgroundColor: "#F2F2F2" }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M6.5 2L3.5 5L6.5 8" stroke={DARK} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button onClick={() => dateInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl active:opacity-80" style={{ backgroundColor: "#F5F5F5" }}>
                <span style={{ fontSize: 14 }}>📅</span>
                <span className="text-[13px] font-bold" style={{ color: DARK, fontFamily: FONT }}>{fmtDate(selectedDate)}</span>
              </button>
              <button onClick={() => offsetDay(1)} className="w-9 h-9 flex items-center justify-center rounded-full active:opacity-60 shrink-0" style={{ backgroundColor: "#F2F2F2", opacity: selectedDate >= todayDs ? 0.35 : 1 }} disabled={selectedDate >= todayDs}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3.5 2L6.5 5L3.5 8" stroke={DARK} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
            <input ref={dateInputRef} type="date" className="hidden" value={selectedDate} max={todayDs} onChange={(e) => { if (e.target.value) setSelectedDate(e.target.value); }} />
          </div>
        </div>

        {/* CTA */}
        <div className="px-5 pb-8 pt-3 shrink-0" style={{ borderTop: `1px solid ${DIVIDER}` }}>
          <button
            onClick={() => {
              if (template === "stylebook") {
                setShowCanvas(true);
              } else {
                setSubStep("preview");
              }
            }}
            className="w-full flex items-center justify-center gap-2 rounded-2xl font-bold active:opacity-80"
            style={{ height: 56, backgroundColor: YELLOW, color: DARK, fontFamily: FONT, fontSize: 15 }}
          >
            {isQuick ? "다음" : "편집 시작하기"}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 8H12M9 5L12 8L9 11" stroke={DARK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // ── Sub-step 2: Preview ──────────────────────────────────────────────────────
  if (subStep === "preview") {
    return (
      <div className="absolute inset-0 z-50 flex flex-col bg-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 shrink-0" style={{ height: 52, borderBottom: `1px solid ${DIVIDER}` }}>
          <button
            onClick={() => setSubStep("layout")}
            className="flex items-center gap-1 active:opacity-60"
            style={{ color: "#888", fontFamily: FONT, fontSize: 13 }}
          >
            <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
              <path d="M6.5 1.5L2 6L6.5 10.5" stroke="#888" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            뒤로
          </button>
          <div className="text-center">
            <h2 className="text-[15px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>이미지 확인</h2>
            <p className="text-[10px]" style={{ color: "#CCCCCC", fontFamily: FONT }}>2 / 3</p>
          </div>
          <div style={{ width: 36 }} />
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col items-center" style={{ scrollbarWidth: "none" }}>
          <div className="px-4 pt-6 pb-2 w-full">
            {/* Polished template card */}
            <div
              className="w-full rounded-2xl overflow-hidden"
              style={{ aspectRatio: "1 / 1", backgroundColor: "#FAFAFA", display: "flex", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
            >
              {/* Left: photo with date badge */}
              <div style={{ width: "50%", height: "100%", overflow: "hidden", flexShrink: 0, position: "relative" }}>
                {photoUrl ? (
                  <img src={photoUrl} alt="outfit" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", backgroundColor: "#DDDDDD", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 40 }}>👗</span>
                  </div>
                )}
                {/* Date badge */}
                <div style={{ position: "absolute", bottom: 10, left: 8 }}>
                  <div style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", borderRadius: 6, padding: "3px 8px", display: "inline-flex" }}>
                    <span className="text-[9px] font-bold text-white" style={{ fontFamily: FONT }}>{fmtDate(selectedDate)}</span>
                  </div>
                </div>
              </div>
              {/* Divider */}
              <div style={{ width: 3, backgroundColor: "white", flexShrink: 0 }} />
              {/* Right: items */}
              <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: 3, padding: 3 }}>
                <ItemsGrid items={confirmedItems} />
              </div>
            </div>

            {/* Author row below card */}
            <div className="flex items-center justify-between mt-3 px-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0" style={{ backgroundColor: "#EBEBEB" }}>
                  <img src="/officiallogo.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain", opacity: 0.6 }} />
                </div>
                <span className="text-[12px] font-bold" style={{ color: DARK, fontFamily: FONT }}>윤킴</span>
              </div>
              <span className="text-[11px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>{fmtDate(selectedDate)}</span>
            </div>
          </div>

          <p className="text-[11px] px-4 pt-1 pb-6 text-center" style={{ color: "#BBBBBB", fontFamily: FONT }}>
            ⚡ 빠른 기록 템플릿 미리보기예요
          </p>
        </div>

        {/* CTA */}
        <div className="px-5 pb-8 pt-3 shrink-0" style={{ borderTop: `1px solid ${DIVIDER}` }}>
          <button
            onClick={() => setSubStep("info")}
            className="w-full flex items-center justify-center gap-2 rounded-2xl font-bold active:opacity-80"
            style={{ height: 56, backgroundColor: YELLOW, color: DARK, fontFamily: FONT, fontSize: 15 }}
          >
            다음
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 8H12M9 5L12 8L9 11" stroke={DARK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // ── Sub-step 3: Info ────────────────────────────────────────────────────────
  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 shrink-0" style={{ height: 52, borderBottom: `1px solid ${DIVIDER}` }}>
        <button
          onClick={() => setSubStep("preview")}
          className="flex items-center gap-1 active:opacity-60"
          style={{ color: "#888", fontFamily: FONT, fontSize: 13 }}
        >
          <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
            <path d="M6.5 1.5L2 6L6.5 10.5" stroke="#888" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          뒤로
        </button>
        <div className="text-center">
          <h2 className="text-[15px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>정보 입력</h2>
          <p className="text-[10px]" style={{ color: "#CCCCCC", fontFamily: FONT }}>3 / 3</p>
        </div>
        <button
          onClick={() => onSave(selectedDate, buildRecord())}
          className="px-4 py-1.5 rounded-full text-[13px] font-bold active:opacity-80"
          style={{ backgroundColor: YELLOW, color: DARK, fontFamily: FONT }}
        >
          저장
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>

        {/* Mood */}
        <div className="px-5 pt-5 pb-4">
          <p className="text-[11px] font-bold mb-2.5" style={{ color: "#AAAAAA", fontFamily: FONT, letterSpacing: "0.04em" }}>오늘의 무드</p>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {MOOD_OPTIONS.map((opt) => {
              const isActive = mood === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setMood(isActive ? null : opt.id)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-medium transition-all active:opacity-80"
                  style={{
                    backgroundColor: isActive ? opt.bg  : "#F5F5F5",
                    color:           isActive ? opt.fg  : "#555",
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

        {/* Custom mood */}
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
            <p className="text-[11px] font-bold" style={{ color: "#AAAAAA", fontFamily: FONT, letterSpacing: "0.04em" }}>나만의 메모</p>
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

        <div className="mx-5 mb-4" style={{ height: 1, backgroundColor: DIVIDER }} />

        {/* Public toggle — default private, opt-in to public */}
        <div
          className="mx-5 mb-6 rounded-2xl px-4 py-4 flex items-center justify-between"
          style={{
            backgroundColor: isPublic ? "#FEFCE8" : "#F8F8F8",
            border: `1px solid ${isPublic ? "#EDD83A" : DIVIDER}`,
            transition: "all 0.2s",
          }}
        >
          <div className="flex-1 min-w-0 mr-4">
            <p className="text-[13px] font-bold" style={{ color: DARK, fontFamily: FONT }}>🌐 공개 스타일</p>
            <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "#AAAAAA", fontFamily: FONT }}>
              {isPublic
                ? "다른 사람들이 볼 수 있어요. 메모는 항상 비공개입니다."
                : "선택하시면 다른 사람들이 볼 수 있어요."}
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

      {/* Save CTA */}
      <div className="px-5 pb-8 pt-3 shrink-0" style={{ borderTop: `1px solid ${DIVIDER}` }}>
        <button
          onClick={() => onSave(selectedDate, buildRecord())}
          className="w-full flex items-center justify-center rounded-2xl font-bold active:opacity-80"
          style={{ height: 56, backgroundColor: YELLOW, color: DARK, fontFamily: FONT, fontSize: 15 }}
        >
          ⚡ 저장하기
        </button>
      </div>
    </div>
  );
}

// ─── STEP 5: Done ─────────────────────────────────────────────────────────────

function DoneStep({ photoUrl, confirmedItems, dateStr, onClose, onGoToStylebook }) {
  const [yr, mo, dy] = dateStr.split("-").map(Number);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white px-6">
      {/* Success icon — no background */}
      <span style={{ fontSize: 56 }} className="mb-5">✅</span>

      <h2 className="text-[22px] font-bold text-center mb-2" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.03em" }}>
        기록 완료!
      </h2>
      <p className="text-[13px] text-center mb-8" style={{ color: "#888", fontFamily: FONT }}>
        {mo}월 {dy}일 스타일북을 기록했어요
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

      {/* 나의 스타일북 보러 가기 */}
      <button
        onClick={() => { onGoToStylebook?.(); onClose(); }}
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
        <span className="text-[14px] font-bold text-white">나의 스타일북 보러 가기</span>
      </button>

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
  onGoToStylebook,
}) {
  const [step,         setStep]         = useState("photo");
  const [photoUrl,     setPhotoUrl]     = useState(null);
  const [matchResults, setMatchResults] = useState([]);
  const [savedDateStr, setSavedDateStr] = useState(dateStr); // tracks the date user chose in DraftStep

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

  // DraftStep now calls onSave(selectedDate, draftData)
  function handleDraftSave(selectedDate, draftData) {
    onSave(selectedDate, draftData);
    setSavedDateStr(selectedDate);
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
          dateStr={savedDateStr}
          onClose={onClose}
          onGoToStylebook={onGoToStylebook}
        />
      )}
    </div>
  );
}
