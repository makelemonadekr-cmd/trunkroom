/**
 * ClosetWrappedScreen.jsx — "내 옷장 결산" 리포트 (스포티파이 Wrapped 스타일)
 *
 * 공유하고 싶어지는 한 장 → 바이럴 성장 + 대출 발표 데모.
 * 데이터: 옷장(가격) × 착용기록 × 본전 엔진.
 */

import { useMemo } from "react";
import {
  getClosetPaybackSummary, getItemPayback, formatKRW, formatKRWFull,
} from "../lib/payback.js";
import { coupangSearchLink } from "../constants/partnerProducts.js";
import { openExternalUrl } from "../constants/appConfig.js";
import { showToast } from "../lib/toastUtils.js";
import RecommendStrip from "./RecommendStrip.jsx";

const FONT   = "'Spoqa Han Sans Neo', sans-serif";
const YELLOW = "#F5C200";
const MINT   = "#3DCB87";

function StatBlock({ kicker, value, sub, accent = "white" }) {
  return (
    <div className="px-6 py-7" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
      <p className="text-[12px] font-bold tracking-wide" style={{ color: "rgba(255,255,255,0.55)", fontFamily: FONT }}>{kicker}</p>
      <p className="text-[34px] font-extrabold leading-tight mt-1" style={{ color: accent, fontFamily: FONT, letterSpacing: "-0.03em" }}>{value}</p>
      {sub && <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.7)", fontFamily: FONT }}>{sub}</p>}
    </div>
  );
}

export default function ClosetWrappedScreen({ closetItems = [], wearFreqMap = new Map(), displayName = "내", onClose }) {
  const stats = useMemo(() => {
    const s = getClosetPaybackSummary(closetItems, wearFreqMap);
    let totalWears = 0, mostWorn = null, mostWornCount = 0;
    closetItems.forEach((it) => {
      const w = wearFreqMap.get(it.id) ?? 0;
      totalWears += w;
      if (w > mostWornCount) { mostWornCount = w; mostWorn = it; }
    });
    return { ...s, totalWears, mostWorn, mostWornCount };
  }, [closetItems, wearFreqMap]);

  const best = stats.bestItem; // {item, pb} 가성비 최고
  const year = new Date().getFullYear();

  async function handleShare() {
    const text =
`📊 ${displayName} 옷장 결산
· 옷장 투자금 ${formatKRWFull(stats.totalInvested)}
· 회수율 ${stats.totalInvested ? Math.round(stats.totalExtracted / stats.totalInvested * 100) : 0}%
· 본전 뽑은 옷 ${stats.doneCount}벌
· 잠자는 돈 ${formatKRWFull(stats.lockedMoney)}
— 트렁크룸에서 내 옷장도 계산해보기`;
    try {
      if (navigator.share) await navigator.share({ title: "내 옷장 결산", text });
      else { await navigator.clipboard.writeText(text); showToast("결산이 복사됐어요! 친구에게 공유해보세요 📋", "success"); }
    } catch (e) { /* 취소 무시 */ }
  }

  const recoveryPct = stats.totalInvested ? Math.round(stats.totalExtracted / stats.totalInvested * 100) : 0;

  return (
    <div className="absolute inset-0 z-[70] flex flex-col" style={{ background: "linear-gradient(165deg, #1a1a1a 0%, #2a2418 55%, #3a2f12 100%)" }}>
      {/* 헤더 */}
      <div className="shrink-0 flex items-center justify-between px-4" style={{ height: 52 }}>
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.12)" }} aria-label="닫기">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3L13 13M13 3L3 13" stroke="white" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </button>
        <span className="text-[13px] font-bold" style={{ color: "rgba(255,255,255,0.6)", fontFamily: FONT }}>{year} 옷장 결산</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {/* 타이틀 */}
        <div className="px-6 pt-4 pb-6">
          <p className="text-[15px] font-bold" style={{ color: YELLOW, fontFamily: FONT }}>{displayName}님의 옷장은</p>
          <p className="text-[26px] font-extrabold leading-tight mt-1" style={{ color: "white", fontFamily: FONT, letterSpacing: "-0.03em" }}>
            올해 이렇게 일했어요 💼
          </p>
        </div>

        {stats.pricedCount === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-[40px]">📊</p>
            <p className="text-[15px] font-bold mt-3" style={{ color: "white", fontFamily: FONT }}>아직 결산할 데이터가 적어요</p>
            <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.6)", fontFamily: FONT }}>
              옷에 가격을 적고 입은 날을 기록하면{"\n"}연말에 멋진 결산을 받아볼 수 있어요.
            </p>
          </div>
        ) : (
          <>
            <StatBlock kicker="옷장에 넣은 돈" value={formatKRW(stats.totalInvested)} sub={`가격을 기록한 옷 ${stats.pricedCount}벌`} />
            <StatBlock kicker="그중 입어서 회수한 비율" value={`${recoveryPct}%`} sub={`${formatKRW(stats.totalExtracted)}어치를 입어서 뽑았어요`} accent={MINT} />
            <StatBlock kicker="총 착용 횟수" value={`${stats.totalWears}번`} sub={stats.mostWorn ? `가장 자주 입은 옷: ${stats.mostWorn.displayName ?? stats.mostWorn.name} (${stats.mostWornCount}번)` : null} />
            {best && (
              <StatBlock
                kicker="올해의 가성비 甲"
                value={best.item.displayName ?? best.item.name}
                sub={`${best.pb.wears}번 입어서 회당 ${formatKRWFull(best.pb.costPerWear)} — 진짜 명품 👑`}
                accent={YELLOW}
              />
            )}
            <StatBlock kicker="본전 뽑은 옷" value={`${stats.doneCount}벌`} sub="입을수록 이득인 효자템들" accent={MINT} />
            <StatBlock
              kicker="아직 잠자는 돈"
              value={formatKRW(stats.lockedMoney)}
              sub={stats.lockedCount > 0 ? `안 입는 옷 ${stats.lockedCount}벌에 묶여 있어요` : "잘 돌아가고 있어요!"}
              accent="#FF8A5C"
            />

            {/* 쿠팡 제휴 — 잠자는 돈으로 진짜 필요한 거 */}
            {stats.lockedCount > 0 && (
              <div className="px-6 py-5">
                <button
                  onClick={() => openExternalUrl(coupangSearchLink("기본템 베이직", "wrapped"))}
                  className="w-full rounded-2xl py-3.5 text-[13.5px] font-bold transition-transform active:scale-95"
                  style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "white", fontFamily: FONT, border: "1px solid rgba(255,255,255,0.18)" }}
                >
                  💡 잠자는 옷 정리하고 진짜 필요한 것만 사기 →
                </button>
              </div>
            )}
          </>
        )}

        {/* 노브라블럼 추천 (밝은 영역) */}
        <div className="bg-white rounded-t-3xl mt-3 pb-4">
          <RecommendStrip title="옷장에 하나쯤, 노브라블럼" subtitle="같은 회사가 만든 베이직" />
        </div>
      </div>

      {/* 공유 */}
      <div className="shrink-0 px-5 pb-6 pt-3 bg-white">
        <button
          onClick={handleShare}
          className="w-full rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95"
          style={{ height: 52, backgroundColor: YELLOW, color: "#1a1a1a", fontFamily: FONT, boxShadow: "0 4px 14px rgba(245,194,0,0.4)" }}
        >
          <span style={{ fontSize: 17 }}>📤</span>
          <span className="text-[15px] font-bold">내 옷장 결산 공유하기</span>
        </button>
      </div>
    </div>
  );
}
