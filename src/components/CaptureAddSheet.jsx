/**
 * CaptureAddSheet.jsx — 쇼핑 캡쳐로 아이템 등록 (v3 킬러 기능)
 *
 * 흐름:
 *   1. 주문완료/상품 스크린샷 선택
 *   2. AI가 상품명·브랜드·가격·카테고리 추출 (/api/parse-purchase)
 *   3. 확인·수정 후 저장 → 본전 게임 시작!
 *
 * 등록되는 아이템: source="capture", 이미지는 스크린샷 그대로 (나중에 교체 가능)
 */

import { useState, useRef, useEffect } from "react";
import { fileToBase64, parsePurchaseScreenshot } from "../lib/uploadClothing.js";
import { addClosetItem } from "../services/closetService.js";
import { getSession } from "../services/authService.js";
import { useAuth } from "../hooks/useAuth.js";
import { showToast } from "../lib/toastUtils.js";
import { MAIN_CATEGORIES, SUBCATEGORIES } from "../constants/mockClosetData";
import { getItemPayback } from "../lib/payback.js";
import { TrunkyMascot } from "./PaybackHeroCard.jsx";

const FONT   = "'Spoqa Han Sans Neo', sans-serif";
const DARK   = "#1a1a1a";
const YELLOW = "#F5C200";

