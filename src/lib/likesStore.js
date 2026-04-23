/**
 * likesStore.js
 *
 * Persists outfit like states across sessions.
 * Key: "trunkroom_likes_v1"
 *
 * Schema:
 *   { liked: { [id]: true }, counts: { [id]: number } }
 *
 * - liked:  set of outfit IDs the user has tapped ❤️
 * - counts: cached like counts (base + user's votes)
 *           stored so the count survives re-renders and page refreshes
 */

const KEY = "trunkroom_likes_v1";

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { liked: {}, counts: {} };
    return JSON.parse(raw);
  } catch {
    return { liked: {}, counts: {} };
  }
}

function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}

/** Returns true if the user has liked this outfit. */
export function isLiked(id) {
  return !!load().liked[String(id)];
}

/**
 * Returns the stored like count for an outfit.
 * Falls back to `baseLikes` if no stored count exists yet.
 */
export function getLikeCount(id, baseLikes = 0) {
  const stored = load().counts[String(id)];
  return stored !== undefined ? stored : baseLikes;
}

/**
 * Toggle the like state for an outfit and persist the result.
 * Returns { liked: boolean, count: number }.
 */
export function toggleLike(id, baseLikes = 0) {
  const data = load();
  const key  = String(id);
  const currentCount = data.counts[key] ?? baseLikes;

  if (data.liked[key]) {
    // Un-like
    delete data.liked[key];
    data.counts[key] = Math.max(0, currentCount - 1);
  } else {
    // Like
    data.liked[key]  = true;
    data.counts[key] = currentCount + 1;
  }

  save(data);
  return { liked: !!data.liked[key], count: data.counts[key] };
}

/** Clear all likes (dev / testing helper). */
export function clearAllLikes() {
  try { localStorage.removeItem(KEY); } catch {}
}
