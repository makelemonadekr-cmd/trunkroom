/**
 * useAiUsage.js
 *
 * 오늘 남은 AI 사용 횟수를 /api/ai-usage 에서 조회합니다.
 * 컴포넌트 마운트 시 한 번 fetch하며, refresh() 호출로 재조회할 수 있습니다.
 *
 * Usage:
 *   const { analyze, removeBg, loading, refresh } = useAiUsage(accessToken)
 */

import { useState, useEffect, useCallback } from "react";

const DEFAULT = { used: 0, limit: 10, remaining: 10 };

export function useAiUsage(accessToken) {
  const [analyze,  setAnalyze]  = useState(DEFAULT);
  const [removeBg, setRemoveBg] = useState(DEFAULT);
  const [loading,  setLoading]  = useState(false);

  const fetch_ = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai-usage", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.analyze)  setAnalyze(data.analyze);
      if (data.removeBg) setRemoveBg(data.removeBg);
    } catch {
      // サイレントフォールバック — 制限なしとして扱う
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { analyze, removeBg, loading, refresh: fetch_ };
}
