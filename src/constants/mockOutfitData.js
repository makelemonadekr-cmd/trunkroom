/**
 * mockOutfitData.js
 *
 * Outfit / coordination records used across 스타일 screen, 옷장 > 스타일북,
 * and the weather-item → outfit recommendation flow.
 * previewImage values now use the local processed image library instead of Unsplash.
 *
 * previewImage sources: /assets/images/coordi/ (processed local library)
 *
 * Each outfit record:
 *   id             – stable identifier
 *   title          – Korean display title
 *   style          – one of STYLE_CATEGORIES (see styleCategories.js)
 *   season         – array of "봄"|"여름"|"가을"|"겨울"
 *   previewImage   – Unsplash URL for the outfit card thumbnail
 *   itemIds        – IDs of CLOSET_ITEMS included in this outfit
 *   anchorItemIds  – which items are the "hero" of this outfit (for recommendation matching)
 *   shortDesc      – one-line Korean description
 *   tags           – searchable Korean tags
 *   likes          – initial like count (mock)
 *   color          – dominant color hex for card background
 *
 * To replace with real data:
 *   Swap this array with a backend API call — the schema stays the same.
 */

import { zoneCoordiImg } from "../lib/localImages";
const coordiImg = (n) => zoneCoordiImg("outfits", n); // zone outfits = coordi[0-24]

