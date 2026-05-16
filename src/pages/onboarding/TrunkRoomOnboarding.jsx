import { useState, useEffect } from "react";

const DARK_BG = "#313439";
const TEXT_DARK = "#333333";

const SLIDES = [
  { id: 1, src: "/onboarding1.png" },
  { id: 2, src: "/onboarding2.png" },
  { id: 3, src: "/onboarding3.png" },
];

// Mock status bar removed — iOS shows the real one via safe-area inset.
// Apple Review rejects apps that draw a fake status bar.
function StatusBar() { return null; }

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
