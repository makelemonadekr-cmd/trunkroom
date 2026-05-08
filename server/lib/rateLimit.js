/**
 * rateLimit.js
 *
 * AI API 월간 사용 횟수 제한 + 로그 기록.
 * service role key로 RLS를 우회해 서버에서 직접 INSERT합니다.
 *
 * Free tier : 월 5회 (analyze + removeBg 합산)
 * Premium   : 무제한
 */

import { createClient } from "@supabase/supabase-js";

// service role: RLS 우회 → INSERT / SELECT 가능
function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// 무료 월간 한도 (action별 구분 없이 통합 5회)
const FREE_MONTHLY_LIMIT = 5;

// ── Premium check ─────────────────────────────────────────────────────────────

/**
 * profiles.is_premium 플래그를 확인합니다.
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export async function isUserPremium(userId) {
  const admin = getAdminClient();
  if (!admin) return false;

  const { data, error } = await admin
    .from("profiles")
    .select("is_premium, premium_expires_at")
    .eq("id", userId)
    .single();

  if (error || !data) return false;

  // 만료 시간이 설정된 경우 현재 시간 이후인지 확인
  if (data.premium_expires_at) {
    const expires = new Date(data.premium_expires_at);
    if (expires <= new Date()) return false;
  }

  return data.is_premium === true;
}

// ── Rate limit check ──────────────────────────────────────────────────────────

/**
 * 이번 달 통합 사용 횟수를 조회합니다.
 * 프리미엄 유저는 항상 allowed: true를 반환합니다.
 *
 * @param {string} userId
 * @param {string} action  "analyze_clothing" | "remove_background"
 * @returns {Promise<{ used: number, limit: number, allowed: boolean, isPremium: boolean }>}
 */
export async function checkLimit(userId, action) {
  // 프리미엄 유저는 제한 없음
  const premium = await isUserPremium(userId);
  if (premium) {
    return { used: 0, limit: Infinity, allowed: true, isPremium: true };
  }

  const admin = getAdminClient();
  if (!admin) {
    console.warn("[rateLimit] SUPABASE_SERVICE_ROLE_KEY not set — rate limiting disabled");
    return { used: 0, limit: FREE_MONTHLY_LIMIT, allowed: true, isPremium: false };
  }

  // 이번 달 1일 00:00:00 UTC
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  // 두 action 모두 합산 (통합 월 5회)
  const { count, error } = await admin
    .from("ai_usage_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("action", ["analyze_clothing", "remove_background"])
    .eq("billed", true)
    .gte("created_at", monthStart.toISOString());

  if (error) {
    console.warn("[rateLimit] count query failed:", error.message);
    return { used: 0, limit: FREE_MONTHLY_LIMIT, allowed: true, isPremium: false };
  }

  const used = count ?? 0;
  return {
    used,
    limit: FREE_MONTHLY_LIMIT,
    allowed: used < FREE_MONTHLY_LIMIT,
    isPremium: false,
  };
}

// ── Usage logger ──────────────────────────────────────────────────────────────

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
