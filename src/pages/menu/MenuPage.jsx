import { useState } from "react";
import PrivacyPolicyScreen from "../legal/PrivacyPolicyScreen";
import TermsOfServiceScreen from "../legal/TermsOfServiceScreen";
import AccountSettingsScreen from "./AccountSettingsScreen";
import CustomerSupportPage from "../support/CustomerSupportPage";
import {
  COMPANY_NAME, COMPANY_CEO, BUSINESS_NUMBER, TELECOM_REG_NUMBER,
  COMPANY_URL, SUPPORT_EMAIL, PARTNERSHIP_EMAIL,
  CUSTOMER_SERVICE_PHONE, SUPPORT_HOURS, APP_VERSION,
  openExternalUrl, openMailTo, openTel,
} from "../../constants/appConfig";

const FONT  = "'Spoqa Han Sans Neo', sans-serif";
const DARK  = "#1a1a1a";
const GRAY  = "#888";
const LIGHT = "#F5F5F5";
const DIVIDER = "#F0F0F0";

// ─── Reusable row components ──────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p
      className="px-5 pt-5 pb-1.5 text-[11px] font-bold tracking-[0.1em] uppercase"
      style={{ color: "#AAAAAA", fontFamily: FONT }}
    >
      {children}
    </p>
  );
}

function RowGroup({ children }) {
  return (
    <div
      className="mx-4 rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${DIVIDER}`, backgroundColor: "white" }}
    >
      {children}
    </div>
  );
}

