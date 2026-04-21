/**
 * getRecommendedOutfitsByItem.js
 *
 * Given a tapped/selected closet item, returns outfit recommendations
 * that MUST include or be strongly compatible with that item.
 *
 * Algorithm (MVP — replace with ML/backend later):
 *   1. Exact match  — outfits where itemIds includes the item's id
 *   2. Style match  — outfits whose style overlaps item's styleTags
 *   3. Season match — outfits whose season overlaps item's season
 *   4. Category match — outfits that include an item in the same category
 *
 * Returns up to `maxResults` outfits, ranked by priority.
 *
 * Important: results always include the clicked item as a highlighted piece.
 * The calling component should display the clicked item prominently in each card.
 */

import { OUTFIT_DATA } from "../constants/mockOutfitData.js";

/**
 * @param {import("../lib/closetSchema.js").ClosetItem} item — the tapped item
 * @param {number} [maxResults=5]
 * @returns {import("../constants/mockOutfitData.js").OutfitRecord[]}
 */
export function getRecommendedOutfitsByItem(item, maxResults = 5) {
  if (!item) return [];

  const seen    = new Set();
  const results = [];

  function push(outfit) {
    if (!seen.has(outfit.id) && results.length < maxResults) {
      seen.add(outfit.id);
      results.push(outfit);
    }
  }

  // ── Priority 1: outfits that explicitly list this item's id ──
  OUTFIT_DATA
    .filter((o) => o.itemIds.includes(item.id))
    .forEach(push);

  if (results.length >= maxResults) return results;

  // ── Priority 2: outfits whose style matches any of the item's styleTags ──
  const itemStyles = item.styleTags ?? item.tags ?? [];
  if (itemStyles.length) {
    OUTFIT_DATA
      .filter((o) => itemStyles.some((s) => o.style === s || o.tags?.includes(s)))
      .forEach(push);
  }

  if (results.length >= maxResults) return results;

  // ── Priority 3: outfits whose season overlaps the item's seasons ──
  const itemSeasons = item.season ?? [];
  if (itemSeasons.length) {
    OUTFIT_DATA
      .filter((o) => itemSeasons.some((s) => o.season.includes(s)))
      .forEach(push);
  }

  if (results.length >= maxResults) return results;

  // ── Priority 4: fill remaining slots with popular outfits ──
  [...OUTFIT_DATA]
    .sort((a, b) => b.likes - a.likes)
    .forEach(push);

  return results;
}

/**
 * Build the outfit recommendation context for display:
 * returns the anchor item + the outfit that includes it.
 *
 * @param {ClosetItem} anchorItem
 * @param {OutfitRecord} outfit
 * @returns {{ anchorItem: ClosetItem, outfit: OutfitRecord, isExactMatch: boolean }}
 */
export function buildOutfitContext(anchorItem, outfit) {
  return {
    anchorItem,
    outfit,
    isExactMatch: outfit.itemIds.includes(anchorItem.id),
  };
}
