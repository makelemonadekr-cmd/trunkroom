/**
 * localImages.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Bridge between the processed image library (imageAssets.json) and the
 * app's mock data files.
 *
 * ── ZONE-BASED ALLOCATION (duplicate suppression) ────────────────────────────
 * Every visible UI section owns an exclusive, non-overlapping slice of the
 * image pool. A zone maps [start, length] into the global pool array.
 * Cross-zone index collision is structurally impossible.
 *
 * Pool sizes (from imageAssets.json):
 *   tops: 136 · bottoms: 88 · outerwear: 63 · dress: 11 · coordi: 410
 *
 * ── COORDI ZONE MAP (non-overlapping, total used: 0–139) ─────────────────────
 *   outfits     [  0, 25]  OUTFIT_DATA + CodiPage cards
 *   weather     [ 25, 10]  weatherRecommendation images
 *   styleBooks  [ 35, 10]  HomePage STYLE_BOOKS cards
 *   cleanout    [ 45,  5]  CleanoutServiceScreen cards
 *   sellerProf  [ 50,  8]  mockSellerData profile photos
 *   closetLife  [ 58,  2]  mockClosetData lifestyle shots
 *   community   [ 60, 20]  HomePage COMMUNITY_TODAY_POSTS  ← 스타일 folder
 *   sellerCover [ 80,  8]  mockSellerData cover photos
 *   subcatShoes [100, 10]  subcategoryImageMap — 신발
 *   subcatBags  [110, 10]  subcategoryImageMap — 가방
 *   subcatAccess[120, 10]  subcategoryImageMap — 액세서리
 *   subcatSports[130, 10]  subcategoryImageMap — 스포츠
 *
 * ── ITEM ZONE MAP (non-overlapping per category) ─────────────────────────────
 *   Zone          tops      bottoms   outerwear  dress
 *   closet       [0, 20]   [0, 16]   [0, 10]    [0,  2]
 *   subcategory  [20, 20]  [16, 20]  [10, 20]   [0, 10]  ← dress overlaps closet
 *   homeListings [40, 20]  [36, 16]  [30, 10]   [10, 1]  ← last dress image
 *   sell         [60, 16]  [52, 14]  [40, 10]   [2,  4]  ← dress: diff screen, ok
 *   similar      [76, 20]  [66, 16]  [50, 12]   [6,  4]  ← dress: diff screen, ok
 *
 *   dress has only 11 images; sell/similar/subcategory share its range across
 *   different screens (never simultaneously visible) — documented exception.
 *
 * Usage:
 *   import { zoneItemImg, zoneCoordiImg } from "../lib/localImages";
 *
 *   zoneItemImg("closet", "tops", 0)   → exclusive tops image for closet section
 *   zoneCoordiImg("outfits", 3)        → exclusive coordi image for outfit cards
 */

import manifest from "../constants/imageAssets.json";

// ─── Build pools once at module load ─────────────────────────────────────────

/** @type {Record<string, string[]>} */
const _itemsByCategory = {};

for (const item of manifest.items ?? []) {
  const cat = item.category ?? "unknown";
  if (!_itemsByCategory[cat]) _itemsByCategory[cat] = [];
  _itemsByCategory[cat].push(item.app_url);
}

/** All coordi image URLs in order */
const _coordiAll = (manifest.coordi ?? []).map((r) => r.app_url);

/** Musinsa snap coordi URLs */
const _coordiSnap = (manifest.coordi ?? [])
  .filter((r) => r.source === "musinsa_snap")
  .map((r) => r.app_url);

/** Pinterest pin coordi URLs */
const _coordiPin = (manifest.coordi ?? [])
  .filter((r) => r.source === "pinterest_pin")
  .map((r) => r.app_url);

// ─── Exported pools (read-only references) ────────────────────────────────────

export const ITEM_POOLS = _itemsByCategory;
export const COORDI_ALL = _coordiAll;

// ─── Zone definitions ─────────────────────────────────────────────────────────
// Each entry: [globalStartIndex, sliceLength]
// zoneImg(zone, localIndex) = pool[start + (localIndex % length)]
// Zones NEVER share index ranges → guaranteed deduplication across sections.

/**
 * Coordi image zones.
 * @type {Record<string, [number, number]>}
 */
export const COORDI_ZONES = {
  outfits:      [0,   25],  // OUTFIT_DATA + CodiPage — 0-24
  weather:      [25,  10],  // weatherRecommendation — 25-34
  styleBooks:   [35,  10],  // HomePage STYLE_BOOKS — 35-44
  cleanout:     [45,   5],  // CleanoutServiceScreen — 45-49
  sellerProf:   [50,   8],  // mockSellerData profiles — 50-57
  closetLife:   [58,   2],  // mockClosetData lifestyle — 58-59
  community:    [60,  20],  // HomePage COMMUNITY_TODAY_POSTS — 60-79  (스타일 folder)
  sellerCover:  [80,   8],  // mockSellerData covers — 80-87
  subcatShoes:  [100, 10],  // subcategoryImageMap 신발 — 100-109
  subcatBags:   [110, 10],  // subcategoryImageMap 가방 — 110-119
  subcatAccess: [120, 10],  // subcategoryImageMap 액세서리 — 120-129
  subcatSports: [130, 10],  // subcategoryImageMap 스포츠 — 130-139
};

