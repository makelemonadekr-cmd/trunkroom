import { useState } from "react";
import { submitReport } from "../services/moderationService";
import { useAuth } from "../hooks/useAuth";
import { showToast } from "../lib/toastUtils";

const FONT = "'Spoqa Han Sans Neo', sans-serif";
const DARK = "#1a1a1a";
const LIGHT = "#F5F5F5";
const DIVIDER = "#F0F0F0";

const REASONS = [
  { id: "spam",                  label: "스팸/광고" },
  { id: "harassment",            label: "괴롭힘/혐오 발언" },
  { id: "sexual_content",        label: "성적인 콘텐츠" },
  { id: "hate_speech",           label: "차별/혐오 표현" },
  { id: "violence",              label: "폭력적인 콘텐츠" },
  { id: "misinformation",        label: "허위 정보" },
  { id: "intellectual_property", label: "저작권/지식재산권 침해" },
  { id: "other",                 label: "기타" },
];

/**
 * @param {Object} p
 * @param {boolean} p.open
 * @param {() => void} p.onClose
 * @param {"style"|"item"|"profile"|"comment"} p.targetType
 * @param {string} p.targetId
 */
export default function ReportSheet({ open, onClose, targetType, targetId }) {
  const { user } = useAuth();
  const [category, setCategory] = useState("other");
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function handleSubmit() {
    if (!user?.id) {
      showToast("로그인이 필요해요", "error");
      return;
    }
    if (!detail.trim()) {
      showToast("신고 사유를 입력해주세요", "error");
      return;
    }
    setSubmitting(true);
    const { error } = await submitReport({
      reporterId: user.id,
      targetType,
      targetId,
      reason: detail.trim(),
      reasonCategory: category,
    });
    setSubmitting(false);
    if (error) {
      showToast("신고 접수 실패: " + (error.message ?? ""), "error");
      return;
    }
    showToast("신고가 접수되었습니다. 24시간 이내 검토할게요", "success");
    setDetail("");
    setCategory("other");
    onClose?.();
  }

  return (
    <div
      className="absolute inset-0 z-50 flex items-end"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="w-full bg-white rounded-t-2xl flex flex-col"
        style={{ maxHeight: "85%", fontFamily: FONT }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "#E0E0E0" }} />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-3" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
          <h2 className="text-[16px] font-bold" style={{ color: DARK }}>신고하기</h2>
          <p className="text-[11px] mt-1" style={{ color: "#888" }}>
            트렁크룸 커뮤니티 가이드를 위반하는 콘텐츠를 알려주세요. 24시간 이내 검토합니다.
          </p>
        </div>

        {/* Categories */}
        <div className="px-5 pt-4 pb-2 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          <p className="text-[12px] font-bold mb-2" style={{ color: DARK }}>신고 사유</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {REASONS.map((r) => {
              const active = category === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setCategory(r.id)}
                  className="text-[12px] px-3 py-2.5 rounded-xl text-left transition-colors"
                  style={{
                    backgroundColor: active ? DARK : LIGHT,
                    color: active ? "white" : "#444",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          <p className="text-[12px] font-bold mb-2" style={{ color: DARK }}>상세 내용</p>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value.slice(0, 500))}
            placeholder="신고 사유를 자세히 적어주세요"
            className="w-full p-3 rounded-xl text-[13px] resize-none"
            style={{
              backgroundColor: LIGHT,
              color: DARK,
              fontFamily: FONT,
              minHeight: 100,
              border: `1px solid ${DIVIDER}`,
            }}
          />
          <p className="text-[10px] mt-1 text-right" style={{ color: "#AAA" }}>
            {detail.length}/500
          </p>
        </div>

        {/* Footer buttons */}
        <div
          className="shrink-0 flex gap-2 px-5 py-3"
          style={{ borderTop: `1px solid ${DIVIDER}`, paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-[13px] font-medium"
            style={{ backgroundColor: LIGHT, color: "#666" }}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !detail.trim()}
            className="flex-1 py-3 rounded-xl text-[13px] font-bold disabled:opacity-40"
            style={{ backgroundColor: "#E84040", color: "white" }}
          >
            {submitting ? "접수 중…" : "신고하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
