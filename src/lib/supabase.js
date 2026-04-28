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
    "[Supabase] 환경변수가 설정되지 않았습니다.\n" +
    ".env 파일에 VITE_SUPABASE_URL 과 VITE_SUPABASE_ANON_KEY 를 설정해주세요.\n" +
    "참고: .env.example"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,   // 토큰 만료 전 자동 갱신
    persistSession:   true,   // 새로고침 후에도 로그인 상태 유지 (localStorage)
    detectSessionInUrl: true, // 이메일 인증·비밀번호 재설정 링크에서 세션 자동 감지
    storageKey: "trunkroom_auth", // 동일 도메인에 여러 앱이 있어도 충돌 없음
  },
});
