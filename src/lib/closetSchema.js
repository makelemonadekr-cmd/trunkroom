/**
 * closetSchema.js
 *
 * Defines the canonical schema for closet items and outfit records.
 * Use this as the reference when building new items or connecting a backend.
 *
 * Field names are stable and developer-friendly (English keys, Korean values in data).
 * Arrays like season/styleTags/tags are kept as arrays internally
 * but flattened (joined) for CSV/Notion export — see closetExportSchema.js.
 */

// ─── Closet Item schema ────────────────────────────────────────────────────────

/**
 * @typedef {Object} ClosetItem
 *
 * @property {string}   id            – stable unique ID (e.g. "item-42" or UUID)
 * @property {string}   name          – short item name  (e.g. "오버핏 블랙 반팔")
 * @property {string}   displayName   – human-friendly Korean label (e.g. "블랙 오버핏 반팔 티셔츠")
 * @property {string}   brand         – brand name       (e.g. "UNIQLO")
 * @property {string}   mainCategory  – main category label (matches MAIN_CATEGORIES)
 * @property {string}   subCategory   – subcategory label  (matches SUBCATEGORIES)
 * @property {string[]} styleTags     – up to 4 style tags from STYLE_CATEGORIES
 * @property {string[]} season        – ["봄","여름","가을","겨울"] subset
 * @property {string}   color         – primary color in Korean (e.g. "화이트")
 * @property {string}   [secondaryColor] – secondary color, if applicable
 * @property {string[]} tags          – freeform keyword tags (e.g. ["베이직","데일리"])
 * @property {string}   image         – primary image URL
 * @property {string[]} [images]      – additional image URLs
 * @property {string}   size          – size label (e.g. "M", "250")
 * @property {string}   condition     – "S급"|"A급"|"B급"|"C급"
 * @property {number}   price         – listed price in KRW (0 = not for sale)
 * @property {boolean}  isForSale     – whether currently listed for sale
 * @property {string}   source        – "manual"|"auto"|"imported"
 * @property {string}   [notes]       – free-form notes
 * @property {string}   createdAt     – ISO 8601 date string
 * @property {string}   updatedAt     – ISO 8601 date string
 */

// ─── Outfit schema ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} OutfitRecord
 *
 * @property {string}   id            – stable outfit ID (e.g. "outfit-001")
 * @property {string}   title         – Korean title
 * @property {string}   style         – one of STYLE_CATEGORIES
 * @property {string[]} season        – array of season strings
 * @property {string}   previewImage  – thumbnail image URL
 * @property {string[]} itemIds       – IDs of ClosetItems in this outfit
 * @property {string[]} anchorItemIds – hero item IDs (for recommendation matching)
 * @property {string}   shortDesc     – one-line Korean description
 * @property {string[]} tags          – searchable tags
 * @property {number}   likes         – like count
 * @property {string}   color         – dominant hex color for card bg
 */

// ─── Empty / default item factory ─────────────────────────────────────────────

const NOW = () => new Date().toISOString();

/**
 * Create a new empty ClosetItem with sensible defaults.
 * Useful when building forms or test data.
 *
 * @param {Partial<ClosetItem>} overrides
 * @returns {ClosetItem}
 */
export function createEmptyClosetItem(overrides = {}) {
  return {
    id:            `item-${Date.now()}`,
    name:          "",
    displayName:   "",
    brand:         "",
    mainCategory:  "상의",
    subCategory:   "",
    styleTags:     [],
    season:        [],
    color:         "",
    secondaryColor: null,
    tags:          [],
    image:         null,
    images:        [],
    size:          "",
    condition:     "A급",
    price:         0,
    isForSale:     false,
    source:        "manual",
    notes:         "",
    createdAt:     NOW(),
    updatedAt:     NOW(),
    ...overrides,
  };
}

/**
 * Validate that a ClosetItem has the required fields.
 * Returns { valid, errors }.
 *
 * @param {Partial<ClosetItem>} item
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateClosetItem(item) {
  const errors = [];
  if (!item.id)           errors.push("id is required");
  if (!item.name)         errors.push("name is required");
  if (!item.mainCategory) errors.push("mainCategory is required");
  return { valid: errors.length === 0, errors };
}
