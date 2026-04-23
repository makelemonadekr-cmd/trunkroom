import { useState, useCallback } from "react";
import {
  getSizeProfile,
  saveSizeProfile,
  hasSizeProfile,
  DEFAULT_SIZE_PROFILE,
} from "../../lib/sizeStore";
import {
  getShoeSizeConversion,
  getTopSizeConversion,
  getBottomSizeConversion,
  getTopSizeOptions,
  getBottomSizeOptions,
  SHOE_OPTIONS,
  TOP_FIT_OPTIONS,
  BOTTOM_FIT_OPTIONS,
  SHOE_FIT_OPTIONS,
  SHOE_WIDTH_OPTIONS,
  validateHeight,
  validateWeight,
  validateMeasurement,
  formatUpdatedAt,
} from "../../lib/sizeConversionUtils";

const DARK   = "#1a1a1a";
const YELLOW = "#F5C200";
const FONT   = "'Spoqa Han Sans Neo', sans-serif";

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p
      className="px-5 pt-5 pb-2 text-[10px] font-bold tracking-[0.14em] uppercase"
      style={{ color: "#AAAAAA", fontFamily: FONT }}
    >
      {children}
    </p>
  );
}

/** Wraps one row inside a card; handles border-bottom automatically. */
function FieldRow({ label, unit, error, isLast, children }) {
  return (
    <div
      className="flex items-center px-4"
      style={{
        minHeight: 54,
        borderBottom: isLast ? "none" : "1px solid #F5F5F5",
        backgroundColor: error ? "rgba(232,64,64,0.03)" : "white",
      }}
    >
      <span
        className="text-[12px] shrink-0"
        style={{ color: error ? "#E84040" : "#777", fontFamily: FONT, width: 88 }}
      >
        {label}
      </span>
      <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
        {children}
        {unit && !error && (
          <span className="text-[11px] shrink-0" style={{ color: "#BBBBBB", fontFamily: FONT }}>
            {unit}
          </span>
        )}
        {error && (
          <span className="text-[10px] shrink-0" style={{ color: "#E84040", fontFamily: FONT }}>
            {error}
          </span>
        )}
      </div>
    </div>
  );
}

/** Number input styled to fit FieldRow. */
function NumInput({ value, onChange, placeholder, min, max }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      className="text-right text-[14px] bg-transparent outline-none w-full"
      style={{ color: DARK, fontFamily: FONT }}
    />
  );
}

/** Text input styled to fit FieldRow. */
function TxtInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="text-right text-[14px] bg-transparent outline-none w-full"
      style={{ color: DARK, fontFamily: FONT }}
    />
  );
}

