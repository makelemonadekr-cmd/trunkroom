import { useState, useEffect, useRef, useMemo } from "react";
import {
  getAllWearHistory,
  saveWearRecord,
  deleteWearRecord,
  getWearStats,
  getItemWearFrequency,
  getItemLastWornDates,
  localDateStr,
  todayStr,
} from "../../lib/wearHistoryStore";
import {
  getItemsNeedingWash,
  getLaundryStatus,
  markWashed,
  getWearsSinceWash,
} from "../../lib/laundryStore";
import { saveCoordi, getAllCoordi, deleteCoordi } from "../../lib/coordiStore";
import StylebookDetailScreen from "../../components/StylebookDetailScreen";
import { extractColors } from "../../lib/colorExtractor";
import OutfitCanvasEditor from "../../components/OutfitCanvasEditor";
import StyleRecordFlow from "../../components/StyleRecordFlow";
import { CLOSET_ITEMS, MAIN_CATEGORIES } from "../../constants/mockClosetData";
import FullListScreen from "../closet/FullListScreen";

const FONT    = "'Spoqa Han Sans Neo', sans-serif";
const DARK    = "#1a1a1a";
const YELLOW  = "#F5C200";
const DIVIDER = "#F0F0F0";

const DAY_NAMES   = ["일", "월", "화", "수", "목", "금", "토"];
const MONTH_NAMES = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

// ─── Mood options ─────────────────────────────────────────────────────────────

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

// Category colors for donut chart
const CAT_COLORS = {
  "상의":     "#F5C200",
  "하의":     "#4A90D9",
  "아우터":   "#6B5040",
  "원피스":   "#E84040",
  "신발":     "#50A060",
  "가방":     "#8060C0",
  "액세서리": "#F08030",
  "스포츠":   "#4080A0",
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

function formatDateLabel(dateStr) {
  const [yr, mo, dy] = dateStr.split("-").map(Number);
  const dow = new Date(yr, mo - 1, dy).getDay();
  return `${mo}월 ${dy}일 (${DAY_NAMES[dow]})`;
}

function daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function firstDayOfWeek(year, month) { return new Date(year, month, 1).getDay(); }

// ─── Image deduplication ─────────────────────────────────────────────────────

function dedupeByImage(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item.image) return true;
    if (seen.has(item.image)) return false;
    seen.add(item.image);
    return true;
  });
}

// ─── StyleBoardView ───────────────────────────────────────────────────────────
// Arranges selected item thumbnails into a mood-board grid.
// This is the "generated" coordi image — a practical composed view.

