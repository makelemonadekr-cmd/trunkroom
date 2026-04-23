/**
 * mockSellerData.js
 *
 * Mock seller profiles for the "발견" discovery tab.
 * Items and outfits are distributed from existing mock data by array slice
 * so no new image assets are required and all IDs stay valid.
 *
 * When real backend is available, replace getSellerItems() / getSellerOutfits()
 * with API calls and keep the SELLER_PROFILES shape as the contract.
 */

import { CLOSET_ITEMS } from "./mockClosetData";
import { OUTFIT_DATA }  from "./mockOutfitData";
import { zoneCoordiImg } from "../lib/localImages";

// ─── Local image helper ───────────────────────────────────────────────────────
// sellerProf zone  → coordi[50-57]  (8 sellers × 1 profile each)
// sellerCover zone → coordi[80-87]  (8 sellers × 1 cover each)
const _profile = (offset) => zoneCoordiImg("sellerProf",  offset); // coordi[50-57]
const _cover   = (offset) => zoneCoordiImg("sellerCover", offset); // coordi[80-87]

// ─── Sale price lookup helpers ────────────────────────────────────────────────
// Key = seller id,  Value = { [slice-index]: price_in_KRW }
const SALE_PRICES = {
  "seller-001": { 0: 38000, 2: 55000, 5: 28000, 9: 72000, 12: 45000 },
  "seller-002": { 1: 89000, 3: 120000, 6: 65000, 10: 145000, 14: 78000 },
  "seller-003": { 0: 25000, 4: 34000, 7: 58000, 11: 42000, 15: 67000 },
  "seller-004": { 2: 180000, 5: 95000, 8: 240000, 12: 135000, 16: 88000 },
  "seller-005": { 0: 48000, 3: 32000, 6: 75000, 9: 55000, 13: 98000 },
  "seller-006": { 1: 220000, 4: 165000, 7: 310000, 10: 185000, 14: 145000 },
  "seller-007": { 0: 35000, 2: 22000, 5: 48000, 8: 67000, 11: 39000 },
  "seller-008": { 1: 58000, 4: 42000, 7: 86000, 10: 115000, 13: 72000 },
};

