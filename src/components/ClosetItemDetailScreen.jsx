/**
 * ClosetItemDetailScreen.jsx
 *
 * My-closet item detail — same visual format as ProductDetailPage.
 * Key differences from the "other person's item" view:
 *   • No seller / account section
 *   • Sale toggle (On → shows sale memo + platform link inputs)
 *   • Total wear count + wear history dates
 *   • 🔒 Private memo (only visible to owner)
 *   • "이 아이템으로 만든 스타일북" section
 *   • Bottom CTA: "이 아이템으로 스타일북 만들기"
 */

import { useState, useMemo, useRef } from "react";
import { OUTFIT_DATA, getOutfitsContainingItem } from "../constants/mockOutfitData";
import {
  getItemWearFrequency,
  getItemLastWornDates,
  getAllWearHistory,
} from "../lib/wearHistoryStore";
import OutfitDetailScreen from "./OutfitDetailScreen";
import OutfitCanvasEditor from "./OutfitCanvasEditor";
import { MAIN_CATEGORIES } from "../constants/mockClosetData";
import { showToast } from "../lib/toastUtils";

const FONT = "'Spoqa Han Sans Neo', sans-serif";
const DARK = "#1a1a1a";

const SEASON_STYLE = {
  봄:  { color: "#D4436A", bg: "#FFF0F3" },
  여름: { color: "#1C7ED6", bg: "#EEF5FF" },
  가을: { color: "#C2601A", bg: "#FFF4EC" },
  겨울: { color: "#6D56D8", bg: "#F2EEFF" },
};

const CONDITION_BG = {
  "새 상품":    "#0066CC",
  "거의 새 것": "#1a1a1a",
  "상태 좋음":  "#555",
  "사용감 있음":"#888",
  "상태 나쁨":  "#CC2222",
};

function getCategoryEmoji(cat) {
  return (
    MAIN_CATEGORIES.find((c) => c.id === cat || c.label === cat)?.emoji ?? "👕"
  );
}

function formatRelDate(dateStr) {
  if (!dateStr) return "착용 기록 없음";
  const d    = new Date(dateStr + "T12:00:00");
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return "오늘";
  if (diff === 1) return "어제";
  if (diff < 7)  return `${diff}일 전`;
  if (diff < 30) return `${Math.floor(diff / 7)}주 전`;
  return `${Math.floor(diff / 30)}개월 전`;
}