function StyleBoardView({ itemIds, size = 240 }) {
  const items = itemIds
    .map((id) => CLOSET_ITEMS.find((i) => i.id === id))
    .filter(Boolean)
    .slice(0, 4);

  if (items.length === 0) return null;

  const imgStyle = { width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" };
  const cellStyle = { overflow: "hidden", backgroundColor: "#F0F0F0" };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ width: size, height: size, backgroundColor: "#F5F5F5" }}
    >
      {items.length === 1 && (
        <div style={{ ...cellStyle, width: "100%", height: "100%" }}>
          <img src={items[0].image} alt="" style={imgStyle} />
        </div>
      )}
      {items.length === 2 && (
        <div style={{ display: "flex", width: "100%", height: "100%", gap: 3 }}>
          {items.map((item) => (
            <div key={item.id} style={{ ...cellStyle, flex: 1, height: "100%" }}>
              <img src={item.image} alt="" style={imgStyle} />
            </div>
          ))}
        </div>
      )}
      {items.length === 3 && (
        <div style={{ display: "flex", width: "100%", height: "100%", gap: 3 }}>
          <div style={{ ...cellStyle, flex: 1, height: "100%" }}>
            <img src={items[0].image} alt="" style={imgStyle} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 3 }}>
            {items.slice(1).map((item) => (
              <div key={item.id} style={{ ...cellStyle, flex: 1 }}>
                <img src={item.image} alt="" style={imgStyle} />
              </div>
            ))}
          </div>
        </div>
      )}
      {items.length >= 4 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", width: "100%", height: "100%", gap: 3 }}>
          {items.slice(0, 4).map((item) => (
            <div key={item.id} style={cellStyle}>
              <img src={item.image} alt="" style={imgStyle} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── StylebookCreatorSheet ────────────────────────────────────────────────────
// Full-screen overlay: compose selected outfit items into a stylebook entry.
// Fields: name, mood, memo (private), isPublic, photoUrl, extractedColors.

function StylebookCreatorSheet({ itemIds, dateStr, photoUrl: initPhotoUrl = null, onSave, onClose }) {
  const [name,         setName]         = useState("");
  const [mood,         setMood]         = useState(null);
  const [memo,         setMemo]         = useState("");
  const [isPublic,     setIsPublic]     = useState(false);
  const [photo,        setPhoto]        = useState(initPhotoUrl);
  const [colors,       setColors]       = useState([]);
  const [colorLoading, setColorLoading] = useState(false);
  const photoFileRef = useRef(null);

  // Auto-extract colors whenever the photo changes
  useEffect(() => {
    if (!photo) { setColors([]); return; }
    setColorLoading(true);
    extractColors(photo, 5).then((result) => {
      setColors(result);
      setColorLoading(false);
    });
  }, [photo]);

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleSave() {
    const moodOpt = MOOD_OPTIONS.find((m) => m.id === mood);
    const newEntry = {
      id:              `coordi-${Date.now()}`,
      title:           name.trim() || `${formatDateLabel(dateStr)} 코디`,
      mood:            mood ?? null,
      memo,                    // PRIVATE — not exposed publicly
      isPublic,
      itemIds:         [...itemIds],
      thumbnail:       photo || (CLOSET_ITEMS.find((i) => i.id === itemIds[0])?.image ?? null),
      bgColor:         moodOpt?.bg ?? "#F5F5F5",
      dateStr,
      photoUrl:        photo ?? null,
      extractedColors: colors,
      updatedAt:       new Date().toISOString(),
    };
    saveCoordi(newEntry);
    onSave?.();
  }

  return (
    <div className="absolute inset-0 z-[60] flex flex-col bg-white overflow-hidden">

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-5 shrink-0"
        style={{ height: 52, borderBottom: `1px solid ${DIVIDER}` }}
      >
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2L12 12M12 2L2 12" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <h2 className="text-[15px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>
          스타일북 만들기
        </h2>
        <button
          onClick={handleSave}
          className="px-4 py-1.5 rounded-full text-[13px] font-bold"
          style={{ backgroundColor: YELLOW, color: DARK, fontFamily: FONT }}
        >
          저장
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>

        {/* ── Hero visual — photo or item grid ── */}
        <div className="px-5 pt-5 pb-3 flex flex-col items-center">
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{ width: 220, height: 220, backgroundColor: "#F2F2F2" }}
          >
            {photo ? (
              <img
                src={photo}
                alt="outfit"
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
              />
            ) : (
              <StyleBoardView itemIds={itemIds} size={220} />
            )}

            {/* Camera button overlay */}
            <button
              onClick={() => photoFileRef.current?.click()}
              className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full active:opacity-70"
              style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}
            >
              <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="5" width="16" height="12" rx="2" stroke="white" strokeWidth="1.6" />
                <circle cx="10" cy="11" r="3" stroke="white" strokeWidth="1.6" />
                <path d="M7 5L8.5 2.5H11.5L13 5" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <span className="text-[10px] font-bold text-white" style={{ fontFamily: FONT }}>
                {photo ? "변경" : "사진 추가"}
              </span>
            </button>
          </div>
          <input
            ref={photoFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
          <p className="text-[10px] mt-2 text-center" style={{ color: "#BBBBBB", fontFamily: FONT }}>
            {photo
              ? "착장 사진이 추가됐어요"
              : `선택한 ${itemIds.length}개 아이템으로 만든 코디 보드`}
          </p>
        </div>

        {/* ── Palette (auto-extracted from photo) ── */}
        {(photo || colorLoading) && (
          <div className="px-5 pb-4">
            <div className="flex items-center gap-2 mb-2.5">
              <p className="text-[11px] font-bold" style={{ color: "#AAAAAA", fontFamily: FONT, letterSpacing: "0.05em" }}>
                PALETTE
              </p>
              {colorLoading && (
                <p className="text-[10px]" style={{ color: "#CCCCCC", fontFamily: FONT }}>분석 중...</p>
              )}
              {!colorLoading && colors.length > 0 && (
                <p className="text-[10px]" style={{ color: "#CCCCCC", fontFamily: FONT }}>
                  {colors.length}가지 컬러 추출됨
                </p>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {colorLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="shrink-0 flex flex-col items-center gap-1.5" style={{ minWidth: 48 }}>
                      <div className="rounded-full animate-pulse" style={{ width: 36, height: 36, backgroundColor: "#EEEEEE" }} />
                      <div className="rounded animate-pulse" style={{ width: 30, height: 8, backgroundColor: "#EEEEEE" }} />
                    </div>
                  ))
                : colors.map((c, i) => (
                    <div key={i} className="shrink-0 flex flex-col items-center gap-1.5" style={{ minWidth: 48 }}>
                      <div
                        className="rounded-full"
                        style={{
                          width:     36,
                          height:    36,
                          backgroundColor: c.hex,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.13), inset 0 1px 1px rgba(255,255,255,0.3)",
                          border:    "2px solid rgba(255,255,255,0.9)",
                        }}
                      />
                      <p className="text-[9px] text-center" style={{ color: "#777", fontFamily: FONT, maxWidth: 48 }}>
                        {c.name}
                      </p>
                    </div>
                  ))
              }
            </div>
          </div>
        )}

        {/* ── Style name ── */}
        <div className="px-5 pb-4">
          <p className="text-[11px] font-bold mb-2" style={{ color: "#AAAAAA", fontFamily: FONT, letterSpacing: "0.05em" }}>
            STYLE NAME
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이 코디에 이름을 붙여보세요"
            className="w-full px-4 py-3 rounded-xl text-[14px] font-medium outline-none"
            style={{ backgroundColor: "#F5F5F5", color: DARK, fontFamily: FONT }}
          />
        </div>

        {/* ── Mood selector ── */}
        <div className="px-5 pb-4">
          <p className="text-[11px] font-bold mb-2" style={{ color: "#AAAAAA", fontFamily: FONT, letterSpacing: "0.05em" }}>
            MOOD
          </p>
          <div className="flex flex-wrap gap-2">
            {MOOD_OPTIONS.map((opt) => {
              const isActive = mood === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setMood(isActive ? null : opt.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
                  style={{
                    backgroundColor: isActive ? opt.bg    : "#F5F5F5",
                    color:           isActive ? opt.fg    : "#555",
                    border:          isActive ? `1.5px solid ${opt.bg}` : "1.5px solid transparent",
                    fontFamily:      FONT,
                    transform:       isActive ? "scale(1.04)" : "scale(1)",
                  }}
                >
                  <span style={{ fontSize: 13 }}>{opt.emoji}</span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Private memo ── */}
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[11px] font-bold" style={{ color: "#AAAAAA", fontFamily: FONT, letterSpacing: "0.05em" }}>
              나만의 메모
            </p>
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded"
              style={{ backgroundColor: "#F0F0F0" }}
            >
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <rect x="1" y="4" width="7" height="5" rx="1" stroke="#AAAAAA" strokeWidth="0.9" />
                <path d="M3 4V3a1.5 1.5 0 113 0v1" stroke="#AAAAAA" strokeWidth="0.9" />
              </svg>
              <span className="text-[9px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>비공개</span>
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

        {/* ── Public / private toggle ── */}
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
            style={{
              width: 48, height: 28,
              backgroundColor: isPublic ? YELLOW : "#DDD",
              position: "relative",
            }}
          >
            <div
              className="absolute top-1 rounded-full bg-white"
              style={{
                width: 20, height: 20,
                left:       isPublic ? 24 : 4,
                transition: "left 0.2s",
                boxShadow:  "0 1px 4px rgba(0,0,0,0.18)",
              }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DayRecordSheet ───────────────────────────────────────────────────────────

function DayRecordSheet({ dateStr, record, onSave, onDelete, onClose }) {
  const [selectedIds, setSelectedIds]   = useState(record?.itemIds ?? []);
  const [note,        setNote]          = useState(record?.note    ?? "");
  const [photoUrl,    setPhotoUrl]      = useState(record?.photoUrl ?? null);
  const [catFilter,   setCatFilter]     = useState("전체");
  const [showStylebook, setShowStylebook] = useState(false);
  const fileRef = useRef(null);

  const CATS = ["전체", "상의", "하의", "아우터", "원피스"];
  const displayItems = catFilter === "전체"
    ? CLOSET_ITEMS
    : CLOSET_ITEMS.filter((i) => i.mainCategory === catFilter);

  function toggleItem(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoUrl(ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (selectedIds.length === 0) return;
    onSave(dateStr, { itemIds: selectedIds, note, photoUrl });
  }

  if (showStylebook) {
    return (
      <OutfitCanvasEditor
        initialItemIds={selectedIds}
        dateStr={dateStr}
        onSave={() => {
          setShowStylebook(false);
          onClose();
        }}
        onClose={() => setShowStylebook(false)}
      />
    );
  }

  return (
    <div
      className="absolute inset-0 z-50 flex items-end"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full rounded-t-3xl flex flex-col bg-white"
        style={{ maxHeight: "90%", minHeight: "60%" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "#DDD" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 shrink-0">
          <div>
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase" style={{ color: "#AAAAAA", fontFamily: FONT }}>
              WEAR RECORD
            </p>
            <h3 className="text-[17px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.025em" }}>
              {formatDateLabel(dateStr)}
            </h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ backgroundColor: "#F2F2F2" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 12M12 2L2 12" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Photo + selected items */}
        <div className="px-5 pb-3 shrink-0" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {/* Photo upload */}
            <button
              onClick={() => fileRef.current?.click()}
              className="shrink-0 rounded-xl overflow-hidden flex flex-col items-center justify-center"
              style={{ width: 52, height: 64, backgroundColor: photoUrl ? "transparent" : "#F8F8F8", border: photoUrl ? "none" : "1.5px dashed #DDD" }}
            >
              {photoUrl ? (
                <img src={photoUrl} alt="outfit" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} />
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <rect x="2" y="5" width="16" height="12" rx="2" stroke="#BBBBBB" strokeWidth="1.3" />
                    <circle cx="10" cy="11" r="3" stroke="#BBBBBB" strokeWidth="1.3" />
                    <path d="M7 5L8.5 2.5H11.5L13 5" stroke="#BBBBBB" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  <span className="text-[8px] mt-0.5" style={{ color: "#CCC", fontFamily: FONT }}>사진</span>
                </>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

            {selectedIds.map((id) => {
              const item = CLOSET_ITEMS.find((i) => i.id === id);
              if (!item) return null;
              return (
                <div key={id} className="relative shrink-0 rounded-xl overflow-hidden" style={{ width: 52, height: 64, backgroundColor: "#F5F5F5" }}>
                  {item.image && <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />}
                  <button onClick={() => toggleItem(id)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1 1L7 7M7 1L1 7" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              );
            })}
            {selectedIds.length === 0 && (
              <div className="flex items-center px-2">
                <p className="text-[11px]" style={{ color: "#CCC", fontFamily: FONT }}>아래에서 착용한 아이템을 선택하세요</p>
              </div>
            )}
          </div>
        </div>

        {/* Category filter */}
        <div className="px-5 pt-3 pb-2 shrink-0">
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {CATS.map((cat) => (
              <button key={cat} onClick={() => setCatFilter(cat)}
                className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium"
                style={{ backgroundColor: catFilter === cat ? DARK : "#F2F2F2", color: catFilter === cat ? "white" : "#555", fontFamily: FONT }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Item grid */}
        <div className="flex-1 overflow-y-auto px-5 pb-2" style={{ scrollbarWidth: "none" }}>
          <div className="grid grid-cols-3 gap-2">
            {displayItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <button key={item.id} onClick={() => toggleItem(item.id)}
                  className="relative rounded-xl overflow-hidden"
                  style={{ aspectRatio: "3/4", backgroundColor: "#F5F5F5" }}
                >
                  {item.image && <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />}
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(245,194,0,0.38)" }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: YELLOW }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2.5 7L5.5 10L11.5 4" stroke={DARK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5 pt-6" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)" }}>
                    <p className="text-[8px] font-bold text-white truncate" style={{ fontFamily: FONT }}>{item.displayName ?? item.name}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Note */}
        <div className="px-5 pt-2 pb-2 shrink-0" style={{ borderTop: "1px solid #F4F4F4" }}>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="오늘의 스타일 메모 (선택)"
            className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
            style={{ backgroundColor: "#F5F5F5", color: DARK, fontFamily: FONT }}
          />
        </div>

        {/* CTA row */}
        <div className="px-5 pb-5 pt-2 flex flex-col gap-2 shrink-0">
          <div className="flex gap-3">
            {record && (
              <button onClick={() => onDelete(dateStr)}
                className="flex items-center justify-center px-4 rounded-2xl text-[14px] font-medium shrink-0"
                style={{ height: 50, backgroundColor: "#F5F5F5", color: "#888", fontFamily: FONT }}
              >
                삭제
              </button>
            )}
            <button onClick={handleSave}
              className="flex-1 flex items-center justify-center rounded-2xl font-bold"
              style={{
                height: 50,
                backgroundColor: selectedIds.length > 0 ? YELLOW : "#F5F5F5",
                color:           selectedIds.length > 0 ? DARK   : "#AAAAAA",
                fontFamily:      FONT,
                fontSize:        15,
              }}
            >
              {selectedIds.length > 0 ? `${selectedIds.length}개 아이템 기록하기` : "아이템을 선택해주세요"}
            </button>
          </div>
          {/* Stylebook shortcut */}
          {selectedIds.length >= 1 && (
            <button
              onClick={() => setShowStylebook(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl"
              style={{ backgroundColor: "#F8F8F8", border: `1px solid ${DIVIDER}` }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="2" y="1" width="10" height="12" rx="2" stroke="#888" strokeWidth="1.2" />
                <path d="M5 4H9M5 6.5H9M5 9H7.5" stroke="#888" strokeWidth="1.1" strokeLinecap="round" />
              </svg>
              <span className="text-[12px] font-medium" style={{ color: "#888", fontFamily: FONT }}>스타일북에 추가하기</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TodaySquareCard ──────────────────────────────────────────────────────────

function TodaySquareCard({ todayRecord, onTap }) {
  const hasRecord = !!todayRecord;

  return (
    <div className="px-4 pt-4 pb-3">
      <button
        onClick={onTap}
        className="w-full rounded-2xl overflow-hidden active:opacity-90 transition-opacity"
        style={{
          aspectRatio: "1 / 1",
          maxHeight:   310,
          display:     "block",
          position:    "relative",
          background:  hasRecord
            ? "linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)"
            : "linear-gradient(145deg, #F2F2F2 0%, #E6E6E6 100%)",
        }}
      >
        {/* Background item photos — subtle collage */}
        {hasRecord && todayRecord.photoUrl && (
          <img
            src={todayRecord.photoUrl}
            alt="today"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.35 }}
          />
        )}
        {hasRecord && !todayRecord.photoUrl && todayRecord.itemIds?.length > 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex" }}>
            {todayRecord.itemIds.slice(0, 3).map((id, idx) => {
              const item = CLOSET_ITEMS.find((i) => i.id === id);
              if (!item?.image) return null;
              return (
                <div key={id} style={{ flex: 1, overflow: "hidden", opacity: 0.28 }}>
                  <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
                </div>
              );
            })}
          </div>
        )}

        {/* Dark scrim when recorded */}
        {hasRecord && (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" }} />
        )}

        {/* Edit button — top-right corner when recorded */}
        {hasRecord && (
          <button
            onClick={(e) => { e.stopPropagation(); onTap(); }}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full active:opacity-70"
            style={{
              backgroundColor: "rgba(255,255,255,0.16)",
              backdropFilter:  "blur(10px)",
              border:          "1px solid rgba(255,255,255,0.22)",
              zIndex:          2,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
              <path d="M9.5 2L12 4.5L5.5 11H3V8.5L9.5 2Z" stroke="white" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
            <span className="text-[11px] font-bold text-white" style={{ fontFamily: FONT }}>수정</span>
          </button>
        )}

        {/* Content */}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 22 }}>
          {/* Badge */}
          <div
            className="inline-flex self-start items-center gap-1.5 px-2.5 py-1 rounded-full mb-3"
            style={{ backgroundColor: hasRecord ? "rgba(245,194,0,0.22)" : "rgba(0,0,0,0.07)" }}
          >
            <span style={{ fontSize: 10 }}>{hasRecord ? "✅" : "📷"}</span>
            <span
              className="text-[10px] font-bold"
              style={{ color: hasRecord ? YELLOW : "#555", fontFamily: FONT, letterSpacing: "0.04em" }}
            >
              {hasRecord ? "오늘 기록 완료" : "오늘 착장 기록"}
            </span>
          </div>

          {/* Main text */}
          <h2
            className="text-[26px] font-bold leading-tight"
            style={{ color: hasRecord ? "white" : "#222", fontFamily: FONT, letterSpacing: "-0.04em", whiteSpace: "pre-line" }}
          >
            {hasRecord ? "오늘의\n스타일 완성!" : "오늘은\n무엇을\n입었나요?"}
          </h2>

          {/* Item thumbnails strip */}
          {hasRecord && todayRecord.itemIds?.length > 0 && (
            <div className="flex gap-2 mt-4">
              {todayRecord.itemIds.slice(0, 4).map((id) => {
                const item = CLOSET_ITEMS.find((i) => i.id === id);
                if (!item) return null;
                return (
                  <div key={id} className="rounded-xl overflow-hidden shrink-0" style={{ width: 40, height: 50, backgroundColor: "rgba(255,255,255,0.15)" }}>
                    {item.image && <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />}
                  </div>
                );
              })}
              {todayRecord.itemIds.length > 4 && (
                <div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: 40, height: 50, backgroundColor: "rgba(255,255,255,0.12)" }}>
                  <span className="text-[11px] font-bold text-white" style={{ fontFamily: FONT }}>+{todayRecord.itemIds.length - 4}</span>
                </div>
              )}
            </div>
          )}

          {/* CTA pill */}
          {!hasRecord && (
            <div className="inline-flex self-start items-center gap-1.5 mt-4 px-4 py-2 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.10)" }}>
              <span className="text-[12px] font-bold" style={{ color: "#333", fontFamily: FONT }}>지금 기록하기</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 2.5L7.5 6L4 9.5" stroke={DARK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

// ─── CalendarSection (weekly / monthly) ──────────────────────────────────────

function CalendarSection({ history, onDayTap }) {
  const [mode,  setMode]  = useState("weekly"); // "weekly" | "monthly"
  const today   = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const todayDateStr = todayStr();

  // Weekly strip data (last 7 days)
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({ date: d, dateStr: localDateStr(d) });
    }
    return days;
  }, []);

  // Monthly grid data
  const totalDays = daysInMonth(year, month);
  const firstDay  = firstDayOfWeek(year, month);
  const cells     = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  const isFutureMonth =
    year > today.getFullYear() ||
    (year === today.getFullYear() && month > today.getMonth());

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else             { setMonth((m) => m - 1); }
  }
  function nextMonth() {
    if (isFutureMonth) return;
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else              { setMonth((m) => m + 1); }
  }

  return (
    <div className="mx-4 mb-3 rounded-2xl overflow-hidden" style={{ backgroundColor: "#FAFAFA", border: `1px solid ${DIVIDER}` }}>
      {/* Toggle row */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
        <div className="flex gap-1.5 rounded-xl overflow-hidden" style={{ backgroundColor: "#EEEEEE", padding: 3 }}>
          {["weekly", "monthly"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-4 py-1 rounded-lg text-[12px] font-bold transition-all"
              style={{
                backgroundColor: mode === m ? "white" : "transparent",
                color:           mode === m ? DARK    : "#AAAAAA",
                fontFamily:      FONT,
                boxShadow:       mode === m ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
              }}
            >
              {m === "weekly" ? "주간" : "월간"}
            </button>
          ))}
        </div>
        {mode === "monthly" && (
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-full" style={{ backgroundColor: "#EEEEEE" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M7.5 2L4.5 6L7.5 10" stroke={DARK} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <p className="text-[13px] font-bold" style={{ color: DARK, fontFamily: FONT }}>{year}년 {MONTH_NAMES[month]}</p>
            <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-full" style={{ backgroundColor: isFutureMonth ? "#F5F5F5" : "#EEEEEE", opacity: isFutureMonth ? 0.4 : 1 }} disabled={isFutureMonth}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4.5 2L7.5 6L4.5 10" stroke={DARK} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Weekly view */}
      {mode === "weekly" && (
        <div className="flex px-1 py-2">
          {weekDays.map(({ date, dateStr }, idx) => {
            const isToday = idx === 6;
            const record  = history[dateStr];
            const firstItem = record?.itemIds?.[0]
              ? CLOSET_ITEMS.find((i) => i.id === record.itemIds[0])
              : null;
            const dow = date.getDay();

            return (
              <button key={dateStr} onClick={() => onDayTap(dateStr)} className="flex-1 flex flex-col items-center gap-1 py-2">
                <span className="text-[9px] font-bold" style={{ color: isToday ? YELLOW : dow === 0 ? "#E84040" : dow === 6 ? "#4060E8" : "#AAAAAA", fontFamily: FONT }}>
                  {DAY_NAMES[dow]}
                </span>
                <div className="w-6 h-6 flex items-center justify-center rounded-full" style={{ backgroundColor: isToday ? YELLOW : "transparent" }}>
                  <span className="text-[11px] font-bold" style={{ color: isToday ? DARK : "#444", fontFamily: FONT }}>{date.getDate()}</span>
                </div>
                <div className="rounded-lg overflow-hidden" style={{ width: 30, height: 36, backgroundColor: record ? "#E8E8E8" : "transparent" }}>
                  {firstItem?.image ? (
                    <img src={firstItem.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
                  ) : record ? (
                    <div className="w-full h-full flex items-center justify-center"><span style={{ fontSize: 12 }}>👗</span></div>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Monthly view */}
      {mode === "monthly" && (
        <div className="px-2 pb-3">
          {/* Day-of-week header */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_NAMES.map((d, i) => (
              <div key={d} className="flex items-center justify-center py-1.5">
                <span className="text-[10px] font-bold" style={{ color: i === 0 ? "#E84040" : i === 6 ? "#4060E8" : "#BBBBBB", fontFamily: FONT }}>{d}</span>
              </div>
            ))}
          </div>
          {/* Grid */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (day === null) return <div key={`pad-${idx}`} style={{ height: 64 }} />;
              const dateStr   = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isFuture  = dateStr > todayDateStr;
              const isToday   = dateStr === todayDateStr;
              const rec       = history[dateStr];
              const hasRecord = !!rec;
              const dow       = new Date(dateStr + "T12:00:00").getDay();
              // Compute thumbnail URL: prefer photoUrl, else first item image
              const thumbUrl  = hasRecord
                ? (rec.photoUrl ?? (() => {
                    const firstId = rec.itemIds?.[0];
                    return firstId ? (CLOSET_ITEMS.find((i) => i.id === firstId)?.image ?? null) : null;
                  })())
                : null;
              return (
                <button
                  key={dateStr}
                  onClick={() => !isFuture && onDayTap(dateStr)}
                  className="flex flex-col items-center"
                  style={{ height: 64, paddingTop: 5, opacity: isFuture ? 0.3 : 1 }}
                >
                  <div
                    className="w-6 h-6 flex items-center justify-center rounded-full"
                    style={{ backgroundColor: isToday ? YELLOW : "transparent" }}
                  >
                    <span className="text-[10px] font-bold" style={{ color: isToday ? DARK : dow === 0 ? "#E84040" : dow === 6 ? "#4060E8" : "#444", fontFamily: FONT }}>
                      {day}
                    </span>
                  </div>
                  {/* Style thumbnail — same visual language as weekly strip */}
                  <div
                    className="mt-1 rounded overflow-hidden"
                    style={{ width: 22, height: 26, backgroundColor: hasRecord ? "#E4E4E4" : "transparent" }}
                  >
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
                      />
                    ) : hasRecord ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <span style={{ fontSize: 10 }}>👗</span>
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Charts ───────────────────────────────────────────────────────────────────

function DonutChart({ data, total }) {
  const R = 38;
  const cx = 50, cy = 50;
  const circumference = 2 * Math.PI * R;
  let offsetSoFar = 0;

  const segments = data.map((d) => {
    const pct    = total > 0 ? d.count / total : 0;
    const length = pct * circumference;
    const seg    = { ...d, offset: offsetSoFar, length };
    offsetSoFar += length;
    return seg;
  });

  return (
    <svg viewBox="0 0 100 100" style={{ width: 120, height: 120 }}>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#F2F2F2" strokeWidth="14" />
      {segments.filter((s) => s.length > 0).map((seg) => (
        <circle
          key={seg.label}
          cx={cx} cy={cy} r={R}
          fill="none"
          stroke={seg.color}
          strokeWidth="14"
          strokeDasharray={`${seg.length} ${circumference - seg.length}`}
          strokeDashoffset={`${-(seg.offset - circumference / 4)}`}
        />
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="16" fontWeight="bold" fill={DARK} fontFamily={FONT}>{total}</text>
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize="7" fill="#AAAAAA" fontFamily={FONT}>아이템</text>
    </svg>
  );
}

function InsightsSection({ onMore }) {
  // Category distribution from CLOSET_ITEMS
  const catData = useMemo(() => {
    const counts = {};
    CLOSET_ITEMS.forEach((item) => {
      const cat = item.mainCategory ?? "기타";
      counts[cat] = (counts[cat] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count, color: CAT_COLORS[label] ?? "#CCC" }))
      .sort((a, b) => b.count - a.count);
  }, []);

  const total = CLOSET_ITEMS.length;

  return (
    <div className="mx-4 mb-4 rounded-2xl overflow-hidden" style={{ border: `1px solid ${DIVIDER}`, backgroundColor: "white" }}>
      <div className="px-4 pt-4 pb-2 flex items-center justify-between" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#AAAAAA", fontFamily: FONT }}>MY CLOSET INSIGHTS</p>
          <h3 className="text-[15px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>내 옷장 인사이트</h3>
        </div>
        <button
          onClick={onMore}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full active:opacity-70"
          style={{ backgroundColor: "#F2F2F2" }}
        >
          <span className="text-[12px] font-medium" style={{ color: "#666", fontFamily: FONT }}>더보기</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4.5 2L7.5 6L4.5 10" stroke="#888" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="flex px-4 pt-4 pb-4 gap-5">
        {/* Donut chart */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <DonutChart data={catData} total={total} />
          <p className="text-[10px] text-center" style={{ color: "#AAAAAA", fontFamily: FONT }}>카테고리 분포</p>
        </div>

        {/* Category legend */}
        <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
          {catData.slice(0, 5).map((d) => {
            const pct = Math.round((d.count / total) * 100);
            return (
              <div key={d.label} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-[11px] truncate" style={{ color: "#555", fontFamily: FONT, flex: 1 }}>{d.label}</span>
                <span className="text-[11px] font-bold shrink-0" style={{ color: DARK, fontFamily: FONT }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

// ─── InsightsDetailScreen ─────────────────────────────────────────────────────
// Full-screen overlay with expanded closet analytics.

function InsightsDetailScreen({ onBack }) {
  // ── Data ──────────────────────────────────────────────────────────────────
  const total       = CLOSET_ITEMS.length;
  const wearFreq    = useMemo(() => getItemWearFrequency(), []);
  const lastWornMap = useMemo(() => getItemLastWornDates(), []);
  const todayLocal  = useMemo(() => localDateStr(new Date()), []);

  // Category distribution
  const catData = useMemo(() => {
    const counts = {};
    CLOSET_ITEMS.forEach((item) => {
      const cat = item.mainCategory ?? "기타";
      counts[cat] = (counts[cat] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count, color: CAT_COLORS[label] ?? "#CCC" }))
      .sort((a, b) => b.count - a.count);
  }, []);

  // Category wear frequency (all categories)
  const catWearData = useMemo(() => {
    const catFreq = {};
    wearFreq.forEach((count, itemId) => {
      const item = CLOSET_ITEMS.find((i) => i.id === itemId);
      if (!item) return;
      const cat = item.mainCategory ?? "기타";
      catFreq[cat] = (catFreq[cat] ?? 0) + count;
    });
    return Object.entries(catFreq)
      .map(([label, count]) => ({ label, count, color: CAT_COLORS[label] ?? "#CCC", emoji: MAIN_CATEGORIES.find((c) => c.label === label)?.emoji ?? "👗" }))
      .sort((a, b) => b.count - a.count);
  }, [wearFreq]);

  // Top worn items
  const topWorn = useMemo(() =>
    CLOSET_ITEMS
      .filter((item) => wearFreq.has(item.id))
      .sort((a, b) => (wearFreq.get(b.id) ?? 0) - (wearFreq.get(a.id) ?? 0))
      .slice(0, 6)
      .map((item) => ({ item, count: wearFreq.get(item.id) ?? 0 })),
  [wearFreq]);

  // Dormant items (never worn or last worn 30+ days ago)
  const dormantItems = useMemo(() =>
    CLOSET_ITEMS.filter((item) => {
      const lw = lastWornMap.get(item.id);
      if (!lw) return true;
      return Math.floor((new Date(todayLocal) - new Date(lw + "T12:00:00")) / 86400000) >= 30;
    }).length,
  [lastWornMap, todayLocal]);

  // Brand top 5
  const brandData = useMemo(() => {
    const counts = {};
    CLOSET_ITEMS.forEach((item) => {
      const b = item.brand ?? "기타";
      counts[b] = (counts[b] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, []);

  // Season distribution
  const seasonData = useMemo(() => {
    const counts = { 봄: 0, 여름: 0, 가을: 0, 겨울: 0 };
    CLOSET_ITEMS.forEach((item) => {
      (item.season ?? []).forEach((s) => { if (counts[s] !== undefined) counts[s]++; });
    });
    return Object.entries(counts).map(([label, count]) => ({ label, count }));
  }, []);

  // Worn vs not-worn counts
  const wornCount    = CLOSET_ITEMS.filter((i) => wearFreq.has(i.id)).length;
  const laundryCount = getItemsNeedingWash(2).length;

  const maxCatWear  = catWearData[0]?.count  ?? 1;
  const maxBrand    = brandData[0]?.[1]       ?? 1;
  const maxSeason   = Math.max(...seasonData.map((s) => s.count), 1);
  const SEASON_CLR  = { 봄: "#FFB7C5", 여름: "#80D8A0", 가을: "#F5A843", 겨울: "#87B5E8" };

  return (
    <div className="absolute inset-0 z-[70] flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 shrink-0"
        style={{ height: 52, borderBottom: `1px solid ${DIVIDER}` }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full active:opacity-70"
          style={{ backgroundColor: "#F2F2F2" }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#AAAAAA", fontFamily: FONT }}>MY CLOSET INSIGHTS</p>
          <h2 className="text-[15px] font-bold leading-tight" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>내 옷장 인사이트</h2>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <div className="px-4 pt-4 pb-8 flex flex-col gap-5">

          {/* ── Summary cards row ── */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: "총 아이템",    value: total,         unit: "개",  color: "#1a1a1a", bg: "#F8F8F8" },
              { label: "착용 아이템",  value: wornCount,     unit: "개",  color: "#2E7D32", bg: "#E8F5E9" },
              { label: "미착용 아이템", value: dormantItems,  unit: "개",  color: "#C62828", bg: "#FDE8E8" },
              { label: "세탁 필요",    value: laundryCount,  unit: "개",  color: "#E65100", bg: "#FFF3E0" },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl px-4 py-3.5" style={{ backgroundColor: card.bg }}>
                <p className="text-[26px] font-bold leading-none" style={{ color: card.color, fontFamily: FONT, letterSpacing: "-0.04em" }}>
                  {card.value}<span className="text-[14px] font-medium ml-1">{card.unit}</span>
                </p>
                <p className="text-[11px] mt-1" style={{ color: "rgba(0,0,0,0.48)", fontFamily: FONT }}>{card.label}</p>
              </div>
            ))}
          </div>

          {/* ── Category distribution ── */}
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${DIVIDER}` }}>
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
              <p className="text-[12px] font-bold" style={{ color: DARK, fontFamily: FONT }}>카테고리 분포</p>
            </div>
            <div className="px-4 py-4 flex gap-5 items-center">
              <DonutChart data={catData} total={total} />
              <div className="flex-1 flex flex-col gap-2 min-w-0">
                {catData.map((d) => {
                  const pct = Math.round((d.count / total) * 100);
                  return (
                    <div key={d.label} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-[11px] flex-1 truncate" style={{ color: "#555", fontFamily: FONT }}>{d.label}</span>
                      <span className="text-[10px] shrink-0" style={{ color: "#AAA", fontFamily: FONT }}>{d.count}개</span>
                      <span className="text-[11px] font-bold shrink-0 w-8 text-right" style={{ color: DARK, fontFamily: FONT }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Category wear frequency ── */}
          {catWearData.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${DIVIDER}` }}>
              <div className="px-4 py-3" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
                <p className="text-[12px] font-bold" style={{ color: DARK, fontFamily: FONT }}>카테고리별 착용 횟수</p>
              </div>
              <div className="px-4 py-4 flex flex-col gap-2.5">
                {catWearData.map((d) => (
                  <div key={d.label} className="flex items-center gap-2">
                    <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{d.emoji}</span>
                    <span className="text-[11px] shrink-0" style={{ color: "#555", fontFamily: FONT, width: 36 }}>{d.label}</span>
                    <div className="flex-1 rounded-full overflow-hidden" style={{ height: 8, backgroundColor: "#F0F0F0" }}>
                      <div className="h-full rounded-full" style={{ width: `${(d.count / maxCatWear) * 100}%`, backgroundColor: d.color, transition: "width 0.4s" }} />
                    </div>
                    <span className="text-[11px] font-bold shrink-0 w-8 text-right" style={{ color: DARK, fontFamily: FONT }}>{d.count}회</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Top worn items ── */}
          {topWorn.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${DIVIDER}` }}>
              <div className="px-4 py-3" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
                <p className="text-[12px] font-bold" style={{ color: DARK, fontFamily: FONT }}>자주 입는 아이템 TOP {topWorn.length}</p>
              </div>
              <div className="px-4 py-4 grid grid-cols-3 gap-3">
                {topWorn.map(({ item, count }, rank) => (
                  <div key={item.id} className="flex flex-col">
                    <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "3/4", backgroundColor: "#F5F5F5" }}>
                      {item.image && <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />}
                      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: rank < 3 ? YELLOW : "#E8E8E8" }}>
                        <span className="text-[8px] font-bold" style={{ color: rank < 3 ? DARK : "#666", fontFamily: FONT }}>{count}회</span>
                      </div>
                    </div>
                    <p className="text-[10px] font-medium mt-1 truncate" style={{ color: DARK, fontFamily: FONT }}>{item.displayName ?? item.name}</p>
                    <p className="text-[9px] truncate" style={{ color: "#AAAAAA", fontFamily: FONT }}>{item.brand}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Brand distribution ── */}
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${DIVIDER}` }}>
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
              <p className="text-[12px] font-bold" style={{ color: DARK, fontFamily: FONT }}>브랜드 TOP 5</p>
            </div>
            <div className="px-4 py-4 flex flex-col gap-2.5">
              {brandData.map(([brand, count], i) => (
                <div key={brand} className="flex items-center gap-2.5">
                  <span className="text-[10px] font-bold w-4 text-right shrink-0" style={{ color: i < 3 ? "#A07800" : "#BBBBBB", fontFamily: FONT }}>{i + 1}</span>
                  <span className="text-[11px] flex-1 truncate" style={{ color: "#444", fontFamily: FONT }}>{brand}</span>
                  <div className="rounded-full overflow-hidden" style={{ width: 80, height: 7, backgroundColor: "#F0F0F0" }}>
                    <div className="h-full rounded-full" style={{ width: `${(count / maxBrand) * 100}%`, backgroundColor: i === 0 ? YELLOW : i === 1 ? "#DDCF80" : "#E8E8E8" }} />
                  </div>
                  <span className="text-[11px] font-bold shrink-0 w-8 text-right" style={{ color: DARK, fontFamily: FONT }}>{count}개</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Season distribution ── */}
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${DIVIDER}` }}>
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
              <p className="text-[12px] font-bold" style={{ color: DARK, fontFamily: FONT }}>시즌 분포</p>
              <p className="text-[10px] mt-0.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>아이템은 여러 시즌에 중복 집계돼요</p>
            </div>
            <div className="px-4 py-4 grid grid-cols-4 gap-2">
              {seasonData.map(({ label, count }) => (
                <div key={label} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-xl flex items-end justify-center pb-1.5"
                    style={{ height: 60, backgroundColor: SEASON_CLR[label] + "33" }}
                  >
                    <div
                      className="w-5 rounded-lg"
                      style={{ height: `${Math.max(8, (count / maxSeason) * 40)}px`, backgroundColor: SEASON_CLR[label] }}
                    />
                  </div>
                  <p className="text-[11px] font-bold" style={{ color: DARK, fontFamily: FONT }}>{label}</p>
                  <p className="text-[10px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>{count}개</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Dormant items summary ── */}
          <div
            className="rounded-2xl px-4 py-4 flex items-center gap-4"
            style={{ backgroundColor: "#FFF8F0", border: "1px solid #FFE0B2" }}
          >
            <span style={{ fontSize: 32, lineHeight: 1 }}>🧊</span>
            <div>
              <p className="text-[14px] font-bold" style={{ color: DARK, fontFamily: FONT }}>
                {dormantItems}개의 아이템이 쉬고 있어요
              </p>
              <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "#888", fontFamily: FONT }}>
                30일 이상 착용 기록이 없는 아이템이에요.{"\n"}옷장 앞자리로 꺼내보는 건 어떨까요?
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── StatsRow ─────────────────────────────────────────────────────────────────

function StatsRow({ stats, onStatTap }) {
  const items = [
    { key: "streak", label: "연속 기록",     value: `${stats.streak}일`,      accent: true },
    { key: "days",   label: "총 기록일",     value: `${stats.totalDays}일`              },
    { key: "items",  label: "기록된 아이템", value: `${stats.totalItems}개`             },
  ];
  return (
    <div
      className="mx-4 mb-4 rounded-2xl flex"
      style={{ backgroundColor: "#FEFCE8", border: "1.5px solid #EDD83A" }}
    >
      {items.map((item, i) => (
        <button
          key={item.label}
          onClick={() => onStatTap?.(item.key)}
          className="flex-1 flex flex-col items-center py-4 relative active:opacity-70 transition-opacity"
        >
          {i > 0 && <div className="absolute left-0 top-2 bottom-2" style={{ width: 1, backgroundColor: "rgba(0,0,0,0.08)" }} />}
          <p className="text-[20px] font-bold" style={{ color: item.accent ? "#A07800" : DARK, fontFamily: FONT, letterSpacing: "-0.04em" }}>{item.value}</p>
          <p className="text-[9px] mt-0.5" style={{ color: "rgba(0,0,0,0.42)", fontFamily: FONT }}>{item.label}</p>
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ marginTop: 3 }}>
            <path d="M3.5 2L6.5 4.5L3.5 7" stroke="rgba(0,0,0,0.22)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// ─── StreakDetailScreen ────────────────────────────────────────────────────────

function StreakDetailScreen({ stats, history, onBack }) {
  const streak = stats.streak;

  const milestones = [
    { days: 3,  label: "첫 습관",     emoji: "🌱" },
    { days: 7,  label: "일주일",      emoji: "🔥" },
    { days: 14, label: "2주 달성",    emoji: "⭐" },
    { days: 30, label: "한 달 챌린지", emoji: "🏆" },
  ];

  // Last 14 days activity grid
  const today = new Date();
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    const dateStr = localDateStr(d);
    return { dateStr, date: d, hasRecord: !!history[dateStr] };
  });

  return (
    <div className="absolute inset-0 z-[70] flex flex-col bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-4 shrink-0" style={{ height: 52, borderBottom: `1px solid ${DIVIDER}` }}>
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full active:opacity-70" style={{ backgroundColor: "#F2F2F2" }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#AAAAAA", fontFamily: FONT }}>STREAK</p>
          <h2 className="text-[15px] font-bold leading-tight" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>연속 기록 현황</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>

        {/* Streak hero */}
        <div className="rounded-2xl px-6 py-8 flex flex-col items-center text-center" style={{ backgroundColor: "#FEFCE8", border: "1.5px solid #EDD83A" }}>
          <p className="text-[72px] font-bold leading-none" style={{ color: "#A07800", fontFamily: FONT, letterSpacing: "-0.05em" }}>{streak}</p>
          <p className="text-[17px] font-bold mt-2" style={{ color: DARK, fontFamily: FONT }}>일 연속 기록 중</p>
          <p className="text-[12px] mt-1.5 leading-relaxed" style={{ color: "#888", fontFamily: FONT }}>
            오늘도 기록하면 {streak + 1}일이 돼요!
          </p>
        </div>

        {/* All-time stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "총 기록일",     value: stats.totalDays,  unit: "일" },
            { label: "기록된 아이템", value: stats.totalItems, unit: "개" },
          ].map((c) => (
            <div key={c.label} className="rounded-xl px-4 py-3.5" style={{ backgroundColor: "#F8F8F8" }}>
              <p className="text-[24px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.04em" }}>
                {c.value}<span className="text-[13px] font-medium ml-1">{c.unit}</span>
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>{c.label}</p>
            </div>
          ))}
        </div>

        {/* 14-day activity */}
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${DIVIDER}` }}>
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
            <p className="text-[12px] font-bold" style={{ color: DARK, fontFamily: FONT }}>최근 14일 활동</p>
          </div>
          <div className="px-4 py-4 flex gap-2">
            {last14.map(({ dateStr, date, hasRecord }) => (
              <div key={dateStr} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-md"
                  style={{ aspectRatio: "1", backgroundColor: hasRecord ? YELLOW : "#F0F0F0" }}
                />
                <span className="text-[8px]" style={{ color: "#CCCCCC", fontFamily: FONT }}>{date.getDate()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Milestone badges */}
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${DIVIDER}` }}>
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
            <p className="text-[12px] font-bold" style={{ color: DARK, fontFamily: FONT }}>달성 뱃지</p>
            <p className="text-[10px] mt-0.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>총 기록일 기준으로 달성돼요</p>
          </div>
          <div className="px-4 py-4 grid grid-cols-4 gap-3">
            {milestones.map((m) => {
              const achieved = stats.totalDays >= m.days;
              return (
                <div key={m.days} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{
                      backgroundColor: achieved ? "#FEFCE8" : "#F5F5F5",
                      border: achieved ? "1.5px solid #EDD83A" : "1.5px solid transparent",
                    }}
                  >
                    <span style={{ fontSize: 26, opacity: achieved ? 1 : 0.28 }}>{m.emoji}</span>
                  </div>
                  <p className="text-[10px] font-bold text-center" style={{ color: achieved ? "#A07800" : "#CCCCCC", fontFamily: FONT }}>{m.days}일</p>
                  <p className="text-[9px] text-center" style={{ color: achieved ? "#888" : "#CCCCCC", fontFamily: FONT }}>{m.label}</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle, emoji }) {
  return (
    <div className="flex items-center gap-2 px-4 pb-2.5">
      {emoji && <span style={{ fontSize: 18 }}>{emoji}</span>}
      <div>
        <h2 className="text-[15px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>{title}</h2>
        {subtitle && <p className="text-[11px] mt-0.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Style Insights Banner ────────────────────────────────────────────────────
// Wraps StatsRow with a section header + subtitle.

function StyleInsightsBanner({ stats, onStatTap }) {
  return (
    <div className="pb-2">
      <div className="px-4 pb-3 pt-1">
        <p className="text-[10px] font-bold tracking-[0.12em] uppercase mb-0.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>
          STYLE INSIGHTS
        </p>
        <h2 className="text-[16px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>
          스타일 인사이트
        </h2>
        <p className="text-[12px] mt-0.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>
          매일 기록을 통해 내 스타일을 파악할 수 있어요!
        </p>
      </div>
      <StatsRow stats={stats} onStatTap={onStatTap} />
    </div>
  );
}

// ─── Streak Banner ─────────────────────────────────────────────────────────────
// Compact section below the calendar that shows the active streak.

function StreakBanner({ stats, onTap }) {
  const streak = stats.streak;
  const next   = streak + 1;

  return (
    <div className="mx-4 mb-4">
      <button
        onClick={onTap}
        className="w-full rounded-2xl px-5 py-4 flex items-center justify-between active:opacity-80"
        style={{ backgroundColor: "#FEFCE8", border: "1.5px solid #EDD83A" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: streak > 0 ? "#F5C200" : "#F5F5F5" }}
          >
            <span style={{ fontSize: 22 }}>{streak > 0 ? "🔥" : "🌱"}</span>
          </div>
          <div className="text-left">
            <p className="text-[16px] font-bold" style={{ color: "#A07800", fontFamily: FONT, letterSpacing: "-0.03em" }}>
              {streak}일 연속 기록
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "#888", fontFamily: FONT }}>
              {streak > 0
                ? `오늘도 기록하면 ${next}일이 돼요!`
                : "오늘 기록을 시작해보세요!"}
            </p>
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 3L11 8L6 13" stroke="#CCA800" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

// ─── My Stylebooks Screen ─────────────────────────────────────────────────────
// Full-screen overlay: shows all saved stylebooks. Launched from Record page.

function MyStylebooksScreen({ onBack, onItemTap }) {
  const [coordiList,    setCoordiList]    = useState(() => getAllCoordi());
  const [detailOpen,    setDetailOpen]    = useState(null);  // coordi object
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [coordiRefresh, setCoordiRefresh] = useState(0);

  useEffect(() => {
    setCoordiList(getAllCoordi());
  }, [coordiRefresh]);

  function handleDelete(id) {
    deleteCoordi(id);
    setCoordiRefresh((n) => n + 1);
    setDeleteConfirm(null);
    if (detailOpen?.id === id) setDetailOpen(null);
  }

  return (
    <div className="absolute inset-0 z-[70] flex flex-col bg-white overflow-hidden">

      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 shrink-0"
        style={{ height: 52, borderBottom: `1px solid ${DIVIDER}` }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full active:opacity-70"
          style={{ backgroundColor: "#F2F2F2" }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#AAAAAA", fontFamily: FONT }}>
            MY STYLEBOOK
          </p>
          <h2 className="text-[15px] font-bold leading-tight" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>
            나의 스타일북
          </h2>
        </div>
        <span
          className="px-2 py-0.5 rounded-full text-[11px] font-bold"
          style={{ backgroundColor: "#F2F2F2", color: "#888", fontFamily: FONT }}
        >
          {coordiList.length}개
        </span>
      </div>

      {/* Grid body */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {coordiList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 gap-4">
            <span style={{ fontSize: 52, opacity: 0.25 }}>✨</span>
            <p className="text-[15px] font-bold text-center" style={{ color: "#BBBBBB", fontFamily: FONT }}>
              아직 저장된 스타일북이 없어요
            </p>
            <p className="text-[12px] text-center leading-relaxed" style={{ color: "#CCCCCC", fontFamily: FONT }}>
              착장을 기록하고 스타일북에 추가해보세요
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 px-4 py-4">
            {coordiList.map((c) => (
              <div key={c.id} className="relative">
                <button
                  onClick={() => setDetailOpen(c)}
                  className="w-full rounded-2xl overflow-hidden active:opacity-80"
                  style={{ aspectRatio: "3/4", backgroundColor: c.bgColor || "#F2F2F2", display: "block", position: "relative" }}
                >
                  {c.thumbnail ? (
                    <img src={c.thumbnail} alt={c.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span style={{ fontSize: 40, opacity: 0.18 }}>👗</span>
                    </div>
                  )}
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%)" }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
                    <p className="text-white text-[12px] font-bold truncate" style={{ fontFamily: FONT }}>
                      {c.title || "제목 없음"}
                    </p>
                    <p className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.55)", fontFamily: FONT }}>
                      {c.dateStr || (c.updatedAt ? new Date(c.updatedAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" }) : "")}
                    </p>
                  </div>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm(c.id); }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 2L8 8M8 2L2 8" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ height: 24 }} />
      </div>

      {/* Stylebook detail overlay */}
      {detailOpen && (
        <StylebookDetailScreen
          coordi={detailOpen}
          onBack={() => setDetailOpen(null)}
          onDelete={(id) => handleDelete(id)}
          onItemTap={onItemTap}
        />
      )}

      {/* Delete confirm sheet */}
      {deleteConfirm && (
        <div className="absolute inset-0 z-[80] flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="w-full rounded-t-3xl px-5 pt-6 pb-8 bg-white">
            <p className="text-[16px] font-bold text-center mb-1" style={{ color: DARK, fontFamily: FONT }}>스타일을 삭제할까요?</p>
            <p className="text-[12px] text-center mb-6" style={{ color: "#AAAAAA", fontFamily: FONT }}>삭제한 스타일은 복구할 수 없어요</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 h-12 rounded-xl text-[14px] font-medium" style={{ backgroundColor: "#F5F5F5", color: "#888", fontFamily: FONT }}>취소</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 h-12 rounded-xl text-[14px] font-bold" style={{ backgroundColor: "#E84040", color: "white", fontFamily: FONT }}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Recent Records ───────────────────────────────────────────────────────────

function RecentRecordsSection({ records, onTap }) {
  if (records.length === 0) return null;

  // Per-record, pick the first item whose image hasn't been used by a previous record.
  // Prevents consecutive records with the same lead item from looking identical.
  const shownImages = new Set();
  const recordsWithThumb = records.map(({ dateStr, itemIds, note, photoUrl }) => {
    let thumbItem = null;
    if (!photoUrl && itemIds?.length) {
      for (const id of itemIds) {
        const candidate = CLOSET_ITEMS.find((i) => i.id === id);
        if (candidate?.image && !shownImages.has(candidate.image)) {
          thumbItem = candidate;
          shownImages.add(candidate.image);
          break;
        }
      }
      // Fallback: if all images were seen, just use the first item
      if (!thumbItem) {
        thumbItem = CLOSET_ITEMS.find((i) => i.id === itemIds[0]) ?? null;
      }
    }
    return { dateStr, itemIds, note, photoUrl, thumbItem };
  });

  return (
    <div className="pb-4">
      <SectionHeader title="최근 기록" emoji="📅" subtitle="최근 착용 기록" />
      <div className="flex gap-3 overflow-x-auto px-4" style={{ scrollbarWidth: "none" }}>
        {recordsWithThumb.map(({ dateStr, itemIds, note, photoUrl, thumbItem }) => {
          const [, mo, dy] = dateStr.split("-").map(Number);
          const dow        = new Date(dateStr + "T12:00:00").getDay();
          const firstItem  = thumbItem;

          return (
            <button key={dateStr} onClick={() => onTap(dateStr)}
              className="shrink-0 rounded-2xl overflow-hidden active:opacity-90"
              style={{ width: 110, backgroundColor: "#F8F8F8", border: `1px solid #EBEBEB` }}
            >
              <div style={{ height: 120, backgroundColor: "#EFEFEF", position: "relative" }}>
                {photoUrl ? (
                  <img src={photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : firstItem?.image ? (
                  <img src={firstItem.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><span style={{ fontSize: 30 }}>👗</span></div>
                )}
                {itemIds?.length > 1 && (
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
                    <span className="text-[9px] font-bold text-white" style={{ fontFamily: FONT }}>{itemIds.length}개</span>
                  </div>
                )}
              </div>
              <div className="px-2.5 py-2">
                <p className="text-[11px] font-bold" style={{ color: DARK, fontFamily: FONT }}>{mo}/{dy} ({DAY_NAMES[dow]})</p>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: note ? "#888" : "#CCC", fontFamily: FONT }}>{note || "메모 없음"}</p>
              </div>
            </button>
          );
        })}
        <div className="shrink-0 w-1" />
      </div>
    </div>
  );
}

// ─── Most Worn ────────────────────────────────────────────────────────────────

function MostWornSection({ onItemTap }) {
  const sorted = useMemo(() => {
    const freq = getItemWearFrequency();
    return dedupeByImage(
      CLOSET_ITEMS
        .filter((item) => freq.has(item.id))
        .sort((a, b) => (freq.get(b.id) ?? 0) - (freq.get(a.id) ?? 0))
    ).slice(0, 8).map((item) => ({ item, count: freq.get(item.id) ?? 0 }));
  }, []);

  if (sorted.length === 0) return null;
  return (
    <div className="pb-4">
      <SectionHeader title="자주 입은 옷" emoji="🔥" subtitle="착용 기록 기준 상위 아이템" />
      <div className="flex gap-3 overflow-x-auto px-4" style={{ scrollbarWidth: "none" }}>
        {sorted.map(({ item, count }) => (
          <button key={item.id} onClick={() => onItemTap?.(item)} className="shrink-0 active:opacity-90" style={{ width: 86 }}>
            <div className="rounded-xl overflow-hidden relative" style={{ height: 108, backgroundColor: "#F5F5F5" }}>
              {item.image && <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />}
              <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: YELLOW }}>
                <span className="text-[8px] font-bold" style={{ color: DARK, fontFamily: FONT }}>{count}회</span>
              </div>
            </div>
            <p className="text-[10px] font-medium mt-1.5 truncate text-left" style={{ color: DARK, fontFamily: FONT }}>{item.displayName ?? item.name}</p>
            <p className="text-[9px] truncate text-left" style={{ color: "#AAAAAA", fontFamily: FONT }}>{item.brand}</p>
          </button>
        ))}
        <div className="shrink-0 w-1" />
      </div>
    </div>
  );
}

// ─── Laundry Section ─────────────────────────────────────────────────────────

function LaundrySection({ onItemTap }) {
  const [washConfirm, setWashConfirm] = useState(null);
  const [refreshKey,  setRefreshKey]  = useState(0);

  const laundryItems = useMemo(() => {
    return getItemsNeedingWash(2) // threshold = 2 wears
      .map(({ itemId, wearsSinceWash, lastWashedAt }) => ({
        item:           CLOSET_ITEMS.find((i) => i.id === itemId),
        wearsSinceWash,
        lastWashedAt,
      }))
      .filter((d) => !!d.item)
      .slice(0, 8);
  }, [refreshKey]); // eslint-disable-line

  if (laundryItems.length === 0) return null;

  function handleWashed(itemId) {
    markWashed(itemId);
    setRefreshKey((k) => k + 1);
    setWashConfirm(null);
  }

  return (
    <div className="pb-4">
      <SectionHeader title="세탁 관리" emoji="🧺" subtitle={`${laundryItems.length}개 아이템이 세탁 타임 — 완료 표시로 착용 횟수를 리셋하세요`} />
      <div className="flex gap-3 overflow-x-auto px-4" style={{ scrollbarWidth: "none" }}>
        {laundryItems.map(({ item, wearsSinceWash }) => {
          const status = getLaundryStatus(item.id);
          return (
            <div key={item.id} className="shrink-0" style={{ width: 90 }}>
              <button
                onClick={() => onItemTap?.(item)}
                className="w-full rounded-xl overflow-hidden relative active:opacity-90"
                style={{ height: 110, backgroundColor: "#F5F5F5", display: "block" }}
              >
                {item.image && <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />}
                {/* Laundry badge */}
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: status.color }}>
                  <span className="text-[8px] font-bold text-white" style={{ fontFamily: FONT }}>
                    {wearsSinceWash}회 착용
                  </span>
                </div>
              </button>
              <p className="text-[9px] font-bold mt-1 truncate" style={{ color: status.color, fontFamily: FONT }}>{status.label}</p>
              <button
                onClick={() => setWashConfirm(item.id)}
                className="mt-1 w-full text-[9px] font-medium py-1 rounded-lg"
                style={{ backgroundColor: "#F0F0F0", color: "#888", fontFamily: FONT }}
              >
                세탁 완료
              </button>
            </div>
          );
        })}
        <div className="shrink-0 w-1" />
      </div>

      {/* Wash confirmation mini sheet */}
      {washConfirm && (
        <div className="absolute inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="w-full rounded-t-3xl px-5 pt-5 pb-8" style={{ backgroundColor: "white" }}>
            <p className="text-[16px] font-bold text-center mb-1" style={{ color: DARK, fontFamily: FONT }}>세탁 완료로 기록할까요?</p>
            <p className="text-[12px] text-center mb-5" style={{ color: "#AAAAAA", fontFamily: FONT }}>오늘 날짜로 세탁 기록이 저장됩니다</p>
            <div className="flex gap-3">
              <button onClick={() => setWashConfirm(null)} className="flex-1 h-12 rounded-xl text-[14px] font-medium" style={{ backgroundColor: "#F5F5F5", color: "#888", fontFamily: FONT }}>취소</button>
              <button onClick={() => handleWashed(washConfirm)} className="flex-1 h-12 rounded-xl text-[14px] font-bold" style={{ backgroundColor: "#4CAF50", color: "white", fontFamily: FONT }}>세탁 완료 ✓</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Not Worn ─────────────────────────────────────────────────────────────────

function NotWornSection({ onItemTap }) {
  const sorted = useMemo(() => {
    const lastWorn  = getItemLastWornDates();
    const today     = localDateStr(new Date());
    return dedupeByImage(
      CLOSET_ITEMS
        .map((item) => ({
          item,
          daysSince: lastWorn.has(item.id)
            ? Math.floor((new Date(today) - new Date(lastWorn.get(item.id) + "T12:00:00")) / 86400000)
            : 999,
        }))
        .sort((a, b) => b.daysSince - a.daysSince)
        .map((d) => d.item)
    ).slice(0, 8);
  }, []);

  const lastWorn = getItemLastWornDates();
  const today    = localDateStr(new Date());

  return (
    <div className="pb-5">
      <SectionHeader title="오래 안 입은 옷" emoji="🧊" subtitle="착용 기록 없는 아이템들" />
      <div className="flex gap-3 overflow-x-auto px-4" style={{ scrollbarWidth: "none" }}>
        {sorted.map((item) => {
          const daysSince = lastWorn.has(item.id)
            ? Math.floor((new Date(today) - new Date(lastWorn.get(item.id) + "T12:00:00")) / 86400000)
            : 999;
          return (
            <button key={item.id} onClick={() => onItemTap?.(item)} className="shrink-0 active:opacity-90" style={{ width: 86 }}>
              <div className="rounded-xl overflow-hidden relative" style={{ height: 108, backgroundColor: "#F5F5F5" }}>
                {item.image && <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />}
                <div className="absolute bottom-1.5 left-0 right-0 flex justify-center">
                  <div className="px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.62)" }}>
                    <span className="text-[8px] font-bold text-white" style={{ fontFamily: FONT }}>{daysSince >= 999 ? "미착용" : `${daysSince}일 전`}</span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-medium mt-1.5 truncate text-left" style={{ color: DARK, fontFamily: FONT }}>{item.displayName ?? item.name}</p>
              <p className="text-[9px] truncate text-left" style={{ color: "#AAAAAA", fontFamily: FONT }}>{item.brand}</p>
            </button>
          );
        })}
        <div className="shrink-0 w-1" />
      </div>
    </div>
  );
}

// ─── 내 옷장 관리 팁 ──────────────────────────────────────────────────────────
// A. ❄️  오래 안 입은 옷 N개 발견! 팔아서 돈을 버는 것은 어때요?
// B. 🧺  세탁 타임! N개 아이템이 세탁 타임. 완료 표시로 착용 횟수를 리셋하세요

function WardrobeTips({ onTipAction }) {
  const { longUnwornItems, laundryCount, laundryItems } = useMemo(() => {
    const lastWorn = getItemLastWornDates();
    const today    = localDateStr(new Date());

    const longUnwornItems = CLOSET_ITEMS.filter((item) => {
      const lw = lastWorn.get(item.id);
      if (!lw) return true;
      return Math.floor((new Date(today) - new Date(lw + "T12:00:00")) / 86400000) >= 90;
    });

    const laundryRaw   = getItemsNeedingWash(2);
    const laundryItems = laundryRaw
      .map(({ itemId }) => CLOSET_ITEMS.find((i) => i.id === itemId))
      .filter(Boolean);

    return { longUnwornItems, laundryCount: laundryRaw.length, laundryItems };
  }, []); // eslint-disable-line

  return (
    <div className="pb-4 px-4">
      <div className="flex items-center gap-2 mb-3">
        <span style={{ fontSize: 18 }}>💡</span>
        <h2 className="text-[15px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>내 옷장 관리 팁</h2>
      </div>
      <div className="flex flex-col gap-2.5">

        {/* A. Long-unworn items → sell suggestion */}
        <button
          onClick={() => onTipAction?.({ title: "오래 안 입은 아이템", items: longUnwornItems })}
          className="rounded-2xl px-4 py-4 flex gap-3 items-start w-full text-left active:opacity-80"
          style={{ backgroundColor: "#F0F5FF", border: "1px solid #C8D8F5" }}
        >
          <span style={{ fontSize: 24, lineHeight: 1.2, flexShrink: 0 }}>❄️</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-bold" style={{ color: DARK, fontFamily: FONT }}>
                오래 안 입은 옷 {longUnwornItems.length}개 발견!
              </p>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                <path d="M5 3L9 7L5 11" stroke="#8899CC" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "#6677AA", fontFamily: FONT }}>
              팔아서 돈을 버는 것은 어때요?
            </p>
          </div>
        </button>

        {/* B. Laundry tip */}
        <button
          onClick={() => onTipAction?.({ title: "세탁이 필요한 아이템", items: laundryItems })}
          className="rounded-2xl px-4 py-4 flex gap-3 items-start w-full text-left active:opacity-80"
          style={{ backgroundColor: "#FFF8F0", border: "1px solid #FFD8AA" }}
        >
          <span style={{ fontSize: 24, lineHeight: 1.2, flexShrink: 0 }}>🧺</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-bold" style={{ color: DARK, fontFamily: FONT }}>
                세탁 타임! {laundryCount}개 아이템이 세탁 타임.
              </p>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                <path d="M5 3L9 7L5 11" stroke="#CC9955" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "#AA7733", fontFamily: FONT }}>
              완료 표시로 착용 횟수를 리셋하세요
            </p>
          </div>
        </button>

      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function RecordPage({ onItemSelect, autoOpenFlow, onAutoOpenHandled }) {
  const TODAY = todayStr();

  const [history,        setHistory]       = useState(() => getAllWearHistory());
  const [stats,          setStats]         = useState(() => getWearStats());
  const [selectedDate,   setSelected]      = useState(null);
  const [showInsights,   setShowInsights]  = useState(false);
  const [showStreak,     setShowStreak]    = useState(false);
  const [stylebooksOpen, setStylebooksOpen] = useState(false);
  const [fullList,       setFullList]      = useState(null); // { title, items }
  const [styleFlowDate,  setStyleFlowDate] = useState(null); // non-null → StyleRecordFlow open
  const [stylebookData,  setStylebookData] = useState(null); // { itemIds, photoUrl, dateStr }

  // When the home screen's "기록 시작하기" fires, open today's flow immediately
  useEffect(() => {
    if (autoOpenFlow) {
      openDayRecord(TODAY);
      onAutoOpenHandled?.();
    }
    // openDayRecord reads history — intentionally omitted from deps to avoid loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenFlow]);

  function refresh() {
    setHistory(getAllWearHistory());
    setStats(getWearStats());
  }

  function handleSave(dateStr, record) {
    saveWearRecord(dateStr, record);
    refresh();
    setSelected(null);
  }

  // StyleRecordFlow save — record comes pre-built from DraftStep
  function handleStyleFlowSave(dateStr, record) {
    saveWearRecord(dateStr, record);
    refresh();
    // Stay on "done" step — user closes from there
  }

  // Open StyleRecordFlow for new record; open DayRecordSheet for editing
  function openDayRecord(dateStr) {
    const existing = history[dateStr];
    if (existing) {
      setSelected(dateStr);
    } else {
      setStyleFlowDate(dateStr);
    }
  }

  function handleDelete(dateStr) {
    deleteWearRecord(dateStr);
    refresh();
    setSelected(null);
  }

  // ── StatsRow tap routing ──────────────────────────────────────────────────
  function handleStatTap(key) {
    if (key === "streak") {
      setShowStreak(true);
    } else if (key === "items") {
      const freq = getItemWearFrequency();
      const sorted = CLOSET_ITEMS
        .filter((i) => freq.has(i.id))
        .sort((a, b) => (freq.get(b.id) ?? 0) - (freq.get(a.id) ?? 0));
      setFullList({ title: "기록된 아이템 전체", items: sorted.length > 0 ? sorted : CLOSET_ITEMS.slice(0, 20) });
    } else if (key === "days") {
      // Show all history entries as items
      const wornIds = new Set(
        Object.values(history).flatMap((rec) => rec.itemIds ?? [])
      );
      const wornItems = CLOSET_ITEMS.filter((i) => wornIds.has(i.id));
      setFullList({ title: "총 기록 아이템", items: wornItems.length > 0 ? wornItems : CLOSET_ITEMS.slice(0, 20) });
    }
  }

  const selectedRecord = selectedDate ? (history[selectedDate] ?? null) : null;

  return (
    <div className="relative flex flex-col h-full bg-white overflow-hidden">

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-5 shrink-0"
        style={{ height: 50, borderBottom: `1px solid ${DIVIDER}` }}
      >
        <div style={{ width: 34 }} />
        <h1 className="text-[17px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>기록</h1>
        <button
          onClick={() => openDayRecord(TODAY)}
          className="w-[34px] h-[34px] flex items-center justify-center rounded-full active:opacity-70"
          style={{ backgroundColor: "#F5F5F5" }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 3V15M3 9H15" stroke={DARK} strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* ── Scroll body ── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>

        {/* 1. 오늘은 무엇을 입었나요 */}
        <TodaySquareCard
          todayRecord={history[TODAY] ?? null}
          onTap={() => openDayRecord(TODAY)}
        />

        {/* 2. 스타일 인사이트 */}
        <StyleInsightsBanner stats={stats} onStatTap={handleStatTap} />

        {/* 3. 캘린더 */}
        <CalendarSection history={history} onDayTap={openDayRecord} />

        {/* 4. 연속 기록 streak banner */}
        <StreakBanner stats={stats} onTap={() => setShowStreak(true)} />

        {/* 5. 나의 스타일북 모두 보기 */}
        <div className="px-4 mb-4">
          <button
            onClick={() => setStylebooksOpen(true)}
            className="w-full rounded-2xl px-4 py-4 flex items-center justify-between active:opacity-80"
            style={{ backgroundColor: "#FAFAFA", border: `1px solid ${DIVIDER}` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: "#1a1a1a" }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="3" y="2" width="12" height="14" rx="2" stroke="white" strokeWidth="1.4" />
                  <path d="M6 6H12M6 9H12M6 12H9" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-[13px] font-bold" style={{ color: DARK, fontFamily: FONT }}>나의 스타일북 모두 보기</p>
                <p className="text-[11px] mt-0.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>저장한 코디를 한눈에 확인해보세요</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3L11 8L6 13" stroke="#CCCCCC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* 6. 내 옷장 관리 팁 */}
        <div className="mx-4 mb-4" style={{ height: 1, backgroundColor: DIVIDER }} />
        <WardrobeTips onTipAction={(data) => setFullList(data)} />

        {/* 7. 내 옷장 인사이트 */}
        <div className="mx-4 mb-4" style={{ height: 1, backgroundColor: DIVIDER }} />
        <InsightsSection onMore={() => setShowInsights(true)} />

        <div style={{ height: 24 }} />
      </div>

      {/* ── Overlays ── */}

      {/* StyleRecordFlow — photo-first wizard for NEW records */}
      {styleFlowDate && !stylebookData && (
        <StyleRecordFlow
          dateStr={styleFlowDate}
          onSave={handleStyleFlowSave}
          onClose={() => setStyleFlowDate(null)}
          onOpenStylebook={(itemIds, photoUrl, dateStr) => {
            setStylebookData({ itemIds, photoUrl, dateStr });
          }}
        />
      )}

      {/* StylebookCreatorSheet — optional after StyleRecordFlow done screen */}
      {stylebookData && (
        <StylebookCreatorSheet
          itemIds={stylebookData.itemIds}
          dateStr={stylebookData.dateStr}
          photoUrl={stylebookData.photoUrl}
          onSave={() => {
            setStylebookData(null);
            setStyleFlowDate(null);
          }}
          onClose={() => setStylebookData(null)}
        />
      )}

      {/* DayRecordSheet — edit existing records only */}
      {selectedDate && (
        <DayRecordSheet
          dateStr={selectedDate}
          record={selectedRecord}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setSelected(null)}
        />
      )}
      {showInsights && (
        <InsightsDetailScreen onBack={() => setShowInsights(false)} />
      )}
      {showStreak && (
        <StreakDetailScreen
          stats={stats}
          history={history}
          onBack={() => setShowStreak(false)}
        />
      )}
      {stylebooksOpen && (
        <MyStylebooksScreen
          onBack={() => setStylebooksOpen(false)}
          onItemTap={onItemSelect}
        />
      )}
      {fullList && (
        <FullListScreen
          title={fullList.title}
          items={fullList.items}
          onBack={() => setFullList(null)}
          onItemSelect={onItemSelect}
        />
      )}
    </div>
  );
}
