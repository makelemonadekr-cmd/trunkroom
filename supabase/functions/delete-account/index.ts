/**
 * delete-account — Supabase Edge Function
 *
 * 사용자 계정과 연결된 모든 데이터를 삭제합니다.
 * 클라이언트에서 supabase.functions.invoke("delete-account") 로 호출합니다.
 *
 * 삭제 순서 (FK 의존성 순):
 *   1. style_items (styles 참조)
 *   2. styles
 *   3. wear_logs
 *   4. clothing_items
 *   5. profiles
 *   6. auth.users (Supabase Admin API)
 *
 * 배포:
 *   supabase functions deploy delete-account
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Pre-flight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    // ── Supabase Admin 클라이언트 (service_role key 사용) ───────────────────
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")              ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // ── JWT 에서 사용자 확인 ────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "인증 정보가 없어요" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);

    if (userErr || !user) {
      return json({ error: "유효하지 않은 토큰이에요" }, 401);
    }

    const uid = user.id;

    // Helper: ignore-error delete (some tables may not exist in older envs)
    const safeDelete = async (table: string, column: string, value: string) => {
      const { error } = await supabaseAdmin.from(table).delete().eq(column, value);
      if (error) console.warn(`[delete-account] ${table}.${column}=${value}:`, error.message);
    };

    // ── 1. style_items 삭제 ────────────────────────────────────────────────
    const { data: styleRows } = await supabaseAdmin
      .from("styles")
      .select("id")
      .eq("user_id", uid);

    if (styleRows && styleRows.length > 0) {
      const styleIds = styleRows.map((r: { id: string }) => r.id);
      await supabaseAdmin
        .from("style_items")
        .delete()
        .in("style_id", styleIds);
    }

    // ── 2. styles ──────────────────────────────────────────────────────────
    await safeDelete("styles", "user_id", uid);

    // ── 3. wear_logs ──────────────────────────────────────────────────────
    await safeDelete("wear_logs", "user_id", uid);

    // ── 4. likes (both as actor and as target if applicable) ──────────────
    await safeDelete("likes", "user_id", uid);

    // ── 5. follows ────────────────────────────────────────────────────────
    await safeDelete("follows", "follower_id", uid);
    await safeDelete("follows", "following_id", uid);

    // ── 6. support_inquiries ──────────────────────────────────────────────
    await safeDelete("support_inquiries", "user_id", uid);

    // ── 7. ai_usage_logs ──────────────────────────────────────────────────
    await safeDelete("ai_usage_logs", "user_id", uid);

    // ── 8. reports + blocks (moderation) ──────────────────────────────────
    await safeDelete("reports", "reporter_id", uid);
    await safeDelete("blocks",  "blocker_id", uid);
    await safeDelete("blocks",  "blocked_id", uid);

    // ── 9. clothing_items ─────────────────────────────────────────────────
    await safeDelete("clothing_items", "user_id", uid);

    // ── 10. Storage objects (clothing-images bucket) ──────────────────────
    try {
      const { data: files } = await supabaseAdmin
        .storage.from("clothing-images")
        .list(uid, { limit: 1000 });
      if (files && files.length > 0) {
        const paths = files.map((f) => `${uid}/${f.name}`);
        await supabaseAdmin.storage.from("clothing-images").remove(paths);
      }
    } catch (e) {
      console.warn("[delete-account] storage cleanup error:", (e as Error).message);
    }

    // ── 11. profiles ──────────────────────────────────────────────────────
    await safeDelete("profiles", "id", uid);

    // ── 12. auth.users (Admin API) ────────────────────────────────────────
    const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (deleteErr) {
      console.error("[delete-account] auth.admin.deleteUser error:", deleteErr.message);
      return json({ error: "계정 삭제에 실패했어요. 잠시 후 다시 시도해주세요." }, 500);
    }

    return json({ success: true });
  } catch (err) {
    console.error("[delete-account] unexpected error:", err);
    return json({ error: "서버 오류가 발생했어요" }, 500);
  }
});

// ── Helper ────────────────────────────────────────────────────────────────────
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
