/**
 * PaybackHeroCard.jsx — 홈 최상단 "옷장 본전 게임" 히어로 카드
 *
 * 클루리스(1995) 무드: 셰어의 옷장 컴퓨터.
 *   - 옐로 타탄체크(셰어의 노란 체크 수트) 프레임
 *   - 레트로 소프트웨어 타이틀바
 *   - 당당하고 위트 있는 잇걸 카피
 *
 * 내용: 옷장 회수율 게이지 + 묶인 돈/본전 완료 칩 + 본전 임박 스크롤
 */

import { useMemo } from "react";
import { getClosetPaybackSummary, formatKRW, PAYBACK_COLORS } from "../lib/payback.js";

const FONT   = "'Spoqa Han Sans Neo', sans-serif";
const DARK   = "#1a1a1a";
const YELLOW = "#F5C200";
const MINT   = PAYBACK_COLORS.done;

// 셰어의 옐로 타탄체크 — CSS repeating-gradient 2겹으로 직조
const PLAID_BG = {
  backgroundColor: YELLOW,
  backgroundImage: [
    "repeating-linear-gradient(0deg, transparent 0px, transparent 12px, rgba(26,26,26,0.16) 12px, rgba(26,26,26,0.16) 15px, transparent 15px, transparent 21px, rgba(255,255,255,0.4) 21px, rgba(255,255,255,0.4) 23px)",
    "repeating-linear-gradient(90deg, transparent 0px, transparent 12px, rgba(26,26,26,0.16) 12px, rgba(26,26,26,0.16) 15px, transparent 15px, transparent 21px, rgba(255,255,255,0.4) 21px, rgba(255,255,255,0.4) 23px)",
  ].join(", "),
};

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

