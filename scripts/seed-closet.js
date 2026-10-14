/**
 * seed-closet.js
 *
 * 윤킴 옷장 사진을 Supabase Storage에 업로드하고
 * OpenAI Vision으로 분석해서 clothing_items 테이블에 삽입합니다.
 *
 * 사용법:
 *   node scripts/seed-closet.js --dry-run              # 실제 업로드 없이 목록만 출력
 *   node scripts/seed-closet.js --limit 3             # 3장만 처리 (테스트)
 *   node scripts/seed-closet.js --folder "8. 신발 (SHOES)"  # 특정 폴더만
 *   node scripts/seed-closet.js --skip-bg             # 배경 제거 건너뜀
 *   node scripts/seed-closet.js --group-size 3        # 연속 N장을 같은 아이템으로 묶기 시도
 *   node scripts/seed-closet.js                       # 전체 처리
 *
 * 필요한 환경변수 (.env):
 *   SUPABASE_URL or VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   OPENAI_API_KEY
 *   REMOVE_BG_API_KEY
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import {
  resolveMainCategory,
  resolveSubCategory,
  TAXONOMY,
} from "../server/lib/categoryMapping.js";

// ─── 설정 ─────────────────────────────────────────────────────────────────────

const USER_ID    = "45bbc72c-0f43-4e27-9193-d01d93c425fe"; // yoon@makelemonade.kr
const PHOTOS_ROOT = "/Users/yoon/Library/CloudStorage/Dropbox/01. MAKE LEMONADE (법인)/00. 사업운영 ｜ 트렁크룸, 노브라블럼 ♥/1. 트렁크룸｜TRUNK ROOM/06. 상품관련/☆☆☆리얼윤킴옷장";
const BUCKET     = "clothing-images";
const RESULTS_FILE = path.resolve("scripts/seed_results.json");

const BATCH_SIZE  = 5;    // 한 번에 병렬 처리할 사진 수
const BATCH_DELAY = 2000; // 배치 사이 대기 시간 (ms)

// CLI 플래그 파싱
const DRY_RUN  = process.argv.includes("--dry-run");
const SKIP_BG  = process.argv.includes("--skip-bg");
const limitIdx = process.argv.indexOf("--limit");
const LIMIT    = limitIdx !== -1 ? parseInt(process.argv[limitIdx + 1], 10) : Infinity;
const folderIdx = process.argv.indexOf("--folder");
const ONLY_FOLDER = folderIdx !== -1 ? process.argv[folderIdx + 1] : null;
const groupIdx = process.argv.indexOf("--group-size");
const GROUP_SIZE = groupIdx !== -1 ? parseInt(process.argv[groupIdx + 1], 10) : 1; // 1 = 그룹핑 안 함

// ─── 폴더명 → 카테고리 매핑 ──────────────────────────────────────────────────

// 최상위 폴더명에서 main_category를 추론
const FOLDER_TO_CATEGORY = {
  "1. 상의 (TOP)":          "상의",
  "2. 아우터(OUTER)":        "아우터",
  "3. 원피스점프수트 OPS":    "원피스",
  "4. 수트 (SUIT)":          "아우터",
  "5. 반지 (PANTS)":         "하의",   // "반지"는 "바지" 오타
  "6. 스커트 (SKIRT)":       "하의",
  "7. 지방 가방 (BAG)":      "가방",   // "지방"은 "지갑" 오타
  "8. 신발 (SHOES)":         "신발",
  "9. 시계 (WATCH)":         "액세서리",
  "10. HEADWEAR":            "액세서리",
  "11. SPORTS":              "스포츠",
  "12. SWIM WEAR":           "스포츠",
  "13. 양말LEGWEAR":         "액세서리",
  "14. 안경선글라스":         "액세서리",
  "15. 쥬얼리시즌 잡화":      "액세서리",
  "16. 홈웨어":               "스포츠",
  "17. 뷰티":                 null,   // 건너뜀 (의류 아님)
  "18. 반려동물":              null,   // 건너뜀
  "19. 유아 어린이":           null,   // 건너뜀
  "20. 기타":                 "상의",
  "포토샵":                   null,   // 건너뜀 (편집 파일)
};

// 원피스 색상 하위 폴더명 → color hint
const COLOR_HINT_MAP = {
  "블랙": "블랙", "화이트": "화이트", "그레이": "그레이", "네이비": "네이비",
  "베이지": "베이지", "핑크": "핑크", "그린": "그린", "블루": "블루",
  "레오파드": "레오파드", "오렌지": "오렌지", "옐로": "옐로우",
  "데님": "데님", "네온": "네온",
};

// ─── Supabase / OpenAI 클라이언트 ────────────────────────────────────────────

function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수 없음");
  return createClient(url, key, { auth: { persistSession: false } });
}

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY 환경변수 없음");
  return new OpenAI({ apiKey: key });
}

// ─── 파일 수집 ────────────────────────────────────────────────────────────────

/** 이미지 파일인지 확인 */
function isImage(filename) {
  return /\.(jpe?g|png|webp)$/i.test(filename);
}

