/**
 * PaybackHeroCard.jsx — 홈 최상단 "옷장 본전 게임" 히어로 카드
 *
 * 클로리스풍 게임 카드: 큼직한 숫자, 둥근 모서리, 트렁키 마스코트.
 *   - 옷장 회수율 게이지 (뽑은 가치 / 총 투자금)
 *   - 묶인 돈 / 본전 완료 통계 칩
 *   - 본전 임박 아이템 가로 스크롤 ("N번만 더!")
 */

import { useMemo } from "react";
import { getClosetPaybackSummary, formatKRW, PAYBACK_COLORS } from "../lib/payback.js";

const FONT   = "'Spoqa Han Sans Neo', sans-serif";
const DARK   = "#1a1a1a";
const YELLOW = "#F5C200";
const MINT   = PAYBACK_COLORS.done;

// ─── 트렁키 마스코트 (귀여운 트렁크 캐릭터) ──────────────────────────────────
export function TrunkyMascot({ size = 56, mood = "happy" }) {
  // mood: happy(웃음) | excited(신남) | sleepy(졸림 — 옷장이 잠잘 때)
  const mouth =
    mood === "excited" ? <ellipse cx="32" cy="40" rx="5" ry="4" fill="#7A4F1D" />
    : mood === "sleepy" ? <path d="M28 40H36" stroke="#7A4F1D" strokeWidth="2.4" strokeLinecap="round" />
    : <path d="M27 38C29 41.5 35 41.5 37 38" stroke="#7A4F1D" strokeWidth="2.4" strokeLinecap="round" fill="none" />;
  const eyes =
    mood === "sleepy" ? (
      <>
        <path d="M21 30C23 32 26 32 28 30" stroke="#7A4F1D" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <path d="M36 30C38 32 41 32 43 30" stroke="#7A4F1D" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      </>
    ) : (
      <>
        <circle cx="24.5" cy="30" r="2.8" fill="#7A4F1D" />
        <circle cx="39.5" cy="30" r="2.8" fill="#7A4F1D" />
      </>
    );

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* 손잡이 */}
      <path d="M24 14V11C24 8.8 25.8 7 28 7H36C38.2 7 40 8.8 40 11V14" stroke="#E0A800" strokeWidth="3.5" strokeLinecap="round" />
      {/* 몸통 */}
      <rect x="8" y="14" width="48" height="42" rx="10" fill={YELLOW} />
      {/* 뚜껑 라인 */}
      <path d="M8 23H56" stroke="#E0A800" strokeWidth="2.5" />
      {/* 버클 2개 */}
      <rect x="16" y="19" width="6" height="8" rx="2" fill="#E0A800" />
      <rect x="42" y="19" width="6" height="8" rx="2" fill="#E0A800" />
      {/* 볼터치 */}
      <circle cx="17" cy="36" r="3.4" fill="#FFDD66" opacity="0.9" />
      <circle cx="47" cy="36" r="3.4" fill="#FFDD66" opacity="0.9" />
      {eyes}
      {mouth}
    </svg>
  );
}

