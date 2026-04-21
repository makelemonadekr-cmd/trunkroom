/**
 * closetStore.js
 *
 * localStorage-backed closet item store.
 * On first load, seeds with the mock data so the app feels populated.
 * New items added via addClosetItem() are prepended and persisted.
 */

import { CLOSET_ITEMS } from "../constants/mockClosetData.js";

const STORAGE_KEY = "trunkroom_closet_v1";

// ─── Internal helpers ─────────────────────────────────────────────────────────

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupt data — fall through to seed */ }
  return null;
}

function save(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn("[closetStore] failed to persist:", err.message);
  }
}

function seed() {
  save(CLOSET_ITEMS);
  return CLOSET_ITEMS;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Return all closet items.
 * Seeds from mock data on first call.
 *
 * @returns {ClosetItem[]}
 */
export function getClosetItems() {
  const stored = load();
  if (stored) return stored;
  return seed();
}

/**
 * Prepend a new item and persist.
 *
 * @param {Partial<ClosetItem>} item — at minimum { id, name, image, category, subCategory }
 * @returns {ClosetItem[]} — updated full list
 */
export function addClosetItem(item) {
  const existing = getClosetItems();
  const updated  = [item, ...existing];
  save(updated);
  return updated;
}

/**
 * Update a single item by id.
 * No-op if item not found.
 *
 * @param {string|number} id
 * @param {Partial<ClosetItem>} patch
 * @returns {ClosetItem[]}
 */
export function updateClosetItem(id, patch) {
  const existing = getClosetItems();
  const updated  = existing.map((item) =>
    String(item.id) === String(id) ? { ...item, ...patch } : item
  );
  save(updated);
  return updated;
}

/**
 * Get items filtered by main category label (e.g. "상의").
 * Returns all items if category is falsy or "전체".
 *
 * @param {string} category
 * @returns {ClosetItem[]}
 */
export function getByCategory(category) {
  const all = getClosetItems();
  if (!category || category === "전체") return all;
  return all.filter((item) => item.category === category);
}

/**
 * Get items filtered by subcategory label (e.g. "청바지").
 *
 * @param {string} subCategory
 * @returns {ClosetItem[]}
 */
export function getBySubCategory(subCategory) {
  const all = getClosetItems();
  return all.filter((item) => item.subCategory === subCategory);
}

/**
 * Reset to the seeded mock data (useful for development).
 */
export function resetToMockData() {
  return seed();
}
