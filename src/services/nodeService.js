/**
 * nodeService.js
 *
 * Supabase reads for the O2O physical layer: nodes (PULDA STAY spaces),
 * their lockers, and the rental inventory that lives at a node.
 *
 * Rental inventory is NOT a new table — it is clothing_items rows with
 * owner_type = 'rental_inventory'. That is the whole point of migration 011:
 * the closet, the rental catalog, and the resale stock share one table, so
 * ClosetPage / FilterChips / aiService all keep working unchanged.
 *
 * All functions return { data, error } — callers handle errors.
 */

import { supabase } from "../lib/supabase.js";

// ─── Nodes ──────────────────────────────────────────────────────────────────

/**
 * List active nodes (spaces) the guest/user can pick.
 * @returns {Promise<{ nodes: Object[], error: Error|null }>}
 */
export async function fetchNodes() {
  const { data, error } = await supabase
    .from("nodes")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) return { nodes: [], error };
  return { nodes: data ?? [], error: null };
}

// ─── Lockers ────────────────────────────────────────────────────────────────

/**
 * Find one free locker at a node (for assigning a pickup slot).
 * @param {string} nodeId
 * @returns {Promise<{ locker: Object|null, error: Error|null }>}
 */
export async function findFreeLocker(nodeId) {
  const { data, error } = await supabase
    .from("lockers")
    .select("*")
    .eq("node_id", nodeId)
    .eq("status", "free")
    .limit(1)
    .maybeSingle();

  if (error) return { locker: null, error };
  return { locker: data ?? null, error: null };
}

/**
 * Set a locker's status ('reserved' | 'occupied' | 'free' | 'maintenance').
 * @param {string} lockerId
 * @param {string} status
 */
export async function setLockerStatus(lockerId, status) {
  const { data, error } = await supabase
    .from("lockers")
    .update({ status })
    .eq("id", lockerId)
    .select()
    .maybeSingle();

  return { locker: data ?? null, error };
}

// ─── Rental inventory (reuses clothing_items via owner_type) ──────────────────

/**
 * Fetch a node's rentable garments — i.e. clothing_items where
 * owner_type = 'rental_inventory' and rental_price is set.
 * The AI stylist (aiService) draws from exactly this list to stage looks.
 *
 * @param {string} nodeId
 * @param {Object} [opts]
 * @param {string[]} [opts.styleTags]  — optional filter by mood/style
 * @returns {Promise<{ items: Object[], error: Error|null }>}
 */
export async function fetchRentalInventory(nodeId, opts = {}) {
  let query = supabase
    .from("clothing_items")
    .select("*")
    .eq("owner_type", "rental_inventory")
    .eq("node_id", nodeId)
    .not("rental_price", "is", null)
    .in("custody", ["in_storage", "in_locker", "home"]); // available, not rented_out/sold

  if (opts.styleTags?.length) {
    // style_tags is a text[] column — overlaps() = "shares any tag"
    query = query.overlaps("style_tags", opts.styleTags);
  }

  const { data, error } = await query.order("times_rented", { ascending: true });
  if (error) return { items: [], error };
  return { items: data ?? [], error: null };
}
