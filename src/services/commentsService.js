/**
 * commentsService.js
 *
 * CRUD for the `comments` table.
 *   fetchComments(itemId)          → { comments, error }
 *   addComment(itemId, userId, text) → { comment, error }
 *   deleteComment(commentId)       → { error }
 */

import { supabase } from "../lib/supabase.js";

/**
 * Fetch all comments for an item, newest first.
 * Joins profiles to get the commenter's nickname + avatar.
 */
export async function fetchComments(itemId) {
  const { data, error } = await supabase
    .from("comments")
    .select(`
      id,
      text,
      created_at,
      user_id,
      profiles:user_id ( nickname, avatar_url )
    `)
    .eq("item_id", itemId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return { comments: [], error };

  const comments = (data ?? []).map((row) => ({
    id:        row.id,
    userId:    row.user_id,
    text:      row.text,
    createdAt: row.created_at,
    username:  row.profiles?.nickname ?? "익명",
    avatar:    row.profiles?.avatar_url ?? null,
    timeAgo:   formatTimeAgo(row.created_at),
  }));

  return { comments, error: null };
}

/**
 * Add a new comment.
 */
export async function addComment(itemId, userId, text) {
  const { data, error } = await supabase
    .from("comments")
    .insert({ item_id: itemId, user_id: userId, text: text.trim() })
    .select(`
      id,
      text,
      created_at,
      user_id,
      profiles:user_id ( nickname, avatar_url )
    `)
    .single();

  if (error) return { comment: null, error };

  return {
    comment: {
      id:        data.id,
      userId:    data.user_id,
      text:      data.text,
      createdAt: data.created_at,
      username:  data.profiles?.nickname ?? "익명",
      avatar:    data.profiles?.avatar_url ?? null,
      timeAgo:   "방금",
    },
    error: null,
  };
}

/**
 * Delete a comment (only succeeds if RLS allows it — i.e., owner).
 */
export async function deleteComment(commentId) {
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);
  return { error };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeAgo(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "방금";
  if (mins  < 60) return `${mins}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days  < 7)  return `${days}일 전`;
  return new Date(isoString).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}
