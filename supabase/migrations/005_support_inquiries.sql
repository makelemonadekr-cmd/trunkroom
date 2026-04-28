-- ============================================================
-- TrunkRoom — support_inquiries 테이블
-- 인앱 고객센터 문의 저장
-- 실행: Supabase SQL Editor → New query → 붙여넣기 → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS support_inquiries (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  email       text        NOT NULL,
  category    text        NOT NULL,   -- '서비스 이용' | '결제·환불' | '버그 신고' | '제휴·협업' | '기타'
  subject     text        NOT NULL,
  message     text        NOT NULL,
  status      text        DEFAULT 'pending' NOT NULL,   -- 'pending' | 'answered' | 'closed'
  created_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS support_inquiries_user_id_idx ON support_inquiries (user_id);
CREATE INDEX IF NOT EXISTS support_inquiries_status_idx  ON support_inquiries (status);

ALTER TABLE support_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_insert_anyone" ON support_inquiries;
DROP POLICY IF EXISTS "support_select_own"    ON support_inquiries;

-- 누구나 문의를 제출할 수 있음 (비로그인 포함)
CREATE POLICY "support_insert_anyone"
  ON support_inquiries FOR INSERT
  WITH CHECK (true);

-- 본인 문의만 조회 가능
CREATE POLICY "support_select_own"
  ON support_inquiries FOR SELECT
  USING (user_id = auth.uid());
