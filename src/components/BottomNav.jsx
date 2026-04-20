const YELLOW = "#F5C200";
const BLACK  = "#1a1a1a";

function HomeIcon({ active }) {
  const c = active ? YELLOW : BLACK;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path
        d="M2 9.5L11 2L20 9.5V20C20 20.55 19.55 21 19 21H14V15H8V21H3C2.45 21 2 20.55 2 20V9.5Z"
        fill={active ? YELLOW : "none"}
        stroke={c}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon({ active }) {
  const c = active ? YELLOW : BLACK;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="9.5" cy="9.5" r="7" stroke={c} strokeWidth="1.6" />
      <path d="M14.5 14.5L20 20" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ClosetIcon({ active }) {
  const c = active ? YELLOW : BLACK;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      {/* hanger hook */}
      <path d="M11 3C11 3 9 4 9 5.5C9 6.6 9.9 7.2 11 7.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 3C11 3 13 4 13 5.5C13 6.6 12.1 7.2 11 7.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      {/* hanger body */}
      <path
        d="M11 7.5L2 14.5H20L11 7.5Z"
        stroke={c}
        fill={active ? "rgba(245,194,0,0.18)" : "none"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* rod */}
      <path d="M2 14.5H20" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SellIcon({ active }) {
  const c = active ? YELLOW : BLACK;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path
        d="M13 2H6C4.9 2 4 2.9 4 4V18C4 19.1 4.9 20 6 20H16C17.1 20 18 19.1 18 18V7L13 2Z"
        stroke={c}
        fill={active ? "rgba(245,194,0,0.18)" : "none"}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M13 2V7H18" stroke={c} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 12H14" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 15.5H11" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon({ active }) {
  const c = active ? YELLOW : BLACK;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="8" r="3.5" stroke={c} strokeWidth="1.6" />
      <path d="M4 20C4 16.13 7.13 13 11 13C14.87 13 18 16.13 18 20" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const TABS = [
  { id: "home",   label: "홈",   Icon: HomeIcon   },
  { id: "search", label: "검색", Icon: SearchIcon },
  { id: "closet", label: "옷장", Icon: ClosetIcon },
  { id: "sell",   label: "판매", Icon: SellIcon   },
  { id: "menu",   label: "메뉴", Icon: MenuIcon   },
];

export default function BottomNav({ active, onTabChange }) {
  return (
    <div
      className="flex items-center justify-around bg-white border-t border-[#EEEEEE] shrink-0"
      style={{ height: 62, paddingBottom: 6 }}
    >
      {TABS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className="flex flex-col items-center gap-[3px] flex-1 pt-2"
            style={{ minWidth: 0 }}
          >
            <Icon active={isActive} />
            <span
              className="text-[10px] leading-none"
              style={{
                color: isActive ? YELLOW : BLACK,
                fontFamily: "'Spoqa Han Sans Neo', sans-serif",
                fontWeight: isActive ? 700 : 400,
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
