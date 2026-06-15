/**
 * payback.js — 옷장 본전 게임 엔진
 *
 * 핵심 개념:
 *   회당 단가(cost-per-wear) = 구매 가격 ÷ 착용 횟수
 *   본전 목표 = 카테고리별 "회당 목표 단가"까지 회당 단가를 낮추는 것
 *   예) 89,000원 상의(목표 3,000원/회) → 30번 입으면 본전 완료
 *
 * 모든 함수는 순수 함수 — useWearLogs의 freqMap(Map<itemId, count>)을 받아 계산.
 */

// ─── 카테고리별 회당 목표 단가 ─────────────────────────────────────────────
export const TARGET_PER_WEAR = {
  아우터:   5000,
  원피스:   5000,
  상의:     3000,
  하의:     3000,
  신발:     3000,
  가방:     3000,
  스포츠:   3000,
  액세서리: 2000,
};
const DEFAULT_TARGET = 3000;

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────
export function formatKRW(n) {
  if (n == null || isNaN(n)) return "0원";
  if (n >= 100000000) return `${(n / 100000000).toFixed(1).replace(/\.0$/, "")}억원`;
  if (n >= 10000)     return `${Math.round(n / 10000).toLocaleString()}만원`;
  return `${Math.round(n).toLocaleString()}원`;
}

export function formatKRWFull(n) {
  if (n == null || isNaN(n)) return "0원";
  return `${Math.round(n).toLocaleString()}원`;
}

function itemPrice(item) {
  const p = Number(item.price ?? 0);
  return p > 0 ? p : 0;
}

function itemCategory(item) {
  return item.mainCategory ?? item.main_category ?? item.category ?? "";
}

function itemId(item) {
  return item.id;
}

// ─── 아이템 단위 본전 계산 ─────────────────────────────────────────────────
/**
 * @param {Object} item     — clothing item (price, mainCategory…)
 * @param {number} wears    — 착용 횟수
 * @returns {{
 *   hasPrice:    boolean,  // 가격 정보가 있는가 (없으면 게이지 숨김)
 *   price:       number,
 *   wears:       number,
 *   costPerWear: number,   // 회당 단가 (wears 0이면 price 그대로)
 *   targetWears: number,   // 본전까지 필요한 총 착용 횟수
 *   remaining:   number,   // 본전까지 남은 착용 횟수
 *   progress:    number,   // 0~1 게이지
 *   done:        boolean,  // 본전 완료
 * }}
 */
export function getItemPayback(item, wears = 0) {
  const price = itemPrice(item);
  if (!price) {
    return { hasPrice: false, price: 0, wears, costPerWear: 0, targetWears: 0, remaining: 0, progress: 0, done: false };
  }
  const target      = TARGET_PER_WEAR[itemCategory(item)] ?? DEFAULT_TARGET;
  const targetWears = Math.max(1, Math.ceil(price / target));
  const progress    = Math.min(1, wears / targetWears);
  const done        = wears >= targetWears;
  return {
    hasPrice:    true,
    price,
    wears,
    costPerWear: wears > 0 ? Math.round(price / wears) : price,
    targetWears,
    remaining:   Math.max(0, targetWears - wears),
    progress,
    done,
  };
}

// ─── 옷장 전체 요약 ────────────────────────────────────────────────────────
/**
 * @param {Object[]} items   — closet items
 * @param {Map}      freqMap — Map<itemId, wearCount> (useWearLogs.getItemWearFrequency)
 * @returns {{
 *   pricedCount:    number,  // 가격 있는 아이템 수
 *   totalInvested:  number,  // 총 투자금
 *   totalExtracted: number,  // 뽑은 가치 (착용으로 회수한 금액, 아이템당 가격 상한)
 *   lockedMoney:    number,  // 묶인 돈 — 한 번도 안 입은 아이템 가격 합
 *   lockedCount:    number,
 *   doneCount:      number,  // 본전 완료 아이템 수
 *   doneMoney:      number,  // 본전 완료 아이템 가격 합
 *   almostList:     Object[],// 본전 임박 (progress≥0.6, 미완료) — {item, pb} progress 내림차순
 *   bestItem:       {item, pb}|null, // 최고 가성비 (회당 단가 최저, 3회 이상 착용)
 *   sleepingList:   Object[],// 안 입는 비싼 옷 — 0회 착용, 가격 내림차순
 * }}
 */
export function getClosetPaybackSummary(items = [], freqMap = new Map()) {
  let pricedCount = 0, totalInvested = 0, totalExtracted = 0;
  let lockedMoney = 0, lockedCount = 0, doneCount = 0, doneMoney = 0;
  const withPb = [];

  items.forEach((item) => {
    const wears = freqMap.get(itemId(item)) ?? 0;
    const pb    = getItemPayback(item, wears);
    if (!pb.hasPrice) return;

    pricedCount++;
    totalInvested += pb.price;
    // 뽑은 가치 = 목표 단가 × 착용 횟수 (가격 상한)
    const target = pb.price / pb.targetWears;
    totalExtracted += Math.min(pb.price, Math.round(target * wears));

    if (wears === 0) { lockedMoney += pb.price; lockedCount++; }
    if (pb.done)     { doneCount++; doneMoney += pb.price; }
    withPb.push({ item, pb });
  });

  const almostList = withPb
    .filter(({ pb }) => !pb.done && pb.progress >= 0.6)
    .sort((a, b) => b.pb.progress - a.pb.progress)
    .slice(0, 5);

  const wornEnough = withPb.filter(({ pb }) => pb.wears >= 3);
  const bestItem = wornEnough.length
    ? wornEnough.reduce((best, cur) => (cur.pb.costPerWear < best.pb.costPerWear ? cur : best))
    : null;

  const sleepingList = withPb
    .filter(({ pb }) => pb.wears === 0)
    .sort((a, b) => b.pb.price - a.pb.price)
    .slice(0, 5);

  return {
    pricedCount, totalInvested, totalExtracted,
    lockedMoney, lockedCount, doneCount, doneMoney,
    almostList, bestItem, sleepingList,
  };
}

