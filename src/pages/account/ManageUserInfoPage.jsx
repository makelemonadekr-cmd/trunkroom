/**
 * ManageUserInfoPage.jsx
 *
 * 내 정보 관리 화면 (이름, 전화, 주소, 알림 동의).
 * Supabase profiles 테이블에 저장합니다.
 */

import { useState, useEffect } from "react";
import { useAuth }    from "../../hooks/useAuth.js";
import { useProfile } from "../../hooks/useProfile.js";

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

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="rounded-full transition-colors"
      style={{ width: 44, height: 26, backgroundColor: value ? YELLOW : "#DDD", position: "relative" }}
    >
      <div style={{ position: "absolute", top: 3, left: value ? 21 : 3, width: 20, height: 20, backgroundColor: "white", borderRadius: "50%", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </button>
  );
}

function isValidKoreanPhone(s) {
  return /^010-\d{4}-\d{4}$/.test(s);
}

export default function ManageUserInfoPage({ onBack }) {
  const { user }                            = useAuth();
  const { profile, loading, updateProfile } = useProfile(user?.id);

  const [phone,             setPhone]             = useState("");
  const [address,           setAddress]           = useState("");
  const [marketingConsent,  setMarketingConsent]  = useState(false);
  const [pushConsent,       setPushConsent]        = useState(true);

  const [saving, setSaving] = useState(false);
  const [toast,  setToast]  = useState(null);
  const [error,  setError]  = useState(null);

  // ── Supabase에서 불러온 프로필로 폼 초기화 ──────────────────────────────────
  useEffect(() => {
    if (!profile) return;
    setPhone(profile.phone               || "");
    setAddress(profile.address           || "");
    setMarketingConsent(!!profile.marketing_consent);
    setPushConsent(profile.push_consent  ?? true);
  }, [profile]);

  async function handleSave() {
    setError(null);
    if (phone && !isValidKoreanPhone(phone)) {
      setError("휴대폰은 010-0000-0000 형식으로 입력해주세요");
      return;
    }

    setSaving(true);
    const { error: err } = await updateProfile({
      phone:              phone    || null,
      address:            address  || null,
      marketing_consent:  marketingConsent,
      push_consent:       pushConsent,
    });
    setSaving(false);

    if (err) {
      setError("저장에 실패했어요. 다시 시도해주세요.");
    } else {
      setToast("저장되었어요 ✓");
      setTimeout(() => setToast(null), 1500);
    }
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col overflow-hidden" style={{ backgroundColor: LIGHT }}>
      <div className="shrink-0 flex items-center justify-between px-4 h-14 bg-white" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center"><BackIcon /></button>
        <h2 className="text-[17px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>내 정보 관리</h2>
        <div style={{ width: 36 }} />
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="rounded-full" style={{ width: 28, height: 28, border: `3px solid ${YELLOW}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-28" style={{ scrollbarWidth: "none" }}>
          <div className="px-4 pt-5 flex flex-col gap-4">

            {/* 이메일 — 읽기 전용 (LoginInfoPage에서 변경) */}
            <Field label="이메일">
              <div className="w-full px-4 py-3 rounded-xl text-[14px]" style={{ ...inputStyle, opacity: 0.6 }}>
                <p style={{ fontFamily: FONT, fontSize: 14, color: DARK }}>{user?.email ?? "—"}</p>
              </div>
              <p className="text-[11px] mt-1 px-1" style={{ color: GRAY, fontFamily: FONT }}>
                이메일 변경은 로그인 정보 페이지에서 가능해요
              </p>
            </Field>

            <Field label="휴대폰" hint="010-0000-0000">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-[14px]"
                style={inputStyle}
                placeholder="010-0000-0000"
              />
            </Field>

            <Field label="주소">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-[14px]"
                style={inputStyle}
                placeholder="주소 입력"
              />
            </Field>

            {/* 알림 동의 */}
            <div className="rounded-2xl bg-white px-4" style={{ border: `1px solid ${DIVIDER}` }}>
              <div className="flex items-center justify-between py-3.5" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
                <div>
                  <p className="text-[14px] font-medium" style={{ color: DARK, fontFamily: FONT }}>마케팅 수신 동의</p>
                  <p className="text-[11px] mt-0.5" style={{ color: GRAY, fontFamily: FONT }}>이벤트·할인 알림을 받아요</p>
                </div>
                <Toggle value={marketingConsent} onChange={setMarketingConsent} />
              </div>
              <div className="flex items-center justify-between py-3.5">
                <div>
                  <p className="text-[14px] font-medium" style={{ color: DARK, fontFamily: FONT }}>푸시 알림</p>
                  <p className="text-[11px] mt-0.5" style={{ color: GRAY, fontFamily: FONT }}>앱 알림을 받아요</p>
                </div>
                <Toggle value={pushConsent} onChange={setPushConsent} />
              </div>
            </div>

            {error && (
              <p className="text-[12px]" style={{ color: RED, fontFamily: FONT }}>{error}</p>
            )}
          </div>
        </div>
      )}

      <div className="shrink-0 px-4 py-3 bg-white" style={{ borderTop: `1px solid ${DIVIDER}`, position: "absolute", bottom: 0, left: 0, right: 0 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-2xl"
          style={{ height: 52, backgroundColor: saving ? "#DDD" : YELLOW, color: DARK, fontFamily: FONT, fontSize: 15, fontWeight: 700 }}
        >
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>

      {toast && (
        <div className="absolute bottom-24 left-0 right-0 flex justify-center z-50 pointer-events-none">
          <div className="px-4 py-2.5 rounded-full" style={{ backgroundColor: DARK }}>
            <p className="text-white text-[13px] font-medium" style={{ fontFamily: FONT }}>{toast}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 px-1">
        <p className="text-[12px] font-bold" style={{ color: "#555", fontFamily: FONT }}>{label}</p>
        {hint && <p className="text-[11px]" style={{ color: GRAY, fontFamily: FONT }}>{hint}</p>}
      </div>
      {children}
    </div>
  );
}
