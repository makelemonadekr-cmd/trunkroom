/**
 * StyleBoardTemplate.jsx  —  Option B "Side Stack"
 *
 * 4:5 portrait style board card.
 *
 *  LEFT  (62%) — wearing / outfit photo, full height, object-cover
 *  GAP   (4px) — cream breathing space, no hard divider
 *  RIGHT (38%) — individual item cards on cream background
 *                each card: rounded corners, inner padding, multiply blend
 *
 * showText prop
 *   false (default) — pure image, no text anywhere on the board
 *   true            — item name shown as a small label under each item image
 *
 * Grid behaviour (right column, by item count):
 *   0         → empty placeholder column (3 ghosted rows)
 *   1         → 1 large card, full column
 *   2         → 2 cards stacked (1 col, 2 rows)
 *   3         → 3 cards stacked (1 col, 3 rows)
 *   4         → 2 × 2 grid
 *   5 – 6     → 2 × 3 compact grid
 *   7+        → 2 × 3 grid; last slot = "+N" overlay
 *
 * Props
 *   photoUrl  string | null   outfit / cover photo URL
 *   items     Array<{ id, image?, image_url?, name? }>
 *   width     number          render width in px  (height = width × 1.25 auto)
 *   bgColor   string          fallback bg when no photo (default #F0EDE7)
 *   showText  boolean         show item names (default false)
 *   style     object          extra inline styles on root element
 */

const CREAM       = "#F5F2EC";
const CARD_BG     = "#EEEBE4";   // slightly darker cream for individual card bg
const FONT        = "'Spoqa Han Sans Neo', sans-serif";
const LEFT_RATIO  = 0.62;
const COL_GAP     = 4;           // gap between left photo and right items column
const CARD_GAP    = 3;           // gap between item cards
const COL_PAD     = 4;           // padding around the right column interior
const MAX_CELLS   = 6;           // max visible item cells (7th+ → +N)

// ── Grid geometry helpers ────────────────────────────────────────────────────
function layoutCols(count) {
  return count <= 3 ? 1 : 2;
}
function layoutRows(count) {
  const cols = layoutCols(count);
  return Math.ceil(Math.max(count, 1) / cols);
}

