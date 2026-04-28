/**
 * useNotifications.js
 *
 * Computes in-app notifications from real Supabase data:
 *   - Wear history  (useWearLogs)
 *   - Closet items  (useCloset)
 *   - Follow state  (useFollow / FollowContext)
 *
 * Read state is persisted in localStorage under "trunkroom_notif_reads".
 *
 * Usage:
 *   const { notifications, unreadCount, markRead, markAllRead, loading } =
 *     useNotifications(user?.id);
 */

import { useState, useMemo, useCallback } from "react";
import { useWearLogs, getItemWearFrequency, getItemLastWornDates, localDateStr } from "./useWearLogs.js";
import { useCloset }  from "./useCloset.js";
import { useFollow }  from "../lib/followContext.jsx";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCurrentSeason() {
  const m = new Date().getMonth() + 1; // 1-12
  if (m >= 3  && m <= 5)  return "봄";
  if (m >= 6  && m <= 8)  return "여름";
  if (m >= 9  && m <= 11) return "가을";
  return "겨울";
}

function relativeTimeLabel(dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr + "T12:00:00").getTime()) / 86400000);
  if (diff === 0) return "오늘";
  if (diff === 1) return "어제";
  if (diff < 7)  return `${diff}일 전`;
  return `${Math.floor(diff / 7)}주 전`;
}

// ── Read-state persistence ────────────────────────────────────────────────────

const LS_KEY = "trunkroom_notif_reads";

function loadReadKeys() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveReadKeys(set) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...set]));
  } catch { /* ignore */ }
}

// ── Notification generator ────────────────────────────────────────────────────

