/**
 * aiService.js
 *
 * Unified AI service layer with mock implementations.
 * All functions here have stable interfaces that the UI depends on.
 *
 * ─── TO CONNECT REAL AI APIS ─────────────────────────────────────────────────
 *  1. Background removal: Replace `mockRemoveBackground` with a call to
 *     `/api/remove-background` (already implemented in server/).
 *
 *  2. Clothing analysis: Replace `mockAnalyzeClothing` with a call to
 *     `/api/analyze-clothing` (already implemented in server/).
 *
 *  3. Outfit recommendation: When ready, add POST /api/recommend-outfit
 *     and replace `mockRecommendOutfit` below.
 *
 *  4. Natural-language search: Add POST /api/search-closet and replace
 *     `mockNaturalLanguageSearch` below.
 *
 *  5. Style suggestions: Add POST /api/style-suggestions and replace
 *     `mockStyleSuggestions` below.
 *
 * ─── ENVIRONMENT VARIABLES (add to .env) ────────────────────────────────────
 *  VITE_AI_ENABLED=true          → enables real AI calls (future use)
 *  VITE_AI_BASE_URL=http://localhost:3001   → server base URL
 *
 * ─── ARCHITECTURE NOTES ──────────────────────────────────────────────────────
 *  - All functions return { success, data, error } envelope
 *  - Loading/error states are handled by the useAI() hook (see below)
 *  - Mock implementations add realistic delays to simulate real latency
 *  - Real implementations should match the same response shape
 */

// ─── Config ───────────────────────────────────────────────────────────────────

const AI_ENABLED = import.meta.env.VITE_AI_ENABLED === "true";
const BASE_URL   = import.meta.env.VITE_AI_BASE_URL ?? "";

// Toast helper — imported lazily to avoid circular deps at module load time
function fireErrorToast(msg) {
  // Dynamic import so this file can be used in non-browser contexts too
  import("../../lib/toastUtils").then(({ showToast }) => showToast(msg, "error")).catch(() => {});
}

// ─── Type definitions (JSDoc) ─────────────────────────────────────────────────

/**
 * @typedef {Object} AIResult
 * @property {boolean} success
 * @property {*}       data
 * @property {string|null} error
 * @property {boolean} [isMock]
 */

/**
 * @typedef {Object} ClothingAnalysisResult
 * @property {boolean} success
 * @property {string}  mainCategory    - Korean main category (e.g. "상의")
 * @property {string}  subCategory     - Korean sub category (e.g. "긴팔 티셔츠")
 * @property {string}  displayName     - Short display name
 * @property {string}  color           - Primary color (Korean)
 * @property {string}  [secondaryColor]
 * @property {string[]} season         - Array of ["봄", "여름", "가을", "겨울"]
 * @property {string[]} styleTags      - Style keywords
 * @property {number}  confidence      - 0.0–1.0
 * @property {boolean} needsReview     - true if confidence < 0.7
 * @property {string}  [analysisNotes]
 * @property {boolean} [isMock]
 */

/**
 * @typedef {Object} OutfitRecommendationRequest
 * @property {object[]} closetItems   - User's closet items
 * @property {object}   weatherCtx    - WeatherContext from weatherRecommendation.js
 * @property {string[]} [stylePrefs]  - User's preferred styles
 * @property {string}   [occasion]    - "daily" | "work" | "date" | "sport" | "party"
 */

/**
 * @typedef {Object} SearchRequest
 * @property {string}   query         - Natural language query
 * @property {object[]} closetItems   - Items to search within
 */

// ─── Internal helpers ─────────────────────────────────────────────────────────

function mockDelay(ms = 600) {
  return new Promise((r) => setTimeout(r, ms));
}

function ok(data, isMock = true) {
  return { success: true, data, error: null, isMock };
}

function fail(error) {
  return { success: false, data: null, error: String(error) };
}

async function serverPost(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await res.json().then((d) => d.error).catch(() => `HTTP ${res.status}`);
    throw new Error(msg);
  }
  return res.json();
}