/**
 * Item image zones per category.
 * @type {Record<string, Record<string, [number, number]>>}
 */
export const ITEM_ZONES = {
  //              tops(136)    bottoms(88)   outerwear(63)  dress(11)
  closet:       { tops:[0,20],  bottoms:[0,16],  outerwear:[0,10],  dress:[0,2]   },
  subcategory:  { tops:[20,20], bottoms:[16,20], outerwear:[10,20], dress:[0,10]  },
  homeListings: { tops:[40,20], bottoms:[36,16], outerwear:[30,10], dress:[10,1]  },
  sell:         { tops:[60,16], bottoms:[52,14], outerwear:[40,10], dress:[2,4]   },
  similar:      { tops:[76,20], bottoms:[66,16], outerwear:[50,12], dress:[6,4]   },
};

// ─── Zone-based access (primary API — use these instead of itemImg/coordiImg) ──

/**
 * Get an item image URL from a named zone.
 * localIndex cycles within the zone's slice — never escapes into another zone.
 *
 * @param {keyof typeof ITEM_ZONES} zone
 * @param {string} category
 * @param {number} [localIndex=0]
 * @returns {string}
 */
export function zoneItemImg(zone, category, localIndex = 0) {
  const z = ITEM_ZONES[zone];
  if (z && z[category]) {
    const [start, len] = z[category];
    const pool = _itemsByCategory[category];
    if (pool && pool.length) {
      const globalIdx = start + (Math.abs(Math.round(localIndex)) % len);
      return pool[globalIdx % pool.length];
    }
  }
  // Fallback: unzoned access (category missing or unknown zone)
  return itemImg(category, localIndex);
}

/**
 * Get a coordi image URL from a named zone.
 * localIndex cycles within the zone's slice — never escapes into another zone.
 *
 * @param {keyof typeof COORDI_ZONES} zone
 * @param {number} [localIndex=0]
 * @returns {string}
 */
export function zoneCoordiImg(zone, localIndex = 0) {
  const spec = COORDI_ZONES[zone];
  if (spec) {
    const [start, len] = spec;
    const globalIdx = start + (Math.abs(Math.round(localIndex)) % len);
    return _coordiAll[globalIdx % _coordiAll.length] ?? "";
  }
  // Fallback: unzoned access
  return coordiImg(localIndex);
}

// ─── Legacy helpers (kept for backward compat — prefer zone variants above) ───

/**
 * Get a local item image URL by category and index (global pool, no zone).
 * Prefer zoneItemImg() for all new code.
 */
export function itemImg(category, index = 0) {
  const pool = _itemsByCategory[category];
  if (pool && pool.length > 0) {
    return pool[Math.abs(Math.round(index)) % pool.length];
  }
  return coordiImg(index);
}

/**
 * Get a local coordi/style image URL by index (global pool, no zone).
 * Prefer zoneCoordiImg() for all new code.
 */
export function coordiImg(index = 0, source = "all") {
  let pool = _coordiAll;
  if (source === "snap") pool = _coordiSnap;
  else if (source === "pin") pool = _coordiPin;
  if (!pool.length) return "";
  return pool[Math.abs(Math.round(index)) % pool.length];
}

/**
 * Get N sequential coordi images starting at `startIndex`.
 */
export function coordiImgs(count, startIndex = 0) {
  const result = [];
  for (let i = 0; i < count; i++) result.push(coordiImg(startIndex + i));
  return result;
}

/**
 * Get N sequential item images for a category starting at `startIndex`.
 */
export function itemImgs(category, count, startIndex = 0) {
  const result = [];
  for (let i = 0; i < count; i++) result.push(itemImg(category, startIndex + i));
  return result;
}

/**
 * Pick a spread of images from a category pool, evenly distributed.
 */
export function itemSpread(category, count, offset = 0) {
  const pool = _itemsByCategory[category];
  if (!pool || !pool.length) return Array(count).fill(coordiImg(offset));
  const step = Math.max(1, Math.floor(pool.length / count));
  return Array.from({ length: count }, (_, i) =>
    pool[(offset + i * step) % pool.length]
  );
}

// ─── Pool size queries ─────────────────────────────────────────────────────────

export function getPoolSizes() {
  const sizes = {};
  for (const [cat, pool] of Object.entries(_itemsByCategory)) {
    sizes[cat] = pool.length;
  }
  sizes._coordi_total = _coordiAll.length;
  sizes._coordi_snap  = _coordiSnap.length;
  sizes._coordi_pin   = _coordiPin.length;
  return sizes;
}
