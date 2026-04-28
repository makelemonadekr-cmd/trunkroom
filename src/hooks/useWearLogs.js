/**
 * useWearLogs.js
 *
 * React hook — loads wear logs for the current user from Supabase and
 * exposes save / delete helpers.
 *
 * The `history` value is kept in the same shape that RecordPage expects:
 *   { [dateStr: "YYYY-MM-DD"]: { itemIds, note, photoUrl, updatedAt } }
 * so the rest of RecordPage's rendering code works without changes.
 *
 * Usage:
 *   const { history, stats, loading, saveLog, removeLog } = useWearLogs(user?.id);
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchWearLogs, upsertWearLog, deleteWearLog } from "../services/wearLogsService.js";

// ── Local date string (avoids UTC off-by-one) ─────────────────────────────────
export function localDateStr(d) {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function todayStr() {
  return localDateStr(new Date());
}

/**
 * Returns a Map<itemId, wearCount> from the history map.
 * Replaces the old localStorage-based getItemWearFrequency().
 */
export function getItemWearFrequency(history = {}) {
  const freq = new Map();
  Object.values(history).forEach(({ itemIds = [] }) => {
    itemIds.forEach((id) => freq.set(id, (freq.get(id) ?? 0) + 1));
  });
  return freq;
}

/**
 * Returns a Map<itemId, lastWornDateStr> from the history map.
 * Replaces the old localStorage-based getItemLastWornDates().
 */
export function getItemLastWornDates(history = {}) {
  const last = new Map();
  Object.keys(history)
    .sort()
    .forEach((dateStr) => {
      (history[dateStr]?.itemIds ?? []).forEach((id) => last.set(id, dateStr));
    });
  return last;
}

// ── Convert DB rows → history map ─────────────────────────────────────────────
function buildHistory(rows) {
  const h = {};
  rows.forEach((row) => {
    h[row.date_str] = {
      itemIds:   row.item_ids  ?? [],
      note:      row.note      ?? "",
      photoUrl:  row.photo_url ?? null,
      updatedAt: row.updated_at,
    };
  });
  return h;
}

// ── Compute stats from history ────────────────────────────────────────────────
function computeStats(history) {
  const dates     = Object.keys(history).sort();
  const totalDays  = dates.length;
  const totalItems = dates.reduce((s, d) => s + (history[d]?.itemIds?.length ?? 0), 0);

  // Streak: consecutive days going backwards from today
  const base = new Date();
  base.setHours(12, 0, 0, 0);
  let streak = 0;
  for (let offset = 0; offset < 365; offset++) {
    const d   = new Date(base);
    d.setDate(d.getDate() - offset);
    const key = localDateStr(d);
    if (history[key])      streak++;
    else if (offset === 0) { /* today not yet recorded */ }
    else                   break;
  }

  return { totalDays, totalItems, streak };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @param {string|null} userId — from useAuth()
 * @returns {{
 *   history:   Object,          // { [dateStr]: { itemIds, note, photoUrl } }
 *   stats:     { totalDays, totalItems, streak },
 *   loading:   boolean,
 *   error:     Error|null,
 *   saveLog:   (dateStr, record) => Promise<{ error }>,
 *   removeLog: (dateStr) => Promise<{ error }>,
 *   refresh:   () => void,
 * }}
 */
export function useWearLogs(userId) {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // Derived from rows
  const history = useMemo(() => buildHistory(rows), [rows]);
  const stats   = useMemo(() => computeStats(history), [history]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (!userId) { setRows([]); return; }
    setLoading(true);
    setError(null);
    const { logs, error: err } = await fetchWearLogs(userId);
    setLoading(false);
    if (err) {
      setError(err);
      console.warn("[useWearLogs] fetch error:", err.message);
    } else {
      setRows(logs);
    }
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  // ── Save (upsert) ──────────────────────────────────────────────────────────
  const saveLog = useCallback(async (dateStr, record) => {
    if (!userId) return { error: new Error("Not authenticated") };

    const { log, error: err } = await upsertWearLog(userId, dateStr, record);
    if (!err) {
      // Optimistic update — replace or add the row
      setRows((prev) => {
        const idx = prev.findIndex((r) => r.date_str === dateStr);
        if (idx >= 0) {
          const next = [...prev];
          next[idx]  = log;
          return next;
        }
        return [log, ...prev];
      });
    }
    return { error: err };
  }, [userId]);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const removeLog = useCallback(async (dateStr) => {
    if (!userId) return { error: new Error("Not authenticated") };

    const { error: err } = await deleteWearLog(userId, dateStr);
    if (!err) {
      setRows((prev) => prev.filter((r) => r.date_str !== dateStr));
    }
    return { error: err };
  }, [userId]);

  return { history, stats, loading, error, saveLog, removeLog, refresh };
}
