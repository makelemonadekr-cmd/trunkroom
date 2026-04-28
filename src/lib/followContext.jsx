/**
 * followContext.jsx
 *
 * 로그인 사용자 → Supabase follows 테이블에 저장
 * 비회원       → 기존 localStorage (followStore) 그대로 사용
 *
 * 사용법:
 *   const { isFollowing, toggleFollow, followedIds } = useFollow();
 *
 *   const following = isFollowing(sellerId);
 *   const handleTap = () => toggleFollow(sellerId);  // 낙관적 업데이트 포함
 */

import {
  createContext, useContext,
  useState, useEffect, useCallback, useRef,
} from "react";
import { useAuth }                                   from "../hooks/useAuth.js";
import { fetchUserFollows, addFollow, removeFollow } from "../services/followsService.js";
import {
  isFollowing  as lsIsFollowing,
  toggleFollow as lsToggle,
}                                                    from "./followStore.js";

const FollowContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function FollowProvider({ children }) {
  const { user } = useAuth();

  // Set<seller_id> — 팔로우 중인 셀러 ID 집합
  const [followedSet, setFollowedSet] = useState(() => new Set());
  const loadedForRef                  = useRef(null);

  // ── 로그인 시 DB에서 팔로우 목록 로드 ──────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setFollowedSet(new Set());
      loadedForRef.current = null;
      return;
    }
    if (loadedForRef.current === user.id) return;
    loadedForRef.current = user.id;

    fetchUserFollows(user.id).then(({ follows, error }) => {
      if (error) {
        console.warn("[useFollow] fetch error:", error.message);
        return;
      }
      setFollowedSet(new Set(follows.map((f) => String(f.seller_id))));
    });
  }, [user]);

  // ── isFollowing ────────────────────────────────────────────────────────────
  const isFollowing = useCallback(
    (sellerId) => user ? followedSet.has(String(sellerId)) : lsIsFollowing(sellerId),
    [user, followedSet],
  );

  // ── toggleFollow (낙관적 업데이트 → fire-and-forget DB call) ──────────────
  const toggleFollow = useCallback(
    (sellerId) => {
      if (!user) {
        return lsToggle(sellerId);
      }

      const key             = String(sellerId);
      const currentlyFollow = followedSet.has(key);

      if (currentlyFollow) {
        setFollowedSet((prev) => { const next = new Set(prev); next.delete(key); return next; });
        removeFollow(user.id, sellerId);
        return { following: false };
      } else {
        setFollowedSet((prev) => new Set([...prev, key]));
        addFollow(user.id, sellerId);
        return { following: true };
      }
    },
    [user, followedSet],
  );

  // followedSet 을 외부에 노출 (SellerListTab의 팔로우 필터용)
  const followedIds = followedSet;

  return (
    <FollowContext.Provider value={{ isFollowing, toggleFollow, followedIds }}>
      {children}
    </FollowContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFollow() {
  const ctx = useContext(FollowContext);
  if (!ctx) throw new Error("useFollow must be used inside <FollowProvider>");
  return ctx;
}
