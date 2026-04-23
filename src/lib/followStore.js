/**
 * followStore.js
 *
 * localStorage-backed follow state for seller profiles.
 * Schema: { [sellerId]: true }  (only followed ids are stored)
 *
 * Usage:
 *   import { isFollowing, toggleFollow, getFollowedSellerIds } from "../lib/followStore";
 */

const KEY = "trunkroom_follow_v1";

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("[followStore] persist failed:", err.message);
  }
}

/** @returns {boolean} */
export function isFollowing(sellerId) {
  return !!load()[String(sellerId)];
}

/**
 * Toggle follow state for a seller.
 * @returns {{ following: boolean }}
 */
export function toggleFollow(sellerId) {
  const state = load();
  const id = String(sellerId);
  const following = !state[id];
  if (following) {
    state[id] = true;
  } else {
    delete state[id];
  }
  save(state);
  return { following };
}

/** @returns {string[]} array of followed seller ids */
export function getFollowedSellerIds() {
  return Object.keys(load());
}

/** @returns {number} */
export function getFollowedCount() {
  return Object.keys(load()).length;
}
