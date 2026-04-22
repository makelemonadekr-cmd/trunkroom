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

function CodiIcon({ active }) {
  const c = active ? YELLOW : BLACK;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      {/* Back card */}
      <rect
        x="8" y="2" width="12" height="15"
        rx="2"
        stroke={c}
        strokeWidth="1.5"
        fill={active ? "rgba(245,194,0,0.12)" : "none"}
      />
      {/* Front card */}
      <rect
        x="2" y="5" width="12" height="15"
        rx="2"
        stroke={c}
        strokeWidth="1.5"
        fill={active ? "rgba(245,194,0,0.20)" : "white"}
      />
      {/* Decorative lines on front card */}
      <path d="M5 10H11" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5 13H9" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon({ active }) {
  const c = active ? YELLOW : BLACK;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M3 6H19"  stroke={c} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M3 11H19" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M3 16H19" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// Center closet tab — uses the official logo image
function ClosetLogoTab({ active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center flex-1 relative"
      style={{ minWidth: 0, paddingTop: 6 }}
      aria-label="옷장"
    >
      {/* Elevated circle bg */}
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: 46,
          height: 46,
          backgroundColor: active ? "#F5C200" : "#F5F5F5",
          marginTop: -14,
          boxShadow: active ? "0 2px 12px rgba(245,194,0,0.35)" : "0 2px 12px rgba(0,0,0,0.13)",
          transition: "background-color 0.2s",
        }}
      >
        <img
          src="/officiallogo.png"
          alt="옷장"
          style={{
            width: 28,
            height: 28,
            objectFit: "contain",
            filter: active ? "brightness(0)" : "none",
          }}
        />
      </div>
      <span
        className="text-[10px] leading-none mt-1"
        style={{
          color: active ? YELLOW : BLACK,
          fontFamily: "'Spoqa Han Sans Neo', sans-serif",
          fontWeight: active ? 700 : 400,
        }}
      >
        옷장
      </span>
    </button>
  );
}

const SIDE_TABS = [
  { id: "home",  label: "홈",   Icon: HomeIcon  },
  { id: "sell",  label: "판매", Icon: SellIcon  },
  // center is handled separately
  { id: "codi",  label: "코디", Icon: CodiIcon  },
  { id: "menu",  label: "메뉴", Icon: MenuIcon  },
];

export default function BottomNav({ active, onTabChange }) {
  // Split into left-2 + center + right-2
  const leftTabs  = SIDE_TABS.slice(0, 2);
  const rightTabs = SIDE_TABS.slice(2);

  return (
    <div
      className="flex items-end justify-around bg-white border-t border-[#EEEEEE] shrink-0"
      style={{ height: 60, paddingBottom: 4 }}
    >
      {leftTabs.map(({ id, label, Icon }) => {
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

      {/* Center: 옷장 logo tab */}
      <ClosetLogoTab active={active === "closet"} onClick={() => onTabChange("closet")} />

      {rightTabs.map(({ id, label, Icon }) => {
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
