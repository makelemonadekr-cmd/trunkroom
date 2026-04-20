import { useState } from "react";
import TrunkRoomOnboarding from "./pages/onboarding/TrunkRoomOnboarding";
import HomePage from "./pages/home/HomePage";
import ClosetPage from "./pages/closet/ClosetPage";
import BottomNav from "./components/BottomNav";

const ONBOARDING_KEY = "trunkroom_onboarded";

function MainApp() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Page area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "home" && <HomePage />}
        {activeTab === "search" && <PlaceholderPage title="검색" />}
        {activeTab === "sell" && <PlaceholderPage title="판매" />}
        {activeTab === "closet" && <ClosetPage />}
        {activeTab === "menu" && <PlaceholderPage title="메뉴" />}
      </div>
      <BottomNav active={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

function PlaceholderPage({ title }) {
  return (
    <div className="flex items-center justify-center h-full bg-white">
      <p
        className="text-[16px]"
        style={{ color: "#999", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
      >
        {title} 화면 준비 중
      </p>
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState(
    () => localStorage.getItem(ONBOARDING_KEY) ? "app" : "onboarding"
  );

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setPhase("app");
  };

  if (phase === "onboarding") {
    return (
      <TrunkRoomOnboarding onComplete={handleOnboardingComplete} />
    );
  }

  // Main app – full-screen mobile layout wrapper
  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-300">
      <div
        className="relative overflow-hidden shadow-2xl flex flex-col"
        style={{ width: 375, height: 812, borderRadius: 44 }}
      >
        {/* Status bar — white with dark text/icons to match main app */}
        <div
          className="flex items-center justify-between bg-white shrink-0"
          style={{ height: 44, paddingLeft: 24, paddingRight: 20 }}
        >
          <span className="text-[15px] font-semibold tracking-tight" style={{ color: "#1a1a1a" }}>
            9:41
          </span>
          <div className="flex items-center gap-[7px]">
            {/* Signal bars */}
            <svg width="17" height="11" viewBox="0 0 17 11" fill="none">
              <rect x="0" y="7" width="3" height="4" rx="0.5" fill="#1a1a1a" />
              <rect x="4.5" y="4.5" width="3" height="6.5" rx="0.5" fill="#1a1a1a" />
              <rect x="9" y="2" width="3" height="9" rx="0.5" fill="#1a1a1a" />
              <rect x="13.5" y="0" width="3" height="11" rx="0.5" fill="#1a1a1a" opacity="0.3" />
            </svg>
            {/* Wi-Fi */}
            <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
              <path d="M7.5 8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" fill="#1a1a1a" />
              <path d="M7.5 5.5C9 5.5 10.3 6.1 11.3 7.1L12.9 5.4A7.5 7.5 0 007.5 3a7.5 7.5 0 00-5.4 2.4l1.6 1.7A5 5 0 017.5 5.5z" fill="#1a1a1a" />
              <path d="M7.5 2a9.9 9.9 0 017.1 3L16 3.3A12.4 12.4 0 007.5 0 12.4 12.4 0 00-1 3.3L.4 5A9.9 9.9 0 017.5 2z" fill="#1a1a1a" />
            </svg>
            {/* Battery */}
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
              <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="#1a1a1a" strokeOpacity="0.35" />
              <rect x="2" y="2" width="16" height="8" rx="2" fill="#1a1a1a" />
              <path d="M23 4v4a2 2 0 000-4z" fill="#1a1a1a" fillOpacity="0.4" />
            </svg>
          </div>
        </div>
        <MainApp />
      </div>
    </div>
  );
}
