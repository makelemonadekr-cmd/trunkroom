-- ============================================================
-- TrunkRoom — follows 테이블
-- 실행: Supabase SQL Editor에 붙여넣기 → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS follows (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id   text        NOT NULL,   -- profiles.id (uuid → text) 또는 mock seller id
  created_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE (follower_id, seller_id)
);

CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON follows (follower_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follows_select_own" ON follows;
DROP POLICY IF EXISTS "follows_insert_own" ON follows;
DROP POLICY IF EXISTS "follows_delete_own" ON follows;

CREATE POLICY "follows_select_own"
  ON follows FOR SELECT USING (follower_id = auth.uid());

CREATE POLICY "follows_insert_own"
  ON follows FOR INSERT WITH CHECK (follower_id = auth.uid());

CREATE POLICY "follows_delete_own"
  ON follows FOR DELETE USING (follower_id = auth.uid());
