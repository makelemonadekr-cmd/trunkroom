/**
 * filterClosetItemsByPiece.js
 *
 * Given a list of subcategory names (from a recommended piece),
 * returns all closet items that belong to any of those subcategories.
 *
 * Supports both new schema (subCategory) and legacy (subcategory) field names.
 */

import { CLOSET_ITEMS } from "../constants/mockClosetData";

/**
 * @param {string[]} subcats  — e.g. ["트렌치코트"] or ["슬랙스", "청바지"]
 * @param {object[]|null} items — optional override (defaults to CLOSET_ITEMS)
 * @returns {import("../lib/closetSchema").ClosetItem[]}
 */
export function filterClosetItemsBySubcats(subcats = [], items = CLOSET_ITEMS) {
  if (!subcats.length) return [];
  return items.filter((item) =>
    subcats.some(
      (sub) =>
        item.subCategory === sub ||   // new schema
        item.subcategory  === sub     // legacy schema
    )
  );
}

/**
 * Filter closet items by a piece object (as returned by getOutfitRec).
 * @param {{ label: string, subcats: string[] }} piece
 * @param {object[]|null} items
 */
export function filterClosetItemsByPiece(piece, items = CLOSET_ITEMS) {
  if (!piece?.subcats?.length) return [];
  return filterClosetItemsBySubcats(piece.subcats, items);
}