function formatFullDate(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Sales copy generator ─────────────────────────────────────────────────────
function generateSalesCopy(item, saleMemo) {
  const name      = item.displayName ?? item.name ?? "아이템";
  const brand     = item.brand ?? "";
  const seasons   = Array.isArray(item.season)    ? item.season    : [item.season].filter(Boolean);
  const styleTags = Array.isArray(item.styleTags) ? item.styleTags : [];
  const size      = item.size      ?? "";
  const condition = item.condition ?? "";
  const material  = item.material  ?? "";
  const color     = item.color     ?? "";
  const price     = item.price > 0 ? `${Number(item.price).toLocaleString()}원` : "";
  const subCat    = item.subCategory ?? item.subcategory ?? "";
  const mainCat   = item.mainCategory ?? item.category ?? "";
  const catLabel  = subCat || mainCat;

  const lines = [];

  // Headline
  lines.push(`✨ ${brand ? `[${brand}] ` : ""}${name} 판매합니다`);
  lines.push("");

  // Item specs
  if (condition) lines.push(`📦 상태: ${condition}`);
  if (catLabel)  lines.push(`👗 카테고리: ${catLabel}`);
  if (size)      lines.push(`📏 사이즈: ${size}`);
  if (color)     lines.push(`🎨 색상: ${color}`);
  if (material)  lines.push(`🧵 소재: ${material}`);
  if (seasons.length > 0)   lines.push(`🍃 시즌: ${seasons.join(", ")}`);
  if (styleTags.length > 0) lines.push(`🏷️ 스타일: ${styleTags.join(", ")}`);
  if (price)     lines.push(`💰 정가: ${price}`);

  // Seller note
  if (saleMemo?.trim()) {
    lines.push("");
    lines.push("📝 판매자 코멘트");
    lines.push(saleMemo.trim());
  }

  lines.push("");
  lines.push("궁금한 점은 채팅으로 편하게 문의해 주세요 😊");

  return lines.join("\n");
}

// ─── Sale channel presets ─────────────────────────────────────────────────────
const SALE_CHANNELS = [
  { id: "karrot",      label: "당근마켓", emoji: "🥕" },
  { id: "bunjang",     label: "번개장터", emoji: "⚡" },
  { id: "joonggonara", label: "중고나라", emoji: "🛒" },
  { id: "other",       label: "기타",    emoji: "🔗" },
];

// ─── Single-image photo viewer (same height as ProductDetailPage carousel) ───
function ItemPhotoViewer({ image, name, condition }) {
  const condBg = CONDITION_BG[condition] ?? "#888";
  return (
    <div
      className="relative overflow-hidden shrink-0 bg-[#F5F5F5]"
      style={{ height: 340 }}
    >
      <img
        src={image}
        alt={name}
        className="w-full h-full"
        style={{ objectFit: "cover", objectPosition: "center top" }}
      />
      {/* Bottom-right page indicator placeholder (keeps layout consistent) */}
      <div
        className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full"
        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      >
        <span className="text-[11px] text-white font-medium">1 / 1</span>
      </div>
    </div>
  );
}

// ─── Sale toggle section ──────────────────────────────────────────────────────
function SaleSection({ item, onShowPreview }) {
  const [saleOn,       setSaleOn]       = useState(item.isForSale ?? false);
  const [saleMemo,     setSaleMemo]     = useState("");
  const [channelLinks, setChannelLinks] = useState(
    () => Object.fromEntries(SALE_CHANNELS.map((c) => [c.id, ""]))
  );

  function setLink(id, val) {
    setChannelLinks((prev) => ({ ...prev, [id]: val }));
  }

  return (
    <div className="px-5 py-4 bg-white" style={{ borderBottom: "1px solid #F5F5F5" }}>
      {/* Toggle row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[14px] font-bold" style={{ color: DARK, fontFamily: FONT }}>
            판매하기
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>
            {saleOn ? "현재 판매 중이에요" : "이 아이템을 판매할 수 있어요"}
          </p>
        </div>
        {/* Toggle switch */}
        <button
          onClick={() => setSaleOn((v) => !v)}
          className="relative rounded-full transition-all shrink-0"
          style={{
            width: 48,
            height: 28,
            backgroundColor: saleOn ? DARK : "#DDDDDD",
          }}
        >
          <div
            className="absolute top-1 rounded-full bg-white transition-all"
            style={{
              width: 20, height: 20,
              left: saleOn ? 24 : 4,
              boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
            }}
          />
        </button>
      </div>

      {/* Expanded sale form */}
      {saleOn && (
        <div className="mt-4 flex flex-col gap-3">
          {/* Sale memo */}
          <div>
            <p className="text-[11px] font-bold mb-1" style={{ color: "#888", fontFamily: FONT }}>
              판매용 메모
            </p>
            <p className="text-[10px] mb-1.5" style={{ color: "#BBBBBB", fontFamily: FONT }}>
              구매 경위, 실착 느낌, 특이사항 등을 적어두면 소개글에 반영돼요
            </p>
            <textarea
              value={saleMemo}
              onChange={(e) => setSaleMemo(e.target.value)}
              placeholder="예) 작년 봄 백화점 구매, 두 번 착용. 어깨 핏이 넉넉한 편이에요."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none"
              style={{
                backgroundColor: "#F8F8F8",
                border: "1px solid #EEEEEE",
                fontFamily: FONT,
                color: DARK,
                lineHeight: 1.6,
              }}
            />
          </div>

          {/* Auto-copy CTA */}
          <button
            onClick={() => onShowPreview(generateSalesCopy(item, saleMemo))}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl active:opacity-75"
            style={{
              background: "linear-gradient(135deg, #1a1a1a 0%, #333 100%)",
              color: "white",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <rect x="4" y="1.5" width="9" height="11" rx="1.5" stroke="white" strokeWidth="1.3" />
              <rect x="2" y="3.5" width="9" height="11" rx="1.5" fill="#1a1a1a" stroke="white" strokeWidth="1.3" />
              <path d="M4.5 7h6M4.5 9.5h4" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span className="text-[13px] font-bold" style={{ fontFamily: FONT }}>
              판매용 자동 소개글 복사하기
            </span>
          </button>

          {/* Platform links */}
          <div>
            <p className="text-[11px] font-bold mb-1.5" style={{ color: "#888", fontFamily: FONT }}>
              판매 플랫폼 링크
            </p>
            <div className="flex flex-col gap-2">
              {SALE_CHANNELS.map((ch) => (
                <div key={ch.id} className="flex items-center gap-2">
                  <div
                    className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[14px]"
                    style={{ backgroundColor: "#F0F0F0" }}
                  >
                    {ch.emoji}
                  </div>
                  <input
                    type="url"
                    value={channelLinks[ch.id]}
                    onChange={(e) => setLink(ch.id, e.target.value)}
                    placeholder={`${ch.label} 링크`}
                    className="flex-1 px-3 py-2 rounded-xl text-[12px] outline-none"
                    style={{
                      backgroundColor: "#F8F8F8",
                      border: channelLinks[ch.id] ? "1px solid #DDDDDD" : "1px solid #F0F0F0",
                      fontFamily: FONT,
                      color: DARK,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Wear history list ────────────────────────────────────────────────────────
function WearHistorySection({ itemId }) {
  const [historyOpen, setHistoryOpen] = useState(false);

  const wornDates = useMemo(() => {
    const store = getAllWearHistory();
    return Object.keys(store)
      .filter((d) => (store[d].itemIds ?? []).includes(itemId))
      .sort((a, b) => b.localeCompare(a));
  }, [itemId]);

  const wearCount = wornDates.length;
  const lastDate  = wornDates[0] ?? null;

  return (
    <div className="px-5 py-4 bg-white" style={{ borderBottom: "1px solid #F5F5F5" }}>
      {/* Stats boxes — same row, right box shows history when open */}
      <div className="flex gap-3 items-stretch">
        {/* 총 착용 횟수 — tap to toggle history */}
        <button
          onClick={() => wearCount > 0 && setHistoryOpen((v) => !v)}
          className="flex-1 flex flex-col items-center justify-center py-3 rounded-xl active:opacity-70"
          style={{
            backgroundColor: historyOpen ? "#F0F0F0" : "#F8F8F8",
            border: historyOpen ? "1.5px solid #E0E0E0" : "1.5px solid transparent",
          }}
        >
          <p
            className="text-[24px] font-bold leading-none"
            style={{ color: wearCount > 0 ? DARK : "#CCCCCC", fontFamily: FONT, letterSpacing: "-0.03em" }}
          >
            {wearCount}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <p className="text-[10px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>총 착용 횟수</p>
            {wearCount > 0 && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                style={{ transform: historyOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                <path d="M2.5 4L5 6.5L7.5 4" stroke="#AAAAAA" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </button>

        {/* Right box — 마지막 착용 OR 착용 기록 list */}
        <div
          className="flex-1 rounded-xl overflow-hidden"
          style={{ backgroundColor: "#F8F8F8", minHeight: 76 }}
        >
          {historyOpen ? (
            /* History list — scrollable inside the box */
            <div className="px-3 py-2.5 overflow-y-auto" style={{ maxHeight: 180 }}>
              <p className="text-[10px] font-bold mb-1.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>
                착용 기록
              </p>
              {wornDates.map((dateStr, i) => (
                <div
                  key={dateStr}
                  className="flex items-center justify-between py-1.5"
                  style={{ borderBottom: i < wornDates.length - 1 ? "1px solid #EEEEEE" : "none" }}
                >
                  <span className="text-[11px] font-medium" style={{ color: DARK, fontFamily: FONT }}>
                    {formatFullDate(dateStr)}
                  </span>
                  <span className="text-[10px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>
                    {formatRelDate(dateStr)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            /* 마지막 착용 */
            <div className="flex flex-col items-center justify-center h-full py-3">
              <p
                className="text-[15px] font-bold leading-none"
                style={{ color: lastDate ? DARK : "#CCCCCC", fontFamily: FONT }}
              >
                {formatRelDate(lastDate)}
              </p>
              <p className="text-[10px] mt-1" style={{ color: "#AAAAAA", fontFamily: FONT }}>마지막 착용</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Stylebook mini-card ──────────────────────────────────────────────────────
function StylebookCard({ outfit, onTap }) {
  return (
    <button
      onClick={() => onTap(outfit)}
      className="shrink-0 text-left active:opacity-80"
      style={{ width: 130 }}
    >
      <div className="rounded-xl overflow-hidden" style={{ height: 160, backgroundColor: "#F5F5F5" }}>
        <img
          src={outfit.previewImage}
          alt={outfit.title}
          className="w-full h-full"
          style={{ objectFit: "cover", objectPosition: "center top" }}
        />
      </div>
      <div className="mt-1.5">
        <p className="text-[12px] font-semibold truncate" style={{ color: DARK, fontFamily: FONT }}>
          {outfit.title}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 12L2.2 7.2C1.5 6.5 1.5 5.4 1.5 4.8C1.5 3.3 2.8 2 4.4 2C5.2 2 5.9 2.4 6.4 2.9L7 3.5L7.6 2.9C8.1 2.4 8.8 2 9.6 2C11.2 2 12.5 3.3 12.5 4.8C12.5 5.4 12.4 6.5 11.8 7.2L7 12Z"
              fill="#AAAAAA"
            />
          </svg>
          <span className="text-[10px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>
            {outfit.likes}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function ClosetItemDetailScreen({ item, onBack, onOutfitTap, onMakeStyle }) {
  const [activeOutfit,    setActiveOutfit]    = useState(null);
  const [openCanvas,      setOpenCanvas]      = useState(false);
  const [memo,            setMemo]            = useState(item.memo ?? "");
  const [editingMemo,     setEditingMemo]     = useState(false);
  const [showCopyPreview, setShowCopyPreview] = useState(false);
  const [generatedCopy,   setGeneratedCopy]   = useState("");
  const memoRef = useRef(null);

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  })();

  const relatedOutfits = useMemo(
    () => getOutfitsContainingItem(item.id, item),
    [item]
  );

  const seasons   = Array.isArray(item.season)    ? item.season    : [item.season].filter(Boolean);
  const styleTags = Array.isArray(item.styleTags) ? item.styleTags : [];
  const tags      = Array.isArray(item.tags)      ? item.tags      : [];

  const mainCat    = item.mainCategory ?? item.category ?? "상의";
  const subCat     = item.subCategory  ?? item.subcategory ?? "";
  const catEmoji   = getCategoryEmoji(mainCat);
  const catDisplay = subCat ? `${catEmoji} ${subCat}` : `${catEmoji} ${mainCat}`;

  const condBg = CONDITION_BG[item.condition] ?? "#888";

  async function handleShare() {
    const name = item.displayName ?? item.name;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${item.brand} ${name}`, text: "내 트렁크룸 아이템이에요!", url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("링크가 클립보드에 복사됐어요!");
      }
    } catch (_) {}
  }

  return (
    <div className="absolute inset-0 z-40 bg-white flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 shrink-0 bg-white"
        style={{ height: 50, borderBottom: "1px solid #F0F0F0" }}
      >
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 4L7 10L12.5 16" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button onClick={handleShare} className="w-9 h-9 flex items-center justify-center active:opacity-60">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 7L11 3L7 7" stroke="#333" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11 3V13" stroke="#333" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M4 12V16C4 16.55 4.45 17 5 17H15C15.55 17 16 16.55 16 16V12" stroke="#333" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>

        {/* 1. Photo */}
        <ItemPhotoViewer
          image={item.image}
          name={item.displayName ?? item.name}
          condition={item.condition}
        />

        {/* 2. Brand / name / tags */}
        <div className="px-5 pt-4 pb-4 bg-white" style={{ borderBottom: "1px solid #F5F5F5" }}>
          {/* Brand row — timestamp + condition badge right */}
          <div className="flex items-center justify-between gap-3">
            <p
              className="text-[14px] font-bold uppercase tracking-wide flex-1 min-w-0 truncate"
              style={{ color: "#888", fontFamily: FONT }}
            >
              {item.brand}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px]" style={{ color: "#BBBBBB", fontFamily: FONT }}>방금 등록</span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-sm text-white"
                style={{ backgroundColor: condBg, fontFamily: FONT }}
              >
                {item.condition}
              </span>
            </div>
          </div>
          {/* Name */}
          <h1
            className="text-[18px] font-bold leading-tight mt-0.5"
            style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}
          >
            {item.displayName ?? item.name}
          </h1>
          {/* Season + style tags */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {seasons.map((s) => {
              const st = SEASON_STYLE[s] ?? { color: "#888", bg: "#F5F5F5" };
              return (
                <span key={s} className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: st.bg, color: st.color, fontFamily: FONT }}>
                  {s}
                </span>
              );
            })}
            {styleTags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "#F2F2F2", color: "#555", fontFamily: FONT }}>
                {tag}
              </span>
            ))}
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "#F2F2F2", color: "#777", fontFamily: FONT }}>
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* 3. Meta grid: 카테고리 / 사이즈 / 구매가격 */}
        <div className="px-5 py-4 bg-white" style={{ borderBottom: "1px solid #F5F5F5" }}>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "카테고리", value: catDisplay },
              { label: "사이즈",   value: item.size ?? "—" },
              { label: "구매가격", value: item.price > 0 ? `${Number(item.price).toLocaleString()}원` : "—" },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col items-center py-3 rounded-xl"
                style={{ backgroundColor: "#F8F8F8" }}
              >
                <p className="text-[10px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>{label}</p>
                <p
                  className="text-[12px] font-bold mt-0.5 text-center px-1 leading-snug"
                  style={{ color: DARK, fontFamily: FONT }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Wear stats + collapsible history */}
        <WearHistorySection itemId={item.id} />

        {/* 5. Sale toggle + form */}
        <SaleSection
          item={item}
          onShowPreview={(copy) => {
            setGeneratedCopy(copy);
            setShowCopyPreview(true);
          }}
        />

        {/* 6. 🔒 Memo */}
        <div className="px-5 py-4 bg-white" style={{ borderBottom: "1px solid #F5F5F5" }}>
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-bold" style={{ color: DARK, fontFamily: FONT }}>메모</p>
              <span style={{ fontSize: 13 }}>🔒</span>
            </div>
            <button
              onClick={() => {
                setEditingMemo((v) => !v);
                if (!editingMemo) setTimeout(() => memoRef.current?.focus(), 50);
              }}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg"
              style={{ backgroundColor: "#F5F5F5", color: "#888", fontFamily: FONT }}
            >
              {editingMemo ? "완료" : "편집"}
            </button>
          </div>
          <p className="text-[10px] mb-2" style={{ color: "#BBBBBB", fontFamily: FONT }}>
            이 메모는 내 옷장에서만 보입니다
          </p>

          {editingMemo ? (
            <textarea
              ref={memoRef}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="나만 볼 수 있는 메모를 남겨보세요"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none"
              style={{
                backgroundColor: "#F8F8F8",
                border: "1px solid #EEEEEE",
                fontFamily: FONT,
                color: DARK,
                lineHeight: 1.6,
              }}
            />
          ) : memo.trim() ? (
            <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "#FAFAFA", border: "1px solid #F0F0F0" }}>
              <p className="text-[13px] leading-relaxed" style={{ color: "#555", fontFamily: FONT }}>
                {memo}
              </p>
            </div>
          ) : (
            <button
              onClick={() => { setEditingMemo(true); setTimeout(() => memoRef.current?.focus(), 50); }}
              className="w-full flex items-center gap-2 py-3 px-4 rounded-xl"
              style={{ backgroundColor: "#FAFAFA", border: "1px dashed #E0E0E0" }}
            >
              <span style={{ fontSize: 16, opacity: 0.4 }}>✏️</span>
              <p className="text-[12px]" style={{ color: "#CCCCCC", fontFamily: FONT }}>
                나만 볼 수 있는 메모를 남겨보세요
              </p>
            </button>
          )}
        </div>

        {/* 7. 이 아이템으로 만든 스타일북 */}
        <div className="py-5 bg-white" style={{ borderBottom: "1px solid #F5F5F5" }}>
          <div className="flex items-center justify-between px-5 mb-3">
            <p className="text-[14px] font-bold" style={{ color: DARK, fontFamily: FONT }}>
              이 아이템으로 만든 스타일북
            </p>
            <span className="text-[12px]" style={{ color: "#888", fontFamily: FONT }}>
              {relatedOutfits.length}개
            </span>
          </div>

          {relatedOutfits.length > 0 ? (
            <div
              className="flex gap-3 overflow-x-auto"
              style={{ scrollbarWidth: "none", paddingLeft: 20, paddingRight: 16 }}
            >
              {relatedOutfits.map((outfit) => (
                <StylebookCard
                  key={outfit.id}
                  outfit={outfit}
                  onTap={(o) => setActiveOutfit(o)}
                />
              ))}
              <div className="shrink-0 w-1" />
            </div>
          ) : (
            /* Fallback: show sample outfits from OUTFIT_DATA */
            <div
              className="flex gap-3 overflow-x-auto"
              style={{ scrollbarWidth: "none", paddingLeft: 20, paddingRight: 16 }}
            >
              {OUTFIT_DATA.slice(0, 3).map((outfit) => (
                <StylebookCard
                  key={outfit.id}
                  outfit={outfit}
                  onTap={(o) => setActiveOutfit(o)}
                />
              ))}
              <div className="shrink-0 w-1" />
            </div>
          )}
        </div>

        {/* Bottom spacer for CTA bar */}
        <div style={{ height: 80 }} />
      </div>

      {/* ── Bottom CTA ── */}
      <div
        className="shrink-0 bg-white px-4 py-3"
        style={{ borderTop: "1px solid #F0F0F0" }}
      >
        <button
          className="w-full h-12 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2"
          style={{ backgroundColor: DARK, color: "white", fontFamily: FONT }}
          onClick={() => onMakeStyle ? onMakeStyle(item) : setOpenCanvas(true)}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          이 아이템으로 스타일 만들기
        </button>
      </div>

      {/* ── Sales copy preview sheet ── */}
      {showCopyPreview && (
        <div
          className="absolute inset-0 z-50 flex flex-col justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={() => setShowCopyPreview(false)}
        >
          <div
            className="bg-white flex flex-col rounded-t-3xl overflow-hidden"
            style={{ maxHeight: "72%" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet header */}
            <div
              className="flex items-center justify-between px-5 shrink-0"
              style={{ paddingTop: 20, paddingBottom: 14, borderBottom: "1px solid #F0F0F0" }}
            >
              <div>
                <p className="text-[15px] font-bold" style={{ color: DARK, fontFamily: FONT }}>
                  판매용 소개글
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>
                  복사해서 판매 플랫폼에 붙여넣기 하세요
                </p>
              </div>
              <button
                onClick={() => setShowCopyPreview(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full"
                style={{ backgroundColor: "#F5F5F5" }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1L11 11M11 1L1 11" stroke="#888" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Generated copy — scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-4" style={{ scrollbarWidth: "none" }}>
              <div
                className="rounded-2xl px-4 py-4"
                style={{ backgroundColor: "#F8F8F8", border: "1px solid #EEEEEE" }}
              >
                <pre
                  className="text-[12px] leading-relaxed whitespace-pre-wrap"
                  style={{ color: "#333", fontFamily: FONT }}
                >
                  {generatedCopy}
                </pre>
              </div>
            </div>

            {/* Copy button */}
            <div className="px-5 pb-6 pt-3 shrink-0" style={{ borderTop: "1px solid #F5F5F5" }}>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(generatedCopy);
                    showToast("소개글이 클립보드에 복사됐어요!", "success");
                    setShowCopyPreview(false);
                  } catch (_) {
                    showToast("복사에 실패했어요. 직접 선택해 주세요.", "error");
                  }
                }}
                className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 active:opacity-75"
                style={{ backgroundColor: DARK, color: "white" }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="5" y="2" width="9" height="11" rx="1.5" stroke="white" strokeWidth="1.3" />
                  <rect x="2" y="4" width="9" height="11" rx="1.5" fill={DARK} stroke="white" strokeWidth="1.3" />
                  <path d="M4.5 8h5M4.5 10.5h3.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <span className="text-[14px] font-bold" style={{ fontFamily: FONT }}>
                  복사하기
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Stylebook detail overlay ── */}
      {activeOutfit && (
        <div className="absolute inset-0 z-50">
          <OutfitDetailScreen
            outfit={activeOutfit}
            onBack={() => setActiveOutfit(null)}
            onItemTap={() => setActiveOutfit(null)}
          />
        </div>
      )}

      {/* ── OutfitCanvasEditor — pre-loaded with this item ── */}
      {openCanvas && (
        <div className="absolute inset-0 z-50">
          <OutfitCanvasEditor
            initialItemIds={[item.id]}
            dateStr={todayStr}
            onSave={() => setOpenCanvas(false)}
            onClose={() => setOpenCanvas(false)}
          />
        </div>
      )}
    </div>
  );
}
