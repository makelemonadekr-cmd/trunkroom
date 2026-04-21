/**
 * FilterChips — horizontal scrolling chip bar.
 *
 * Props:
 *   options   : string[]           — chip labels
 *   active    : string             — currently selected label
 *   onChange  : (label) => void
 *   accent    : string (optional)  — hex color for active state (defaults to #1a1a1a)
 */
export default function FilterChips({ options, active, onChange, accent = "#1a1a1a" }) {
  return (
    <div
      className="flex overflow-x-auto px-5 gap-2 py-1"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {options.map((opt) => {
        const isActive = active === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className="shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all"
            style={{
              backgroundColor: isActive ? accent    : "#F2F2F2",
              color:           isActive ? "white"   : "#555",
              fontFamily:      "'Spoqa Han Sans Neo', sans-serif",
              fontWeight:      isActive ? 700 : 500,
              border:          isActive ? `1.5px solid ${accent}` : "1.5px solid transparent",
              whiteSpace:      "nowrap",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
