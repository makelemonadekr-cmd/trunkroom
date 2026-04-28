/**
 * useStyles.js
 *
 * React hook — loads saved stylebook entries from Supabase and exposes
 * a delete helper.
 *
 * Returns styles normalised to the shape that RecordPage UI expects
 * (camelCase aliases that mirror the old localStorage coordi shape).
 *
 * Usage:
 *   const { styles, loading, removeStyle, refresh } = useStyles(user?.id);
 */

import { useState, useEffect, useCallback } from "react";
import { fetchStyles, deleteStyle } from "../services/stylesService.js";

// ── Normalise a Supabase styles row → UI coordi shape ─────────────────────────
function normalizeStyleRow(dbStyle) {
  return {
    ...dbStyle,
    // camelCase aliases
    dateStr:         dbStyle.date_str,
    photoUrl:        dbStyle.background_url ?? null,   // DB column is background_url
    thumbnail:       dbStyle.background_url ?? null,
    isPublic:        dbStyle.is_public,
    templateId:      dbStyle.template_id,
    bgColor:         "#F5F5F5",   // no bg_color column in DB — use constant default
    // item IDs from the joined style_items array
    itemIds:         (dbStyle.style_items ?? [])
                       .map((si) => si.clothing_item_id)
                       .filter(Boolean),
    // full item objects — image + name carried from style_items.item_image_url / item_name
    // populated when saved via StylebookCreatorSheet (which writes imageUrl + name)
    items:           (dbStyle.style_items ?? [])
                       .map((si) => ({
                         id:        si.clothing_item_id,
                         image:     si.item_image_url ?? null,
                         image_url: si.item_image_url ?? null,
                         name:      si.item_name      ?? null,
                       }))
                       .filter((it) => it.id),
    customMood:      dbStyle.custom_mood ?? null,   // personal # tags
    extractedColors: [],
    updatedAt:       dbStyle.updated_at,
  };
}

/**
 * @param {string|null} userId
 * @returns {{
 *   styles:      Object[],
 *   loading:     boolean,
 *   error:       Error|null,
 *   refresh:     () => void,
 *   removeStyle: (id: string) => Promise<{ error }>,
 * }}
 */
export function useStyles(userId) {
  const [styles,  setStyles]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const refresh = useCallback(async () => {
    if (!userId) { setStyles([]); return; }
    setLoading(true);
    setError(null);
    const { styles: fetched, error: err } = await fetchStyles(userId);
    setLoading(false);
    if (err) {
      setError(err);
      console.warn("[useStyles] fetch error:", err.message);
    } else {
      setStyles(fetched.map(normalizeStyleRow));
    }
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const removeStyle = useCallback(async (styleId) => {
    const { error: err } = await deleteStyle(styleId);
    if (!err) setStyles((prev) => prev.filter((s) => s.id !== styleId));
    return { error: err };
  }, []);

  return { styles, loading, error, refresh, removeStyle };
}
