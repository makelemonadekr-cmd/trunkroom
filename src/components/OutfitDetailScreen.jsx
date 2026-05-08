/**
 * OutfitDetailScreen.jsx
 *
 * Full-screen detail for a single outfit / coordination card.
 *
 * Layout:
 *   1. Hero — full-width style reference image (from coordi/"스타일" pool)
 *      with mood/season/title overlay.
 *
 *   2. Coordi Board — split composition:
 *      Left  (48%): style reference cropped thumbnail
 *      Right (52%): matched item cutouts on cream bg (mix-blend-mode:multiply
 *                   approximates background removal for product-shot images)
 *      This mirrors the "스타일 이미지 + 클로스 이미지 합성" requirement.
 *
 *   3. 스타일 속 아이템 — clickable item rows:
 *      Each row calls onItemTap(item) so the user can navigate to the full
 *      ClosetItemDetailScreen for any item in the look.
 *
 * Props:
 *   outfit      OutfitRecord from OUTFIT_DATA
 *   onBack      () => void
 *   onItemTap   (item: ClosetItem) => void   optional
 */

import { useState } from "react";
import LazyImage from "./LazyImage";
import SimilarClosetScreen from "./SimilarClosetScreen";
import StyleBoardTemplate from "./StyleBoardTemplate";
import ReportSheet from "./ReportSheet";
import { useAuth } from "../hooks/useAuth";
import { useCloset } from "../hooks/useCloset.js";
import { blockUser } from "../services/moderationService";
import { showToast } from "../lib/toastUtils";

const FONT   = "'Spoqa Han Sans Neo', sans-serif";
const DARK   = "#1a1a1a";
const YELLOW = "#F5C200";
const CREAM  = "#F5F2EC";   // warm cream — makes white product-shot BGs disappear
                             // via mix-blend-mode: multiply

// CoordiBoardSection removed — replaced by StyleBoardTemplate

