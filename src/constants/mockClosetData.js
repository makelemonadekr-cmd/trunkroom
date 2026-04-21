// ─── Reusable image pool (replace URLs with real product images later) ────────
const IMG = {
  // Tops
  whiteTee:    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&q=75&fit=crop",
  stripedTee:  "https://images.unsplash.com/photo-1583744946564-b52d5a0ebe68?w=300&q=75&fit=crop",
  knitTop:     "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300&q=75&fit=crop",
  blouse:      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=300&q=75&fit=crop",
  blouse2:     "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300&q=75&fit=crop",
  rustTop:     "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=300&q=75&fit=crop",
  beigeTop:    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&q=75&fit=crop",
  // Bottoms
  denim:       "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=300&q=75&fit=crop",
  widePants:   "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&q=75&fit=crop",
  trousers:    "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=300&q=75&fit=crop",
  skirt:       "https://images.unsplash.com/photo-1548549557-dbe9946621da?w=300&q=75&fit=crop",
  // Outers
  trench:      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=300&q=75&fit=crop",
  blazer:      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&q=75&fit=crop",
  streetJkt:   "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=300&q=75&fit=crop",
  // Dresses
  florDress:   "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=75&fit=crop",
  dotDress:    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=300&q=75&fit=crop",
  // Misc lifestyle (for bags, shoes, acc)
  lifestyle1:  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&q=75&fit=crop",
  lifestyle2:  "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=300&q=75&fit=crop",
};

// ─── Main categories ──────────────────────────────────────────────────────────
export const MAIN_CATEGORIES = [
  { id: "상의",     label: "상의",     emoji: "👕" },
  { id: "하의",     label: "하의",     emoji: "👖" },
  { id: "아우터",   label: "아우터",   emoji: "🧥" },
  { id: "원피스",   label: "원피스",   emoji: "👗" },
  { id: "신발",     label: "신발",     emoji: "👟" },
  { id: "가방",     label: "가방",     emoji: "👜" },
  { id: "액세서리", label: "액세서리", emoji: "💍" },
  { id: "스포츠",   label: "스포츠",   emoji: "🎽" },
];

// ─── 10 subcategories per main category ──────────────────────────────────────
export const SUBCATEGORIES = {
  상의:     ["반팔 티셔츠", "긴팔 티셔츠", "셔츠", "블라우스", "니트/스웨터", "후드티", "맨투맨", "탱크탑", "가디건", "크롭탑"],
  하의:     ["청바지",     "슬랙스",     "반바지",   "트레이닝 팬츠", "미니스커트", "미디스커트", "맥시스커트", "와이드팬츠", "레깅스", "조거팬츠"],
  아우터:   ["트렌치코트", "울 코트",    "패딩",    "블레이저",     "점퍼",      "다운재킷",   "체크코트",   "오버핏코트",  "레더재킷", "후리스"],
  원피스:   ["미니 원피스", "미디 원피스", "맥시 원피스", "니트 원피스", "셔츠 원피스", "플리츠 원피스", "점프수트", "원숄더",   "민소매 원피스", "캐주얼 원피스"],
  신발:     ["스니커즈",  "로퍼",      "힐/펌프스", "앵클 부츠",  "샌들",     "뮬",        "옥스퍼드",  "슬리퍼",   "플랫폼",   "스포츠 샌들"],
  가방:     ["숄더백",   "크로스백",   "토트백",   "클러치",     "백팩",     "버킷백",     "핸드백",   "에코백",   "파우치",   "미니백"],
  액세서리: ["목걸이",   "귀걸이",    "반지",    "선글라스",   "벨트",     "헤어밴드",   "스카프",   "모자",    "시계",    "팔찌"],
  스포츠:   ["스포츠 레깅스", "스포츠 브라", "트레이닝 재킷", "러닝화", "요가복", "압박 반바지", "윈드브레이커", "스포츠 티셔츠", "스포츠 양말", "헤드밴드"],
};

// ─── Tag → style mapping (for auto-deriving styleTags from existing tags) ─────
const _TAG_STYLE_MAP = {
  // 미니멀
  "미니멀": "미니멀", "베이직": "미니멀", "클래식": "미니멀", "타임리스": "미니멀",
  "린넨": "미니멀", "슬림": "미니멀", "리브드": "미니멀",
  // 캐주얼
  "캐주얼": "캐주얼", "데일리": "캐주얼", "레이어드": "캐주얼", "코튼": "캐주얼",
  "집업": "캐주얼", "와이드": "캐주얼",
  // 페미닌
  "페미닌": "페미닌", "로맨틱": "페미닌", "플로럴": "페미닌", "러플": "페미닌",
  "실크": "페미닌", "사틴": "페미닌", "스퀘어넥": "페미닌", "크롭": "페미닌",
  "타이 프론트": "페미닌",
  // 스트릿
  "스트릿": "스트릿", "오버핏": "스트릿", "그래픽": "스트릿", "나일론": "스트릿",
  "보머": "스트릿", "라이더스": "스트릿", "엣지": "스트릿",
  // 오피스룩
  "오피스": "오피스룩", "세미포멀": "오피스룩", "테일러드": "오피스룩",
  "더블브레스트": "오피스룩", "더블": "오피스룩", "포멀": "오피스룩",
  "플리츠": "오피스룩",
  // 스포티
  "스포티": "스포티", "액티브": "스포티", "기능성": "스포티", "압박": "스포티",
  "방풍": "스포티", "메시": "스포티",
  // 빈티지
  "빈티지": "빈티지", "레트로": "빈티지", "체크": "빈티지", "데님": "빈티지",
  // Y2K
  "Y2K": "Y2K", "트렌디": "Y2K", "볼륨": "Y2K",
  // 주말룩 / 캐주얼 extras
  "케이블": "캐주얼", "립": "캐주얼", "보디핏": "캐주얼",
  "하이라이즈": "캐주얼", "울": "미니멀", "테리": "캐주얼",
  "럭셔리": "모던시크", "다운": "미니멀", "경량": "미니멀",
  "요가": "스포티", "편안함": "스포티",
  // 모던시크
  "시크": "모던시크", "드라마틱": "모던시크", "우아한": "모던시크",
  // 여행룩 / 리조트
  "이브닝": "하객룩", "파티": "하객룩",
};

