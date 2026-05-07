/**
 * moderationService.js
 *
 * Reports + blocks (App Store UGC compliance).
 * Use directly from sheets — no hook layer needed for one-shot writes.
 */

import { supabase } from "../lib/supabase.js";

// ─── Reports ──────────────────────────────────────────────────────────────────

/**
 * Submit a report against a piece of content.
 * @param {Object} params
 * @param {string} params.reporterId
 * @param {"style"|"item"|"profile"|"comment"} params.targetType
 * @param {string} params.targetId
 * @param {string} params.reason — free text (1-500 chars)
 * @param {"spam"|"harassment"|"sexual_content"|"hate_speech"|"violence"|"misinformation"|"intellectual_property"|"other"} [params.reasonCategory]
 */
export async function submitReport({ reporterId, targetType, targetId, reason, reasonCategory = "other" }) {
  if (!reporterId || !targetType || !targetId) {
    return { error: new Error("missing required fields") };
  }
  const trimmed = String(reason ?? "").trim().slice(0, 500);
  if (!trimmed) return { error: new Error("reason required") };

  const { error } = await supabase.from("reports").insert({
    reporter_id:     reporterId,
    target_type:     targetType,
    target_id:       String(targetId),
    reason:          trimmed,
    reason_category: reasonCategory,
  });
  return { error };
}

// ─── Blocks ───────────────────────────────────────────────────────────────────

/** List user IDs the current user has blocked. */
export async function fetchBlockedIds(userId) {
  if (!userId) return { ids: [], error: null };
  const { data, error } = await supabase
    .from("blocks")
    .select("blocked_id")
    .eq("blocker_id", userId);
  return { ids: (data ?? []).map((r) => r.blocked_id), error };
}

/** Block a user. */
export async function blockUser(blockerId, blockedId) {
  if (!blockerId || !blockedId) return { error: new Error("missing ids") };
  if (blockerId === blockedId) return { error: new Error("cannot block self") };
  const { error } = await supabase
    .from("blocks")
    .insert({ blocker_id: blockerId, blocked_id: blockedId });
  // ignore unique-violation (already blocked)
  if (error && error.code === "23505") return { error: null };
  return { error };
}

/** Unblock a user. */
export async function unblockUser(blockerId, blockedId) {
  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
  return { error };
}

/** Check if a single user is blocked. */
export async function isBlocked(blockerId, blockedId) {
  if (!blockerId || !blockedId) return false;
  const { data } = await supabase
    .from("blocks")
    .select("id")
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId)
    .maybeSingle();
  return Boolean(data);
}
