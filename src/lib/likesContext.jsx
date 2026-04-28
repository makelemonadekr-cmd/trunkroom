/**
 * likesContext.jsx
 *
 * 로그인 사용자 → Supabase likes 테이블에 저장
 * 비회원       → 기존 localStorage (likesStore) 그대로 사용
 *
 * 사용법:
 *   const { isLiked, getCount, toggleLike } = useLikes();
 *
 *   const liked = isLiked(id);
 *   const count = getCount(id, baseLikes);
 *   const handleTap = () => toggleLike(id, baseLikes);   // 낙관적 업데이트 포함
 */

import {
  createContext, useContext,
  useState, useEffect, useCallback, useRef,
} from "react";
import { useAuth }                               from "../hooks/useAuth.js";
import { fetchUserLikes, addLike, removeLike }  from "../services/likesService.js";
import {
  isLiked    as lsIsLiked,
  getLikeCount as lsGetCount,
  toggleLike as lsToggle,
}                                               from "./likesStore.js";

const LikesContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function LikesProvider({ children }) {
  const { user } = useAuth();

  // Set<target_id> — 현재 사용자가 좋아요 누른 ID 집합
  const [likedSet, setLikedSet]  = useState(() => new Set());
  // { [target_id]: number } — 낙관적으로 업데이트된 카운트
  const [counts,   setCounts]    = useState({});
  const loadedForRef             = useRef(null);

  // ── 로그인 시 DB에서 좋아요 목록 로드 ──────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setLikedSet(new Set());
      setCounts({});
      loadedForRef.current = null;
      return;
    }
    if (loadedForRef.current === user.id) return; // 이미 로드됨
    loadedForRef.current = user.id;

    fetchUserLikes(user.id).then(({ likes, error }) => {
      if (error) {
        console.warn("[useLikes] fetch error:", error.message);
        return;
      }
      setLikedSet(new Set(likes.map((l) => String(l.target_id))));
    });
  }, [user]);

  // ── isLiked ────────────────────────────────────────────────────────────────
  const isLiked = useCallback(
    (id) => user ? likedSet.has(String(id)) : lsIsLiked(id),
    [user, likedSet],
  );

  // ── getCount ───────────────────────────────────────────────────────────────
  const getCount = useCallback(
    (id, base = 0) => {
      if (!user) return lsGetCount(id, base);
      const override = counts[String(id)];
      return override !== undefined ? override : base;
    },
    [user, counts],
  );

  // ── toggleLike (낙관적 업데이트 → fire-and-forget DB call) ────────────────
  const toggleLike = useCallback(
    (id, base = 0, type = "style") => {
      if (!user) {
        // 비회원: 기존 localStorage 동작
        return lsToggle(id, base);
      }

      const key            = String(id);
      const currentlyLiked = likedSet.has(key);
      const currentCount   = counts[key] !== undefined ? counts[key] : base;

      if (currentlyLiked) {
        // 좋아요 취소 (낙관적)
        setLikedSet((prev) => { const next = new Set(prev); next.delete(key); return next; });
        setCounts((prev) => ({ ...prev, [key]: Math.max(0, currentCount - 1) }));
        removeLike(user.id, id, type); // 비동기, 에러 무시 (낙관적)
        return { liked: false, count: Math.max(0, currentCount - 1) };
      } else {
        // 좋아요 추가 (낙관적)
        setLikedSet((prev) => new Set([...prev, key]));
        setCounts((prev) => ({ ...prev, [key]: currentCount + 1 }));
        addLike(user.id, id, type); // 비동기, 에러 무시 (낙관적)
        return { liked: true, count: currentCount + 1 };
      }
    },
    [user, likedSet, counts],
  );

  return (
    <LikesContext.Provider value={{ isLiked, getCount, toggleLike }}>
      {children}
    </LikesContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLikes() {
  const ctx = useContext(LikesContext);
  if (!ctx) throw new Error("useLikes must be used inside <LikesProvider>");
  return ctx;
}
