/**
 * sizeConversionUtils.js
 *
 * All size conversion tables and helper functions.
 * All conversions are approximate reference values — brand sizing varies.
 *
 * Sources:
 *   - KR/JP shoe sizes use mm foot-length (1mm step = ~0.5 EU step)
 *   - EU sizes use Paris points (1 PP ≈ 6.67mm)
 *   - UK sizes ≈ EU − 33 (women) / EU − 33.5 (men)
 *   - Women's clothing KR uses even tens (44/55/66/77/88/99)
 *   - Men's clothing KR uses chest-cm basis (85/90/95/100/105/110/115)
 */

// ─── Shoe size tables ──────────────────────────────────────────────────────────

/** Women's shoe sizes. All conversions approximate. */
export const SHOE_TABLE_WOMEN = [
  { kr: 215, us: "4.5",  eu: "34.5", uk: "2",    jp: "21.5" },
  { kr: 220, us: "5",    eu: "35",   uk: "2.5",  jp: "22"   },
  { kr: 225, us: "5.5",  eu: "35.5", uk: "3",    jp: "22.5" },
  { kr: 230, us: "6",    eu: "36",   uk: "3.5",  jp: "23"   },
  { kr: 235, us: "6.5",  eu: "37",   uk: "4",    jp: "23.5" },
  { kr: 240, us: "7",    eu: "37.5", uk: "4.5",  jp: "24"   },
  { kr: 245, us: "7.5",  eu: "38",   uk: "5",    jp: "24.5" },
  { kr: 250, us: "8",    eu: "38.5", uk: "5.5",  jp: "25"   },
  { kr: 255, us: "8.5",  eu: "39",   uk: "6",    jp: "25.5" },
  { kr: 260, us: "9",    eu: "40",   uk: "6.5",  jp: "26"   },
  { kr: 265, us: "9.5",  eu: "40.5", uk: "7",    jp: "26.5" },
  { kr: 270, us: "10",   eu: "41",   uk: "7.5",  jp: "27"   },
  { kr: 275, us: "10.5", eu: "42",   uk: "8",    jp: "27.5" },
  { kr: 280, us: "11",   eu: "42.5", uk: "8.5",  jp: "28"   },
  { kr: 285, us: "11.5", eu: "43",   uk: "9",    jp: "28.5" },
  { kr: 290, us: "12",   eu: "44",   uk: "9.5",  jp: "29"   },
  { kr: 295, us: "12.5", eu: "44.5", uk: "10",   jp: "29.5" },
];

/** Men's shoe sizes. All conversions approximate. */
export const SHOE_TABLE_MEN = [
  { kr: 230, us: "4",    eu: "36",   uk: "3.5",  jp: "23"   },
  { kr: 235, us: "4.5",  eu: "37",   uk: "4",    jp: "23.5" },
  { kr: 240, us: "5.5",  eu: "37.5", uk: "4.5",  jp: "24"   },
  { kr: 245, us: "6",    eu: "38.5", uk: "5.5",  jp: "24.5" },
  { kr: 250, us: "7",    eu: "39",   uk: "6",    jp: "25"   },
  { kr: 255, us: "7.5",  eu: "40",   uk: "6.5",  jp: "25.5" },
  { kr: 260, us: "8",    eu: "41",   uk: "7",    jp: "26"   },
  { kr: 265, us: "8.5",  eu: "42",   uk: "7.5",  jp: "26.5" },
  { kr: 270, us: "9",    eu: "42.5", uk: "8",    jp: "27"   },
  { kr: 275, us: "9.5",  eu: "43",   uk: "8.5",  jp: "27.5" },
  { kr: 280, us: "10",   eu: "44",   uk: "9.5",  jp: "28"   },
  { kr: 285, us: "10.5", eu: "44.5", uk: "10",   jp: "28.5" },
  { kr: 290, us: "11",   eu: "45",   uk: "10.5", jp: "29"   },
  { kr: 295, us: "11.5", eu: "46",   uk: "11",   jp: "29.5" },
  { kr: 300, us: "12",   eu: "46.5", uk: "11.5", jp: "30"   },
  { kr: 305, us: "12.5", eu: "47",   uk: "12",   jp: "30.5" },
];

// ─── Clothing top size tables ──────────────────────────────────────────────────

/** Women's top sizes — KR even-10 system. */
export const WOMEN_TOP_TABLE = [
  { kr: "44",  label: "XS",  us: "XS",  eu: "32", uk: "6"  },
  { kr: "55",  label: "S",   us: "S",   eu: "34", uk: "8"  },
  { kr: "66",  label: "M",   us: "M",   eu: "36", uk: "10" },
  { kr: "77",  label: "L",   us: "L",   eu: "38", uk: "12" },
  { kr: "88",  label: "XL",  us: "XL",  eu: "40", uk: "14" },
  { kr: "99",  label: "2XL", us: "XXL", eu: "42", uk: "16" },
  { kr: "110", label: "3XL", us: "3XL", eu: "44", uk: "18" },
];

