-- ============================================================
-- TrunkRoom — Row Level Security Policies
-- 실행 위치: Supabase 대시보드 → SQL Editor → 전체 복사·붙여넣기 → Run
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. profiles
--    • 읽기: 전체 공개 (발견 피드에서 다른 사용자 프로필 조회용)
--    • 수정/삭제: 본인만
-- ────────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_public"  ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own"     ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"     ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own"     ON profiles;

CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  USING (true);                          -- 모든 사용자가 읽을 수 있음

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING     (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_delete_own"
  ON profiles FOR DELETE
  USING (id = auth.uid());


-- ────────────────────────────────────────────────────────────
-- 2. clothing_items
--    • 읽기: 본인 것 + is_for_sale=true 인 남의 것 (마켓플레이스)
--    • 쓰기: 본인만
-- ────────────────────────────────────────────────────────────
ALTER TABLE clothing_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "items_select_own_or_public"  ON clothing_items;
DROP POLICY IF EXISTS "items_insert_own"            ON clothing_items;
DROP POLICY IF EXISTS "items_update_own"            ON clothing_items;
DROP POLICY IF EXISTS "items_delete_own"            ON clothing_items;

CREATE POLICY "items_select_own_or_public"
  ON clothing_items FOR SELECT
  USING (
    user_id = auth.uid()            -- 내 아이템
    OR is_for_sale = true            -- 판매 중인 남의 아이템
  );

CREATE POLICY "items_insert_own"
  ON clothing_items FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "items_update_own"
  ON clothing_items FOR UPDATE
  USING     (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "items_delete_own"
  ON clothing_items FOR DELETE
  USING (user_id = auth.uid());


-- ────────────────────────────────────────────────────────────
-- 3. styles
--    • 읽기: 본인 것 + is_public=true 인 남의 것 (발견 피드)
--    • 쓰기: 본인만
-- ────────────────────────────────────────────────────────────
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "styles_select_own_or_public"  ON styles;
DROP POLICY IF EXISTS "styles_insert_own"            ON styles;
DROP POLICY IF EXISTS "styles_update_own"            ON styles;
DROP POLICY IF EXISTS "styles_delete_own"            ON styles;

CREATE POLICY "styles_select_own_or_public"
  ON styles FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_public = true
  );

CREATE POLICY "styles_insert_own"
  ON styles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "styles_update_own"
  ON styles FOR UPDATE
  USING     (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "styles_delete_own"
  ON styles FOR DELETE
  USING (user_id = auth.uid());


-- ────────────────────────────────────────────────────────────
-- 4. style_items  (styles 의 junction table)
--    • 읽기: 연결된 style 이 본인 것이거나 public 이면 읽기 허용
--    • 쓰기: 연결된 style 이 본인 것인 경우만
-- ────────────────────────────────────────────────────────────
ALTER TABLE style_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "style_items_select"  ON style_items;
DROP POLICY IF EXISTS "style_items_insert"  ON style_items;
DROP POLICY IF EXISTS "style_items_update"  ON style_items;
DROP POLICY IF EXISTS "style_items_delete"  ON style_items;

CREATE POLICY "style_items_select"
  ON style_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM styles s
      WHERE s.id = style_items.style_id
        AND (s.user_id = auth.uid() OR s.is_public = true)
    )
  );

CREATE POLICY "style_items_insert"
  ON style_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM styles s
      WHERE s.id = style_items.style_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "style_items_update"
  ON style_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM styles s
      WHERE s.id = style_items.style_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "style_items_delete"
  ON style_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM styles s
      WHERE s.id = style_items.style_id
        AND s.user_id = auth.uid()
    )
  );


-- ────────────────────────────────────────────────────────────
-- 5. wear_logs
--    • 읽기/쓰기: 본인만 (착용 기록은 비공개)
-- ────────────────────────────────────────────────────────────
ALTER TABLE wear_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wear_logs_select_own"  ON wear_logs;
DROP POLICY IF EXISTS "wear_logs_insert_own"  ON wear_logs;
DROP POLICY IF EXISTS "wear_logs_update_own"  ON wear_logs;
DROP POLICY IF EXISTS "wear_logs_delete_own"  ON wear_logs;

CREATE POLICY "wear_logs_select_own"
  ON wear_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "wear_logs_insert_own"
  ON wear_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "wear_logs_update_own"
  ON wear_logs FOR UPDATE
  USING     (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "wear_logs_delete_own"
  ON wear_logs FOR DELETE
  USING (user_id = auth.uid());


-- ────────────────────────────────────────────────────────────
-- Storage 버킷 RLS
-- clothing-images 버킷: 본인 폴더만 업로드/삭제 허용
-- avatars 버킷: 본인 폴더만 업로드/삭제 허용
-- ────────────────────────────────────────────────────────────

-- clothing-images
INSERT INTO storage.buckets (id, name, public)
  VALUES ('clothing-images', 'clothing-images', true)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "clothing_images_select_public" ON storage.objects;
DROP POLICY IF EXISTS "clothing_images_insert_own"    ON storage.objects;
DROP POLICY IF EXISTS "clothing_images_update_own"    ON storage.objects;
DROP POLICY IF EXISTS "clothing_images_delete_own"    ON storage.objects;

CREATE POLICY "clothing_images_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'clothing-images');    -- 이미지 URL 은 공개 (CDN 직접 접근)

CREATE POLICY "clothing_images_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'clothing-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "clothing_images_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'clothing-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "clothing_images_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'clothing-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- avatars
INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_own"    ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_own"    ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_own"    ON storage.objects;

CREATE POLICY "avatars_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
