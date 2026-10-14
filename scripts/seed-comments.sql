-- ============================================================
-- seed-comments.sql
-- 데모 계정 아이템마다 다른 댓글 시드
-- ============================================================

-- 데모 유저 ID 임시 저장
WITH demo_users AS (
  SELECT id, email,
    ROW_NUMBER() OVER (ORDER BY email) AS rn
  FROM auth.users
  WHERE email LIKE '%demo@trunkroom.app'
),
-- 각 유저의 아이템 (순번 포함)
demo_items AS (
  SELECT ci.id AS item_id, ci.user_id, ci.main_category, ci.name,
    ROW_NUMBER() OVER (PARTITION BY ci.user_id ORDER BY ci.created_at) AS item_rn
  FROM clothing_items ci
  WHERE ci.user_id IN (SELECT id FROM demo_users)
    AND ci.is_public = true
),
-- 댓글 작성자: 아이템 소유자가 아닌 다른 유저
commenter_pool AS (
  SELECT di.item_id, di.user_id AS owner_id, di.main_category, di.item_rn,
    du.id AS commenter_id, du.email AS commenter_email,
    ROW_NUMBER() OVER (PARTITION BY di.item_id ORDER BY du.rn) AS c_rn
  FROM demo_items di
  JOIN demo_users du ON du.id != di.user_id
)
INSERT INTO comments (id, item_id, user_id, text, created_at)
SELECT
  gen_random_uuid(),
  item_id,
  commenter_id,
  CASE
    -- 아우터 댓글
    WHEN main_category = '아우터' AND c_rn = 1 AND item_rn = 1 THEN '이 코트 어디 거예요? 핏이 너무 예쁘다'
    WHEN main_category = '아우터' AND c_rn = 2 AND item_rn = 1 THEN '저도 비슷한 거 찾고 있었는데 혹시 사이즈 어떻게 입으셨어요?'
    WHEN main_category = '아우터' AND c_rn = 1 AND item_rn = 2 THEN '오버핏으로 입으면 진짜 예쁠 것 같아요 🤍'
    WHEN main_category = '아우터' AND c_rn = 2 AND item_rn = 2 THEN '이 색 실물도 이렇게 예뻐요? 사진에서 너무 잘 나왔다'
    WHEN main_category = '아우터' AND c_rn = 1 AND item_rn = 3 THEN '이거 지난 시즌 거 아닌가요? 저도 갖고 있어요 ㅋㅋ'
    WHEN main_category = '아우터' AND c_rn = 2 AND item_rn = 3 THEN '상태 어때요? 직거래 가능하신가요'
    -- 상의 댓글
    WHEN main_category = '상의' AND c_rn = 1 AND item_rn = 1 THEN '이 니트 따뜻해요? 소재가 어떻게 되는지 궁금해서요'
    WHEN main_category = '상의' AND c_rn = 2 AND item_rn = 1 THEN '색이 진짜 예쁘다 실물은 더 예쁘겠다'
    WHEN main_category = '상의' AND c_rn = 1 AND item_rn = 2 THEN '이거 키 몇에 입으신 거예요? 저 165인데 잘 맞을지'
    WHEN main_category = '상의' AND c_rn = 2 AND item_rn = 2 THEN '오 이 브랜드 퀄이 좋더라고요 잘 샀다'
    WHEN main_category = '상의' AND c_rn = 1 AND item_rn = 3 THEN '이런 기본템 하나씩은 꼭 있어야 하는데'
    WHEN main_category = '상의' AND c_rn = 2 AND item_rn = 3 THEN '세탁은 손빨래만 되나요?'
    -- 하의 댓글
    WHEN main_category = '하의' AND c_rn = 1 AND item_rn = 1 THEN '이 팬츠 허리 사이즈 어떻게 되나요? 27이면 맞을까요'
    WHEN main_category = '하의' AND c_rn = 2 AND item_rn = 1 THEN '데님 색이 딱 제가 찾던 워싱이에요 ✨'
    WHEN main_category = '하의' AND c_rn = 1 AND item_rn = 2 THEN '와이드 핏인가요? 루즈하게 입으면 예쁘겠다'
    WHEN main_category = '하의' AND c_rn = 2 AND item_rn = 2 THEN '이거 착용샷 있으면 볼 수 있을까요'
    WHEN main_category = '하의' AND c_rn = 1 AND item_rn = 3 THEN '슬랙스 라인이 너무 깔끔하다 어디 브랜드예요?'
    WHEN main_category = '하의' AND c_rn = 2 AND item_rn = 3 THEN '새 거 같은데 왜 파세요? 아깝다'
    -- 원피스 댓글
    WHEN main_category = '원피스' AND c_rn = 1 THEN '이 원피스 봄에 딱이겠다 🌸 가격 협의 돼요?'
    WHEN main_category = '원피스' AND c_rn = 2 THEN '착용하면 어디까지 오나요? 키 163이에요'
    -- 신발 댓글
    WHEN main_category = '신발' AND c_rn = 1 AND item_rn = 1 THEN '이 사이즈 발볼 넓은 편도 괜찮나요?'
    WHEN main_category = '신발' AND c_rn = 2 AND item_rn = 1 THEN '굽 높이가 얼마나 돼요? 사진에서 잘 안 보여서'
    WHEN main_category = '신발' AND c_rn = 1 AND item_rn = 2 THEN '이 신발 진짜 갖고 싶었던 건데 ㅠ'
    WHEN main_category = '신발' AND c_rn = 2 AND item_rn = 2 THEN '이거 한 시즌만 신으셨나요? 상태 사진 더 볼 수 있을까요'
    -- 가방 댓글
    WHEN main_category = '가방' AND c_rn = 1 THEN '안쪽 공간 얼마나 돼요? A4 들어가나요'
    WHEN main_category = '가방' AND c_rn = 2 THEN '이 가방 실사용 기간이 어떻게 되나요? 스크래치 있나요'
    -- 액세서리 댓글
    WHEN main_category = '액세서리' AND c_rn = 1 THEN '이 목걸이 소재가 뭔가요? 알레르기 있어서요'
    WHEN main_category = '액세서리' AND c_rn = 2 THEN '귀엽다 어디서 샀어요?'
    -- 기본 fallback (카테고리 불일치 시)
    WHEN c_rn = 1 THEN '상태 좋아 보여요! 혹시 가격 네고 가능한가요?'
    WHEN c_rn = 2 THEN '이 아이템 저도 관심 있어요 DM 드려도 될까요?'
    ELSE '좋아요 눌렀어요 🤍'
  END,
  NOW() - ((item_rn * 3 + c_rn) || ' hours')::interval
FROM commenter_pool
WHERE c_rn <= 2  -- 아이템당 최대 댓글 2개
  AND NOT EXISTS (
    SELECT 1 FROM comments c
    WHERE c.item_id = commenter_pool.item_id
      AND c.user_id = commenter_pool.commenter_id
  );

-- 결과 확인
SELECT ci.name, ci.main_category, COUNT(c.id) AS comment_count
FROM clothing_items ci
LEFT JOIN comments c ON c.item_id = ci.id
WHERE ci.user_id IN (SELECT id FROM auth.users WHERE email LIKE '%demo@trunkroom.app')
  AND ci.is_public = true
GROUP BY ci.id, ci.name, ci.main_category
ORDER BY ci.main_category, comment_count DESC;