/** Men's top sizes — KR chest-cm system. */
export const MEN_TOP_TABLE = [
  { kr: "85",  label: "XS",  us: "XS",  eu: "44", uk: "34" },
  { kr: "90",  label: "S",   us: "S",   eu: "46", uk: "36" },
  { kr: "95",  label: "M",   us: "M",   eu: "48", uk: "38" },
  { kr: "100", label: "L",   us: "L",   eu: "50", uk: "40" },
  { kr: "105", label: "XL",  us: "XL",  eu: "52", uk: "42" },
  { kr: "110", label: "2XL", us: "XXL", eu: "54", uk: "44" },
  { kr: "115", label: "3XL", us: "3XL", eu: "56", uk: "46" },
];

// ─── Clothing bottom size tables ───────────────────────────────────────────────

/**
 * Women's bottom sizes mapped by waist-cm range.
 * waistRange: [minCm, maxCm] (inclusive)
 */
export const WOMEN_BOTTOM_TABLE = [
  { kr: "44/XS",  us: "W23–24", eu: "32–34", uk: "6–8",   waistRange: [56, 61]  },
  { kr: "55/S",   us: "W25–26", eu: "34–36", uk: "8–10",  waistRange: [62, 66]  },
  { kr: "66/M",   us: "W27–28", eu: "36–38", uk: "10–12", waistRange: [67, 71]  },
  { kr: "77/L",   us: "W28–29", eu: "38–40", uk: "12–14", waistRange: [72, 76]  },
  { kr: "88/XL",  us: "W30–31", eu: "40–42", uk: "14–16", waistRange: [77, 82]  },
  { kr: "99/2XL", us: "W32–34", eu: "42–46", uk: "16–20", waistRange: [83, 92]  },
];

/** Men's bottom sizes: waist in inches ↔ cm. */
export const MEN_BOTTOM_TABLE = [
  { waistIn: 27, waistCm: 69 },
  { waistIn: 28, waistCm: 71 },
  { waistIn: 29, waistCm: 74 },
  { waistIn: 30, waistCm: 76 },
  { waistIn: 31, waistCm: 79 },
  { waistIn: 32, waistCm: 81 },
  { waistIn: 33, waistCm: 84 },
  { waistIn: 34, waistCm: 86 },
  { waistIn: 36, waistCm: 91 },
  { waistIn: 38, waistCm: 97 },
];

// ─── Conversion functions ──────────────────────────────────────────────────────

/**
 * Convert KR shoe size (mm) to other regional sizes.
 * @param {string|number} krMm  - e.g. 245
 * @param {string}        gender - "여성" | "남성"
 * @returns {{ kr, us, eu, uk, jp, isExact } | null}
 */
export function getShoeSizeConversion(krMm, gender = "여성") {
  const mm = parseInt(krMm, 10);
  if (!mm || isNaN(mm) || mm < 200 || mm > 320) return null;

  const table = gender === "남성" ? SHOE_TABLE_MEN : SHOE_TABLE_WOMEN;

  // 1. Exact match
  const exact = table.find((r) => r.kr === mm);
  if (exact) return { ...exact, isExact: true };

  // 2. Nearest match within ±7 mm
  let nearest = null;
  let minDiff = Infinity;
  for (const row of table) {
    const diff = Math.abs(row.kr - mm);
    if (diff < minDiff) { minDiff = diff; nearest = row; }
  }
  if (nearest && minDiff <= 7) {
    return { ...nearest, kr: mm, isExact: false };
  }

  return null;
}

/**
 * Convert top size to other regional sizes.
 * Accepts KR code (e.g. "66"), label (e.g. "M"), or US label (e.g. "M").
 * @param {string} topSize
 * @param {string} gender - "여성" | "남성"
 * @returns {{ kr, label, us, eu, uk, isExact } | null}
 */
export function getTopSizeConversion(topSize, gender = "여성") {
  if (!topSize || String(topSize).trim() === "" || String(topSize).trim() === "선택 안 함") return null;
  const s = String(topSize).trim().toUpperCase();
  const table = gender === "남성" ? MEN_TOP_TABLE : WOMEN_TOP_TABLE;

  // Match by KR code
  const byKr = table.find((r) => r.kr.toUpperCase() === s);
  if (byKr) return { ...byKr, isExact: true };

  // Match by label / US size
  const byLabel = table.find(
    (r) =>
      r.label.toUpperCase() === s ||
      r.us.toUpperCase() === s ||
      (s === "2XL" && r.label === "2XL") ||
      (s === "XXL" && r.label === "2XL") ||
      (s === "3XL" && r.label === "3XL")
  );
  if (byLabel) return { ...byLabel, isExact: true };

  return null;
}

/**
 * Get bottom size reference.
 * Women: use waistCm for best accuracy; bottomSize as fallback label match.
 * Men: use bottomSize as waist-inch string (e.g. "32").
 * @param {string} bottomSize
 * @param {string} waistCm
 * @param {string} gender - "여성" | "남성"
 * @returns {{ kr, us, eu, uk, isExact } | null}
 */
