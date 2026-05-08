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

// ─── Sign in with Apple ───────────────────────────────────────────────────────

/**
 * Sign in with Apple — required by App Store Review Guideline 4.8.
 *
 * 1) Native iOS via @capacitor-community/apple-sign-in (preferred for App Store).
 *    Returns identity token → signInWithIdToken (no browser tab, no redirect).
 * 2) Browser fallback via supabase.auth.signInWithOAuth (Safari web flow).
 *
 * The native plugin is loaded dynamically so missing it doesn't break the build.
 *
 * @returns {Promise<{ data, error }>}
 */
export async function signInWithApple() {
  // Try native plugin when running inside Capacitor
  try {
    const corePkg = "@capacitor/core";
    const { Capacitor } = await import(/* @vite-ignore */ corePkg);
    if (Capacitor?.isNativePlatform?.()) {
      try {
        // Indirect string + @vite-ignore so Vite skips static analysis on optional pkg
        const pkgName = "@capacitor-community/apple-sign-in";
        const mod = await import(/* @vite-ignore */ pkgName);
        const { SignInWithApple } = mod;
        const servicesId = import.meta.env.VITE_APPLE_SERVICES_ID
                           || "com.makelemonade.trunkroom.signin";
        const redirectURI = import.meta.env.VITE_APPLE_REDIRECT_URI
                           || "https://makelemonade.app/auth/callback";
        const res = await SignInWithApple.authorize({
          clientId:    servicesId,
          redirectURI,
          scopes:      "email name",
        });
        const idToken = res?.response?.identityToken;
        if (!idToken) throw new Error("Apple identity token missing");

        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "apple",
          token: idToken,
        });
        return { data, error };
      } catch (pluginErr) {
        console.warn("[signInWithApple] native plugin failed, falling back to OAuth:", pluginErr?.message);
      }
    }
  } catch {
    // @capacitor/core not installed — use OAuth
  }

  // Browser / fallback path
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/` : undefined,
    },
  });
  return { data, error };
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

/**
 * Keys that hold per-user state in localStorage.
 * MUST be cleared on signOut so the next user on the same device starts fresh.
 */
const PER_USER_LOCAL_KEYS = [
  "trunkroom_user",
  "trunkroom_follow_v1",
  "trunkroom_likes_v1",
  "trunkroom_size_v1",
  "trunkroom_coordi",
  "trunkroom_closet_v2",
  "trunkroom_wear_history_v1",
  "trunkroom_laundry_v1",
  "trunkroom_notif_reads",
  "trunkroom_favorites_v1",
];

/**
 * Clear all per-user localStorage entries.
 */
export function clearLocalUserData() {
  try {
    for (const key of PER_USER_LOCAL_KEYS) {
      localStorage.removeItem(key);
    }
    Object.keys(localStorage)
      .filter((k) => k.startsWith("trunkroom_"))
      .filter((k) => !k.endsWith("_seeded_v1"))
      .filter((k) => !k.endsWith("_seeded_v2"))
      .filter((k) => k !== "trunkroom_onboarded")
      .forEach((k) => {
        if (!PER_USER_LOCAL_KEYS.includes(k)) localStorage.removeItem(k);
      });
  } catch { /* ignore — localStorage unavailable */ }
}

/**
 * Sign out the current user.
 * Uses scope "local" for reliability, then nukes leftover sb-* keys.
 *
 * @returns {Promise<{ error }>}
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut({ scope: "local" });

  // Nuke leftover sb-* keys so next getSession() returns null
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("sb-"))
      .forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }

  clearLocalUserData();
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
