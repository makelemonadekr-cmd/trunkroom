/**
 * UpgradeSheet.jsx
 *
 * Freemium paywall bottom sheet.
 * Stage 1: UI only — no real payment. Shows pricing and "준비 중" toast.
 * Stage 2: wire up Apple IAP via RevenueCat + Capacitor.
 *
 * Usage:
 *   <UpgradeSheet open={showUpgrade} onClose={() => setShowUpgrade(false)} />
 */

import { useEffect, useRef } from "react";
import { showToast } from "../lib/toastUtils.js";

const DARK   = "#1a1a1a";
const YELLOW = "#F5C200";
const FONT   = "'Spoqa Han Sans Neo', sans-serif";

// ── Feature list ──────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: "🔄", text: "AI 배경 제거 월 20회 (무료는 월 1회)" },
  { icon: "🧠", text: "AI 분석 무제한 (무료는 월 10회)" },
  { icon: "⚡", text: "빠른 처리 우선 순위" },
  { icon: "🌟", text: "프리미엄 전용 기능 우선 제공" },
];

// ── Plan card ─────────────────────────────────────────────────────────────────

function PlanCard({ title, price, sub, badge, highlight, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className="relative flex flex-col items-start gap-1 rounded-2xl px-4 py-4 w-full text-left active:scale-[0.98] transition-transform"
      style={{
        backgroundColor: highlight ? DARK : "white",
        border: `2px solid ${highlight ? YELLOW : "#E8E8E8"}`,
        boxShadow: highlight ? "0 4px 20px rgba(245,194,0,0.18)" : "none",
      }}
    >
      {badge && (
        <span
          className="absolute top-[-10px] right-4 text-[10px] font-bold px-2.5 py-0.5 rounded-full"
          style={{ backgroundColor: YELLOW, color: DARK, fontFamily: FONT }}
        >
          {badge}
        </span>
      )}
      <p
        className="text-[12px] font-bold tracking-[0.08em] uppercase"
        style={{ color: highlight ? "rgba(255,255,255,0.5)" : "#AAAAAA", fontFamily: FONT }}
      >
        {title}
      </p>
      <p
        className="text-[22px] font-bold leading-none"
        style={{ color: highlight ? "white" : DARK, fontFamily: FONT, letterSpacing: "-0.03em" }}
      >
        {price}
      </p>
      <p
        className="text-[12px]"
        style={{ color: highlight ? "rgba(255,255,255,0.45)" : "#999", fontFamily: FONT }}
      >
        {sub}
      </p>
    </button>
  );
}

// ── Main sheet ────────────────────────────────────────────────────────────────

/**
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function UpgradeSheet({ open, onClose }) {
  const sheetRef = useRef(null);

  // Trap scroll inside sheet
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  function handleSubscribe(plan) {
    // Stage 1 — no real payment. Stage 2: call RevenueCat purchase here.
    showToast("결제 기능은 곧 출시될 예정이에요 🚀", "info");
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200]"
        style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-[201] rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: "#F5F5F5", maxHeight: "92dvh" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full" style={{ backgroundColor: "#DDDDDD" }} />
        </div>

        <div className="overflow-y-auto px-5 pb-10" style={{ maxHeight: "88dvh", scrollbarWidth: "none" }}>

          {/* Header */}
          <div className="flex items-start justify-between mt-2 mb-5">
            <div>
              <p
                className="text-[11px] font-bold tracking-[0.12em] uppercase mb-1"
                style={{ color: YELLOW, fontFamily: FONT }}
              >
                TRUNKROOM PREMIUM
              </p>
              <h2
                className="text-[22px] font-bold leading-tight"
                style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.03em" }}
              >
                AI 기능을<br />무제한으로 쓰세요
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center rounded-full active:opacity-60 transition-opacity mt-1"
              style={{ width: 32, height: 32, backgroundColor: "#E8E8E8" }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1L11 11M11 1L1 11" stroke="#888" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Usage limit notice */}
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-5"
            style={{ backgroundColor: "rgba(245,194,0,0.12)", border: "1px solid rgba(245,194,0,0.3)" }}
          >
            <span style={{ fontSize: 20 }}>⚠️</span>
            <p className="text-[13px] leading-snug" style={{ color: "#7A6100", fontFamily: FONT }}>
              이번 달 무료 AI 사용 횟수를 모두 사용했어요.<br />
              <strong>배경 제거 월 1회 · AI 분석 월 10회</strong>
            </p>
          </div>

          {/* Feature list */}
          <div
            className="rounded-2xl px-4 py-4 mb-5 flex flex-col gap-3"
            style={{ backgroundColor: "white" }}
          >
            {FEATURES.map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
                <p className="text-[13px] font-medium" style={{ color: DARK, fontFamily: FONT }}>{text}</p>
              </div>
            ))}
          </div>

          {/* Plan cards */}
          <div className="flex flex-col gap-3 mb-6">
            {/* Annual — highlighted */}
            <PlanCard
              highlight
              title="연간 플랜"
              price="₩54,900 / 년"
              sub="월 ₩4,575 — 3달 무료 혜택"
              badge="가장 인기 🔥"
              onSelect={() => handleSubscribe("annual")}
            />
            {/* Monthly */}
            <PlanCard
              title="월간 플랜"
              price="₩5,900 / 월"
              sub="매월 자동 갱신"
              onSelect={() => handleSubscribe("monthly")}
            />
          </div>

          {/* CTA button */}
          <button
            onClick={() => handleSubscribe("annual")}
            className="w-full py-4 rounded-2xl font-bold text-[15px] active:opacity-80 transition-opacity"
            style={{ backgroundColor: YELLOW, color: DARK, fontFamily: FONT, letterSpacing: "-0.01em" }}
          >
            연간 플랜 시작하기
          </button>

          {/* Fine print */}
          <p
            className="text-center text-[10px] mt-3 leading-relaxed"
            style={{ color: "#AAAAAA", fontFamily: FONT }}
          >
            구독은 언제든지 취소할 수 있어요. 결제는 App Store를 통해 이루어져요.
          </p>
        </div>
      </div>
    </>
  );
}
