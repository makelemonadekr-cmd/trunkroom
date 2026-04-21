/**
 * seasonFilters.js
 *
 * Season constants used across filters and data schemas.
 * Used in: 코디 screen, 옷장 > 코디북, outfit data, closet items.
 */

/** All seasons including "전체" — use for filter rows */
export const SEASON_FILTER_OPTIONS = ["전체", "봄", "여름", "가을", "겨울"];

/** Seasons without "전체" — use for data fields */
export const SEASONS = ["봄", "여름", "가을", "겨울"];

/** Season display colors */
export const SEASON_COLORS = {
  봄:   "#F9A8D4", // pink
  여름: "#67E8F9", // cyan
  가을: "#FCA5A5", // warm orange-red
  겨울: "#93C5FD", // blue
};
