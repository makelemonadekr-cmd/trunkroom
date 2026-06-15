/**
 * SleepingMoneyScreen.jsx — "잠자는 돈을 진짜 돈으로"
 *
 * 안 입는(가격 있는·미착용) 옷 목록 → 예상 중고가 → 판매글 생성 → 당근·번개 내보내기.
 * "각자의 돈" A안: 외부 판매로 현금화. 돈은 유저가 직접 받음.
 */

import { useMemo, useState } from "react";
import {
  getSleepingItems, generateListing, formatKRW, formatKRWFull,
} from "../lib/payback.js";
import { updateClosetItem } from "../services/closetService.js";
import { showToast } from "../lib/toastUtils.js";

const FONT   = "'Spoqa Han Sans Neo', sans-serif";
const DARK   = "#1a1a1a";
const YELLOW = "#F5C200";

// ─── 판매 시트 (한 아이템 판매글 + 내보내기) ─────────────────────────────────
function SellSheet({ item, onClose, onListed }) {
  const initial = useMemo(() => generateListing(item), [item]);
  const [title, setTitle] = useState(initial.title);
  const [price, setPrice] = useState(String(initial.price));
  const [body,  setBody]  = useState(initial.body);
  const [listing, setListing] = useState(false);

  const fullText = `${title}\n${Number(price).toLocaleString()}원\n\n${body}`;

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title, text: fullText });
        showToast("내보냈어요! 당근·번개에 붙여넣기 하면 끝 ✓", "success");
      } else {
        await navigator.clipboard.writeText(fullText);
        showToast("판매글 복사됐어요! 당근·번개에 붙여넣기 하세요 📋", "success");
      }
    } catch (e) {
      // 사용자가 공유 취소 — 무시
    }
  }

  async function handleMarkListed() {
    setListing(true);
    const { error } = await updateClosetItem(item.id, { is_for_sale: true, sell_status: "listed" });
    setListing(false);
    if (error) { showToast("표시에 실패했어요", "error"); return; }
    showToast(`판매중으로 표시했어요 · 회수 대기 ${formatKRW(Number(price))} 💰`, "success");
    onListed?.(item.id);
  }

  return (
    <div className="absolute inset-0 z-[60] flex flex-col justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => !listing && onClose?.()}>
      <div className="w-full rounded-t-3xl bg-white" style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <button onClick={onClose} className="text-[14px]" style={{ color: "#AAA", fontFamily: FONT }}>닫기</button>
          <p className="text-[15px] font-bold" style={{ color: DARK, fontFamily: FONT }}>판매글 만들기</p>
          <div style={{ width: 28 }} />
        </div>

        <div className="overflow-y-auto px-5 pb-4" style={{ scrollbarWidth: "none" }}>
          <div className="rounded-xl px-3.5 py-2.5 mb-4" style={{ backgroundColor: "#FFF9E3" }}>
            <p className="text-[11.5px] font-bold" style={{ color: "#C99700", fontFamily: FONT }}>
              AI가 판매글을 미리 써뒀어요 — 고치고 싶은 곳만 다듬으세요!
            </p>
          </div>

          <Field label="제목">
            <input className="w-full h-11 rounded-xl px-4 text-[14px] outline-none" style={inp} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="가격 (원)">
            <input className="w-full h-11 rounded-xl px-4 text-[14px] outline-none" style={inp} inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))} />
          </Field>
          <Field label="설명">
            <textarea rows={6} className="w-full rounded-xl px-4 py-3 text-[13px] outline-none resize-none" style={{ ...inp, lineHeight: "1.6" }} value={body} onChange={(e) => setBody(e.target.value)} />
          </Field>
        </div>

        <div className="shrink-0 px-5 pb-6 pt-2 flex flex-col gap-2.5">
          <button onClick={handleShare} className="w-full rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95"
            style={{ height: 52, backgroundColor: YELLOW, color: DARK, fontFamily: FONT, boxShadow: "0 4px 14px rgba(245,194,0,0.4)" }}>
            <span style={{ fontSize: 17 }}>📤</span>
            <span className="text-[15px] font-bold">당근·번개로 내보내기</span>
          </button>
          <button onClick={handleMarkListed} disabled={listing} className="w-full rounded-2xl text-[14px] font-bold transition-transform active:scale-95"
            style={{ height: 48, backgroundColor: "#F2F2F2", color: "#555", fontFamily: FONT }}>
            {listing ? "처리 중..." : "판매중으로 표시 (잠자는 돈에서 빼기)"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inp = { backgroundColor: "#F8F8F8", border: "1.5px solid #F0F0F0", color: DARK, fontFamily: FONT };
function Field({ label, children }) {
  return (
    <div className="mb-4">
      <p className="text-[11px] font-bold mb-1.5" style={{ color: "#888", fontFamily: FONT }}>{label}</p>
      {children}
    </div>
  );
}

// ─── 메인 화면 ───────────────────────────────────────────────────────────────
export default function SleepingMoneyScreen({ closetItems = [], wearFreqMap = new Map(), onClose, onChanged }) {
  const [listedIds, setListedIds] = useState(() => new Set());
  const [sellItem, setSellItem]   = useState(null);

  const sleeping = useMemo(
    () => getSleepingItems(closetItems, wearFreqMap).filter((s) => !listedIds.has(s.item.id)),
    [closetItems, wearFreqMap, listedIds]
  );

  const lockedTotal = sleeping.reduce((s, x) => s + x.price, 0);
  const resaleTotal = sleeping.reduce((s, x) => s + x.resale, 0);

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white">
      {/* 헤더 */}
      <div className="shrink-0 flex items-center gap-3 px-4" style={{ height: 52, borderBottom: "1px solid #F0F0F0" }}>
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ backgroundColor: "#F4F4F4" }} aria-label="닫기">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9L11 14" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <p className="text-[16px] font-bold" style={{ color: DARK, fontFamily: FONT }}>잠자는 돈</p>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {/* 머니 히어로 */}
        <div className="px-5 pt-5 pb-4">
          <div className="rounded-3xl px-5 py-5" style={{ background: "linear-gradient(135deg, #FFF1C2, #FFE08A)", border: "2px solid #FFE584" }}>
            <p className="text-[12px] font-bold" style={{ color: "#8A6A1A", fontFamily: FONT }}>옷장에 잠자는 돈</p>
            <p className="text-[30px] font-extrabold leading-tight mt-1" style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.03em" }}>
              {formatKRWFull(lockedTotal)}
            </p>
            {sleeping.length > 0 && (
              <p className="text-[12.5px] font-bold mt-1.5" style={{ color: "#B8860B", fontFamily: FONT }}>
                안 입는 옷 {sleeping.length}벌 · 팔면 약 <span style={{ color: "#1a7a4a" }}>{formatKRW(resaleTotal)}</span> 돼요 💸
              </p>
            )}
          </div>
        </div>

        {/* 잠자는 옷 목록 */}
        {sleeping.length === 0 ? (
          <div className="py-16 text-center px-8">
            <p className="text-[34px]">🎉</p>
            <p className="text-[15px] font-bold mt-2" style={{ color: DARK, fontFamily: FONT }}>잠자는 돈이 없어요!</p>
            <p className="text-[12.5px] mt-1 leading-relaxed" style={{ color: "#AAA", fontFamily: FONT }}>
              가진 옷을 알차게 입고 있다는 뜻이에요.{"\n"}새 옷에 가격을 적으면 여기서 관리할 수 있어요.
            </p>
          </div>
        ) : (
          <div className="px-4 pb-8 flex flex-col gap-2.5">
            {sleeping.map(({ item, price, resale }) => {
              const img = item.image ?? item.image_url;
              return (
                <div key={item.id} className="flex items-center gap-3 rounded-2xl px-3 py-3" style={{ border: "1.5px solid #F0F0F0" }}>
                  <div className="shrink-0 rounded-xl overflow-hidden" style={{ width: 56, height: 70, backgroundColor: "#FAFAFA" }}>
                    {img ? <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-[22px]">👕</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold truncate" style={{ color: DARK, fontFamily: FONT }}>
                      {item.displayName ?? item.display_name ?? item.name}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "#AAA", fontFamily: FONT }}>
                      {formatKRWFull(price)}에 샀는데 · 한 번도 안 입음 💤
                    </p>
                    <p className="text-[12px] font-bold mt-1" style={{ color: "#1a7a4a", fontFamily: FONT }}>
                      팔면 약 {formatKRWFull(resale)}
                    </p>
                  </div>
                  <button onClick={() => setSellItem(item)} className="shrink-0 px-4 rounded-xl text-[13px] font-bold transition-transform active:scale-95"
                    style={{ height: 38, backgroundColor: DARK, color: YELLOW, fontFamily: FONT }}>
                    팔기
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {sellItem && (
        <SellSheet
          item={sellItem}
          onClose={() => setSellItem(null)}
          onListed={(id) => {
            setListedIds((prev) => new Set(prev).add(id));
            setSellItem(null);
            onChanged?.();
          }}
        />
      )}
    </div>
  );
}
