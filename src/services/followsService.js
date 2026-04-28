/**
 * followsService.js
 *
 * Supabase 팔로우 CRUD.
 * 컴포넌트에서 직접 호출하지 말고 useFollow() 훅을 통해 사용하세요.
 */

import { supabase } from "../lib/supabase.js";

/**
 * 사용자가 팔로우 중인 셀러 ID 목록을 가져옵니다.
 * @param {string} userId
 * @returns {Promise<{ follows: Array<{seller_id}>, error }>}
 */
export async function fetchUserFollows(userId) {
  const { data, error } = await supabase
    .from("follows")
    .select("seller_id")
    .eq("follower_id", userId);
  return { follows: data ?? [], error };
}

/**
 * 팔로우를 추가합니다. 이미 존재하면 무시합니다 (upsert).
 * @param {string} userId
 * @param {string} sellerId
 */
export async function addFollow(userId, sellerId) {
  const { error } = await supabase
    .from("follows")
    .upsert(
      { follower_id: userId, seller_id: String(sellerId) },
      { onConflict: "follower_id,seller_id" },
    );
  return { error };
}

/**
 * 팔로우를 취소합니다.
 * @param {string} userId
 * @param {string} sellerId
 */
export async function removeFollow(userId, sellerId) {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", userId)
    .eq("seller_id", String(sellerId));
  return { error };
}
