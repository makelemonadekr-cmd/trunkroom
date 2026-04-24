/**
 * authService.js
 *
 * All Supabase Auth operations.
 * Import these functions instead of calling supabase.auth directly from components.
 *
 * All functions return { data, error } matching Supabase conventions.
 */

import { supabase } from "../lib/supabase";

// ─── Sign Up ─────────────────────────────────────────────────────────────────

/**
 * Create a new account with email + password.
 * Supabase will send a confirmation email.
 * The `profiles` row is auto-created by a DB trigger on auth.users insert.
 *
 * @param {string} email
 * @param {string} password
 * @param {string} displayName  — shown in the UI (stored in user metadata)
 * @returns {Promise<{ data, error }>}
 */
export async function signUp(email, password, displayName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        username: email.split("@")[0],  // default username from email
      },
    },
  });
  return { data, error };
}

// ─── Sign In ─────────────────────────────────────────────────────────────────

/**
 * Sign in with email + password.
 * Returns a session on success.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ data, error }>}
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

/**
 * Sign out the current user.
 * Clears the session from Supabase's localStorage storage.
 *
 * @returns {Promise<{ error }>}
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// ─── Session ─────────────────────────────────────────────────────────────────

/**
 * Get the current active session (if any).
 * Call this on app load to restore auth state.
 *
 * @returns {Promise<{ session, error }>}
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data?.session ?? null, error };
}

/**
 * Get the currently signed-in user object.
 *
 * @returns {Promise<{ user, error }>}
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user ?? null, error };
}

// ─── Auth State Listener ──────────────────────────────────────────────────────

/**
 * Subscribe to auth state changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED).
 * Returns an unsubscribe function — call it in useEffect cleanup.
 *
 * @param {(event: string, session: object|null) => void} callback
 * @returns {() => void}  unsubscribe function
 *
 * @example
 * useEffect(() => {
 *   const unsub = onAuthChange((event, session) => {
 *     setUser(session?.user ?? null)
 *   })
 *   return unsub
 * }, [])
 */
export function onAuthChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
}
