import { useState } from "react";
import {
  SUPPORT_EMAIL, KAKAO_CHANNEL_URL, openMailTo, openExternalUrl,
} from "../../constants/appConfig";
import { submitInquiry } from "../../services/supportService.js";
import { useAuth }        from "../../hooks/useAuth.js";

const FONT    = "'Spoqa Han Sans Neo', sans-serif";
const DARK    = "#1a1a1a";
const YELLOW  = "#F5C200";
const LIGHT   = "#F5F5F5";
const DIVIDER = "#F0F0F0";
const GRAY    = "#888";

const CATEGORIES = ["서비스 이용", "결제·환불", "버그 신고", "제휴·협업", "기타"];

// ─── Icons ────────────────────────────────────────────────────────────────────

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

const FormIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="2" y="2" width="14" height="14" rx="2.5" stroke="#555" strokeWidth="1.4" />
    <path d="M5 6.5H13M5 9H10M5 11.5H8" stroke="#555" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

// ─── Shared row components ────────────────────────────────────────────────────

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

// ─── Inquiry Form ─────────────────────────────────────────────────────────────

function InquiryForm({ onClose }) {
  const { user } = useAuth();

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subject,  setSubject]  = useState("");
  const [message,  setMessage]  = useState("");
  const [email,    setEmail]    = useState(user?.email ?? "");
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState("");

  const canSubmit = email.includes("@") && subject.trim().length > 0 && message.trim().length >= 10 && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    const { error: err } = await submitInquiry({
      userId:   user?.id   ?? null,
      email,
      category,
      subject,
      message,
    });

    setLoading(false);
    if (err) {
      setError("전송에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } else {
      setDone(true);
    }
  }

  // ── Success state ────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="absolute inset-0 z-30 flex flex-col bg-white" style={{ fontFamily: FONT }}>
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 h-14 bg-white" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 4L7 10L12.5 16" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h2 className="text-[17px] font-bold" style={{ color: DARK, letterSpacing: "-0.02em" }}>문의 완료</h2>
          <div style={{ width: 36 }} />
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(245,194,0,0.12)" }}>
            <span style={{ fontSize: 32 }}>✅</span>
          </div>
          <div className="text-center">
            <p className="text-[18px] font-bold mb-2" style={{ color: DARK }}>문의가 접수됐어요</p>
            <p className="text-[13px] leading-relaxed" style={{ color: GRAY }}>
              확인 후 빠른 시간 내에<br />답변 드리겠습니다 🙏
            </p>
          </div>
          <button
            onClick={onClose}
            className="mt-4 px-8 py-3 rounded-xl text-[14px] font-bold active:opacity-70"
            style={{ backgroundColor: DARK, color: "white" }}
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  // ── Form state ───────────────────────────────────────────────────────────────
  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-white" style={{ fontFamily: FONT }}>
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 h-14 bg-white" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 4L7 10L12.5 16" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h2 className="text-[17px] font-bold" style={{ color: DARK, letterSpacing: "-0.02em" }}>1:1 문의하기</h2>
        <div style={{ width: 36 }} />
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto pb-28" style={{ scrollbarWidth: "none" }}>
        <div className="px-4 pt-5 flex flex-col gap-5">

          {/* 문의 유형 */}
          <div>
            <p className="text-[12px] font-bold mb-2" style={{ color: "#555" }}>문의 유형</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const isActive = category === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className="px-3.5 py-1.5 rounded-full text-[12px] font-medium active:opacity-70"
                    style={{
                      backgroundColor: isActive ? DARK : "#F2F2F2",
                      color:           isActive ? "white" : "#555",
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 이메일 */}
          <div>
            <p className="text-[12px] font-bold mb-2" style={{ color: "#555" }}>
              답변받을 이메일
              <span className="text-[11px] font-normal ml-1" style={{ color: "#AAAAAA" }}>(필수)</span>
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
              style={{
                border: `1.5px solid ${email && !email.includes("@") ? "#FF4444" : DIVIDER}`,
                backgroundColor: "white",
                color: DARK,
                fontFamily: FONT,
              }}
            />
            {email && !email.includes("@") && (
              <p className="text-[11px] mt-1" style={{ color: "#FF4444" }}>올바른 이메일 주소를 입력해주세요</p>
            )}
          </div>

          {/* 제목 */}
          <div>
            <p className="text-[12px] font-bold mb-2" style={{ color: "#555" }}>
              제목
              <span className="text-[11px] font-normal ml-1" style={{ color: "#AAAAAA" }}>(필수)</span>
            </p>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="문의 제목을 입력해주세요"
              maxLength={80}
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
              style={{
                border: `1.5px solid ${DIVIDER}`,
                backgroundColor: "white",
                color: DARK,
                fontFamily: FONT,
              }}
            />
          </div>

          {/* 내용 */}
          <div>
            <p className="text-[12px] font-bold mb-2" style={{ color: "#555" }}>
              문의 내용
              <span className="text-[11px] font-normal ml-1" style={{ color: "#AAAAAA" }}>(10자 이상)</span>
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="문의 내용을 자세히 적어주세요.&#10;(예: 발생한 상황, 기기, 앱 버전 등)"
              rows={6}
              maxLength={2000}
              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none resize-none"
              style={{
                border: `1.5px solid ${DIVIDER}`,
                backgroundColor: "white",
                color: DARK,
                fontFamily: FONT,
                lineHeight: 1.6,
              }}
            />
            <p className="text-right text-[11px] mt-1" style={{ color: "#CCCCCC" }}>
              {message.length} / 2000
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(255,68,68,0.08)" }}>
              <p className="text-[12px]" style={{ color: "#FF4444" }}>{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom submit button */}
      <div
        className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-3"
        style={{ background: "linear-gradient(to bottom, transparent 0%, white 40%)", borderTop: "none" }}
      >
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-4 rounded-2xl text-[15px] font-bold active:opacity-80 transition-opacity"
          style={{
            backgroundColor: canSubmit ? DARK : "#DDDDDD",
            color: canSubmit ? "white" : "#AAAAAA",
            fontFamily: FONT,
          }}
        >
          {loading ? "전송 중…" : "문의 전송"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CustomerSupportPage({ onBack }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="absolute inset-0 z-20 flex flex-col overflow-hidden" style={{ backgroundColor: LIGHT }}>

      {/* 인앱 문의 폼 오버레이 */}
      {showForm && <InquiryForm onClose={() => setShowForm(false)} />}

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

        {/* 고객센터 */}
        <div className="px-5 pb-1.5 pt-5">
          <p className="text-[11px] font-bold tracking-[0.1em] uppercase" style={{ color: "#AAAAAA", fontFamily: FONT }}>고객센터</p>
        </div>
        <RowGroup>
          <Row
            label="1:1 문의하기"
            icon={<FormIcon />}
            subValue="앱 내에서 바로 문의 접수"
            onPress={() => setShowForm(true)}
          />
          <Row
            label="카카오톡 채널 문의"
            icon={<KakaoIcon />}
            subValue="트렁크룸 카카오 채널로 연결"
            onPress={() => openExternalUrl(KAKAO_CHANNEL_URL)}
            last
          />
        </RowGroup>

        {/* 이메일 · 제휴문의 */}
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

        {/* 안내 */}
        <p className="text-[11px] text-center mt-6" style={{ color: "#CCCCCC", fontFamily: FONT }}>
          문의 접수 후 영업일 기준 1–2일 내 답변 드립니다
        </p>
      </div>
    </div>
  );
}
