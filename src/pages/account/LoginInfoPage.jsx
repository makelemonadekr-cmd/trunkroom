import { useState } from "react";
import { getUser, saveUser, clearUser } from "../../lib/userStore";

const FONT = "'Spoqa Han Sans Neo', sans-serif";
const DARK = "#1a1a1a";
const YELLOW = "#F5C200";
const LIGHT = "#F5F5F5";
const DIVIDER = "#F0F0F0";
const GRAY = "#888";
const RED = "#E84040";

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M12.5 4L7 10L12.5 16" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const inputStyle = { backgroundColor: LIGHT, fontFamily: FONT, color: DARK, border: "none", outline: "none" };

const METHOD_LABEL = { email: "이메일", kakao: "카카오", apple: "애플" };

function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export default function LoginInfoPage({ onBack, onLogout, onDeleteAccount }) {
  const initial = getUser();
  const loginMethod = initial.loginMethod || "email";
  const [currentEmail, setCurrentEmail] = useState(initial.email);
  const [newEmail, setNewEmail] = useState("");
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 1500);
  }

  function handleChangeEmail() {
    setError(null);
    if (!isValidEmail(newEmail)) {
      setError("올바른 이메일 형식이 아니에요");
      return;
    }
    saveUser({ email: newEmail });
    setCurrentEmail(newEmail);
    setNewEmail("");
    showToast("이메일이 변경되었어요 ✓");
  }

  function handleChangePw() {
    setError(null);
    if (!curPw || !newPw || !confirmPw) {
      setError("모든 비밀번호를 입력해주세요");
      return;
    }
    if (newPw.length < 6) {
      setError("새 비밀번호는 6자 이상이어야 해요");
      return;
    }
    if (newPw !== confirmPw) {
      setError("새 비밀번호가 일치하지 않아요");
      return;
    }
    setCurPw(""); setNewPw(""); setConfirmPw("");
    showToast("비밀번호가 변경되었어요 ✓");
  }

  function handleDelete() {
    clearUser();
    setShowDeleteSheet(false);
    onDeleteAccount?.();
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col overflow-hidden" style={{ backgroundColor: LIGHT }}>
      <div className="shrink-0 flex items-center justify-between px-4 h-14 bg-white" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center"><BackIcon /></button>
        <h2 className="text-[17px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>로그인 정보</h2>
        <div style={{ width: 36 }} />
      </div>

      <div className="flex-1 overflow-y-auto pb-8" style={{ scrollbarWidth: "none" }}>
        {/* Login method badge */}
        <div className="mx-4 mt-5 rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: "white", border: `1px solid ${DIVIDER}` }}>
          <div className="w-10 h-10 flex items-center justify-center rounded-full" style={{ backgroundColor: LIGHT }}>
            <span style={{ fontSize: 18 }}>🔑</span>
          </div>
          <div className="flex-1">
            <p className="text-[12px]" style={{ color: GRAY, fontFamily: FONT }}>현재 로그인 방법</p>
            <p className="text-[14px] font-bold mt-0.5" style={{ color: DARK, fontFamily: FONT }}>{METHOD_LABEL[loginMethod]} 로그인</p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: YELLOW, color: DARK, fontFamily: FONT }}>
            {METHOD_LABEL[loginMethod].toUpperCase()}
          </span>
        </div>

        {loginMethod === "email" && (
          <>
            {/* Change email */}
            <p className="px-5 pt-5 pb-1.5 text-[11px] font-bold tracking-[0.1em] uppercase" style={{ color: "#AAAAAA", fontFamily: FONT }}>이메일 변경</p>
            <div className="mx-4 rounded-2xl bg-white p-4 flex flex-col gap-3" style={{ border: `1px solid ${DIVIDER}` }}>
              <div>
                <p className="text-[11px] mb-1" style={{ color: GRAY, fontFamily: FONT }}>현재 이메일</p>
                <p className="text-[13px] font-medium" style={{ color: DARK, fontFamily: FONT }}>{currentEmail}</p>
              </div>
              <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="새 이메일" className="w-full px-4 py-3 rounded-xl text-[14px]" style={inputStyle} />
              <button onClick={handleChangeEmail} className="w-full py-3 rounded-xl text-[13px] font-bold" style={{ backgroundColor: DARK, color: "white", fontFamily: FONT }}>
                이메일 변경
              </button>
            </div>

            {/* Change password */}
            <p className="px-5 pt-5 pb-1.5 text-[11px] font-bold tracking-[0.1em] uppercase" style={{ color: "#AAAAAA", fontFamily: FONT }}>비밀번호 변경</p>
            <div className="mx-4 rounded-2xl bg-white p-4 flex flex-col gap-3" style={{ border: `1px solid ${DIVIDER}` }}>
              <input type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} placeholder="현재 비밀번호" className="w-full px-4 py-3 rounded-xl text-[14px]" style={inputStyle} />
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="새 비밀번호 (6자 이상)" className="w-full px-4 py-3 rounded-xl text-[14px]" style={inputStyle} />
              <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="새 비밀번호 확인" className="w-full px-4 py-3 rounded-xl text-[14px]" style={inputStyle} />
              <button onClick={handleChangePw} className="w-full py-3 rounded-xl text-[13px] font-bold" style={{ backgroundColor: DARK, color: "white", fontFamily: FONT }}>
                비밀번호 변경
              </button>
            </div>
          </>
        )}

        {error && (
          <p className="px-5 pt-3 text-[12px]" style={{ color: RED, fontFamily: FONT }}>{error}</p>
        )}

        {/* Danger zone */}
        <p className="px-5 pt-6 pb-1.5 text-[11px] font-bold tracking-[0.1em] uppercase" style={{ color: "#AAAAAA", fontFamily: FONT }}>계정</p>
        <div className="mx-4 rounded-2xl bg-white overflow-hidden" style={{ border: `1px solid ${DIVIDER}` }}>
          <button onClick={onLogout} className="w-full text-left px-4 py-3.5" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
            <p className="text-[14px] font-bold" style={{ color: RED, fontFamily: FONT }}>로그아웃</p>
          </button>
          <button onClick={() => setShowDeleteSheet(true)} className="w-full text-left px-4 py-3.5">
            <p className="text-[14px] font-bold" style={{ color: RED, fontFamily: FONT }}>탈퇴하기</p>
            <p className="text-[11px] mt-0.5" style={{ color: GRAY, fontFamily: FONT }}>계정 및 데이터가 영구 삭제돼요</p>
          </button>
        </div>
      </div>

      {/* Delete sheet */}
      {showDeleteSheet && (
        <div className="absolute inset-0 z-30 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="w-full rounded-t-3xl px-5 pt-6 pb-8" style={{ backgroundColor: "white" }}>
            <p className="text-[16px] font-bold text-center mb-1" style={{ color: DARK, fontFamily: FONT }}>정말 탈퇴하시겠어요?</p>
            <p className="text-[13px] text-center mb-6" style={{ color: GRAY, fontFamily: FONT }}>계정과 모든 데이터가 영구 삭제돼요</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteSheet(false)} className="flex-1 h-12 rounded-xl text-[14px] font-medium" style={{ backgroundColor: LIGHT, color: GRAY, fontFamily: FONT }}>
                취소
              </button>
              <button onClick={handleDelete} className="flex-1 h-12 rounded-xl text-[14px] font-bold" style={{ backgroundColor: RED, color: "white", fontFamily: FONT }}>
                탈퇴
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center z-50 pointer-events-none">
          <div className="px-4 py-2.5 rounded-full" style={{ backgroundColor: DARK }}>
            <p className="text-white text-[13px] font-medium" style={{ fontFamily: FONT }}>{toast}</p>
          </div>
        </div>
      )}
    </div>
  );
}
