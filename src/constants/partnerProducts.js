/**
 * partnerProducts.js
 *
 * 추천 커머스 데이터 (돈 버는 채널):
 *   - 노브라블럼 (자사 브랜드, 메이크레모네이드) — 마진 100%
 *   - 쿠팡파트너스 제휴 링크 헬퍼 — 윤님 제휴 태그 넣으면 수수료 추적됨
 */

// ─── 노브라블럼 (자사 제품, 클릭→외부몰) ─────────────────────────────────────
export const NOBRABLEM_PRODUCTS = [
  {
    id: "nb-tape-basic",
    name: "리프팅 가슴 테이프 기본 패키지",
    blurb: "브라테이프 + 하트 니플패치",
    price: 14900,
    originalPrice: 22900,
    image: "https://cdn-optimized.imweb.me/upload/S202307133c58dfe53dd54/9891d15224fe2.png",
    url: "https://www.nobrablem.shop/?idx=37",
  },
  {
    id: "nb-nubra",
    name: "누브라블럼",
    blurb: "테이핑 전용 푸쉬업 누드 브라",
    price: 18000,
    originalPrice: 21000,
    image: "https://cdn-optimized.imweb.me/upload/S202307133c58dfe53dd54/3456729400617.png",
    url: "https://www.nobrablem.shop/?idx=41",
  },
  {
    id: "nb-glue-tape",
    name: "내 몸에 딱풀 테이프",
    blurb: "옷 흘러내림 방지 · 맵시 테이프",
    price: 9900,
    originalPrice: 12900,
    image: "https://cdn-optimized.imweb.me/upload/S202307133c58dfe53dd54/36952ff51f344.png",
    url: "https://www.nobrablem.shop/?idx=32",
  },
  {
    id: "nb-nipple-heart",
    name: "하트 니플패치",
    blurb: "4매입 · 베이직 무드",
    price: 7900,
    originalPrice: 14900,
    image: "https://cdn-optimized.imweb.me/upload/S202307133c58dfe53dd54/c8790440b6111.png",
    url: "https://www.nobrablem.shop/?idx=31",
  },
];

// ─── 쿠팡파트너스 제휴 ────────────────────────────────────────────────────────
// 윤님 제휴 ID를 넣으면 수수료(~3%)가 추적됩니다. 비워두면 일반 검색 링크로 동작.
// 발급: https://partners.coupang.com → 내 ID를 아래에 입력.
export const COUPANG_PARTNERS_ID = ""; // 예: "AF1234567"

/**
 * 키워드로 쿠팡 검색(제휴) 링크 생성.
 * 제휴 ID가 있으면 subId로 출처 추적.
 */
export function coupangSearchLink(keyword, subId = "trunkroom") {
  const q = encodeURIComponent(keyword || "");
  let url = `https://www.coupang.com/np/search?q=${q}`;
  if (COUPANG_PARTNERS_ID) url += `&channel=affiliate&affId=${COUPANG_PARTNERS_ID}&subId=${encodeURIComponent(subId)}`;
  return url;
}

export const COUPANG_ENABLED = !!COUPANG_PARTNERS_ID;
