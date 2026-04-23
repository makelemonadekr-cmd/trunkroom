// ─── Laundry / Wash History Store ─────────────────────────────────────────────
//
// Per-item wash tracking. Records the last date each item was washed.
// Wear counts since last wash are derived dynamically from wearHistoryStore
// to avoid duplication of truth.
//
// Schema:  { [itemId: string]: { lastWashedAt: "YYYY-MM-DD" | null } }
//
// Laundry status levels:
//   0 wears  → clean
//   1 wear   → worn once
//   2 wears  → worn twice
//   3+ wears → 세탁 필요 (needs washing)
//
// Category-specific thresholds are future work. For now: universal = 3 wears.

import { getAllWearHistory, localDateStr } from "./wearHistoryStore";

const KEY      = "trunkroom_laundry_v1";
const SEED_KEY = "trunkroom_laundry_seeded_v1";

// ─── I/O ──────────────────────────────────────────────────────────────────────

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Record that an item was washed today. */
export function markWashed(itemId) {
  const data = load();
  data[itemId] = { lastWashedAt: localDateStr(new Date()) };
  save(data);
}

/** Returns YYYY-MM-DD of last wash, or null if never recorded. */
export function getLastWashedAt(itemId) {
  return load()[itemId]?.lastWashedAt ?? null;
}

/**
 * Compute how many times an item was worn since it was last washed.
 * Derived from wearHistoryStore — no double-writes.
 */
export function getWearsSinceWash(itemId) {
  const lastWashedAt  = getLastWashedAt(itemId);
  const history       = getAllWearHistory();

  return Object.entries(history)
    .filter(([dateStr]) => !lastWashedAt || dateStr > lastWashedAt)
    .filter(([, record]) => (record.itemIds ?? []).includes(itemId))
    .length;
}

/**
 * Returns the laundry status label for display.
 *   0 → "깨끗함"
 *   1 → "착용 1회"
 *   2 → "착용 2회 · 주의"
 *   3+ → "세탁 필요"
 */
export function getLaundryStatus(itemId) {
  const wears = getWearsSinceWash(itemId);
  if (wears === 0) return { level: 0, label: "깨끗함",      color: "#4CAF50" };
  if (wears === 1) return { level: 1, label: "착용 1회",    color: "#AAAAAA" };
  if (wears === 2) return { level: 2, label: "착용 2회",    color: "#F5A623" };
  return             { level: 3, label: "세탁 필요",      color: "#E84040" };
}

/**
 * Returns a list of items that need washing.
 * Each entry: { itemId, wearsSinceWash, lastWashedAt }
 * Sorted by wearsSinceWash descending.
 */
export function getItemsNeedingWash(threshold = 3) {
  const history = getAllWearHistory();
  const store   = load();

  // Gather all item IDs that appear in any wear record
  const trackedIds = new Set(
    Object.values(history).flatMap((r) => r.itemIds ?? [])
  );

  return Array.from(trackedIds)
    .map((itemId) => ({
      itemId,
      wearsSinceWash: getWearsSinceWash(itemId),
      lastWashedAt:   store[itemId]?.lastWashedAt ?? null,
    }))
    .filter((d) => d.wearsSinceWash >= threshold)
    .sort((a, b) => b.wearsSinceWash - a.wearsSinceWash);
}

/** Bulk read — returns the raw store for display pages. */
export function getAllLaundryData() {
  return load();
}

// ─── Seed demo data ───────────────────────────────────────────────────────────
// Gives the laundry section realistic data on first launch.
// item-1, item-11, item-3: not washed recently → "세탁 필요" (3+ wears since)
// item-6, item-22: washed ~6 days ago → "착용 2회 · 주의" range
// item-15, item-28: washed recently → "깨끗함" / "착용 1회"

function maybeSeed() {
  if (localStorage.getItem(SEED_KEY)) return;

  const base = new Date();
  base.setHours(12, 0, 0, 0);

  const daysAgo = (n) => {
    const d = new Date(base);
    d.setDate(d.getDate() - n);
    return localDateStr(d);
  };

  const seedData = {
    "item-1":  { lastWashedAt: daysAgo(8)  },  // worn offsets 0,1,5 since → 3 wears → 세탁 필요
    "item-11": { lastWashedAt: daysAgo(12) },  // worn offsets 2,7,9 since → 3 wears → 세탁 필요
    "item-3":  { lastWashedAt: daysAgo(16) },  // worn offset 4,11 since → 세탁 필요
    "item-6":  { lastWashedAt: daysAgo(4)  },  // worn offset 0,5 since → 2 wears → 주의
    "item-22": { lastWashedAt: daysAgo(5)  },  // worn offset 4,8 → 주의
    "item-15": { lastWashedAt: daysAgo(2)  },  // worn offset 1 since → 1 wear
    "item-28": { lastWashedAt: daysAgo(1)  },  // clean
    "item-2":  { lastWashedAt: daysAgo(10) },  // worn offset 2,8,13 → 세탁 필요
    "item-30": { lastWashedAt: daysAgo(7)  },  // worn offset 5,7 → 2 wears → 주의
  };

  save(seedData);
  localStorage.setItem(SEED_KEY, "1");
}

maybeSeed();
