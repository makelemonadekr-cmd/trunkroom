/**
 * StylebookTemplate.jsx
 *
 * Renders a 4:5 stylebook card based on visual templates:
 *
 *   Template A (style-template1.png reference):
 *     – Wearing photo fills the background at full opacity (sharp, clear)
 *     – White item boxes float on left + right sides of the person
 *
 *   Template B (style-template2.png reference):
 *     – Wearing photo is rendered at reduced opacity (~42%) + white fog scrim
 *     – Item boxes stand out more against the softened background
 *
 * Slot layout (two columns, left + right of the person, 2-column grid):
 *   1 item  → centre-right
 *   2 items → L:1  R:1
 *   3 items → L:1  R:2
 *   4 items → L:2  R:2  ← symmetric
 *   5 items → L:2  R:3  ← matches style-template1 exactly
 *   6 items → L:3  R:3
 *
 * Props:
 *   photoUrl   string | null     – wearing / outfit background photo
 *   items      ClosetItem[]      – selected closet items (max 6)
 *                                  supports both .image (mock) and .image_url (Supabase)
 *   template   'A' | 'B'         – visual style (default 'A')
 *   width      number            – render width in px; height = width × 1.25  (4:5)
 *   style      object            – extra inline styles on root element
 */

const FONT = "'Spoqa Han Sans Neo', sans-serif";

// ─── Slot position tables ─────────────────────────────────────────────────────
// Positions are % of the 4:5 container.
// Each entry: { left|right (string %), top (string %), width (string %), height (string %) }

const SLOT_CONFIGS = {
  1: [
    { right: '5%', top: '30%', width: '42%', height: '35%' },
  ],
  2: [
    { left: '3%',  top: '25%', width: '42%', height: '32%' },
    { right: '3%', top: '25%', width: '42%', height: '32%' },
  ],
  3: [
    { left: '3%',  top: '22%', width: '42%', height: '38%' },
    { right: '3%', top: '5%',  width: '42%', height: '27%' },
    { right: '3%', top: '37%', width: '42%', height: '27%' },
  ],
  4: [
    { left: '3%',  top: '7%',  width: '42%', height: '27%' },
    { left: '3%',  top: '40%', width: '42%', height: '27%' },
    { right: '3%', top: '7%',  width: '42%', height: '27%' },
    { right: '3%', top: '40%', width: '42%', height: '27%' },
  ],
  5: [
    // 2 left, 3 right — matches style-template1.png
    { left: '3%',  top: '6%',  width: '42%', height: '27%' },
    { left: '3%',  top: '59%', width: '42%', height: '27%' },
    { right: '3%', top: '5%',  width: '42%', height: '24%' },
    { right: '3%', top: '34%', width: '42%', height: '24%' },
    { right: '3%', top: '64%', width: '42%', height: '24%' },
  ],
  6: [
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
  photoUrl  = null,
  items     = [],
  template  = 'A',
  width     = 280,
  style: extraStyle = {},
}) {
  const height = Math.round(width * 1.25);
  const count  = clamp(Math.max(items.length, 1), 1, 6);
  const slots  = SLOT_CONFIGS[count] ?? SLOT_CONFIGS[6];

  // Background color differs slightly between templates
  const bgColor = template === 'B' ? '#E2E2E2' : '#D8D8D8';

  return (
    <div
      style={{
        position:        'relative',
        width,
        height,
        borderRadius:    14,
        overflow:        'hidden',
        backgroundColor: bgColor,
        flexShrink:      0,
        ...extraStyle,
      }}
    >

      {/* ── Background: wearing photo ── */}
      {photoUrl ? (
        <>
          {/* The person / outfit photo */}
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
              // Template B: soften / fade the photo so item boxes stand out
              opacity: template === 'B' ? 0.42 : 1,
            }}
          />

          {/* Template B only: additional white fog scrim */}
          {template === 'B' && (
            <div
              style={{
                position:        'absolute',
                inset:           0,
                backgroundColor: 'rgba(255,255,255,0.30)',
                pointerEvents:   'none',
              }}
            />
          )}
        </>
      ) : (
        /* ── No photo yet: placeholder ── */
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

        // Support both mock shape (.image) and Supabase shape (.image_url)
        const imgSrc = item.image ?? item.image_url ?? null;

        const posStyle = {};
        if (slot.left  !== undefined) posStyle.left  = slot.left;
        if (slot.right !== undefined) posStyle.right = slot.right;
        posStyle.top    = slot.top;
        posStyle.width  = slot.width;
        posStyle.height = slot.height;

        // Template B: slightly stronger shadow + more opaque white so boxes pop
        const boxStyle = template === 'B'
          ? {
              backgroundColor: 'rgba(255,255,255,0.98)',
              boxShadow:       '0 4px 18px rgba(0,0,0,0.22)',
              border:          '1.5px solid rgba(255,255,255,0.90)',
            }
          : {
              backgroundColor: 'rgba(255,255,255,0.96)',
              boxShadow:       '0 3px 14px rgba(0,0,0,0.18)',
              border:          '1.5px solid rgba(255,255,255,0.85)',
            };

        return (
          <div
            key={item.id ?? i}
            style={{
              position:        'absolute',
              ...posStyle,
              ...boxStyle,
              borderRadius:    10,
              overflow:        'hidden',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
            }}
          >
            {imgSrc ? (
              <img
                src={imgSrc}
                alt={item.displayName ?? item.name ?? ''}
                style={{
                  width:      '100%',
                  height:     '100%',
                  objectFit:  'contain',
                  padding:    '8%',
                }}
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
