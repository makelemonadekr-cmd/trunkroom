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

  return (
    <div className="px-4 pt-3 pb-1">
      <button
        onClick={onGoToCloset}
        className="w-full flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-transform active:scale-[0.98]"
        style={{ backgroundColor: "#FFF9E3", border: "1px solid #F6E6A8" }}
      >
        {/* 아이콘 */}
        <div
          className="shrink-0 flex items-center justify-center rounded-full"
          style={{ width: 34, height: 34, backgroundColor: YELLOW }}
        >
          <span style={{ fontSize: 17 }}>💰</span>
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-bold" style={{ color: DARK, fontFamily: FONT }}>
              옷장 본전
            </span>
            {hasData && (
              <span className="text-[13px] font-bold shrink-0" style={{ color: "#B8860B", fontFamily: FONT }}>
                회수율 {recoveryPct}%
              </span>
            )}
          </div>

          {hasData ? (
            <>
              <div className="mt-1.5 rounded-full overflow-hidden" style={{ height: 5, backgroundColor: "#F0E4B8" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(2, Math.min(100, recoveryPct))}%`,
                    background: `linear-gradient(90deg, ${YELLOW}, ${MINT})`,
                    transition: "width 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                />
              </div>
              <p className="text-[11px] mt-1 truncate" style={{ color: "#9A8A55", fontFamily: FONT }}>
                묶인 돈 {formatKRW(s.lockedMoney)} · 본전 완료 {s.doneCount}벌
              </p>
            </>
          ) : (
            <p className="text-[11.5px] mt-0.5" style={{ color: "#9A8A55", fontFamily: FONT }}>
              이 옷 한 번 입는 데 얼마였을까? 계산해볼까요?
            </p>
          )}
        </div>

        {/* 화살표 */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <path d="M6 3.5L10.5 8L6 12.5" stroke="#C9A227" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
