import { useState } from "react";
import {
  getAllWearHistory,
  saveWearRecord,
  deleteWearRecord,
  getWearStats,
} from "../../lib/wearHistoryStore";
import { CLOSET_ITEMS } from "../../constants/mockClosetData";

const FONT   = "'Spoqa Han Sans Neo', sans-serif";
const DARK   = "#1a1a1a";
const YELLOW = "#F5C200";

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toDateStr(date) {
  // Use local date (not UTC) to avoid off-by-one due to timezone
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysInMonth(year, month) {      // month 0-based
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfWeek(year, month) {   // 0=Sun..6=Sat
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const DAY_NAMES   = ["일","월","화","수","목","금","토"];

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatItem({ label, value, accent }) {
  return (
    <div className="flex flex-col items-center flex-1">
      <p
        className="text-[18px] font-bold leading-tight"
        style={{ color: accent ? YELLOW : "white", fontFamily: FONT, letterSpacing: "-0.03em" }}
      >
        {value}
      </p>
      <p className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.42)", fontFamily: FONT }}>
        {label}
      </p>
    </div>
  );
}

function StatsBar({ stats }) {
  return (
    <div
      className="mx-5 rounded-2xl px-4 py-3 flex items-center"
      style={{ backgroundColor: DARK }}
    >
      <StatItem label="연속 기록" value={`${stats.streak}일`} accent />
      <div style={{ width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.10)" }} />
      <StatItem label="총 기록일" value={`${stats.totalDays}일`} />
      <div style={{ width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.10)" }} />
      <StatItem label="착용 아이템" value={`${stats.totalItems}개`} />
    </div>
  );
}

// ─── Day cell ─────────────────────────────────────────────────────────────────

function DayCell({ day, dateStr, isToday, record, onTap }) {
  const hasRecord  = !!record;
  const firstItem  = hasRecord && record.itemIds?.length > 0
    ? CLOSET_ITEMS.find((i) => i.id === record.itemIds[0])
    : null;

  const isSun = new Date(dateStr + "T12:00:00").getDay() === 0;
  const isSat = new Date(dateStr + "T12:00:00").getDay() === 6;

  return (
    <button
      onClick={() => onTap(dateStr)}
      className="flex flex-col items-center gap-1 py-1"
      style={{ minHeight: 72 }}
    >
      {/* Day number circle */}
      <div
        className="w-7 h-7 flex items-center justify-center rounded-full shrink-0"
        style={{
          backgroundColor: isToday ? YELLOW : "transparent",
        }}
      >
        <span
          className="text-[11px] font-bold"
          style={{
            color: isToday ? DARK : isSun ? "#E84040" : isSat ? "#4060E8" : "#444",
            fontFamily: FONT,
          }}
        >
          {day}
        </span>
      </div>

      {/* Outfit thumbnail OR empty placeholder */}
      {hasRecord ? (
        <div
          className="rounded-lg overflow-hidden shrink-0"
          style={{ width: 34, height: 40, backgroundColor: "#EEE" }}
        >
          {firstItem?.image ? (
            <img
              src={firstItem.image}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: YELLOW + "22" }}
            >
              <span style={{ fontSize: 16 }}>👗</span>
            </div>
          )}
          {/* Dot indicator if multiple items */}
          {record.itemIds?.length > 1 && (
            <div
              className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: YELLOW, fontSize: 7, fontWeight: 700, color: DARK }}
            >
              +{Math.min(record.itemIds.length - 1, 9)}
            </div>
          )}
        </div>
      ) : (
        <div style={{ width: 34, height: 40 }} />
      )}
    </button>
  );
}

// ─── Day Record Sheet ─────────────────────────────────────────────────────────
// Bottom sheet for recording items worn on a selected day.

