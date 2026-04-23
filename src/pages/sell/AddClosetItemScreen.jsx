/**
 * AddClosetItemScreen.jsx
 *
 * Full clothing item registration form with AI-powered auto-detection.
 * Pipeline: user picks photo → background removal → OpenAI Vision → form prefill.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import AutoDetectLoadingState from "../../components/AutoDetectLoadingState.jsx";
import AutoDetectedBadge      from "../../components/AutoDetectedBadge.jsx";
import { runUploadPipeline }  from "../../lib/uploadClothing.js";
import { addClosetItem }      from "../../lib/closetStore.js";
import { validateImageFile, compressImage } from "../../lib/imageUtils.js";

const DARK   = "#1a1a1a";
const YELLOW = "#F5C200";

// ─── Category + subcategory data (mirrors server/lib/categoryMapping.js) ──────

const CATEGORIES = [
  { id: "TOP",    label: "상의",     emoji: "👕" },
  { id: "BOTTOM", label: "하의",     emoji: "👖" },
  { id: "OUTER",  label: "아우터",   emoji: "🧥" },
  { id: "OPS",    label: "원피스",   emoji: "👗" },
  { id: "SHOES",  label: "신발",     emoji: "👟" },
  { id: "BAG",    label: "가방",     emoji: "👜" },
  { id: "ACC",    label: "액세서리", emoji: "💍" },
  { id: "SPORTS", label: "스포츠",   emoji: "🏃" },
];

const SUBCATEGORIES_BY_ID = {
  TOP:    ["반팔 티셔츠", "긴팔 티셔츠", "셔츠", "블라우스", "니트/스웨터", "후드티", "맨투맨", "탱크탑", "가디건", "크롭탑"],
  BOTTOM: ["청바지", "슬랙스", "반바지", "트레이닝 팬츠", "미니스커트", "미디스커트", "맥시스커트", "와이드팬츠", "레깅스", "조거팬츠"],
  OUTER:  ["트렌치코트", "울 코트", "패딩", "블레이저", "점퍼", "다운재킷", "체크코트", "오버핏코트", "레더재킷", "후리스"],
  OPS:    ["미니 원피스", "미디 원피스", "맥시 원피스", "니트 원피스", "셔츠 원피스", "플리츠 원피스", "점프수트", "원숄더", "민소매 원피스", "캐주얼 원피스"],
  SHOES:  ["스니커즈", "로퍼", "힐/펌프스", "앵클 부츠", "샌들", "뮬", "옥스퍼드", "슬리퍼", "플랫폼", "스포츠 샌들"],
  BAG:    ["숄더백", "크로스백", "토트백", "클러치", "백팩", "버킷백", "핸드백", "에코백", "파우치", "미니백"],
  ACC:    ["목걸이", "귀걸이", "반지", "선글라스", "벨트", "헤어밴드", "스카프", "모자", "시계", "팔찌"],
  SPORTS: ["스포츠 레깅스", "스포츠 브라", "트레이닝 재킷", "러닝화", "요가복", "압박 반바지", "윈드브레이커", "스포츠 티셔츠", "스포츠 양말", "헤드밴드"],
};

const KO_TO_ID = {
  상의: "TOP", 하의: "BOTTOM", 아우터: "OUTER", 원피스: "OPS",
  신발: "SHOES", 가방: "BAG", 액세서리: "ACC", 스포츠: "SPORTS",
};

const CONDITIONS = ["S급", "A급", "B급", "C급"];

const SEASONS     = ["봄", "여름", "가을", "겨울"];
const STYLE_TAGS  = ["미니멀", "캐주얼", "페미닌", "오피스", "스트릿", "스포티", "빈티지", "포멀", "트렌디", "로맨틱"];
const MATERIALS   = ["면", "린넨", "폴리에스터", "울", "캐시미어", "실크", "데님", "가죽", "니트", "쉬폰", "레이온", "혼방"];

// ─── Photo slot component ─────────────────────────────────────────────────────

function PhotoSlot({ image, isMain, bgRemoved, onAdd, onRemove, index, loading }) {
  if (loading && index === 0) {
    return (
      <div
        className="relative rounded-xl flex items-center justify-center"
        style={{ aspectRatio: "1", backgroundColor: "#F8F8F8", border: "1.5px dashed #D8D8D8" }}
      >
        <div
          className="rounded-full"
          style={{
            width: 28, height: 28,
            border: `3px solid ${YELLOW}`,
            borderTopColor: "transparent",
            animation: "spin 0.7s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (image) {
    return (
      <div
        className="relative rounded-xl overflow-hidden"
        style={{ aspectRatio: "1", backgroundColor: "#F0F0F0" }}
      >
        {/* Checkerboard pattern for transparent bg */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: bgRemoved
              ? "repeating-conic-gradient(#E8E8E8 0% 25%, white 0% 50%) 0 0 / 12px 12px"
              : "none",
          }}
        />
        <img
          src={`data:image/png;base64,${image}`}
          alt={`photo-${index}`}
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "contain", objectPosition: "center" }}
          onError={(e) => { e.target.style.display = "none"; }}
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
        {isMain && bgRemoved && (
          <div
            className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md"
            style={{ backgroundColor: "#2ECC71" }}
          >
            <span
              className="text-[9px] font-bold text-white"
              style={{ fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
            >
              배경제거
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
    return (
      <button
        onClick={onAdd}
        className="relative rounded-xl flex flex-col items-center justify-center gap-1"
        style={{ aspectRatio: "1", backgroundColor: "#F8F8F8", border: "1.5px dashed #D8D8D8" }}
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
        <span
          className="text-[9px]"
          style={{ color: "#CCCCCC", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
        >
          AI 자동 분석
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onAdd}
      className="rounded-xl flex items-center justify-center"
      style={{ aspectRatio: "1", backgroundColor: "#F8F8F8", border: "1.5px dashed #E8E8E8" }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 5V15M5 10H15" stroke="#D8D8D8" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  );
}

// ─── Form field ───────────────────────────────────────────────────────────────

function FormField({ label, value, onChange, placeholder, multiline = false, badge }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1.5">
        <label
          className="text-[12px] font-bold tracking-wide"
          style={{ color: "#888", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
        >
          {label}
        </label>
        {badge}
      </div>
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

// ─── Chip selector ────────────────────────────────────────────────────────────

function ChipGroup({ label, options, selected, onToggle, single = false, badge, accent = DARK }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <label
          className="text-[12px] font-bold tracking-wide"
          style={{ color: "#888", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
        >
          {label}
        </label>
        {badge}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isActive = single
            ? selected === opt
            : Array.isArray(selected) && selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
              style={{
                backgroundColor: isActive ? accent : "#F2F2F2",
                color:           isActive ? "white" : "#666",
                fontFamily:      "'Spoqa Han Sans Neo', sans-serif",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AddClosetItemScreen({ onClose, onSave, photoSource = null }) {
  // Photos
  const [photos,         setPhotos]         = useState([]);       // array of base64 strings
  const [displayMime,    setDisplayMime]     = useState("image/jpeg");
  const [bgRemoved,      setBgRemoved]       = useState(false);

  // Processing pipeline
  const [pipelineState,  setPipelineState]   = useState(null);    // null | uploading | removing_bg | analyzing | done | error
  const [pipelineError,  setPipelineError]   = useState(null);

  // AI detection flags
  const [autoDetected,   setAutoDetected]    = useState(false);
  const [needsReview,    setNeedsReview]     = useState(false);

  // Form fields
  const [name,           setName]            = useState("");
  const [desc,           setDesc]            = useState("");
  const [brand,          setBrand]           = useState("");
  const [price,          setPrice]           = useState("");
  const [category,       setCategory]        = useState("TOP");
  const [subCategory,    setSubCategory]     = useState("");
  const [color,          setColor]           = useState("");
  const [material,       setMaterial]        = useState("");      // 소재
  const [customMood,     setCustomMood]      = useState("");      // 나만의 무드
  const [condition,      setCondition]       = useState("A급");
  const [seasons,        setSeasons]         = useState([]);
  const [styleTags,      setStyleTags]       = useState([]);

  const [saved,          setSaved]           = useState(false);

  const fileInputRef = useRef(null);
  const MAX_PHOTOS   = 6;

  // ── Auto-trigger file input based on photoSource prop ─────────────────────
  // When the screen opens from the source picker, immediately open the correct picker
  useEffect(() => {
    if (!photoSource) return;
    const timer = setTimeout(() => {
      fileInputRef.current?.click();
    }, 300); // slight delay to let the screen animate in
    return () => clearTimeout(timer);
  }, []); // run once on mount

  // ── File picker handler ────────────────────────────────────────────────────

  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";   // allow re-selecting same file

    // Validate file type and size
    const { valid, error: fileError } = validateImageFile(file);
    if (!valid) {
      setPipelineError(fileError);
      setPipelineState("error");
      setTimeout(() => setPipelineState(null), 2500);
      return;
    }

    // Compress large files before uploading (>2MB gets compressed)
    let uploadFile = file;
    if (file.size > 2 * 1024 * 1024) {
      try {
        const { dataUrl, mimeType } = await compressImage(file, { maxDim: 1200, quality: 0.88 });
        const blob = await fetch(dataUrl).then((r) => r.blob());
        uploadFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: mimeType });
      } catch {
        // Compression failed — use original
        uploadFile = file;
      }
    }

    try {
      await runUploadPipeline(uploadFile, {
        onBgStart:      () => setPipelineState("removing_bg"),
        onAnalyzeStart: () => setPipelineState("analyzing"),
        onDone: (result) => {
          setPipelineState("done");

          // Set the display image
          setPhotos([result.displayBase64]);
          setDisplayMime(result.displayMimeType);
          setBgRemoved(result.bgRemoved);

          // Prefill form from AI analysis
          const a = result.analysis;
          if (a?.success) {
            setAutoDetected(true);
            setNeedsReview(!!a.needsReview);

            if (a.displayName) setName(a.displayName);
            if (a.color)       setColor(a.color);
            if (a.season?.length) setSeasons(a.season);
            if (a.styleTags?.length) setStyleTags(a.styleTags.slice(0, 4));

            if (a.mainCategory) {
              const catId = KO_TO_ID[a.mainCategory] ?? "TOP";
              setCategory(catId);
              if (a.subCategory) setSubCategory(a.subCategory);
            }

            if (a.analysisNotes) {
              setDesc(a.analysisNotes);
            }
          }

          // Short delay then dismiss overlay
          setTimeout(() => setPipelineState(null), 1200);
        },
        onError: (err) => {
          setPipelineError(err.message);
          setPipelineState("error");
          setTimeout(() => setPipelineState(null), 2500);
        },
      });

      // Immediately show "uploading" (pipeline starts synchronously before first await)
      setPipelineState("uploading");
    } catch {
      // Already handled in onError
    }
  }, []);

  // We need to set uploading BEFORE the async call resolves the first await,
  // so trigger it right when the file is selected:
  const handleAddPhotoClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // ── Photo removal ──────────────────────────────────────────────────────────

  function handleRemovePhoto(index) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    if (index === 0) {
      setBgRemoved(false);
      setAutoDetected(false);
      setNeedsReview(false);
    }
  }

  // ── Season + style toggle ──────────────────────────────────────────────────

  function toggleSeason(s) {
    setSeasons((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  function toggleStyleTag(t) {
    setStyleTags((prev) =>
      prev.includes(t)
        ? prev.filter((x) => x !== t)
        : prev.length < 4 ? [...prev, t] : prev   // max 4
    );
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  function handleSave() {
    const newItem = {
      id:          Date.now(),
      name:        name || "새 아이템",
      brand,
      color,
      material,
      customMood:  customMood.trim() || null,
      subCategory,
      category:    CATEGORIES.find((c) => c.id === category)?.label ?? "상의",
      image:       photos[0] ? `data:${displayMime};base64,${photos[0]}` : null,
      condition,
      price:       price ? parseInt(price.replace(/,/g, ""), 10) : 0,
      seasons,
      styleTags,
      bgRemoved,
      autoDetected,
      needsReview,
      photoSource,
      addedAt:     new Date().toISOString(),
    };

    addClosetItem(newItem);

    setSaved(true);
    setTimeout(() => {
      onSave?.();
      onClose?.();
    }, 800);
  }

  // ── Build 6-slot grid ─────────────────────────────────────────────────────
  const slots = Array.from({ length: MAX_PHOTOS }, (_, i) => photos[i] ?? null);
  const isProcessing = pipelineState && pipelineState !== "done" && pipelineState !== "error";
  const subcatOptions = SUBCATEGORIES_BY_ID[category] ?? [];
  const aiB = autoDetected ? <AutoDetectedBadge review={needsReview} /> : null;

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-white overflow-hidden">

      {/* Hidden file input — capture="environment" for camera, none for gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        capture={photoSource === "camera" ? "environment" : undefined}
        className="hidden"
        onChange={(e) => {
          setPipelineState("uploading");
          handleFileChange(e);
        }}
      />

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
            ADD ITEM
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
        {/* Photo source indicator */}
        {photoSource && (
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2 mb-3"
            style={{ backgroundColor: "#F0F8FF", border: "1px solid #D0E8FF" }}
          >
            <span style={{ fontSize: 14 }}>{photoSource === "camera" ? "📸" : "🖼️"}</span>
            <p className="text-[11px]" style={{ color: "#2B6CB0", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
              {photoSource === "camera" ? "카메라로 촬영하기 — 사진 앱이 열려요" : "갤러리에서 선택하기 — 파일 선택 창이 열려요"}
            </p>
          </div>
        )}

        {/* AI intro banner */}
        <div
          className="flex items-center gap-3 rounded-xl p-3 mb-5"
          style={{ backgroundColor: "#FFFBEA", border: "1px solid #F5C20040" }}
        >
          <span style={{ fontSize: 20 }}>✨</span>
          <div>
            <p
              className="text-[12px] font-bold"
              style={{ color: "#B8860B", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
            >
              AI 자동 분석
            </p>
            <p
              className="text-[11px]"
              style={{ color: "#A07828", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
            >
              사진을 추가하면 배경을 제거하고 카테고리, 색상, 시즌을 자동으로 입력해줘요
            </p>
          </div>
        </div>

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
              첫 번째 사진이 대표 이미지
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {slots.map((img, i) => (
              <PhotoSlot
                key={i}
                index={i}
                image={img}
                isMain={i === 0 && !!img}
                bgRemoved={i === 0 && bgRemoved}
                loading={isProcessing && i === 0 && !img}
                onAdd={handleAddPhotoClick}
                onRemove={handleRemovePhoto}
              />
            ))}
          </div>
        </div>

        <div className="mb-5" style={{ height: 1, backgroundColor: "#F0F0F0" }} />

        {/* needsReview warning */}
        {needsReview && autoDetected && (
          <div
            className="flex items-start gap-2 rounded-xl p-3 mb-4"
            style={{ backgroundColor: "#FFF8E1", border: "1px solid #F5C20040" }}
          >
            <span style={{ fontSize: 16 }}>⚠️</span>
            <p
              className="text-[12px]"
              style={{ color: "#B8860B", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
            >
              이미지가 불명확해 일부 정보를 확인해주세요. AI 분석 결과가 정확하지 않을 수 있어요.
            </p>
          </div>
        )}

        {/* Basic info */}
        <FormField
          label="상품명"
          value={name}
          onChange={setName}
          placeholder="상품명을 입력하세요"
          badge={aiB}
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
          placeholder="브랜드명 (예: ZARA, COS)"
        />
        <FormField
          label="색상"
          value={color}
          onChange={setColor}
          placeholder="예: 화이트, 블랙, 베이지"
          badge={aiB}
        />
        <FormField
          label="희망 판매가 (원)"
          value={price}
          onChange={setPrice}
          placeholder="0"
        />

        {/* Category */}
        <ChipGroup
          label="카테고리"
          options={CATEGORIES.map((c) => c.id)}
          selected={category}
          onToggle={(id) => { setCategory(id); setSubCategory(""); }}
          single
          badge={aiB}
          accent={DARK}
        />

        {/* Subcategory */}
        {subcatOptions.length > 0 && (
          <ChipGroup
            label="세부 카테고리"
            options={subcatOptions}
            selected={subCategory}
            onToggle={(s) => setSubCategory(s)}
            single
            badge={aiB}
            accent={DARK}
          />
        )}

        {/* Condition */}
        <div className="mb-4">
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
                    boxShadow:       isActive ? "0 2px 8px rgba(245,194,0,0.30)" : "none",
                  }}
                >
                  {cond}
                </button>
              );
            })}
          </div>
          <p
            className="text-[11px] mt-1.5"
            style={{ color: "#CCCCCC", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
          >
            S급: 거의 새것 · A급: 약간 사용 · B급: 사용감 있음 · C급: 하자 있음
          </p>
        </div>

        {/* Season */}
        <ChipGroup
          label="시즌"
          options={SEASONS}
          selected={seasons}
          onToggle={toggleSeason}
          badge={aiB}
          accent={DARK}
        />

        {/* Material chips */}
        <ChipGroup
          label="소재"
          options={MATERIALS}
          selected={material}
          onToggle={(m) => setMaterial(m)}
          single
          accent={DARK}
        />

        {/* Style tags */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <label
              className="text-[12px] font-bold tracking-wide"
              style={{ color: "#888", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
            >
              스타일 태그 (최대 4개)
            </label>
            {aiB}
          </div>
          <div className="flex flex-wrap gap-2">
            {STYLE_TAGS.map((tag) => {
              const isActive = styleTags.includes(tag);
              const maxed    = styleTags.length >= 4 && !isActive;
              return (
                <button
                  key={tag}
                  onClick={() => toggleStyleTag(tag)}
                  disabled={maxed}
                  className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
                  style={{
                    backgroundColor: isActive ? DARK : "#F2F2F2",
                    color:           isActive ? "white" : maxed ? "#CCCCCC" : "#666",
                    fontFamily:      "'Spoqa Han Sans Neo', sans-serif",
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* 나만의 무드 — freeform custom mood text */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1.5">
            <label
              className="text-[12px] font-bold tracking-wide"
              style={{ color: "#888", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
            >
              나만의 무드
            </label>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: "#F0F0F0", color: "#AAAAAA", fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
            >
              선택
            </span>
          </div>
          <input
            type="text"
            value={customMood}
            onChange={(e) => setCustomMood(e.target.value)}
            placeholder="이 아이템만의 특별한 무드를 적어보세요 (예: 파리지앵 느낌, 주말 브런치)"
            className="w-full rounded-xl px-4 py-3 text-[13px] outline-none"
            style={{
              backgroundColor: "#F8F8F8",
              border:          "1.5px solid #F0F0F0",
              color:           DARK,
              fontFamily:      "'Spoqa Han Sans Neo', sans-serif",
            }}
          />
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="shrink-0 px-5 pb-5 pt-3" style={{ borderTop: "1px solid #F0F0F0" }}>
        <button
          onClick={handleSave}
          disabled={saved || isProcessing}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
          style={{
            backgroundColor: saved ? "#2ECC71" : isProcessing ? "#F0F0F0" : YELLOW,
            boxShadow:        saved
              ? "0 4px 16px rgba(46,204,113,0.30)"
              : isProcessing ? "none"
              : "0 4px 16px rgba(245,194,0,0.30)",
          }}
        >
          {saved ? (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 9L7 13L15 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span
                className="text-[15px] font-bold text-white"
                style={{ fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}
              >
                등록 완료!
              </span>
            </>
          ) : (
            <span
              className="text-[15px] font-bold"
              style={{
                color:       isProcessing ? "#AAAAAA" : DARK,
                fontFamily:  "'Spoqa Han Sans Neo', sans-serif",
              }}
            >
              {isProcessing ? "분석 중…" : "아이템 등록하기"}
            </span>
          )}
        </button>
      </div>

      {/* ── Pipeline loading overlay ── */}
      <AutoDetectLoadingState
        state={pipelineState}
        errorMessage={pipelineError}
      />
    </div>
  );
}