// ─── Seller profile definitions ────────────────────────────────────────────────
export const SELLER_PROFILES = [
  {
    id:           "seller-001",
    username:     "minimalyoon",
    displayName:  "미니멀윤",
    bio:          "깔끔하고 단정한 미니멀 무드. 매주 새 아이템을 업로드해요 🤍",
    profileImage: _profile(0),
    coverImage:   _cover(0),
    followers:    1250,
    following:    340,
    styleLabel:   "미니멀",
    rating:       4.9,
    reviewCount:  87,
    verified:     true,
    itemSlice:    [0, 17],
    outfitSlice:  [0, 4],
  },
  {
    id:           "seller-002",
    username:     "streetkimstyle",
    displayName:  "스트릿킴",
    bio:          "한정판 스트릿 피스 셀렉. 국내외 하이엔드 브랜드 다수 보유 🔥",
    profileImage: _profile(1),
    coverImage:   _cover(1),
    followers:    3420,
    following:    215,
    styleLabel:   "스트릿",
    rating:       4.7,
    reviewCount:  213,
    verified:     true,
    itemSlice:    [17, 33],
    outfitSlice:  [4, 8],
  },
  {
    id:           "seller-003",
    username:     "femme_chaeri",
    displayName:  "샤에리 페미닌",
    bio:          "여성스럽고 로맨틱한 스타일. 플로럴 & 러플 전문 셀러 🌸",
    profileImage: _profile(2),
    coverImage:   _cover(2),
    followers:    892,
    following:    507,
    styleLabel:   "페미닌",
    rating:       5.0,
    reviewCount:  54,
    verified:     false,
    itemSlice:    [33, 49],
    outfitSlice:  [8, 12],
  },
  {
    id:           "seller-004",
    username:     "luxe_modern",
    displayName:  "럭스 모던",
    bio:          "프리미엄 & 명품 컨템포러리. 상태 최상급 아이템만 엄선합니다 ✨",
    profileImage: _profile(3),
    coverImage:   _cover(3),
    followers:    5100,
    following:    89,
    styleLabel:   "모던시크",
    rating:       4.8,
    reviewCount:  341,
    verified:     true,
    itemSlice:    [49, 65],
    outfitSlice:  [12, 16],
  },
  {
    id:           "seller-005",
    username:     "casual.hee",
    displayName:  "캐주얼희",
    bio:          "편안하고 실용적인 데일리 룩. 합리적인 가격대 유지합니다 👗",
    profileImage: _profile(4),
    coverImage:   _cover(4),
    followers:    678,
    following:    412,
    styleLabel:   "캐주얼",
    rating:       4.6,
    reviewCount:  129,
    verified:     false,
    itemSlice:    [65, 81],
    outfitSlice:  [16, 20],
  },
  {
    id:           "seller-006",
    username:     "vintage_archive",
    displayName:  "빈티지 아카이브",
    bio:          "90s-Y2K 빈티지 & 레트로 아이템 큐레이션. 데드스톡 포함 📼",
    profileImage: _profile(5),
    coverImage:   _cover(5),
    followers:    2340,
    following:    178,
    styleLabel:   "빈티지",
    rating:       4.7,
    reviewCount:  198,
    verified:     true,
    itemSlice:    [81, 97],
    outfitSlice:  [20, 23],
  },
  {
    id:           "seller-007",
    username:     "sporty_jina",
    displayName:  "스포티지나",
    bio:          "요가 & 러닝 기반의 액티브웨어 전문. 기능성 아이템 직구 포함 🏃‍♀️",
    profileImage: _profile(6),
    coverImage:   _cover(6),
    followers:    445,
    following:    623,
    styleLabel:   "스포티",
    rating:       4.9,
    reviewCount:  72,
    verified:     false,
    itemSlice:    [97, 113],
    outfitSlice:  [23, 25],
  },
  {
    id:           "seller-008",
    username:     "office_grace",
    displayName:  "오피스 그레이스",
    bio:          "출근룩 전문 셀러. 세미포멀부터 데이트룩까지 폭넓은 스타일 💼",
    profileImage: _profile(7),
    coverImage:   _cover(7),
    followers:    1890,
    following:    263,
    styleLabel:   "오피스룩",
    rating:       4.8,
    reviewCount:  156,
    verified:     true,
    itemSlice:    [113, 133],
    outfitSlice:  [0, 3], // wrap around — reuse some outfits
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Get seller profile by id */
export function getSellerById(sellerId) {
  return SELLER_PROFILES.find((s) => s.id === sellerId) ?? null;
}

/**
 * Get CLOSET_ITEMS attributed to a seller.
 * Overrides isForSale + price based on SALE_PRICES lookup.
 */
export function getSellerItems(sellerId) {
  const seller = SELLER_PROFILES.find((s) => s.id === sellerId);
  if (!seller) return [];
  const priceLookup = SALE_PRICES[sellerId] ?? {};
  return CLOSET_ITEMS.slice(seller.itemSlice[0], seller.itemSlice[1]).map((item, idx) => {
    const price    = priceLookup[idx] ?? 0;
    const forSale  = price > 0;
    return {
      ...item,
      isForSale: forSale,
      price,
      sellerId,
      // attach a compact seller stub for card display
      seller: {
        id:           seller.id,
        displayName:  seller.displayName,
        profileImage: seller.profileImage,
        verified:     seller.verified,
      },
    };
  });
}

/** Items from a seller that are actively for sale (price > 0) */
export function getSellerSaleItems(sellerId) {
  return getSellerItems(sellerId).filter((i) => i.isForSale);
}

/** OUTFIT_DATA entries attributed to a seller */
export function getSellerOutfits(sellerId) {
  const seller = SELLER_PROFILES.find((s) => s.id === sellerId);
  if (!seller) return [];
  return OUTFIT_DATA.slice(seller.outfitSlice[0], seller.outfitSlice[1]).map((outfit) => ({
    ...outfit,
    seller: {
      id:           seller.id,
      displayName:  seller.displayName,
      profileImage: seller.profileImage,
      verified:     seller.verified,
    },
  }));
}

/**
 * Flat list of ALL public items across all sellers, with seller stub attached.
 * Used in 공개 아이템 tab.
 */
export function getAllPublicItems() {
  return SELLER_PROFILES.flatMap((seller) => getSellerItems(seller.id));
}

/**
 * All for-sale items across all sellers.
 * Used in 판매중인 상품 모아보기.
 */
export function getAllForSaleItems() {
  return SELLER_PROFILES.flatMap((seller) => getSellerSaleItems(seller.id));
}

/**
 * All public outfits across all sellers, with seller stub attached.
 * Used in 코디북 discovery tab.
 */
export function getAllPublicOutfits() {
  return SELLER_PROFILES.flatMap((seller) => getSellerOutfits(seller.id));
}

/**
 * Map a closet item to the shape expected by ProductDetailPage.
 * ProductDetailPage requires: { id, brand, name, price, condition, image, fallback }
 */
export function toProductShape(item) {
  return {
    id:        item.id,
    brand:     item.brand   ?? "Unknown",
    name:      item.displayName ?? item.name,
    price:     item.price   ?? 0,
    condition: item.condition ?? "상태 좋음",
    image:     item.image,
    fallback:  item.image,
    // extra fields preserved for extended detail display
    color:     item.color,
    size:      item.size,
    season:    item.season,
    tags:      item.tags    ?? [],
    styleTags: item.styleTags ?? [],
    subCategory: item.subCategory ?? item.subcategory,
    mainCategory: item.mainCategory ?? item.category,
    description:  item.description ?? "",
    seller:    item.seller  ?? null,
    isForSale: item.isForSale ?? false,
  };
}