// 폴더명에서 색상 힌트 추출 (어느 깊이든)
const COLOR_WORDS = ["블랙", "화이트", "그레이", "네이비", "베이지", "핑크", "그린", "블루",
  "레드", "옐로", "오렌지", "퍼플", "브라운", "민트", "레오파드", "데님", "네온",
  "하늘색", "보라", "스트라이프", "컬러풀"];

function extractColorFromSegments(segments) {
  for (const seg of [...segments].reverse()) {
    const trimmed = seg.trim();
    if (COLOR_WORDS.includes(trimmed)) return trimmed;
    // 앞뒤 공백 포함 매칭
    const found = COLOR_WORDS.find(c => trimmed.includes(c));
    if (found) return found;
  }
  return null;
}

// 폴더명에서 서브카테고리 힌트 추출 (2번째 레벨)
const SUBCATEGORY_WORDS = {
  "가디건": "가디건", "긴팔": "긴팔 티셔츠", "반팔": "반팔 티셔츠",
  "슬리브리스": "탱크탑", "조끼": "가디건", "후드": "후드티",
  "맨투맨": "맨투맨", "니트": "니트/스웨터", "블라우스": "블라우스",
  "셔츠": "셔츠", "크롭": "크롭탑", "FUR": "아우터",
  "golf": "스포츠 티셔츠", "yoga": "요가복",
  "점프수트": "점프수트",
};

function extractSubCategoryHint(segments) {
  // 두 번째 레벨 (index 1)이 서브카테고리인 경우가 많음
  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i].trim();
    if (SUBCATEGORY_WORDS[seg]) return SUBCATEGORY_WORDS[seg];
  }
  return null;
}

/**
 * PHOTOS_ROOT 하위에서 이미지 파일을 재귀 수집
 * @returns {{ filePath, topFolder, pathSegments, colorHint, subCategoryHint, categoryHint }[]}
 */
function collectImages() {
  const results = [];

  function recurse(dirPath, segments, categoryHint) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath    = path.join(dirPath, entry.name);
      const entryNameNFC = entry.name.normalize("NFC");

      if (entry.isFile() && isImage(entry.name)) {
        const colorHint       = extractColorFromSegments(segments);
        const subCategoryHint = extractSubCategoryHint(segments);
        results.push({
          filePath: entryPath,
          topFolder: segments[0] ?? "루트",
          pathSegments: [...segments],
          colorHint,
          subCategoryHint,
          categoryHint,
        });
      } else if (entry.isDirectory()) {
        recurse(entryPath, [...segments, entryNameNFC], categoryHint);
      }
    }
  }

  const topEntries = fs.readdirSync(PHOTOS_ROOT, { withFileTypes: true });

  for (const topEntry of topEntries) {
    // macOS는 파일시스템에 NFD로 저장 → NFC로 정규화해서 비교
    const topFolder    = topEntry.name.normalize("NFC");
    const topPath      = path.join(PHOTOS_ROOT, topEntry.name); // 실제 경로는 원본 사용
    const categoryHint = FOLDER_TO_CATEGORY[topFolder];

    // 특정 폴더만 처리 (--folder 옵션)
    if (ONLY_FOLDER && topFolder !== ONLY_FOLDER.normalize("NFC")) continue;

    if (topEntry.isFile() && isImage(topFolder)) {
      // 루트에 직접 있는 파일 (카테고리 불명)
      results.push({ filePath: topPath, topFolder: "루트", pathSegments: [], colorHint: null, subCategoryHint: null, categoryHint: null });
      continue;
    }

    if (!topEntry.isDirectory()) continue;
    if (categoryHint === null) continue; // 뷰티, 반려동물 등 건너뜀

    recurse(topPath, [topFolder], categoryHint);
  }

  return results;
}

