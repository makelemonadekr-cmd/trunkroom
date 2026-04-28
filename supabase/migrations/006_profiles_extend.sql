-- ============================================================
-- TrunkRoom — profiles 테이블 컬럼 추가
-- userStore (localStorage) 에 저장되던 필드들을 Supabase로 이전
-- 실행: Supabase SQL Editor → New query → 붙여넣기 → Run
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS gender            text,
  ADD COLUMN IF NOT EXISTS birth_date        date,
  ADD COLUMN IF NOT EXISTS height            integer,
  ADD COLUMN IF NOT EXISTS style_keywords    text[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS phone             text,
  ADD COLUMN IF NOT EXISTS address           text,
  ADD COLUMN IF NOT EXISTS marketing_consent boolean  DEFAULT false,
  ADD COLUMN IF NOT EXISTS push_consent      boolean  DEFAULT true;
