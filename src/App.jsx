import { useState, useEffect, useRef } from "react";
import TrunkRoomOnboarding from "./pages/onboarding/TrunkRoomOnboarding";
import { TOAST_EVENT } from "./lib/toastUtils";
import HomePage from "./pages/home/HomePage";
import ClosetPage from "./pages/closet/ClosetPage";
import DiscoveryPage from "./pages/discover/DiscoveryPage";
import RecordPage from "./pages/record/RecordPage";
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

  // ── Global toast ─────────────────────────────────────────────────────────────
  const [toast,     setToast]     = useState(null);  // { message, type }
  const toastTimer                = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      const { message, type, duration = 3000 } = e.detail;
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ message, type });
      toastTimer.current = setTimeout(() => setToast(null), duration);
    };
    window.addEventListener(TOAST_EVENT, handler);
    return () => {
      window.removeEventListener(TOAST_EVENT, handler);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setPhase("app");
  };

  function handleTabChange(tab) {
    setCurrentProduct(null);
    setActiveTab(tab);
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
              onGoToRecord={() => handleTabChange("record")}
            />
          )}
          {activeTab === "record" && (
            <RecordPage onItemSelect={setCurrentProduct} />
          )}
          {activeTab === "closet" && <ClosetPage onProductSelect={setCurrentProduct} />}
          {activeTab === "discover" && <DiscoveryPage />}
          {activeTab === "menu"   && <MenuPage />}

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

        {/* ── Global toast overlay ────────────────────────────────── */}
        {toast && (
          <div
            className="absolute left-4 right-4 z-[999] pointer-events-none flex justify-center"
            style={{ bottom: 90 }}
          >
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg"
              style={{
                backgroundColor:
                  toast.type === "error"   ? "#E84040" :
                  toast.type === "success" ? "#1a1a1a" :
                  toast.type === "warning" ? "#B8920A" :
                                             "#1a1a1a",
                maxWidth: "100%",
              }}
            >
              {toast.type === "error" && (
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M7.5 5V8M7.5 10.5V11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="7.5" cy="7.5" r="6" stroke="white" strokeWidth="1.5"/>
                </svg>
              )}
              {(toast.type === "success" || !toast.type || toast.type === "info") && (
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M2.5 7.5L5.5 10.5L12.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {toast.type === "warning" && (
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M7.5 1L14 13H1L7.5 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M7.5 5.5V9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                  <circle cx="7.5" cy="11" r="0.8" fill="white"/>
                </svg>
              )}
              <span
                className="text-[13px] font-bold text-white"
                style={{ fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
              >
                {toast.message}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
