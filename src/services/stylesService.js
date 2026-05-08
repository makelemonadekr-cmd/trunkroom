/**
 * stylesService.js
 *
 * Supabase CRUD for the styles table (stylebook entries).
 *
 * All callers (StylebookCreatorSheet, OutfitCanvasEditor, CoordiEditorPage)
 * now use this service directly — coordiStore (localStorage) has been removed.
 */

import { supabase } from "../lib/supabase.js";

const TABLE       = "styles";
const ITEMS_TABLE = "style_items";

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Fetch all styles for a user, newest first.
 *
 * @param {string} userId
 * @returns {Promise<{ styles: Object[], error: Error|null }>}
 */
export async function fetchStyles(userId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*, style_items(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { styles: [], error };
  return { styles: data ?? [], error: null };
}

/**
 * Fetch a single style with its items.
 *
 * @param {string} styleId
 * @returns {Promise<{ style: Object|null, error: Error|null }>}
 */
export async function fetchStyleById(styleId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*, style_items(*)")
    .eq("id", styleId)
    .single();

  if (error) return { style: null, error };
  return { style: data, error: null };
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Create a new style record with its style_items.
 *
 * @param {string} userId
 * @param {Object} styleData       — fields for the styles row
 * @param {Object[]} [items=[]]   — array of style_item objects (without style_id)
 * @returns {Promise<{ style: Object|null, error: Error|null }>}
 */
export async function createStyle(userId, styleData, items = []) {
  // Insert the parent style row
  const { data: styleRow, error: styleErr } = await supabase
    .from(TABLE)
    .insert({ user_id: userId, ...styleData })
    .select()
    .single();

  if (styleErr) return { style: null, error: styleErr };

  // Insert style_items (if any) linked to the new style
  if (items.length > 0) {
    const rows = items.map((item, i) => ({
      style_id:         styleRow.id,
      clothing_item_id: item.clothingItemId ?? null,
      item_image_url:   item.imageUrl       ?? null,
      item_name:        item.name           ?? null,
      position_x:       item.x              ?? 0,
      position_y:       item.y              ?? 0,
      scale:            item.scale          ?? 1,
      rotation:         item.rotation       ?? 0,
      layer_order:      i,
    }));

    const { error: itemsErr } = await supabase.from(ITEMS_TABLE).insert(rows);
    if (itemsErr) console.warn("[stylesService] style_items insert failed:", itemsErr.message);
  }

  return { style: styleRow, error: null };
}

/**
 * Update fields on an existing style.
 *
 * @param {string} styleId
 * @param {Object} patch
 * @returns {Promise<{ style: Object|null, error: Error|null }>}
 */
export async function updateStyle(styleId, patch) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq("id", styleId)
    .select()
    .single();

  if (error) return { style: null, error };
  return { style: data, error: null };
}

/**
 * Replace all style_items for an existing style (delete-then-insert).
 * Use when the item selection changes during an edit.
 *
 * @param {string}   styleId
 * @param {Object[]} items  — array of { clothingItemId }
 * @returns {Promise<{ error: Error|null }>}
 */
export async function replaceStyleItems(styleId, items = []) {
  const { error: delErr } = await supabase
    .from(ITEMS_TABLE)
    .delete()
    .eq("style_id", styleId);
  if (delErr) return { error: delErr };

  if (items.length > 0) {
    const rows = items.map((item, i) => ({
      style_id:         styleId,
      clothing_item_id: item.clothingItemId ?? null,
      item_image_url:   item.imageUrl       ?? null,
      item_name:        item.name           ?? null,
      position_x:       item.x              ?? 0,
      position_y:       item.y              ?? 0,
      scale:            item.scale          ?? 1,
      rotation:         item.rotation       ?? 0,
      layer_order:      i,
    }));
    const { error: insErr } = await supabase.from(ITEMS_TABLE).insert(rows);
    if (insErr) return { error: insErr };
  }
  return { error: null };
}

/**
 * Fetch all styles that contain a specific clothing item.
 * Used by ClosetItemDetailScreen to show "이 아이템으로 만든 스타일북".
 *
 * @param {string} clothingItemId
 * @returns {Promise<{ styles: Object[], error: Error|null }>}
 */
export async function fetchStylesByItemId(clothingItemId) {
  if (!clothingItemId) return { styles: [], error: null };
  const { data, error } = await supabase
    .from(ITEMS_TABLE)
    .select("style_id, styles(id, title, background_url, is_public, created_at)")
    .eq("clothing_item_id", clothingItemId);

  if (error) return { styles: [], error };
  const styles = (data ?? [])
    .map((row) => row.styles)
    .filter(Boolean);
  // Deduplicate by id (same style can have multiple items from the same closet piece)
  const seen = new Set();
  return {
    styles: styles.filter((s) => { if (seen.has(s.id)) return false; seen.add(s.id); return true; }),
    error: null,
  };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Delete a style and all its style_items (CASCADE in DB handles style_items).
 *
 * @param {string} styleId
 * @returns {Promise<{ error: Error|null }>}
 */
export async function deleteStyle(styleId) {
  const { error } = await supabase.from(TABLE).delete().eq("id", styleId);
  return { error };
}