// ─── remove.bg ───────────────────────────────────────────────────────────────

async function removeBgFromBuffer(imageBuffer, mimeType) {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) return { bgRemoved: false, buffer: imageBuffer, mimeType };

  const blob = new Blob([imageBuffer], { type: mimeType });
  const form = new FormData();
  form.append("image_file", blob, "image.jpg");
  form.append("size", "auto");
  form.append("format", "png");

  const res = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": apiKey },
    body: form,
  });

  if (!res.ok) {
    let msg = `remove.bg HTTP ${res.status}`;
    try { msg = (await res.json()).errors?.[0]?.title ?? msg; } catch {}
    throw new Error(msg);
  }

  const resultBuffer = Buffer.from(await res.arrayBuffer());
  return { bgRemoved: true, buffer: resultBuffer, mimeType: "image/png" };
}

// ─── OpenAI 분석 ─────────────────────────────────────────────────────────────

const CLOTHING_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    mainCategory:   { type: "string" },
    subCategory:    { type: "string" },
    color:          { type: "string" },
    secondaryColor: { anyOf: [{ type: "string" }, { type: "null" }] },
    season:         { type: "array", items: { type: "string", enum: ["봄", "여름", "가을", "겨울"] } },
    styleTags:      { type: "array", items: { type: "string", enum: ["미니멀", "캐주얼", "페미닌", "오피스", "스트릿", "스포티", "빈티지", "포멀", "트렌디", "로맨틱"] } },
    pattern:        { type: "string", enum: ["plain", "stripe", "check", "floral", "graphic", "dot", "animal", "abstract", "other"] },
    materialGuess:  { type: "string" },
    sleeveLength:   { anyOf: [{ type: "string", enum: ["sleeveless", "short", "3/4", "long"] }, { type: "null" }] },
    fitGuess:       { type: "string", enum: ["slim", "regular", "oversized", "wide", "fitted", "relaxed", "n/a"] },
    confidence:     { type: "number" },
    displayName:    { type: "string" },
    analysisNotes:  { type: "string" },
    needsReview:    { type: "boolean" },
  },
  required: ["mainCategory", "subCategory", "color", "secondaryColor", "season", "styleTags",
             "pattern", "materialGuess", "sleeveLength", "fitGuess", "confidence",
             "displayName", "analysisNotes", "needsReview"],
  additionalProperties: false,
};

async function analyzeImage(openai, imageBase64, mimeType, { categoryHint, colorHint, subCategoryHint } = {}) {
  const hintText = [
    categoryHint    ? `This item is from the "${categoryHint}" category.` : "",
    subCategoryHint ? `The subfolder suggests the sub-category is "${subCategoryHint}".` : "",
    colorHint       ? `The folder suggests the primary color is "${colorHint}".` : "",
  ].filter(Boolean).join(" ");

  const userText = `Please classify this clothing item according to the schema.${hintText ? " Hint: " + hintText : ""}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1024,
    messages: [
      {
        role: "system",
        content: `You are an expert clothing classifier for a Korean wardrobe management app.
Classify the main visible garment. Use Korean for mainCategory, subCategory, color, displayName, styleTags.
Valid mainCategories: 상의, 하의, 아우터, 원피스, 신발, 가방, 액세서리, 스포츠.
If category hint is provided, use it unless the image clearly contradicts it.`,
      },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: "high" } },
          { type: "text", text: userText },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "clothing_analysis", strict: true, schema: CLOTHING_ANALYSIS_SCHEMA },
    },
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI 응답 비어있음");

  const parsed = JSON.parse(raw);
  return {
    ...parsed,
    mainCategory: resolveMainCategory(parsed.mainCategory),
    subCategory:  resolveSubCategory(parsed.subCategory, resolveMainCategory(parsed.mainCategory)),
  };
}

// ─── Supabase Storage 업로드 ──────────────────────────────────────────────────

async function uploadToStorage(supabase, buffer, mimeType, storagePath) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });
  if (error) throw new Error(`Storage 업로드 실패: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return publicUrl;
}

// ─── 같은 아이템 여부 확인 ────────────────────────────────────────────────────

