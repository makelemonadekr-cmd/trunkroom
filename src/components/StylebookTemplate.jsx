/**
 * StylebookTemplate.jsx
 *
 * Renders a 4:5 stylebook card based on visual templates:
 *   Template A (style-template1): wearing photo clear, item cards on sides
 *   Template B (style-template2): wearing photo faded/softened, item cards stand out
 *
 * Box layout (2 columns, left + right of center person):
 *   3 items  → L:1  R:2
 *   4 items  → L:2  R:2
 *   5 items  → L:2  R:3   ← matches style-template1 exactly
 *   6 items  → L:3  R:3
 *
 * Props:
 *   photoUrl   string | null    – wearing / outfit background photo
 *   items      ClosetItem[]     – selected closet items (max 6)
 *   template   'A' | 'B'        – visual style (default: 'A')
 *   width      number           – render width in px; height = width × 1.25
 *   style      object           – extra inline styles on root element
 */

const FONT = "'Spoqa Han Sans Neo', sans-serif";

// ─── Slot position tables ─────────────────────────────────────────────────────
// Each entry: { left|right (string %), top (string %), width (string %), height (string %) }
// Positions are relative to the 4:5 container.
// Two-column layout: left column (~3% from left) and right column (~3% from right).

const SLOT_CONFIGS = {
  1: [
    { right: '5%', top: '30%', width: '42%', height: '35%' },
  ],
  2: [
    { left: '3%',  top: '25%', width: '42%', height: '32%' },
    { right: '3%', top: '25%', width: '42%', height: '32%' },
  ],
  3: [
    // 1 left, 2 right
    { left: '3%',  top: '22%', width: '42%', height: '38%' },
    { right: '3%', top: '5%',  width: '42%', height: '27%' },
    { right: '3%', top: '37%', width: '42%', height: '27%' },
  ],
  4: [
    // 2 left, 2 right — symmetric
    { left: '3%',  top: '7%',  width: '42%', height: '27%' },
    { left: '3%',  top: '40%', width: '42%', height: '27%' },
    { right: '3%', top: '7%',  width: '42%', height: '27%' },
    { right: '3%', top: '40%', width: '42%', height: '27%' },
  ],
  5: [
    // 2 left, 3 right — matches style-template1
    { left: '3%',  top: '6%',  width: '42%', height: '27%' },
    { left: '3%',  top: '59%', width: '42%', height: '27%' },
    { right: '3%', top: '5%',  width: '42%', height: '24%' },
    { right: '3%', top: '34%', width: '42%', height: '24%' },
    { right: '3%', top: '64%', width: '42%', height: '24%' },
  ],
  6: [
    // 3 left, 3 right
    { left: '3%',  top: '4%',  width: '42%', height: '23%' },
    { left: '3%',  top: '32%', width: '42%', height: '23%' },
    { left: '3%',  top: '61%', width: '42%', height: '23%' },
    { right: '3%', top: '4%',  width: '42%', height: '23%' },
    { right: '3%', top: '32%', width: '42%', height: '23%' },
    { right: '3%', top: '61%', width: '42%', height: '23%' },
  ],
};

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

export default function StylebookTemplate({
  photoUrl = null,
  items = [],
  width = 280,
  style: extraStyle = {},
}) {
  const height = Math.round(width * 1.25);
  const count  = clamp(items.length, 1, 6);
  const slots  = SLOT_CONFIGS[count] ?? SLOT_CONFIGS[6];

  return (
    <div
      style={{
        position:        'relative',
        width,
        height,
        borderRadius:    14,
        overflow:        'hidden',
        backgroundColor: '#D8D8D8',
        flexShrink:      0,
        ...extraStyle,
      }}
    >
      {/* ── Background: wearing photo ── */}
      {photoUrl ? (
        <img
          src={photoUrl}
          alt="outfit"
          style={{
            position:       'absolute',
            inset:          0,
            width:          '100%',
            height:         '100%',
            objectFit:      'cover',
            objectPosition: 'center top',
          }}
        />
      ) : (
        <div
          style={{
            position:       'absolute',
            inset:          0,
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            8,
          }}
        >
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <rect x="2" y="5" width="26" height="20" rx="3" stroke="#BBBBBB" strokeWidth="1.8" />
            <circle cx="15" cy="15" r="5" stroke="#BBBBBB" strokeWidth="1.8" />
            <path d="M11 5L13 2H17L19 5" stroke="#BBBBBB" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <p style={{ fontSize: 9, color: '#BBBBBB', fontFamily: FONT }}>착장 사진을 추가하세요</p>
        </div>
      )}

      {/* ── Item boxes ── */}
      {slots.map((slot, i) => {
        const item = items[i];
        if (!item) return null;

        const posStyle = {};
        if (slot.left  !== undefined) posStyle.left  = slot.left;
        if (slot.right !== undefined) posStyle.right = slot.right;
        posStyle.top    = slot.top;
        posStyle.width  = slot.width;
        posStyle.height = slot.height;

        return (
          <div
            key={item.id ?? i}
            style={{
              position:        'absolute',
              ...posStyle,
              backgroundColor: 'rgba(255,255,255,0.96)',
              borderRadius:    10,
              overflow:        'hidden',
              boxShadow:       '0 3px 14px rgba(0,0,0,0.18)',
              border:          '1.5px solid rgba(255,255,255,0.85)',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
            }}
          >
            {item.image ? (
              <img
                src={item.image}
                alt={item.displayName ?? item.name ?? ''}
                style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8%' }}
              />
            ) : (
              <span style={{ fontSize: 20, opacity: 0.3 }}>👗</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