export default function CaptureAddSheet({ onClose, onSaved }) {
  const { user } = useAuth();
  const [accessToken, setAccessToken] = useState(null);
  const [step, setStep]   = useState("pick");   // pick | parsing | confirm | saving
  const [preview, setPreview] = useState(null); // data URL
  const [base64, setBase64]   = useState(null);
  const [mime, setMime]       = useState("image/jpeg");
  const [form, setForm]       = useState({ name: "", brand: "", price: "", category: "상의", subCategory: "", color: "", size: "", mall: "" });
  const fileRef = useRef(null);

  useEffect(() => {
    getSession().then(({ session }) => setAccessToken(session?.access_token ?? null));
  }, []);

  // 시트 열리면 바로 사진 선택창
  useEffect(() => {
    const t = setTimeout(() => fileRef.current?.click(), 250);
    return () => clearTimeout(t);
  }, []);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setBase64(b64);
    setMime(file.type || "image/jpeg");
    setPreview(URL.createObjectURL(file));
    setStep("parsing");

    try {
      const result = await parsePurchaseScreenshot(b64, file.type || "image/jpeg", accessToken);
      const d = result?.data;
      if (!result?.success || !d) throw new Error(result?.error ?? "분석 실패");

      if (!d.isPurchaseScreenshot) {
        showToast("쇼핑 캡쳐가 아닌 것 같아요. 일반 사진은 + 버튼으로 등록해주세요", "warning");
      }
      setForm({
        name:        d.productName || "",
        brand:       d.brand || "",
        price:       d.price ? String(d.price) : "",
        category:    d.mainCategory || "상의",
        subCategory: d.subCategory || "",
        color:       d.color || "",
        size:        d.size || "",
        mall:        d.mall || "",
      });
      setStep("confirm");
    } catch (err) {
      showToast(err.isRateLimit ? err.message : "캡쳐 분석에 실패했어요. 직접 입력해주세요", "error");
      setStep("confirm"); // 빈 폼으로라도 진행
    }
  }

  async function handleSave() {
    if (!user?.id) { showToast("로그인 후 이용할 수 있어요", "warning"); return; }
    if (!form.name.trim()) { showToast("상품명을 입력해주세요", "warning"); return; }
    setStep("saving");
    const { item, error } = await addClosetItem(
      user.id,
      {
        name:     form.name.trim(),
        brand:    form.brand.trim(),
        category: form.category,
        subCategory: form.subCategory,
        color:    form.color.trim(),
        size:     form.size.trim(),
        price:    form.price,
        condition: "새 상품",
        desc:     form.mall ? `${form.mall}에서 구매 (캡쳐 등록)` : "캡쳐로 등록",
      },
      base64,
      mime,
    );
    if (error) {
      showToast("저장에 실패했어요", "error");
      setStep("confirm");
      return;
    }
    // 본전 게임 시작 멘트
    const pb = getItemPayback({ price: Number(form.price || 0), mainCategory: form.category }, 0);
    showToast(
      pb.hasPrice ? `옷장에 들어왔어요! 본전까지 ${pb.targetWears}번 입기 🔥` : "옷장에 들어왔어요 ✓",
      "success",
    );
    onSaved?.(item);
    onClose?.();
  }

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col justify-end"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={() => step !== "saving" && step !== "parsing" && onClose?.()}
    >
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      <div
        className="w-full rounded-t-3xl bg-white"
        style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <button onClick={onClose} disabled={step === "saving"} className="text-[14px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>
            닫기
          </button>
          <p className="text-[15px] font-bold" style={{ color: DARK, fontFamily: FONT }}>
            🧾 쇼핑 캡쳐로 등록
          </p>
          <div style={{ width: 32 }} />
        </div>

        {/* ── STEP: pick ── */}
        {step === "pick" && (
          <div className="px-5 pb-10 flex flex-col items-center gap-4 pt-4">
            <TrunkyMascot size={72} mood="excited" />
            <p className="text-[14px] text-center leading-relaxed" style={{ color: "#666", fontFamily: FONT }}>
              주문완료 화면이나 상품 페이지{"\n"}<b>캡쳐만 보여주세요.</b>{"\n"}나머지는 알아서 읽을게요.
            </p>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full h-13 rounded-2xl text-[15px] font-bold transition-transform active:scale-95"
              style={{ backgroundColor: YELLOW, color: DARK, fontFamily: FONT, height: 52, boxShadow: "0 4px 14px rgba(245,194,0,0.4)" }}
            >
              캡쳐 사진 고르기
            </button>
          </div>
        )}

        {/* ── STEP: parsing ── */}
        {step === "parsing" && (
          <div className="px-5 pb-12 flex flex-col items-center gap-4 pt-4">
            <div className="relative">
              {preview && (
                <img src={preview} alt="" className="rounded-2xl" style={{ width: 140, maxHeight: 220, objectFit: "cover", border: "3px solid #FFE584" }} />
              )}
              <div className="absolute -bottom-3 -right-3">
                <TrunkyMascot size={52} mood="excited" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div style={{ width: 16, height: 16, border: "2.5px solid #F5C200", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              <p className="text-[14px] font-bold" style={{ color: DARK, fontFamily: FONT }}>
                캡쳐 스캔 중... 금방이에요 ✨
              </p>
            </div>
          </div>
        )}

        {/* ── STEP: confirm / saving ── */}
        {(step === "confirm" || step === "saving") && (
          <div className="overflow-y-auto px-5 pb-8" style={{ scrollbarWidth: "none" }}>
            <div className="flex gap-3 mb-4">
              {preview && (
                <img src={preview} alt="" className="rounded-xl shrink-0" style={{ width: 72, height: 96, objectFit: "cover", border: "2px solid #FFE584" }} />
              )}
              <div className="flex-1 rounded-xl px-3 py-2.5" style={{ backgroundColor: "#FFF6D6" }}>
                <p className="text-[11px] font-bold" style={{ color: "#C99700", fontFamily: FONT }}>
                  AI가 읽은 내용이에요 — 틀린 곳만 고쳐주세요!
                </p>
                {form.mall && (
                  <p className="text-[11px] mt-1" style={{ color: "#8A7A45", fontFamily: FONT }}>
                    📍 {form.mall}
                  </p>
                )}
                {form.price && Number(form.price) > 0 && (
                  <p className="text-[12px] font-bold mt-1" style={{ color: DARK, fontFamily: FONT }}>
                    본전까지 {getItemPayback({ price: Number(form.price), mainCategory: form.category }, 0).targetWears}번 입기 도전!
                  </p>
                )}
              </div>
            </div>

            {/* 상품명 */}
            <Field label="상품명">
              <input className="w-full h-11 rounded-xl px-4 text-[14px] outline-none" style={inputStyle}
                value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="상품명" />
            </Field>

            <div className="flex gap-3">
              <Field label="브랜드" half>
                <input className="w-full h-11 rounded-xl px-3 text-[13px] outline-none" style={inputStyle}
                  value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} placeholder="브랜드" />
              </Field>
              <Field label="가격 (원)" half>
                <input className="w-full h-11 rounded-xl px-3 text-[13px] outline-none" style={inputStyle} inputMode="numeric"
                  value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value.replace(/[^0-9]/g, "") }))} placeholder="0" />
              </Field>
            </div>

            {/* 카테고리 */}
            <Field label="카테고리">
              <div className="flex gap-2">
                <select className="flex-1 h-11 rounded-xl px-3 text-[13px] outline-none" style={inputStyle}
                  value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, subCategory: "" }))}>
                  {MAIN_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                </select>
                <select className="flex-1 h-11 rounded-xl px-3 text-[13px] outline-none" style={inputStyle}
                  value={form.subCategory} onChange={(e) => setForm((f) => ({ ...f, subCategory: e.target.value }))}>
                  <option value="">소분류</option>
                  {(SUBCATEGORIES[form.category] ?? []).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </Field>

            <div className="flex gap-3">
              <Field label="색상" half>
                <input className="w-full h-11 rounded-xl px-3 text-[13px] outline-none" style={inputStyle}
                  value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} placeholder="블랙" />
              </Field>
              <Field label="사이즈" half>
                <input className="w-full h-11 rounded-xl px-3 text-[13px] outline-none" style={inputStyle}
                  value={form.size} onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))} placeholder="M, FREE" />
              </Field>
            </div>

            <button
              onClick={handleSave}
              disabled={step === "saving"}
              className="w-full rounded-2xl text-[15px] font-bold mt-2 transition-transform active:scale-95 flex items-center justify-center gap-2"
              style={{ backgroundColor: DARK, color: YELLOW, fontFamily: FONT, height: 52, boxShadow: "0 4px 14px rgba(0,0,0,0.2)" }}
            >
              {step === "saving" ? (
                <div style={{ width: 18, height: 18, border: "2.5px solid #F5C200", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              ) : (
                "옷장에 넣고 본전 게임 시작!"
              )}
            </button>

            <button
              onClick={() => fileRef.current?.click()}
              disabled={step === "saving"}
              className="w-full h-10 rounded-xl text-[12px] mt-2"
              style={{ color: "#AAAAAA", fontFamily: FONT }}
            >
              다른 캡쳐 고르기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  backgroundColor: "#F8F8F8",
  color: "#1a1a1a",
  fontFamily: FONT,
  border: "1px solid #F0F0F0",
};

function Field({ label, half = false, children }) {
  return (
    <div className={half ? "flex-1 mb-4" : "mb-4"}>
      <p className="text-[11px] font-bold mb-1.5" style={{ color: "#888", fontFamily: FONT }}>{label}</p>
      {children}
    </div>
  );
}
