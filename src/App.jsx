import { useState } from "react";
import TrunkRoomOnboarding from "./pages/onboarding/TrunkRoomOnboarding";
import HomePage from "./pages/home/HomePage";
import ClosetPage from "./pages/closet/ClosetPage";
import CodiPage from "./pages/codi/CodiPage";
import SellPage from "./pages/sell/SellPage";
import AddClosetItemScreen from "./pages/sell/AddClosetItemScreen";
import CleanoutServiceScreen from "./pages/sell/CleanoutServiceScreen";
import ProductDetailPage from "./pages/product/ProductDetailPage";
import MenuPage from "./pages/menu/MenuPage";
import PrivacyPolicyScreen from "./pages/legal/PrivacyPolicyScreen";
import TermsOfServiceScreen from "./pages/legal/TermsOfServiceScreen";
import BottomNav from "./components/BottomNav";

const ONBOARDING_KEY = "trunkroom_onboarded";

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
    () => (localStorage.getItem(ONBOARDING_KEY) ? "app" : "onboarding")
  );
  const [activeTab,      setActiveTab]      = useState("home");
  const [currentProduct, setCurrentProduct] = useState(null);
  const [legalScreen,    setLegalScreen]    = useState(null); // null | "privacy" | "terms"

  // ── Sell flow overlay state ──────────────────────────────────────────────────
  // null | "quicksell" | "cleanout"
  // "closet" routes via tab switch — no overlay needed
  const [sellScreen, setSellScreen] = useState(null);

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setPhase("app");
  };

  // When switching tabs, clear any sell overlays
  function handleTabChange(tab) {
    setSellScreen(null);
    setCurrentProduct(null);
    setActiveTab(tab);
  }

  // "내 옷장 속 아이템 판매" → go to closet tab directly
  function handleSellFromCloset() {
    setSellScreen(null);
    setActiveTab("closet");
  }

  if (phase === "onboarding") {
    return <TrunkRoomOnboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-300">
      {/*
        Phone shell — fixed 375 × 812 px, rounded corners 44 px.

        Flex column layout (top → bottom):
          [1] Status bar   — shrink-0, 44 px
          [2] Page area    — flex-1, min-h-0  (fills everything between #1 and #3+#4)
          [3] Bottom nav   — shrink-0, 60 px  ← ALWAYS visible, never clipped
          [4] Home pill    — shrink-0, 22 px  (iPhone home indicator)

        Heights: 44 + flex-1 + 60 + 22 = 812  →  flex-1 = 686 px
        BottomNav top  = 44 + 686 = 730 px from top  (82 px from bottom)
        BottomNav bottom = 730 + 60 = 790 px from top (22 px from bottom)
        Corner-radius 44 clips at x ≈ 0 px at y = 790 → zero clip on tab content ✓
      */}
      <div
        className="relative overflow-hidden shadow-2xl flex flex-col"
        style={{ width: 375, height: 812, borderRadius: 44 }}
      >
        {/* ── [1] Status bar ──────────────────────────────────────── */}
        <div
          className="flex items-center justify-between bg-white shrink-0"
          style={{ height: 44, paddingLeft: 24, paddingRight: 20 }}
        >
          <span
            className="text-[15px] font-semibold tracking-tight"
            style={{ color: "#1a1a1a" }}
          >
            9:41
          </span>
          <div className="flex items-center gap-[7px]">
            {/* Signal bars */}
            <svg width="17" height="11" viewBox="0 0 17 11" fill="none">
              <rect x="0"    y="7"   width="3" height="4"    rx="0.5" fill="#1a1a1a" />
              <rect x="4.5"  y="4.5" width="3" height="6.5"  rx="0.5" fill="#1a1a1a" />
              <rect x="9"    y="2"   width="3" height="9"    rx="0.5" fill="#1a1a1a" />
              <rect x="13.5" y="0"   width="3" height="11"   rx="0.5" fill="#1a1a1a" opacity="0.3" />
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
              <rect x="2"   y="2"   width="16" height="8"  rx="2"   fill="#1a1a1a" />
              <path d="M23 4v4a2 2 0 000-4z" fill="#1a1a1a" fillOpacity="0.4" />
            </svg>
          </div>
        </div>

        {/* ── [2] Page area ────────────────────────────────────────── */}
        <div className="relative flex-1 min-h-0 overflow-hidden bg-white">
          {activeTab === "home"   && (
            <HomePage
              onProductSelect={setCurrentProduct}
              onLegalOpen={(type) => setLegalScreen(type)}
            />
          )}
          {activeTab === "sell"   && (
            <SellPage
              onQuickSell={() => setSellScreen("quicksell")}
              onSellFromCloset={handleSellFromCloset}
              onCleanout={() => setSellScreen("cleanout")}
            />
          )}
          {activeTab === "closet" && <ClosetPage />}
          {activeTab === "codi"   && <CodiPage />}
          {activeTab === "menu"   && <MenuPage />}

          {/* ── Sell flow overlays — sit above the active tab page ── */}
          {sellScreen === "quicksell" && activeTab === "sell" && (
            <AddClosetItemScreen
              onClose={() => setSellScreen(null)}
              onSave={() => setSellScreen(null)}
            />
          )}
          {sellScreen === "cleanout" && activeTab === "sell" && (
            <CleanoutServiceScreen
              onBack={() => setSellScreen(null)}
            />
          )}

          {/* Product detail overlay — absolute, covers full page area */}
          {currentProduct && (
            <ProductDetailPage
              product={currentProduct}
              onBack={() => setCurrentProduct(null)}
            />
          )}

          {/* Legal screen overlays (triggered from footer or menu) */}
          {legalScreen === "privacy" && (
            <PrivacyPolicyScreen onBack={() => setLegalScreen(null)} />
          )}
          {legalScreen === "terms" && (
            <TermsOfServiceScreen onBack={() => setLegalScreen(null)} />
          )}
        </div>

        {/* ── [3] Bottom navigation — ALWAYS inside the phone ─────── */}
        <BottomNav active={activeTab} onTabChange={handleTabChange} />

        {/* ── [4] iPhone home indicator ───────────────────────────── */}
        <div
          className="shrink-0 flex items-center justify-center bg-white"
          style={{ height: 22 }}
        >
          <div
            className="rounded-full"
            style={{ width: 134, height: 5, backgroundColor: "rgba(0,0,0,0.18)" }}
          />
        </div>
      </div>
    </div>
  );
}
