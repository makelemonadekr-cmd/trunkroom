/**
 * useCloset.js
 *
 * React hook — loads the current user's clothing items from Supabase and
 * exposes a refresh callback so callers can re-fetch after mutations.
 *
 * Returns items in DB shape (snake_case).  ClosetPage normalises field names
 * to camelCase before passing them to UI components.
 *
 * Usage:
 *   const { items, loading, error, refresh } = useCloset(user?.id);
 */

import { useState, useEffect, useCallback } from "react";
import { fetchClosetItems } from "../services/closetService.js";

// ── snake_case → camelCase normalizer ─────────────────────────────────────────
// Keep snake_case fields too (spread ...row) so any consumer reading either case
// still works. Page-level normalizers can re-map on top without harm.
function normalizeRow(row) {
  if (!row) return null;
  return {
    ...row,
    displayName:  row.display_name  ?? row.displayName  ?? row.name,
    mainCategory: row.main_category ?? row.mainCategory,
    subCategory:  row.sub_category  ?? row.subCategory,
    image:        row.image_url     ?? row.image,
    isForSale:    row.is_for_sale   ?? row.isForSale,
    styleTags:    row.style_tags    ?? row.styleTags ?? [],
  };
}

/**
 * @param {string|null} userId — from useAuth()
 * @returns {{
 *   items:   Object[],
 *   loading: boolean,
 *   error:   Error|null,
 *   refresh: () => void,
 * }}
 */
export function useCloset(userId) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const refresh = useCallback(async () => {
    if (!userId) { setItems([]); return; }

    setLoading(true);
    setError(null);

    const { items: fetched, error: err } = await fetchClosetItems(userId);

    setLoading(false);

    if (err) {
      setError(err);
      console.warn("[useCloset] fetch error:", err.message);
    } else {
      setItems((fetched ?? []).map(normalizeRow).filter(Boolean));
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}
