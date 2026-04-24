/**
 * types/index.js
 *
 * JSDoc type definitions for the Trunkroom data model.
 * These mirror the Supabase database schema (ENGINEERING_PLAN.md §4).
 *
 * Use these as @param / @returns annotations in service files.
 * No runtime code here — types only.
 */

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Supabase auth user object (subset of fields we use).
 * @typedef {Object} AuthUser
 * @property {string}  id         — UUID from auth.users
 * @property {string}  email
 * @property {Object}  user_metadata
 * @property {string}  user_metadata.display_name
 * @property {string}  user_metadata.username
 * @property {string}  created_at
 */

// ─── Profile ──────────────────────────────────────────────────────────────────

/**
 * Public user profile row from the `profiles` table.
 * @typedef {Object} Profile
 * @property {string}  id               — UUID (matches auth.users.id)
 * @property {string}  username          — @handle
 * @property {string}  display_name      — shown in UI
 * @property {string|null} avatar_url    — Supabase Storage public URL
 * @property {string|null} bio           — self introduction (max 200 chars)
 * @property {boolean} is_seller         — is this a seller account
 * @property {number}  follower_count
 * @property {number}  following_count
 * @property {number}  item_count
 * @property {number}  style_count
 * @property {boolean} is_verified
 * @property {string}  created_at
 * @property {string}  updated_at
 */

// ─── Clothing Item ────────────────────────────────────────────────────────────

/**
 * A clothing item in a user's closet, from the `clothing_items` table.
 * @typedef {Object} ClothingItem
 * @property {string}   id
 * @property {string}   user_id           — owner's profile id
 * @property {string}   name              — short name "블랙 반팔"
 * @property {string|null} display_name   — full display name
 * @property {string|null} brand
 * @property {string}   main_category     — "상의"|"하의"|"아우터"|"원피스"|"신발"|"가방"|"액세서리"|"스포츠"
 * @property {string|null} sub_category
 * @property {string[]} style_tags        — max 4 from STYLE_CATEGORIES
 * @property {string[]} season            — ["봄","여름","가을","겨울"] subset
 * @property {string|null} color
 * @property {string|null} secondary_color
 * @property {string[]} tags              — freeform keywords
 * @property {string|null} size
 * @property {string|null} condition      — "S급"|"A급"|"B급"|"C급"
 * @property {string|null} image_url      — primary Supabase Storage URL
 * @property {string[]} image_urls        — additional images
 * @property {number}   price             — KRW (0 = not for sale)
 * @property {boolean}  is_for_sale
 * @property {string}   sell_status       — "not_listed"|"listed"|"sold"|"reserved"
 * @property {string|null} sell_channel   — URL or channel name
 * @property {number|null} purchase_price
 * @property {string|null} purchase_date  — ISO date
 * @property {string|null} purchase_url
 * @property {number}   wear_count
 * @property {string|null} last_worn_at   — ISO date
 * @property {string}   source            — "manual"|"auto"|"imported"
 * @property {string|null} notes
 * @property {boolean}  is_public
 * @property {string}   created_at
 * @property {string}   updated_at
 */

// ─── Style ────────────────────────────────────────────────────────────────────

/**
 * A saved stylebook / outfit record, from the `styles` table.
 * @typedef {Object} Style
 * @property {string}   id
 * @property {string}   user_id
 * @property {string|null} title           — "클린 미니멀 데일리"
 * @property {string|null} date_str        — "YYYY-MM-DD" worn date
 * @property {string}   template_id        — "A" | "B"
 * @property {string|null} background_url  — outfit photo in Supabase Storage
 * @property {string|null} stylebook_url   — exported 4:5 image in Storage
 * @property {string|null} mood
 * @property {string|null} custom_mood
 * @property {string|null} memo            — private notes
 * @property {Object|null} weather_snapshot — { temp, condition, location }
 * @property {boolean}  is_public
 * @property {number}   like_count
 * @property {number}   view_count
 * @property {string}   created_at
 * @property {string}   updated_at
 * @property {StyleItem[]} [style_items]   — joined when queried with select('*, style_items(*)')
 */

// ─── Style Item ───────────────────────────────────────────────────────────────

/**
 * Junction between a style and its clothing items, with canvas transform data.
 * From the `style_items` table.
 * @typedef {Object} StyleItem
 * @property {string}   id
 * @property {string}   style_id
 * @property {string|null} clothing_item_id  — null if external/guest item
 * @property {string|null} item_image_url    — fallback image URL
 * @property {string|null} item_name
 * @property {number}   position_x           — dx in pixels
 * @property {number}   position_y           — dy in pixels
 * @property {number}   scale                — 1.0 = original size
 * @property {number}   rotation             — degrees
 * @property {number}   layer_order          — z-index position
 * @property {string}   created_at
 */

// ─── Wear Log ─────────────────────────────────────────────────────────────────

/**
 * Daily wear log entry, from the `wear_logs` table.
 * @typedef {Object} WearLog
 * @property {string}   id
 * @property {string}   user_id
 * @property {string|null} style_id  — linked style if stylebook was created
 * @property {string}   date_str     — "YYYY-MM-DD"
 * @property {string[]} item_ids     — clothing_items.id array
 * @property {string}   created_at
 * @property {string}   updated_at
 */

// ─── Follow ───────────────────────────────────────────────────────────────────

/**
 * Follow relationship, from the `follows` table.
 * @typedef {Object} Follow
 * @property {string} follower_id
 * @property {string} following_id
 * @property {string} created_at
 */

// ─── Saved Style ──────────────────────────────────────────────────────────────

/**
 * User-bookmarked style, from the `saved_styles` table.
 * @typedef {Object} SavedStyle
 * @property {string} user_id
 * @property {string} style_id
 * @property {string} created_at
 */

// ─── Inquiry ──────────────────────────────────────────────────────────────────

/**
 * 1:1 item inquiry message, from the `inquiries` table.
 * @typedef {Object} Inquiry
 * @property {string}   id
 * @property {string|null} item_id
 * @property {string}   from_user_id
 * @property {string}   to_user_id
 * @property {string}   message
 * @property {boolean}  is_read
 * @property {string}   created_at
 */
