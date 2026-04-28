-- ============================================================
-- TrunkRoom — likes 테이블
-- 실행: Supabase SQL Editor에 붙여넣기 → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS likes (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id   text        NOT NULL,            -- style.id 또는 clothing_item.id (문자열)
  target_type text        NOT NULL DEFAULT 'style',  -- 'style' | 'item'
  created_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, target_id, target_type)
);

-- 인덱스 (사용자별 좋아요 목록 조회)
CREATE INDEX IF NOT EXISTS likes_user_id_idx ON likes (user_id);

-- RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "likes_select_own" ON likes;
DROP POLICY IF EXISTS "likes_insert_own" ON likes;
DROP POLICY IF EXISTS "likes_delete_own" ON likes;

CREATE POLICY "likes_select_own"
  ON likes FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "likes_insert_own"
  ON likes FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "likes_delete_own"
  ON likes FOR DELETE USING (user_id = auth.uid());