function Row({ label, value, subValue, icon, onPress, showChevron = true, last = false, accent = false }) {
  return (
    <button
      onClick={onPress}
      className="w-full flex items-center justify-between px-4 py-3.5 text-left active:opacity-60 transition-opacity"
      style={{ borderBottom: last ? "none" : `1px solid ${DIVIDER}` }}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className="flex items-center justify-center rounded-xl shrink-0"
            style={{ width: 34, height: 34, backgroundColor: LIGHT }}
          >
            {icon}
          </div>
        )}
        <div>
          <p
            className="text-[14px] font-medium"
            style={{ color: accent ? "#F5C200" : DARK, fontFamily: FONT }}
          >
            {label}
          </p>
          {subValue && (
            <p className="text-[11px] mt-0.5" style={{ color: GRAY, fontFamily: FONT }}>
              {subValue}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {value && (
          <p className="text-[12px]" style={{ color: GRAY, fontFamily: FONT }}>
            {value}
          </p>
        )}
        {showChevron && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3L9 7L5 11" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </button>
  );
}

function InfoRow({ label, value, last = false }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{ borderBottom: last ? "none" : `1px solid ${DIVIDER}` }}
    >
      <p className="text-[13px]" style={{ color: DARK, fontFamily: FONT }}>{label}</p>
      <p className="text-[12px]" style={{ color: GRAY, fontFamily: FONT }}>{value}</p>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const BuildingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="2" y="5" width="14" height="11" rx="1.5" stroke="#555" strokeWidth="1.4" />
    <path d="M6 5V3.5C6 3.22 6.22 3 6.5 3H11.5C11.78 3 12 3.22 12 3.5V5" stroke="#555" strokeWidth="1.4" />
    <path d="M6 9H12M6 12H9" stroke="#555" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="2" y="4" width="14" height="10" rx="2" stroke="#555" strokeWidth="1.4" />
    <path d="M2 7L9 11L16 7" stroke="#555" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path
      d="M5.5 2H12.5C13.33 2 14 2.67 14 3.5V14.5C14 15.33 13.33 16 12.5 16H5.5C4.67 16 4 15.33 4 14.5V3.5C4 2.67 4.67 2 5.5 2Z"
      stroke="#555" strokeWidth="1.4"
    />
    <circle cx="9" cy="13.5" r="0.8" fill="#555" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path
      d="M9 2L3 5V9.5C3 13 6 15.7 9 16.5C12 15.7 15 13 15 9.5V5L9 2Z"
      stroke="#555" strokeWidth="1.4" strokeLinejoin="round"
    />
    <path d="M6.5 9L8.2 10.7L11.5 7.5" stroke="#555" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DocumentIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path
      d="M11 2H5C4.45 2 4 2.45 4 3V15C4 15.55 4.45 16 5 16H13C13.55 16 14 15.55 14 15V5L11 2Z"
      stroke="#555" strokeWidth="1.4" strokeLinejoin="round"
    />
    <path d="M11 2V5H14" stroke="#555" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M7 9H11M7 12H9" stroke="#555" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const InfoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="6.5" stroke="#555" strokeWidth="1.4" />
    <path d="M9 8V13" stroke="#555" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="9" cy="5.5" r="0.8" fill="#555" />
  </svg>
);

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MenuPage() {
  const [screen,       setScreen]       = useState(null);  // null | "privacy" | "terms"
  const [accountOpen,  setAccountOpen]  = useState(false);
  const [appInfoOpen,  setAppInfoOpen]  = useState(false);
  const [supportOpen,  setSupportOpen]  = useState(false);

  return (
    <div className="relative flex flex-col h-full overflow-hidden" style={{ backgroundColor: LIGHT }}>

      {/* Screen overlays */}
      {screen === "privacy" && <PrivacyPolicyScreen onBack={() => setScreen(null)} />}
      {screen === "terms"   && <TermsOfServiceScreen onBack={() => setScreen(null)} />}
      {accountOpen && <AccountSettingsScreen onBack={() => setAccountOpen(false)} />}
      {supportOpen && <CustomerSupportPage onBack={() => setSupportOpen(false)} />}

      {/* ── Header ── */}
      <div
        className="shrink-0 px-5 pt-4 pb-3"
        style={{ backgroundColor: "white", borderBottom: `1px solid ${DIVIDER}` }}
      >
        <p
          className="text-[11px] font-bold tracking-[0.14em] uppercase"
          style={{ color: "#AAAAAA", fontFamily: FONT }}
        >
          MY TRUNKROOM
        </p>
        <h1
          className="text-[20px] font-bold leading-tight"
          style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.03em" }}
        >
          메뉴
        </h1>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto pb-6" style={{ scrollbarWidth: "none" }}>

        {/* Profile card — tappable → AccountSettingsScreen */}
        <button
          onClick={() => setAccountOpen(true)}
          className="mx-4 mt-5 rounded-2xl overflow-hidden w-[calc(100%-2rem)] active:opacity-75 transition-opacity text-left"
        >
          <div
            className="flex items-center gap-4 px-5 py-4"
            style={{ backgroundColor: DARK }}
          >
            <div
              className="flex items-center justify-center rounded-full shrink-0"
              style={{ width: 46, height: 46, backgroundColor: "rgba(255,255,255,0.12)" }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="8" r="4" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" />
                <path d="M3 20C3 15.58 6.58 12 11 12C15.42 12 19 15.58 19 20" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-white" style={{ fontFamily: FONT }}>
                내 계정
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)", fontFamily: FONT }}>
                트렁크룸 회원
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "#F5C200", color: DARK, fontFamily: FONT }}
              >
                MY CLOSET
              </span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3L9 7L5 11" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </button>

        {/* ── 서비스 ── */}
        <SectionLabel>서비스</SectionLabel>
        <RowGroup>
          <Row
            label="회사 소개"
            icon={<BuildingIcon />}
            subValue="메이크레모네이드 공식 웹사이트"
            onPress={() => openExternalUrl(COMPANY_URL)}
          />
          <Row
            label="제휴문의"
            icon={<MailIcon />}
            subValue={PARTNERSHIP_EMAIL}
            onPress={() => openMailTo(PARTNERSHIP_EMAIL, "[제휴문의] 트렁크룸")}
            last
          />
        </RowGroup>

        {/* ── 고객지원 (new combined entry point) ── */}
        <SectionLabel>고객지원</SectionLabel>
        <RowGroup>
          <Row
            label="고객지원 센터"
            icon={<PhoneIcon />}
            subValue="제휴문의 · 전화 · 이메일"
            onPress={() => setSupportOpen(true)}
            last
          />
        </RowGroup>

        {/* ── 법적 고지 ── */}
        <SectionLabel>법적 고지</SectionLabel>
        <RowGroup>
          <Row
            label="개인정보 처리방침"
            icon={<ShieldIcon />}
            onPress={() => setScreen("privacy")}
          />
          <Row
            label="이용약관"
            icon={<DocumentIcon />}
            onPress={() => setScreen("terms")}
            last
          />
        </RowGroup>

        {/* ── 앱 정보 (collapsible) ── */}
        <SectionLabel>앱 정보</SectionLabel>
        <RowGroup>
          <button
            onClick={() => setAppInfoOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left active:opacity-60 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-xl shrink-0" style={{ width: 34, height: 34, backgroundColor: LIGHT }}>
                <InfoIcon />
              </div>
              <div>
                <p className="text-[14px] font-medium" style={{ color: DARK, fontFamily: FONT }}>앱 정보</p>
                <p className="text-[11px] mt-0.5" style={{ color: "#AAAAAA", fontFamily: FONT }}>
                  {COMPANY_NAME} · v{APP_VERSION}
                </p>
              </div>
            </div>
            <svg
              width="14" height="14" viewBox="0 0 14 14" fill="none"
              style={{ transform: appInfoOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
            >
              <path d="M5 3L9 7L5 11" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Expanded detail */}
          {appInfoOpen && (
            <div style={{ borderTop: `1px solid ${DIVIDER}` }}>
              {[
                { label: "버전",              value: `v${APP_VERSION}` },
                { label: "회사",              value: COMPANY_NAME },
                { label: "대표이사",          value: COMPANY_CEO },
                { label: "사업자등록번호",    value: BUSINESS_NUMBER },
                { label: "통신사업자등록번호", value: TELECOM_REG_NUMBER },
              ].map(({ label, value }, i, arr) => (
                <div
                  key={label}
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderBottom: i < arr.length - 1 ? `1px solid ${DIVIDER}` : "none" }}
                >
                  <p className="text-[12px]" style={{ color: "#999", fontFamily: FONT }}>{label}</p>
                  <p className="text-[12px] font-medium text-right" style={{ color: DARK, fontFamily: FONT, maxWidth: "55%" }}>{value}</p>
                </div>
              ))}
            </div>
          )}
        </RowGroup>

        {/* ── Brand footer ── */}
        <div className="flex items-center justify-center gap-2.5 mt-8 mb-2">
          <img
            src="/officiallogo.png"
            alt="트렁크룸"
            style={{ width: 32, height: 32, objectFit: "contain", opacity: 0.35 }}
          />
          <div>
            <p className="text-[12px] font-bold" style={{ color: "#BBBBBB", fontFamily: FONT, letterSpacing: "-0.02em" }}>
              내일의 옷장, 트렁크룸
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "#DDDDDD", fontFamily: FONT }}>
              v{APP_VERSION}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