export const OUTFIT_DATA = [
  // ─── 미니멀 ────────────────────────────────────────────────────────────────
  {
    id: "outfit-001",
    title: "클린 미니멀 데일리",
    style: "미니멀",
    season: ["봄", "가을"],
    previewImage: coordiImg(0),
    itemIds: ["item-11", "item-43", "item-113"],
    anchorItemIds: ["item-11", "item-43"],
    shortDesc: "오버핏 셔츠 + 와이드 슬랙스로 완성하는 미니멀 룩",
    tags: ["화이트", "베이지", "미니멀", "깔끔한"],
    likes: 214,
    color: "#2C2C2C",
  },
  {
    id: "outfit-002",
    title: "모노톤 오피스 미니멀",
    style: "미니멀",
    season: ["봄", "가을"],
    previewImage: coordiImg(1),
    itemIds: ["item-7", "item-44", "item-82"],
    anchorItemIds: ["item-82", "item-44"],
    shortDesc: "블레이저 + 슬랙스로 완성하는 군더더기 없는 미니멀",
    tags: ["블랙", "그레이", "미니멀", "오피스"],
    likes: 178,
    color: "#1A1A1A",
  },

  // ─── 캐주얼 ────────────────────────────────────────────────────────────────
  {
    id: "outfit-003",
    title: "위켄드 캐주얼",
    style: "캐주얼",
    season: ["봄", "여름"],
    previewImage: coordiImg(2),
    itemIds: ["item-1", "item-38", "item-108"],
    anchorItemIds: ["item-1", "item-38"],
    shortDesc: "화이트 반팔 + 스트레이트 데님으로 완성하는 주말 룩",
    tags: ["데님", "화이트", "캐주얼", "데일리"],
    likes: 311,
    color: "#1C3A5C",
  },
  {
    id: "outfit-004",
    title: "편안한 캐주얼 레이어드",
    style: "캐주얼",
    season: ["봄", "가을"],
    previewImage: coordiImg(3),
    itemIds: ["item-27", "item-38", "item-33"],
    anchorItemIds: ["item-27", "item-33"],
    shortDesc: "맨투맨 위에 가디건 레이어드로 완성하는 캐주얼 룩",
    tags: ["그레이", "베이지", "레이어드", "캐주얼"],
    likes: 189,
    color: "#3A3A3A",
  },

  // ─── 페미닌 ────────────────────────────────────────────────────────────────
  {
    id: "outfit-005",
    title: "봄 플로럴 페미닌",
    style: "페미닌",
    season: ["봄", "여름"],
    previewImage: coordiImg(4),
    itemIds: ["item-15", "item-55", "item-113"],
    anchorItemIds: ["item-15", "item-55"],
    shortDesc: "블라우스 + 미디스커트로 완성하는 사랑스러운 봄 룩",
    tags: ["플로럴", "미디스커트", "페미닌", "봄"],
    likes: 256,
    color: "#7A3040",
  },
  {
    id: "outfit-006",
    title: "로맨틱 미니 드레스",
    style: "페미닌",
    season: ["봄", "여름"],
    previewImage: coordiImg(5),
    itemIds: ["item-95", "item-113", "item-122"],
    anchorItemIds: ["item-95"],
    shortDesc: "플로럴 미니 원피스 하나로 완성하는 페미닌 데이룩",
    tags: ["미니드레스", "플로럴", "페미닌", "여름"],
    likes: 198,
    color: "#C76B8A",
  },

  // ─── 스트릿 ────────────────────────────────────────────────────────────────
  {
    id: "outfit-007",
    title: "빈티지 스트릿 레이어드",
    style: "스트릿",
    season: ["가을"],
    previewImage: coordiImg(6),
    itemIds: ["item-29", "item-38", "item-89"],
    anchorItemIds: ["item-89", "item-29"],
    shortDesc: "레더재킷 + 맨투맨으로 완성하는 스트릿 레이어드",
    tags: ["레더재킷", "스트릿", "오버핏", "가을"],
    likes: 342,
    color: "#2A1A0A",
  },
  {
    id: "outfit-008",
    title: "카고 스트릿 핏",
    style: "스트릿",
    season: ["봄", "가을"],
    previewImage: coordiImg(7),
    itemIds: ["item-2", "item-66", "item-86"],
    anchorItemIds: ["item-2", "item-66"],
    shortDesc: "오버핏 반팔 + 조거팬츠로 완성하는 스트릿 캐주얼",
    tags: ["조거팬츠", "오버핏", "스트릿", "블랙"],
    likes: 224,
    color: "#1A2A2A",
  },

  // ─── 하객룩 ────────────────────────────────────────────────────────────────
  {
    id: "outfit-009",
    title: "우아한 봄 하객룩",
    style: "하객룩",
    season: ["봄"],
    previewImage: coordiImg(8),
    itemIds: ["item-98", "item-113", "item-117"],
    anchorItemIds: ["item-98"],
    shortDesc: "미디 드레스로 완성하는 격식 있는 하객 룩",
    tags: ["미디드레스", "하객룩", "우아한", "봄"],
    likes: 289,
    color: "#5A3A4A",
  },
  {
    id: "outfit-010",
    title: "가을 하객 세미포멀",
    style: "하객룩",
    season: ["가을"],
    previewImage: coordiImg(9),
    itemIds: ["item-84", "item-55", "item-114"],
    anchorItemIds: ["item-84", "item-55"],
    shortDesc: "블레이저 + 미디스커트로 완성하는 가을 하객룩",
    tags: ["블레이저", "미디스커트", "하객룩", "가을"],
    likes: 201,
    color: "#4A3525",
  },

  // ─── 데이트룩 ──────────────────────────────────────────────────────────────
  {
    id: "outfit-011",
    title: "설레는 봄 데이트룩",
    style: "데이트룩",
    season: ["봄", "여름"],
    previewImage: coordiImg(10),
    itemIds: ["item-16", "item-51", "item-113"],
    anchorItemIds: ["item-16", "item-51"],
    shortDesc: "플로럴 블라우스 + 플리츠 스커트로 완성하는 데이트 룩",
    tags: ["플로럴", "미니스커트", "데이트룩", "봄"],
    likes: 375,
    color: "#8A4050",
  },
  {
    id: "outfit-012",
    title: "심플 데이트 나이트",
    style: "데이트룩",
    season: ["봄", "가을"],
    previewImage: coordiImg(11),
    itemIds: ["item-99", "item-113", "item-122"],
    anchorItemIds: ["item-99"],
    shortDesc: "사틴 미디 드레스로 완성하는 시크한 데이트 나이트",
    tags: ["사틴드레스", "블랙", "데이트룩", "시크"],
    likes: 264,
    color: "#2A1A3A",
  },

  // ─── 오피스룩 ──────────────────────────────────────────────────────────────
  {
    id: "outfit-013",
    title: "파워 오피스 룩",
    style: "오피스룩",
    season: ["봄", "가을"],
    previewImage: coordiImg(12),
    itemIds: ["item-82", "item-43", "item-113"],
    anchorItemIds: ["item-82", "item-43"],
    shortDesc: "테일러드 블레이저 + 와이드 슬랙스로 완성하는 오피스 룩",
    tags: ["블레이저", "슬랙스", "오피스룩", "블랙"],
    likes: 198,
    color: "#2C2C2C",
  },
  {
    id: "outfit-014",
    title: "소프트 오피스 페미닌",
    style: "오피스룩",
    season: ["봄"],
    previewImage: coordiImg(13),
    itemIds: ["item-15", "item-45", "item-84"],
    anchorItemIds: ["item-15", "item-45"],
    shortDesc: "블라우스 + 슬랙스로 완성하는 여성스러운 오피스 룩",
    tags: ["블라우스", "슬랙스", "오피스룩", "페미닌"],
    likes: 221,
    color: "#3A2A4A",
  },

  // ─── 출근룩 ────────────────────────────────────────────────────────────────
  {
    id: "outfit-015",
    title: "클래식 출근 스타일",
    style: "출근룩",
    season: ["봄", "가을"],
    previewImage: coordiImg(14),
    itemIds: ["item-14", "item-44", "item-113"],
    anchorItemIds: ["item-14", "item-44"],
    shortDesc: "옥스포드 셔츠 + 테이퍼드 슬랙스로 완성하는 스마트 출근 룩",
    tags: ["셔츠", "슬랙스", "출근룩", "클래식"],
    likes: 167,
    color: "#2A3040",
  },

  // ─── 주말룩 ────────────────────────────────────────────────────────────────
  {
    id: "outfit-016",
    title: "여유로운 주말 브런치",
    style: "주말룩",
    season: ["봄", "여름"],
    previewImage: coordiImg(15),
    itemIds: ["item-33", "item-58", "item-109"],
    anchorItemIds: ["item-33", "item-58"],
    shortDesc: "오버핏 가디건 + 와이드 린넨 팬츠로 완성하는 편안한 주말 룩",
    tags: ["가디건", "와이드팬츠", "주말룩", "베이지"],
    likes: 243,
    color: "#4A3A2A",
  },

  // ─── 여행룩 ────────────────────────────────────────────────────────────────
  {
    id: "outfit-017",
    title: "에어포트 여행 패션",
    style: "여행룩",
    season: ["봄", "가을"],
    previewImage: coordiImg(16),
    itemIds: ["item-19", "item-58", "item-109"],
    anchorItemIds: ["item-19", "item-58"],
    shortDesc: "니트 + 와이드 팬츠 + 스니커즈로 완성하는 편안한 여행 룩",
    tags: ["니트", "와이드팬츠", "여행룩", "캐주얼"],
    likes: 198,
    color: "#2A3A4A",
  },

  // ─── 리조트룩 ──────────────────────────────────────────────────────────────
  {
    id: "outfit-018",
    title: "서머 리조트 룩",
    style: "리조트룩",
    season: ["여름"],
    previewImage: coordiImg(17),
    itemIds: ["item-100", "item-115", "item-124"],
    anchorItemIds: ["item-100"],
    shortDesc: "맥시 원피스 + 샌들로 완성하는 여름 리조트 룩",
    tags: ["맥시드레스", "샌들", "리조트룩", "여름"],
    likes: 312,
    color: "#1A4A5A",
  },

  // ─── 스포티 ────────────────────────────────────────────────────────────────
  {
    id: "outfit-019",
    title: "스포티 애슬레저",
    style: "스포티",
    season: ["봄", "가을"],
    previewImage: coordiImg(18),
    itemIds: ["item-127", "item-128", "item-130"],
    anchorItemIds: ["item-127", "item-128"],
    shortDesc: "스포츠 레깅스 + 스포츠 브라 + 트랙 재킷으로 완성하는 애슬레저",
    tags: ["레깅스", "스포츠브라", "애슬레저", "스포티"],
    likes: 178,
    color: "#1A2A1A",
  },

  // ─── 빈티지 ────────────────────────────────────────────────────────────────
  {
    id: "outfit-020",
    title: "레트로 빈티지 스타일",
    style: "빈티지",
    season: ["봄", "가을"],
    previewImage: coordiImg(19),
    itemIds: ["item-86", "item-39", "item-109"],
    anchorItemIds: ["item-86", "item-39"],
    shortDesc: "데님 재킷 + 와이드 데님으로 완성하는 복고풍 빈티지 룩",
    tags: ["데님재킷", "빈티지", "레트로", "데님"],
    likes: 291,
    color: "#3A2A1A",
  },
  {
    id: "outfit-021",
    title: "70s 빈티지 무드",
    style: "빈티지",
    season: ["가을"],
    previewImage: coordiImg(20),
    itemIds: ["item-89", "item-59", "item-109"],
    anchorItemIds: ["item-89"],
    shortDesc: "레더재킷 + 미디스커트로 완성하는 70s 빈티지 무드",
    tags: ["레더재킷", "미디스커트", "빈티지", "70s"],
    likes: 245,
    color: "#4A3010",
  },

  // ─── 모던시크 ──────────────────────────────────────────────────────────────
  {
    id: "outfit-022",
    title: "가을 모던시크",
    style: "모던시크",
    season: ["가을", "겨울"],
    previewImage: coordiImg(21),
    itemIds: ["item-71", "item-43", "item-117"],
    anchorItemIds: ["item-71", "item-43"],
    shortDesc: "오버핏 트렌치 + 와이드 슬랙스로 완성하는 모던시크 룩",
    tags: ["트렌치코트", "슬랙스", "모던시크", "베이지"],
    likes: 334,
    color: "#1A2A2A",
  },
  {
    id: "outfit-023",
    title: "겨울 블랙 시크",
    style: "모던시크",
    season: ["겨울"],
    previewImage: coordiImg(22),
    itemIds: ["item-93", "item-44", "item-109"],
    anchorItemIds: ["item-93"],
    shortDesc: "오버핏 코트 + 블랙 슬랙스로 완성하는 겨울 시크 룩",
    tags: ["오버핏코트", "블랙", "겨울", "시크"],
    likes: 278,
    color: "#0A0A0A",
  },

  // ─── Y2K ──────────────────────────────────────────────────────────────────
  {
    id: "outfit-024",
    title: "Y2K 크롭 스타일",
    style: "Y2K",
    season: ["봄", "여름"],
    previewImage: coordiImg(23),
    itemIds: ["item-36", "item-51", "item-108"],
    anchorItemIds: ["item-36", "item-51"],
    shortDesc: "크롭탑 + 미니스커트로 완성하는 Y2K 감성 룩",
    tags: ["크롭탑", "미니스커트", "Y2K", "화이트"],
    likes: 389,
    color: "#4A1A5A",
  },
  {
    id: "outfit-025",
    title: "Y2K 팝 색감 스타일",
    style: "Y2K",
    season: ["여름"],
    previewImage: coordiImg(24),
    itemIds: ["item-37", "item-52", "item-108"],
    anchorItemIds: ["item-37", "item-52"],
    shortDesc: "탱크탑 + 플로럴 미니스커트로 완성하는 발랄한 Y2K 룩",
    tags: ["탱크탑", "플로럴스커트", "Y2K", "컬러풀"],
    likes: 312,
    color: "#5A2A4A",
  },
];