// ─── Item row (clickable) ─────────────────────────────────────────────────────
function ItemRow({ item, last = false, onTap }) {
  return (
    <button
      onClick={() => onTap?.(item)}
      className="w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors text-left"
      style={{ borderBottom: last ? "none" : `1px solid #F5F5F5` }}
    >
      {/* Thumbnail — mix-blend-mode: multiply on cream bg for cutout effect */}
      <div
        className="rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
        style={{ width: 56, height: 56, backgroundColor: CREAM }}
      >
        <img
          src={item.image}
          alt={item.displayName ?? item.name}
          crossOrigin="anonymous"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
            mixBlendMode: "multiply",
          }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wide truncate" style={{ color: "#AAAAAA", fontFamily: FONT }}>
          {item.brand}
        </p>
        <p className="text-[13px] font-medium mt-0.5 truncate" style={{ color: DARK, fontFamily: FONT }}>
          {item.displayName ?? item.name}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>
          {item.mainCategory ?? item.category} · {item.color}
        </p>
      </div>

      {/* Category badge + chevron */}
      <div className="shrink-0 flex items-center gap-1.5">
        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium"
          style={{ backgroundColor: "#F5F5F5", color: "#888", fontFamily: FONT }}>
          {item.subCategory ?? item.subcategory ?? item.mainCategory ?? item.category}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M4.5 2L7.5 6L4.5 10" stroke="#CCCCCC" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </button>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function OutfitDetailScreen({ outfit, onBack, onItemTap, onMakeStyle }) {
  const { user } = useAuth();
  const { items: rawItems } = useCloset(user?.id);
  const closetItems = rawItems.map((r) => ({
    id:          r.id,
    name:        r.name        || "아이템",
    displayName: r.display_name ?? r.name ?? "아이템",
    image:       r.image_url   ?? null,
    mainCategory: r.main_category ?? "기타",
  }));

  const [liked,       setLiked]       = useState(false);
  const [likes,       setLikes]       = useState(outfit.likes ?? 0);
  const [similarOpen, setSimilarOpen] = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [reportOpen,  setReportOpen]  = useState(false);

  const ownerId = outfit?._profile?.id ?? outfit?.user_id ?? null;
  const isOwn = ownerId && user?.id && ownerId === user.id;

  async function handleBlock() {
    if (!user?.id || !ownerId) return;
    setMenuOpen(false);
    const ok = window.confirm("이 사용자를 차단하면 더 이상 이 사용자의 콘텐츠가 보이지 않습니다. 차단할까요?");
    if (!ok) return;
    const { error } = await blockUser(user.id, ownerId);
    if (error) showToast("차단 실패: " + (error.message ?? ""), "error");
    else { showToast("차단 완료", "success"); onBack?.(); }
  }

  function handleLike(e) {
    e.stopPropagation();
    setLiked((v) => !v);
    setLikes((n) => (liked ? n - 1 : n + 1));
  }

  // Try to resolve from current user's closet (works when viewing own outfits)
  const resolvedItems = (outfit.itemIds ?? [])
    .map((id) => closetItems.find((item) => item.id === id))
    .filter(Boolean);
  // Also try outfit.items if pre-resolved by caller
  const directItems = Array.isArray(outfit.items) ? outfit.items : [];
  const displayItems = directItems.length > 0
    ? directItems
    : resolvedItems.length > 0
      ? resolvedItems
      : [];

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white overflow-hidden">

      {/* ── 1. Hero — style reference image (from coordi/"스타일" pool) ── */}
      <div className="relative shrink-0" style={{ height: 300 }}>
        <LazyImage
          src={outfit.previewImage}
          alt={outfit.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
          priority
          crossOrigin="anonymous"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.08) 55%, transparent 100%)" }}
        />

        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.88)", backdropFilter: "blur(8px)" }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 4L7 10L12.5 16" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* More menu (report/block) — only for non-own content */}
        {!isOwn && ownerId && (
          <button
            onClick={() => setMenuOpen(true)}
            className="absolute top-4 right-[88px] w-10 h-10 flex items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.88)", backdropFilter: "blur(8px)" }}
            aria-label="더보기"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="4" cy="9" r="1.4" fill={DARK} />
              <circle cx="9" cy="9" r="1.4" fill={DARK} />
              <circle cx="14" cy="9" r="1.4" fill={DARK} />
            </svg>
          </button>
        )}

        {/* Like button */}
        <button
          onClick={handleLike}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-2 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.88)", backdropFilter: "blur(8px)" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 12L1.5 6.5C1 6 1 5.5 1 4.8C1 3.2 2.5 2 4.2 2C5.1 2 5.9 2.5 6.5 3.1L7 3.7L7.5 3.1C8.1 2.5 8.9 2 9.8 2C11.5 2 13 3.2 13 4.8C13 5.5 12.9 6 12.5 6.5L7 12Z"
              fill={liked ? "#E84040" : "none"}
              stroke={liked ? "#E84040" : "#555"}
              strokeWidth="1.3"
            />
          </svg>
          <span className="text-[12px] font-medium" style={{ color: liked ? "#E84040" : "#555", fontFamily: FONT }}>
            {likes}
          </span>
        </button>

        {/* Style badge */}
        <div className="absolute top-[60px] left-4">
          <span
            className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide"
            style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "white", fontFamily: FONT, backdropFilter: "blur(6px)" }}
          >
            {outfit.style}
          </span>
        </div>

        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
          <div className="flex flex-wrap gap-1 mb-2">
            {(outfit.season ?? []).map((s) => (
              <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: "rgba(245,194,0,0.22)", color: YELLOW, fontFamily: FONT, border: "1px solid rgba(245,194,0,0.3)" }}>
                {s}
              </span>
            ))}
          </div>
          <h2 className="text-[19px] font-bold text-white leading-snug" style={{ fontFamily: FONT, letterSpacing: "-0.02em" }}>
            {outfit.title}
          </h2>
          <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.62)", fontFamily: FONT }}>
            {outfit.shortDesc}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {(outfit.tags ?? []).map((tag) => (
              <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.72)", fontFamily: FONT }}>
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>

        {/* ── 2. Style Board — outfit photo + item cards ── */}
        <div className="px-4 pt-4 pb-4">
          <StyleBoardTemplate
            photoUrl={outfit.previewImage}
            items={displayItems}
            width={375 - 32}   // 375px shell minus 16px side padding × 2
            showText={false}
            style={{ borderRadius: 16 }}
          />
        </div>

        {/* ── 3. 스타일 속 아이템 ── */}
        <div style={{ borderTop: `1px solid #F0F0F0` }}>

          {/* Section header */}
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: `1px solid #F0F0F0` }}>
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase mb-0.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>
              ITEMS IN THIS LOOK
            </p>
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>
                스타일 속 아이템
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                style={{ backgroundColor: DARK, color: "white", fontFamily: FONT }}>
                {displayItems.length}개
              </span>
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>
              탭해서 아이템 상세 정보를 확인해보세요
            </p>
          </div>

          {/* Item rows — each one is tappable */}
          <div className="bg-white">
            {displayItems.map((item, i) => (
              <ItemRow
                key={item.id}
                item={item}
                last={i === displayItems.length - 1}
                onTap={onItemTap}
              />
            ))}
          </div>
        </div>

        {/* ── 나도 비슷하게 코디해볼까? ── */}
        <div className="px-4 py-4" style={{ borderTop: "1px solid #F0F0F0" }}>
          <button
            onClick={() => setSimilarOpen(true)}
            className="w-full rounded-2xl px-4 py-4 flex items-center justify-between active:opacity-80"
            style={{ backgroundColor: "#FEFCE8", border: `1.5px solid ${YELLOW}` }}
          >
            <div className="text-left">
              <p className="text-[13px] font-bold" style={{ color: DARK, fontFamily: FONT }}>
                나도 비슷하게 코디해볼까?
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "#888", fontFamily: FONT }}>
                내 옷장에서 비슷한 아이템을 찾아드려요
              </p>
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: DARK }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3L11 8L6 13" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>
        </div>

        {/* Bottom spacer */}
        <div style={{ height: 32 }} />
      </div>

      {/* Similar closet overlay */}
      {similarOpen && (
        <SimilarClosetScreen
          wornItems={displayItems}
          onBack={() => setSimilarOpen(false)}
          onItemTap={(item) => { setSimilarOpen(false); onItemTap?.(item); }}
          onMakeStyle={onMakeStyle ? (item) => {
            setSimilarOpen(false);
            onMakeStyle(item);
          } : undefined}
        />
      )}

      {/* Action menu (report/block) */}
      {menuOpen && (
        <div
          className="absolute inset-0 z-40 flex items-end"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="w-full bg-white rounded-t-2xl p-2"
            style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))", fontFamily: FONT }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { setMenuOpen(false); setReportOpen(true); }}
              className="w-full py-3.5 text-[14px] text-left px-4 rounded-xl active:bg-gray-50"
              style={{ color: "#E84040" }}
            >
              🚩 신고하기
            </button>
            <button
              onClick={handleBlock}
              className="w-full py-3.5 text-[14px] text-left px-4 rounded-xl active:bg-gray-50"
              style={{ color: "#E84040" }}
            >
              🚫 사용자 차단
            </button>
            <button
              onClick={() => setMenuOpen(false)}
              className="w-full py-3.5 text-[14px] text-left px-4 rounded-xl active:bg-gray-50"
              style={{ color: "#666" }}
            >
              취소
            </button>
          </div>
        </div>
      )}

      <ReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="style"
        targetId={outfit?.id}
      />
    </div>
  );
}
