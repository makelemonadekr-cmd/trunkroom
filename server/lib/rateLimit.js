/**
 * rateLimit.js
 *
 * AI API 일일 사용 횟수 제한 + 로그 기록.
 * service role key로 RLS를 우회해 서버에서 직접 INSERT합니다.
 */

import { createClient } from "@supabase/supabase-js";

// service role: RLS 우회 → INSERT 가능
function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// 일일 한도
const DAILY_LIMITS = {
  analyze_clothing:  10,
  remove_background: 10,
};

/**
 * 오늘 사용 횟수를 조회합니다.
 * @returns {{ used: number, limit: number, allowed: boolean }}
 */
export async function checkLimit(userId, action) {
  const limit = DAILY_LIMITS[action] ?? 10;
  const admin = getAdminClient();

  if (!admin) {
    // service role key 미설정 시 제한 없이 허용 (개발 환경 대비)
    console.warn("[rateLimit] SUPABASE_SERVICE_ROLE_KEY not set — rate limiting disabled");
    return { used: 0, limit, allowed: true };
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count, error } = await admin
    .from("ai_usage_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", action)
    .eq("billed", true)
    .gte("created_at", todayStart.toISOString());

  if (error) {
    console.warn("[rateLimit] count query failed:", error.message);
    return { used: 0, limit, allowed: true }; // 오류 시 허용 (서비스 중단 방지)
  }

  const used = count ?? 0;
  return { used, limit, allowed: used < limit };
}

/**
 * 사용 기록을 ai_usage_logs에 INSERT합니다.
 */
export async function logUsage(userId, action, { success = true, billed = true } = {}) {
  const admin = getAdminClient();
  if (!admin) return;

  const { error } = await admin
    .from("ai_usage_logs")
    .insert({ user_id: userId, action, success, billed });

  if (error) {
    console.warn("[rateLimit] log insert failed:", error.message);
  }
}
