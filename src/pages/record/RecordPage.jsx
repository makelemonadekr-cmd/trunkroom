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
import StylebookTemplate from "../../components/StylebookTemplate";
import { extractColors } from "../../lib/colorExtractor";
import OutfitCanvasEditor from "../../components/OutfitCanvasEditor";
import StyleRecordFlow from "../../components/StyleRecordFlow";
import { CLOSET_ITEMS } from "../../constants/mockClosetData";
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

  // Resolve itemIds → ClosetItem objects for template preview
  const selectedItems = itemIds
    .map((id) => CLOSET_ITEMS.find((i) => i.id === id))
    .filter(Boolean);

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
      templateId:      "A",
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

        {/* ── Template preview ── */}
        <div className="pt-5 pb-2 flex flex-col items-center px-5">

          {/* 4:5 preview with camera overlay */}
          <div className="relative" style={{ width: 252 }}>
            <StylebookTemplate
              photoUrl={photo}
              items={selectedItems}
              width={252}
            />

            {/* Camera / photo change button */}
            <button
              onClick={() => photoFileRef.current?.click()}
              className="absolute bottom-10 right-2.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full active:opacity-70"
              style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", zIndex: 10 }}
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
              ? `착장 사진 · ${selectedItems.length}개 아이템`
              : "착장 사진을 추가하면 템플릿이 완성돼요"}
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
          style={{ backgroundColor: isPublic ? "#FEFCE8" : "#F8F8F8", border: `1px solid ${isPublic ? "#EDD83A" : DIVIDER}`, transition: "all 0.2s" }}
        >
          <div className="flex-1 min-w-0 mr-4">
            <p className="text-[13px] font-bold" style={{ color: DARK, fontFamily: FONT }}>
              🌐 공개 스타일
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>
              {isPublic
                ? "다른 사람들이 볼 수 있어요. 메모는 항상 비공개입니다."
                : "선택하시면 다른 사람들이 볼 수 있어요."}
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

  const CATS = ["전체", "상의", "하의", "아우터", "원피스", "신발", "가방", "액세서리", "스포츠"];
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

// ─── TodayCard ───────────────────────────────────────────────────────────────
// Horizontal banner card (same visual weight as InsightsBanner in ClosetPage).
// • 미기록: pencil icon + "오늘은 무엇을 입었는지 기록해주세요" + chevron
// • 기록됨: checkmark + title + 수정 button + small square outfit thumbnail (right)