function buildNotifications({ history, closetItems, followedIds }) {
  const today       = localDateStr(new Date());
  const currentMonth = today.slice(0, 7); // "YYYY-MM"
  const season      = getCurrentSeason();

  const freq     = getItemWearFrequency(history);
  const lastWorn = getItemLastWornDates(history);

  const myNotifs    = [];
  const otherNotifs = [];

  // ── 내 옷장 알림 ────────────────────────────────────────────────────────────

  // 1. Items not worn in 90+ days (or never worn)
  const unwornItems = closetItems.filter((item) => {
    const lw = lastWorn.get(item.id);
    if (!lw) return true; // never recorded
    const daysSince = Math.floor(
      (new Date(today).getTime() - new Date(lw + "T12:00:00").getTime()) / 86400000
    );
    return daysSince >= 90;
  });
  if (unwornItems.length > 0) {
    myNotifs.push({
      key:          "unworn_90d",
      type:         "unworn",
      sourceGroup:  "my_closet",
      badge:        "정리",
      title:        `${unwornItems.length}개 아이템이 90일 이상 안 입혔어요`,
      body:         "오래 보관 중인 아이템을 정리해볼까요?",
      timeAgo:      "방금 전",
      relatedItemIds: unwornItems.slice(0, 10).map((i) => i.id),
      relatedRoute: "unworn_list",
      ctaLabel:     "목록 보기",
      createdAt:    today,
    });
  }

  // 2. Resale suggestion — items unworn 180+ days
  const resaleItems = closetItems.filter((item) => {
    const lw = lastWorn.get(item.id);
    if (!lw) return true;
    const daysSince = Math.floor(
      (new Date(today).getTime() - new Date(lw + "T12:00:00").getTime()) / 86400000
    );
    return daysSince >= 180;
  });
  if (resaleItems.length > 0) {
    myNotifs.push({
      key:          "resale_180d",
      type:         "resale",
      sourceGroup:  "my_closet",
      badge:        "판매 추천",
      title:        `${resaleItems.length}개 아이템을 판매해볼까요?`,
      body:         "6개월 이상 안 입은 아이템, 사진 한 장으로 판매 초안을 만들 수 있어요",
      timeAgo:      "방금 전",
      relatedItemIds: resaleItems.slice(0, 5).map((i) => i.id),
      relatedRoute: "sell_flow",
      ctaLabel:     "초안 만들기",
      createdAt:    today,
    });
  }

  // 3. Top worn items this month
  const monthKeys = Object.keys(history).filter((k) => k.startsWith(currentMonth));
  if (monthKeys.length >= 3) {
    const monthFreq = new Map();
    monthKeys.forEach((k) => {
      (history[k]?.itemIds ?? []).forEach((id) =>
        monthFreq.set(id, (monthFreq.get(id) ?? 0) + 1)
      );
    });
    const topItems = [...monthFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => closetItems.find((i) => i.id === id))
      .filter(Boolean);
    if (topItems.length >= 2) {
      const names = topItems
        .map((i) => i.display_name ?? i.displayName ?? i.name ?? "아이템")
        .join(" · ");
      myNotifs.push({
        key:          "frequent_month",
        type:         "frequent",
        sourceGroup:  "my_closet",
        badge:        "자주 입음",
        title:        "이번 달 가장 자주 입은 아이템 TOP 3",
        body:         names,
        timeAgo:      "오늘",
        relatedItemIds: topItems.map((i) => i.id),
        relatedRoute: "worn_list",
        ctaLabel:     "보러가기",
        createdAt:    today,
      });
    }
  }

  // 4. Seasonal items — closet items tagged with current season not worn in 30+ days
  const seasonalItems = closetItems.filter((item) => {
    const seasons = item.season ?? [];
    if (!seasons.includes(season)) return false;
    const lw = lastWorn.get(item.id);
    if (!lw) return true;
    const daysSince = Math.floor(
      (new Date(today).getTime() - new Date(lw + "T12:00:00").getTime()) / 86400000
    );
    return daysSince >= 30;
  });
  if (seasonalItems.length > 0) {
    myNotifs.push({
      key:          `seasonal_${season}`,
      type:         "seasonal",
      sourceGroup:  "my_closet",
      badge:        "계절 알림",
      title:        `지금 꺼내면 좋은 ${season} 아이템이 있어요`,
      body:         `${seasonalItems.length}개 아이템이 아직 장롱 속에 있어요`,
      timeAgo:      "방금 전",
      relatedItemIds: seasonalItems.slice(0, 5).map((i) => i.id),
      relatedRoute: "seasonal_items",
      ctaLabel:     "보러가기",
      createdAt:    today,
    });
  }

  // 5. Items with missing info (no image or no name)
  const incompleteItems = closetItems.filter(
    (i) => !i.image && !i.image_url
  );
  if (incompleteItems.length > 0) {
    myNotifs.push({
      key:          "manage_no_image",
      type:         "manage",
      sourceGroup:  "my_closet",
      badge:        "관리 필요",
      title:        `사진이 없는 아이템이 ${incompleteItems.length}개 있어요`,
      body:         "사진을 추가하면 AI 분류와 스타일 추천이 더 정확해져요",
      timeAgo:      "방금 전",
      relatedItemIds: incompleteItems.slice(0, 5).map((i) => i.id),
      relatedRoute: "manage_items",
      ctaLabel:     "수정하기",
      createdAt:    today,
    });
  }

  // ── 남의 옷장 알림 ──────────────────────────────────────────────────────────

  // 1. Followed sellers — check their closets
  if (followedIds.size > 0) {
    otherNotifs.push({
      key:          `follow_check_${followedIds.size}`,
      type:         "follow",
      sourceGroup:  "other_closet",
      badge:        "팔로우",
      title:        `팔로우 중인 옷장 ${followedIds.size}개에 새 아이템이 있을 수 있어요`,
      body:         "최근 업데이트를 확인해보세요",
      timeAgo:      "오늘",
      relatedItemIds: [],
      relatedClosetId: null,
      relatedRoute: "closet_view",
      ctaLabel:     "확인하기",
      createdAt:    today,
    });
  }

  // 2. Style preference suggestion based on user's most worn items
  const topStyleIds = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);
  if (topStyleIds.length > 0) {
    otherNotifs.push({
      key:          "style_rec",
      type:         "style",
      sourceGroup:  "other_closet",
      badge:        "스타일 추천",
      title:        "내 착용 패턴 기반 스타일을 발견했어요",
      body:         "자주 입는 아이템과 비슷한 스타일이 새로 올라왔어요",
      timeAgo:      "오늘",
      relatedItemIds: topStyleIds.slice(0, 3),
      relatedRoute: "style_results",
      ctaLabel:     "보러가기",
      createdAt:    today,
    });
  }

  return [...myNotifs, ...otherNotifs];
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @param {string|null} userId
 */
export function useNotifications(userId) {
  const { history, loading: logsLoading }         = useWearLogs(userId);
  const { items: closetItems, loading: closetLoading } = useCloset(userId);
  const { followedIds }                           = useFollow();

  const [readKeys, setReadKeys] = useState(() => loadReadKeys());

  const rawNotifications = useMemo(
    () => buildNotifications({ history, closetItems, followedIds }),
    [history, closetItems, followedIds]
  );

  // Merge with read state
  const notifications = useMemo(
    () => rawNotifications.map((n) => ({ ...n, isRead: readKeys.has(n.key) })),
    [rawNotifications, readKeys]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const markRead = useCallback((key) => {
    setReadKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      saveReadKeys(next);
      return next;
    });
  }, []);

  const markAllRead = useCallback((sourceGroup) => {
    setReadKeys((prev) => {
      const keys = rawNotifications
        .filter((n) => !sourceGroup || n.sourceGroup === sourceGroup)
        .map((n) => n.key);
      const next = new Set([...prev, ...keys]);
      saveReadKeys(next);
      return next;
    });
  }, [rawNotifications]);

  const loading = logsLoading || closetLoading;

  return { notifications, unreadCount, markRead, markAllRead, loading };
}
