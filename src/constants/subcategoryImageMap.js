/**
 * subcategoryImageMap.js
 *
 * Mapping: subcategory label → representative local image URL.
 *
 * All images come from named zones defined in localImages.js — guaranteed
 * non-overlapping with closet items, home listings, outfit cards, etc.
 *
 * Zone "subcategory"  → item images: tops[20-39], bottoms[16-35], outerwear[10-29], dress[0-9]
 * Zone "subcatShoes"  → coordi[100-109]
 * Zone "subcatBags"   → coordi[110-119]
 * Zone "subcatAccess" → coordi[120-129]
 * Zone "subcatSports" → coordi[130-139] + sell zone items
 */

import { zoneItemImg, zoneCoordiImg } from "../lib/localImages";

// ─── Spread helpers ───────────────────────────────────────────────────────────
// Each zone has 20 item slots for tops/bottoms/outerwear, 10 for dress.
// Using even local indices (0, 2, 4, …, 18) spreads across the zone's 20 slots.
const _t = (i) => zoneItemImg("subcategory", "tops",      i * 2);  // tops[20,22,…,38]
const _b = (i) => zoneItemImg("subcategory", "bottoms",   i * 2);  // bottoms[16,18,…,34]
const _o = (i) => zoneItemImg("subcategory", "outerwear", i * 2);  // outerwear[10,12,…,28]
const _d = (i) => zoneItemImg("subcategory", "dress",     i);      // dress[0-9]
const _s = (i) => zoneCoordiImg("subcatShoes",   i);               // coordi[100-109]
const _g = (i) => zoneCoordiImg("subcatBags",    i);               // coordi[110-119]
const _a = (i) => zoneCoordiImg("subcatAccess",  i);               // coordi[120-129]
const _p = (i) => zoneCoordiImg("subcatSports",  i);               // coordi[130-139]

export const SUBCATEGORY_IMAGE_MAP = {

  // ─── 상의 (Tops) — subcategory zone tops[20-38], 10 evenly spread ──────────
  "반팔 티셔츠":    _t(0),
  "긴팔 티셔츠":    _t(1),
  "셔츠":           _t(2),
  "블라우스":       _t(3),
  "니트/스웨터":    _t(4),
  "후드티":         _t(5),
  "맨투맨":         _t(6),
  "탱크탑":         _t(7),
  "가디건":         _t(8),
  "크롭탑":         _t(9),

  // ─── 하의 (Bottoms) — subcategory zone bottoms[16-34], 10 evenly spread ────
  "청바지":         _b(0),
  "슬랙스":         _b(1),
  "반바지":         _b(2),
  "트레이닝 팬츠":  _b(3),
  "미니스커트":     _b(4),
  "미디스커트":     _b(5),
  "맥시스커트":     _b(6),
  "와이드팬츠":     _b(7),
  "레깅스":         _b(8),
  "조거팬츠":       _b(9),

  // ─── 아우터 (Outerwear) — subcategory zone outerwear[10-28], 10 evenly spread
  "트렌치코트":     _o(0),
  "울 코트":        _o(1),
  "패딩":           _o(2),
  "블레이저":       _o(3),
  "점퍼":           _o(4),
  "다운재킷":       _o(5),
  "체크코트":       _o(6),
  "오버핏코트":     _o(7),
  "레더재킷":       _o(8),
  "후리스":         _o(9),

  // ─── 원피스 (Dresses) — subcategory zone dress[0-9], all 10 images ─────────
  "미니 원피스":    _d(0),
  "미디 원피스":    _d(1),
  "맥시 원피스":    _d(2),
  "니트 원피스":    _d(3),
  "셔츠 원피스":    _d(4),
  "플리츠 원피스":  _d(5),
  "점프수트":       _d(6),
  "원숄더":         _d(7),
  "민소매 원피스":  _d(8),
  "캐주얼 원피스":  _d(9),

  // ─── 신발 (Shoes) — subcatShoes zone coordi[100-109] ──────────────────────
  "스니커즈":       _s(0),
  "로퍼":           _s(1),
  "힐/펌프스":      _s(2),
  "앵클 부츠":      _s(3),
  "샌들":           _s(4),
  "뮬":             _s(5),
  "옥스퍼드":       _s(6),
  "슬리퍼":         _s(7),
  "플랫폼":         _s(8),
  "스포츠 샌들":    _s(9),

  // ─── 가방 (Bags) — subcatBags zone coordi[110-119] ────────────────────────
  "숄더백":         _g(0),
  "크로스백":       _g(1),
  "토트백":         _g(2),
  "클러치":         _g(3),
  "백팩":           _g(4),
  "버킷백":         _g(5),
  "핸드백":         _g(6),
  "에코백":         _g(7),
  "파우치":         _g(8),
  "미니백":         _g(9),

  // ─── 액세서리 (Accessories) — subcatAccess zone coordi[120-129] ───────────
  "목걸이":         _a(0),
  "귀걸이":         _a(1),
  "반지":           _a(2),
  "선글라스":       _a(3),
  "벨트":           _a(4),
  "헤어밴드":       _a(5),
  "스카프":         _a(6),
  "모자":           _a(7),
  "시계":           _a(8),
  "팔찌":           _a(9),

  // ─── 스포츠 (Sports) — subcatSports zone coordi[130-139] ──────────────────
  "스포츠 레깅스":  _p(0),
  "스포츠 브라":    _p(1),
  "트레이닝 재킷":  _p(2),
  "러닝화":         _p(3),
  "요가복":         _p(4),
  "압박 반바지":    _p(5),
  "윈드브레이커":   _p(6),
  "스포츠 티셔츠":  _p(7),
  "스포츠 양말":    _p(8),
  "헤드밴드":       _p(9),
};

/** Generic fallback for subcategories not in map */
const FALLBACK_IMAGE = zoneCoordiImg("outfits", 0);

/**
 * Get the representative image URL for a given subcategory.
 * @param {string} subcategoryName
 * @returns {string} local asset URL
 */
export function getSubcategoryImage(subcategoryName) {
  return SUBCATEGORY_IMAGE_MAP[subcategoryName] ?? FALLBACK_IMAGE;
}
