-- ============================================================
-- TrunkRoom — clothing_items RLS 수정
-- is_public = true 인 아이템도 발견 피드에서 읽을 수 있도록 허용
-- 실행: Supabase SQL Editor → New query → 붙여넣기 → Run
-- ============================================================

DROP POLICY IF EXISTS "items_select_own_or_public" ON clothing_items;

CREATE POLICY "items_select_own_or_public"
  ON clothing_items FOR SELECT
  USING (
    user_id = auth.uid()   -- 내 아이템
    OR is_for_sale = true  -- 판매 중인 아이템
    OR is_public  = true   -- 공개로 설정한 아이템 (발견 피드)
  );
