/**
 * AutoDetectLoadingState.jsx
 *
 * Full-screen overlay shown while the upload pipeline runs.
 * Displays step-by-step progress: uploading → removing_bg → analyzing → done | error
 */

const STEPS = [
  { id: "uploading",    label: "사진 업로드 중…",      emoji: "📤" },
  { id: "removing_bg",  label: "배경 제거 중…",         emoji: "✂️" },
  { id: "analyzing",    label: "AI 분석 중…",           emoji: "🤖" },
  { id: "done",         label: "분석 완료!",            emoji: "✅" },
  { id: "error",        label: "오류가 발생했어요",      emoji: "⚠️" },
];

const STEP_ORDER = ["uploading", "removing_bg", "analyzing"];

/**
 * @param {{
 *   state: "uploading"|"removing_bg"|"analyzing"|"done"|"error"|null,
 *   errorMessage?: string,
 * }} props
 */
export default function AutoDetectLoadingState({ state, errorMessage }) {
  if (!state || state === "idle") return null;

  const current = STEPS.find((s) => s.id === state) ?? STEPS[0];
  const isTerminal = state === "done" || state === "error";

  // Which step index are we on (for progress bar)?
  const stepIdx   = STEP_ORDER.indexOf(state);
  const progress  = isTerminal
    ? (state === "done" ? 100 : 0)
    : Math.round(((stepIdx + 1) / STEP_ORDER.length) * 100);

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center z-50"
      style={{
        backgroundColor: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(6px)",
      }}
    >
      {/* Animated emoji */}
      <div
        className="text-5xl mb-5"
        style={{
          animation: isTerminal ? "none" : "pulse 1.6s ease-in-out infinite",
        }}
      >
        {current.emoji}
      </div>

      {/* Label */}
      <p
        className="text-[16px] font-bold mb-2"
        style={{
          color: state === "error" ? "#E53E3E" : "#1a1a1a",
          fontFamily: "'Spoqa Han Sans Neo', sans-serif",
          letterSpacing: "-0.02em",
        }}
      >
        {current.label}
      </p>

      {/* Error detail */}
      {state === "error" && errorMessage && (
        <p
          className="text-[12px] text-center px-8 mt-1"
          style={{ color: "#E53E3E", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
        >
          {errorMessage}
        </p>
      )}

      {/* Progress bar (only during active steps) */}
      {!isTerminal && (
        <div
          className="mt-6 rounded-full overflow-hidden"
          style={{ width: 200, height: 4, backgroundColor: "#F0F0F0" }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              backgroundColor: "#1a1a1a",
            }}
          />
        </div>
      )}

      {/* Step indicators */}
      {!isTerminal && (
        <div className="flex items-center gap-2 mt-4">
          {STEP_ORDER.map((id, i) => (
            <div
              key={id}
              className="rounded-full transition-all duration-300"
              style={{
                width:  i === stepIdx ? 20 : 6,
                height: 6,
                backgroundColor: i <= stepIdx ? "#1a1a1a" : "#E0E0E0",
              }}
            />
          ))}
        </div>
      )}

      {/* Sub-label */}
      {!isTerminal && (
        <p
          className="text-[11px] mt-5"
          style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
        >
          잠깐만 기다려 주세요
        </p>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1);   opacity: 1;   }
          50%       { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
