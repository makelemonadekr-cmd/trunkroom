import { useState, useEffect, useRef, lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import TrunkRoomOnboarding from "./pages/onboarding/TrunkRoomOnboarding";
import { TOAST_EVENT } from "./lib/toastUtils";
// Eager: 4 main bottom-nav pages (switching between them must be instant)
import HomePage from "./pages/home/HomePage";
import ClosetPage from "./pages/closet/ClosetPage";
import DiscoveryPage from "./pages/discover/DiscoveryPage";
import RecordPage from "./pages/record/RecordPage";
// Lazy: secondary overlays / rarely-opened screens
const ProductDetailPage      = lazy(() => import("./pages/product/ProductDetailPage"));
const SellerProfilePage      = lazy(() => import("./pages/discover/SellerProfilePage"));
const ClosetItemDetailScreen = lazy(() => import("./components/ClosetItemDetailScreen"));
const MenuPage               = lazy(() => import("./pages/menu/MenuPage"));
const PrivacyPolicyScreen    = lazy(() => import("./pages/legal/PrivacyPolicyScreen"));
const TermsOfServiceScreen   = lazy(() => import("./pages/legal/TermsOfServiceScreen"));
const AuthScreen             = lazy(() => import("./features/auth/AuthScreen"));
const CalendarPage       = lazy(() => import("./pages/closet/CalendarPage"));
const OutfitCanvasEditor = lazy(() => import("./components/OutfitCanvasEditor"));
import BottomNav from "./components/BottomNav";
import { useAuth } from "./hooks/useAuth.js";
import { signOut } from "./services/authService.js";

// Tiny full-bleed white fallback for lazy chunks
function LazyFallback() {
  return <div className="absolute inset-0 bg-white" />;
}

const FONT         = "'Spoqa Han Sans Neo', sans-serif";
const DARK         = "#1a1a1a";
const YELLOW       = "#F5C200";
const ONBOARDING_KEY = "trunkroom_onboarded";

function PlaceholderPage({ title }) {
  return (
    <div className="flex items-center justify-center h-full bg-white">
      <p
        className="text-[16px]"
        style={{ color: "#999", fontFamily: FONT }}
      >
        {title} 화면 준비 중
      </p>
    </div>
  );
}

// ─── Auth Gate Modal (bottom sheet) ──────────────────────────────────────────

function AuthGateModal({ onLogin, onDismiss }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 z-[100]"
        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        onClick={onDismiss}
      />

      {/* Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 z-[101] bg-white"
        style={{ borderRadius: "24px 24px 0 0", padding: "20px 20px 28px" }}
      >
        {/* Handle bar */}
        <div className="flex justify-center mb-5">
          <div
            className="rounded-full"
            style={{ width: 36, height: 4, backgroundColor: "#E0E0E0" }}
          />
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 52, height: 52, backgroundColor: "#FFF9E0" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke={YELLOW} strokeWidth="1.8" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={YELLOW} strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <p
          className="text-[17px] font-bold text-center mb-2"
          style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}
        >
          로그인이 필요해요
        </p>
        <p
          className="text-[13px] text-center mb-6"
          style={{ color: "#888888", fontFamily: FONT, lineHeight: 1.65, whiteSpace: "pre-line" }}
        >
          {"이 기능은 로그인 후 사용할 수 있어요.\n로그인하고 내 옷장을 만들어볼까요?"}
        </p>

        {/* Login button */}
        <button
          onClick={onLogin}
          className="w-full flex items-center justify-center rounded-2xl font-bold active:opacity-80 mb-2"
          style={{
            height:          52,
            backgroundColor: YELLOW,
            color:           DARK,
            fontFamily:      FONT,
            fontSize:        15,
          }}
        >
          로그인하기
        </button>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="w-full flex items-center justify-center rounded-2xl active:opacity-60"
          style={{
            height:          48,
            backgroundColor: "#F5F5F5",
            color:           "#888888",
            fontFamily:      FONT,
            fontSize:        14,
          }}
        >
          계속 둘러보기
        </button>
      </div>
    </>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const { user, loading: authLoading, isPasswordRecovery, clearPasswordRecovery } = useAuth();

  const [phase, setPhase] = useState(
    () => (localStorage.getItem(ONBOARDING_KEY) ? "app" : "onboarding")
  );
  const [activeTab,        setActiveTab]        = useState("home");
  const [currentProduct,   setCurrentProduct]   = useState(null);
  const [activeSeller,     setActiveSeller]      = useState(null);
  const [currentItem,      setCurrentItem]       = useState(null);
  const [legalScreen,      setLegalScreen]       = useState(null);
  const [autoOpenFlow,     setAutoOpenFlow]      = useState(false);
  const [discoverTab,      setDiscoverTab]       = useState(null);
  const [styleFlowItem,    setStyleFlowItem]     = useState(null);
  const [editStylePending, setEditStylePending]  = useState(null);
  const [closetKey,        setClosetKey]         = useState(0);
  const [stylesSavedTick,  setStylesSavedTick]   = useState(0);
  const [showCalendar,      setShowCalendar]      = useState(false);
  const [showOutfitEditor,  setShowOutfitEditor]  = useState(false);

  // ── Guest mode: auth gate modal + AuthScreen overlay ─────────────────────────
  const [showAuthGate,   setShowAuthGate]   = useState(false);
  const [showAuthScreen, setShowAuthScreen] = useState(false);
  const pendingActionRef = useRef(null);

  /**
   * requireAuth(action)
   * If the user is logged in, run action() immediately.
   * Otherwise, store it and show the auth gate modal.
   */
  function requireAuth(action) {
    if (user) {
      action();
    } else {
      pendingActionRef.current = action;
      setShowAuthGate(true);
    }
  }

  /**
   * handleProductSelect — smart router
   * If the tapped item belongs to the logged-in user, open ClosetItemDetailScreen.
   * Otherwise open ProductDetailPage (marketplace view).
   */
  function handleProductSelect(item) {
    if (user && item?.user_id && item.user_id === user.id) {
      setCurrentItem(item);
    } else {
      setCurrentProduct(item);
    }
  }

  // ── Logout / Login state management ──────────────────────────────────────────
  const prevUserRef = useRef(undefined);
  useEffect(() => {
    if (authLoading) return;
    const prevUser = prevUserRef.current;
    prevUserRef.current = user;

    if (prevUser != null && user === null) {
      // ── User just signed out → reset state ──────────────────────────────────
      setCurrentProduct(null);
      setActiveSeller(null);
      setCurrentItem(null);
      setLegalScreen(null);
      setAutoOpenFlow(false);
      setDiscoverTab(null);
      setStyleFlowItem(null);
      setEditStylePending(null);
      setActiveTab("home");
      setClosetKey(0);
      setShowAuthGate(false);
      setShowAuthScreen(false);
      pendingActionRef.current = null;
    }

    if (prevUser === null && user != null) {
      // ── User just signed in → close auth screens + run pending action ────────
      setShowAuthScreen(false);
      setShowAuthGate(false);
      if (pendingActionRef.current) {
        pendingActionRef.current();
        pendingActionRef.current = null;
      }
    }
  }, [user, authLoading]);

  // ── Global toast ─────────────────────────────────────────────────────────────
  const [toast,    setToast]    = useState(null);
  const toastTimer              = useRef(null);

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

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setPhase("app");
  };

  function handleTabChange(tab) {
    setCurrentProduct(null);
    setCurrentItem(null);
    setDiscoverTab(null);
    // closet and record tabs require login
    if ((tab === "closet" || tab === "record") && !user) {
      requireAuth(() => setActiveTab(tab));
      return;
    }
    setActiveTab(tab);
  }

  function handleGoToDiscover(tab) {
    setCurrentProduct(null);
    setCurrentItem(null);
    setDiscoverTab(tab);
    setActiveTab("discover");
  }

  function handleStartStyleFlow() {
    requireAuth(() => {
      setCurrentProduct(null);
      setCurrentItem(null);
      setActiveTab("record");
      setAutoOpenFlow(true);
    });
  }

  function handleEditStyle(style) {
    requireAuth(() => {
      setCurrentProduct(null);
      setCurrentItem(null);
      setEditStylePending(style);
      setActiveTab("record");
    });
  }

  function handleStyleSaved() {
    setStylesSavedTick((n) => n + 1);
  }

  function handleMakeStyleWithItem(item) {
    requireAuth(() => {
      setCurrentProduct(null);
      setCurrentItem(null);
      setStyleFlowItem(item);
      setActiveTab("record");
    });
  }

  if (phase === "onboarding") {
    return <TrunkRoomOnboarding onComplete={handleOnboardingComplete} />;
  }

  // Detect native (Capacitor iOS) or narrow viewport — render full-screen.
  // Wide viewports keep the centered phone-mockup look for desktop preview.
  const isNative =
    typeof window !== "undefined" &&
    (window.location.origin.startsWith("capacitor://") ||
      window.location.origin.startsWith("ionic://"));
  const isMobileWidth =
    typeof window !== "undefined" && window.innerWidth < 500;
  const fullScreen = isNative || isMobileWidth;

  return (
    <div
      className={fullScreen ? "" : "flex items-center justify-center min-h-screen bg-neutral-300"}
    >
      <div
        className="relative overflow-hidden flex flex-col"
        style={
          fullScreen
            ? {
                width: "100vw",
                height: "100dvh",
                backgroundColor: "white",
                // Reserve top space for iOS status bar / notch.
                paddingTop: "env(safe-area-inset-top)",
              }
            : { width: 375, height: 812, borderRadius: 44, boxShadow: "0 20px 50px rgba(0,0,0,0.15)" }
        }
      >
        {/* Mock status bar removed — iOS shows the real one via safe-area inset.
            Apple Review rejects apps that draw a fake status bar over the real one. */}

        {/* ── [2] Page area ────────────────────────────────────────── */}
        <div className="relative flex-1 min-h-0 overflow-hidden bg-white">

          {/* ── Auth loading spinner ── */}
          {authLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
                <path d="M16 3a13 13 0 1 1-9.19 3.81" stroke="#F5C200" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          )}

          {/* ── Pages (always rendered once auth has resolved) ── */}
          {!authLoading && (<ErrorBoundary><Suspense fallback={<LazyFallback />}>

            {/* Home — public */}
            {activeTab === "home" && (
              <HomePage
                onProductSelect={handleProductSelect}
                onItemTap={setCurrentItem}
                onLegalOpen={(type) => setLegalScreen(type)}
                onGoToRecord={handleStartStyleFlow}
                onGoToDiscover={handleGoToDiscover}
                onEditStyle={handleEditStyle}
                onMakeStyle={handleMakeStyleWithItem}
                onSellerOpen={setActiveSeller}
                stylesSavedTick={stylesSavedTick}
              />
            )}

            {/* Discover — public */}
            {activeTab === "discover" && (
              <DiscoveryPage
                initialTab={discoverTab}
                onLoginRequest={() => {
                  pendingActionRef.current = null;
                  setShowAuthGate(true);
                }}
              />
            )}

            {/* Menu — public (shows limited content for guests) */}
            {activeTab === "menu" && (
              <MenuPage
                user={user}
                onSignOut={signOut}
                onLoginRequest={() => {
                  pendingActionRef.current = null;
                  setShowAuthScreen(true);
                }}
              />
            )}

            {/* Record — auth required */}
            {activeTab === "record" && user && (
              <RecordPage
                onItemSelect={setCurrentItem}
                autoOpenFlow={autoOpenFlow}
                onAutoOpenHandled={() => setAutoOpenFlow(false)}
                prefilledItem={styleFlowItem}
                onPrefilledHandled={() => setStyleFlowItem(null)}
                editStyle={editStylePending}
                onEditStyleHandled={() => setEditStylePending(null)}
                onStyleSaved={handleStyleSaved}
                onOpenCalendar={() => setShowCalendar(true)}
              />
            )}

            {/* Closet — auth required */}
            {activeTab === "closet" && user && (
              <ClosetPage
                key={closetKey}
                onProductSelect={handleProductSelect}
                onItemTap={setCurrentItem}
                onOpenOutfitEditor={() => setShowOutfitEditor(true)}
              />
            )}

            {/* Closet item detail overlay */}
            {currentItem && !currentProduct && (
              <ClosetItemDetailScreen
                item={currentItem}
                onBack={() => setCurrentItem(null)}
                onDelete={() => {
                  setCurrentItem(null);
                  setClosetKey((k) => k + 1);
                }}
                onMemoSaved={() => setClosetKey((k) => k + 1)}
                onMakeStyle={handleMakeStyleWithItem}
              />
            )}

            {/* Product detail overlay */}
            {currentProduct && (
              <ProductDetailPage
                product={currentProduct}
                onBack={() => setCurrentProduct(null)}
                onLoginRequest={() => { pendingActionRef.current = null; setShowAuthGate(true); }}
                onSellerOpen={setActiveSeller}
              />
            )}

            {/* Seller profile overlay (above product detail) */}
            {activeSeller && (
              <div className="absolute inset-0 z-[120] bg-white">
                <SellerProfilePage
                  seller={activeSeller}
                  onBack={() => setActiveSeller(null)}
                  onLoginRequest={() => { pendingActionRef.current = null; setShowAuthGate(true); }}
                />
              </div>
            )}

            {/* Legal screen overlays */}
            {legalScreen === "privacy" && (
              <PrivacyPolicyScreen onBack={() => setLegalScreen(null)} />
            )}
            {legalScreen === "terms" && (
              <TermsOfServiceScreen onBack={() => setLegalScreen(null)} />
            )}

            {/* ── Auth gate modal (bottom sheet) ── */}
            {showAuthGate && (
              <AuthGateModal
                onLogin={() => {
                  setShowAuthGate(false);
                  setShowAuthScreen(true);
                }}
                onDismiss={() => {
                  setShowAuthGate(false);
                  pendingActionRef.current = null;
                }}
              />
            )}

            {/* ── AuthScreen overlay (full-screen, above everything) ── */}
            {/* 비밀번호 재설정 링크 클릭 후 진입 OR 일반 로그인 요청 */}
            {(showAuthScreen || isPasswordRecovery) && (
              <div className="absolute inset-0 z-[150]">
                <AuthScreen
                  isPasswordRecovery={isPasswordRecovery}
                  onPasswordResetDone={clearPasswordRecovery}
                  onClose={isPasswordRecovery ? undefined : () => {
                    setShowAuthScreen(false);
                    pendingActionRef.current = null;
                  }}
                />
              </div>
            )}

            {/* ── CalendarPage overlay ── */}
            {showCalendar && user && (
              <div className="absolute inset-0 z-[90] bg-white">
                <CalendarPage onClose={() => setShowCalendar(false)} />
              </div>
            )}

            {/* ── OutfitCanvasEditor overlay ── */}
            {showOutfitEditor && user && (
              <OutfitCanvasEditor
                onClose={() => setShowOutfitEditor(false)}
                onSave={() => { setShowOutfitEditor(false); handleStyleSaved(); }}
              />
            )}

          </Suspense></ErrorBoundary>)}
          {/* ── end page area ── */}

        </div>

        {/* ── [3] Bottom navigation — visible to all non-loading users ────────── */}
        {!authLoading && (
          <BottomNav active={activeTab} onTabChange={handleTabChange} />
        )}

        {/* Fake home indicator removed — iOS draws the real one over content. */}

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
                style={{ fontFamily: FONT }}
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