function TodayCard({ todayRecord, onTap }) {
  const hasRecord = !!todayRecord;

  // Build thumbnail source for the right-side square
  const thumbItems = hasRecord
    ? (todayRecord.itemIds ?? [])
        .map((id) => CLOSET_ITEMS.find((i) => i.id === id))
        .filter((i) => i?.image)
        .slice(0, 4)
    : [];

  const THUMB = 68; // px — size of the square thumbnail

  return (
    <div
      className="mx-4 mt-4 mb-1 rounded-2xl overflow-hidden"
      style={{ border: hasRecord ? "1px solid #EEEEEE" : "1px solid #FDE68A" }}
    >
      <button
        onClick={onTap}
        className="w-full flex items-center gap-3 px-4 text-left active:opacity-75 transition-opacity"
        style={{ minHeight: 76, paddingTop: 14, paddingBottom: 14, backgroundColor: hasRecord ? "white" : "#FFFBEB" }}
      >
        {/* ── 왼쪽: 아이콘 + 텍스트 ── */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* 아이콘 */}
          {hasRecord ? (
            <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>✅</span>
          ) : (
            <div
              className="flex items-center justify-center shrink-0 rounded-xl"
              style={{ width: 44, height: 44, backgroundColor: "#FEF08A" }}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>📸</span>
            </div>
          )}

          {/* 텍스트 블록 */}
          <div className="flex-1 min-w-0">
            {hasRecord ? (
              <>
                <p className="text-[14px] font-semibold leading-snug" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>
                  오늘의 스타일 등록 완료!
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>
                  오늘 기록 완료 · 탭하여 수정
                </p>
              </>
            ) : (
              <>
                <p className="text-[16px] font-bold leading-snug" style={{ color: "#A07800", fontFamily: FONT, letterSpacing: "-0.03em" }}>
                  오늘의 착장을 기록해주세요!
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: "#B8912A", fontFamily: FONT }}>
                  1분이면 되요 😉
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── 오른쪽: 기록됨이면 썸네일, 아니면 chevron ── */}
        {hasRecord && (todayRecord.photoUrl || thumbItems.length > 0) ? (
          <div
            className="shrink-0 rounded-xl overflow-hidden"
            style={{ width: THUMB, height: THUMB, backgroundColor: "#F0F0F0" }}
          >
            {todayRecord.photoUrl ? (
              <img
                src={todayRecord.photoUrl}
                alt="오늘 착장"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : thumbItems.length === 1 ? (
              <img src={thumbItems[0].image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
            ) : thumbItems.length === 2 ? (
              <div style={{ display: "flex", width: "100%", height: "100%", gap: 2 }}>
                {thumbItems.map((it) => (
                  <div key={it.id} style={{ flex: 1, overflow: "hidden" }}>
                    <img src={it.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", width: "100%", height: "100%", gap: 2 }}>
                {thumbItems.slice(0, 4).map((it) => (
                  <div key={it.id} style={{ overflow: "hidden" }}>
                    <img src={it.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0">
            <path d="M5.5 3L10 7.5L5.5 12" stroke="#CCCCCC" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
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
      {/* Title + toggle row — 3-column layout */}
      <div className="flex items-center px-4 py-3" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
        {/* 왼쪽: 제목 */}
        <div className="flex-1">
          <h3 className="text-[15px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>스타일 캘린더</h3>
        </div>
        {/* 가운데: 월 네비게이터 (월간 모드일 때만) */}
        <div className="flex-1 flex items-center justify-center">
          {mode === "monthly" && (
            <div className="flex items-center gap-1.5">
              <button onClick={prevMonth} className="w-6 h-6 flex items-center justify-center rounded-full" style={{ backgroundColor: "#EEEEEE" }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M7.5 2L4.5 6L7.5 10" stroke={DARK} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="flex flex-col items-center leading-none" style={{ minWidth: 28 }}>
                <span className="text-[9px] font-semibold" style={{ color: "#999", fontFamily: FONT }}>{year}년</span>
                <span className="text-[12px] font-bold" style={{ color: DARK, fontFamily: FONT }}>{MONTH_NAMES[month]}</span>
              </div>
              <button onClick={nextMonth} className="w-6 h-6 flex items-center justify-center rounded-full" style={{ backgroundColor: isFutureMonth ? "#F5F5F5" : "#EEEEEE", opacity: isFutureMonth ? 0.4 : 1 }} disabled={isFutureMonth}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 2L7.5 6L4.5 10" stroke={DARK} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}
        </div>
        {/* 오른쪽: 주간/월간 토글 */}
        <div className="flex-1 flex justify-end">
          <div className="flex gap-1 rounded-lg overflow-hidden" style={{ backgroundColor: "#EEEEEE", padding: 2 }}>
            {["weekly", "monthly"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="px-3 py-1 rounded-md text-[11px] font-bold transition-all"
                style={{
                  backgroundColor: mode === m ? "white" : "transparent",
                  color:           mode === m ? DARK    : "#AAAAAA",
                  fontFamily:      FONT,
                  boxShadow:       mode === m ? "0 1px 3px rgba(0,0,0,0.10)" : "none",
                }}
              >
                {m === "weekly" ? "주간" : "월간"}
              </button>
            ))}
          </div>
        </div>
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


// ─── StatsRow ─────────────────────────────────────────────────────────────────

function StatsRow({ stats, onStatTap }) {
  const items = [
    { key: "streak", label: "연속 기록",     value: `${stats.streak}일`,      accent: true },
    { key: "days",   label: "총 기록일",     value: `${stats.totalDays}일`              },
    { key: "items",  label: "기록된 아이템", value: `${stats.totalItems}개`             },
  ];
  return (
    <div className="mx-3 mb-3 rounded-xl flex" style={{ backgroundColor: "white", border: "1px solid #E8E8E8" }}>
      {items.map((item, i) => (
        <button
          key={item.label}
          onClick={() => onStatTap?.(item.key)}
          className="flex-1 flex flex-col items-center py-3 relative active:opacity-70 transition-opacity"
        >
          {i > 0 && <div className="absolute left-0 top-2 bottom-2" style={{ width: 1, backgroundColor: "rgba(0,0,0,0.07)" }} />}
          <p className="text-[16px] font-bold" style={{ color: item.accent ? "#A07800" : DARK, fontFamily: FONT, letterSpacing: "-0.03em" }}>{item.value}</p>
          <div className="flex items-center gap-0.5 mt-0.5">
            <p className="text-[9px] whitespace-nowrap" style={{ color: "rgba(0,0,0,0.40)", fontFamily: FONT }}>{item.label}</p>
            <svg width="7" height="7" viewBox="0 0 9 9" fill="none">
              <path d="M3.5 2L6.5 4.5L3.5 7" stroke="rgba(0,0,0,0.22)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── CarbonFootprintCard ──────────────────────────────────────────────────────
// 착용 기록 기반 CO₂ 절감량 추정 카드
// 근거: 새 의류 1벌 생산 평균 약 2.1kg CO₂ 대비, 기존 옷 1회 착용 시 ~0.5kg 절감 (simplified model)

function CarbonFootprintCard({ totalItems = 0, totalDays = 0 }) {
  const co2Saved   = Math.round(totalItems * 0.5 * 10) / 10;        // kg (0.5kg per item-wear)
  const treeDays   = Math.round(co2Saved / 0.06);                   // 1 tree absorbs ~0.06kg CO₂/day
  const bottles    = Math.round(co2Saved * 2);                       // ~0.5L PET bottle = 0.5kg CO₂ equiv.
  const pct        = Math.min(100, Math.round((totalDays / 30) * 100)); // 30일 목표 대비 진행률

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid #C8E6C9` }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: "#F1F8F1", borderBottom: "1px solid #C8E6C9" }}>
        <span style={{ fontSize: 15 }}>🌿</span>
        <div>
          <p className="text-[12px] font-bold" style={{ color: "#2E7D32", fontFamily: FONT }}>탄소발자국 절감 현황</p>
          <p className="text-[10px] mt-0.5" style={{ color: "#66BB6A", fontFamily: FONT }}>기존 옷을 입을수록 지구가 가벼워져요</p>
        </div>
      </div>

      <div className="px-4 py-4" style={{ backgroundColor: "white" }}>

        {/* Main CO₂ metric */}
        <div className="flex items-end gap-2 mb-3">
          <p className="text-[36px] font-bold leading-none" style={{ color: "#2E7D32", fontFamily: FONT, letterSpacing: "-0.04em" }}>
            {co2Saved.toFixed(1)}
          </p>
          <div className="pb-1">
            <p className="text-[13px] font-bold" style={{ color: "#2E7D32", fontFamily: FONT }}>kg CO₂</p>
            <p className="text-[10px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>절감 추정량</p>
          </div>
          <div className="ml-auto flex flex-col items-end gap-0.5 pb-1">
            <p className="text-[11px] font-bold" style={{ color: "#888", fontFamily: FONT }}>나무 {treeDays}일치 흡수량</p>
            <p className="text-[10px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>페트병 {bottles}개 생산 절약</p>
          </div>
        </div>

        {/* Progress bar toward 30-day goal */}
        <div className="mb-2">
          <div className="flex justify-between mb-1.5">
            <p className="text-[10px] font-bold" style={{ color: "#555", fontFamily: FONT }}>30일 목표 달성률</p>
            <p className="text-[10px] font-bold" style={{ color: "#2E7D32", fontFamily: FONT }}>{pct}%</p>
          </div>
          <div className="w-full rounded-full overflow-hidden" style={{ height: 7, backgroundColor: "#EEF7EE" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: "linear-gradient(90deg, #81C784, #2E7D32)" }}
            />
          </div>
        </div>

        {/* Badges row */}
        <div className="flex gap-2 mt-3">
          {[
            { threshold: 5,  label: "첫 절감",   emoji: "🌱" },
            { threshold: 20, label: "나무 한 그루", emoji: "🌳" },
            { threshold: 50, label: "지구 지킴이", emoji: "🌍" },
          ].map((b) => {
            const done = totalItems >= b.threshold;
            return (
              <div
                key={b.threshold}
                className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl"
                style={{
                  backgroundColor: done ? "#F1F8F1" : "#F8F8F8",
                  border: done ? "1px solid #C8E6C9" : "1px solid transparent",
                }}
              >
                <span style={{ fontSize: 20, opacity: done ? 1 : 0.25 }}>{b.emoji}</span>
                <p className="text-[9px] font-bold text-center" style={{ color: done ? "#2E7D32" : "#CCCCCC", fontFamily: FONT }}>{b.label}</p>
              </div>
            );
          })}
        </div>

        <p className="text-[9px] mt-3 leading-relaxed" style={{ color: "#CCCCCC", fontFamily: FONT }}>
          * 절감량은 패션 산업 평균 데이터 기반 추정치로 실제와 다를 수 있어요.
        </p>
      </div>
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

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4" style={{ scrollbarWidth: "none" }}>

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

        {/* Carbon footprint */}
        <CarbonFootprintCard totalItems={stats.totalItems} totalDays={stats.totalDays} />

        <div style={{ height: 16 }} />
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

function StyleInsightsBanner({ stats, onStatTap, onStylebookOpen }) {
  return (
    <div className="mx-4 mb-3 mt-2 rounded-2xl overflow-hidden" style={{ backgroundColor: "#F7F7F7", border: "1px solid #EEEEEE" }}>
      <div className="px-4 pt-4 pb-2">
        <p className="text-[10px] font-bold tracking-[0.12em] uppercase mb-0.5" style={{ color: "#BBBBBB", fontFamily: FONT }}>
          STYLE INSIGHTS
        </p>
        <h2 className="text-[15px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>
          스타일 인사이트
        </h2>
        <p className="text-[11px] mt-0.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>
          매일 기록을 통해 내 스타일을 파악할 수 있어요!
        </p>
      </div>
      <StatsRow stats={stats} onStatTap={onStatTap} />

      {/* 나의 스타일북 */}
      <div style={{ height: 1, backgroundColor: "#EEEEEE", margin: "0 12px" }} />
      <button
        onClick={onStylebookOpen}
        className="w-full flex items-center gap-3 px-4 py-3.5 active:opacity-75 transition-opacity"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: DARK }}
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <rect x="3" y="2" width="12" height="14" rx="2" stroke="white" strokeWidth="1.4" />
            <path d="M6 6H12M6 9H12M6 12H9" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[13px] font-bold" style={{ color: DARK, fontFamily: FONT }}>나의 스타일북 모두 보기</p>
          <p className="text-[11px] mt-0.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>저장한 코디를 한눈에 확인해보세요</p>
        </div>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <path d="M6 3L11 8L6 13" stroke="#CCCCCC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
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
        style={{ backgroundColor: "#FEFCE8", border: "1px solid #F3E3A0" }}
      >
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>
            {streak > 0 ? "🔥" : "🌱"}
          </span>
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

function StyleTips({ onTipAction }) {
  const [open, setOpen] = useState(false);

  const { longUnwornItems, laundryCount, laundryItems, topItems, wornCount } = useMemo(() => {
    const lastWorn  = getItemLastWornDates();
    const freqMap   = getItemWearFrequency();
    const today     = localDateStr(new Date());

    const longUnwornItems = CLOSET_ITEMS.filter((item) => {
      const lw = lastWorn.get(item.id);
      if (!lw) return true;
      return Math.floor((new Date(today) - new Date(lw + "T12:00:00")) / 86400000) >= 90;
    });

    const laundryRaw   = getItemsNeedingWash(2);
    const laundryItems = laundryRaw
      .map(({ itemId }) => CLOSET_ITEMS.find((i) => i.id === itemId))
      .filter(Boolean);

    // Top worn items (≥5 times) — good for new outfit combos
    const topItems = CLOSET_ITEMS
      .filter((i) => (freqMap.get(i.id) ?? 0) >= 5)
      .sort((a, b) => (freqMap.get(b.id) ?? 0) - (freqMap.get(a.id) ?? 0))
      .slice(0, 10);

    // Total items worn at least once
    const wornCount = CLOSET_ITEMS.filter((i) => (freqMap.get(i.id) ?? 0) > 0).length;

    return { longUnwornItems, laundryCount: laundryRaw.length, laundryItems, topItems, wornCount };
  }, []); // eslint-disable-line

  const tipCount = (longUnwornItems.length > 0 ? 1 : 0) + (laundryCount > 0 ? 1 : 0);

  const TIP_CHEVRON = ({ color = "#AAAAAA" }) => (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <path d="M5 3L9 7L5 11" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div className="mx-4 mb-4 rounded-2xl overflow-hidden" style={{ border: "1px solid #EEEEEE" }}>
      {/* Toggle header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 active:opacity-80 bg-white"
      >
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 20, lineHeight: 1 }}>💡</span>
          <p className="text-[14px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>내 스타일 관리 팁</p>
          {tipCount > 0 && (
            <span
              className="text-[10px] font-bold text-white flex items-center justify-center rounded-full"
              style={{ backgroundColor: "#E84040", minWidth: 18, height: 18, paddingInline: 4 }}
            >
              {tipCount}
            </span>
          )}
        </div>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        >
          <path d="M3 5L7 9L11 5" stroke="#BBBBBB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="flex flex-col gap-2.5 px-3 pb-3" style={{ borderTop: "1px solid #F0F0F0" }}>

          {/* A. 오래 안 입은 옷 */}
          <button
            onClick={() => onTipAction?.({ title: "오래 안 입은 아이템", items: longUnwornItems })}
            className="mt-2.5 rounded-2xl px-4 py-3.5 flex gap-3 items-center w-full text-left active:opacity-80"
            style={{ backgroundColor: "#F0F5FF", border: "1px solid #C8D8F5" }}
          >
            <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>❄️</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold" style={{ color: DARK, fontFamily: FONT }}>
                오래 안 입은 옷 {longUnwornItems.length}개 발견
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "#6677AA", fontFamily: FONT }}>
                팔거나 기부하는 건 어떨까요?
              </p>
            </div>
            <TIP_CHEVRON color="#8899CC" />
          </button>

          {/* B. 세탁 타임 */}
          <button
            onClick={() => onTipAction?.({ title: "세탁이 필요한 아이템", items: laundryItems })}
            className="rounded-2xl px-4 py-3.5 flex gap-3 items-center w-full text-left active:opacity-80"
            style={{ backgroundColor: "#FFF8F0", border: "1px solid #FFD8AA" }}
          >
            <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>🧺</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold" style={{ color: DARK, fontFamily: FONT }}>
                세탁 필요 아이템 {laundryCount}개
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "#AA7733", fontFamily: FONT }}>
                완료 표시로 착용 횟수를 리셋하세요
              </p>
            </div>
            <TIP_CHEVRON color="#CC9955" />
          </button>

          {/* C. 자주 입는 아이템으로 새 코디 */}
          <button
            onClick={() => onTipAction?.({ title: "많이 착용한 아이템", items: topItems })}
            className="rounded-2xl px-4 py-3.5 flex gap-3 items-center w-full text-left active:opacity-80"
            style={{ backgroundColor: "#F3FFF0", border: "1px solid #BBE8B0" }}
          >
            <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>✨</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold" style={{ color: DARK, fontFamily: FONT }}>
                자주 입는 아이템으로 새 코디 도전
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "#4A8A3A", fontFamily: FONT }}>
                {topItems.length}개 아이템으로 새로운 조합을 찾아보세요
              </p>
            </div>
            <TIP_CHEVRON color="#6BAA5A" />
          </button>

          {/* D. 옷장 활용률 */}
          <div
            className="rounded-2xl px-4 py-3.5 flex gap-3 items-center"
            style={{ backgroundColor: "#FAF0FF", border: "1px solid #DDB8F5" }}
          >
            <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>📊</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold" style={{ color: DARK, fontFamily: FONT }}>
                옷장 활용률 {Math.round((wornCount / Math.max(CLOSET_ITEMS.length, 1)) * 100)}%
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "#8855BB", fontFamily: FONT }}>
                총 {CLOSET_ITEMS.length}개 중 {wornCount}개를 착용했어요
              </p>
            </div>
          </div>

          {/* E. 계절 체크 */}
          <div
            className="rounded-2xl px-4 py-3.5 flex gap-3 items-center"
            style={{ backgroundColor: "#FFF5F0", border: "1px solid #FFCAB0" }}
          >
            <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>🌦️</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold" style={{ color: DARK, fontFamily: FONT }}>
                계절 아이템 점검
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "#BB6633", fontFamily: FONT }}>
                다음 계절을 대비해 옷장을 미리 정리해보세요
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function RecordPage({ onItemSelect, autoOpenFlow, onAutoOpenHandled, prefilledItem, onPrefilledHandled }) {
  const TODAY = todayStr();

  const [history,        setHistory]       = useState(() => getAllWearHistory());
  const [stats,          setStats]         = useState(() => getWearStats());
  const [selectedDate,   setSelected]      = useState(null);
  const [showStreak,     setShowStreak]    = useState(false);
  const [stylebooksOpen, setStylebooksOpen] = useState(false);
  const [fullList,       setFullList]      = useState(null);
  const [styleFlowDate,  setStyleFlowDate]  = useState(null);
  const [stylebookData,  setStylebookData]  = useState(null);
  // Use a ref (not state) so the value is available synchronously on the very
  // next render triggered by setStyleFlowDate, before React has a chance to
  // null out the parent prop via onPrefilledHandled.
  const prefilledItemRef = useRef(null);

  // When the home screen's "기록 시작하기" fires
  useEffect(() => {
    if (autoOpenFlow) {
      openDayRecord(TODAY);
      onAutoOpenHandled?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenFlow]);

  // When "이 아이템으로 스타일 만들기" fires from ClosetItemDetailScreen.
  // Write to ref first (synchronous) then trigger the render — the ref is
  // guaranteed to be set when StyleRecordFlow evaluates its initialStep prop.
  useEffect(() => {
    if (prefilledItem) {
      prefilledItemRef.current = prefilledItem;
      setStyleFlowDate(TODAY);
      onPrefilledHandled?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledItem]);

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
        <TodayCard
          todayRecord={history[TODAY] ?? null}
          onTap={() => openDayRecord(TODAY)}
        />

        {/* 2. 스타일 인사이트 + 스타일북 */}
        <StyleInsightsBanner
          stats={stats}
          onStatTap={handleStatTap}
          onStylebookOpen={() => setStylebooksOpen(true)}
        />

        {/* 3. 스타일 캘린더 */}
        <CalendarSection history={history} onDayTap={openDayRecord} />

        {/* 4. 연속 기록 streak banner */}
        <StreakBanner stats={stats} onTap={() => setShowStreak(true)} />

        {/* 5. 내 스타일 관리 팁 (토글) */}
        <StyleTips onTipAction={(data) => setFullList(data)} />

        <div style={{ height: 24 }} />
      </div>

      {/* ── Overlays ── */}

      {/* StyleRecordFlow — photo-first wizard for NEW records */}
      {styleFlowDate && !stylebookData && (
        <StyleRecordFlow
          dateStr={styleFlowDate}
          onSave={handleStyleFlowSave}
          onClose={() => { setStyleFlowDate(null); prefilledItemRef.current = null; }}
          onOpenStylebook={(itemIds, photoUrl, dateStr) => {
            setStylebookData({ itemIds, photoUrl, dateStr });
          }}
          onGoToStylebook={() => {
            setStyleFlowDate(null);
            setStylebooksOpen(true);
          }}
          initialItems={prefilledItemRef.current ? [prefilledItemRef.current] : []}
          initialStep={prefilledItemRef.current ? "draft" : "photo"}
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