// ─── 임박 아이템 미니 카드 ───────────────────────────────────────────────────
function AlmostCard({ entry, onItemTap }) {
  const { item, pb } = entry;
  const img = item.image ?? item.image_url;
  return (
    <button
      onClick={() => onItemTap?.(item)}
      className="shrink-0 rounded-2xl bg-white overflow-hidden text-left transition-transform active:scale-95"
      style={{ width: 124, border: "2px solid #FFF0BB", boxShadow: "0 3px 10px rgba(0,0,0,0.05)" }}
    >
      <div className="w-full" style={{ height: 96, backgroundColor: "#FAFAFA" }}>
        {img ? (
          <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[28px]">👕</div>
        )}
      </div>
      <div className="px-2.5 pt-2 pb-2.5">
        <p className="text-[11px] font-bold truncate" style={{ color: DARK, fontFamily: FONT }}>
          {item.displayName ?? item.display_name ?? item.name}
        </p>
        {/* 게이지 */}
        <div className="mt-1.5 rounded-full overflow-hidden" style={{ height: 7, backgroundColor: "#F0F0F0" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.round(pb.progress * 100)}%`, backgroundColor: YELLOW, transition: "width 0.5s" }}
          />
        </div>
        <p className="text-[11px] font-bold mt-1.5" style={{ color: "#C99700", fontFamily: FONT }}>
          {pb.remaining}번만 더!
        </p>
      </div>
    </button>
  );
}

// ─── 통계 칩 ─────────────────────────────────────────────────────────────────
function StatChip({ emoji, label, value, accent }) {
  return (
    <div
      className="flex-1 rounded-2xl px-3 py-3 flex flex-col items-center gap-1"
      style={{ backgroundColor: "rgba(255,255,255,0.75)", border: "1.5px solid rgba(255,255,255,0.9)" }}
    >
      <span style={{ fontSize: 20 }}>{emoji}</span>
      <span className="text-[15px] font-bold leading-none" style={{ color: accent ?? DARK, fontFamily: FONT }}>
        {value}
      </span>
      <span className="text-[10px]" style={{ color: "#9A8A55", fontFamily: FONT }}>
        {label}
      </span>
    </div>
  );
}

// ─── 메인 카드 ───────────────────────────────────────────────────────────────
/**
 * @param {Object[]} items     — 정규화된 옷장 아이템 (price, mainCategory…)
 * @param {Map}      freqMap   — Map<itemId, wearCount>
 * @param {boolean}  isGuest   — 비로그인
 * @param {Function} onItemTap — 아이템 탭
 * @param {Function} onGoToCloset — 옷장 탭으로 이동
 */
export default function PaybackHeroCard({ items = [], freqMap = new Map(), isGuest = false, onItemTap, onGoToCloset }) {
  const s = useMemo(() => getClosetPaybackSummary(items, freqMap), [items, freqMap]);

  const recoveryPct = s.totalInvested > 0 ? Math.round((s.totalExtracted / s.totalInvested) * 100) : 0;

  // 마스코트 멘트
  const mascotLine = isGuest
    ? "옷장 속 잠든 돈, 같이 깨워볼까?"
    : s.pricedCount === 0
    ? "옷 가격을 적으면 본전 게임 시작!"
    : s.almostList.length > 0
    ? `본전 임박 ${s.almostList.length}벌! 오늘 입어주자~`
    : s.lockedCount > 0
    ? `${formatKRW(s.lockedMoney)}이 옷장에서 자고 있어요`
    : "옷장이 알차게 돌아가고 있어요!";

  const mood = s.almostList.length > 0 ? "excited" : s.lockedCount > 3 ? "sleepy" : "happy";

  return (
    <div className="px-4 pt-4 pb-2">
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(150deg, #FFF6D6 0%, #FFEDA8 55%, #FFE584 100%)",
          border: "2.5px solid #FFE584",
          boxShadow: "0 8px 24px rgba(245,194,0,0.22)",
        }}
      >
        {/* 헤더: 마스코트 + 멘트 */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <TrunkyMascot size={56} mood={mood} />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold tracking-wide" style={{ color: "#C99700", fontFamily: FONT }}>
              옷장 본전 게임
            </p>
            <p className="text-[15px] font-bold leading-snug mt-0.5" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>
              {mascotLine}
            </p>
          </div>
        </div>

        {isGuest || s.pricedCount === 0 ? (
          /* ── 게스트/가격 없음: 시작 유도 ── */
          <div className="px-5 pb-5">
            <p className="text-[12px] leading-relaxed mb-3" style={{ color: "#8A7A45", fontFamily: FONT }}>
              산 가격과 입은 날만 기록하면, 옷마다 회당 단가가 쭉쭉 떨어지는 재미를 볼 수 있어요.
            </p>
            <button
              onClick={onGoToCloset}
              className="w-full h-12 rounded-2xl text-[14px] font-bold transition-transform active:scale-95"
              style={{ backgroundColor: DARK, color: YELLOW, fontFamily: FONT, boxShadow: "0 4px 12px rgba(0,0,0,0.18)" }}
            >
              {isGuest ? "본전 게임 시작하기" : "옷장에 가격 채우러 가기"}
            </button>
          </div>
        ) : (
          <>
            {/* ── 회수율 게이지 ── */}
            <div className="px-5 pb-3">
              <div className="flex items-end justify-between mb-1.5">
                <span className="text-[12px] font-bold" style={{ color: "#8A7A45", fontFamily: FONT }}>
                  옷장 투자금 {formatKRW(s.totalInvested)} 중
                </span>
                <span className="text-[22px] font-bold leading-none" style={{ color: DARK, fontFamily: FONT }}>
                  {recoveryPct}%
                  <span className="text-[12px] font-bold ml-1" style={{ color: "#8A7A45" }}>회수</span>
                </span>
              </div>
              <div className="rounded-full overflow-hidden" style={{ height: 14, backgroundColor: "rgba(255,255,255,0.7)", border: "1.5px solid rgba(255,255,255,0.9)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, recoveryPct)}%`,
                    background: `linear-gradient(90deg, ${YELLOW}, ${MINT})`,
                    transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                />
              </div>
            </div>

            {/* ── 통계 칩 3개 ── */}
            <div className="flex gap-2 px-5 pb-4">
              <StatChip emoji="💤" label="묶인 돈"   value={formatKRW(s.lockedMoney)} accent="#D2691E" />
              <StatChip emoji="🏆" label="본전 완료" value={`${s.doneCount}벌`}        accent={MINT} />
              <StatChip emoji="🔥" label="본전 임박" value={`${s.almostList.length}벌`} accent="#C99700" />
            </div>

            {/* ── 본전 임박 가로 스크롤 ── */}
            {s.almostList.length > 0 && (
              <div className="pb-5">
                <p className="text-[12px] font-bold px-5 mb-2" style={{ color: "#8A7A45", fontFamily: FONT }}>
                  조금만 더 입으면 본전! 🔥
                </p>
                <div className="flex gap-2.5 overflow-x-auto px-5" style={{ scrollbarWidth: "none" }}>
                  {s.almostList.map((entry) => (
                    <AlmostCard key={entry.item.id} entry={entry} onItemTap={onItemTap} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
