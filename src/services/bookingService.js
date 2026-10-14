/**
 * bookingService.js
 *
 * Supabase CRUD for the O2O booking flow shown in the traveler prototype:
 *   app input → AI look (an outfit) → reserve → locker pickup → return / buy / ship.
 *
 * A rental "look set" is just an OutfitRecord (existing `outfits` table) whose
 * itemIds point to rental_inventory clothing_items. So creating a booking reuses
 * the outfit the AI already built — no new "outfit" concept is introduced.
 *
 * The consignment path (guest/local leaves clothes to sell) is the same
 * Cleanout / SleepingMoney flow you already have: those items just get
 * owner_type flipped to 'consignment' and custody = 'in_storage'.
 *
 * All functions return { data, error } — callers handle errors.
 */

import { supabase }        from "../lib/supabase.js";
import { findFreeLocker, setLockerStatus } from "./nodeService.js";

const TABLE = "bookings";

// ─── Create ───────────────────────────────────────────────────────────────────

/**
 * Create a rental booking from an AI-staged look and reserve a locker.
 *
 * @param {Object} params
 * @param {string}   params.nodeId
 * @param {string|null} params.userId    — null for a walk-in guest
 * @param {string} [params.guestName]    — used when userId is null
 * @param {string} params.outfitId       — the AI look (outfits.id)
 * @param {string[]} params.itemIds       — rental_inventory item ids in the look
 * @param {number} params.amountKrw
 * @param {string} [params.startsAt]     — ISO
 * @param {string} [params.endsAt]       — ISO
 * @returns {Promise<{ booking: Object|null, locker: Object|null, error: Error|null }>}
 */
export async function createRentalBooking(params) {
  const { locker, error: lockErr } = await findFreeLocker(params.nodeId);
  if (lockErr) return { booking: null, locker: null, error: lockErr };

  const row = {
    node_id:    params.nodeId,
    user_id:    params.userId ?? null,
    guest_name: params.userId ? null : (params.guestName ?? "Guest"),
    kind:       "rental",
    outfit_id:  params.outfitId,
    locker_id:  locker?.id ?? null,
    status:     "reserved",
    amount_krw: params.amountKrw ?? 0,
    starts_at:  params.startsAt ?? null,
    ends_at:    params.endsAt ?? null,
  };

  const { data: booking, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select()
    .single();

  if (error) return { booking: null, locker, error };

  // link garments, mark them rented, and reserve the locker (best-effort)
  await linkBookingItems(booking.id, params.itemIds);
  await setItemsCustody(params.itemIds, "rented_out");
  if (locker?.id) await setLockerStatus(locker.id, "reserved");

  return { booking, locker, error: null };
}

/**
 * Create a storage / luggage booking (guest bag or local off-season box).
 * @param {Object} params  — { nodeId, userId, kind: 'storage'|'luggage', amountKrw, endsAt }
 */
export async function createStorageBooking(params) {
  const row = {
    node_id:    params.nodeId,
    user_id:    params.userId ?? null,
    guest_name: params.userId ? null : (params.guestName ?? "Guest"),
    kind:       params.kind ?? "storage",
    status:     "reserved",
    amount_krw: params.amountKrw ?? 0,
    ends_at:    params.endsAt ?? null,
  };
  const { data, error } = await supabase.from(TABLE).insert(row).select().single();
  return { booking: data ?? null, error };
}

// ─── Transitions ───────────────────────────────────────────────────────────────

/**
 * Guest checks in and opens the locker.
 * @param {string} bookingId
 */
export async function markPickedUp(bookingId) {
  const { data, error } = await supabase
    .from(TABLE).update({ status: "picked_up" }).eq("id", bookingId).select().single();
  if (!error && data?.locker_id) await setLockerStatus(data.locker_id, "occupied");
  return { booking: data ?? null, error };
}

/**
 * Guest returns the rental (or buys it). On 'purchased', the garment converts
 * from rental_inventory to a sold record. On 'returned', it goes back to stock.
 * @param {string} bookingId
 * @param {'returned'|'purchased'} outcome
 * @param {string[]} itemIds
 */
export async function closeRental(bookingId, outcome, itemIds) {
  const { data: booking, error } = await supabase
    .from(TABLE).update({ status: outcome }).eq("id", bookingId).select().single();
  if (error) return { booking: null, error };

  await setItemsCustody(itemIds, outcome === "purchased" ? "sold" : "in_storage");
  if (booking?.locker_id) await setLockerStatus(booking.locker_id, "free");
  return { booking, error: null };
}

// ─── Reads ─────────────────────────────────────────────────────────────────────

/**
 * A customer's bookings, newest first.
 * @param {string} userId
 */
export async function fetchMyBookings(userId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*, lockers(label), nodes(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return { bookings: [], error };
  return { bookings: data ?? [], error: null };
}

// ─── Internal helpers ────────────────────────────────────────────────────────

async function linkBookingItems(bookingId, itemIds = []) {
  if (!itemIds.length) return { error: null };
  const rows = itemIds.map((item_id) => ({ booking_id: bookingId, item_id }));
  const { error } = await supabase.from("booking_items").insert(rows);
  if (error) console.warn("[bookingService] linkBookingItems failed:", error.message);
  return { error };
}

async function setItemsCustody(itemIds = [], custody) {
  if (!itemIds.length) return { error: null };
  const { error } = await supabase
    .from("clothing_items")
    .update({ custody })
    .in("id", itemIds);
  if (error) console.warn("[bookingService] setItemsCustody failed:", error.message);
  return { error };
}
