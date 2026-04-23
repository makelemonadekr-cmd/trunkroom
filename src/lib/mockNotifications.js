/**
 * mockNotifications.js
 *
 * Notification data model + mock seed data.
 * Designed for easy backend replacement: swap the arrays with API calls,
 * keep the shape identical.
 *
 * Notification schema:
 *   id            : string
 *   type          : "unworn" | "frequent" | "resale" | "manage" | "seasonal"
 *                   | "favorite" | "follow" | "style" | "purchase"
 *   sourceGroup   : "my_closet" | "other_closet"
 *   badge         : string  — human-readable type label shown in the card chip
 *   title         : string  — primary message
 *   body          : string  — supporting line (optional, can be "")
 *   timeAgo       : string  — pre-formatted relative timestamp for mock display
 *   isRead        : boolean
 *   relatedItemIds: string[]
 *   relatedClosetId: string | null
 *   relatedStyle  : string | null  — style tag to filter by (e.g. "미니멀")
 *   relatedRoute  : "unworn_list" | "worn_list" | "sell_flow" | "manage_items"
 *                   | "seasonal_items" | "closet_view" | "style_results" | null
 *   ctaLabel      : string | null
 */

// ─── Badge → color config ─────────────────────────────────────────────────────
export const BADGE_CONFIG = {
  "정리":       { bg: "#FFF8DC", text: "#B8860B" },
  "자주 입음":  { bg: "#E8F5E9", text: "#2E7D32" },
  "판매 추천":  { bg: "#FFF3E0", text: "#E65100" },
  "관리 필요":  { bg: "#FFEBEE", text: "#C62828" },
  "계절 알림":  { bg: "#E0F7FA", text: "#00695C" },
  "즐겨찾기":   { bg: "#FCE4EC", text: "#AD1457" },
  "팔로우":     { bg: "#F3F3F3", text: "#555555" },
  "스타일 추천":{ bg: "#F3E5F5", text: "#6A1B9A" },
  "새 아이템":  { bg: "#E3F2FD", text: "#1565C0" },
  "관심 아이템":{ bg: "#FCE4EC", text: "#AD1457" },
};

// ─── 내 옷장 알림 ─────────────────────────────────────────────────────────────
export const MY_CLOSET_NOTIFICATIONS = [
  {
    id: "mc-1",
    type: "unworn",
    sourceGroup: "my_closet",
    badge: "정리",
    title: "1년 동안 안 입은 옷이 12개 있어요",
    body: "오래 보관 중인 아이템을 정리해볼까요?",
    timeAgo: "방금 전",
    isRead: false,
    relatedItemIds: [],
    relatedClosetId: null,
    relatedStyle: null,
    relatedRoute: "unworn_list",
    ctaLabel: "목록 보기",
  },
  {
    id: "mc-2",
    type: "resale",
    sourceGroup: "my_closet",
    badge: "판매 추천",
    title: "1년 이상 안 입은 옷, 판매 초안으로 만들어볼까요?",
    body: "사진 한 장으로 판매 초안을 바로 만들 수 있어요",
    timeAgo: "2시간 전",
    isRead: false,
    relatedItemIds: [],
    relatedClosetId: null,
    relatedStyle: null,
    relatedRoute: "sell_flow",
    ctaLabel: "초안 만들기",
  },
  {
    id: "mc-3",
    type: "frequent",
    sourceGroup: "my_closet",
    badge: "자주 입음",
    title: "이번 달 가장 자주 입은 아이템 TOP 3",
    body: "스트레이트 데님 · 베이직 맨투맨 · 에어포스 1",
    timeAgo: "어제",
    isRead: false,
    relatedItemIds: ["item-38", "item-27", "item-108"],
    relatedClosetId: null,
    relatedStyle: null,
    relatedRoute: "worn_list",
    ctaLabel: "보러가기",
  },
  {
    id: "mc-4",
    type: "manage",
    sourceGroup: "my_closet",
    badge: "관리 필요",
    title: "자동 인식 결과를 확인하지 않은 아이템이 있어요",
    body: "AI가 분석한 결과를 검토하고 완성해주세요",
    timeAgo: "2일 전",
    isRead: true,
    relatedItemIds: [],
    relatedClosetId: null,
    relatedStyle: null,
    relatedRoute: "manage_items",
    ctaLabel: "검토하기",
  },
  {
    id: "mc-5",
    type: "seasonal",
    sourceGroup: "my_closet",
    badge: "계절 알림",
    title: "지금 꺼내면 좋은 봄 아이템이 있어요",
    body: "린넨 셔츠, 반팔 티셔츠 카테고리를 확인해보세요",
    timeAgo: "3일 전",
    isRead: true,
    relatedItemIds: [],
    relatedClosetId: null,
    relatedStyle: null,
    relatedRoute: "seasonal_items",
    ctaLabel: "보러가기",
  },
  {
    id: "mc-6",
    type: "unworn",
    sourceGroup: "my_closet",
    badge: "정리",
    title: "이 셔츠, 6개월째 안 입었어요",
    body: "체크 패턴 셔츠가 오랫동안 잠들어 있어요",
    timeAgo: "4일 전",
    isRead: true,
    relatedItemIds: ["item-12"],
    relatedClosetId: null,
    relatedStyle: null,
    relatedRoute: "unworn_list",
    ctaLabel: null,
  },
  {
    id: "mc-7",
    type: "frequent",
    sourceGroup: "my_closet",
    badge: "자주 입음",
    title: "이번 주 비슷한 스타일을 자주 입었어요",
    body: "다양한 조합을 시도해볼까요?",
    timeAgo: "5일 전",
    isRead: true,
    relatedItemIds: [],
    relatedClosetId: null,
    relatedStyle: null,
    relatedRoute: "worn_list",
    ctaLabel: null,
  },
  {
    id: "mc-8",
    type: "manage",
    sourceGroup: "my_closet",
    badge: "관리 필요",
    title: "브랜드 정보가 비어 있는 아이템이 있어요",
    body: "정보를 완성하면 검색과 필터가 더 정확해져요",
    timeAgo: "1주 전",
    isRead: true,
    relatedItemIds: [],
    relatedClosetId: null,
    relatedStyle: null,
    relatedRoute: "manage_items",
    ctaLabel: null,
  },
];

