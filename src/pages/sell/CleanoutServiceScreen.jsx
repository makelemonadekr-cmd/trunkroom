import { zoneCoordiImg } from "../../lib/localImages";

// ─── External URLs ────────────────────────────────────────────────────────────
// Replace these with the real app store / website URLs when available
export const CLEANOUT_LINKS = {
  charan:      "https://charan.co.kr",
  newoff:      "https://newoff.co.kr",
  reclo:       "https://reclo.co.kr",
  cornermarket: "https://cornermarket.co.kr",
};

const DARK   = "#1a1a1a";
const YELLOW = "#F5C200";

// ─── Service data ─────────────────────────────────────────────────────────────
// Replace `image` URLs with official brand images when available
const SERVICES = [
  {
    id: "charan",
    name: "차란",
    nameEn: "CHARAN",
    desc: "안 입는 옷을 간편하게 판매하고 정리할 수 있는 리세일 서비스",
    cta: "앱 다운로드하러 가기",
    image: zoneCoordiImg("cleanout", 0), // coordi[45]
    accent: "#E8D5C4",
    linkKey: "charan",
  },
  {
    id: "newoff",
    name: "뉴오프",
    nameEn: "NEW OFF",
    desc: "패션 리커머스 기반으로 옷장 정리에 도움을 주는 서비스",
    cta: "앱 다운로드하러 가기",
    image: zoneCoordiImg("cleanout", 1), // coordi[46]
    accent: "#D4E0EC",
    linkKey: "newoff",
  },
  {
    id: "reclo",
    name: "리클",
    nameEn: "RECLO",
    desc: "중고 의류를 보다 쉽게 순환시키는 패션 리세일 플랫폼",
    cta: "더 알아보기",
    image: zoneCoordiImg("cleanout", 2), // coordi[47]
    accent: "#D4ECD8",
    linkKey: "reclo",
  },
  {
    id: "cornermarket",
    name: "코너마켓",
    nameEn: "CORNER MARKET",
    desc: "옷과 라이프스타일 아이템을 거래할 수 있는 마켓 서비스",
    cta: "더 알아보기",
    image: zoneCoordiImg("cleanout", 3), // coordi[48]
    accent: "#E8D4EC",
    linkKey: "cornermarket",
  },
];

// ─── Service card ─────────────────────────────────────────────────────────────

function ServiceCard({ service }) {
  function handleTap() {
    const url = CLEANOUT_LINKS[service.linkKey];
    // In a real app: window.open(url, "_blank") or use a native deep link
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      onClick={handleTap}
      className="relative rounded-2xl overflow-hidden w-full text-left"
      style={{ height: 200, backgroundColor: service.accent }}
    >
      {/* Background image */}
      <img
        src={service.image}
        alt={service.name}
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: "cover", objectPosition: "center" }}
      />
      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(10,10,10,0.88) 0%, rgba(10,10,10,0.30) 50%, transparent 100%)",
        }}
      />

      {/* Top: EN name badge */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
        <div
          className="px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)" }}
        >
          <span
            className="text-[9px] font-bold tracking-widest uppercase text-white"
            style={{ fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            {service.nameEn}
          </span>
        </div>
        {/* Arrow */}
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 30, height: 30,
            backgroundColor: "rgba(255,255,255,0.18)",
            backdropFilter: "blur(8px)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 11L11 3M11 3H5M11 3V9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Bottom: name + desc + CTA */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3
          className="text-[20px] font-bold text-white leading-tight"
          style={{ fontFamily: "'Spoqa Han Sans Neo', sans-serif", letterSpacing: "-0.03em" }}
        >
          {service.name}
        </h3>
        <p
          className="text-[11px] mt-1 leading-relaxed"
          style={{ color: "rgba(255,255,255,0.65)", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
        >
          {service.desc}
        </p>
        <div className="flex items-center gap-1 mt-2">
          <span
            className="text-[11px] font-bold"
            style={{ color: YELLOW, fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            {service.cta}
          </span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2.5L8 6L4 9.5" stroke={YELLOW} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </button>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function CleanoutServiceScreen({ onBack }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-white overflow-hidden">
      {/* ── Header ── */}
      <div
        className="shrink-0 flex items-center justify-between px-5 pt-5 pb-4"
        style={{ borderBottom: "1px solid #F0F0F0" }}
      >
        <div>
          <p
            className="text-[11px] font-bold tracking-[0.14em] uppercase"
            style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            CLEANOUT SERVICE
          </p>
          <h1
            className="text-[18px] font-bold leading-tight"
            style={{ color: DARK, fontFamily: "'Spoqa Han Sans Neo', sans-serif", letterSpacing: "-0.03em" }}
          >
            클린아웃백 신청
          </h1>
        </div>
        <button
          onClick={onBack}
          className="flex items-center justify-center rounded-full"
          style={{ width: 36, height: 36, backgroundColor: "#F2F2F2" }}
          aria-label="뒤로"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M11 4L6 9L11 14"
              stroke={DARK}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* ── Intro strip ── */}
      <div
        className="shrink-0 mx-5 mt-4 rounded-2xl px-4 py-3.5 flex items-start gap-3"
        style={{ backgroundColor: "#FFFBEA", border: "1px solid rgba(245,194,0,0.25)" }}
      >
        <span style={{ fontSize: 22 }}>📦</span>
        <div>
          <p
            className="text-[13px] font-bold"
            style={{ color: DARK, fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            외부 리세일 파트너사
          </p>
          <p
            className="text-[11px] mt-0.5 leading-relaxed"
            style={{ color: "#888", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            아래 서비스들과 연계해 옷장을 더 쉽게 정리해보세요.
            각 카드를 탭하면 해당 서비스로 이동합니다.
          </p>
        </div>
      </div>

      {/* ── Service cards ── */}
      <div
        className="flex-1 overflow-y-auto px-5 pt-4 pb-6"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="flex flex-col gap-4">
          {SERVICES.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>

        {/* Footer note */}
        <p
          className="text-center text-[11px] mt-5 leading-relaxed"
          style={{ color: "#CCCCCC", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
        >
          위 서비스들은 외부 파트너사이며,
          {"\n"}트렁크룸과 별도로 운영됩니다.
        </p>
      </div>
    </div>
  );
}
