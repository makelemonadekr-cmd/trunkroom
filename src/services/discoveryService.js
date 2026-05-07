/**
 * discoveryService.js
 *
 * Supabase read-only queries for the public discovery feed.
 *
 *   fetchPublicStyles    — styles where is_public = true  (+ seller profile info)
 *   fetchPublicItems     — clothing_items where is_public = true (+ seller profile info)
 *   fetchPublicSellers   — profiles where is_public = true
 *   fetchSellerContent   — a single user's public items + styles (for profile page)
 */

import { supabase } from "../lib/supabase.js";
import { fetchBlockedIds } from "./moderationService.js";

/** Filter out rows authored by users the viewer has blocked. */
async function filterBlocked(rows, viewerId, userIdField = "user_id") {
  if (!viewerId || rows.length === 0) return rows;
  const { ids } = await fetchBlockedIds(viewerId);
  if (ids.length === 0) return rows;
  const blocked = new Set(ids);
  return rows.filter((r) => !blocked.has(r[userIdField]));
}

// ─── Internal helper ──────────────────────────────────────────────────────────

/**
 * Batch-fetch profiles for a list of user IDs.
 * Returns a map { [userId]: profileRow }.
 */
async function fetchProfilesMap(userIds) {
  if (userIds.length === 0) return {};
  const { data } = await supabase
    .from("profiles")
    .select("id, nickname, avatar_url")
    .in("id", userIds);
  return Object.fromEntries((data ?? []).map((p) => [p.id, p]));
}

// ─── Public styles ────────────────────────────────────────────────────────────

/**
 * Fetch the latest public stylebook entries, with seller profile info attached.
 *
 * Each row is extended with `_profile: { id, nickname, avatar_url } | null`.
 *
 * @param {{ limit?: number }} [opts]
 * @returns {Promise<{ styles: Object[], error: Error|null }>}
 */
export async function fetchPublicStyles({ limit = 60, viewerId = null } = {}) {
  const { data, error } = await supabase
    .from("styles")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { styles: [], error };

  const rows     = await filterBlocked(data ?? [], viewerId);
  const userIds  = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
  const profiles = await fetchProfilesMap(userIds);

  return {
    styles: rows.map((r) => ({ ...r, _profile: profiles[r.user_id] ?? null })),
    error:  null,
  };
}

// ─── Public items ─────────────────────────────────────────────────────────────

/**
 * Fetch the latest public clothing items, with seller profile info attached.
 *
 * Each row is extended with `_profile: { id, nickname, avatar_url } | null`.
 *
 * @param {{ limit?: number }} [opts]
 * @returns {Promise<{ items: Object[], error: Error|null }>}
 */
export async function fetchPublicItems({ limit = 80 } = {}) {
  const { data, error } = await supabase
    .from("clothing_items")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { items: [], error };

  const rows     = data ?? [];
  const userIds  = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
  const profiles = await fetchProfilesMap(userIds);

  return {
    items: rows.map((r) => ({ ...r, _profile: profiles[r.user_id] ?? null })),
    error: null,
  };
}

// ─── Public sellers ───────────────────────────────────────────────────────────

/**
 * Fetch profiles that have opted-in to public visibility.
 * These appear in the "셀러" tab of the discovery page.
 *
 * @param {{ limit?: number }} [opts]
 * @returns {Promise<{ sellers: Object[], error: Error|null }>}
 */
export async function fetchPublicSellers({ limit = 30 } = {}) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nickname, bio, avatar_url, instagram_url, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { sellers: [], error };
  return { sellers: data ?? [], error: null };
}

// ─── Per-seller content (for SellerProfilePage overlay) ───────────────────────

/**
 * Fetch a single user's public items AND public styles in one round-trip.
 *
 * @param {string} userId
 * @returns {Promise<{ items: Object[], styles: Object[] }>}
 */
export async function fetchSellerContent(userId) {
  const [itemsRes, stylesRes] = await Promise.all([
    supabase
      .from("clothing_items")
      .select("*")
      .eq("user_id", userId)
      .eq("is_public", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("styles")
      .select("*")
      .eq("user_id", userId)
      .eq("is_public", true)
      .order("created_at", { ascending: false }),
  ]);

  return {
    items:  itemsRes.data  ?? [],
    styles: stylesRes.data ?? [],
  };
}
