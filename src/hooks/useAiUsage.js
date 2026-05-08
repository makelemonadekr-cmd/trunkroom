/**
 * useAiUsage.js
 *
 * 이번 달 남은 AI 사용 횟수를 /api/ai-usage 에서 조회합니다.
 * 컴포넌트 마운트 시 한 번 fetch하며, refresh() 호출로 재조회할 수 있어요.
 *
 * Usage:
 *   const { isPremium, used, limit, remaining, loading, refresh } = useAiUsage(accessToken)
 *
 * 프리미엄 유저: isPremium = true, remaining = null (무제한)
 * 무료 유저:    isPremium = false, remaining = 0~5
 */

import { useState, useEffect, useCallback } from "react";

const FREE_LIMIT = 5;
const DEFAULT_USAGE = { used: 0, limit: FREE_LIMIT, remaining: FREE_LIMIT };

export function useAiUsage(accessToken) {
  const [isPremium, setIsPremium] = useState(false);
  const [used,      setUsed]      = useState(0);
  const [limit,     setLimit]     = useState(FREE_LIMIT);
  const [remaining, setRemaining] = useState(FREE_LIMIT);
  const [loading,   setLoading]   = useState(false);

  // Legacy shape — kept for existing callers (AddClosetItemScreen uses analyze/removeBg)
  const [analyze,  setAnalyze]  = useState(DEFAULT_USAGE);
  const [removeBg, setRemoveBg] = useState(DEFAULT_USAGE);

  const fetch_ = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai-usage", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return;
      const data = await res.json();

      // Top-level combined stats
      const prem = data.isPremium ?? false;
      setIsPremium(prem);
      setUsed(data.used ?? 0);
      setLimit(data.limit ?? FREE_LIMIT);
      setRemaining(data.remaining ?? (prem ? null : FREE_LIMIT));

      // Legacy per-action shapes
      if (data.analyze)  setAnalyze(data.analyze);
      if (data.removeBg) setRemoveBg(data.removeBg);
    } catch {
      // silent fallback — no limit enforced on client
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return {
    isPremium,
    used,
    limit,
    remaining,
    analyze,
    removeBg,
    loading,
    refresh: fetch_,
  };
}
