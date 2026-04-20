const TABS = [
  {
    id: "home",
    label: "홈",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M2 9.5L11 2L20 9.5V20C20 20.55 19.55 21 19 21H14V15H8V21H3C2.45 21 2 20.55 2 20V9.5Z"
          fill={active ? "#333333" : "none"}
          stroke={active ? "#333333" : "#999"}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "search",
    label: "검색",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="9.5" cy="9.5" r="7" stroke={active ? "#333333" : "#999"} strokeWidth="1.6" />
        <path d="M14.5 14.5L20 20" stroke={active ? "#333333" : "#999"} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "sell",
    label: "판매",
    icon: () => (
      <div
        className="w-[48px] h-[48px] rounded-full flex items-center justify-center shadow-md"
        style={{ backgroundColor: "#333333", marginTop: -18 }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 4V18" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <path d="M4 11H18" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    ),
    noLabel: true,
  },
  {
    id: "closet",
    label: "옷장",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M11 3C9 3 7 4.5 7 7C7 9 8.5 10.5 11 12C13.5 10.5 15 9 15 7C15 4.5 13 3 11 3Z"
          fill={active ? "#333333" : "none"}
          stroke={active ? "#333333" : "#999"}
          strokeWidth="1.5"
        />
        <path d="M3 19L11 12L19 19" stroke={active ? "#333333" : "#999"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="3" y="19" width="16" height="2" rx="1" fill={active ? "#333333" : "#999"} />
      </svg>
    ),
  },
  {
    id: "menu",
    label: "메뉴",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="8" r="3.5" stroke={active ? "#333333" : "#999"} strokeWidth="1.6" />
        <path d="M4 20C4 16.13 7.13 13 11 13C14.87 13 18 16.13 18 20" stroke={active ? "#333333" : "#999"} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function BottomNav({ active, onTabChange }) {
  return (
    <div
      className="flex items-end justify-around bg-white border-t border-[#EEEEEE]"
      style={{ height: 72, paddingBottom: 10, paddingTop: 4 }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center gap-[3px] flex-1"
            style={{ minWidth: 0 }}
          >
            {tab.icon(isActive)}
            {!tab.noLabel && (
              <span
                className="text-[10px] leading-none"
                style={{
                  color: isActive ? "#333333" : "#999",
                  fontFamily: "'Spoqa Han Sans Neo', sans-serif",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {tab.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
