/**
 * AccountSettingsScreen.jsx
 *
 * Opened when the user taps "내 계정" in MenuPage.
 * Sections: 계정 정보 / 보안 / 알림 / 약관 및 정책 / 기타
 * Legal sub-screens are handled internally.
 */

import { useState } from "react";
import PrivacyPolicyScreen from "../legal/PrivacyPolicyScreen";
import TermsOfServiceScreen from "../legal/TermsOfServiceScreen";
import EditProfilePage from "../account/EditProfilePage";
import ManageUserInfoPage from "../account/ManageUserInfoPage";
import LoginInfoPage from "../account/LoginInfoPage";
import { clearUser } from "../../lib/userStore";

const FONT    = "'Spoqa Han Sans Neo', sans-serif";
const DARK    = "#1a1a1a";
const DIVIDER = "#F0F0F0";
const LIGHT   = "#F5F5F5";
const GRAY    = "#888";
const RED     = "#E84040";

// ─── Reusable row ─────────────────────────────────────────────────────────────
function Row({ icon, label, value, subValue, onPress, last = false, danger = false, showChevron = true }) {
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
            style={{ width: 34, height: 34, backgroundColor: danger ? "#FFF0F0" : LIGHT }}
          >
            {icon}
          </div>
        )}
        <div>
          <p
            className="text-[14px] font-medium"
            style={{ color: danger ? RED : DARK, fontFamily: FONT }}
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
          <p className="text-[12px]" style={{ color: GRAY, fontFamily: FONT }}>{value}</p>
        )}
        {showChevron && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3L9 7L5 11" stroke={danger ? "#E8A0A0" : "#CCCCCC"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </button>
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

// ─── Icons ────────────────────────────────────────────────────────────────────
const EditIcon    = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M12.5 3L15 5.5L7 13.5H4.5V11L12.5 3Z" stroke="#555" strokeWidth="1.3" strokeLinejoin="round"/><path d="M10.5 5L13 7.5" stroke="#555" strokeWidth="1.3"/></svg>;
const PersonIcon  = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6.5" r="3" stroke="#555" strokeWidth="1.3"/><path d="M3 16C3 12.69 5.69 10 9 10C12.31 10 15 12.69 15 16" stroke="#555" strokeWidth="1.3" strokeLinecap="round"/></svg>;
const KeyIcon     = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="7" cy="8" r="4" stroke="#555" strokeWidth="1.3"/><path d="M10.5 10.5L15.5 15.5M12.5 12.5L14 11" stroke="#555" strokeWidth="1.3" strokeLinecap="round"/></svg>;
const LockIcon    = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="4" y="8" width="10" height="8" rx="2" stroke="#555" strokeWidth="1.3"/><path d="M6 8V6C6 4.34 7.34 3 9 3C10.66 3 12 4.34 12 6V8" stroke="#555" strokeWidth="1.3" strokeLinecap="round"/><circle cx="9" cy="12" r="1" fill="#555"/></svg>;
const LinkIcon    = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M7.5 10.5C8.33 11.33 9.67 11.33 10.5 10.5L13 8C13.83 7.17 13.83 5.83 13 5C12.17 4.17 10.83 4.17 10 5L9 6" stroke="#555" strokeWidth="1.3" strokeLinecap="round"/><path d="M10.5 7.5C9.67 6.67 8.33 6.67 7.5 7.5L5 10C4.17 10.83 4.17 12.17 5 13C5.83 13.83 7.17 13.83 8 13L9 12" stroke="#555" strokeWidth="1.3" strokeLinecap="round"/></svg>;
const BellIcon    = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2C6.24 2 4 4.24 4 7V12L2.5 13.5H15.5L14 12V7C14 4.24 11.76 2 9 2Z" stroke="#555" strokeWidth="1.3" strokeLinejoin="round"/><path d="M7.5 15C7.5 15.83 8.17 16.5 9 16.5C9.83 16.5 10.5 15.83 10.5 15" stroke="#555" strokeWidth="1.3"/></svg>;
const ShieldIcon  = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L3 5V9.5C3 13 6 15.7 9 16.5C12 15.7 15 13 15 9.5V5L9 2Z" stroke="#555" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6.5 9L8.2 10.7L11.5 7.5" stroke="#555" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const DocIcon     = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 2H5C4.45 2 4 2.45 4 3V15C4 15.55 4.45 16 5 16H13C13.55 16 14 15.55 14 15V5L11 2Z" stroke="#555" strokeWidth="1.3" strokeLinejoin="round"/><path d="M11 2V5H14" stroke="#555" strokeWidth="1.3" strokeLinejoin="round"/><path d="M7 9H11M7 12H9" stroke="#555" strokeWidth="1.2" strokeLinecap="round"/></svg>;
const LogoutIcon  = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M7 3H4C3.45 3 3 3.45 3 4V14C3 14.55 3.45 15 4 15H7" stroke={RED} strokeWidth="1.3" strokeLinecap="round"/><path d="M12 6L15 9L12 12" stroke={RED} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 9H15" stroke={RED} strokeWidth="1.3" strokeLinecap="round"/></svg>;
const TrashIcon   = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 5H15M6 5V3.5C6 3.22 6.22 3 6.5 3H11.5C11.78 3 12 3.22 12 3.5V5M7 8V13M11 8V13M4.5 5L5.5 15H12.5L13.5 5" stroke={RED} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>;

// ─── Logout confirmation ──────────────────────────────────────────────────────
function LogoutConfirm({ onConfirm, onCancel }) {
  return (
    <div
      className="absolute inset-0 z-10 flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
    >
      <div
        className="w-full rounded-t-3xl px-5 pt-6 pb-8"
        style={{ backgroundColor: "white" }}
      >
        <p
          className="text-[16px] font-bold text-center mb-1"
          style={{ color: DARK, fontFamily: FONT }}
        >
          로그아웃 할까요?
        </p>
        <p
          className="text-[13px] text-center mb-6"
          style={{ color: GRAY, fontFamily: FONT }}
        >
          다음에 다시 로그인하실 수 있어요
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-12 rounded-xl text-[14px] font-medium"
            style={{ backgroundColor: LIGHT, color: GRAY, fontFamily: FONT }}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-12 rounded-xl text-[14px] font-bold"
            style={{ backgroundColor: RED, color: "white", fontFamily: FONT }}
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function AccountSettingsScreen({ onBack }) {
  const [legalScreen,    setLegalScreen]    = useState(null);   // null | "privacy" | "terms"
  const [showLogout,     setShowLogout]     = useState(false);
  const [loggedOut,      setLoggedOut]      = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [manageInfoOpen,  setManageInfoOpen]  = useState(false);
  const [loginInfoOpen,   setLoginInfoOpen]   = useState(false);
  const [toast,           setToast]           = useState(null);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  function handleLogoutConfirm() {
    setShowLogout(false);
    setLoggedOut(true);
  }

  function handleDeleteAccount() {
    clearUser();
    setLoginInfoOpen(false);
    setLoggedOut(true);
  }

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col overflow-hidden"
      style={{ backgroundColor: LIGHT }}
    >
      {/* Sub-screens */}
      {legalScreen === "privacy" && <PrivacyPolicyScreen onBack={() => setLegalScreen(null)} />}
      {legalScreen === "terms"   && <TermsOfServiceScreen onBack={() => setLegalScreen(null)} />}
      {editProfileOpen && <EditProfilePage onBack={() => setEditProfileOpen(false)} />}
      {manageInfoOpen  && <ManageUserInfoPage onBack={() => setManageInfoOpen(false)} />}
      {loginInfoOpen   && (
        <LoginInfoPage
          onBack={() => setLoginInfoOpen(false)}
          onLogout={() => { setLoginInfoOpen(false); setLoggedOut(true); }}
          onDeleteAccount={handleDeleteAccount}
        />
      )}

      {/* Logout sheet */}
      {showLogout && (
        <LogoutConfirm
          onConfirm={handleLogoutConfirm}
          onCancel={() => setShowLogout(false)}
        />
      )}

      {/* ── Header ── */}
      <div
        className="shrink-0 flex items-center justify-between px-4 h-14 bg-white"
        style={{ borderBottom: `1px solid ${DIVIDER}` }}
      >
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 4L7 10L12.5 16" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2
          className="text-[17px] font-bold"
          style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}
        >
          내 계정
        </h2>
        <div style={{ width: 36 }} />
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto pb-8" style={{ scrollbarWidth: "none" }}>

        {/* Profile summary card */}
        {loggedOut ? (
          <div className="mx-4 mt-5 rounded-2xl px-5 py-6 flex flex-col items-center gap-3" style={{ backgroundColor: "white", border: `1px solid ${DIVIDER}` }}>
            <span style={{ fontSize: 40 }}>👋</span>
            <p className="text-[14px] font-bold" style={{ color: DARK, fontFamily: FONT }}>로그아웃되었어요</p>
            <p className="text-[12px]" style={{ color: GRAY, fontFamily: FONT }}>다음에 또 만나요!</p>
          </div>
        ) : (
          <div className="mx-4 mt-5 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-4 px-5 py-4" style={{ backgroundColor: DARK }}>
              <div className="flex items-center justify-center rounded-full shrink-0" style={{ width: 46, height: 46, backgroundColor: "rgba(255,255,255,0.12)" }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="8" r="4" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" />
                  <path d="M3 20C3 15.58 6.58 12 11 12C15.42 12 19 15.58 19 20" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-bold text-white" style={{ fontFamily: FONT }}>트렁크룸 회원</p>
                <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)", fontFamily: FONT }}>가입된 계정이에요</p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#F5C200", color: DARK, fontFamily: FONT }}>
                MY CLOSET
              </span>
            </div>
          </div>
        )}

        {/* ── 계정 정보 ── */}
        <SectionLabel>계정 정보</SectionLabel>
        <RowGroup>
          <Row label="프로필 수정"  icon={<EditIcon />}   subValue="이름, 프로필 사진 변경" onPress={() => setEditProfileOpen(true)} />
          <Row label="내 정보 관리" icon={<PersonIcon />} subValue="연락처, 주소 등" onPress={() => setManageInfoOpen(true)} />
          <Row label="로그인 정보"  icon={<KeyIcon />}    subValue="이메일 · 소셜 계정" onPress={() => setLoginInfoOpen(true)} last />
        </RowGroup>

        {/* ── 보안 ── */}
        <SectionLabel>보안</SectionLabel>
        <RowGroup>
          <Row label="비밀번호 변경" icon={<LockIcon />} onPress={() => setLoginInfoOpen(true)} />
          <Row label="계정 연동"     icon={<LinkIcon />} subValue="카카오, 애플 등 소셜 로그인" onPress={() => showToast("소셜 계정 연동은 앱에서 이용 가능해요")} last />
        </RowGroup>

        {/* ── 알림 ── */}
        <SectionLabel>알림</SectionLabel>
        <RowGroup>
          <Row label="알림 설정" icon={<BellIcon />} subValue="푸시 알림 및 마케팅 수신 설정" onPress={() => setManageInfoOpen(true)} last />
        </RowGroup>

        {/* ── 약관 및 정책 ── */}
        <SectionLabel>약관 및 정책</SectionLabel>
        <RowGroup>
          <Row label="이용약관"          icon={<DocIcon />}    onPress={() => setLegalScreen("terms")} />
          <Row label="개인정보 처리방침" icon={<ShieldIcon />} onPress={() => setLegalScreen("privacy")} last />
        </RowGroup>

        {/* ── 기타 ── */}
        <SectionLabel>기타</SectionLabel>
        <RowGroup>
          <Row label="로그아웃" icon={<LogoutIcon />} danger onPress={() => setShowLogout(true)} />
          <Row label="탈퇴하기" icon={<TrashIcon />}  danger subValue="계정 및 데이터가 영구 삭제돼요" onPress={() => setLoginInfoOpen(true)} last />
        </RowGroup>

      </div>

      {/* Toast */}
      {toast && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center z-50 pointer-events-none">
          <div className="px-4 py-2.5 rounded-full" style={{ backgroundColor: DARK }}>
            <p className="text-white text-[13px] font-medium" style={{ fontFamily: FONT }}>{toast}</p>
          </div>
        </div>
      )}
    </div>
  );
}
