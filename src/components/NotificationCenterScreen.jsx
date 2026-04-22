/**
 * NotificationCenterScreen.jsx
 *
 * In-app notification center opened from the bell icon.
 * Two tabs: 내 옷장 알림 / 남의 옷장 알림.
 *
 * Props:
 *   onBack   : () => void
 *   onAction : (notification) => void  — parent handles routing
 */

import { useState } from "react";
import {
  ALL_NOTIFICATIONS,
  BADGE_CONFIG,
} from "../lib/mockNotifications";

const FONT   = "'Spoqa Han Sans Neo', sans-serif";
const DARK   = "#1a1a1a";
const YELLOW = "#F5C200";

// ─── Icon map by notification type ───────────────────────────────────────────
function NotifIcon({ type }) {
  const props = { width: 18, height: 18, viewBox: "0 0 18 18", fill: "none" };
  if (type === "unworn" || type === "seasonal")
    return (
      <svg {...props}>
        <path d="M9 2L11 6H16L12.5 9L14 13.5L9 11L4 13.5L5.5 9L2 6H7L9 2Z"
          stroke="#B8860B" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    );
  if (type === "frequent")
    return (
      <svg {...props}>
        <circle cx="9" cy="9" r="6.5" stroke="#2E7D32" strokeWidth="1.3" />
        <path d="M9 5.5V9.5L11.5 12" stroke="#2E7D32" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  if (type === "resale")
    return (
      <svg {...props}>
        <path d="M3 14L6 3H12L15 14" stroke="#E65100" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.5 10H12.5" stroke="#E65100" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  if (type === "manage")
    return (
      <svg {...props}>
        <circle cx="9" cy="9" r="6.5" stroke="#C62828" strokeWidth="1.3" />
        <path d="M9 6V9.5" stroke="#C62828" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="9" cy="12" r="0.8" fill="#C62828" />
      </svg>
    );
  if (type === "follow")
    return (
      <svg {...props}>
        <circle cx="9" cy="7" r="3" stroke="#555" strokeWidth="1.3" />
        <path d="M3 16C3 13 5.7 11 9 11C12.3 11 15 13 15 16" stroke="#555" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  // favorite / style / purchase
  return (
    <svg {...props}>
      <path d="M9 15L3 9C2.3 8.3 2 7.5 2 6.5C2 4.6 3.6 3 5.5 3C6.6 3 7.6 3.6 8.3 4.4L9 5.2L9.7 4.4C10.4 3.6 11.4 3 12.5 3C14.4 3 16 4.6 16 6.5C16 7.5 15.7 8.3 15 9L9 15Z"
        stroke="#AD1457" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Single notification card ─────────────────────────────────────────────────
function NotificationCard({ notification, onTap }) {
  const badgeCfg = BADGE_CONFIG[notification.badge] ?? { bg: "#F5F5F5", text: "#555" };

  return (
    <button
      onClick={() => onTap(notification)}
      className="w-full text-left relative transition-opacity active:opacity-60"
      style={{
        backgroundColor: notification.isRead ? "white" : "#FFFDF5",
        borderBottom: "1px solid #F5F5F5",
      }}
    >
      {/* Unread accent bar — left edge */}
      {!notification.isRead && (
        <div
          className="absolute left-0 top-0 bottom-0"
          style={{ width: 3, backgroundColor: YELLOW, borderRadius: "0 2px 2px 0" }}
        />
      )}

      <div className="flex items-start gap-3 px-5 py-4">
        {/* Type icon circle */}
        <div
          className="shrink-0 flex items-center justify-center rounded-full mt-0.5"
          style={{
            width: 36,
            height: 36,
            backgroundColor: badgeCfg.bg,
          }}
        >
          <NotifIcon type={notification.type} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Badge + timestamp */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
              style={{ backgroundColor: badgeCfg.bg, color: badgeCfg.text, fontFamily: FONT }}
            >
              {notification.badge}
            </span>
            <span
              className="text-[10px] shrink-0"
              style={{ color: "#CCCCCC", fontFamily: FONT }}
            >
              {notification.timeAgo}
            </span>
          </div>

          {/* Title */}
          <p
            className="text-[13px] leading-snug"
            style={{
              color:      notification.isRead ? "#666" : DARK,
              fontFamily: FONT,
              fontWeight: notification.isRead ? 400 : 600,
            }}
          >
            {notification.title}
          </p>

          {/* Body */}
          {notification.body ? (
            <p
              className="text-[11px] mt-1 leading-relaxed"
              style={{ color: "#AAAAAA", fontFamily: FONT }}
            >
              {notification.body}
            </p>
          ) : null}

          {/* CTA row */}
          {notification.ctaLabel ? (
            <div className="flex items-center gap-1 mt-2">
              <span
                className="text-[11px] font-bold"
                style={{ color: YELLOW, fontFamily: FONT }}
              >
                {notification.ctaLabel}
              </span>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M3 2L7 5L3 8" stroke={YELLOW} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ) : null}
        </div>

        {/* Right chevron */}
        <div className="shrink-0 mt-1">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3L9 7L5 11" stroke="#DDDDDD" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </button>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 px-8">
      <span style={{ fontSize: 48 }}>🔔</span>
      <p
        className="text-[14px] font-medium text-center"
        style={{ color: "#AAAAAA", fontFamily: FONT }}
      >
        아직 알림이 없어요
      </p>
      <p
        className="text-[12px] text-center leading-relaxed"
        style={{ color: "#CCCCCC", fontFamily: FONT }}
      >
        새로운 활동이 생기면{"\n"}여기에 보여드릴게요
      </p>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function NotificationCenterScreen({ onBack, onAction }) {
  const [activeTab, setActiveTab] = useState("my"); // "my" | "others"

  // Local copy so we can toggle isRead without a global store
  const [notifications, setNotifications] = useState(() =>
    ALL_NOTIFICATIONS.map((n) => ({ ...n }))
  );

  const myItems    = notifications.filter((n) => n.sourceGroup === "my_closet");
  const otherItems = notifications.filter((n) => n.sourceGroup === "other_closet");
  const myUnread   = myItems.filter((n) => !n.isRead).length;
  const otherUnread = otherItems.filter((n) => !n.isRead).length;
  const totalUnread = myUnread + otherUnread;

  const current = activeTab === "my" ? myItems : otherItems;

  function markRead(id) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }

  function markAllRead() {
    setNotifications((prev) =>
      prev.map((n) =>
        n.sourceGroup === (activeTab === "my" ? "my_closet" : "other_closet")
          ? { ...n, isRead: true }
          : n
      )
    );
  }

  function handleTap(notification) {
    markRead(notification.id);
    onAction(notification);
  }

  const tabs = [
    { id: "my",     label: "내 옷장 알림",   unread: myUnread    },
    { id: "others", label: "남의 옷장 알림",  unread: otherUnread },
  ];

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-white">

      {/* ── Header ── */}
      <div
        className="shrink-0 flex items-center justify-between px-4 h-14"
        style={{ borderBottom: "1px solid #F0F0F0" }}
      >
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 4L7 10L12.5 16" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <h2
            className="text-[17px] font-bold"
            style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}
          >
            알림
          </h2>
          {totalUnread > 0 && (
            <span
              className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: YELLOW, color: DARK, fontFamily: FONT }}
            >
              {totalUnread}
            </span>
          )}
        </div>

        {/* Mark all read for current tab */}
        <button
          onClick={markAllRead}
          className="px-2 py-1"
        >
          <span
            className="text-[11px]"
            style={{ color: "#AAAAAA", fontFamily: FONT }}
          >
            모두 읽음
          </span>
        </button>
      </div>

      {/* ── Segment tabs ── */}
      <div
        className="shrink-0 flex"
        style={{ borderBottom: "1px solid #F0F0F0" }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex flex-col items-center pt-3.5 pb-0"
            >
              <div className="flex items-center justify-center gap-1.5 pb-3">
                <span
                  className="text-[13px]"
                  style={{
                    color:      isActive ? DARK : "#AAAAAA",
                    fontWeight: isActive ? 700  : 400,
                    fontFamily: FONT,
                  }}
                >
                  {tab.label}
                </span>
                {tab.unread > 0 && (
                  <span
                    className="text-[9px] font-bold px-1.5 rounded-full"
                    style={{
                      backgroundColor: isActive ? YELLOW : "#F0F0F0",
                      color:           isActive ? DARK   : "#AAAAAA",
                      fontFamily:      FONT,
                      lineHeight:      "16px",
                    }}
                  >
                    {tab.unread}
                  </span>
                )}
              </div>
              <div
                style={{
                  height:          2,
                  width:           "100%",
                  backgroundColor: isActive ? DARK : "transparent",
                  borderRadius:    1,
                }}
              />
            </button>
          );
        })}
      </div>

      {/* ── Notification list ── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {current.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {current.map((n) => (
              <NotificationCard key={n.id} notification={n} onTap={handleTap} />
            ))}
            <div style={{ height: 24 }} />
          </>
        )}
      </div>
    </div>
  );
}
