/**
 * styleCategories.js
 *
 * Single source of truth for the 15 스타일 categories used across the app.
 * Used in: 코디 screen, 옷장 > 코디북, weather recommendation, outfit data.
 *
 * ⚠️  Do NOT use "분위기" or "무드" — this system is always called "스타일".
 */

export const STYLE_CATEGORIES = [
  "미니멀",
  "캐주얼",
  "페미닌",
  "스트릿",
  "하객룩",
  "데이트룩",
  "오피스룩",
  "출근룩",
  "주말룩",
  "여행룩",
  "리조트룩",
  "스포티",
  "빈티지",
  "모던시크",
  "Y2K",
];

/** All style options with "전체" prepended — for filter rows */
export const STYLE_FILTER_OPTIONS = ["전체", ...STYLE_CATEGORIES];

/**
 * Map each style to a short emoji that can appear in chips.
 * Useful for compact displays.
 */
export const STYLE_EMOJI = {
  미니멀:   "🤍",
  캐주얼:   "👟",
  페미닌:   "🌸",
  스트릿:   "🧢",
  하객룩:   "💐",
  데이트룩: "🌹",
  오피스룩: "💼",
  출근룩:   "📋",
  주말룩:   "☀️",
  여행룩:   "🧳",
  리조트룩: "🌴",
  스포티:   "🏃",
  빈티지:   "🎞️",
  모던시크: "🖤",
  Y2K:      "✨",
};
