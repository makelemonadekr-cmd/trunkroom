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

import { useState, useRef } from "react";
import { signIn, signUp, resetPassword, updatePassword, signInWithApple } from "../../services/authService";

const FONT   = "'Spoqa Han Sans Neo', sans-serif";
const DARK   = "#1a1a1a";
const YELLOW = "#F5C200";

// ─── Shared input component ───────────────────────────────────────────────────

function AuthInput({ type = "text", placeholder, value, onChange, autoComplete, onEnter, inputRef }) {
  return (
    <input
      ref={inputRef}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter") onEnter?.(); }}
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

// ─── Password input with visibility toggle ────────────────────────────────────

function PasswordInput({ placeholder, value, onChange, autoComplete, onEnter, inputRef }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onEnter?.(); }}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full px-4 py-3.5 pr-11 rounded-xl text-[14px] outline-none"
        style={{
          backgroundColor: "#F5F5F5",
          color:           DARK,
          fontFamily:      FONT,
          border:          "1.5px solid transparent",
        }}
        onFocus={(e)  => (e.target.style.border = `1.5px solid ${YELLOW}`)}
        onBlur={(e)   => (e.target.style.border = "1.5px solid transparent")}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8"
        style={{ color: "#BBBBBB" }}
        tabIndex={-1}
      >
        {show ? (
          // Eye-off icon (password visible → tap to hide)
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 2L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M7.2 7.3A2.3 2.3 0 0010.7 10.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M3.7 3.8A9 9 0 001 9c1.6 3.8 4.8 6.5 8 6.5a8.5 8.5 0 004.8-1.6M7.4 4.6A9 9 0 0117 9c-.7 1.7-1.9 3.2-3.3 4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ) : (
          // Eye icon (password hidden → tap to show)
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M1 9C2.6 5.2 5.7 2.5 9 2.5S15.4 5.2 17 9c-1.6 3.8-4.7 6.5-8 6.5S2.6 12.8 1 9Z" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="9" cy="9" r="2.3" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        )}
      </button>
    </div>
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

function LoginView({ onGoSignUp, onGoForgot, onClose }) {
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const pwRef = useRef(null);

  async function handleAppleLogin() {
    setError("");
    setAppleLoading(true);
    const { error: err } = await signInWithApple();
    setAppleLoading(false);
    if (err) setError("Apple 로그인에 실패했어요. 다시 시도해주세요.");
  }

  async function handleLogin() {
    if (!email.trim() || !password)  { setError("이메일과 비밀번호를 입력해주세요."); return; }
    setError("");
    setLoading(true);
    const { error: err } = await signIn(email.trim(), password);
    setLoading(false);
    if (err) {
      const msg = err.message ?? "";
      if (msg.includes("Invalid login") || msg.includes("invalid_credentials"))
        setError("이메일 또는 비밀번호가 올바르지 않아요.");
      else if (msg.includes("Email not confirmed"))
        setError("이메일 인증 후 로그인할 수 있어요. 받은편지함을 확인해주세요.");
      else if (msg.includes("Too many requests"))
        setError("잠시 후 다시 시도해주세요.");
      else
        setError("로그인에 실패했어요. 다시 시도해주세요.");
    }
    // On success, useAuth in App.jsx picks up the session via onAuthChange
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-white overflow-hidden">
      {/* Close button (only shown when used as overlay) */}
      {onClose && (
        <div className="flex justify-end px-5 pt-4">
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full active:opacity-60"
            style={{ backgroundColor: "#F2F2F2" }}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M1 1L10 10M10 1L1 10" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
      {/* Logo area */}
      <div className={`flex flex-col items-center ${onClose ? "pt-6" : "pt-16"} pb-8 px-8`}>
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
          내 손안의 AI 옷장
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
          onEnter={() => pwRef.current?.focus()}
        />
        <PasswordInput
          placeholder="비밀번호"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          onEnter={handleLogin}
          inputRef={pwRef}
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

        {/* Apple login button */}
        <button
          onClick={handleAppleLogin}
          disabled={appleLoading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl font-bold active:opacity-80"
          style={{
            height:          56,
            backgroundColor: appleLoading ? "#555" : "#1a1a1a",
            color:           "#ffffff",
            fontFamily:      FONT,
            fontSize:        15,
          }}
        >
          {appleLoading ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
              <path d="M9 1.5a7.5 7.5 0 1 1-5.3 2.2" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <>
              <svg width="17" height="20" viewBox="0 0 17 20" fill="white">
                <path d="M13.57 10.6c-.02-2.46 2.01-3.65 2.1-3.71-1.15-1.68-2.93-1.9-3.56-1.93-1.52-.15-2.97.9-3.74.9-.78 0-1.98-.88-3.25-.85-1.67.02-3.21.97-4.07 2.46-1.74 3.02-.45 7.49 1.25 9.93.83 1.2 1.81 2.55 3.1 2.5 1.25-.05 1.72-.8 3.23-.8 1.5 0 1.93.8 3.24.78 1.34-.02 2.19-1.22 3.01-2.42.95-1.38 1.34-2.73 1.36-2.8-.03-.01-2.64-1.01-2.67-4.06zm-2.5-7.47c.69-.83 1.15-1.99.02-3.13-1.1.04-2.43.74-3.14 1.56C7.28 2.37 6.74 3.56 7.68 4.56c1.02-.03 2.08-.7 3.4-1.43z"/>
              </svg>
              Apple로 로그인
            </>
          )}
        </button>

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

        {/* Forgot password */}
        <button
          onClick={onGoForgot}
          className="w-full flex items-center justify-center active:opacity-60 mt-1"
          style={{ height: 36 }}
        >
          <span
            className="text-[12px]"
            style={{ color: "#AAAAAA", fontFamily: FONT, textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            비밀번호를 잊으셨나요?
          </span>
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

  const emailRef = useRef(null);
  const pw1Ref   = useRef(null);
  const pw2Ref   = useRef(null);

  async function handleSignUp() {
    if (!nickname.trim())           { setError("닉네임을 입력해주세요."); return; }
    if (!email.trim())              { setError("이메일을 입력해주세요."); return; }
    if (password.length < 6)        { setError("비밀번호는 6자리 이상이어야 해요."); return; }
    if (password !== password2)     { setError("비밀번호가 일치하지 않아요."); return; }

    setError("");
    setLoading(true);
    const { data, error: err } = await signUp(email.trim(), password, nickname.trim());
    setLoading(false);

    if (err) {
      const msg = err.message ?? "";
      if (msg.includes("already registered") || msg.includes("User already registered"))
        setError("이미 가입된 이메일이에요. 로그인해주세요.");
      else if (msg.includes("Password should be"))
        setError("비밀번호는 6자리 이상이어야 해요.");
      else
        setError("가입에 실패했어요. 다시 시도해주세요.");
    } else if (data?.session) {
      // ── Email confirmation DISABLED (MVP mode) ────────────────────────────
      // Supabase already created a session. App.jsx's onAuthChange listener
      // will pick up the SIGNED_IN event and unmount this screen automatically.
      // Nothing to do here — just let the transition happen.
    } else {
      // ── Email confirmation ENABLED ─────────────────────────────────────────
      // No session yet. Show the "check your inbox" screen.
      setDone(true);
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
            onEnter={() => emailRef.current?.focus()}
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
            onEnter={() => pw1Ref.current?.focus()}
            inputRef={emailRef}
          />
        </div>

        <div>
          <p className="text-[11px] font-bold mb-1.5" style={{ color: "#AAAAAA", fontFamily: FONT, letterSpacing: "0.04em" }}>비밀번호</p>
          <PasswordInput
            placeholder="6자리 이상"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            onEnter={() => pw2Ref.current?.focus()}
            inputRef={pw1Ref}
          />
        </div>

        <div>
          <p className="text-[11px] font-bold mb-1.5" style={{ color: "#AAAAAA", fontFamily: FONT, letterSpacing: "0.04em" }}>비밀번호 확인</p>
          <PasswordInput
            placeholder="비밀번호 재입력"
            value={password2}
            onChange={setPassword2}
            autoComplete="new-password"
            onEnter={handleSignUp}
            inputRef={pw2Ref}
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

// ─── Forgot-password view ─────────────────────────────────────────────────────

function ForgotPasswordView({ onGoLogin }) {
  const [email,   setEmail]   = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  async function handleReset() {
    if (!email.trim()) { setError("이메일을 입력해주세요."); return; }
    setError("");
    setLoading(true);
    const { error: err } = await resetPassword(email.trim());
    setLoading(false);
    if (err) {
      setError("이메일 전송에 실패했어요. 다시 시도해주세요.");
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white px-8">
        <span style={{ fontSize: 52 }} className="mb-5">📬</span>
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
          비밀번호 재설정 링크를 보냈어요.{"\n"}
          링크를 클릭하면 새 비밀번호를 설정할 수 있어요.
        </p>
        <button
          onClick={onGoLogin}
          className="w-full flex items-center justify-center rounded-2xl font-bold active:opacity-80"
          style={{ height: 56, backgroundColor: YELLOW, color: DARK, fontFamily: FONT, fontSize: 15 }}
        >
          로그인 화면으로
        </button>
      </div>
    );
  }

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
          비밀번호 재설정
        </h2>
        <div style={{ width: 36 }} />
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pt-8 flex flex-col gap-4">
        <p
          className="text-[13px] leading-relaxed"
          style={{ color: "#888", fontFamily: FONT }}
        >
          가입한 이메일 주소를 입력하면{"\n"}비밀번호 재설정 링크를 보내드려요.
        </p>
        <AuthInput
          type="email"
          placeholder="이메일"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          onEnter={handleReset}
        />
        <ErrorMsg msg={error} />
        <button
          onClick={handleReset}
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
          ) : "재설정 링크 보내기"}
        </button>
      </div>
    </div>
  );
}

// ─── Reset-password view (shown after clicking the email link) ────────────────

function ResetPasswordView({ onDone }) {
  const [pw1,     setPw1]     = useState("");
  const [pw2,     setPw2]     = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const pw2Ref = useRef(null);

  async function handleSave() {
    if (pw1.length < 6)    { setError("비밀번호는 6자리 이상이어야 해요."); return; }
    if (pw1 !== pw2)       { setError("비밀번호가 일치하지 않아요."); return; }
    setError("");
    setLoading(true);
    const { error: err } = await updatePassword(pw1);
    setLoading(false);
    if (err) {
      setError("비밀번호 변경에 실패했어요. 다시 시도해주세요.");
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white px-8">
        <span style={{ fontSize: 52 }} className="mb-5">🔐</span>
        <h2
          className="text-[20px] font-bold text-center mb-2"
          style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}
        >
          비밀번호가 변경됐어요!
        </h2>
        <p
          className="text-[13px] text-center mb-8"
          style={{ color: "#888", fontFamily: FONT }}
        >
          새 비밀번호로 계속 이용하세요.
        </p>
        <button
          onClick={onDone}
          className="w-full flex items-center justify-center rounded-2xl font-bold active:opacity-80"
          style={{ height: 56, backgroundColor: YELLOW, color: DARK, fontFamily: FONT, fontSize: 15 }}
        >
          계속하기
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-white overflow-hidden">
      {/* Logo area */}
      <div className="flex flex-col items-center pt-14 pb-6 px-8">
        <img src="/officiallogo.png" alt="트렁크룸" style={{ width: 56, height: 56, objectFit: "contain", marginBottom: 12 }} />
        <h1 className="text-[20px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.03em" }}>새 비밀번호 설정</h1>
        <p className="text-[13px] mt-1" style={{ color: "#AAAAAA", fontFamily: FONT }}>새로 사용할 비밀번호를 입력해주세요</p>
      </div>

      <div className="flex-1 px-6 flex flex-col gap-3">
        <PasswordInput
          placeholder="새 비밀번호 (6자리 이상)"
          value={pw1}
          onChange={setPw1}
          autoComplete="new-password"
          onEnter={() => pw2Ref.current?.focus()}
        />
        <PasswordInput
          placeholder="새 비밀번호 확인"
          value={pw2}
          onChange={setPw2}
          autoComplete="new-password"
          onEnter={handleSave}
          inputRef={pw2Ref}
        />
        <ErrorMsg msg={error} />
        <button
          onClick={handleSave}
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
          ) : "비밀번호 변경하기"}
        </button>
      </div>
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

/**
 * @param {object}   props
 * @param {()=>void} [props.onClose]             — X 버튼 표시 (오버레이로 쓸 때)
 * @param {boolean}  [props.isPasswordRecovery]  — true 면 비밀번호 재설정 화면으로 직행
 * @param {()=>void} [props.onPasswordResetDone] — 재설정 완료 후 호출
 */
export default function AuthScreen({ onClose, isPasswordRecovery = false, onPasswordResetDone }) {
  const [view, setView] = useState("login"); // "login" | "signup" | "forgot"

  // 비밀번호 재설정 링크 클릭 후 진입 → 바로 reset 화면
  if (isPasswordRecovery) {
    return <ResetPasswordView onDone={onPasswordResetDone ?? (() => {})} />;
  }

  if (view === "signup") {
    return <SignUpView onGoLogin={() => setView("login")} />;
  }

  if (view === "forgot") {
    return <ForgotPasswordView onGoLogin={() => setView("login")} />;
  }

  return (
    <LoginView
      onGoSignUp={() => setView("signup")}
      onGoForgot={() => setView("forgot")}
      onClose={onClose}
    />
  );
}
