/**
 * PaybackHeroCard.jsx — 홈 최상단 "옷장 본전" 얇은 요약 줄
 *
 * 한 줄짜리 슬림 바. 탭하면 옷장(본전 상세)으로 이동.
 *   - 데이터 있음: 회수율 + 얇은 게이지 + 묶인 돈/완료 요약
 *   - 데이터 없음(게스트/가격 미입력): 시작 유도 한 줄
 */

import { useMemo } from "react";
import { getClosetPaybackSummary, formatKRW, PAYBACK_COLORS } from "../lib/payback.js";

const FONT   = "'Spoqa Han Sans Neo', sans-serif";
const DARK   = "#1a1a1a";
const YELLOW = "#F5C200";
const MINT   = PAYBACK_COLORS.done;

// ─── 트렁키 (보조 캐릭터 — 캡쳐 시트 등에서 사용) ────────────────────────────
export function TrunkyMascot({ size = 56, mood = "happy" }) {
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
      <path d="M24 14V11C24 8.8 25.8 7 28 7H36C38.2 7 40 8.8 40 11V14" stroke="#E0A800" strokeWidth="3.5" strokeLinecap="round" />
      <rect x="8" y="14" width="48" height="42" rx="10" fill={YELLOW} />
      <path d="M8 23H56" stroke="#E0A800" strokeWidth="2.5" />
      <rect x="16" y="19" width="6" height="8" rx="2" fill="#E0A800" />
      <rect x="42" y="19" width="6" height="8" rx="2" fill="#E0A800" />
      <circle cx="17" cy="36" r="3.4" fill="#FFDD66" opacity="0.9" />
      <circle cx="47" cy="36" r="3.4" fill="#FFDD66" opacity="0.9" />
      {eyes}
      {mouth}
    </svg>
  );
}

// ─── 얇은 본전 요약 줄 ────────────────────────────────────────────────────────
export default function PaybackHeroCard({ items = [], freqMap = new Map(), isGuest = false, onItemTap, onGoToCloset }) {
  const s = useMemo(() => getClosetPaybackSummary(items, freqMap), [items, freqMap]);
  const recoveryPct = s.totalInvested > 0 ? Math.round((s.totalExtracted / s.totalInvested) * 100) : 0;
  const hasData = !isGuest && s.pricedCount > 0;

  // 데이터 있을 때 상황별 헤드라인 (팝하게)
  const dataHead =
    s.doneCount > 0       ? `본전 ${s.doneCount}벌 뽑았어요 🎉`
    : s.almostList.length > 0 ? `${s.almostList.length}벌 본전 임박 🔥`
    : s.lockedCount > 0   ? `${s.lockedCount}벌이 잠자는 중 💤`
    : "옷장이 잘 돌아가요 ✨";

  return (
    <div className="px-4 pt-3 pb-1">
      <button
        onClick={onGoToCloset}
        className="w-full flex items-center gap-3 rounded-[22px] px-4 py-3 text-left transition-transform active:scale-[0.97]"
        style={{
          background: "linear-gradient(115deg, #FFE14D 0%, #FFC73A 55%, #FFB52E 100%)",
          boxShadow: "0 6px 18px rgba(255,179,46,0.42)",
        }}
      >
        {/* 코인 */}
        <div
          className="shrink-0 flex items-center justify-center rounded-full"
          style={{ width: 44, height: 44, backgroundColor: "white", boxShadow: "0 2px 7px rgba(0,0,0,0.13)" }}
        >
          <span style={{ fontSize: 23 }}>💸</span>
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          {hasData ? (
            <>
              <p className="text-[15.5px] font-extrabold leading-tight" style={{ color: "#1a1a1a", fontFamily: FONT, letterSpacing: "-0.03em" }}>
                {dataHead}
              </p>
              <p className="text-[11.5px] font-bold mt-0.5 truncate" style={{ color: "#8A5A00", fontFamily: FONT }}>
                묶인 돈 {formatKRW(s.lockedMoney)} · 회수율 {recoveryPct}%
              </p>
            </>
          ) : (
            <>
              <p className="text-[15.5px] font-extrabold leading-tight" style={{ color: "#1a1a1a", fontFamily: FONT, letterSpacing: "-0.03em" }}>
                내 옷, 한 번에 얼마? 💸
              </p>
              <p className="text-[11.5px] font-bold mt-0.5" style={{ color: "#8A5A00", fontFamily: FONT }}>
                사면 본전 뽑을 때까지 같이 세어봐요
              </p>
            </>
          )}
        </div>

        {/* 화살표 */}
        <div className="shrink-0 flex items-center justify-center rounded-full" style={{ width: 27, height: 27, backgroundColor: "rgba(255,255,255,0.55)" }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M6 3.5L10.5 8L6 12.5" stroke="#7A4A00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>
    </div>
  );
}