// ─── 게이지 색상 (게임 톤) ─────────────────────────────────────────────────
export const PAYBACK_COLORS = {
  done:    "#3DCB87", // 본전 완료 민트
  near:    "#F5C200", // 임박 레몬옐로
  going:   "#FFD84D", // 진행 옅은 노랑
  start:   "#E8E8E8", // 시작 전 회색
};

export function paybackColor(pb) {
  if (!pb.hasPrice) return PAYBACK_COLORS.start;
  if (pb.done)            return PAYBACK_COLORS.done;
  if (pb.progress >= 0.6) return PAYBACK_COLORS.near;
  if (pb.progress > 0)    return PAYBACK_COLORS.going;
  return PAYBACK_COLORS.start;
}

// ─── 리세일 추정 + 판매글 (잠자는 돈 → 현금) ────────────────────────────────
const CONDITION_RESALE_RATIO = {
  "새 상품":     0.55,
  "거의 새 것":  0.45,
  "상태 좋음":   0.35,
  "사용감 있음": 0.25,
  "상태 나쁨":   0.15,
};

/**
 * 중고 예상가 — 구매가 × 상태비율 − 착용 감가, 천원 단위 반올림.
 * @returns {number}
 */
export function estimateResalePrice(item, wears = 0) {
  const price = itemPrice(item);
  if (!price) return 0;
  let ratio = CONDITION_RESALE_RATIO[item.condition] ?? 0.30;
  ratio -= Math.min(0.10, wears * 0.01); // 많이 입었으면 살짝 더 감가
  const est = Math.round((price * ratio) / 1000) * 1000;
  return Math.max(1000, est);
}

/**
 * 잠자는 옷 — 가격 있고 한 번도 안 입은 아이템 (전체, 가격 내림차순).
 * @returns {Array<{ item, price, resale }>}
 */
export function getSleepingItems(items = [], freqMap = new Map()) {
  return items
    .filter((i) => itemPrice(i) > 0 && (freqMap.get(i.id) ?? 0) === 0 && !(i.is_for_sale ?? i.isForSale))
    .sort((a, b) => itemPrice(b) - itemPrice(a))
    .map((item) => ({ item, price: itemPrice(item), resale: estimateResalePrice(item, 0) }));
}

/**
 * 당근·번개용 판매글 자동 생성 (템플릿).
 * @returns {{ title:string, price:number, body:string }}
 */
export function generateListing(item) {
  const name  = item.displayName ?? item.name ?? "옷";
  const brand = item.brand && !name.includes(item.brand) ? `${item.brand} ` : "";
  // 색상은 이름에 이미 들어있으면 중복으로 안 붙임
  const color = item.color && !name.includes(item.color) ? `${item.color} ` : "";
  const cond  = item.condition ?? "상태 좋음";
  const cat   = itemCategory(item);
  const size  = item.size ? `사이즈 ${item.size}, ` : "";
  const seasons = Array.isArray(item.season) ? item.season.filter(Boolean) : [];

  const title = `${brand}${color}${name}`.replace(/\s+/g, " ").trim();
  const tags = ["#트렁크룸", cat ? `#${cat}` : "", item.brand ? `#${item.brand}` : ""].filter(Boolean).join(" ");
  const body = [
    `${brand}${name} 판매해요.`,
    `상태: ${cond}`,
    size || seasons.length ? `${size}${seasons.length ? `${seasons.join("·")} 옷이에요.` : ""}`.trim() : "",
    "깨끗하게 보관했어요. 직거래·택배 모두 가능합니다 :)",
    tags,
  ].filter(Boolean).join("\n");

  return { title, price: estimateResalePrice(item, 0), body };
}

// ─── 이번 달 통계 (데일리 루프 머니 요약) ────────────────────────────────────
/**
 * @param {Object[]} items   — closet items
 * @param {Object}   history — { [dateStr"YYYY-MM-DD"]: { itemIds } } (useWearLogs)
 * @param {number}   year
 * @param {number}   month0  — 0-indexed month
 * @returns {{ wearEvents:number, itemsWorn:number, extracted:number, daysWorn:number }}
 *   wearEvents : 이번 달 착용 횟수(아이템 단위 합)
 *   itemsWorn  : 이번 달 입은 서로 다른 아이템 수
 *   extracted  : 이번 달 옷장에서 "뽑은 값"(회당 목표단가 × 착용횟수, 가격 있는 옷만)
 *   daysWorn   : 이번 달 기록한 날 수
 */
export function getMonthlyStats(items = [], history = {}, year, month0) {
  const prefix = `${year}-${String(month0 + 1).padStart(2, "0")}`;
  const byId = new Map(items.map((i) => [i.id, i]));
  let wearEvents = 0, extracted = 0, daysWorn = 0;
  const worn = new Set();

  Object.keys(history).forEach((dateStr) => {
    if (!dateStr.startsWith(prefix)) return;
    const ids = history[dateStr]?.itemIds ?? [];
    if (ids.length) daysWorn++;
    ids.forEach((id) => {
      wearEvents++;
      worn.add(id);
      const item = byId.get(id);
      if (item) {
        const pb = getItemPayback(item, 1);
        if (pb.hasPrice) extracted += Math.round(pb.price / pb.targetWears);
      }
    });
  });

  return { wearEvents, itemsWorn: worn.size, extracted, daysWorn };
}