/** Select (native) styled to fit FieldRow — opens native iOS picker. */
function SelectInput({ value, onChange, options }) {
  return (
    <div className="relative flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-transparent text-right text-[14px] outline-none pr-5"
        style={{ color: value ? DARK : "#BBBBBB", fontFamily: FONT, minWidth: 0 }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-0 pointer-events-none shrink-0"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
      >
        <path
          d="M2.5 4.5L6 8L9.5 4.5"
          stroke="#BBBBBB"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/** Card wrapper with optional title. */
function Card({ children, style }) {
  return (
    <div
      className="mx-4 rounded-2xl overflow-hidden"
      style={{ border: "1px solid #EEEEEE", backgroundColor: "white", ...style }}
    >
      {children}
    </div>
  );
}

/** Card header bar (gray bg). */
function CardHeader({ emoji, title, badge }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-3"
      style={{ borderBottom: "1px solid #F0F0F0", backgroundColor: "#FAFAFA" }}
    >
      {emoji && <span style={{ fontSize: 15 }}>{emoji}</span>}
      <span
        className="text-[13px] font-bold"
        style={{ color: DARK, fontFamily: FONT }}
      >
        {title}
      </span>
      {badge && (
        <span
          className="ml-auto text-[9px] px-2 py-0.5 rounded-full"
          style={{ backgroundColor: "#FFF7D6", color: "#A07600", fontFamily: FONT, fontWeight: 700 }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

// ─── Shoe size conversion card (view mode) ────────────────────────────────────

function ShoeSizeConversionCard({ shoeSize, gender }) {
  const conv = getShoeSizeConversion(shoeSize, gender);
  if (!conv) return null;

  const rows = [
    { label: "KR / mm", value: `${conv.kr} mm` },
    { label: "US",      value: conv.us           },
    { label: "EU",      value: conv.eu           },
    { label: "UK",      value: conv.uk           },
    { label: "JP",      value: `${conv.jp} cm`  },
  ];

  return (
    <Card style={{ marginBottom: 12 }}>
      <CardHeader
        emoji="👟"
        title="신발 사이즈"
        badge={conv.isExact ? null : "근사값"}
      />
      {rows.map((row, i) => (
        <div
          key={row.label}
          className="flex items-center px-4 py-3"
          style={{ borderBottom: i < rows.length - 1 ? "1px solid #F5F5F5" : "none" }}
        >
          <span
            className="text-[12px]"
            style={{ color: "#888", fontFamily: FONT, width: 80 }}
          >
            {row.label}
          </span>
          <span
            className="ml-auto text-[17px] font-bold"
            style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}
          >
            {row.value}
          </span>
        </div>
      ))}
      <div className="px-4 pb-3 pt-1">
        <p className="text-[10px]" style={{ color: "#BBBBBB", fontFamily: FONT }}>
          {conv.isExact
            ? "* 브랜드 및 라스트(굽 모양)에 따라 다를 수 있어요"
            : "* 입력 사이즈와 가장 가까운 참고 수치입니다. 브랜드마다 차이가 있어요."}
        </p>
      </div>
    </Card>
  );
}

// ─── Clothing size reference card (view mode) ─────────────────────────────────

function ClothingSizeCard({ topSize, bottomSize, waist, gender }) {
  const topConv    = getTopSizeConversion(topSize, gender);
  const bottomConv = getBottomSizeConversion(bottomSize, waist, gender);

  if (!topConv && !bottomConv) return null;

  const sizeGrid = (conv, subtitle) => {
    const cells = [
      { label: "KR", value: conv.kr    },
      { label: "US", value: conv.us    },
      { label: "EU", value: conv.eu    },
      { label: "UK", value: conv.uk    },
    ];
    return (
      <div className="px-4 pb-4">
        <p
          className="text-[9px] font-bold tracking-[0.14em] uppercase pt-3 pb-2"
          style={{ color: "#AAAAAA", fontFamily: FONT }}
        >
          {subtitle}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {cells.map((cell) => (
            <div
              key={cell.label}
              className="flex flex-col items-center gap-1 rounded-xl py-2.5"
              style={{ backgroundColor: "#F8F8F8" }}
            >
              <span
                className="text-[9px]"
                style={{ color: "#AAAAAA", fontFamily: FONT }}
              >
                {cell.label}
              </span>
              <span
                className="text-[14px] font-bold"
                style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}
              >
                {cell.value}
              </span>
            </div>
          ))}
        </div>
        {!conv.isExact && (
          <p className="text-[9px] mt-1.5" style={{ color: "#BBBBBB", fontFamily: FONT }}>
            * 입력 정보와 가장 가까운 참고 수치입니다
          </p>
        )}
      </div>
    );
  };

  return (
    <Card style={{ marginBottom: 12 }}>
      <CardHeader emoji="👕" title="의류 사이즈 참고" badge="쇼핑용" />
      {topConv    && sizeGrid(topConv,    "상의")}
      {topConv && bottomConv && (
        <div style={{ height: 1, backgroundColor: "#F0F0F0", margin: "0 16px" }} />
      )}
      {bottomConv && sizeGrid(bottomConv, "하의")}
      <div className="px-4 pb-3">
        <p className="text-[10px]" style={{ color: "#BBBBBB", fontFamily: FONT }}>
          * 브랜드별로 사이즈가 다를 수 있어요. 쇼핑 참고용으로만 사용하세요.
        </p>
      </div>
    </Card>
  );
}

// ─── Body measurements card (view mode) ───────────────────────────────────────

function BodyMeasurementsCard({ profile }) {
  const items = [
    { label: "키",        value: profile.height,       unit: "cm" },
    { label: "몸무게",    value: profile.weight,       unit: "kg" },
    { label: "가슴",      value: profile.chest,        unit: "cm" },
    { label: "허리",      value: profile.waist,        unit: "cm" },
    { label: "엉덩이",    value: profile.hips,         unit: "cm" },
    { label: "어깨너비",  value: profile.shoulderWidth, unit: "cm" },
    { label: "인심",      value: profile.inseam,       unit: "cm" },
  ].filter((i) => i.value && String(i.value).trim() !== "");

  if (items.length === 0) return null;

  return (
    <Card style={{ marginBottom: 12 }}>
      <CardHeader emoji="📐" title="내 몸 정보" />
      {items.map((item, i) => (
        <div
          key={item.label}
          className="flex items-center px-4 py-3"
          style={{ borderBottom: i < items.length - 1 ? "1px solid #F5F5F5" : "none" }}
        >
          <span className="text-[12px]" style={{ color: "#888", fontFamily: FONT }}>
            {item.label}
          </span>
          <span
            className="ml-auto text-[15px] font-bold"
            style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}
          >
            {item.value}
            <span
              className="text-[11px] font-normal ml-0.5"
              style={{ color: "#AAAAAA" }}
            >
              {item.unit}
            </span>
          </span>
        </div>
      ))}
    </Card>
  );
}

// ─── Fit preferences card (view mode) ────────────────────────────────────────

function FitPrefsCard({ profile }) {
  const prefs = [
    { label: "상의 핏",      value: profile.topFitPref    },
    { label: "하의 핏",      value: profile.bottomFitPref },
    { label: "신발 핏",      value: profile.shoeFitPref   },
    { label: "발볼",          value: profile.shoeWidth     },
    { label: "브라 사이즈",  value: profile.braSize       },
    { label: "드레스 사이즈", value: profile.dressSize    },
  ].filter((p) => p.value && p.value !== "선택 안 함" && String(p.value).trim() !== "");

  if (prefs.length === 0) return null;

  return (
    <Card style={{ marginBottom: 12 }}>
      <CardHeader emoji="✨" title="핏 선호도" />
      <div className="flex flex-wrap gap-2 px-4 py-3">
        {prefs.map((p) => (
          <div
            key={p.label}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: "#F5F5F5" }}
          >
            <span className="text-[10px]" style={{ color: "#888", fontFamily: FONT }}>
              {p.label}
            </span>
            <span
              className="text-[11px] font-bold"
              style={{ color: DARK, fontFamily: FONT }}
            >
              {p.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Gender selector (shared by form) ────────────────────────────────────────

function GenderSelector({ value, onChange }) {
  return (
    <div className="flex gap-2 mx-4 mt-1 mb-0">
      {["여성", "남성"].map((g) => {
        const active = value === g;
        return (
          <button
            key={g}
            onClick={() => onChange(g)}
            className="flex-1 h-11 rounded-xl text-[13px] font-bold transition-all"
            style={{
              backgroundColor: active ? DARK : "#F5F5F5",
              color:           active ? "white" : "#777",
              fontFamily:      FONT,
              border:          active ? `2px solid ${DARK}` : "2px solid transparent",
            }}
          >
            {g}
          </button>
        );
      })}
    </div>
  );
}

// ─── Leave-without-saving sheet ───────────────────────────────────────────────

function LeaveWarningSheet({ onSave, onDiscard, onCancel }) {
  return (
    <div
      className="absolute inset-0 z-10 flex items-end"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
    >
      <div
        className="w-full rounded-t-3xl px-5 pt-6 pb-8"
        style={{ backgroundColor: "white" }}
      >
        <p
          className="text-[16px] font-bold text-center mb-1.5"
          style={{ color: DARK, fontFamily: FONT }}
        >
          변경 사항을 저장할까요?
        </p>
        <p
          className="text-[13px] text-center mb-6"
          style={{ color: "#888", fontFamily: FONT }}
        >
          저장하지 않으면 변경 내용이 사라져요
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onSave}
            className="w-full h-12 rounded-2xl text-[14px] font-bold"
            style={{ backgroundColor: DARK, color: "white", fontFamily: FONT }}
          >
            저장하고 나가기
          </button>
          <button
            onClick={onDiscard}
            className="w-full h-12 rounded-2xl text-[14px] font-medium"
            style={{ backgroundColor: "#F5F5F5", color: "#555", fontFamily: FONT }}
          >
            저장하지 않고 나가기
          </button>
          <button
            onClick={onCancel}
            className="w-full h-10 text-[13px]"
            style={{ color: "#AAAAAA", fontFamily: FONT }}
          >
            계속 수정하기
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── View screen ──────────────────────────────────────────────────────────────

function MySizeViewScreen({ profile, onEdit }) {
  const hasAnyData = !!(
    profile.height || profile.chest || profile.waist ||
    profile.topSize || profile.bottomSize || profile.shoeSize
  );

  return (
    <div
      className="flex-1 overflow-y-auto pb-8"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {/* Quick hero stats */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="px-3 py-1 rounded-full text-[11px] font-bold"
            style={{ backgroundColor: "#F0F0F0", color: "#555", fontFamily: FONT }}
          >
            {profile.gender}
          </span>
          {profile.updatedAt && (
            <span
              className="text-[10px]"
              style={{ color: "#BBBBBB", fontFamily: FONT }}
            >
              {formatUpdatedAt(profile.updatedAt)}
            </span>
          )}
        </div>

        {/* Height / weight hero chips */}
        {(profile.height || profile.weight) && (
          <div className="flex gap-2.5">
            {profile.height && (
              <div
                className="flex-1 rounded-2xl py-3.5 flex flex-col items-center gap-0.5"
                style={{ backgroundColor: "#F8F8F8" }}
              >
                <span
                  className="text-[22px] font-bold"
                  style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.04em" }}
                >
                  {profile.height}
                </span>
                <span className="text-[10px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>
                  키 (cm)
                </span>
              </div>
            )}
            {profile.weight && (
              <div
                className="flex-1 rounded-2xl py-3.5 flex flex-col items-center gap-0.5"
                style={{ backgroundColor: "#F8F8F8" }}
              >
                <span
                  className="text-[22px] font-bold"
                  style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.04em" }}
                >
                  {profile.weight}
                </span>
                <span className="text-[10px]" style={{ color: "#AAAAAA", fontFamily: FONT }}>
                  몸무게 (kg)
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail measurement card (chest / waist / hips etc.) */}
      <BodyMeasurementsCard profile={profile} />

      {/* Clothing size conversion card */}
      <ClothingSizeCard
        topSize={profile.topSize}
        bottomSize={profile.bottomSize}
        waist={profile.waist}
        gender={profile.gender}
      />

      {/* Shoe conversion card */}
      <ShoeSizeConversionCard shoeSize={profile.shoeSize} gender={profile.gender} />

      {/* Fit preferences */}
      <FitPrefsCard profile={profile} />

      {/* Notes */}
      {profile.notes && String(profile.notes).trim() !== "" && (
        <Card style={{ marginBottom: 12 }}>
          <CardHeader emoji="📝" title="메모" />
          <p
            className="px-4 py-3 text-[13px] leading-relaxed"
            style={{ color: "#555", fontFamily: FONT }}
          >
            {profile.notes}
          </p>
        </Card>
      )}

      {/* Empty state — if truly nothing entered */}
      {!hasAnyData && (
        <div className="flex flex-col items-center py-14 gap-3 px-8">
          <span style={{ fontSize: 40 }}>📏</span>
          <p className="text-[14px] font-bold text-center" style={{ color: DARK, fontFamily: FONT }}>
            아직 사이즈 정보가 없어요
          </p>
          <p
            className="text-[12px] text-center leading-relaxed"
            style={{ color: "#AAAAAA", fontFamily: FONT }}
          >
            내 사이즈를 입력하면 KR·US·EU·UK 사이즈를 한눈에 확인하고 쇼핑에 활용할 수 있어요
          </p>
          <button
            onClick={onEdit}
            className="mt-2 px-6 py-2.5 rounded-full text-[13px] font-bold"
            style={{ backgroundColor: DARK, color: "white", fontFamily: FONT }}
          >
            사이즈 입력하기
          </button>
        </div>
      )}

      {/* Shopping helper note */}
      {hasAnyData && (
        <p
          className="text-center text-[11px] px-8 pb-4"
          style={{ color: "#CCCCCC", fontFamily: FONT }}
        >
          쇼핑 시 참고용 수치입니다. 브랜드별 실측 차트를 함께 확인하세요.
        </p>
      )}
    </div>
  );
}

// ─── Edit / setup form ────────────────────────────────────────────────────────

function MySizeEditForm({ draft, errors, onChange }) {
  const topOpts    = getTopSizeOptions(draft.gender);
  const bottomOpts = getBottomSizeOptions(draft.gender);

  return (
    <div
      className="flex-1 overflow-y-auto pb-8"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {/* ── Gender ── */}
      <SectionLabel>성별</SectionLabel>
      <GenderSelector value={draft.gender} onChange={(v) => onChange("gender", v)} />

      {/* ── Body measurements ── */}
      <SectionLabel>신체 치수</SectionLabel>
      <Card>
        <FieldRow label="키" unit="cm" error={errors.height}>
          <NumInput
            value={draft.height}
            onChange={(v) => onChange("height", v)}
            placeholder="예: 165"
            min={100}
            max={250}
          />
        </FieldRow>
        <FieldRow label="몸무게" unit="kg" error={errors.weight}>
          <NumInput
            value={draft.weight}
            onChange={(v) => onChange("weight", v)}
            placeholder="선택"
            min={20}
            max={300}
          />
        </FieldRow>
        <FieldRow label="가슴/흉둘레" unit="cm" error={errors.chest}>
          <NumInput
            value={draft.chest}
            onChange={(v) => onChange("chest", v)}
            placeholder="예: 86"
            min={30}
            max={200}
          />
        </FieldRow>
        <FieldRow label="허리" unit="cm" error={errors.waist}>
          <NumInput
            value={draft.waist}
            onChange={(v) => onChange("waist", v)}
            placeholder="예: 68"
            min={30}
            max={200}
          />
        </FieldRow>
        <FieldRow label="엉덩이" unit="cm" error={errors.hips}>
          <NumInput
            value={draft.hips}
            onChange={(v) => onChange("hips", v)}
            placeholder="예: 92"
            min={30}
            max={200}
          />
        </FieldRow>
        <FieldRow label="어깨너비" unit="cm" error={errors.shoulderWidth}>
          <NumInput
            value={draft.shoulderWidth}
            onChange={(v) => onChange("shoulderWidth", v)}
            placeholder="선택"
            min={30}
            max={80}
          />
        </FieldRow>
        <FieldRow label="인심" unit="cm" error={errors.inseam} isLast>
          <NumInput
            value={draft.inseam}
            onChange={(v) => onChange("inseam", v)}
            placeholder="선택"
            min={30}
            max={120}
          />
        </FieldRow>
      </Card>

      {/* ── Clothing sizes ── */}
      <SectionLabel>의류 사이즈</SectionLabel>
      <Card>
        <FieldRow label="상의 사이즈">
          <SelectInput
            value={draft.topSize}
            onChange={(v) => onChange("topSize", v)}
            options={topOpts}
          />
        </FieldRow>
        <FieldRow label="하의 사이즈">
          <SelectInput
            value={draft.bottomSize}
            onChange={(v) => onChange("bottomSize", v)}
            options={bottomOpts}
          />
        </FieldRow>
        {draft.gender === "여성" && (
          <>
            <FieldRow label="드레스 사이즈">
              <TxtInput
                value={draft.dressSize}
                onChange={(v) => onChange("dressSize", v)}
                placeholder="선택 (예: 66, M)"
              />
            </FieldRow>
            <FieldRow label="브라 사이즈" isLast>
              <TxtInput
                value={draft.braSize}
                onChange={(v) => onChange("braSize", v)}
                placeholder="선택 (예: 75B)"
              />
            </FieldRow>
          </>
        )}
        {draft.gender === "남성" && (
          <FieldRow label="상의 참고" isLast>
            <span
              className="text-[11px] text-right"
              style={{ color: "#AAAAAA", fontFamily: FONT }}
            >
              가슴 치수 입력 시 자동 변환
            </span>
          </FieldRow>
        )}
      </Card>
      <p className="px-5 pt-1.5 text-[10px]" style={{ color: "#BBBBBB", fontFamily: FONT }}>
        {draft.gender === "여성"
          ? "KR 44·55·66·77·88·99 기준 / 여성 XS–3XL"
          : "KR 85·90·95·100·105·110·115 기준 / 남성 XS–3XL"}
      </p>

      {/* ── Shoe size ── */}
      <SectionLabel>신발 사이즈</SectionLabel>
      <Card>
        <FieldRow label="신발 사이즈 (mm)">
          <SelectInput
            value={draft.shoeSize}
            onChange={(v) => onChange("shoeSize", v)}
            options={SHOE_OPTIONS}
          />
        </FieldRow>
        <FieldRow label="발볼">
          <SelectInput
            value={draft.shoeWidth}
            onChange={(v) => onChange("shoeWidth", v)}
            options={SHOE_WIDTH_OPTIONS.map((o) => ({ value: o === "선택 안 함" ? "" : o, label: o }))}
          />
        </FieldRow>
        <FieldRow label="핏 선호도" isLast>
          <SelectInput
            value={draft.shoeFitPref}
            onChange={(v) => onChange("shoeFitPref", v)}
            options={SHOE_FIT_OPTIONS.map((o) => ({ value: o === "선택 안 함" ? "" : o, label: o }))}
          />
        </FieldRow>
      </Card>
      <p className="px-5 pt-1.5 text-[10px]" style={{ color: "#BBBBBB", fontFamily: FONT }}>
        한국·일본 mm 기준 / 저장 후 US·EU·UK·JP 변환을 확인할 수 있어요
      </p>

      {/* ── Fit preferences ── */}
      <SectionLabel>핏 선호도</SectionLabel>
      <Card>
        <FieldRow label="상의 핏">
          <SelectInput
            value={draft.topFitPref}
            onChange={(v) => onChange("topFitPref", v)}
            options={TOP_FIT_OPTIONS.map((o) => ({ value: o === "선택 안 함" ? "" : o, label: o }))}
          />
        </FieldRow>
        <FieldRow label="하의 핏" isLast>
          <SelectInput
            value={draft.bottomFitPref}
            onChange={(v) => onChange("bottomFitPref", v)}
            options={BOTTOM_FIT_OPTIONS.map((o) => ({ value: o === "선택 안 함" ? "" : o, label: o }))}
          />
        </FieldRow>
      </Card>

      {/* ── Notes ── */}
      <SectionLabel>메모</SectionLabel>
      <Card style={{ marginBottom: 0 }}>
        <div className="px-4 py-3">
          <textarea
            value={draft.notes}
            onChange={(e) => onChange("notes", e.target.value)}
            placeholder="특이 사항이나 참고 메모를 적어보세요 (예: 어깨가 넓어서 상의는 한 치수 크게 구입)"
            rows={3}
            className="w-full text-[13px] bg-transparent outline-none resize-none leading-relaxed"
            style={{ color: DARK, fontFamily: FONT }}
          />
        </div>
      </Card>
      <div style={{ height: 32 }} />
    </div>
  );
}

// ─── Root: MySizePage ─────────────────────────────────────────────────────────

/**
 * Full-screen overlay showing/editing the user's size profile.
 *
 * Props:
 *   onClose()  — called to dismiss the page and return to ClosetPage
 */
export default function MySizePage({ onClose }) {
  // Determine initial mode
  const [isSetup]            = useState(() => !hasSizeProfile());
  const [profile,  setProfile] = useState(() => getSizeProfile() || { ...DEFAULT_SIZE_PROFILE });
  const [draft,    setDraft  ] = useState(() => getSizeProfile() || { ...DEFAULT_SIZE_PROFILE });
  const [mode,     setMode   ] = useState(() => hasSizeProfile() ? "view" : "edit");
  const [errors,   setErrors ] = useState({});
  const [showLeave, setShowLeave] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Detect unsaved changes
  const hasChanges = JSON.stringify(draft) !== JSON.stringify(profile);

  // Field updater
  const updateDraft = useCallback((field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  // Validation
  function validate() {
    const errs = {};
    if (!validateHeight(draft.height))      errs.height      = "100–250 사이";
    if (!validateWeight(draft.weight))      errs.weight      = "20–300 사이";
    if (!validateMeasurement(draft.chest))  errs.chest       = "30–200 사이";
    if (!validateMeasurement(draft.waist))  errs.waist       = "30–200 사이";
    if (!validateMeasurement(draft.hips))   errs.hips        = "30–200 사이";
    if (!validateMeasurement(draft.shoulderWidth)) errs.shoulderWidth = "30–80 사이";
    if (!validateMeasurement(draft.inseam)) errs.inseam      = "30–120 사이";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // Save
  function handleSave() {
    if (!validate()) return;
    const saved = saveSizeProfile(draft);
    setProfile(saved);
    setDraft(saved);
    setMode("view");
    setShowLeave(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2200);
  }

  // Back / close logic
  function handleBack() {
    if (mode === "view") {
      onClose?.();
    } else if (mode === "edit") {
      if (isSetup) {
        // First-time setup: just close
        onClose?.();
      } else if (hasChanges) {
        setShowLeave(true);
      } else {
        setMode("view");
      }
    }
  }

  // Header right button
  const headerRightLabel = mode === "view" ? "수정" : "저장";
  function handleHeaderRight() {
    if (mode === "view") {
      setDraft({ ...profile });
      setErrors({});
      setMode("edit");
    } else {
      handleSave();
    }
  }

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "white" }}
    >
      {/* ── Header ── */}
      <div
        className="shrink-0 flex items-center justify-between px-4 bg-white"
        style={{ height: 52, borderBottom: "1px solid #F0F0F0" }}
      >
        {/* Back / close */}
        <button
          onClick={handleBack}
          className="w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-100"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path
              d="M14 5L8 11L14 17"
              stroke={DARK}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Title */}
        <h1
          className="text-[16px] font-bold"
          style={{ color: DARK, fontFamily: FONT, letterSpacing: "-0.02em" }}
        >
          {mode === "view" ? "내 사이즈" : isSetup ? "사이즈 설정" : "사이즈 수정"}
        </h1>

        {/* Right action */}
        <button
          onClick={handleHeaderRight}
          className="h-9 px-3.5 flex items-center justify-center rounded-full active:opacity-70"
          style={{
            backgroundColor: mode === "edit" ? DARK : "transparent",
            minWidth: 56,
          }}
        >
          <span
            className="text-[13px] font-bold"
            style={{ color: mode === "edit" ? "white" : "#555", fontFamily: FONT }}
          >
            {headerRightLabel}
          </span>
        </button>
      </div>

      {/* ── Body ── */}
      {mode === "view" ? (
        <MySizeViewScreen profile={profile} onEdit={() => { setDraft({ ...profile }); setMode("edit"); }} />
      ) : (
        <MySizeEditForm draft={draft} errors={errors} onChange={updateDraft} />
      )}

      {/* ── Bottom save bar (edit mode only) ── */}
      {mode === "edit" && (
        <div
          className="shrink-0 px-4 py-3 bg-white"
          style={{ borderTop: "1px solid #F0F0F0" }}
        >
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center h-13 rounded-2xl text-[15px] font-bold transition-all active:opacity-80"
            style={{
              height:          52,
              backgroundColor: DARK,
              color:           "white",
              fontFamily:      FONT,
              letterSpacing:   "-0.01em",
            }}
          >
            저장하기
          </button>
        </div>
      )}

      {/* ── Leave-without-saving sheet ── */}
      {showLeave && (
        <LeaveWarningSheet
          onSave={handleSave}
          onDiscard={() => {
            setShowLeave(false);
            setDraft({ ...profile });
            setErrors({});
            setMode("view");
          }}
          onCancel={() => setShowLeave(false)}
        />
      )}

      {/* ── Save success toast ── */}
      {saveSuccess && (
        <div
          className="absolute bottom-24 left-4 right-4 flex items-center justify-center gap-2 py-3 rounded-2xl z-50 pointer-events-none"
          style={{ backgroundColor: "#1a1a1a" }}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path
              d="M2.5 7.5L5.5 10.5L12.5 3.5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            className="text-[13px] font-bold text-white"
            style={{ fontFamily: FONT }}
          >
            저장되었어요
          </span>
        </div>
      )}
    </div>
  );
}
