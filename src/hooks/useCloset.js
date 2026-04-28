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
      setItems(fetched);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}
