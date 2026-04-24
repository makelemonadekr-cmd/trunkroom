import {
  SUPPORT_EMAIL, KAKAO_CHANNEL_URL, openMailTo, openExternalUrl,
} from "../../constants/appConfig";

const FONT    = "'Spoqa Han Sans Neo', sans-serif";
const DARK    = "#1a1a1a";
const YELLOW  = "#F5C200";
const LIGHT   = "#F5F5F5";
const DIVIDER = "#F0F0F0";
const GRAY    = "#888";

const Chevron = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M5 3L9 7L5 11" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const KakaoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <ellipse cx="9" cy="8.5" rx="7" ry="6" fill="#F5C200" />
    <path d="M5.5 8.5C5.5 7 7.1 5.8 9 5.8C10.9 5.8 12.5 7 12.5 8.5C12.5 9.7 11.5 10.7 10.1 11.1L9.8 12.5L8.3 11.3C6.7 11.1 5.5 9.9 5.5 8.5Z" fill={DARK} />
  </svg>
);

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="2" y="4" width="14" height="10" rx="2" stroke="#555" strokeWidth="1.4" />
    <path d="M2 7L9 11L16 7" stroke="#555" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

function RowGroup({ children }) {
  return (
    <div className="mx-4 rounded-2xl overflow-hidden" style={{ border: `1px solid ${DIVIDER}`, backgroundColor: "white" }}>
      {children}
    </div>
  );
}

function Row({ label, subValue, icon, onPress, last = false }) {
  return (
    <button
      onClick={onPress}
      className="w-full flex items-center justify-between px-4 py-3.5 text-left active:opacity-60 transition-opacity"
      style={{ borderBottom: last ? "none" : `1px solid ${DIVIDER}` }}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center rounded-xl shrink-0" style={{ width: 34, height: 34, backgroundColor: LIGHT }}>
          {icon}
        </div>
        <div>
          <p className="text-[14px] font-medium" style={{ color: DARK, fontFamily: FONT }}>{label}</p>
          {subValue && <p className="text-[11px] mt-0.5" style={{ color: GRAY, fontFamily: FONT }}>{subValue}</p>}
        </div>
      </div>
      <Chevron />
    </button>
  );
}

export default function CustomerSupportPage({ onBack }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col overflow-hidden" style={{ backgroundColor: LIGHT }}>

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 h-14 bg-white" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 4L7 10L12.5 16" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h2 className="text-[17px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>
          고객지원 · 제휴문의
        </h2>
        <div style={{ width: 36 }} />
      </div>

      <div className="flex-1 overflow-y-auto pb-8" style={{ scrollbarWidth: "none" }}>

        {/* 카카오톡 배너 */}
        <div className="mx-4 mt-5 mb-1 rounded-2xl px-5 py-4 flex items-center gap-4"
          style={{ backgroundColor: "#FFFBEB", border: `1.5px solid ${YELLOW}` }}>
          <span style={{ fontSize: 28, lineHeight: 1 }}>💬</span>
          <div>
            <p className="text-[13px] font-bold" style={{ color: DARK, fontFamily: FONT }}>카카오톡으로 빠르게 문의하세요</p>
            <p className="text-[11px] mt-0.5" style={{ color: "#9A7B00", fontFamily: FONT }}>
              평일 10:00–17:00 · 주말·공휴일 휴무
            </p>
          </div>
        </div>

        <div className="px-5 pb-1.5 pt-5">
          <p className="text-[11px] font-bold tracking-[0.1em] uppercase" style={{ color: "#AAAAAA", fontFamily: FONT }}>고객센터</p>
        </div>
        <RowGroup>
          <Row
            label="카카오톡 채널 문의"
            icon={<KakaoIcon />}
            subValue="트렁크룸 카카오 채널로 연결"
            onPress={() => openExternalUrl(KAKAO_CHANNEL_URL)}
            last
          />
        </RowGroup>

        <div className="px-5 pb-1.5 pt-5">
          <p className="text-[11px] font-bold tracking-[0.1em] uppercase" style={{ color: "#AAAAAA", fontFamily: FONT }}>이메일 · 제휴문의</p>
        </div>
        <RowGroup>
          <Row
            label="이메일 문의"
            icon={<MailIcon />}
            subValue={SUPPORT_EMAIL}
            onPress={() => openMailTo(SUPPORT_EMAIL, "트렁크룸 문의")}
            last
          />
        </RowGroup>
      </div>
    </div>
  );
}