// ─── 남의 옷장 알림 ───────────────────────────────────────────────────────────
export const OTHER_CLOSET_NOTIFICATIONS = [
  {
    id: "oc-1",
    type: "favorite",
    sourceGroup: "other_closet",
    badge: "즐겨찾기",
    title: "즐겨찾기한 아이템과 비슷한 스타일이 올라왔어요",
    body: "미니멀 스타일의 새 아이템을 확인해보세요",
    timeAgo: "1시간 전",
    isRead: false,
    relatedItemIds: [],
    relatedClosetId: null,
    relatedStyle: "미니멀",
    relatedRoute: "style_results",
    ctaLabel: "보러가기",
  },
  {
    id: "oc-2",
    type: "follow",
    sourceGroup: "other_closet",
    badge: "팔로우",
    title: "팔로우한 옷장에 새 아이템이 등록됐어요",
    body: "새로운 아우터 아이템 3개가 추가됐어요",
    timeAgo: "3시간 전",
    isRead: false,
    relatedItemIds: [],
    relatedClosetId: "closet-01",
    relatedStyle: null,
    relatedRoute: "closet_view",
    ctaLabel: "확인하기",
  },
  {
    id: "oc-3",
    type: "purchase",
    sourceGroup: "other_closet",
    badge: "새 아이템",
    title: "관심 있던 아이템이 판매 등록됐어요",
    body: "즐겨찾기해둔 스타일의 아이템이 판매를 시작했어요",
    timeAgo: "어제",
    isRead: false,
    relatedItemIds: [],
    relatedClosetId: null,
    relatedStyle: null,
    relatedRoute: "style_results",
    ctaLabel: "보러가기",
  },
  {
    id: "oc-4",
    type: "style",
    sourceGroup: "other_closet",
    badge: "스타일 추천",
    title: "좋아할 만한 미니멀 스타일이 올라왔어요",
    body: "내 취향에 맞는 새 스타일을 발견했어요",
    timeAgo: "2일 전",
    isRead: true,
    relatedItemIds: [],
    relatedClosetId: null,
    relatedStyle: "미니멀",
    relatedRoute: "style_results",
    ctaLabel: null,
  },
  {
    id: "oc-5",
    type: "follow",
    sourceGroup: "other_closet",
    badge: "팔로우",
    title: "팔로우한 옷장이 스타일북을 업데이트했어요",
    body: "새로운 스타일 3개가 추가됐어요",
    timeAgo: "3일 전",
    isRead: true,
    relatedItemIds: [],
    relatedClosetId: "closet-01",
    relatedStyle: null,
    relatedRoute: "closet_view",
    ctaLabel: null,
  },
  {
    id: "oc-6",
    type: "style",
    sourceGroup: "other_closet",
    badge: "스타일 추천",
    title: "즐겨찾기한 하객룩과 비슷한 스타일을 찾았어요",
    body: "하객룩에 어울리는 새 드레스가 올라왔어요",
    timeAgo: "4일 전",
    isRead: true,
    relatedItemIds: [],
    relatedClosetId: null,
    relatedStyle: "하객룩",
    relatedRoute: "style_results",
    ctaLabel: null,
  },
  {
    id: "oc-7",
    type: "favorite",
    sourceGroup: "other_closet",
    badge: "관심 아이템",
    title: "관심 있던 아이템의 정보가 업데이트됐어요",
    body: "사이즈 정보와 가격이 새롭게 업데이트됐어요",
    timeAgo: "5일 전",
    isRead: true,
    relatedItemIds: [],
    relatedClosetId: null,
    relatedStyle: null,
    relatedRoute: "style_results",
    ctaLabel: null,
  },
];

export const ALL_NOTIFICATIONS = [
  ...MY_CLOSET_NOTIFICATIONS,
  ...OTHER_CLOSET_NOTIFICATIONS,
];

/** Count of unread notifications across both groups */
export const INITIAL_UNREAD_COUNT = ALL_NOTIFICATIONS.filter((n) => !n.isRead).length;
