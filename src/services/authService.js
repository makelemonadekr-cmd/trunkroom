/**
 * authService.js
 *
 * All Supabase Auth operations.
 * Import these functions instead of calling supabase.auth directly from components.
 *
 * All functions return { data, error } matching Supabase conventions.
 */

import { supabase }       from "../lib/supabase.js";
import { ensureProfile }  from "./profileService.js";

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

  // When email confirmation is disabled, Supabase returns a session immediately.
  // Create the profiles row right away so the app can read it without hitting PGRST116.
  // (The DB trigger handles this too; ensureProfile is a belt-and-suspenders fallback.)
  if (!error && data?.session && data?.user) {
    await ensureProfile(data.user.id, displayName || null);
  }

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

// ─── Password Reset ───────────────────────────────────────────────────────────

/**
 * Send a password-reset email.
 * After clicking the link, the user lands on the app with a recovery session
 * — useAuth will fire PASSWORD_RECOVERY and surface isPasswordRecovery = true.
 *
 * @param {string} email
 * @returns {Promise<{ data, error }>}
 */
export async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
  });
  return { data, error };
}

/**
 * Update the current user's password.
 * Must be called while an active session (or PASSWORD_RECOVERY session) exists.
 *
 * @param {string} newPassword
 * @returns {Promise<{ data, error }>}
 */
export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  return { data, error };
}

/**
 * Update the current user's email.
 * Supabase sends a confirmation link to the new address.
 * The change only takes effect after the link is clicked.
 *
 * @param {string} newEmail
 * @returns {Promise<{ data, error }>}
 */
export async function updateEmail(newEmail) {
  const { data, error } = await supabase.auth.updateUser({ email: newEmail });
  return { data, error };
}

// ─── Account Deletion ─────────────────────────────────────────────────────────

/**
 * Permanently delete the current user's account and all associated data.
 * Invokes the `delete-account` Supabase Edge Function which runs with service_role.
 *
 * @returns {Promise<{ data, error }>}
 */
export async function deleteAccount() {
  const { data, error } = await supabase.functions.invoke("delete-account");
  return { data, error };
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
