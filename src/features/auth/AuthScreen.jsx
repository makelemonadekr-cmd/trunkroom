/**
 * AuthScreen.jsx
 *
 * Handles both Login and Sign-up views inside the phone shell.
 * Switches between views with internal state — App.jsx only needs to
 * render <AuthScreen /> when there is no active session.
 *
 * Design strictly follows the existing Trunkroom design system:
 *   Font  : Spoqa Han Sans Neo
 *   Yellow: #F5C200
 *   Dark  : #1a1a1a
 *   Inputs: #F5F5F5 background, rounded-xl
 *   Buttons: rounded-2xl, full width
 */

import { useState } from "react";
import { signIn, signUp } from "../../services/authService";

const FONT   = "'Spoqa Han Sans Neo', sans-serif";
const DARK   = "#1a1a1a";
const YELLOW = "#F5C200";

// ─── Shared input component ───────────────────────────────────────────────────

function AuthInput({ type = "text", placeholder, value, onChange, autoComplete }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className="w-full px-4 py-3.5 rounded-xl text-[14px] outline-none"
      style={{
        backgroundColor: "#F5F5F5",
        color:           DARK,
        fontFamily:      FONT,
        border:          "1.5px solid transparent",
      }}
      onFocus={(e)  => (e.target.style.border = `1.5px solid ${YELLOW}`)}
      onBlur={(e)   => (e.target.style.border = "1.5px solid transparent")}
    />
  );
}

// ─── Error message ─────────────────────────────────────────────────────────────

function ErrorMsg({ msg }) {
  if (!msg) return null;
  return (
    <p
      className="text-[12px] text-center px-2"
      style={{ color: "#E84040", fontFamily: FONT, lineHeight: 1.5 }}
    >
      {msg}
    </p>
  );
}

// ─── Login view ───────────────────────────────────────────────────────────────

function LoginView({ onGoSignUp }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password)  { setError("이메일과 비밀번호를 입력해주세요."); return; }
    setError("");
    setLoading(true);
    const { error: err } = await signIn(email.trim(), password);
    setLoading(false);
    if (err) {
      if (err.message.includes("Invalid login")) setError("이메일 또는 비밀번호가 올바르지 않아요.");
      else if (err.message.includes("Email not confirmed")) setError("이메일 인증 후 로그인할 수 있어요. 받은편지함을 확인해주세요.");
      else setError("로그인에 실패했어요. 다시 시도해주세요.");
    }
    // On success, useAuth in App.jsx picks up the session automatically
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-white overflow-hidden">
      {/* Logo area */}
      <div className="flex flex-col items-center pt-16 pb-8 px-8">
        <img
          src="/officiallogo.png"
          alt="트렁크룸"
          style={{ width: 72, height: 72, objectFit: "contain", marginBottom: 14 }}
        />
        <h1
          className="text-[24px] font-bold tracking-tight"
          style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.03em" }}
        >
          트렁크룸
        </h1>
        <p
          className="text-[13px] mt-1.5"
          style={{ color: "#AAAAAA", fontFamily: FONT }}
        >
          나만의 스타일 아카이브
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 flex flex-col gap-3">
        <AuthInput
          type="email"
          placeholder="이메일"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <AuthInput
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        <ErrorMsg msg={error} />

        {/* Login button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center rounded-2xl font-bold active:opacity-80 mt-2"
          style={{
            height:          56,
            backgroundColor: loading ? "#E8E8E8" : YELLOW,
            color:           DARK,
            fontFamily:      FONT,
            fontSize:        15,
          }}
        >
          {loading ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
              <path d="M10 2a8 8 0 1 1-5.66 2.34" stroke={DARK} strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : "로그인"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px" style={{ backgroundColor: "#EEEEEE" }} />
          <span className="text-[11px]" style={{ color: "#CCCCCC", fontFamily: FONT }}>또는</span>
          <div className="flex-1 h-px" style={{ backgroundColor: "#EEEEEE" }} />
        </div>

        {/* Sign up link */}
        <button
          onClick={onGoSignUp}
          className="w-full flex items-center justify-center rounded-2xl font-bold active:opacity-70"
          style={{
            height:          56,
            backgroundColor: "#F5F5F5",
            color:           DARK,
            fontFamily:      FONT,
            fontSize:        14,
          }}
        >
          새 계정 만들기
        </button>
      </div>

      {/* Footer */}
      <p
        className="text-center pb-8 text-[11px] px-8"
        style={{ color: "#CCCCCC", fontFamily: FONT, lineHeight: 1.6 }}
      >
        로그인 시 트렁크룸의 서비스 이용약관 및{"\n"}개인정보처리방침에 동의하게 됩니다.
      </p>
    </div>
  );
}

// ─── Sign-up view ─────────────────────────────────────────────────────────────

