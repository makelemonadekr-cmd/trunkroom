import { CLOSET_ITEMS } from "../constants/mockClosetData";

/**
 * Pure filter function for the search/filter screen.
 *
 * @param {{
 *   keyword?: string,
 *   categories?: string[],        // mainCategory ids, e.g. ["상의","하의"]
 *   brands?: string[],
 *   sizes?: string[],
 *   conditions?: string[],        // "새상품급" | "상태 좋음" | "사용감 있음"
 *   wearOption?: string|null,     // "never" | "1-5" | "6-10" | "10plus" | null
 *   notWornInYear?: boolean,
 *   priceOption?: string,         // "all"|"under50k"|"50-100k"|"100-300k"|"over300k"
 *   hasBox?: boolean,
 *   items?: object[],
 * }} opts
 * @returns {object[]}
 */
export function filterItemsBySearch({
  keyword       = "",
  categories    = [],
  brands        = [],
  sizes         = [],
  conditions    = [],
  wearOption    = null,
  notWornInYear = false,
  priceOption   = "all",
  hasBox        = false,
  items         = CLOSET_ITEMS,
} = {}) {
  // Compute "1 year ago" relative to today
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  return items.filter((item) => {

    // ── 1. 검색어 (keyword) ────────────────────────────────────────────────
    if (keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      const haystack = [
        item.name,
        item.brand,
        item.mainCategory ?? item.category,
        item.subCategory  ?? item.subcategory,
        ...(item.tags ?? []),
        ...(item.styleTags ?? []),
      ].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    // ── 2. 카테고리 ──────────────────────────────────────────────────────
    if (categories.length > 0) {
      const cat = item.mainCategory ?? item.category;
      if (!categories.includes(cat)) return false;
    }

    // ── 3. 브랜드 ────────────────────────────────────────────────────────
    if (brands.length > 0) {
      if (!brands.includes(item.brand)) return false;
    }

    // ── 4. 사이즈 ────────────────────────────────────────────────────────
    if (sizes.length > 0) {
      if (!sizes.includes(item.size)) return false;
    }

    // ── 5. 상태 ──────────────────────────────────────────────────────────
    if (conditions.length > 0) {
      if (!conditions.includes(item.condition)) return false;
    }

    // ── 6. 착용횟수 ──────────────────────────────────────────────────────
    if (wearOption !== null) {
      const wc = item.wearCount ?? 0;
      if (wearOption === "never"  && wc !== 0)           return false;
      if (wearOption === "1-5"    && (wc < 1 || wc > 5)) return false;
      if (wearOption === "6-10"   && (wc < 6 || wc > 10))return false;
      if (wearOption === "10plus" && wc < 10)             return false;
    }

    // ── 7. 1년 안입은 옷 ─────────────────────────────────────────────────
    if (notWornInYear) {
      if (item.lastWornAt !== null && item.lastWornAt !== undefined) {
        const lastWorn = new Date(item.lastWornAt);
        if (lastWorn >= oneYearAgo) return false; // worn within 1 year → exclude
      }
      // lastWornAt === null means never worn → passes this filter
    }

    // ── 8. 가격범위 ──────────────────────────────────────────────────────
    if (priceOption !== "all" && item.price != null) {
      const p = item.price;
      if (priceOption === "under50k"   && (p <= 0 || p > 50000))             return false;
      if (priceOption === "50-100k"    && (p <= 50000  || p > 100000))        return false;
      if (priceOption === "100-300k"   && (p <= 100000 || p > 300000))        return false;
      if (priceOption === "over300k"   && p <= 300000)                         return false;
    }

    // ── 9. 박스여부 ──────────────────────────────────────────────────────
    if (hasBox && !item.hasBox) return false;

    return true;
  });
}