/**
 * 여러 이미지가 같은 아이템의 다른 각도인지 AI에게 물어봅니다.
 * @returns {{ isSameItem: boolean, reason: string }}
 */
async function checkIsSameItem(openai, buffers, mimeTypes) {
  if (buffers.length <= 1) return { isSameItem: true, reason: "single image" };

  const imageContents = buffers.map((buf, i) => ({
    type: "image_url",
    image_url: {
      url: `data:${mimeTypes[i]};base64,${buf.toString("base64")}`,
      detail: "low", // 비용 절감
    },
  }));

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 100,
    messages: [
      {
        role: "user",
        content: [
          ...imageContents,
          {
            type: "text",
            text: `Are all ${buffers.length} images showing the SAME clothing item (just from different angles or lighting)? Answer with JSON: {"isSameItem": true/false, "reason": "brief explanation"}`,
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
  });

  try {
    return JSON.parse(response.choices[0].message.content);
  } catch {
    return { isSameItem: false, reason: "parse error" };
  }
}

// ─── 단일 파일 처리 ──────────────────────────────────────────────────────────

async function processOne(supabase, openai, item, index) {
  const { filePath, topFolder, pathSegments, colorHint, subCategoryHint, categoryHint } = item;
  const filename = path.basename(filePath);
  const ts = Date.now() + index; // 중복 방지
  const pathLabel = pathSegments.join(" / ");

  console.log(`\n[${index + 1}] ${filename} (${pathLabel})`);

  if (DRY_RUN) {
    console.log(`  → DRY RUN: category=${categoryHint ?? "미지정"}, sub=${subCategoryHint ?? "미지정"}, color=${colorHint ?? "미지정"}`);
    return { file: filePath, status: "dry-run", categoryHint, subCategoryHint, colorHint };
  }

  // 1. 파일 읽기
  const rawBuffer = fs.readFileSync(filePath);
  const origMime  = /\.png$/i.test(filename) ? "image/png" : "image/jpeg";

  // 2. 원본 Storage 업로드
  const origPath   = `${USER_ID}/orig_${ts}.jpg`;
  const origUrl    = await uploadToStorage(supabase, rawBuffer, origMime, origPath);
  console.log(`  ✓ 원본 업로드: ${origPath}`);

  // 3. 배경 제거 (--skip-bg 없으면)
  let displayBuffer = rawBuffer;
  let displayMime   = origMime;
  let displayPath   = origPath;
  let displayUrl    = origUrl;
  let bgRemoved     = false;

  if (!SKIP_BG) {
    try {
      const bgResult = await removeBgFromBuffer(rawBuffer, origMime);
      if (bgResult.bgRemoved) {
        displayBuffer = bgResult.buffer;
        displayMime   = bgResult.mimeType;
        displayPath   = `${USER_ID}/${ts}.png`;
        displayUrl    = await uploadToStorage(supabase, displayBuffer, displayMime, displayPath);
        bgRemoved     = true;
        console.log(`  ✓ 배경 제거 완료: ${displayPath}`);
      }
    } catch (bgErr) {
      console.warn(`  ⚠ 배경 제거 실패 (원본 사용): ${bgErr.message}`);
    }
  }

  // 4. OpenAI 분석
  let analysis = null;
  try {
    const imageBase64 = displayBuffer.toString("base64");
    analysis = await analyzeImage(openai, imageBase64, displayMime, { categoryHint, colorHint, subCategoryHint });
    console.log(`  ✓ 분석 완료: ${analysis.displayName} (${analysis.mainCategory} / ${analysis.confidence.toFixed(2)})`);
  } catch (aiErr) {
    console.warn(`  ⚠ AI 분석 실패 (미분류로 저장): ${aiErr.message}`);
    analysis = {
      mainCategory: categoryHint ?? "상의",
      subCategory:  TAXONOMY[categoryHint ?? "상의"]?.[0] ?? "반팔 티셔츠",
      color: colorHint ?? "",
      secondaryColor: null,
      season: [],
      styleTags: [],
      pattern: "plain",
      materialGuess: "",
      sleeveLength: null,
      fitGuess: "n/a",
      confidence: 0,
      displayName: filename.replace(/\.(jpe?g|png)$/i, ""),
      analysisNotes: `AI 분석 실패: ${aiErr.message}`,
      needsReview: true,
    };
  }

  // 5. clothing_items INSERT
  const { data: inserted, error: insertError } = await supabase
    .from("clothing_items")
    .insert({
      user_id:         USER_ID,
      name:            analysis.displayName,
      display_name:    analysis.displayName,
      main_category:   analysis.mainCategory,
      sub_category:    analysis.subCategory,
      color:           analysis.color || colorHint || null,
      secondary_color: analysis.secondaryColor,
      season:          analysis.season,
      style_tags:      analysis.styleTags?.slice(0, 4) ?? [],
      image_url:       displayUrl,
      image_urls:      bgRemoved ? [origUrl] : [],  // 원본도 추가 이미지로 보관
      is_public:       false,
      is_for_sale:     false,
      sell_status:     "not_listed",
      source:          "seed",
      notes:           analysis.analysisNotes,
      // needsReview는 DB에 컬럼이 없으므로 notes에 포함
    })
    .select("id")
    .single();

  if (insertError) throw new Error(`DB 삽입 실패: ${insertError.message}`);

  console.log(`  ✓ DB 삽입 완료: id=${inserted.id}`);

  return {
    file: filePath,
    status: "ok",
    id: inserted.id,
    displayName: analysis.displayName,
    mainCategory: analysis.mainCategory,
    confidence: analysis.confidence,
    bgRemoved,
    needsReview: analysis.needsReview,
  };
}

// ─── 그룹(여러 장 → 아이템 1개) 처리 ────────────────────────────────────────

/**
 * GROUP_SIZE장을 묶어서 같은 아이템인지 확인 후 처리합니다.
 * - 같은 아이템: 대표 사진 1장으로 분석, 나머지는 image_urls에 추가
 * - 다른 아이템: 각각 별도 처리
 */
async function processGroup(supabase, openai, group, startIndex) {
  if (group.length === 1 || GROUP_SIZE === 1) {
    // 그룹핑 없음 - 개별 처리
    return processOne(supabase, openai, group[0], startIndex).catch((err) => ({
      file: group[0].filePath,
      status: "error",
      reason: err.message,
    }));
  }

  const filenames = group.map(g => path.basename(g.filePath)).join(", ");
  console.log(`\n[그룹 ${startIndex + 1}] ${filenames}`);

  // 1. 각 파일 읽기
  const buffers   = group.map(g => fs.readFileSync(g.filePath));
  const mimeTypes = group.map(g => /\.png$/i.test(g.filePath) ? "image/png" : "image/jpeg");

  // 2. 같은 아이템인지 확인
  let isSameItem = false;
  try {
    const check = await checkIsSameItem(openai, buffers, mimeTypes);
    isSameItem = check.isSameItem;
    console.log(`  → ${isSameItem ? "✅ 같은 아이템" : "❌ 다른 아이템"}: ${check.reason}`);
  } catch (err) {
    console.warn(`  ⚠ 그룹 확인 실패, 개별 처리: ${err.message}`);
  }

  if (!isSameItem) {
    // 각각 별도 아이템으로 처리
    const results = [];
    for (let i = 0; i < group.length; i++) {
      const r = await processOne(supabase, openai, group[i], startIndex + i).catch(err => ({
        file: group[i].filePath, status: "error", reason: err.message,
      }));
      results.push(r);
    }
    return results;
  }

  // ── 같은 아이템: 대표 1장 분석 + 나머지는 추가 이미지 ──────────────────────
  const ts = Date.now();
  const { categoryHint, colorHint, subCategoryHint } = group[0];

  // 3. 모든 사진 Storage에 업로드
  const uploadedUrls = [];
  for (let i = 0; i < buffers.length; i++) {
    try {
      const origPath = `${USER_ID}/orig_${ts + i}.jpg`;
      const url = await uploadToStorage(supabase, buffers[i], mimeTypes[i], origPath);
      uploadedUrls.push(url);
      console.log(`  ✓ 업로드: orig_${ts + i}.jpg`);
    } catch (err) {
      console.warn(`  ⚠ 업로드 실패 (건너뜀): ${err.message}`);
    }
  }

  if (uploadedUrls.length === 0) {
    return [{ file: group[0].filePath, status: "error", reason: "모든 업로드 실패" }];
  }

  // 4. 대표 사진 배경 제거
  let displayUrl  = uploadedUrls[0];
  let bgRemoved   = false;
  if (!SKIP_BG) {
    try {
      const bgResult = await removeBgFromBuffer(buffers[0], mimeTypes[0]);
      if (bgResult.bgRemoved) {
        const bgPath = `${USER_ID}/${ts}.png`;
        displayUrl = await uploadToStorage(supabase, bgResult.buffer, bgResult.mimeType, bgPath);
        bgRemoved  = true;
        console.log(`  ✓ 배경 제거 완료`);
      }
    } catch (err) {
      console.warn(`  ⚠ 배경 제거 실패 (원본 사용): ${err.message}`);
    }
  }

  // 5. AI 분석 (대표 사진 1장만)
  let analysis = null;
  try {
    const base64 = (bgRemoved
      ? (await removeBgFromBuffer(buffers[0], mimeTypes[0])).buffer
      : buffers[0]
    ).toString("base64");
    analysis = await analyzeImage(openai, base64, bgRemoved ? "image/png" : mimeTypes[0],
      { categoryHint, colorHint, subCategoryHint });
    console.log(`  ✓ 분석: ${analysis.displayName} (${analysis.mainCategory} / ${analysis.confidence.toFixed(2)})`);
  } catch (err) {
    console.warn(`  ⚠ AI 분석 실패: ${err.message}`);
    analysis = {
      mainCategory: categoryHint ?? "상의",
      subCategory: TAXONOMY[categoryHint ?? "상의"]?.[0] ?? "반팔 티셔츠",
      color: colorHint ?? "", secondaryColor: null,
      season: [], styleTags: [], pattern: "plain", materialGuess: "",
      sleeveLength: null, fitGuess: "n/a", confidence: 0,
      displayName: path.basename(group[0].filePath).replace(/\.(jpe?g|png)$/i, ""),
      analysisNotes: `AI 분석 실패: ${err.message}`, needsReview: true,
    };
  }

  // 6. DB INSERT — 1개 row, 나머지 사진은 image_urls
  const { data: inserted, error: insertError } = await supabase
    .from("clothing_items")
    .insert({
      user_id:         USER_ID,
      name:            analysis.displayName,
      display_name:    analysis.displayName,
      main_category:   analysis.mainCategory,
      sub_category:    analysis.subCategory,
      color:           analysis.color || colorHint || null,
      secondary_color: analysis.secondaryColor,
      season:          analysis.season,
      style_tags:      analysis.styleTags?.slice(0, 4) ?? [],
      image_url:       displayUrl,
      image_urls:      uploadedUrls, // 모든 각도 사진 보관
      is_public:       false,
      is_for_sale:     false,
      sell_status:     "not_listed",
      source:          "seed",
      notes:           `${group.length}장 그룹. ${analysis.analysisNotes}`,
    })
    .select("id")
    .single();

  if (insertError) {
    return [{ file: group[0].filePath, status: "error", reason: insertError.message }];
  }

  console.log(`  ✓ DB 삽입: id=${inserted.id} (${group.length}장 → 아이템 1개)`);
  return [{
    file: group.map(g => g.filePath).join(" | "),
    status: "ok",
    id: inserted.id,
    displayName: analysis.displayName,
    mainCategory: analysis.mainCategory,
    confidence: analysis.confidence,
    bgRemoved,
    needsReview: analysis.needsReview,
    groupSize: group.length,
  }];
}

// ─── 배치 처리 ────────────────────────────────────────────────────────────────

async function processBatch(supabase, openai, batch, startIndex) {
  // GROUP_SIZE에 따라 파일을 묶기
  const groups = [];
  for (let i = 0; i < batch.length; i += GROUP_SIZE) {
    groups.push(batch.slice(i, i + GROUP_SIZE));
  }

  const results = [];
  for (let i = 0; i < groups.length; i++) {
    const groupResults = await processGroup(supabase, openai, groups[i], startIndex + i * GROUP_SIZE);
    if (Array.isArray(groupResults)) results.push(...groupResults);
    else results.push(groupResults);
  }
  return results;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════");
  console.log("  🌿 TRUNKROOM 옷장 Seed Script");
  console.log("═══════════════════════════════════════");
  console.log(`  DRY_RUN:    ${DRY_RUN}`);
  console.log(`  SKIP_BG:    ${SKIP_BG}`);
  console.log(`  LIMIT:      ${LIMIT === Infinity ? "없음" : LIMIT}`);
  console.log(`  ONLY_FOLDER: ${ONLY_FOLDER ?? "전체"}`);
  console.log("═══════════════════════════════════════\n");

  // 클라이언트 초기화
  const supabase = getAdminClient();
  const openai   = DRY_RUN ? null : getOpenAI();

  // 사진 수집
  console.log("📂 사진 수집 중...");
  let images = collectImages();
  console.log(`   총 ${images.length}장 발견`);

  // LIMIT 적용
  if (images.length > LIMIT) {
    images = images.slice(0, LIMIT);
    console.log(`   → ${LIMIT}장으로 제한`);
  }

  if (images.length === 0) {
    console.log("처리할 사진이 없습니다.");
    return;
  }

  // 카테고리별 통계 출력
  const catStats = {};
  for (const img of images) {
    const cat = img.categoryHint ?? "미지정";
    catStats[cat] = (catStats[cat] ?? 0) + 1;
  }
  console.log("\n📊 카테고리별 분포:");
  for (const [cat, count] of Object.entries(catStats)) {
    console.log(`   ${cat}: ${count}장`);
  }

  if (DRY_RUN) {
    console.log("\n✅ DRY RUN 완료. 실제 업로드 없음.\n");
    return;
  }

  // 예상 비용
  const costPerItem = 0.02 + 0.02; // remove.bg + OpenAI ~$0.04
  console.log(`\n💰 예상 비용: ~$${(images.length * costPerItem).toFixed(2)}`);
  console.log(`⏱  예상 시간: ~${Math.ceil(images.length / BATCH_SIZE * (BATCH_DELAY / 1000 + 5))}초\n`);

  // 기존 결과 로드 (재시작 지원)
  let allResults = [];
  if (fs.existsSync(RESULTS_FILE)) {
    try {
      allResults = JSON.parse(fs.readFileSync(RESULTS_FILE, "utf-8"));
      const doneFiles = new Set(allResults.filter(r => r.status === "ok").map(r => r.file));
      const before = images.length;
      images = images.filter(img => !doneFiles.has(img.filePath));
      if (before !== images.length) {
        console.log(`⏭  이미 처리된 ${before - images.length}장 건너뜀 (재시작)\n`);
      }
    } catch {}
  }

  // 배치 처리
  let processed = 0;
  for (let i = 0; i < images.length; i += BATCH_SIZE) {
    const batch = images.slice(i, i + BATCH_SIZE);
    console.log(`\n━━━ 배치 ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(images.length / BATCH_SIZE)} ━━━`);

    const batchResults = await processBatch(supabase, openai, batch, i);
    allResults.push(...batchResults);
    processed += batch.length;

    // 중간 저장 (중단해도 안전)
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(allResults, null, 2));

    const ok    = batchResults.filter(r => r.status === "ok").length;
    const error = batchResults.filter(r => r.status === "error").length;
    console.log(`\n  배치 결과: ✅ ${ok}장 성공 / ❌ ${error}장 실패`);
    console.log(`  누적: ${processed} / ${images.length}장 처리됨`);

    // 마지막 배치가 아니면 대기
    if (i + BATCH_SIZE < images.length) {
      console.log(`  ${BATCH_DELAY / 1000}초 대기 중...`);
      await sleep(BATCH_DELAY);
    }
  }

  // 최종 요약
  const ok         = allResults.filter(r => r.status === "ok").length;
  const errors     = allResults.filter(r => r.status === "error");
  const needReview = allResults.filter(r => r.needsReview).length;

  console.log("\n═══════════════════════════════════════");
  console.log("  🏁 완료");
  console.log("═══════════════════════════════════════");
  console.log(`  ✅ 성공:        ${ok}장`);
  console.log(`  ❌ 실패:        ${errors.length}장`);
  console.log(`  ⚠️  검토 필요:   ${needReview}장`);
  console.log(`  📄 결과 파일:   ${RESULTS_FILE}`);

  if (errors.length > 0) {
    console.log("\n실패 목록:");
    errors.forEach(e => console.log(`  - ${path.basename(e.file)}: ${e.reason}`));
  }
}

main().catch((err) => {
  console.error("\n❌ 스크립트 오류:", err.message);
  process.exit(1);
});
