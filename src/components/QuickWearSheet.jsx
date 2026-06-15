/**
 * QuickWearSheet.jsx — "오늘 입은 옷" 빠른 기록 시트
 *
 * 옷장 아이템을 탭으로 다중 선택 → 오늘 wear_log에 저장.
 * 데일리 루프의 착용 등록을 한 화면에서 쉽게.
 */

import { useState } from "react";

const FONT   = "'Spoqa Han Sans Neo', sans-serif";
const DARK   = "#1a1a1a";
const YELLOW = "#F5C200";

export default function QuickWearSheet({ items = [], initialSelected = [], onSave, onClose, saving = false }) {
  const [selected, setSelected] = useState(() => new Set(initialSelected));

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const count = selected.size;

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col justify-end"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={() => !saving && onClose?.()}
    >
      <div
        className="w-full rounded-t-3xl bg-white"
        style={{ maxHeight: "82vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="shrink-0 px-5 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <button onClick={onClose} disabled={saving} className="text-[14px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>
              취소
            </button>
            <p className="text-[15px] font-bold" style={{ color: DARK, fontFamily: FONT }}>오늘 입은 옷</p>
            <div style={{ width: 32 }} />
          </div>
          <p className="text-[12px] mt-1 text-center" style={{ color: "#999", fontFamily: FONT }}>
            오늘 입은 옷을 골라주세요 · 입을수록 회당 단가가 내려가요
          </p>
        </div>

        {/* 옷장 그리드 */}
        <div className="overflow-y-auto px-4 pb-3" style={{ scrollbarWidth: "none" }}>
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[28px]">👕</p>
              <p className="text-[13px] mt-2" style={{ color: "#AAA", fontFamily: FONT }}>옷장이 비어있어요. 먼저 옷을 등록해주세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              {items.map((item) => {
                const on = selected.has(item.id);
                const img = item.image ?? item.image_url;
                return (
                  <button
                    key={item.id}
                    onClick={() => toggle(item.id)}
                    className="relative rounded-2xl overflow-hidden text-left transition-transform active:scale-95"
                    style={{ border: on ? `2.5px solid ${YELLOW}` : "2.5px solid #F0F0F0" }}
                  >
                    <div className="w-full" style={{ aspectRatio: "3/4", backgroundColor: "#FAFAFA" }}>
                      {img ? (
                        <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[26px]">👕</div>
                      )}
                    </div>
                    {/* 선택 체크 */}
                    {on && (
                      <div className="absolute top-1.5 right-1.5 flex items-center justify-center rounded-full" style={{ width: 22, height: 22, backgroundColor: YELLOW }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2.5 6.5L5 9L9.5 3.5" stroke={DARK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                    <div className="px-1.5 py-1.5">
                      <p className="text-[10.5px] font-bold truncate" style={{ color: DARK, fontFamily: FONT }}>
                        {item.displayName ?? item.display_name ?? item.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 저장 */}
        <div className="shrink-0 px-5 pb-6 pt-2">
          <button
            onClick={() => onSave?.([...selected])}
            disabled={saving || count === 0}
            className="w-full rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95"
            style={{
              height: 52,
              backgroundColor: count === 0 ? "#F0F0F0" : YELLOW,
              color: count === 0 ? "#AAA" : DARK,
              fontFamily: FONT,
              boxShadow: count === 0 ? "none" : "0 4px 14px rgba(245,194,0,0.4)",
            }}
          >
            {saving ? (
              <div style={{ width: 18, height: 18, border: "2.5px solid #1a1a1a", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            ) : (
              <span className="text-[15px] font-bold">{count > 0 ? `${count}벌 입었어요 기록하기` : "옷을 골라주세요"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
