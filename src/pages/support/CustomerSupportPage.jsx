import { useState } from "react";
import {
  CUSTOMER_SERVICE_PHONE, SUPPORT_HOURS, SUPPORT_EMAIL, openMailTo, openTel,
} from "../../constants/appConfig";

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

const INQUIRY_TYPES = ["광고/마케팅", "제품 납품", "기타"];

function SectionLabel({ children }) {
  return (
    <p className="px-5 pt-5 pb-1.5 text-[11px] font-bold tracking-[0.1em] uppercase" style={{ color: "#AAAAAA", fontFamily: FONT }}>
      {children}
    </p>
  );
}

function RowGroup({ children }) {
  return (
    <div className="mx-4 rounded-2xl overflow-hidden" style={{ border: `1px solid ${DIVIDER}`, backgroundColor: "white" }}>
      {children}
    </div>
  );
}

function Row({ label, value, subValue, icon, onPress, last = false, rightSlot }) {
  return (
    <button
      onClick={onPress}
      className="w-full flex items-center justify-between px-4 py-3.5 text-left active:opacity-60 transition-opacity"
      style={{ borderBottom: last ? "none" : `1px solid ${DIVIDER}` }}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex items-center justify-center rounded-xl shrink-0" style={{ width: 34, height: 34, backgroundColor: LIGHT }}>
            {icon}
          </div>
        )}
        <div>
          <p className="text-[14px] font-medium" style={{ color: DARK, fontFamily: FONT }}>{label}</p>
          {subValue && <p className="text-[11px] mt-0.5" style={{ color: GRAY, fontFamily: FONT }}>{subValue}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {value && <p className="text-[12px]" style={{ color: GRAY, fontFamily: FONT }}>{value}</p>}
        {rightSlot}
      </div>
    </button>
  );
}

const HandshakeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M2 9L5 6L8 9L5 12L2 9Z" stroke="#555" strokeWidth="1.3" strokeLinejoin="round"/>
    <path d="M10 9L13 6L16 9L13 12L10 9Z" stroke="#555" strokeWidth="1.3" strokeLinejoin="round"/>
    <path d="M8 9L10 9" stroke="#555" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);
const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M5.5 2H12.5C13.33 2 14 2.67 14 3.5V14.5C14 15.33 13.33 16 12.5 16H5.5C4.67 16 4 15.33 4 14.5V3.5C4 2.67 4.67 2 5.5 2Z" stroke="#555" strokeWidth="1.4"/>
    <circle cx="9" cy="13.5" r="0.8" fill="#555" />
  </svg>
);
const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="2" y="4" width="14" height="10" rx="2" stroke="#555" strokeWidth="1.4" />
    <path d="M2 7L9 11L16 7" stroke="#555" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

function savePartnershipSubmission(data) {
  try {
    const raw = localStorage.getItem("trunkroom_partnership");
    const arr = raw ? JSON.parse(raw) : [];
    const next = [...(Array.isArray(arr) ? arr : []), { ...data, submittedAt: Date.now() }];
    localStorage.setItem("trunkroom_partnership", JSON.stringify(next));
  } catch (e) {
    console.warn("partnership save failed", e);
  }
}

export default function CustomerSupportPage({ onBack }) {
  const [partnershipOpen, setPartnershipOpen] = useState(false);
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState(INQUIRY_TYPES[0]);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  function handleSubmit() {
    setError(null);
    if (!company || !name || !phone || !email || !message) {
      setError("모든 항목을 입력해주세요");
      return;
    }
    savePartnershipSubmission({ company, name, phone, email, type, message });
    setSubmitted(true);
  }

  function resetForm() {
    setCompany(""); setName(""); setPhone(""); setEmail(""); setType(INQUIRY_TYPES[0]); setMessage("");
    setSubmitted(false); setError(null);
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col overflow-hidden" style={{ backgroundColor: LIGHT }}>
      <div className="shrink-0 flex items-center justify-between px-4 h-14 bg-white" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center"><BackIcon /></button>
        <h2 className="text-[17px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>고객지원 센터</h2>
        <div style={{ width: 36 }} />
      </div>

      <div className="flex-1 overflow-y-auto pb-8" style={{ scrollbarWidth: "none" }}>
        <SectionLabel>제휴문의</SectionLabel>
        <RowGroup>
          <Row
            label="제휴문의 접수"
            icon={<HandshakeIcon />}
            subValue="광고 · 제품 납품 · 기타"
            onPress={() => setPartnershipOpen((v) => !v)}
            last={!partnershipOpen}
            rightSlot={
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: partnershipOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                <path d="M5 3L9 7L5 11" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
          {partnershipOpen && (
            <div className="px-4 py-4" style={{ borderTop: `1px solid ${DIVIDER}` }}>
              {submitted ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <span style={{ fontSize: 36 }}>✅</span>
                  <p className="text-[14px] font-bold text-center" style={{ color: DARK, fontFamily: FONT }}>
                    문의가 접수되었어요!
                  </p>
                  <p className="text-[12px] text-center" style={{ color: GRAY, fontFamily: FONT }}>
                    빠른 시일 내에 연락드리겠습니다.
                  </p>
                  <button onClick={resetForm} className="mt-2 px-4 py-2 rounded-full text-[12px] font-bold" style={{ backgroundColor: LIGHT, color: DARK, fontFamily: FONT }}>
                    새 문의 작성하기
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="회사명" className="w-full px-4 py-3 rounded-xl text-[14px]" style={inputStyle} />
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" className="w-full px-4 py-3 rounded-xl text-[14px]" style={inputStyle} />
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="연락처" className="w-full px-4 py-3 rounded-xl text-[14px]" style={inputStyle} />
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" className="w-full px-4 py-3 rounded-xl text-[14px]" style={inputStyle} />
                  <div className="flex gap-2 flex-wrap">
                    {INQUIRY_TYPES.map((t) => {
                      const active = type === t;
                      return (
                        <button key={t} onClick={() => setType(t)} className="px-3 py-2 rounded-full text-[12px]" style={{
                          backgroundColor: active ? DARK : "white",
                          color: active ? "white" : "#555",
                          border: `1px solid ${active ? DARK : "#E5E5E5"}`,
                          fontFamily: FONT,
                          fontWeight: active ? 700 : 500,
                        }}>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="문의 내용" className="w-full px-4 py-3 rounded-xl text-[14px] resize-none" style={inputStyle} />
                  {error && <p className="text-[12px]" style={{ color: RED, fontFamily: FONT }}>{error}</p>}
                  <button onClick={handleSubmit} className="w-full py-3 rounded-xl text-[13px] font-bold" style={{ backgroundColor: YELLOW, color: DARK, fontFamily: FONT }}>
                    제출
                  </button>
                </div>
              )}
            </div>
          )}
        </RowGroup>

        <SectionLabel>고객센터 전화</SectionLabel>
        <RowGroup>
          <Row
            label="전화 걸기"
            icon={<PhoneIcon />}
            value={CUSTOMER_SERVICE_PHONE}
            subValue={SUPPORT_HOURS}
            onPress={() => openTel(CUSTOMER_SERVICE_PHONE)}
            last
            rightSlot={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3L9 7L5 11" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          />
        </RowGroup>

        <SectionLabel>이메일 문의</SectionLabel>
        <RowGroup>
          <Row
            label="이메일 보내기"
            icon={<MailIcon />}
            value={SUPPORT_EMAIL}
            onPress={() => openMailTo(SUPPORT_EMAIL, "트렁크룸 문의")}
            last
            rightSlot={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3L9 7L5 11" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          />
        </RowGroup>
      </div>
    </div>
  );
}