function DayRecordSheet({ dateStr, record, onSave, onDelete, onClose }) {
  const [selectedIds, setSelectedIds] = useState(record?.itemIds ?? []);
  const [note, setNote]               = useState(record?.note ?? "");
  const [catFilter, setCatFilter]     = useState("전체");

  const CATS = ["전체", "상의", "하의", "아우터", "원피스"];

  const displayItems = catFilter === "전체"
    ? CLOSET_ITEMS
    : CLOSET_ITEMS.filter((i) => i.mainCategory === catFilter);

  function toggleItem(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSave() {
    if (selectedIds.length === 0) return;
    onSave(dateStr, { itemIds: selectedIds, note });
  }

  // Format date label like "4월 23일 (수)"
  const [yr, mo, dy] = dateStr.split("-").map(Number);
  const dow = new Date(yr, mo - 1, dy).getDay();
  const dateLabel = `${mo}월 ${dy}일 (${DAY_NAMES[dow]})`;

  return (
    <div
      className="absolute inset-0 z-50 flex items-end"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full rounded-t-3xl flex flex-col bg-white"
        style={{ maxHeight: "85%", minHeight: "55%" }}
      >
        {/* ── Handle ── */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "#DDD" }} />
        </div>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pb-3 shrink-0">
          <div>
            <p
              className="text-[10px] font-bold tracking-[0.12em] uppercase"
              style={{ color: "#AAAAAA", fontFamily: FONT }}
            >
              WEAR RECORD
            </p>
            <h3
              className="text-[17px] font-bold"
              style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.025em" }}
            >
              {dateLabel}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{ backgroundColor: "#F2F2F2" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 12M12 2L2 12" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ── Selected items preview row ── */}
        {selectedIds.length > 0 && (
          <div
            className="px-5 pb-3 shrink-0"
            style={{ borderBottom: "1px solid #F0F0F0" }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: "#AAAAAA", fontFamily: FONT }}
            >
              선택된 아이템 {selectedIds.length}개
            </p>
            <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {selectedIds.map((id) => {
                const item = CLOSET_ITEMS.find((i) => i.id === id);
                if (!item) return null;
                return (
                  <div
                    key={id}
                    className="relative shrink-0 rounded-xl overflow-hidden"
                    style={{ width: 52, height: 64, backgroundColor: "#F5F5F5" }}
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
                      />
                    )}
                    <button
                      onClick={() => toggleItem(id)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
                    >
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1 1L7 7M7 1L1 7" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Category filter ── */}
        <div className="px-5 pt-3 pb-2 shrink-0">
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {CATS.map((cat) => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all"
                style={{
                  backgroundColor: catFilter === cat ? DARK    : "#F2F2F2",
                  color:           catFilter === cat ? "white" : "#555",
                  fontFamily:      FONT,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Item grid (scrollable) ── */}
        <div
          className="flex-1 overflow-y-auto px-5 pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="grid grid-cols-3 gap-2">
            {displayItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className="relative rounded-xl overflow-hidden"
                  style={{ aspectRatio: "3/4", backgroundColor: "#F5F5F5" }}
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
                    />
                  )}
                  {/* Selected overlay */}
                  {isSelected && (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ backgroundColor: "rgba(245,194,0,0.38)" }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: YELLOW }}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2.5 7L5.5 10L11.5 4" stroke={DARK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  )}
                  {/* Item label */}
                  <div
                    className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5 pt-6"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)" }}
                  >
                    <p
                      className="text-[8px] font-bold text-white truncate leading-tight"
                      style={{ fontFamily: FONT }}
                    >
                      {item.displayName ?? item.name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          {displayItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <span style={{ fontSize: 32 }}>👗</span>
              <p className="text-[12px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>
                해당 카테고리 아이템이 없어요
              </p>
            </div>
          )}
        </div>

        {/* ── Note input ── */}
        <div className="px-5 pt-2 pb-2 shrink-0" style={{ borderTop: "1px solid #F4F4F4" }}>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="오늘의 스타일 메모 (선택)"
            className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
            style={{ backgroundColor: "#F5F5F5", color: DARK, fontFamily: FONT }}
          />
        </div>

        {/* ── CTA row ── */}
        <div className="px-5 pb-6 pt-2 flex gap-3 shrink-0">
          {record && (
            <button
              onClick={() => onDelete(dateStr)}
              className="flex items-center justify-center px-4 rounded-2xl text-[14px] font-medium shrink-0"
              style={{ height: 52, backgroundColor: "#F5F5F5", color: "#888", fontFamily: FONT }}
            >
              삭제
            </button>
          )}
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl font-bold"
            style={{
              height:          52,
              backgroundColor: selectedIds.length > 0 ? YELLOW : "#F5F5F5",
              color:           selectedIds.length > 0 ? DARK   : "#AAAAAA",
              fontFamily:      FONT,
              fontSize:        15,
            }}
          >
            {selectedIds.length > 0
              ? `${selectedIds.length}개 아이템 기록하기`
              : "아이템을 선택해주세요"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main CalendarPage ─────────────────────────────────────────────────────────

export default function CalendarPage() {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-based

  const [history,      setHistory]      = useState(() => getAllWearHistory());
  const [stats,        setStats]        = useState(() => getWearStats());
  const [selectedDate, setSelectedDate] = useState(null); // "YYYY-MM-DD" | null

  function refresh() {
    setHistory(getAllWearHistory());
    setStats(getWearStats());
  }

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else             { setMonth((m) => m - 1); }
  }
  function nextMonth() {
    const t = new Date();
    if (year === t.getFullYear() && month === t.getMonth()) return; // don't go to future
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else              { setMonth((m) => m + 1); }
  }

  // Build grid: leading empty cells + day numbers
  const totalDays = daysInMonth(year, month);
  const firstDay  = firstDayOfWeek(year, month);
  const cells     = [];
  for (let i = 0; i < firstDay;    i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  const todayStr = toDateStr(today);
  const isFutureMonth =
    year > today.getFullYear() ||
    (year === today.getFullYear() && month > today.getMonth());

  function handleDayTap(dateStr) {
    // Don't open sheet for future dates
    if (dateStr > todayStr) return;
    setSelectedDate(dateStr);
  }

  function handleSave(dateStr, record) {
    saveWearRecord(dateStr, record);
    refresh();
    setSelectedDate(null);
  }

  function handleDelete(dateStr) {
    deleteWearRecord(dateStr);
    refresh();
    setSelectedDate(null);
  }

  const selectedRecord = selectedDate ? (history[selectedDate] ?? null) : null;

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">

      {/* ── Stats bar ── */}
      <div className="pt-4 pb-3 shrink-0">
        <StatsBar stats={stats} />
      </div>

      {/* ── Month navigation ── */}
      <div className="flex items-center justify-between px-5 py-2 shrink-0">
        <button
          onClick={prevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ backgroundColor: "#F2F2F2" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p
          className="text-[16px] font-bold"
          style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}
        >
          {year}년 {MONTH_NAMES[month]}
        </p>
        <button
          onClick={nextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ backgroundColor: isFutureMonth ? "#FAFAFA" : "#F2F2F2", opacity: isFutureMonth ? 0.4 : 1 }}
          disabled={isFutureMonth}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 3L11 8L6 13" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* ── Day-of-week header ── */}
      <div className="grid grid-cols-7 px-2 shrink-0" style={{ borderBottom: "1px solid #F4F4F4" }}>
        {DAY_NAMES.map((d, i) => (
          <div key={d} className="flex items-center justify-center py-1.5">
            <span
              className="text-[11px] font-bold"
              style={{
                color:      i === 0 ? "#E84040" : i === 6 ? "#4060E8" : "#BBBBBB",
                fontFamily: FONT,
              }}
            >
              {d}
            </span>
          </div>
        ))}
      </div>

      {/* ── Calendar grid ── */}
      <div
        className="flex-1 overflow-y-auto px-2 pt-1 pb-4"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`pad-${idx}`} style={{ minHeight: 72 }} />;
            }
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isFuture = dateStr > todayStr;
            return (
              <div key={dateStr} style={{ opacity: isFuture ? 0.3 : 1 }}>
                <DayCell
                  day={day}
                  dateStr={dateStr}
                  isToday={dateStr === todayStr}
                  record={history[dateStr] ?? null}
                  onTap={handleDayTap}
                />
              </div>
            );
          })}
        </div>

        {/* ── Hint card ── */}
        <div
          className="mt-3 mx-1 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ backgroundColor: "#FFFBEA", border: "1px solid rgba(245,194,0,0.25)" }}
        >
          <span style={{ fontSize: 18 }}>👆</span>
          <p
            className="text-[11px] leading-relaxed flex-1"
            style={{ color: "#888", fontFamily: FONT }}
          >
            날짜를 탭해서 오늘 착용한 아이템을 기록해보세요. 매일 기록하면 연속 기록이 늘어나요!
          </p>
        </div>
      </div>

      {/* ── Day record bottom sheet ── */}
      {selectedDate && (
        <DayRecordSheet
          dateStr={selectedDate}
          record={selectedRecord}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
