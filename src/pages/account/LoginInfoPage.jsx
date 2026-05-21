/**
 * LoginInfoPage.jsx
 *
 * 로그인 정보 관리 화면:
 *   - 이메일 변경 → Supabase updateUser (인증 이메일 발송)
 *   - 비밀번호 변경 → 현재 비밀번호 재인증 후 updateUser
 *   - 로그아웃 → signOut
 *   - 탈퇴하기 → deleteAccount Edge Function → signOut
 */

import { useState }              from "react";
import { useAuth }               from "../../hooks/useAuth.js";
import {
  signIn,
  signOut,
  updatePassword,
  updateEmail,
  deleteAccount,
}                                from "../../services/authService.js";

const FONT    = "'Spoqa Han Sans Neo', sans-serif";
const DARK    = "#1a1a1a";
const YELLOW  = "#F5C200";
const LIGHT   = "#F5F5F5";
const DIVIDER = "#F0F0F0";
const GRAY    = "#888";
const RED     = "#E84040";

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M12.5 4L7 10L12.5 16" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const inputStyle = {
  backgroundColor: LIGHT,
  fontFamily:      FONT,
  color:           DARK,
  border:          "1.5px solid transparent",
  outline:         "none",
  borderRadius:    12,
};

export default function LoginInfoPage({ onBack, onLogout, onDeleteAccount }) {
  const { user } = useAuth();

  // ── 이메일 변경 ────────────────────────────────────────────────────────────
  const [newEmail,     setNewEmail]     = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg,     setEmailMsg]     = useState(null); // { text, ok }

  // ── 비밀번호 변경 ──────────────────────────────────────────────────────────
  const [curPw,      setCurPw]      = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [pwLoading,  setPwLoading]  = useState(false);
  const [pwMsg,      setPwMsg]      = useState(null); // { text, ok }

  // ── 탈퇴 ──────────────────────────────────────────────────────────────────
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [deleteLoading,   setDeleteLoading]   = useState(false);
  const [deleteError,     setDeleteError]     = useState("");

  // ── 토스트 ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  // ── 이메일 변경 처리 ────────────────────────────────────────────────────────
  async function handleChangeEmail() {
    setEmailMsg(null);
    if (!newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setEmailMsg({ text: "올바른 이메일 형식이 아니에요", ok: false });
      return;
    }
    setEmailLoading(true);
    const { error } = await updateEmail(newEmail.trim());
    setEmailLoading(false);
    if (error) {
      setEmailMsg({ text: "이메일 변경에 실패했어요. 다시 시도해주세요.", ok: false });
    } else {
      setNewEmail("");
      setEmailMsg({ text: "인증 링크를 새 이메일로 보냈어요. 링크를 클릭하면 변경돼요.", ok: true });
    }
  }

  // ── 비밀번호 변경 처리 ──────────────────────────────────────────────────────
  async function handleChangePw() {
    setPwMsg(null);
    if (!curPw || !newPw || !confirmPw) {
      setPwMsg({ text: "모든 항목을 입력해주세요", ok: false });
      return;
    }
    if (newPw.length < 6) {
      setPwMsg({ text: "새 비밀번호는 6자리 이상이어야 해요", ok: false });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ text: "새 비밀번호가 일치하지 않아요", ok: false });
      return;
    }

    setPwLoading(true);

    // 1단계: 현재 비밀번호 재인증으로 검증
    const { error: signInErr } = await signIn(user?.email ?? "", curPw);
    if (signInErr) {
      setPwLoading(false);
      setPwMsg({ text: "현재 비밀번호가 맞지 않아요", ok: false });
      return;
    }

    // 2단계: 새 비밀번호로 업데이트
    const { error: updateErr } = await updatePassword(newPw);
    setPwLoading(false);

    if (updateErr) {
      setPwMsg({ text: "비밀번호 변경에 실패했어요. 다시 시도해주세요.", ok: false });
    } else {
      setCurPw(""); setNewPw(""); setConfirmPw("");
      setPwMsg({ text: "비밀번호가 변경됐어요 ✓", ok: true });
    }
  }

  // ── 탈퇴 처리 ──────────────────────────────────────────────────────────────
  async function handleDelete() {
    setDeleteError("");
    setDeleteLoading(true);
    const { error } = await deleteAccount();
    setDeleteLoading(false);

    if (error) {
      setDeleteError("탈퇴에 실패했어요. 잠시 후 다시 시도해주세요.");
      return;
    }

    // Edge Function 이 auth.users 까지 삭제 → 클라이언트 세션도 정리
    await signOut();
    setShowDeleteSheet(false);
    onDeleteAccount?.();
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col overflow-hidden" style={{ backgroundColor: LIGHT }}>
      {/* Header */}
      <div
        className="shrink-0 flex items-center justify-between px-4 h-14 bg-white"
        style={{ borderBottom: `1px solid ${DIVIDER}` }}
      >
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center">
          <BackIcon />
        </button>
        <h2 className="text-[17px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>
          로그인 정보
        </h2>
        <div style={{ width: 36 }} />
      </div>

      <div className="flex-1 overflow-y-auto pb-10" style={{ scrollbarWidth: "none" }}>

        {/* 계정 뱃지 */}
        <div
          className="mx-4 mt-5 rounded-2xl p-4 flex items-center gap-3"
          style={{ backgroundColor: "white", border: `1px solid ${DIVIDER}` }}
        >
          <div className="w-10 h-10 flex items-center justify-center rounded-full" style={{ backgroundColor: LIGHT }}>
            <span style={{ fontSize: 18 }}>🔑</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px]" style={{ color: GRAY, fontFamily: FONT }}>현재 이메일</p>
            <p className="text-[14px] font-bold mt-0.5 truncate" style={{ color: DARK, fontFamily: FONT }}>
              {user?.email ?? "—"}
            </p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: YELLOW, color: DARK, fontFamily: FONT }}>
            EMAIL
          </span>
        </div>

        {/* ── 이메일 변경 ── */}
        <p className="px-5 pt-5 pb-1.5 text-[11px] font-bold tracking-[0.1em] uppercase" style={{ color: "#AAAAAA", fontFamily: FONT }}>
          이메일 변경
        </p>
        <div className="mx-4 rounded-2xl bg-white p-4 flex flex-col gap-3" style={{ border: `1px solid ${DIVIDER}` }}>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleChangeEmail()}
            placeholder="새 이메일 주소"
            className="w-full px-4 py-3 text-[14px]"
            style={inputStyle}
            onFocus={(e) => (e.target.style.border = `1.5px solid ${YELLOW}`)}
            onBlur={(e)  => (e.target.style.border = "1.5px solid transparent")}
          />
          {emailMsg && (
            <p className="text-[12px] px-1" style={{ color: emailMsg.ok ? "#22C55E" : RED, fontFamily: FONT }}>
              {emailMsg.text}
            </p>
          )}
          <button
            onClick={handleChangeEmail}
            disabled={emailLoading}
            className="w-full py-3 rounded-xl text-[13px] font-bold active:opacity-80"
            style={{ backgroundColor: emailLoading ? "#E8E8E8" : DARK, color: "white", fontFamily: FONT }}
          >
            {emailLoading ? "처리 중…" : "이메일 변경"}
          </button>
        </div>

        {/* ── 비밀번호 변경 ── */}
        <p className="px-5 pt-5 pb-1.5 text-[11px] font-bold tracking-[0.1em] uppercase" style={{ color: "#AAAAAA", fontFamily: FONT }}>
          비밀번호 변경
        </p>
        <div className="mx-4 rounded-2xl bg-white p-4 flex flex-col gap-3" style={{ border: `1px solid ${DIVIDER}` }}>
          <input
            type="password"
            value={curPw}
            onChange={(e) => setCurPw(e.target.value)}
            placeholder="현재 비밀번호"
            className="w-full px-4 py-3 text-[14px]"
            style={inputStyle}
            onFocus={(e) => (e.target.style.border = `1.5px solid ${YELLOW}`)}
            onBlur={(e)  => (e.target.style.border = "1.5px solid transparent")}
          />
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="새 비밀번호 (6자 이상)"
            className="w-full px-4 py-3 text-[14px]"
            style={inputStyle}
            onFocus={(e) => (e.target.style.border = `1.5px solid ${YELLOW}`)}
            onBlur={(e)  => (e.target.style.border = "1.5px solid transparent")}
          />
          <input
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleChangePw()}
            placeholder="새 비밀번호 확인"
            className="w-full px-4 py-3 text-[14px]"
            style={inputStyle}
            onFocus={(e) => (e.target.style.border = `1.5px solid ${YELLOW}`)}
            onBlur={(e)  => (e.target.style.border = "1.5px solid transparent")}
          />
          {pwMsg && (
            <p className="text-[12px] px-1" style={{ color: pwMsg.ok ? "#22C55E" : RED, fontFamily: FONT }}>
              {pwMsg.text}
            </p>
          )}
          <button
            onClick={handleChangePw}
            disabled={pwLoading}
            className="w-full py-3 rounded-xl text-[13px] font-bold active:opacity-80"
            style={{ backgroundColor: pwLoading ? "#E8E8E8" : DARK, color: "white", fontFamily: FONT }}
          >
            {pwLoading ? "처리 중…" : "비밀번호 변경"}
          </button>
        </div>

        {/* ── 계정 ── */}
        <p className="px-5 pt-6 pb-1.5 text-[11px] font-bold tracking-[0.1em] uppercase" style={{ color: "#AAAAAA", fontFamily: FONT }}>
          계정
        </p>
        <div className="mx-4 rounded-2xl bg-white overflow-hidden" style={{ border: `1px solid ${DIVIDER}` }}>
          <button
            onClick={async () => { await signOut(); onLogout?.(); }}
            className="w-full text-left px-4 py-3.5 active:opacity-60"
            style={{ borderBottom: `1px solid ${DIVIDER}` }}
          >
            <p className="text-[14px] font-bold" style={{ color: RED, fontFamily: FONT }}>로그아웃</p>
          </button>
          <button
            onClick={() => { setDeleteError(""); setShowDeleteSheet(true); }}
            className="w-full text-left px-4 py-3.5 active:opacity-60"
          >
            <p className="text-[14px] font-bold" style={{ color: RED, fontFamily: FONT }}>탈퇴하기</p>
            <p className="text-[11px] mt-0.5" style={{ color: GRAY, fontFamily: FONT }}>계정 및 모든 데이터가 영구 삭제돼요</p>
          </button>
        </div>

      </div>

      {/* ── 탈퇴 확인 바텀시트 ── */}
      {showDeleteSheet && (
        <div className="absolute inset-0 z-30 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="w-full rounded-t-3xl px-5 pt-6 pb-8" style={{ backgroundColor: "white" }}>
            <p className="text-[16px] font-bold text-center mb-1" style={{ color: DARK, fontFamily: FONT }}>
              정말 탈퇴하시겠어요?
            </p>
            <p className="text-[13px] text-center mb-2" style={{ color: GRAY, fontFamily: FONT }}>
              옷장, 스타일, 착용 기록이 모두 삭제되고{"\n"}복구할 수 없어요.
            </p>
            {deleteError && (
              <p className="text-[12px] text-center mb-3" style={{ color: RED, fontFamily: FONT }}>
                {deleteError}
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowDeleteSheet(false)}
                disabled={deleteLoading}
                className="flex-1 h-12 rounded-xl text-[14px] font-medium active:opacity-60"
                style={{ backgroundColor: LIGHT, color: GRAY, fontFamily: FONT }}
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 h-12 rounded-xl text-[14px] font-bold active:opacity-80"
                style={{ backgroundColor: deleteLoading ? "#E8A0A0" : RED, color: "white", fontFamily: FONT }}
              >
                {deleteLoading ? "처리 중…" : "탈퇴"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
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
