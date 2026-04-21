/**
 * categoryMapping.js
 *
 * Single source of truth for the app's clothing taxonomy.
 * Update this file if categories or subcategories change.
 * Both the OpenAI classification prompt and the UI form rely on this module.
 */

// ─── Taxonomy ─────────────────────────────────────────────────────────────────

export const TAXONOMY = {
  상의:     ["반팔 티셔츠", "긴팔 티셔츠", "셔츠", "블라우스", "니트/스웨터", "후드티", "맨투맨", "탱크탑", "가디건", "크롭탑"],
  하의:     ["청바지", "슬랙스", "반바지", "트레이닝 팬츠", "미니스커트", "미디스커트", "맥시스커트", "와이드팬츠", "레깅스", "조거팬츠"],
  아우터:   ["트렌치코트", "울 코트", "패딩", "블레이저", "점퍼", "다운재킷", "체크코트", "오버핏코트", "레더재킷", "후리스"],
  원피스:   ["미니 원피스", "미디 원피스", "맥시 원피스", "니트 원피스", "셔츠 원피스", "플리츠 원피스", "점프수트", "원숄더", "민소매 원피스", "캐주얼 원피스"],
  신발:     ["스니커즈", "로퍼", "힐/펌프스", "앵클 부츠", "샌들", "뮬", "옥스퍼드", "슬리퍼", "플랫폼", "스포츠 샌들"],
  가방:     ["숄더백", "크로스백", "토트백", "클러치", "백팩", "버킷백", "핸드백", "에코백", "파우치", "미니백"],
  액세서리: ["목걸이", "귀걸이", "반지", "선글라스", "벨트", "헤어밴드", "스카프", "모자", "시계", "팔찌"],
  스포츠:   ["스포츠 레깅스", "스포츠 브라", "트레이닝 재킷", "러닝화", "요가복", "압박 반바지", "윈드브레이커", "스포츠 티셔츠", "스포츠 양말", "헤드밴드"],
};

export const MAIN_CATEGORIES = Object.keys(TAXONOMY);

/** All allowed subcategory labels (flat, unique) */
export const ALL_SUBCATEGORIES = Object.values(TAXONOMY).flat();

// ─── UI ↔ API mapping ─────────────────────────────────────────────────────────

/** Korean category → the UI's English id (used in AddClosetItemScreen) */
export const KO_TO_FORM_ID = {
  상의:     "TOP",
  하의:     "BOTTOM",
  아우터:   "OUTER",
  원피스:   "OPS",
  신발:     "SHOES",
  가방:     "BAG",
  액세서리: "ACC",
  스포츠:   "SPORTS",
};

/** UI English id → Korean category */
export const FORM_ID_TO_KO = Object.fromEntries(
  Object.entries(KO_TO_FORM_ID).map(([k, v]) => [v, k])
);

// ─── Nearest-category resolver ────────────────────────────────────────────────

/**
 * Given a raw category string from the model (may be slightly off),
 * return the nearest valid main category, or '상의' as last resort.
 */
export function resolveMainCategory(raw = "") {
  if (MAIN_CATEGORIES.includes(raw)) return raw;

  const lower = raw.toLowerCase();
  const fallbacks = {
    top: "상의", shirt: "상의", blouse: "상의", tshirt: "상의",
    bottom: "하의", pants: "하의", jeans: "하의", skirt: "하의",
    outer: "아우터", coat: "아우터", jacket: "아우터", padding: "아우터",
    dress: "원피스", ops: "원피스", onepiece: "원피스",
    shoes: "신발", shoe: "신발", sneakers: "신발", boots: "신발",
    bag: "가방", handbag: "가방", purse: "가방",
    acc: "액세서리", accessories: "액세서리", jewelry: "액세서리",
    sports: "스포츠", athletic: "스포츠",
  };
  for (const [key, val] of Object.entries(fallbacks)) {
    if (lower.includes(key)) return val;
  }
  return "상의";
}

/**
 * Given a raw subcategory string from the model,
 * return the nearest valid subcategory for the given main category,
 * or the first subcategory in that category as last resort.
 */
export function resolveSubCategory(rawSub = "", mainCat = "상의") {
  const subs = TAXONOMY[mainCat] ?? TAXONOMY["상의"];
  if (subs.includes(rawSub)) return rawSub;

  // Fuzzy: find closest by substring match
  const lower = rawSub.toLowerCase();
  const match = subs.find((s) => s.toLowerCase().includes(lower) || lower.includes(s.toLowerCase()));
  return match ?? subs[0];
}
