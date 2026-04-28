/**
 * profileService.js
 *
 * Supabase CRUD for the profiles table + avatar upload.
 *
 * Fields stored in Supabase profiles:
 *   nickname, bio, avatar_url, instagram_url, is_public
 *
 * Fields still in localStorage (userStore) for now:
 *   gender, birthDate, height, styleKeywords
 */

import { supabase } from "../lib/supabase.js";

const TABLE         = "profiles";
const AVATAR_BUCKET = "avatars";

// ─── Ensure profile exists ────────────────────────────────────────────────────

/**
 * Upsert a minimal profile row for the user.
 *
 * Called when `fetchProfile` returns PGRST116 (no row found), which means either:
 *   a) The DB trigger that creates profiles on auth.users insert doesn't exist, OR
 *   b) The user signed up before the trigger was deployed.
 *
 * Uses ignoreDuplicates so a pre-existing row is never overwritten.
 * If the insert is silently ignored (row already exists), falls back to a fetch.
 *
 * @param {string} userId
 * @param {string|null} [displayName]  – nickname to store (optional)
 * @returns {Promise<{ profile: Object|null, error: Error|null }>}
 */
export async function ensureProfile(userId, displayName = null) {
  const row = { id: userId, nickname: displayName ?? null };

  const { data: inserted, error: insertErr } = await supabase
    .from(TABLE)
    .upsert(row, { onConflict: "id", ignoreDuplicates: true })
    .select()
    .single();

  // Happy path: row was created and returned
  if (!insertErr && inserted) return { profile: inserted, error: null };

  // ignoreDuplicates may return empty data — fetch the existing row
  const { data: existing, error: fetchErr } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", userId)
    .single();

  if (fetchErr) return { profile: null, error: fetchErr };
  return { profile: existing, error: null };
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Fetch a user's profile row.
 *
 * @param {string} userId
 * @returns {Promise<{ profile: Object|null, error: Error|null }>}
 */
export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", userId)
    .single();

  if (error) return { profile: null, error };
  return { profile: data, error: null };
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Update profile fields.
 *
 * @param {string} userId
 * @param {Object} patch — subset of profile columns to update
 * @returns {Promise<{ profile: Object|null, error: Error|null }>}
 */
export async function updateProfile(userId, patch) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq("id", userId)
    .select()
    .single();

  if (error) return { profile: null, error };
  return { profile: data, error: null };
}

// ─── Avatar upload ────────────────────────────────────────────────────────────

/**
 * Upload a profile avatar from a data URL (e.g. from FileReader.readAsDataURL).
 * Uses upsert so re-uploading replaces the previous file.
 * Appends a cache-busting query param so the browser picks up the new image.
 *
 * @param {string} userId
 * @param {string} dataUrl — "data:image/jpeg;base64,..."
 * @returns {Promise<{ url: string|null, error: Error|null }>}
 */
export async function uploadAvatar(userId, dataUrl) {
  try {
    // Convert data URL → Blob via fetch (works in all modern browsers)
    const res  = await fetch(dataUrl);
    const blob = await res.blob();

    const ext  = blob.type === "image/png" ? "png" : "jpg";
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, blob, { contentType: blob.type, upsert: true });

    if (uploadErr) return { url: null, error: uploadErr };

    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    // Cache-bust so the browser always fetches the latest version
    return { url: `${data.publicUrl}?v=${Date.now()}`, error: null };
  } catch (err) {
    return { url: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