export function getBottomSizeConversion(bottomSize, waistCm, gender = "여성") {
  if (gender === "남성") {
    const inch = parseInt(bottomSize, 10);
    if (!isNaN(inch) && inch > 0) {
      const exact = MEN_BOTTOM_TABLE.find((r) => r.waistIn === inch);
      if (exact) {
        return { kr: `W${inch}`, us: `W${inch}`, eu: `${exact.waistCm}cm`, uk: `W${inch}`, isExact: true };
      }
      // Nearest within 2 inches
      let nearest = null; let minD = Infinity;
      for (const r of MEN_BOTTOM_TABLE) {
        const d = Math.abs(r.waistIn - inch);
        if (d < minD) { minD = d; nearest = r; }
      }
      if (nearest && minD <= 2) {
        return { kr: `~W${nearest.waistIn}`, us: `W${nearest.waistIn}`, eu: `~${nearest.waistCm}cm`, uk: `W${nearest.waistIn}`, isExact: false };
      }
    }
    return null;
  }

  // Women — prefer waistCm for accuracy
  const cm = parseFloat(waistCm);
  if (!isNaN(cm) && cm >= 50 && cm <= 120) {
    const row = WOMEN_BOTTOM_TABLE.find((r) => cm >= r.waistRange[0] && cm <= r.waistRange[1]);
    if (row) return { ...row, isExact: true };
  }

  // Fallback: match by label in bottomSize
  const s = String(bottomSize || "").trim();
  if (s && s !== "선택 안 함") {
    // e.g. "66" → matches "66/M"
    const row = WOMEN_BOTTOM_TABLE.find((r) => r.kr.split("/")[0] === s || r.kr.includes(s));
    if (row) return { ...row, isExact: false };
  }

  return null;
}

// ─── Select option lists ───────────────────────────────────────────────────────

export const SHOE_OPTIONS = [
  { value: "", label: "선택 안 함" },
  ...[215, 220, 225, 230, 235, 240, 245, 250, 255, 260, 265, 270, 275, 280, 285, 290, 295, 300, 305].map(
    (mm) => ({ value: String(mm), label: `${mm}mm` })
  ),
];

export const WOMEN_TOP_OPTIONS = [
  { value: "", label: "선택 안 함" },
  ...WOMEN_TOP_TABLE.map((r) => ({ value: r.kr, label: `${r.kr}  (${r.label})` })),
];

export const MEN_TOP_OPTIONS = [
  { value: "", label: "선택 안 함" },
  ...MEN_TOP_TABLE.map((r) => ({ value: r.kr, label: `${r.kr}  (${r.label})` })),
];

export const WOMEN_BOTTOM_OPTIONS = [
  { value: "", label: "선택 안 함" },
  ...WOMEN_BOTTOM_TABLE.map((r) => ({
    value: r.kr.split("/")[0],
    label: r.kr,
  })),
];

export const MEN_BOTTOM_OPTIONS = [
  { value: "", label: "선택 안 함" },
  ...MEN_BOTTOM_TABLE.map((r) => ({
    value: String(r.waistIn),
    label: `W${r.waistIn}  (약 ${r.waistCm}cm)`,
  })),
];

export const TOP_FIT_OPTIONS    = ["선택 안 함", "슬림핏", "레귤러핏", "릴렉스드핏", "오버사이즈"];
export const BOTTOM_FIT_OPTIONS = ["선택 안 함", "슬림핏", "레귤러핏", "와이드핏"];
export const SHOE_FIT_OPTIONS   = ["선택 안 함", "정사이즈", "반 사이즈 크게", "반 사이즈 작게"];
export const SHOE_WIDTH_OPTIONS = ["선택 안 함", "보통", "넓음 (와이드)", "좁음"];

// ─── Validation ────────────────────────────────────────────────────────────────

export function validateHeight(v)      { if (!v || v === "") return true; const n = parseFloat(v); return !isNaN(n) && n >= 100 && n <= 250; }
export function validateWeight(v)      { if (!v || v === "") return true; const n = parseFloat(v); return !isNaN(n) && n >= 20  && n <= 300; }
export function validateMeasurement(v) { if (!v || v === "") return true; const n = parseFloat(v); return !isNaN(n) && n >= 30  && n <= 220; }

// ─── Formatting ────────────────────────────────────────────────────────────────

export function formatUpdatedAt(isoString) {
  if (!isoString) return null;
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }) + " 수정";
  } catch {
    return null;
  }
}

/**
 * Returns the top-size options array appropriate for the given gender.
 * Useful for rendering a size picker with the right options.
 */
export function getTopSizeOptions(gender) {
  return gender === "남성" ? MEN_TOP_OPTIONS : WOMEN_TOP_OPTIONS;
}

/**
 * Returns the bottom-size options array appropriate for the given gender.
 */
export function getBottomSizeOptions(gender) {
  return gender === "남성" ? MEN_BOTTOM_OPTIONS : WOMEN_BOTTOM_OPTIONS;
}
