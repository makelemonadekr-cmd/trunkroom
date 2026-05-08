/**
 * wearLogsService.js
 *
 * Supabase CRUD for the wear_logs table.
 *
 * Each row represents one day's outfit record for a user.
 * The (user_id, date_str) pair is UNIQUE → upsert is safe.
 */

import { supabase } from "../lib/supabase.js";
import { uploadStylePhoto } from "./storageService.js";

const TABLE = "wear_logs";

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Fetch all wear log rows for a user, newest date first.
 *
 * @param {string} userId
 * @returns {Promise<{ logs: Object[], error: Error|null }>}
 */
export async function fetchWearLogs(userId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("date_str", { ascending: false });

  if (error) return { logs: [], error };
  return { logs: data ?? [], error: null };
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Create or update a wear log for a specific date (upsert on user_id + date_str).
 *
 * @param {string}   userId
 * @param {string}   dateStr  — "YYYY-MM-DD"
 * @param {Object}   record
 * @param {string[]} record.itemIds   — closet item IDs worn
 * @param {string}   record.note     — optional memo
 * @param {string|null} record.photoUrl — data URI or storage URL
 * @returns {Promise<{ log: Object|null, error: Error|null }>}
 */
export async function upsertWearLog(userId, dateStr, { itemIds = [], note = "", photoUrl = null } = {}) {
  // Upload photo to Supabase Storage if it's a local data URI (not already a URL)
  let finalPhotoUrl = photoUrl ?? null;
  if (finalPhotoUrl && typeof finalPhotoUrl === "string" && !/^https?:\/\//i.test(finalPhotoUrl)) {
    try {
      const { url, error: upErr } = await uploadStylePhoto(userId, finalPhotoUrl);
      if (!upErr && url) finalPhotoUrl = url;
    } catch (e) {
      console.warn("[wearLogs] photo upload failed, keeping original:", e?.message);
    }
  }

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(
      {
        user_id:  userId,
        date_str: dateStr,
        item_ids: itemIds,
        note:     note ?? "",
        photo_url: finalPhotoUrl,
      },
      { onConflict: "user_id,date_str" }
    )
    .select()
    .single();

  if (error) return { log: null, error };
  return { log: data, error: null };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Delete the wear log for a specific date.
 *
 * @param {string} userId
 * @param {string} dateStr — "YYYY-MM-DD"
 * @returns {Promise<{ error: Error|null }>}
 */
export async function deleteWearLog(userId, dateStr) {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("user_id", userId)
    .eq("date_str", dateStr);

  return { error };
}
