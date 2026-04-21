/**
 * AutoDetectedBadge.jsx
 *
 * Small inline badge shown on form fields that were auto-filled by AI.
 * Optionally shows a warning variant when needsReview is true.
 */

/**
 * @param {{ review?: boolean }} props
 *   review — if true, shows yellow "확인 필요" badge instead of green "AI 감지"
 */
export default function AutoDetectedBadge({ review = false }) {
  if (review) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
        style={{
          backgroundColor: "#FFF8E1",
          color: "#B8860B",
          fontFamily: "'Spoqa Han Sans Neo', sans-serif",
          letterSpacing: "0.02em",
        }}
      >
        <span>⚠️</span>
        확인 필요
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{
        backgroundColor: "#E8F5E9",
        color: "#2E7D32",
        fontFamily: "'Spoqa Han Sans Neo', sans-serif",
        letterSpacing: "0.02em",
      }}
    >
      <span>✨</span>
      AI 감지
    </span>
  );
}
