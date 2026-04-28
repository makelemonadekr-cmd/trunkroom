-- 008_ai_usage_logs.sql
-- AI API 사용 로그 테이블 (rate limiting + 비용 추적)

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action     text NOT NULL CHECK (action IN ('analyze_clothing', 'remove_background')),
  success    boolean NOT NULL DEFAULT true,
  billed     boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 조회 성능용 인덱스 (유저 + 날짜 기준 count 쿼리)
CREATE INDEX IF NOT EXISTS ai_usage_logs_user_date
  ON ai_usage_logs (user_id, created_at);

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- 유저는 자신의 로그만 조회 가능 (남은 횟수 확인용)
CREATE POLICY "ai_usage_own_select"
  ON ai_usage_logs FOR SELECT
  USING (user_id = auth.uid());

-- INSERT는 service role(서버)만 가능 → 별도 policy 없음 (service role은 RLS 무시)
