import { useState, useRef } from "react";

const DARK   = "#1a1a1a";
const YELLOW = "#F5C200";

const CATEGORIES = [
  { id: "TOP",    label: "TOP",    emoji: "👕" },
  { id: "BOTTOM", label: "BOTTOM", emoji: "👖" },
  { id: "OUTER",  label: "OUTER",  emoji: "🧥" },
  { id: "OPS",    label: "OPS",    emoji: "👗" },
  { id: "BAG",    label: "BAG",    emoji: "👜" },
  { id: "SHOES",  label: "SHOES",  emoji: "👟" },
  { id: "ACC",    label: "ACC",    emoji: "💍" },
];

const CONDITIONS = ["S급", "A급", "B급", "C급"];

// ─── Photo slot ───────────────────────────────────────────────────────────────

function PhotoSlot({ image, isMain, onAdd, onRemove, index }) {
  if (image) {
    return (
      <div
        className="relative rounded-xl overflow-hidden"
        style={{ aspectRatio: "1", backgroundColor: "#F0F0F0" }}
      >
        <img
          src={image}
          alt={`photo-${index}`}
          className="w-full h-full"
          style={{ objectFit: "cover", objectPosition: "center top" }}
        />
        {isMain && (
          <div
            className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md"
            style={{ backgroundColor: DARK }}
          >
            <span
              className="text-[9px] font-bold text-white"
              style={{ fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
            >
              대표
            </span>
          </div>
        )}
        <button
          onClick={() => onRemove(index)}
          className="absolute top-1.5 right-1.5 flex items-center justify-center rounded-full w-5 h-5"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 2L8 8M8 2L2 8" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    );
  }

  if (index === 0) {
    // Main add button
    return (
      <button
        onClick={onAdd}
        className="relative rounded-xl flex flex-col items-center justify-center gap-1"
        style={{
          aspectRatio: "1",
          backgroundColor: "#F8F8F8",
          border: "1.5px dashed #D8D8D8",
        }}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: 32, height: 32, backgroundColor: YELLOW }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke={DARK} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <span
          className="text-[10px] font-medium"
          style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
        >
          사진 추가
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onAdd}
      className="rounded-xl flex items-center justify-center"
      style={{
        aspectRatio: "1",
        backgroundColor: "#F8F8F8",
        border: "1.5px dashed #E8E8E8",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 5V15M5 10H15" stroke="#D8D8D8" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  );
}

// ─── Text input field ─────────────────────────────────────────────────────────

function FormField({ label, value, onChange, placeholder, multiline = false }) {
  return (
    <div className="mb-4">
      <label
        className="block text-[12px] font-bold mb-1.5 tracking-wide"
        style={{ color: "#888", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-xl px-4 py-3 text-[13px] outline-none resize-none"
          style={{
            backgroundColor: "#F8F8F8",
            border: "1.5px solid #F0F0F0",
            color: DARK,
            fontFamily: "'Spoqa Han Sans Neo', sans-serif",
            lineHeight: "1.6",
          }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl px-4 py-3 text-[13px] outline-none"
          style={{
            backgroundColor: "#F8F8F8",
            border: "1.5px solid #F0F0F0",
            color: DARK,
            fontFamily: "'Spoqa Han Sans Neo', sans-serif",
          }}
        />
      )}
    </div>
  );
}

// ─── Placeholder images for quick-add ────────────────────────────────────────
// Replace these with real uploaded images later
const PLACEHOLDER_PHOTOS = [
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=75&fit=crop",
];

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AddClosetItemScreen({ onClose, onSave }) {
  const [photos,    setPhotos]    = useState(PLACEHOLDER_PHOTOS);
  const [name,      setName]      = useState("트렁크룸 상품");
  const [desc,      setDesc]      = useState("");
  const [brand,     setBrand]     = useState("");
  const [category,  setCategory]  = useState("TOP");
  const [condition, setCondition] = useState("S급");
  const [price,     setPrice]     = useState("");
  const [saved,     setSaved]     = useState(false);

  const MAX_PHOTOS = 6;

  function handleAddPhoto() {
    // In production, open native image picker
    // For prototype, cycle through some placeholder images
    const extras = [
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&q=75&fit=crop",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300&q=75&fit=crop",
    ];
    if (photos.length < MAX_PHOTOS) {
      setPhotos((prev) => [...prev, extras[prev.length % extras.length]]);
    }
  }

  function handleRemovePhoto(index) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => {
      onSave?.();
      onClose?.();
    }, 800);
  }

  // Build 6-slot grid: filled photos + empty slots up to MAX_PHOTOS
  const slots = Array.from({ length: MAX_PHOTOS }, (_, i) => photos[i] ?? null);

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col bg-white overflow-hidden"
    >
      {/* ── Header ── */}
      <div
        className="shrink-0 flex items-center justify-between px-5 pt-5 pb-4"
        style={{ borderBottom: "1px solid #F0F0F0" }}
      >
        <div>
          <p
            className="text-[11px] font-bold tracking-[0.14em] uppercase"
            style={{ color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            SELL ITEM
          </p>
          <h1
            className="text-[18px] font-bold leading-tight"
            style={{ color: DARK, fontFamily: "'Spoqa Han Sans Neo', sans-serif", letterSpacing: "-0.03em" }}
          >
            옷장 아이템 추가하기
          </h1>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-full"
          style={{ width: 36, height: 36, backgroundColor: "#F2F2F2" }}
          aria-label="닫기"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 3L13 13M13 3L3 13" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* ── Scrollable form ── */}
      <div
        className="flex-1 overflow-y-auto px-5 pt-5"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >

        {/* Photo grid */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <label
              className="text-[12px] font-bold tracking-wide"
              style={{ color: "#888", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
            >
              사진 ({photos.length}/{MAX_PHOTOS})
            </label>
            <span
              className="text-[11px]"
              style={{ color: "#CCCCCC", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
            >
              첫 번째 사진이 대표 이미지가 됩니다
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {slots.map((img, i) => (
              <PhotoSlot
                key={i}
                index={i}
                image={img}
                isMain={i === 0 && !!img}
                onAdd={handleAddPhoto}
                onRemove={handleRemovePhoto}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="mb-5" style={{ height: 1, backgroundColor: "#F0F0F0" }} />

        {/* Basic info */}
        <FormField
          label="상품명"
          value={name}
          onChange={setName}
          placeholder="상품명을 입력하세요"
        />
        <FormField
          label="상품정보"
          value={desc}
          onChange={setDesc}
          placeholder="상품 상태, 구매 시기, 착용 횟수 등을 알려주세요"
          multiline
        />
        <FormField
          label="브랜드"
          value={brand}
          onChange={setBrand}
          placeholder="브랜드명을 입력하세요 (예: ZARA, COS)"
        />
        <FormField
          label="희망 판매가 (원)"
          value={price}
          onChange={setPrice}
          placeholder="0"
        />

        {/* Category */}
        <div className="mb-5">
          <label
            className="block text-[12px] font-bold mb-2.5 tracking-wide"
            style={{ color: "#888", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            카테고리
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(({ id, label, emoji }) => {
              const isActive = category === id;
              return (
                <button
                  key={id}
                  onClick={() => setCategory(id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all"
                  style={{
                    backgroundColor: isActive ? DARK : "#F2F2F2",
                    color:           isActive ? "white" : "#555",
                    fontFamily:      "'Spoqa Han Sans Neo', sans-serif",
                    border:          isActive ? `1.5px solid ${DARK}` : "1.5px solid transparent",
                  }}
                >
                  <span style={{ fontSize: 13 }}>{emoji}</span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Condition */}
        <div className="mb-8">
          <label
            className="block text-[12px] font-bold mb-2.5 tracking-wide"
            style={{ color: "#888", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            상품 상태
          </label>
          <div className="grid grid-cols-4 gap-2">
            {CONDITIONS.map((cond) => {
              const isActive = condition === cond;
              return (
                <button
                  key={cond}
                  onClick={() => setCondition(cond)}
                  className="py-2 rounded-xl text-[13px] font-bold transition-all"
                  style={{
                    backgroundColor: isActive ? YELLOW : "#F2F2F2",
                    color:           isActive ? DARK   : "#888",
                    fontFamily:      "'Spoqa Han Sans Neo', sans-serif",
                    boxShadow:       isActive ? `0 2px 8px rgba(245,194,0,0.30)` : "none",
                  }}
                >
                  {cond}
                </button>
              );
            })}
          </div>
          <p
            className="text-[11px] mt-2"
            style={{ color: "#CCCCCC", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            S급: 거의 새것 · A급: 약간 사용 · B급: 사용감 있음 · C급: 하자 있음
          </p>
        </div>
      </div>

      {/* ── CTA button ── */}
      <div className="shrink-0 px-5 pb-5 pt-3" style={{ borderTop: "1px solid #F0F0F0" }}>
        <button
          onClick={handleSave}
          disabled={saved}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
          style={{
            backgroundColor: saved ? "#2ECC71" : YELLOW,
            boxShadow:        saved ? "0 4px 16px rgba(46,204,113,0.30)" : "0 4px 16px rgba(245,194,0,0.30)",
          }}
        >
          {saved ? (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 9L7 13L15 5" stroke={DARK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span
                className="text-[15px] font-bold"
                style={{ color: DARK, fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
              >
                등록 완료!
              </span>
            </>
          ) : (
            <span
              className="text-[15px] font-bold"
              style={{ color: DARK, fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
            >
              아이템 등록하기
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
