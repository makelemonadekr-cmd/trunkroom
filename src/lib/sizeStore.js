/**
 * sizeStore.js
 *
 * localStorage-backed store for the user's size profile.
 * Key: "trunkroom_size_v1"
 *
 * A profile is considered "set" when at least one meaningful field is non-empty.
 */

const KEY = "trunkroom_size_v1";

export const DEFAULT_SIZE_PROFILE = {
  // Gender context — affects which conversion tables are used
  gender: "여성",        // "여성" | "남성"

  // ── Body measurements (all in cm unless noted) ──
  height: "",          // cm
  weight: "",          // kg
  chest: "",           // cm  (bust for women)
  waist: "",           // cm
  hips: "",            // cm
  shoulderWidth: "",   // cm  (optional)
  inseam: "",          // cm  (optional)

  // ── Clothing sizes ──
  // Women KR: "44"|"55"|"66"|"77"|"88"|"99"|"110"
  // Men   KR: "85"|"90"|"95"|"100"|"105"|"110"|"115"
  topSize: "",

  // Women: "44"|"55"|"66"|"77"|"88"|"99"  (mapped to waistRange)
  // Men:   "28"|"29"|"30"|"32"|"34"|"36"  (waist in inches)
  bottomSize: "",

  dressSize: "",       // free text (optional)
  braSize: "",         // free text e.g. "75B" (optional, women)

  // ── Shoe size ──
  shoeSize: "",        // KR mm: "220"|"225"|...|"295"|"300"
  shoeWidth: "",       // "보통" | "넓음 (와이드)" | "좁음"
  shoeFitPref: "",     // "정사이즈" | "반 사이즈 크게" | "반 사이즈 작게"

  // ── Fit preferences ──
  topFitPref: "",      // "슬림핏" | "레귤러핏" | "릴렉스드핏" | "오버사이즈"
  bottomFitPref: "",   // "슬림핏" | "레귤러핏" | "와이드핏"

  // ── Notes ──
  notes: "",

  // ── Meta ──
  updatedAt: null,     // ISO string
};

// ─── Read ─────────────────────────────────────────────────────────────────────

export function getSizeProfile() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SIZE_PROFILE, ...parsed };
  } catch {
    return null;
  }
}

// ─── Write ────────────────────────────────────────────────────────────────────

export function saveSizeProfile(profile) {
  try {
    const toSave = { ...profile, updatedAt: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(toSave));
    return toSave;
  } catch (e) {
    console.warn("sizeStore: save failed", e);
    return profile;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true when at least one meaningful size field has been entered. */
export function hasSizeProfile() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const p = JSON.parse(raw);
    return !!(
      p.height ||
      p.chest  ||
      p.waist  ||
      p.topSize ||
      p.bottomSize ||
      p.shoeSize
    );
  } catch {
    return false;
  }
}

export function clearSizeProfile() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