// ─── 1. Background removal ────────────────────────────────────────────────────
//
// REAL IMPLEMENTATION: POST /api/remove-background (multipart form)
// Already built in server/lib/removeBg.js + server/index.js
//
// Connect by: passing a File to uploadForBgRemoval() from lib/uploadClothing.js
// The real path is already wired; this mock is for cases where the server is down.

/**
 * Remove background from a clothing image.
 *
 * @param {File|string} fileOrBase64
 * @returns {Promise<AIResult>}
 */
export async function removeBackground(fileOrBase64) {
  if (AI_ENABLED) {
    try {
      // Real: handled by uploadClothing.js → /api/remove-background
      // This branch is for direct service layer usage
      const form = new FormData();
      if (typeof fileOrBase64 === "string") {
        const blob = await fetch(fileOrBase64).then((r) => r.blob());
        form.append("image", blob, "image.jpg");
      } else {
        form.append("image", fileOrBase64);
      }
      const res = await fetch(`${BASE_URL}/api/remove-background`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return ok(data, false);
    } catch (err) {
      fireErrorToast("배경 제거 중 오류가 발생했어요");
      return fail(err.message);
    }
  }

  // Mock — simulate processing delay with a passthrough result
  await mockDelay(1200);
  return ok({
    bgRemoved:         false,
    processedBase64:   null,
    originalBase64:    null,
    isMock:            true,
    message:           "배경 제거는 서버 연결 후 사용 가능해요",
  });
}

// ─── 2. Clothing image analysis ───────────────────────────────────────────────
//
// REAL IMPLEMENTATION: POST /api/analyze-clothing
// Already built in server/lib/analyzeClothing.js
//
// Connect by: calling analyzeClothingImage() from lib/uploadClothing.js

/**
 * Analyze a clothing image and return structured metadata.
 *
 * @param {string} imageBase64
 * @param {string} [mimeType="image/jpeg"]
 * @returns {Promise<AIResult<ClothingAnalysisResult>>}
 */
export async function analyzeClothing(imageBase64, mimeType = "image/jpeg") {
  if (AI_ENABLED) {
    try {
      const data = await serverPost("/api/analyze-clothing", { imageBase64, mimeType });
      return ok(data, false);
    } catch (err) {
      fireErrorToast("AI 분석 중 오류가 발생했어요");
      return fail(err.message);
    }
  }

  await mockDelay(1800);
  return ok({
    success:       true,
    mainCategory:  "상의",
    subCategory:   "긴팔 티셔츠",
    displayName:   "긴팔 티셔츠",
    color:         "화이트",
    season:        ["봄", "가을"],
    styleTags:     ["캐주얼", "미니멀"],
    confidence:    0.82,
    needsReview:   false,
    analysisNotes: "Mock result — connect OpenAI server to get real analysis",
    isMock:        true,
  });
}

// ─── 3. Outfit recommendation (AI-enhanced) ───────────────────────────────────
//
// REAL IMPLEMENTATION: POST /api/recommend-outfit  ← NOT YET BUILT
//
// When ready:
//   server/lib/recommendOutfit.js — uses GPT-4o with closet + weather context
//   Returns: { outfitPieces, reasoning, styleLabel, confidence }
//
// For now: delegates to local weatherRecommendation.js (rule-based).

/**
 * Get AI-enhanced outfit recommendation based on closet + weather.
 *
 * @param {OutfitRecommendationRequest} req
 * @returns {Promise<AIResult>}
 */
export async function recommendOutfit(req) {
  if (AI_ENABLED) {
    try {
      const data = await serverPost("/api/recommend-outfit", req);
      return ok(data, false);
    } catch (err) {
      // Fallback to local rule-based (graceful degradation) — no toast, silent fallback
      console.warn("[aiService] recommend-outfit failed, using local fallback:", err.message);
    }
  }

  // Local fallback (always available)
  const { getWeatherOutfitRec, buildWeatherContext } = await import(
    "../weatherRecommendation.js"
  );
  const ctx = buildWeatherContext(req.weatherCtx);
  const rec = getWeatherOutfitRec(ctx);
  return ok({ ...rec, isMock: true, source: "local-rules" });
}

// ─── 4. Natural-language closet search ───────────────────────────────────────
//
// REAL IMPLEMENTATION: POST /api/search-closet  ← NOT YET BUILT
//
// When ready:
//   server/lib/searchCloset.js — uses embeddings or GPT-4o with item descriptions
//   Returns: { items: ClosetItem[], query_understanding: string }

/**
 * Search closet items using natural language.
 *
 * @param {SearchRequest} req
 * @returns {Promise<AIResult>}
 */
export async function naturalLanguageSearch(req) {
  if (AI_ENABLED) {
    try {
      const data = await serverPost("/api/search-closet", req);
      return ok(data, false);
    } catch (err) {
      console.warn("[aiService] search-closet failed, using local fallback:", err.message);
    }
  }

  // Local fallback: simple keyword match
  await mockDelay(200);
  const q = req.query.toLowerCase();
  const matched = (req.closetItems ?? []).filter((item) => {
    const haystack = [
      item.displayName, item.name, item.mainCategory, item.subCategory,
      item.color, ...(item.styleTags ?? []), ...(item.tags ?? []),
    ].join(" ").toLowerCase();
    return q.split(/\s+/).some((word) => haystack.includes(word));
  });
  return ok({ items: matched, isMock: true, queryUnderstanding: `"${req.query}" 키워드 검색` });
}

// ─── 5. Style suggestions ─────────────────────────────────────────────────────
//
// REAL IMPLEMENTATION: POST /api/style-suggestions  ← NOT YET BUILT
//
// When ready:
//   server/lib/styleSuggestions.js — uses GPT-4o with closet analysis
//   Returns: { suggestions: StyleSuggestion[], insights: string[] }

/**
 * Get personalized style suggestions based on closet analysis.
 *
 * @param {{ closetItems: ClosetItem[], userProfile: object }} req
 * @returns {Promise<AIResult>}
 */
export async function getStyleSuggestions(req) {
  if (AI_ENABLED) {
    try {
      const data = await serverPost("/api/style-suggestions", req);
      return ok(data, false);
    } catch (err) {
      console.warn("[aiService] style-suggestions failed:", err.message);
    }
  }

  await mockDelay(800);

  // Compute basic stats from closet
  const items     = req.closetItems ?? [];
  const catCounts = {};
  items.forEach((i) => {
    catCounts[i.mainCategory] = (catCounts[i.mainCategory] ?? 0) + 1;
  });
  const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "상의";

  return ok({
    isMock: true,
    insights: [
      `${topCat} 아이템이 가장 많아요`,
      "색상 팔레트가 뉴트럴 톤 위주예요",
      "캐주얼 스타일 아이템 비중이 높아요",
    ],
    suggestions: [
      { label: "포인트 아이템 추가", desc: "악세서리 한 가지로 전체 스타일을 살릴 수 있어요", priority: "high" },
      { label: "아우터 다양화",      desc: "다양한 소재의 아우터가 있으면 스타일 폭이 넓어져요", priority: "medium" },
    ],
  });
}

// ─── 6. Item tagging from image ───────────────────────────────────────────────
//
// REAL IMPLEMENTATION: Uses analyzeClothing() → same endpoint
// This is a convenience wrapper that returns only the tag-relevant fields.

/**
 * Auto-tag a clothing image (returns styleTags + season + category).
 *
 * @param {string} imageBase64
 * @returns {Promise<AIResult>}
 */
export async function autoTagImage(imageBase64) {
  const result = await analyzeClothing(imageBase64);
  if (!result.success) return result;
  const { styleTags, season, mainCategory, subCategory, confidence } = result.data;
  return ok({ styleTags, season, mainCategory, subCategory, confidence, isMock: result.isMock });
}
