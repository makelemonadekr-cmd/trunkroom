/**
 * useAuth.js
 *
 * Global auth state hook.
 * Reads the current Supabase session on mount, then listens for changes.
 *
 * Usage:
 *   const { user, loading, isPasswordRecovery, clearPasswordRecovery } = useAuth()
 *
 *   isPasswordRecovery — true when the user arrived via a password-reset email link.
 *   clearPasswordRecovery — call after the new password is saved to dismiss the reset UI.
 */

import { useState, useEffect, useCallback } from "react";
import { getSession, onAuthChange } from "../services/authService.js";

export function useAuth() {
  const [user,               setUser]               = useState(null);
  const [loading,            setLoading]            = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const clearPasswordRecovery = useCallback(() => setIsPasswordRecovery(false), []);

  useEffect(() => {
    // Restore session from Supabase's built-in localStorage persistence
    getSession().then(({ session }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for sign-in / sign-out / token refresh / password recovery events
    const unsub = onAuthChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      if (event === "PASSWORD_RECOVERY") {
        // User clicked the reset-password link in their email.
        // The session is active but flagged as recovery — show the new-password form.
        setIsPasswordRecovery(true);
      }

      if (event === "USER_UPDATED") {
        // Password was successfully changed — leave recovery mode.
        setIsPasswordRecovery(false);
      }
    });

    return unsub; // cleanup on unmount
  }, []);

  return { user, loading, isPasswordRecovery, clearPasswordRecovery };
}