function _deriveStyleTags(tags) {
  const seen = new Set();
  const result = [];
  for (const tag of (tags ?? [])) {
    const style = _TAG_STYLE_MAP[tag];
    if (style && !seen.has(style)) {
      seen.add(style);
      result.push(style);
    }
    if (result.length >= 2) break;
  }
  return result;
}

// ─── Item factory ─────────────────────────────────────────────────────────────
let _uid = 1;
/**
 * @param {string} name
 * @param {string} brand
 * @param {string} category
 * @param {string} subcategory
 * @param {string} image
 * @param {string} color
 * @param {string} size
 * @param {string|string[]} season
 * @param {string[]} tags
 * @param {number} [price=0]
 * @param {boolean} [isForSale=false]
 * @param {{ condition?: string, wearCount?: number, lastWornAt?: string|null, hasBox?: boolean }} [opts={}]
 */
function mk(name, brand, category, subcategory, image, color, size, season, tags, price = 0, isForSale = false, opts = {}) {
  return {
    id:           `item-${_uid++}`,
    // ── New schema fields ──
    displayName:  name,
    mainCategory: category,
    subCategory:  subcategory,
    styleTags:    _deriveStyleTags(tags),
    // ── Legacy fields (kept for backward compat) ──
    name,
    brand,
    category,
    subcategory,
    image,
    color,
    size,
    season:       Array.isArray(season) ? season : [season],
    tags,
    price,
    isForSale,
    condition:    opts.condition  ?? "상태 좋음",
    wearCount:    opts.wearCount  ?? 0,
    lastWornAt:   opts.lastWornAt ?? null,
    hasBox:       opts.hasBox     ?? false,
    source:       "manual",
    createdAt:    "2024-01-01",
    updatedAt:    "2024-01-01",
    description:  `${brand} ${name}`,
  };
}

