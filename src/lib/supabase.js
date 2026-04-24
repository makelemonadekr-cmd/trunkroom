/**
 * supabase.js
 *
 * Supabase client singleton.
 * Import { supabase } from this file wherever you need DB / Auth / Storage access.
 *
 * Environment variables (set in .env — never commit):
 *   VITE_SUPABASE_URL      — your Supabase project URL
 *   VITE_SUPABASE_ANON_KEY — publishable/anon key (safe for frontend)
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "[Supabase] Missing environment variables.\n" +
    "Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