// ─── 임박 아이템 미니 카드 ───────────────────────────────────────────────────
function AlmostCard({ entry, onItemTap }) {
  const { item, pb } = entry;
  const img = item.image ?? item.image_url;
  return (
    <button
      onClick={() => onItemTap?.(item)}
      className="shrink-0 rounded-xl bg-white overflow-hidden text-left transition-transform active:scale-95"
      style={{ width: 124, border: "1.5px solid #EAEAEA", boxShadow: "0 3px 10px rgba(0,0,0,0.06)" }}
    >
      <div className="w-full" style={{ height: 96, backgroundColor: "#FAFAFA" }}>
        {img ? (
          <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[28px]">👗</div>
        )}
      </div>
      <div className="px-2.5 pt-2 pb-2.5">
        <p className="text-[11px] font-bold truncate" style={{ color: DARK, fontFamily: FONT }}>
          {item.displayName ?? item.display_name ?? item.name}
        </p>
        <div className="mt-1.5 rounded-full overflow-hidden" style={{ height: 7, backgroundColor: "#F0F0F0" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.round(pb.progress * 100)}%`, backgroundColor: YELLOW, transition: "width 0.5s" }}
          />
        </div>
        <p className="text-[11px] font-bold mt-1.5" style={{ color: "#B8860B", fontFamily: FONT }}>
          {pb.remaining}번이면 본전
        </p>
      </div>
    </button>
  );
}

// ─── 통계 칩 ─────────────────────────────────────────────────────────────────
function StatChip({ label, value, accent }) {
  return (
    <div
      className="flex-1 rounded-xl px-3 py-2.5 flex flex-col items-center gap-0.5"
      style={{ backgroundColor: "#FAFAFA", border: "1.5px solid #F0F0F0" }}
    >
      <span className="text-[16px] font-bold leading-none" style={{ color: accent ?? DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>
        {value}
      </span>
      <span className="text-[10px] font-bold tracking-wide" style={{ color: "#999", fontFamily: FONT }}>
        {label}
      </span>
    </div>
  );
}

// ─── 메인 카드 ───────────────────────────────────────────────────────────────
export default function PaybackHeroCard({ items = [], freqMap = new Map(), isGuest = false, onItemTap, onGoToCloset }) {
  const s = useMemo(() => getClosetPaybackSummary(items, freqMap), [items, freqMap]);

  const recoveryPct = s.totalInvested > 0 ? Math.round((s.totalExtracted / s.totalInvested) * 100) : 0;

  // 잇걸 카피 — 당당하고 위트 있게 (클루리스 톤)
  const heroLine = isGuest
    ? "이 옷장, 본전은 뽑고 있니?"
    : s.pricedCount === 0
    ? "가격을 알아야 본전을 따지지."
    : s.almostList.length > 0
    ? `${s.almostList.length}벌이 본전 코앞. 오늘 입으면 이득.`
    : s.lockedCount > 0
    ? `${formatKRW(s.lockedMoney)}이 옷걸이에서 놀고 있어.`
    : "완벽해. 옷장이 일하고 있어.";

  return (
    <div className="px-4 pt-4 pb-2">
      {/* 타탄체크 프레임 */}
      <div className="rounded-3xl p-[7px]" style={{ ...PLAID_BG, boxShadow: "0 8px 24px rgba(245,194,0,0.25)" }}>
        <div className="rounded-[18px] bg-white overflow-hidden">

          {/* 레트로 소프트웨어 타이틀바 — 셰어의 옷장 컴퓨터 */}
          <div
            className="flex items-center justify-between px-4"
            style={{ height: 34, backgroundColor: DARK }}
          >
            <div className="flex items-center gap-1.5">
              <span className="rounded-full" style={{ width: 8, height: 8, backgroundColor: "#FF5F57" }} />
              <span className="rounded-full" style={{ width: 8, height: 8, backgroundColor: YELLOW }} />
              <span className="rounded-full" style={{ width: 8, height: 8, backgroundColor: MINT }} />
            </div>
            <span
              className="text-[10px] font-bold tracking-[0.18em] uppercase"
              style={{ color: YELLOW, fontFamily: FONT }}
            >
              My Closet · 본전 게임
            </span>
            <span className="text-[10px]" style={{ color: "#555" }}>▾</span>
          </div>

          {/* 헤드라인 */}
          <div className="px-5 pt-4 pb-3">
            <p
              className="text-[18px] font-bold leading-snug"
              style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.03em" }}
            >
              {heroLine}
            </p>
          </div>

          {isGuest || s.pricedCount === 0 ? (
            /* ── 시작 유도 ── */
            <div className="px-5 pb-5">
              <p className="text-[12.5px] leading-relaxed mb-4" style={{ color: "#888", fontFamily: FONT }}>
                산 가격과 입은 날만 기록하면 옷마다 회당 단가가 떨어지는 게 보여요.
                안 입는 옷은 돈이 묶인 거고, 자주 입는 옷이 진짜 명품이에요.
              </p>
              <button
                onClick={onGoToCloset}
                className="w-full rounded-xl text-[14px] font-bold transition-transform active:scale-95"
                style={{ backgroundColor: DARK, color: YELLOW, fontFamily: FONT, height: 50 }}
              >
                {isGuest ? "내 옷장 계산 시작하기" : "옷장에 가격 채우러 가기"}
              </button>
            </div>
          ) : (
            <>
              {/* ── 회수율 ── */}
              <div className="px-5 pb-4">
                <div className="flex items-end justify-between mb-2">
                  <span className="text-[11px] font-bold tracking-wide uppercase" style={{ color: "#AAAAAA", fontFamily: FONT }}>
                    투자금 {formatKRW(s.totalInvested)} 회수율
                  </span>
                  <span className="text-[26px] font-bold leading-none" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.04em" }}>
                    {recoveryPct}<span className="text-[14px]">%</span>
                  </span>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: 12, backgroundColor: "#F2F2F2" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(2, recoveryPct))}%`,
                      background: `linear-gradient(90deg, ${YELLOW}, ${MINT})`,
                      transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  />
                </div>
              </div>

              {/* ── 통계 칩 ── */}
              <div className="flex gap-2 px-5 pb-4">
                <StatChip label="묶인 돈"   value={formatKRW(s.lockedMoney)} accent="#D2691E" />
                <StatChip label="본전 완료" value={`${s.doneCount}벌`}        accent={MINT} />
                <StatChip label="본전 임박" value={`${s.almostList.length}벌`} accent="#B8860B" />
              </div>

              {/* ── 본전 임박 스크롤 ── */}
              {s.almostList.length > 0 && (
                <div className="pb-5">
                  <p className="text-[11px] font-bold tracking-wide uppercase px-5 mb-2" style={{ color: "#AAAAAA", fontFamily: FONT }}>
                    오늘 입으면 이득인 옷
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
    </div>
  );
}