// ─── CLOSET_ITEMS — flat array (replace with backend data later) ───────────────
export const CLOSET_ITEMS = [
  // ──────────────────────────────── 상의 ─────────────────────────────────────
  // 반팔 티셔츠
  mk("클래식 화이트 반팔",   "UNIQLO",          "상의", "반팔 티셔츠", IMG.whiteTee,   "화이트", "M",  ["봄","여름"], ["베이직","데일리"]),
  mk("오버핏 블랙 반팔",    "MUSINSA STD",     "상의", "반팔 티셔츠", IMG.whiteTee,   "블랙",   "L",  ["봄","여름"], ["오버핏","스트릿"]),
  mk("스트라이프 반팔",     "GAP",             "상의", "반팔 티셔츠", IMG.stripedTee, "네이비", "S",  ["봄","여름"], ["스트라이프","캐주얼"]),
  mk("그래픽 프린트 반팔",  "STUSSY",          "상의", "반팔 티셔츠", IMG.whiteTee,   "그레이", "M",  ["여름"],     ["그래픽","스트릿"]),
  mk("리넨 혼방 반팔",     "COS",             "상의", "반팔 티셔츠", IMG.beigeTop,   "베이지", "M",  ["여름"],     ["린넨","미니멀"]),

  // 긴팔 티셔츠
  mk("머슬핏 긴팔",        "MUSINSA STD",     "상의", "긴팔 티셔츠", IMG.whiteTee,   "화이트", "M",  ["봄","가을"], ["피티드","베이직"]),
  mk("오버핏 헤비 긴팔",   "REPRESENT",       "상의", "긴팔 티셔츠", IMG.stripedTee, "블랙",   "L",  ["봄","가을"], ["오버핏","헤비웨이트"]),
  mk("스트라이프 긴팔",    "UNIQLO",          "상의", "긴팔 티셔츠", IMG.beigeTop,   "네이비", "S",  ["봄","가을"], ["스트라이프","캐주얼"]),
  mk("코튼 슬림 긴팔",     "ZARA",            "상의", "긴팔 티셔츠", IMG.whiteTee,   "그레이", "M",  ["봄","가을"], ["슬림핏","데일리"]),
  mk("터틀넥 긴팔",        "COS",             "상의", "긴팔 티셔츠", IMG.knitTop,    "크림",   "S",  ["가을","겨울"],["터틀넥","미니멀"]),

  // 셔츠
  mk("화이트 오버핏 셔츠", "MUSINSA STD",     "상의", "셔츠",       IMG.blouse2,    "화이트", "M",  ["봄","가을"], ["오버핏","데일리"]),
  mk("체크 패턴 셔츠",     "POLO RL",         "상의", "셔츠",       IMG.blouse2,    "블루",   "M",  ["봄","가을"], ["체크","캐주얼"]),
  mk("린넨 셔츠",          "H&M",             "상의", "셔츠",       IMG.blouse2,    "베이지", "M",  ["봄","여름"], ["린넨","캐주얼"]),
  mk("옥스포드 셔츠",      "BROOKS BROS",     "상의", "셔츠",       IMG.blouse2,    "화이트", "M",  ["봄","가을"], ["클래식","오피스"]),

  // 블라우스
  mk("실크 브이넥 블라우스","SANDRO",          "상의", "블라우스",    IMG.blouse,     "아이보리","S", ["봄","여름"], ["실크","페미닌"]),
  mk("플로럴 블라우스",    "& OTHER STORIES", "상의", "블라우스",    IMG.blouse,     "플로럴", "S",  ["봄","여름"], ["플로럴","페미닌"]),
  mk("러플 블라우스",      "MAJE",            "상의", "블라우스",    IMG.beigeTop,   "크림",   "XS", ["봄"],       ["러플","로맨틱"]),
  mk("시스루 블라우스",    "ZARA",            "상의", "블라우스",    IMG.blouse2,    "화이트", "S",  ["봄","여름"], ["시스루","트렌디"]),

  // 니트/스웨터
  mk("메리노울 크루넥",    "UNIQLO",          "상의", "니트/스웨터", IMG.knitTop,    "오트밀", "M",  ["가을","겨울"],["울","베이직"]),
  mk("케이블 니트",        "ARKET",           "상의", "니트/스웨터", IMG.stripedTee, "아이보리","S", ["가을","겨울"],["케이블","볼륨"]),
  mk("알파카 오버핏 니트", "& OTHER STORIES", "상의", "니트/스웨터", IMG.beigeTop,   "베이지", "M",  ["가을","겨울"],["알파카","오버핏"]),
  mk("컬러블록 니트",      "ALAND",           "상의", "니트/스웨터", IMG.knitTop,    "멀티",   "M",  ["가을","겨울"],["컬러블록","트렌디"]),
  mk("리브드 슬림 니트",   "COS",             "상의", "니트/스웨터", IMG.knitTop,    "그레이", "S",  ["가을","겨울"],["리브드","슬림"]),

  // 후드티
  mk("오버핏 기모 후드",   "MUSINSA STD",     "상의", "후드티",      IMG.whiteTee,   "블랙",   "L",  ["가을","겨울"],["오버핏","기모"]),
  mk("심플 후드 집업",     "CHAMPION",        "상의", "후드티",      IMG.stripedTee, "그레이", "M",  ["봄","가을"], ["집업","스포티"]),
  mk("크롭 후드티",        "ADIDAS",          "상의", "후드티",      IMG.beigeTop,   "화이트", "S",  ["봄","가을"], ["크롭","스포티"]),

  // 맨투맨
  mk("베이직 맨투맨",      "CHAMPION",        "상의", "맨투맨",      IMG.whiteTee,   "그레이", "M",  ["봄","가을","겨울"],["베이직","캐주얼"]),
  mk("아치 로고 맨투맨",   "TOMMY",           "상의", "맨투맨",      IMG.stripedTee, "네이비", "M",  ["봄","가을"], ["로고","캐주얼"]),
  mk("오버핏 크루넥 스웻", "STUSSY",          "상의", "맨투맨",      IMG.beigeTop,   "블랙",   "L",  ["봄","가을"], ["오버핏","스트릿"]),

  // 탱크탑
  mk("립 슬리브리스",      "SKIMS",           "상의", "탱크탑",      IMG.rustTop,    "베이지", "S",  ["여름"],     ["립","보디핏"]),
  mk("코튼 나시",          "UNIQLO",          "상의", "탱크탑",      IMG.beigeTop,   "화이트", "M",  ["봄","여름"], ["베이직","레이어드"]),
  mk("스퀘어넥 탑",        "ZARA",            "상의", "탱크탑",      IMG.rustTop,    "블랙",   "S",  ["봄","여름"], ["스퀘어넥","페미닌"]),

  // 가디건
  mk("오버핏 롱 가디건",   "ARKET",           "상의", "가디건",      IMG.beigeTop,   "베이지", "M",  ["봄","가을"], ["롱","레이어드"]),
  mk("크롭 버튼 가디건",   "& OTHER STORIES", "상의", "가디건",      IMG.knitTop,    "크림",   "S",  ["봄","가을"], ["크롭","페미닌"]),
  mk("집업 가디건",        "UNIQLO",          "상의", "가디건",      IMG.knitTop,    "그레이", "M",  ["봄","가을","겨울"],["집업","캐주얼"]),

  // 크롭탑
  mk("코튼 크롭 탑",       "ZARA",            "상의", "크롭탑",      IMG.rustTop,    "화이트", "S",  ["봄","여름"], ["크롭","캐주얼"]),
  mk("넥타이 크롭",        "MAJE",            "상의", "크롭탑",      IMG.beigeTop,   "블랙",   "XS", ["봄","여름"], ["타이 프론트","트렌디"]),

  // ──────────────────────────────── 하의 ─────────────────────────────────────
  // 청바지
  mk("스트레이트 데님",    "LEVIS",           "하의", "청바지",      IMG.denim,      "라이트블루","M", ["봄","가을","겨울"],["스트레이트","베이직"]),
  mk("와이드 워시드 데님", "MUSINSA STD",     "하의", "청바지",      IMG.denim,      "미디엄블루","L", ["봄","가을"],      ["와이드","트렌디"]),
  mk("슬림 스키니 데님",  "ZARA",            "하의", "청바지",      IMG.denim,      "다크인디고","S", ["가을","겨울"],    ["슬림","베이직"]),
  mk("스트레치 하이라이즈","COS",             "하의", "청바지",      IMG.denim,      "블랙",  "S",   ["봄","가을"],      ["하이라이즈","핏"]),
  mk("배럴핏 데님",        "LEVIS",           "하의", "청바지",      IMG.denim,      "라이트블루","M", ["봄","가을"],     ["배럴핏","트렌디"]),

  // 슬랙스
  mk("와이드 슬랙스",      "COS",             "하의", "슬랙스",      IMG.trousers,   "베이지", "M",  ["봄","가을"],      ["와이드","오피스"]),
  mk("테이퍼드 슬랙스",   "ZARA",            "하의", "슬랙스",      IMG.trousers,   "블랙",   "S",  ["봄","가을","겨울"],["테이퍼드","오피스"]),
  mk("스트라이프 슬랙스", "SANDRO",          "하의", "슬랙스",      IMG.trousers,   "네이비", "M",  ["봄","가을"],      ["스트라이프","세미포멀"]),
  mk("플리츠 슬랙스",     "ARKET",           "하의", "슬랙스",      IMG.trousers,   "오트밀", "M",  ["봄","가을"],      ["플리츠","미니멀"]),
  mk("울 혼방 슬랙스",    "COS",             "하의", "슬랙스",      IMG.trousers,   "그레이", "M",  ["가을","겨울"],    ["울","클래식"]),

  // 반바지
  mk("데님 반바지",        "LEVIS",           "하의", "반바지",      IMG.denim,      "라이트블루","S", ["여름"],          ["데님","캐주얼"]),
  mk("린넨 반바지",        "H&M",             "하의", "반바지",      IMG.trousers,   "베이지", "M",  ["여름"],          ["린넨","캐주얼"]),
  mk("스포티 반바지",      "ADIDAS",          "하의", "반바지",      IMG.trousers,   "블랙",   "M",  ["봄","여름"],     ["스포티","액티브"]),

  // 미니스커트
  mk("플리츠 미니스커트",  "ARKET",           "하의", "미니스커트",  IMG.skirt,      "블랙",   "S",  ["봄","여름"],     ["플리츠","미니멀"]),
  mk("플로럴 미니",        "MAJE",            "하의", "미니스커트",  IMG.skirt,      "플로럴", "XS", ["봄","여름"],     ["플로럴","페미닌"]),
  mk("체크 미니스커트",    "& OTHER STORIES", "하의", "미니스커트",  IMG.skirt,      "체크",   "S",  ["봄","가을"],     ["체크","트렌디"]),
  mk("레더 미니스커트",    "ZARA",            "하의", "미니스커트",  IMG.skirt,      "블랙",   "S",  ["가을","겨울"],   ["레더","엣지"]),

  // 미디스커트
  mk("사틴 미디스커트",    "SANDRO",          "하의", "미디스커트",  IMG.skirt,      "블러쉬", "S",  ["봄","여름"],     ["사틴","페미닌"]),
  mk("플리츠 미디",        "COS",             "하의", "미디스커트",  IMG.skirt,      "오트밀", "M",  ["봄","여름","가을"],["플리츠","미니멀"]),
  mk("니트 미디스커트",    "ARKET",           "하의", "미디스커트",  IMG.skirt,      "카멜",   "S",  ["가을","겨울"],   ["니트","레이어드"]),

  // 와이드팬츠
  mk("와이드 리넨 팬츠",   "COS",             "하의", "와이드팬츠",  IMG.widePants,  "베이지", "M",  ["봄","여름"],     ["린넨","와이드"]),
  mk("와이드 울 팬츠",     "ARKET",           "하의", "와이드팬츠",  IMG.widePants,  "그레이", "M",  ["가을","겨울"],   ["울","볼륨"]),
  mk("와이드 코튼 팬츠",   "MUSINSA STD",     "하의", "와이드팬츠",  IMG.widePants,  "블랙",   "L",  ["봄","가을"],     ["코튼","캐주얼"]),
  mk("팔라조 팬츠",        "ZARA",            "하의", "와이드팬츠",  IMG.widePants,  "화이트", "S",  ["봄","여름"],     ["팔라조","페미닌"]),

  // 트레이닝 팬츠
  mk("기모 조거팬츠",      "CHAMPION",        "하의", "트레이닝 팬츠",IMG.trousers,  "그레이", "M",  ["가을","겨울"],   ["기모","스포티"]),
  mk("슬림 트레이닝",      "ADIDAS",          "하의", "트레이닝 팬츠",IMG.trousers,  "블랙",   "M",  ["봄","가을"],     ["슬림","액티브"]),

  // 레깅스
  mk("코튼 스키니 레깅스", "UNIQLO",          "하의", "레깅스",      IMG.denim,      "블랙",   "S",  ["봄","가을","겨울"],["스키니","레이어드"]),
  mk("와이드 레깅스",      "ZARA",            "하의", "레깅스",      IMG.denim,      "네이비", "S",  ["가을","겨울"],   ["와이드","캐주얼"]),

  // 조거팬츠
  mk("테리 조거팬츠",      "A.P.C",           "하의", "조거팬츠",    IMG.trousers,   "오트밀", "M",  ["봄","가을"],     ["테리","스포티-럭셔리"]),
  mk("테이퍼드 조거",      "STUSSY",          "하의", "조거팬츠",    IMG.trousers,   "블랙",   "L",  ["봄","가을"],     ["테이퍼드","스트릿"]),

  // 맥시스커트
  mk("사틴 맥시스커트",    "TOTEME",          "하의", "맥시스커트",  IMG.skirt,      "블랙",   "S",  ["봄","여름","가을"],["사틴","우아한"]),
  mk("플로럴 맥시",        "MAJE",            "하의", "맥시스커트",  IMG.skirt,      "플로럴", "S",  ["봄","여름"],     ["플로럴","로맨틱"]),

  // ──────────────────────────────── 아우터 ────────────────────────────────────
  // 트렌치코트
  mk("클래식 트렌치",      "BURBERRY",        "아우터", "트렌치코트",  IMG.trench,   "카멜",   "M",  ["봄","가을"],     ["클래식","타임리스"], 380000),
  mk("오버핏 트렌치",      "TOTEME",          "아우터", "트렌치코트",  IMG.trench,   "베이지", "M",  ["봄","가을"],     ["오버핏","트렌디"],   198000),
  mk("미디 트렌치코트",    "COS",             "아우터", "트렌치코트",  IMG.trench,   "그레이", "S",  ["봄","가을"],     ["미디","미니멀"],     89000),
  mk("롱 트렌치코트",      "ZARA",            "아우터", "트렌치코트",  IMG.trench,   "카멜",   "M",  ["봄","가을"],     ["롱","클래식"],       69000),

  // 울 코트
  mk("싱글 울 코트",       "ARKET",           "아우터", "울 코트",     IMG.trench,   "카멜",   "M",  ["가을","겨울"],   ["울","클래식"],       245000),
  mk("더블 브레스트 코트", "SANDRO",          "아우터", "울 코트",     IMG.trench,   "블랙",   "S",  ["가을","겨울"],   ["더블브레스트","세미포멀"], 320000),
  mk("오버핏 울 코트",     "COS",             "아우터", "울 코트",     IMG.trench,   "오트밀", "M",  ["가을","겨울"],   ["오버핏","미니멀"],   195000),
  mk("체크 울 코트",       "MAX MARA",        "아우터", "울 코트",     IMG.trench,   "체크",   "S",  ["가을","겨울"],   ["체크","클래식"],     420000),

  // 패딩
  mk("숏 패딩",            "MONCLER",         "아우터", "패딩",        IMG.streetJkt,"블랙",   "M",  ["겨울"],          ["숏","럭셔리"],       850000),
  mk("롱 패딩",            "NORTHFACE",       "아우터", "패딩",        IMG.streetJkt,"블랙",   "M",  ["겨울"],          ["롱","기능성"],       320000),
  mk("슬림 다운 패딩",     "UNIQLO",          "아우터", "패딩",        IMG.streetJkt,"네이비", "M",  ["가을","겨울"],   ["슬림","베이직"],     89000),
  mk("오버핏 패딩",        "HUFLAND",         "아우터", "패딩",        IMG.streetJkt,"블루",   "L",  ["겨울"],          ["오버핏","스트릿"],   145000),

  // 블레이저
  mk("테일러드 블레이저",  "COS",             "아우터", "블레이저",    IMG.blazer,   "블랙",   "S",  ["봄","가을"],     ["테일러드","오피스"],  98000),
  mk("오버핏 블레이저",    "ZARA",            "아우터", "블레이저",    IMG.blazer,   "베이지", "M",  ["봄","가을"],     ["오버핏","캐주얼"],    79000),
  mk("더블 블레이저",      "MAJE",            "아우터", "블레이저",    IMG.blazer,   "네이비", "S",  ["봄","가을"],     ["더블","세미포멀"],   145000),
  mk("체크 블레이저",      "ARKET",           "아우터", "블레이저",    IMG.blazer,   "체크",   "M",  ["봄","가을"],     ["체크","트렌디"],      89000),

  // 점퍼
  mk("나일론 집업 점퍼",   "STUSSY",          "아우터", "점퍼",        IMG.streetJkt,"블랙",   "L",  ["봄","가을"],     ["나일론","스트릿"],    95000),
  mk("데님 재킷",          "LEVIS",           "아우터", "점퍼",        IMG.streetJkt,"라이트블루","M", ["봄","가을"],  ["데님","클래식"],       79000),
  mk("보머 재킷",          "ALAND",           "아우터", "점퍼",        IMG.streetJkt,"올리브",  "M", ["봄","가을"],     ["보머","캐주얼"],       65000),

  // 레더재킷
  mk("라이더스 레더",      "ALLSAINTS",       "아우터", "레더재킷",    IMG.streetJkt,"블랙",   "M",  ["가을","겨울"],   ["라이더스","엣지"],   320000),
  mk("크롭 레더재킷",      "ZARA",            "아우터", "레더재킷",    IMG.streetJkt,"블랙",   "S",  ["봄","가을"],     ["크롭","트렌디"],       89000),

  // 다운재킷
  mk("경량 다운 조끼",     "UNIQLO",          "아우터", "다운재킷",    IMG.streetJkt,"블랙",   "M",  ["가을","겨울"],   ["다운","경량"],        69000),
  mk("롱 다운 파카",       "CANADA GOOSE",    "아우터", "다운재킷",    IMG.streetJkt,"카키",   "M",  ["겨울"],          ["파카","기능성"],     980000),

  // 오버핏코트
  mk("오버핏 맥코트",      "TOTEME",          "아우터", "오버핏코트",  IMG.trench,   "블랙",   "M",  ["가을","겨울"],   ["오버핏","시크"],     298000),
  mk("더블 오버핏코트",    "COS",             "아우터", "오버핏코트",  IMG.trench,   "카멜",   "M",  ["가을","겨울"],   ["더블","볼륨"],       178000),

  // ──────────────────────────────── 원피스 ────────────────────────────────────
  // 미니 원피스
  mk("플로럴 미니 원피스", "MAJE",            "원피스","미니 원피스",  IMG.florDress, "플로럴","XS",  ["봄","여름"],     ["플로럴","페미닌"],    89000),
  mk("리넨 미니 원피스",   "ARKET",           "원피스","미니 원피스",  IMG.florDress, "화이트","S",   ["봄","여름"],     ["린넨","캐주얼"],       65000),
  mk("체크 셔츠 미니",     "SANDRO",          "원피스","미니 원피스",  IMG.dotDress,  "체크",  "S",   ["봄","가을"],     ["체크","캐주얼"],       75000),

  // 미디 원피스
  mk("플로럴 미디 드레스", "MAJE",            "원피스","미디 원피스",  IMG.florDress, "플로럴","XS",  ["봄","여름"],     ["플로럴","로맨틱"],    89000),
  mk("사틴 미디 드레스",   "SANDRO",          "원피스","미디 원피스",  IMG.dotDress,  "블랙",  "S",   ["봄","여름","가을"],["사틴","시크"],       115000),
  mk("니트 미디 드레스",   "COS",             "원피스","미디 원피스",  IMG.florDress, "베이지","M",   ["가을","겨울"],   ["니트","미니멀"],       88000),
  mk("슬립 미디 드레스",   "ARKET",           "원피스","미디 원피스",  IMG.dotDress,  "크림",  "S",   ["봄","여름"],     ["슬립","미니멀"],       79000),

  // 맥시 원피스
  mk("플로럴 맥시 드레스", "& OTHER STORIES", "원피스","맥시 원피스",  IMG.florDress, "플로럴","S",   ["봄","여름"],     ["플로럴","로맨틱"],    98000),
  mk("사틴 맥시 드레스",   "TOTEME",          "원피스","맥시 원피스",  IMG.dotDress,  "블랙",  "S",   ["봄","여름","가을"],["사틴","드라마틱"],  245000),

  // 점프수트
  mk("린넨 점프수트",      "COS",             "원피스","점프수트",     IMG.dotDress,  "베이지","M",   ["봄","여름"],     ["린넨","캐주얼"],       75000),
  mk("슬림 점프수트",      "ZARA",            "원피스","점프수트",     IMG.florDress, "블랙",  "S",   ["봄","가을"],     ["슬림","오피스"],       65000),

  // 니트 원피스
  mk("리브드 니트 드레스", "ARKET",           "원피스","니트 원피스",  IMG.knitTop,   "크림",  "S",   ["가을","겨울"],   ["리브드","미니멀"],     89000),
  mk("케이블 니트 드레스", "& OTHER STORIES", "원피스","니트 원피스",  IMG.knitTop,   "베이지","M",   ["가을","겨울"],   ["케이블","볼륨"],        75000),

  // ──────────────────────────────── 신발 ─────────────────────────────────────
  mk("에어포스 1 화이트",  "NIKE",            "신발",  "스니커즈",    IMG.lifestyle1,"화이트","250", ["봄","가을"],     ["클래식","스트릿"],     99000),
  mk("올스타 블랙",        "CONVERSE",        "신발",  "스니커즈",    IMG.lifestyle1,"블랙",  "240", ["봄","가을"],     ["클래식","캐주얼"],     79000),
  mk("아디다스 삼바",      "ADIDAS",          "신발",  "스니커즈",    IMG.lifestyle2,"화이트","245", ["봄","가을"],     ["레트로","트렌디"],     99000),
  mk("뉴발란스 530",       "NEW BALANCE",     "신발",  "스니커즈",    IMG.lifestyle1,"실버",  "250", ["봄","가을"],     ["청키","캐주얼"],        89000),
  mk("탄 로퍼",            "GUCCI",           "신발",  "로퍼",        IMG.lifestyle2,"블랙",  "245", ["봄","가을"],     ["클래식","오피스"],    320000),
  mk("소호 로퍼",          "COS",             "신발",  "로퍼",        IMG.lifestyle1,"카멜",  "240", ["봄","가을"],     ["미니멀","오피스"],     89000),
  mk("킬힐 블랙 펌프스",   "ZARA",            "신발",  "힐/펌프스",   IMG.lifestyle2,"블랙",  "245", ["봄","가을"],     ["클래식","포멀"],        65000),
  mk("앵클 부츠",          "TOTEME",          "신발",  "앵클 부츠",   IMG.lifestyle1,"블랙",  "245", ["가을","겨울"],   ["미니멀","클래식"],    145000),
  mk("청키 스트랩 샌들",   "MANGO",           "신발",  "샌들",        IMG.lifestyle2,"누드",  "240", ["봄","여름"],     ["청키","캐주얼"],        59000),

  // ──────────────────────────────── 가방 ─────────────────────────────────────
  mk("레더 숄더백",        "POLENE",          "가방",  "숄더백",      IMG.lifestyle2,"카멜",  "FREE",["봄","가을"],     ["레더","미니멀"],      245000),
  mk("미니 크로스백",      "CHARLES&KEITH",   "가방",  "크로스백",    IMG.lifestyle1,"블랙",  "FREE",["봄","가을","겨울"],["미니","데일리"],       59000),
  mk("캔버스 토트백",      "A.P.C",           "가방",  "토트백",      IMG.lifestyle2,"내추럴","FREE",["봄","여름"],     ["캔버스","캐주얼"],    145000),
  mk("이브닝 클러치",      "MANGO",           "가방",  "클러치",      IMG.lifestyle1,"골드",  "FREE",["봄","여름"],     ["이브닝","파티"],        49000),
  mk("가죽 백팩",          "COS",             "가방",  "백팩",        IMG.lifestyle2,"블랙",  "FREE",["봄","가을","겨울"],["가죽","미니멀"],      125000),

  // ──────────────────────────────── 액세서리 ──────────────────────────────────
  mk("골드 레이어드 목걸이","MANGO",           "액세서리","목걸이",    IMG.lifestyle1,"골드",  "FREE",["봄","여름"],     ["레이어드","심플"],     29000),
  mk("진주 귀걸이",         "ZARA",           "액세서리","귀걸이",    IMG.lifestyle2,"화이트", "FREE",["봄","여름"],    ["진주","클래식"],        25000),
  mk("빅 선글라스",         "GENTLE MONSTER", "액세서리","선글라스",  IMG.lifestyle1,"블랙",  "FREE",["봄","여름"],     ["오버사이즈","시크"],  198000),
  mk("와이드 레더 벨트",    "COS",            "액세서리","벨트",      IMG.lifestyle2,"블랙",  "FREE",["봄","가을","겨울"],["와이드","미니멀"],     39000),
  mk("버킷햇",              "KANGOL",         "액세서리","모자",       IMG.lifestyle1,"베이지","FREE",["봄","여름"],     ["버킷","캐주얼"],        55000),

  // ──────────────────────────────── 스포츠 ────────────────────────────────────
  mk("하이웨이스트 레깅스", "LULULEMON",      "스포츠","스포츠 레깅스",IMG.denim,     "블랙",  "S",  ["봄","가을"],     ["하이웨이스트","기능성"],89000),
  mk("스포츠 브라탑",       "LULULEMON",      "스포츠","스포츠 브라", IMG.rustTop,    "블랙",  "S",  ["봄","여름"],     ["메시","스포티"],        65000),
  mk("트랙 재킷",           "ADIDAS",         "스포츠","트레이닝 재킷",IMG.streetJkt, "블랙",  "M",  ["봄","가을"],     ["트랙","스포티"],        79000),
  mk("쿠션 런닝화",         "ASICS",          "스포츠","러닝화",       IMG.lifestyle1,"화이트","250",["봄","가을"],     ["쿠션","기능성"],       135000),
  mk("요가 조거팬츠",       "LULULEMON",      "스포츠","요가복",       IMG.trousers,  "그레이","S",  ["봄","가을"],     ["요가","편안함"],        89000),
  mk("윈드브레이커",        "NORTHFACE",      "스포츠","윈드브레이커", IMG.streetJkt, "블루",  "M",  ["봄","가을"],     ["방풍","기능성"],       145000),
];

