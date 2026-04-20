export default function TopBar({ notificationCount = 4 }) {
  return (
    <div className="flex items-center gap-3 px-4 h-12 bg-white border-b border-[#F5F5F5] shrink-0">
      {/* Search bar */}
      <div className="flex-1 flex items-center gap-2 h-9 bg-[#F5F5F5] rounded-sm px-3">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="6.5" cy="6.5" r="5" stroke="#AAAAAA" strokeWidth="1.4" />
          <path d="M10.5 10.5L14 14" stroke="#AAAAAA" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <span
          className="text-[13px]"
          style={{ color: "#BBBBBB", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
        >
          브랜드, 스타일, 셀러 검색
        </span>
      </div>

      {/* Icons */}
      <div className="flex items-center gap-1">
        {/* Wishlist */}
        <button className="w-9 h-9 flex items-center justify-center">
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
        <button className="w-9 h-9 flex items-center justify-center relative">
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

        {/* Hamburger / menu */}
        <button className="w-9 h-9 flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M3 6H19" stroke="#333" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M3 11H19" stroke="#333" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M3 16H19" stroke="#333" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
