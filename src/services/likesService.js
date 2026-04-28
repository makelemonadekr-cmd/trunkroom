/**
 * likesService.js
 *
 * Supabase 좋아요 CRUD.
 * 컴포넌트에서 직접 호출하지 말고 useLikes() 훅을 통해 사용하세요.
 */

import { supabase } from "../lib/supabase.js";

/**
 * 사용자의 전체 좋아요 목록을 가져옵니다.
 * @param {string} userId
 * @returns {Promise<{ likes: Array<{target_id, target_type}>, error }>}
 */
export async function fetchUserLikes(userId) {
  const { data, error } = await supabase
    .from("likes")
    .select("target_id, target_type")
    .eq("user_id", userId);
  return { likes: data ?? [], error };
}

/**
 * 좋아요를 추가합니다. 이미 존재하면 무시합니다 (upsert).
 * @param {string} userId
 * @param {string} targetId
 * @param {"style"|"item"} [targetType]
 */
export async function addLike(userId, targetId, targetType = "style") {
  const { error } = await supabase
    .from("likes")
    .upsert(
      { user_id: userId, target_id: String(targetId), target_type: targetType },
      { onConflict: "user_id,target_id,target_type" },
    );
  return { error };
}

/**
 * 좋아요를 취소합니다.
 * @param {string} userId
 * @param {string} targetId
 * @param {"style"|"item"} [targetType]
 */
export async function removeLike(userId, targetId, targetType = "style") {
  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("user_id", userId)
    .eq("target_id", String(targetId))
    .eq("target_type", targetType);
  return { error };
}
