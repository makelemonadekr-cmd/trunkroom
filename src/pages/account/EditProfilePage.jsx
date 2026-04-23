import { useRef, useState } from "react";
import { getUser, saveUser } from "../../lib/userStore";

const FONT = "'Spoqa Han Sans Neo', sans-serif";
const DARK = "#1a1a1a";
const YELLOW = "#F5C200";
const LIGHT = "#F5F5F5";
const DIVIDER = "#F0F0F0";
const GRAY = "#888";

const GENDER_OPTIONS = ["선택 안 함", "여성", "남성", "기타"];
const STYLE_KEYWORDS = ["미니멀", "캐주얼", "스트릿", "빈티지", "페미닌", "스포티", "모던시크", "Y2K"];

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M12.5 4L7 10L12.5 16" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const inputStyle = { backgroundColor: LIGHT, fontFamily: FONT, color: DARK, border: "none", outline: "none" };

export default function EditProfilePage({ onBack }) {
  const initial = getUser();
  const [nickname, setNickname] = useState(initial.nickname);
  const [bio, setBio] = useState(initial.bio);
  const [gender, setGender] = useState(initial.gender || "선택 안 함");
  const [birthDate, setBirthDate] = useState(initial.birthDate);
  const [height, setHeight] = useState(initial.height);
  const [styleKeywords, setStyleKeywords] = useState(initial.styleKeywords || []);
  const [profileImage, setProfileImage] = useState(initial.profileImage);
  const [toast, setToast] = useState(null);
  const fileRef = useRef(null);

  function handleImagePick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProfileImage(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function toggleKeyword(k) {
    setStyleKeywords((prev) => prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]);
  }

  function handleSave() {
    saveUser({
      nickname,
      bio,
      gender: gender === "선택 안 함" ? "" : gender,
      birthDate,
      height,
      styleKeywords,
      profileImage,
    });
    setToast("저장되었어요 ✓");
    setTimeout(() => setToast(null), 1500);
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col overflow-hidden" style={{ backgroundColor: LIGHT }}>
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 h-14 bg-white" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center"><BackIcon /></button>
        <h2 className="text-[17px] font-bold" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}>프로필 수정</h2>
        <button onClick={handleSave} className="px-3 py-1.5">
          <span className="text-[14px] font-bold" style={{ color: YELLOW, fontFamily: FONT }}>저장</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-8" style={{ scrollbarWidth: "none" }}>
        {/* Profile image */}
        <div className="flex flex-col items-center py-6 bg-white" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
          <button
            onClick={() => fileRef.current?.click()}
            className="relative rounded-full overflow-hidden"
            style={{ width: 96, height: 96, backgroundColor: "#EBEBEB" }}
          >
            {profileImage ? (
              <img src={profileImage} alt="profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg width="44" height="44" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="8" r="4" stroke="#AAA" strokeWidth="1.6" />
                  <path d="M3 20C3 15.58 6.58 12 11 12C15.42 12 19 15.58 19 20" stroke="#AAA" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: YELLOW, border: "2px solid white" }}>
              <svg width="12" height="12" viewBox="0 0 18 18" fill="none">
                <path d="M12.5 3L15 5.5L7 13.5H4.5V11L12.5 3Z" stroke={DARK} strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
          <p className="text-[12px] mt-3" style={{ color: GRAY, fontFamily: FONT }}>프로필 사진 변경</p>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImagePick} />
        </div>

        {/* Form fields */}
        <div className="px-4 pt-4 flex flex-col gap-4">
          <Field label="닉네임">
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-[14px]"
              style={inputStyle}
              placeholder="닉네임"
            />
          </Field>

          <Field label="자기소개" hint={`${bio.length}/80`}>
            <textarea
              value={bio}
              maxLength={80}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-[14px] resize-none"
              style={inputStyle}
              placeholder="나를 표현하는 한 줄"
            />
          </Field>

          <Field label="성별">
            <div className="flex gap-2 flex-wrap">
              {GENDER_OPTIONS.map((g) => {
                const active = gender === g;
                return (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className="px-3.5 py-2 rounded-full text-[12px]"
                    style={{
                      backgroundColor: active ? DARK : "white",
                      color: active ? "white" : "#555",
                      border: `1px solid ${active ? DARK : "#E5E5E5"}`,
                      fontFamily: FONT,
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="생년월일">
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-[14px]"
              style={inputStyle}
            />
          </Field>

          <Field label="키 (cm)">
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-[14px]"
              style={inputStyle}
              placeholder="예: 165"
            />
          </Field>

          <Field label="스타일 키워드" hint={`${styleKeywords.length}개 선택`}>
            <div className="flex gap-2 flex-wrap">
              {STYLE_KEYWORDS.map((k) => {
                const active = styleKeywords.includes(k);
                return (
                  <button
                    key={k}
                    onClick={() => toggleKeyword(k)}
                    className="px-3.5 py-2 rounded-full text-[12px]"
                    style={{
                      backgroundColor: active ? YELLOW : "white",
                      color: active ? DARK : "#555",
                      border: `1px solid ${active ? YELLOW : "#E5E5E5"}`,
                      fontFamily: FONT,
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    #{k}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
      </div>

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