function SignUpView({ onGoLogin }) {
  const [nickname,  setNickname]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [password2, setPassword2] = useState("");
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false); // email confirm pending

  async function handleSignUp() {
    if (!nickname.trim())           { setError("닉네임을 입력해주세요."); return; }
    if (!email.trim())              { setError("이메일을 입력해주세요."); return; }
    if (password.length < 6)        { setError("비밀번호는 6자리 이상이어야 해요."); return; }
    if (password !== password2)     { setError("비밀번호가 일치하지 않아요."); return; }

    setError("");
    setLoading(true);
    const { error: err } = await signUp(email.trim(), password, nickname.trim());
    setLoading(false);

    if (err) {
      if (err.message.includes("already registered")) setError("이미 가입된 이메일이에요. 로그인해주세요.");
      else setError("가입에 실패했어요. 다시 시도해주세요.");
    } else {
      setDone(true); // show email confirmation notice
    }
  }

  // ── Email confirmation pending screen ────────────────────────────────────
  if (done) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white px-8">
        <span style={{ fontSize: 56 }} className="mb-5">📩</span>
        <h2
          className="text-[20px] font-bold text-center mb-2"
          style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}
        >
          이메일을 확인해주세요
        </h2>
        <p
          className="text-[13px] text-center mb-8"
          style={{ color: "#888", fontFamily: FONT, lineHeight: 1.65 }}
        >
          <span style={{ color: DARK, fontWeight: 700 }}>{email}</span>으로{"\n"}
          인증 링크를 보냈어요.{"\n"}
          링크를 클릭하면 바로 시작할 수 있어요.
        </p>
        <button
          onClick={onGoLogin}
          className="w-full flex items-center justify-center rounded-2xl font-bold active:opacity-80"
          style={{
            height:          56,
            backgroundColor: YELLOW,
            color:           DARK,
            fontFamily:      FONT,
            fontSize:        15,
          }}
        >
          로그인 화면으로
        </button>
      </div>
    );
  }

  // ── Sign-up form ──────────────────────────────────────────────────────────
  return (
    <div className="absolute inset-0 flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center px-5 shrink-0"
        style={{ height: 52, borderBottom: "1px solid #F0F0F0" }}
      >
        <button
          onClick={onGoLogin}
          className="w-9 h-9 flex items-center justify-center rounded-full active:opacity-60"
          style={{ backgroundColor: "#F2F2F2" }}
        >
          <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
            <path d="M7.5 1.5L2 7.5L7.5 13.5" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2
          className="text-[16px] font-bold mx-auto"
          style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}
        >
          회원가입
        </h2>
        <div style={{ width: 36 }} />
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8 flex flex-col gap-3" style={{ scrollbarWidth: "none" }}>
        <div>
          <p className="text-[11px] font-bold mb-1.5" style={{ color: "#AAAAAA", fontFamily: FONT, letterSpacing: "0.04em" }}>닉네임</p>
          <AuthInput
            placeholder="트렁크룸에서 사용할 이름"
            value={nickname}
            onChange={setNickname}
            autoComplete="nickname"
          />
        </div>

        <div>
          <p className="text-[11px] font-bold mb-1.5" style={{ color: "#AAAAAA", fontFamily: FONT, letterSpacing: "0.04em" }}>이메일</p>
          <AuthInput
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />
        </div>

        <div>
          <p className="text-[11px] font-bold mb-1.5" style={{ color: "#AAAAAA", fontFamily: FONT, letterSpacing: "0.04em" }}>비밀번호</p>
          <AuthInput
            type="password"
            placeholder="6자리 이상"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
          />
        </div>

        <div>
          <p className="text-[11px] font-bold mb-1.5" style={{ color: "#AAAAAA", fontFamily: FONT, letterSpacing: "0.04em" }}>비밀번호 확인</p>
          <AuthInput
            type="password"
            placeholder="비밀번호 재입력"
            value={password2}
            onChange={setPassword2}
            autoComplete="new-password"
          />
        </div>

        <ErrorMsg msg={error} />

        {/* Sign up button */}
        <button
          onClick={handleSignUp}
          disabled={loading}
          className="w-full flex items-center justify-center rounded-2xl font-bold active:opacity-80 mt-2"
          style={{
            height:          56,
            backgroundColor: loading ? "#E8E8E8" : YELLOW,
            color:           DARK,
            fontFamily:      FONT,
            fontSize:        15,
          }}
        >
          {loading ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
              <path d="M10 2a8 8 0 1 1-5.66 2.34" stroke={DARK} strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : "시작하기 →"}
        </button>

        <p
          className="text-[11px] text-center"
          style={{ color: "#CCCCCC", fontFamily: FONT, lineHeight: 1.6 }}
        >
          가입 시 서비스 이용약관 및 개인정보처리방침에 동의합니다.
        </p>
      </div>
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function AuthScreen() {
  const [view, setView] = useState("login"); // "login" | "signup"

  return view === "login"
    ? <LoginView  onGoSignUp={() => setView("signup")} />
    : <SignUpView onGoLogin={()  => setView("login")}  />;
}
