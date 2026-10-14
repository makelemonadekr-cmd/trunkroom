-- ============================================================
-- seed-demo-discovery.sql
-- 데모 계정 아이템 → 판매 활성화 + 스타일북 삽입
-- Supabase SQL 에디터에서 실행 (service_role 권한 필요)
-- ============================================================

-- ① 데모 계정 아이템 중 일부를 판매중으로 전환
--    각 계정마다 3개씩 is_for_sale = true, price 설정
UPDATE clothing_items
SET
  is_for_sale = true,
  price = CASE
    WHEN main_category = '아우터'     THEN (ARRAY[89000,120000,145000,98000,75000])[floor(random()*5+1)::int]
    WHEN main_category = '상의'       THEN (ARRAY[32000,45000,55000,38000,28000])[floor(random()*5+1)::int]
    WHEN main_category = '하의'       THEN (ARRAY[58000,72000,65000,48000,55000])[floor(random()*5+1)::int]
    WHEN main_category = '신발'       THEN (ARRAY[95000,115000,88000,72000,105000])[floor(random()*5+1)::int]
    WHEN main_category = '가방'       THEN (ARRAY[135000,165000,120000,98000,145000])[floor(random()*5+1)::int]
    WHEN main_category = '원피스'     THEN (ARRAY[68000,85000,72000,59000,78000])[floor(random()*5+1)::int]
    ELSE (ARRAY[35000,45000,55000,42000,38000])[floor(random()*5+1)::int]
  END,
  is_public = true
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%demo@trunkroom.app'
)
AND id IN (
  -- 계정당 3개씩 선택 (각 계정의 첫 3개)
  SELECT ci.id
  FROM clothing_items ci
  JOIN (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) AS rn
    FROM clothing_items
    WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%demo@trunkroom.app')
  ) ranked ON ci.id = ranked.id
  WHERE ranked.rn <= 3
);

-- ② 모든 데모 계정 아이템 is_public 확인
UPDATE clothing_items
SET is_public = true
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%demo@trunkroom.app'
);

-- ③ 데모 계정 스타일북 삽입
--    각 계정당 스타일 2개씩 (background_url은 Unsplash 공개 이미지)
INSERT INTO styles (id, user_id, title, background_url, mood, custom_mood, memo, is_public, created_at)
SELECT
  gen_random_uuid(),
  u.id,
  title,
  bg_url,
  mood,
  mood,
  memo,
  true,
  NOW() - (idx || ' days')::interval
FROM auth.users u
JOIN (
  VALUES
    -- 하나 (캐주얼)
    ('hana.demo@trunkroom.app',    '봄 데일리 룩',        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600', '캐주얼', '따뜻한 날 입기 좋은 편한 코디', 1),
    ('hana.demo@trunkroom.app',    '오피스 캐주얼',        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600', '오피스룩', '출근룩으로 딱인 깔끔한 스타일', 3),
    -- 예린 (트렌디)
    ('yerin.demo@trunkroom.app',   '스트릿 무드',          'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600', '스트릿', '요즘 제일 자주 입는 조합', 1),
    ('yerin.demo@trunkroom.app',   'Y2K 바이브',           'https://images.unsplash.com/photo-1611601322175-ef8ec8c85f01?w=600', 'Y2K', '레트로 감성 제대로', 4),
    -- 서연 (페미닌)
    ('seoyeon.demo@trunkroom.app', '플로럴 데이트룩',      'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600', '페미닌', '봄에 어울리는 로맨틱 코디', 2),
    ('seoyeon.demo@trunkroom.app', '러블리 피크닉룩',      'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=600', '러블리', '피크닉 갈 때 딱인 룩', 5),
    -- 지우 (스트릿)
    ('jiwoo.demo@trunkroom.app',   '오버핏 스트릿',        'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600', '스트릿', '오버핏 조합 최애 코디', 1),
    ('jiwoo.demo@trunkroom.app',   '모노톤 룩',            'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600', '미니멀', '블랙&화이트 항상 옳다', 3),
    -- 민지 (걸리시)
    ('minji.demo@trunkroom.app',   '핑크 걸리시',          'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600', '걸리시', '핑크 좋아하는 사람들 모여라', 2),
    ('minji.demo@trunkroom.app',   '큐티 캐주얼',          'https://images.unsplash.com/photo-1617019114583-affb34d1b3cd?w=600', '캐주얼', '매일 입고 싶은 편한 코디', 4)
) AS t(email, title, bg_url, mood, memo, idx) ON u.email = t.email
-- 이미 스타일이 있으면 중복 삽입 안 함
WHERE NOT EXISTS (
  SELECT 1 FROM styles s WHERE s.user_id = u.id AND s.title = t.title
);

-- ④ 결과 확인
SELECT
  u.email,
  COUNT(DISTINCT ci.id) FILTER (WHERE ci.is_public)    AS public_items,
  COUNT(DISTINCT ci.id) FILTER (WHERE ci.is_for_sale)  AS sale_items,
  COUNT(DISTINCT s.id)  FILTER (WHERE s.is_public)     AS public_styles
FROM auth.users u
LEFT JOIN clothing_items ci ON ci.user_id = u.id
LEFT JOIN styles          s  ON s.user_id  = u.id
WHERE u.email LIKE '%demo@trunkroom.app'
GROUP BY u.email
ORDER BY u.email;
