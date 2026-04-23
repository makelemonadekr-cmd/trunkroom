/**
 * styleMatchUtils.js
 *
 * Keyword-based closet item similarity engine.
 *
 * findSimilarClosetItems(wornItems, excludeIds?)
 *   → Returns CLOSET_ITEMS ranked by similarity to the given worn items,
 *     excluding the worn items themselves (and any extra excludeIds).
 *
 * Scoring per matching keyword with any worn item:
 *   same mainCategory / category     → +10
 *   same subCategory / subcategory   → +8
 *   same color                        → +6
 *   shared season entry               → +4 each
 *   shared styleTag entry             → +3 each
 *   shared tag entry                  → +2 each
 *   same material                     → +2
 *   same mood                         → +2
 *
 * groupItemsByCategory(items)
 *   → Groups a flat item array into [{ category, items[] }] buckets.
 */

import { CLOSET_ITEMS } from "../constants/mockClosetData";

export function findSimilarClosetItems(wornItems = [], excludeIds = []) {
  if (!wornItems || wornItems.length === 0) return [];

  // ── Collect keyword sets from all worn items ─────────────────────────────
  const categories    = new Set();
  const subCategories = new Set();
  const colors        = new Set();
  const seasons       = new Set();
  const styleTags     = new Set();
  const tags          = new Set();
  const materials     = new Set();
  const moods         = new Set();

  for (const item of wornItems) {
    const lc = (s) => (s ?? "").toLowerCase();

    if (item.mainCategory)  categories.add(lc(item.mainCategory));
    if (item.category)      categories.add(lc(item.category));
    if (item.subCategory)   subCategories.add(lc(item.subCategory));
    if (item.subcategory)   subCategories.add(lc(item.subcategory));
    if (item.color)         colors.add(lc(item.color));
    if (item.material)      materials.add(lc(item.material));
    if (item.mood)          moods.add(lc(item.mood));

    (item.season    ?? []).forEach((s) => seasons.add(lc(s)));
    (item.styleTags ?? []).forEach((t) => styleTags.add(lc(t)));
    (item.tags      ?? []).forEach((t) => tags.add(lc(t)));
  }

  const excludeSet = new Set([
    ...excludeIds,
    ...wornItems.map((i) => i.id),
  ]);

  // ── Score every non-excluded closet item ─────────────────────────────────
  const scored = CLOSET_ITEMS
    .filter((item) => !excludeSet.has(item.id))
    .map((item) => {
      let score = 0;
      const lc = (s) => (s ?? "").toLowerCase();

      const cat    = lc(item.mainCategory ?? item.category);
      const subCat = lc(item.subCategory  ?? item.subcategory);
      const color  = lc(item.color);
      const mat    = lc(item.material);
      const mood   = lc(item.mood);

      if (cat    && categories.has(cat))        score += 10;
      if (subCat && subCategories.has(subCat))  score += 8;
      if (color  && colors.has(color))          score += 6;
      if (mat    && materials.has(mat))         score += 2;
      if (mood   && moods.has(mood))            score += 2;

      for (const s of (item.season    ?? []).map(lc)) if (seasons.has(s))    score += 4;
      for (const t of (item.styleTags ?? []).map(lc)) if (styleTags.has(t))  score += 3;
      for (const t of (item.tags      ?? []).map(lc)) if (tags.has(t))       score += 2;

      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map(({ item }) => item);
}

/**
 * Groups a flat item array into [{ category: string, items: [] }] buckets
 * ordered by the first occurrence of each category.
 */
export function groupItemsByCategory(items) {
  const map = new Map();
  for (const item of items) {
    const key = item.mainCategory ?? item.category ?? "기타";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return Array.from(map.entries()).map(([category, items]) => ({
    category,
    items,
  }));
}
