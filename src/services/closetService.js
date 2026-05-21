/**
 * closetService.js
 *
 * Supabase CRUD for the clothing_items table.
 *
 * All functions return { data, error } — callers handle errors.
 */

import { supabase }              from "../lib/supabase.js";
import { uploadClothingImage }   from "./storageService.js";

const TABLE = "clothing_items";

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Fetch all clothing items for a user, newest first.
 *
 * @param {string} userId
 * @returns {Promise<{ items: Object[], error: Error|null }>}
 */
export async function fetchClosetItems(userId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { items: [], error };
  return { items: data ?? [], error: null };
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Add a new clothing item, uploading its image to Storage first.
 *
 * Uploads image first (best-effort — if upload fails, item is saved without image).
 * Returns the newly-created DB row.
 *
 * @param {string}      userId
 * @param {Object}      formData   — fields from AddClosetItemScreen
 * @param {string|null} imageBase64 — raw base64 (no data: prefix), or null
 * @param {string}      mimeType   — "image/jpeg" | "image/png"
 * @returns {Promise<{ item: Object|null, error: Error|null }>}
 */
export async function addClosetItem(userId, formData, imageBase64, mimeType) {
  let imageUrl = null;

  if (imageBase64) {
    const { url, error: imgErr } = await uploadClothingImage(userId, imageBase64, mimeType);
    if (imgErr) {
      console.warn("[closetService] Image upload failed (saving without image):", imgErr.message);
    } else {
      imageUrl = url;
    }
  }

  const priceInt = formData.price
    ? parseInt(String(formData.price).replace(/,/g, ""), 10)
    : 0;

  const row = {
    user_id:       userId,
    name:          formData.name       || "새 아이템",
    display_name:  formData.name       || null,
    brand:         formData.brand      || null,
    main_category: formData.category   || "상의",
    sub_category:  formData.subCategory || null,
    style_tags:    formData.styleTags  ?? [],
    season:        formData.seasons    ?? [],
    color:         formData.color      || null,
    condition:     formData.condition  || null,
    image_url:     imageUrl,
    image_urls:    imageUrl ? [imageUrl] : [],
    price:         priceInt,
    is_for_sale:   false,
    sell_status:   "not_listed",
    source:        "manual",
    notes:         formData.desc       || null,
    // 사용자가 등록 화면 토글로 명시적으로 공개해야 발견 피드에 노출.
    // formData.isPublic 이 undefined / falsy 면 비공개 (이전 버그: 무조건 true).
    is_public:     !!formData.isPublic,
    size:          formData.size       || null,
    gender:        formData.gender     || "여성",
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select()
    .single();

  if (error) return { item: null, error };
  return { item: data, error: null };
}

// ─── Update ───────────────────────────────────────────────────────────────────

/**
 * Patch an existing clothing item.
 *
 * @param {string} itemId
 * @param {Object} patch — partial column values to update
 * @returns {Promise<{ item: Object|null, error: Error|null }>}
 */
export async function updateClosetItem(itemId, patch) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq("id", itemId)
    .select()
    .single();

  if (error) return { item: null, error };
  return { item: data, error: null };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Delete a clothing item by ID.
 *
 * @param {string} itemId
 * @returns {Promise<{ error: Error|null }>}
 */
export async function deleteClosetItem(itemId) {
  const { error } = await supabase.from(TABLE).delete().eq("id", itemId);
  return { error };
}