// ─── Demo wear / condition overrides ─────────────────────────────────────────
// Applied once at module load. lastWornAt < "2025-04-21" → "1년 이상 미착용"
// (today = 2026-04-21, so anything before 2025-04-21 counts as over 1 year ago)
;(function _applyDemoOverrides() {
  const o = CLOSET_ITEMS;
  [
    // 상의
    [0,  {wearCount:18, lastWornAt:"2026-03-20", condition:"사용감 있음"}],   // 클래식 화이트 반팔
    [1,  {wearCount:4,  lastWornAt:"2024-09-10"}],                           // 오버핏 블랙 반팔 — >1yr
    [2,  {wearCount:0,  lastWornAt:null, hasBox:true, condition:"새상품급"}], // 스트라이프 반팔 — never worn
    [5,  {wearCount:22, lastWornAt:"2026-01-08", condition:"사용감 있음"}],   // 머슬핏 긴팔
    [9,  {wearCount:3,  lastWornAt:"2024-12-20", hasBox:true}],              // 터틀넥 긴팔 — >1yr
    [11, {wearCount:1,  lastWornAt:"2023-11-05"}],                           // 체크 패턴 셔츠 — >1yr (2yr+)
    [14, {wearCount:0,  lastWornAt:null, hasBox:true, condition:"새상품급"}], // 실크 브이넥 블라우스
    [16, {wearCount:2,  lastWornAt:"2024-06-18"}],                           // 러플 블라우스 — >1yr
    [18, {wearCount:9,  lastWornAt:"2025-11-15"}],                           // 메리노울 크루넥 — recent
    [19, {wearCount:0,  lastWornAt:null, condition:"새상품급"}],              // 케이블 니트 — never worn
    [23, {wearCount:30, lastWornAt:"2026-04-01", condition:"사용감 있음"}],   // 오버핏 기모 후드
    [24, {wearCount:0,  lastWornAt:null, hasBox:true, condition:"새상품급"}], // 심플 후드 집업
    [26, {wearCount:35, lastWornAt:"2026-04-18", condition:"사용감 있음"}],   // 베이직 맨투맨
    [28, {wearCount:1,  lastWornAt:"2024-05-20"}],                           // 오버핏 크루넥 스웻 — >1yr
    // 하의
    [37, {wearCount:45, lastWornAt:"2026-04-19", condition:"사용감 있음"}],   // 스트레이트 데님 — #1 worn
    [38, {wearCount:8,  lastWornAt:"2025-10-22"}],                           // 와이드 워시드 데님 — recent
    [39, {wearCount:0,  lastWornAt:null, hasBox:true, condition:"새상품급"}], // 슬림 스키니 데님
    [42, {wearCount:12, lastWornAt:"2025-09-15"}],                           // 와이드 슬랙스 — recent
    [50, {wearCount:3,  lastWornAt:"2024-11-20"}],                           // 플리츠 미니스커트 — >1yr
    [54, {wearCount:1,  lastWornAt:"2023-12-28"}],                           // 사틴 미디스커트 — >1yr
    // 아우터
    [69, {wearCount:6,  lastWornAt:"2025-10-18", hasBox:true}],              // 클래식 트렌치 — seasonal
    [74, {wearCount:0,  lastWornAt:null, hasBox:true, condition:"새상품급"}], // 더블 브레스트 코트
    [77, {wearCount:2,  lastWornAt:"2024-02-15"}],                           // 숏 패딩 — >1yr
    [81, {wearCount:10, lastWornAt:"2026-02-20"}],                           // 테일러드 블레이저
    [88, {wearCount:1,  lastWornAt:"2024-10-30", hasBox:true}],              // 라이더스 레더 — >1yr
    // 원피스
    [94, {wearCount:0,  lastWornAt:null, condition:"새상품급"}],              // 플로럴 미니 원피스
    [98, {wearCount:2,  lastWornAt:"2024-08-15", hasBox:true}],              // 사틴 미디 드레스 — >1yr
    // 신발
    [107,{wearCount:40, lastWornAt:"2026-04-10", condition:"사용감 있음"}],   // 에어포스 1
    [111,{wearCount:1,  lastWornAt:"2024-05-20", hasBox:true}],              // 탄 로퍼 — >1yr
    [114,{wearCount:5,  lastWornAt:"2025-11-30"}],                           // 앵클 부츠 — recent
  ].forEach(([idx, data]) => Object.assign(o[idx], data));
}());

