import { useState, useEffect } from "react";

const DARK_BG = "#313439";
const TEXT_DARK = "#333333";

const SLIDES = [
  { id: 1, src: "/onboarding-1.png" },
  { id: 2, src: "/onboarding-2.png" },
  { id: 3, src: "/onboarding-3.png" },
];

function StatusBar() {
  return (
    <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 h-11 z-10">
      <span className="text-[15px] font-semibold tracking-tight text-white" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
        9:41
      </span>
      <div className="flex items-center gap-[7px]">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="none">
          <rect x="0" y="7" width="3" height="4" rx="0.5" fill="white" />
          <rect x="4.5" y="4.5" width="3" height="6.5" rx="0.5" fill="white" />
          <rect x="9" y="2" width="3" height="9" rx="0.5" fill="white" />
          <rect x="13.5" y="0" width="3" height="11" rx="0.5" fill="white" opacity="0.35" />
        </svg>
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
          <path d="M7.5 8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" fill="white" />
          <path d="M7.5 5.5C9 5.5 10.3 6.1 11.3 7.1L12.9 5.4A7.5 7.5 0 007.5 3a7.5 7.5 0 00-5.4 2.4l1.6 1.7A5 5 0 017.5 5.5z" fill="white" />
          <path d="M7.5 2a9.9 9.9 0 017.1 3L16 3.3A12.4 12.4 0 007.5 0 12.4 12.4 0 00-1 3.3L.4 5A9.9 9.9 0 017.5 2z" fill="white" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="white" strokeOpacity="0.35" />
          <rect x="2" y="2" width="16" height="8" rx="2" fill="white" />
          <path d="M23 4v4a2 2 0 000-4z" fill="white" fillOpacity="0.4" />
        </svg>
      </div>
    </div>
  );
}

function SplashScreen({ onFinish }) {
  useEffect(() => {
    const t = setTimeout(onFinish, 2000);
    return () => clearTimeout(t);
  }, [onFinish]);

  return (
    <div className="flex items-center justify-center h-full bg-white">
      <img
        src="/officiallogo.png"
        alt="Trunk room"
        style={{ height: 40, width: "auto", objectFit: "contain" }}
      />
    </div>
  );
}

function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(0);

  const goNext = () => {
    if (step < SLIDES.length - 1) setStep(step + 1);
    else onComplete();
  };

  const isLast = step === SLIDES.length - 1;
  const slide = SLIDES[step];

  return (
    <div className="relative h-full flex flex-col">
      {/* Full-screen image */}
      <img
        key={slide.src}
        src={slide.src}
        alt=""
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: "cover", objectPosition: "center top" }}
      />

      {/* Status bar overlay */}
      <StatusBar />

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0">
        {/* Gradient fade */}
        <div
          style={{
            height: 120,
            background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.55))",
            pointerEvents: "none",
          }}
        />

        {/* Controls strip */}
        <div
          className="px-5 pb-8 pt-3 flex items-center justify-between"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
        >
          {/* Pagination dots */}
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 20 : 6,
                  height: 6,
                  backgroundColor: i === step ? "white" : "rgba(255,255,255,0.4)",
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            {/* 건너뛰기 */}
            <button
              onClick={onComplete}
              className="h-10 px-4"
              style={{
                color: "rgba(255,255,255,0.75)",
                fontFamily: "'Spoqa Han Sans Neo', sans-serif",
                fontSize: 14,
                letterSpacing: "-0.02em",
              }}
            >
              건너뛰기
            </button>

            {/* 다음 / 시작하기 */}
            <button
              onClick={goNext}
              className="h-10 px-5 rounded-sm"
              style={{
                backgroundColor: "white",
                color: TEXT_DARK,
                fontFamily: "'Spoqa Han Sans Neo', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                minWidth: 80,
              }}
            >
              {isLast ? "시작하기" : "다음"}
            </button>
          </div>
        </div>

        {/* Home indicator clearance */}
        <div style={{ height: 10, backgroundColor: "rgba(0,0,0,0.55)" }} />
      </div>
    </div>
  );
}

export default function TrunkRoomOnboarding({ onComplete }) {
  const [screen, setScreen] = useState("splash");

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-300">
      <div
        className="relative overflow-hidden shadow-2xl"
        style={{ width: 375, height: 812, borderRadius: 44, backgroundColor: DARK_BG }}
      >
        {screen === "splash" ? (
          <SplashScreen onFinish={() => setScreen("onboarding")} />
        ) : (
          <OnboardingScreen onComplete={onComplete} />
        )}

        {/* Home indicator */}
        {screen === "splash" && (
          <div
            className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full"
            style={{ width: 134, height: 5, backgroundColor: "rgba(0,0,0,0.18)" }}
          />
        )}
      </div>
    </div>
  );
}
