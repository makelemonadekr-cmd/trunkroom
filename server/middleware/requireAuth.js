/**
 * requireAuth.js
 *
 * Supabase JWT 검증 미들웨어.
 * Authorization: Bearer <access_token> 헤더를 검증하고
 * req.userId 에 유저 ID를 주입합니다.
 */

import { createClient } from "@supabase/supabase-js";

// anon key로 JWT 검증 (service role 불필요)
// Railway 등 서버 환경에선 SUPABASE_URL, 로컬은 VITE_SUPABASE_URL 사용
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "로그인이 필요해요" });
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: "인증에 실패했어요. 다시 로그인해주세요." });
  }

  req.userId = user.id;
  next();
}
