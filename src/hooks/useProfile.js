/**
 * useProfile.js
 *
 * React hook — loads a user's profile from Supabase and exposes
 * helpers to update fields and replace the avatar.
 *
 * Usage:
 *   const { profile, loading, updateProfile, updateAvatar } = useProfile(user?.id);
 */

import { useState, useEffect, useCallback } from "react";
import {
  fetchProfile,
  ensureProfile,
  updateProfile  as updateProfileInDb,
  uploadAvatar,
} from "../services/profileService.js";

/**
 * @param {string|null} userId — from useAuth()
 * @returns {{
 *   profile:       Object|null,
 *   loading:       boolean,
 *   error:         Error|null,
 *   refresh:       () => void,
 *   updateProfile: (patch: Object) => Promise<{ error }>,
 *   updateAvatar:  (dataUrl: string) => Promise<{ url, error }>,
 * }}
 */
export function useProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (!userId) { setProfile(null); return; }
    setLoading(true);
    setError(null);
    const { profile: data, error: err } = await fetchProfile(userId);

    if (err) {
      // PGRST116 = "no rows returned" — profile row is missing.
      // This happens when the DB trigger on auth.users insert didn't fire,
      // or when the user pre-dates the trigger. Create a minimal row now.
      if (err.code === "PGRST116") {
        const { profile: created, error: createErr } = await ensureProfile(userId);
        setLoading(false);
        if (createErr) setError(createErr);
        else { setError(null); setProfile(created); }
      } else {
        setLoading(false);
        setError(err);
      }
    } else {
      setLoading(false);
      setProfile(data);
    }
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  // ── Update fields ──────────────────────────────────────────────────────────
  const updateProfile = useCallback(async (patch) => {
    if (!userId) return { error: new Error("Not authenticated") };
    const { profile: updated, error: err } = await updateProfileInDb(userId, patch);
    if (!err && updated) setProfile(updated);
    return { profile: updated, error: err };
  }, [userId]);

  // ── Upload avatar + save URL ───────────────────────────────────────────────
  const updateAvatar = useCallback(async (dataUrl) => {
    if (!userId) return { url: null, error: new Error("Not authenticated") };

    const { url, error: uploadErr } = await uploadAvatar(userId, dataUrl);
    if (uploadErr) return { url: null, error: uploadErr };

    // Persist the new URL in the profiles row
    const { error: updateErr } = await updateProfileInDb(userId, { avatar_url: url });
    if (!updateErr) setProfile((prev) => prev ? { ...prev, avatar_url: url } : prev);

    return { url, error: updateErr };
  }, [userId]);

  return { profile, loading, error, refresh, updateProfile, updateAvatar };
}
