export default function TopBar({ notificationCount = 0, onSearchTap, onFavoritesOpen, onNotificationsOpen, onMenuTap }) {
  return (
    <div className="flex items-center gap-3 px-4 h-12 bg-white border-b border-[#F5F5F5] shrink-0">
      {/* Search bar — tappable, opens SearchFilterScreen */}
      <button
        className="flex-1 flex items-center gap-2 h-9 bg-[#F5F5F5] rounded-xl px-3 text-left"
        onClick={onSearchTap}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="6.5" cy="6.5" r="5" stroke="#AAAAAA" strokeWidth="1.4" />
          <path d="M10.5 10.5L14 14" stroke="#AAAAAA" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <span
          className="text-[13px]"
          style={{ color: "#CCCCCC", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
        >
          검색
        </span>
      </button>

      {/* Icons */}
      <div className="flex items-center gap-1">
        {/* Favorites / Wishlist */}
        <button className="w-11 h-11 flex items-center justify-center transition-transform active:scale-90" onClick={onFavoritesOpen}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path
              d="M11 19L3.5 11.5C2.5 10.5 2 9.1 2 7.8C2 5.1 4.2 3 6.9 3C8.4 3 9.8 3.7 11 4.9C12.2 3.7 13.6 3 15.1 3C17.8 3 20 5.1 20 7.8C20 9.1 19.5 10.5 18.5 11.5L11 19Z"
              stroke="#333"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Notification bell with badge */}
        <button className="w-11 h-11 flex items-center justify-center relative transition-transform active:scale-90" onClick={onNotificationsOpen}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path
              d="M11 3C7.69 3 5 5.69 5 9V14L3 16H19L17 14V9C17 5.69 14.31 3 11 3Z"
              stroke="#333"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M9 18C9 19.1 9.9 20 11 20C12.1 20 13 19.1 13 18" stroke="#333" strokeWidth="1.5" />
          </svg>
          {notificationCount > 0 && (
            <div
              className="absolute top-1 right-1 w-[14px] h-[14px] rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#F5C200" }}
            >
              <span className="text-[8px] font-bold text-[#333]">{notificationCount}</span>
            </div>
          )}
        </button>

        {/* Settings / Menu — v3에서 메뉴 탭이 사라져 여기로 진입 */}
        {onMenuTap && (
          <button className="w-11 h-11 flex items-center justify-center transition-transform active:scale-90" onClick={onMenuTap} aria-label="메뉴">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="2.6" stroke="#333" strokeWidth="1.5" />
              <path
                d="M11 2.8V5M11 17V19.2M19.2 11H17M5 11H2.8M16.8 5.2L15.3 6.7M6.7 15.3L5.2 16.8M16.8 16.8L15.3 15.3M6.7 6.7L5.2 5.2"
                stroke="#333"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
