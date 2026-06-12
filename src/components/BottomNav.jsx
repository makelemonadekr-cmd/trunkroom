/**
 * BottomNav.jsx — v3 게임형 3탭 내비게이션
 *
 * 홈 / 내 옷장(센터 원형) / 기록.
 * 발견·메뉴 탭은 v3에서 동면 — 메뉴는 홈 헤더 톱니로 진입.
 * 클로리스풍: 큼직한 아이콘, 통통 튀는 액티브 상태.
 */

const YELLOW = "#F5C200";
const BLACK  = "#1a1a1a";
const FONT   = "'Spoqa Han Sans Neo', sans-serif";

function HomeIcon({ active }) {
  const c = active ? BLACK : "#B5B5B5";
  return (
    <svg width="26" height="26" viewBox="0 0 22 22" fill="none">
      <path
        d="M2 9.5L11 2L20 9.5V20C20 20.55 19.55 21 19 21H14V15H8V21H3C2.45 21 2 20.55 2 20V9.5Z"
        fill={active ? YELLOW : "none"}
        stroke={c}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RecordIcon({ active }) {
  const c = active ? BLACK : "#B5B5B5";
  return (
    <svg width="26" height="26" viewBox="0 0 22 22" fill="none">
      <rect
        x="3" y="5" width="16" height="14"
        rx="3"
        stroke={c}
        strokeWidth="1.8"
        fill={active ? YELLOW : "none"}
      />
      <path d="M8 2V5M14 2V5" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3 9H19" stroke={c} strokeWidth="1.4" />
      <circle cx="7.5"  cy="13" r="1.1" fill={c} />
      <circle cx="11"   cy="13" r="1.1" fill={c} />
      <circle cx="14.5" cy="13" r="1.1" fill={c} />
      <circle cx="7.5"  cy="16.5" r="1.1" fill={c} />
      <circle cx="11"   cy="16.5" r="1.1" fill={c} />
    </svg>
  );
}

function SideTab({ id, label, Icon, active, onTabChange }) {
  return (
    <button
      onClick={() => onTabChange(id)}
      className="flex flex-col items-center gap-[4px] flex-1 pt-2 transition-transform active:scale-90"
      style={{ minWidth: 0 }}
    >
      <Icon active={active} />
      <span
        className="text-[11px] leading-none"
        style={{
          color:      active ? BLACK : "#B5B5B5",
          fontFamily: FONT,
          fontWeight: active ? 700 : 500,
        }}
      >
        {label}
      </span>
    </button>
  );
}

// 센터 옷장 탭 — 떠 있는 큰 원. 어디서든 최상위.
function ClosetLogoTab({ active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center flex-1 relative transition-transform active:scale-90"
      style={{ minWidth: 0, paddingTop: 30, height: "100%" }}
      aria-label="내 옷장"
    >
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          position: "absolute",
          left: "50%",
          top: -24,
          transform: "translateX(-50%)",
          width: 64,
          height: 64,
          backgroundColor: active ? YELLOW : "#FFF7DB",
          boxShadow: active
            ? "0 6px 18px rgba(245,194,0,0.5)"
            : "0 5px 16px rgba(0,0,0,0.16)",
          transition: "background-color 0.2s, transform 0.2s",
          border: "4px solid white",
          zIndex: 1000,
        }}
      >
        <img
          src="/officiallogo.png"
          alt="옷장"
          style={{
            width: 38,
            height: 38,
            objectFit: "contain",
            filter: active ? "brightness(0)" : "none",
          }}
        />
      </div>
      <span
        className="text-[11px] leading-none mt-auto"
        style={{
          color:      active ? BLACK : "#B5B5B5",
          fontFamily: FONT,
          fontWeight: active ? 700 : 500,
          marginBottom: 6,
        }}
      >
        내 옷장
      </span>
    </button>
  );
}

export default function BottomNav({ active, onTabChange }) {
  return (
    <div
      className="flex items-end justify-around bg-white shrink-0 relative"
      style={{
        paddingBottom: "max(4px, env(safe-area-inset-bottom))",
        height: "calc(64px + max(0px, env(safe-area-inset-bottom)))",
        zIndex: 200,
        overflow: "visible",
        borderTop: "1px solid #F0F0F0",
        boxShadow: "0 -4px 16px rgba(0,0,0,0.04)",
      }}
    >
      <SideTab id="home" label="홈" Icon={HomeIcon} active={active === "home"} onTabChange={onTabChange} />
      <ClosetLogoTab active={active === "closet"} onClick={() => onTabChange("closet")} />
      <SideTab id="record" label="기록" Icon={RecordIcon} active={active === "record"} onTabChange={onTabChange} />
    </div>
  );
}