/**
 * Get outfits filtered by style (pass null / "전체" for all).
 * @param {string|null} style
 * @returns {OutfitRecord[]}
 */
export function getOutfitsByStyle(style) {
  if (!style || style === "전체") return OUTFIT_DATA;
  return OUTFIT_DATA.filter((o) => o.style === style);
}

/**
 * Get outfits filtered by style AND season.
 * @param {string|null} style
 * @param {string|null} season  — "봄"|"여름"|"가을"|"겨울"|"전체"|null
 * @returns {OutfitRecord[]}
 */
export function getOutfitsByStyleAndSeason(style, season) {
  return OUTFIT_DATA.filter((o) => {
    const styleOk  = !style  || style  === "전체" || o.style === style;
    const seasonOk = !season || season === "전체" || o.season.includes(season);
    return styleOk && seasonOk;
  });
}

/**
 * Get outfits that contain a specific item ID (exact match).
 * If fewer than 2 results, also includes style/season-compatible outfits.
 * @param {string} itemId
 * @param {object} item — full item object (for style/season fallback)
 * @returns {OutfitRecord[]}   up to 6 results
 */
export function getOutfitsContainingItem(itemId, item = null) {
  // Primary: exact item match
  const exact = OUTFIT_DATA.filter((o) => o.itemIds.includes(itemId));
  if (exact.length >= 2) return exact.slice(0, 6);

  // Fallback: match by item category/season if item provided
  if (item) {
    const compatible = OUTFIT_DATA.filter((o) => {
      if (exact.includes(o)) return false;
      const seasonMatch = item.season?.some((s) => o.season.includes(s));
      return seasonMatch;
    });
    return [...exact, ...compatible].slice(0, 6);
  }

  // Last resort: return first 4 outfits
  return [...exact, ...OUTFIT_DATA.filter((o) => !exact.includes(o))].slice(0, 4);
}