// ── Root component ───────────────────────────────────────────────────────────
export default function StyleBoardTemplate({
  photoUrl  = null,
  items     = [],
  width     = 280,
  bgColor   = "#F0EDE7",
  showText  = false,
  style:    extraStyle = {},
}) {
  const height  = Math.round(width * 1.25);
  const leftW   = Math.round(width * LEFT_RATIO);
  const rightW  = width - leftW - COL_GAP;

  // ── Item source for right column ─────────────────────────────────────────
  // No duplication: when there is no photoUrl, left side shows a placeholder
  // (not item[0]), so all items go into the right grid.
  const gridSource = items;

  const overflowCount =
    gridSource.length > MAX_CELLS ? gridSource.length - (MAX_CELLS - 1) : 0;
  const cellItems =
    overflowCount > 0
      ? gridSource.slice(0, MAX_CELLS - 1)
      : gridSource.slice(0, MAX_CELLS);
  const totalCells = cellItems.length + (overflowCount > 0 ? 1 : 0);

  const cols      = layoutCols(Math.max(totalCells, 1));
  const rows      = layoutRows(Math.max(totalCells, 1));

  // Inner dimensions for each item card
  const innerW    = rightW - COL_PAD * 2 - (cols - 1) * CARD_GAP;
  const innerH    = height - COL_PAD * 2 - (rows - 1) * CARD_GAP;
  const cellW     = Math.floor(innerW / cols);
  const cellH     = Math.floor(innerH / rows);
  // Name label strip height (only relevant when showText=true)
  const labelH    = showText ? Math.max(14, Math.round(width * 0.05)) : 0;
  const imgH      = cellH - labelH;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        width,
        height,
        display:         "flex",
        flexDirection:   "row",
        borderRadius:    extraStyle.borderRadius ?? 16,
        overflow:        "hidden",
        backgroundColor: CREAM,
        flexShrink:      0,
        ...extraStyle,
      }}
    >
      {/* ── Left: outfit / wearing photo ───────────────────────────────────── */}
      <div
        style={{
          width:      leftW,
          height,
          flexShrink: 0,
          overflow:   "hidden",
          position:   "relative",
        }}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt=""
            style={{
              width:          "100%",
              height:         "100%",
              objectFit:      "cover",
              objectPosition: "center top",
              display:        "block",
            }}
          />
        ) : (
          <div
            style={{
              width:           "100%",
              height:          "100%",
              backgroundColor: bgColor,
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
            }}
          >
            <span style={{ fontSize: Math.round(width * 0.14), opacity: 0.18 }}>
              👗
            </span>
          </div>
        )}
      </div>

      {/* ── Cream gap (no hard divider) ─────────────────────────────────────── */}
      <div style={{ width: COL_GAP, height: "100%", flexShrink: 0, backgroundColor: CREAM }} />

      {/* ── Right: item cards column ────────────────────────────────────────── */}
      <div
        style={{
          width:      rightW,
          height,
          flexShrink: 0,
          padding:    COL_PAD,
          boxSizing:  "border-box",
          display:    "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows:    `repeat(${rows}, 1fr)`,
          gap:        CARD_GAP,
          backgroundColor: CREAM,
        }}
      >
        {/* ── Item cards ── */}
        {cellItems.map((item, idx) => {
          const src = item?.image ?? item?.image_url ?? null;
          const name = item?.name ?? item?.displayName ?? "";
          return (
            <div
              key={item?.id ?? idx}
              style={{
                borderRadius:    6,
                overflow:        "hidden",
                backgroundColor: CARD_BG,
                display:         "flex",
                flexDirection:   "column",
              }}
            >
              {/* Image area */}
              <div
                style={{
                  flex:            "1 1 0",
                  minHeight:       0,
                  padding:         3,
                  display:         "flex",
                  alignItems:      "center",
                  justifyContent:  "center",
                  overflow:        "hidden",
                }}
              >
                {src ? (
                  <img
                    src={src}
                    alt={name}
                    style={{
                      width:          "100%",
                      height:         "100%",
                      objectFit:      "contain",
                      objectPosition: "center",
                      mixBlendMode:   "multiply",
                      display:        "block",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 12, opacity: 0.2 }}>👗</span>
                )}
              </div>

              {/* Name label — only when showText=true */}
              {showText && name && (
                <div
                  style={{
                    flexShrink:      0,
                    height:          labelH,
                    paddingLeft:     3,
                    paddingRight:    3,
                    paddingBottom:   2,
                    display:         "flex",
                    alignItems:      "flex-end",
                    justifyContent:  "center",
                    overflow:        "hidden",
                  }}
                >
                  <span
                    style={{
                      fontFamily:   FONT,
                      fontSize:     Math.max(7, Math.round(width * 0.028)),
                      color:        "#555",
                      textAlign:    "center",
                      lineHeight:   1.1,
                      overflow:     "hidden",
                      display:      "-webkit-box",
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: "vertical",
                      width:        "100%",
                    }}
                  >
                    {name}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* ── +N overflow slot ── */}
        {overflowCount > 0 && (
          <div
            style={{
              borderRadius:    6,
              backgroundColor: "rgba(26,26,26,0.55)",
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
            }}
          >
            <span
              style={{
                color:      "white",
                fontWeight:  700,
                fontFamily:  FONT,
                fontSize:    Math.max(10, Math.round(rightW * 0.13)),
              }}
            >
              +{overflowCount}
            </span>
          </div>
        )}

        {/* ── Empty-state ghost cells when no items ── */}
        {totalCells === 0 &&
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`ghost-${i}`}
              style={{
                borderRadius:    6,
                backgroundColor: CARD_BG,
                opacity:         0.45,
              }}
            />
          ))}
      </div>
    </div>
  );
}
