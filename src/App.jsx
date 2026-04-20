import { useState } from "react";
import TrunkRoomOnboarding from "./pages/onboarding/TrunkRoomOnboarding";
import HomePage from "./pages/home/HomePage";
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
        {activeTab === "closet" && <PlaceholderPage title="내 옷장" />}
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
        <MainApp />
      </div>
    </div>
  );
}
