/**
 * closetStore.js
 *
 * localStorage-backed closet item store (legacy — used by WeatherDetailScreen).
 * No longer seeds from mock data. Real data flows through useCloset(userId) → Supabase.
 * v2 key bump flushes any localStorage caches that contained mock seed data.
 */

const STORAGE_KEY = "trunkroom_closet_v2";

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupt — fall through */ }
  return null;
}

function save(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn("[closetStore] failed to persist:", err.message);
  }
}

export function getClosetItems() {
  return load() ?? [];
}

export function addClosetItem(item) {
  const updated = [item, ...getClosetItems()];
  save(updated);
  return updated;
}

export function updateClosetItem(id, patch) {
  const updated = getClosetItems().map((item) =>
    String(item.id) === String(id) ? { ...item, ...patch } : item
  );
  save(updated);
  return updated;
}

export function getByCategory(category) {
  const all = getClosetItems();
  if (!category || category === "전체") return all;
  return all.filter((item) => item.category === category);
}

export function getBySubCategory(subCategory) {
  return getClosetItems().filter((item) => item.subCategory === subCategory);
}

/** Sync the store with an authoritative list (e.g. fetched from Supabase). */
export function syncClosetItems(items) {
  save(Array.isArray(items) ? items : []);
  return getClosetItems();
}

/** Clear local cache. */
export function clearClosetCache() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

/** Deprecated — kept for backward compat; now a no-op clear. */
export function resetToMockData() {
  clearClosetCache();
  return [];
}
