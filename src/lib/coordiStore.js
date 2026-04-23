/**
 * coordiStore.js
 *
 * localStorage-backed store for saved coordis.
 */

const KEY = "trunkroom_coordi";

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("coordiStore: failed to save", e);
  }
}

export function getAllCoordi() {
  return readAll().slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export function getCoordiById(id) {
  return readAll().find((c) => c.id === id) || null;
}

export function saveCoordi(coordi) {
  if (!coordi || !coordi.id) return;
  const all = readAll();
  const idx = all.findIndex((c) => c.id === coordi.id);
  if (idx >= 0) all[idx] = coordi;
  else all.push(coordi);
  writeAll(all);
  return coordi;
}

export function deleteCoordi(id) {
  const all = readAll().filter((c) => c.id !== id);
  writeAll(all);
}

export function clearAllCoordi() {
  writeAll([]);
}
