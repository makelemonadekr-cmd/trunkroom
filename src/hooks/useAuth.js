/**
 * useAuth.js
 *
 * Global auth state hook.
 * Reads the current Supabase session on mount, then listens for changes.
 *
 * Usage:
 *   const { user, loading } = useAuth()
 *   if (loading) return <Spinner />
 *   if (!user)   return <LoginScreen />
 */

import { useState, useEffect } from "react";
import { getSession, onAuthChange } from "../services/authService";

export function useAuth() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from Supabase's built-in localStorage persistence
    getSession().then(({ session }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for sign-in / sign-out / token refresh events
    const unsub = onAuthChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return unsub; // cleanup on unmount
  }, []);

  return { user, loading };
}