// ─── Helper functions (replace with backend API calls later) ─────────────────

/** All items in a given main category (supports both legacy and new schema) */
export function getItemsByCategory(category) {
  return CLOSET_ITEMS.filter(
    (item) => item.mainCategory === category || item.category === category
  );
}

/** All items in a given subcategory (supports both legacy and new schema) */
export function getItemsBySubcategory(subcategory) {
  return CLOSET_ITEMS.filter(
    (item) => item.subCategory === subcategory || item.subcategory === subcategory
  );
}

/** All items matching a given style tag */
export function getItemsByStyleTag(styleTag) {
  return CLOSET_ITEMS.filter((item) => item.styleTags?.includes(styleTag));
}

/**
 * Weather-based closet outfit recommendation.
 * Returns up to 3 { role, item } pairs from the user's closet that match
 * the weather suggestion. Uses rule-based preference order, no AI needed.
 *
 * @param {object} weather  — result from useWeather() hook
 * @param {array}  items    — CLOSET_ITEMS (or subset)
 * @returns {Array<{role: string, item: object}>}
 */
export function getWeatherRecommendedClosetOutfit(weather, items = CLOSET_ITEMS) {
  if (!weather || !items.length) return [];

  const { temp, conditionCode } = weather;

  // Define preferred outfit roles + subcategory preference order per weather
  let slotPrefs = [];

  if (conditionCode === "rain") {
    slotPrefs = [
      { role: "아우터", subs: ["트렌치코트", "울 코트", "점퍼", "패딩"] },
      { role: "상의",   subs: ["긴팔 티셔츠", "니트/스웨터", "맨투맨"] },
      { role: "하의",   subs: ["슬랙스", "청바지", "와이드팬츠"] },
    ];
  } else if (temp <= 4) {
    slotPrefs = [
      { role: "아우터", subs: ["패딩", "다운재킷", "울 코트", "오버핏코트"] },
      { role: "상의",   subs: ["니트/스웨터", "후드티", "맨투맨", "긴팔 티셔츠"] },
      { role: "하의",   subs: ["슬랙스", "청바지", "트레이닝 팬츠"] },
    ];
  } else if (temp <= 11) {
    slotPrefs = [
      { role: "아우터", subs: ["트렌치코트", "울 코트", "블레이저", "오버핏코트"] },
      { role: "상의",   subs: ["니트/스웨터", "긴팔 티셔츠", "맨투맨", "후드티"] },
      { role: "하의",   subs: ["슬랙스", "청바지", "와이드팬츠"] },
    ];
  } else if (temp <= 19) {
    slotPrefs = [
      { role: "상의",   subs: ["블라우스", "셔츠", "긴팔 티셔츠", "니트/스웨터"] },
      { role: "하의",   subs: ["슬랙스", "미디스커트", "와이드팬츠", "청바지"] },
      { role: "아우터", subs: ["블레이저", "가디건", "트렌치코트"] },
    ];
  } else {
    slotPrefs = [
      { role: "상의",   subs: ["반팔 티셔츠", "블라우스", "크롭탑", "탱크탑"] },
      { role: "하의",   subs: ["미니스커트", "반바지", "와이드팬츠", "미디스커트"] },
    ];
  }

  const result = [];
  for (const { role, subs } of slotPrefs) {
    let found = null;
    // Try preferred subcategories first
    for (const sub of subs) {
      const match = items.find((i) => i.category === role && i.subcategory === sub);
      if (match) { found = match; break; }
    }
    // Fallback: any item in that category
    if (!found) {
      found = items.find((i) => i.category === role) || null;
    }
    if (found) result.push({ role, item: found });
  }

  return result;
}
