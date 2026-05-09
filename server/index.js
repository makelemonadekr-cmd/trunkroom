/**
 * server/index.js
 *
 * Express API server for Trunk Room.
 * Handles all calls that require secret API keys (remove.bg, OpenAI).
 * Run alongside Vite dev server — Vite proxies /api/* here.
 *
 * Start: node server/index.js
 * Or via npm run dev:server (see package.json)
 *
 * Port: process.env.API_PORT || 3001
 */

import "dotenv/config";
import express from "express";
import multer from "multer";
import { removeBg }        from "./lib/removeBg.js";
import { analyzeClothing } from "./lib/analyzeClothing.js";
import { requireAuth }     from "./middleware/requireAuth.js";
import { checkLimit, logUsage } from "./lib/rateLimit.js";

const app  = express();
// Railway는 PORT를 자동 주입, 로컬은 API_PORT 또는 3001
const port = process.env.PORT || process.env.API_PORT || 3001;

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Netlify production + 로컬 개발 허용
const ALLOWED_ORIGINS = [
  "http://localhost:5173",        // Vite dev
  "http://localhost:4173",        // Vite preview
  process.env.FRONTEND_URL,       // Railway 환경변수로 주입 (e.g. https://trunkroom.netlify.app)
].filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin ?? "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ─── Middleware ───────────────────────────────────────────────────────────────

// JSON bodies (for /api/analyze-clothing) — 5 MB cap (이미지 압축 후 충분)
app.use(express.json({ limit: "5mb" }));

// Multipart file upload (for /api/remove-background)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/remove-background
 * 인증 필요. 무료 월 1회 / 프리미엄 20회.
 */
app.post("/api/remove-background", requireAuth, upload.single("image"), async (req, res) => {
  const userId = req.userId;

  // 1. 월간 한도 확인
  const { allowed, used, limit, isPremium } = await checkLimit(userId, "remove_background");
  if (!allowed) {
    return res.status(429).json({
      error: `이번 달 배경 제거 ${limit}회를 모두 사용했어요. 프리미엄으로 업그레이드하면 월 20회까지 이용할 수 있어요.`,
      used,
      limit,
      isPremium,
      upgradeRequired: true,
    });
  }

  // 2. 파일 확인
  if (!req.file) {
    return res.status(400).json({ error: "이미지 파일이 없어요" });
  }

  try {
    const { buffer, mimetype } = req.file;
    const originalBase64 = buffer.toString("base64");

    const result = await removeBg(buffer, mimetype);

    // 3. 사용 기록 (실제 API 호출 완료 후)
    await logUsage(userId, "remove_background", {
      success: result.bgRemoved,
      billed:  true, // remove.bg 크레딧 소모됨
    });

    return res.json({
      bgRemoved:         result.bgRemoved,
      originalBase64,
      originalMimeType:  mimetype,
      processedBase64:   result.processedBase64,
      processedMimeType: result.processedMimeType,
      error:             result.error,
      used:              used + 1,
      limit,
    });
  } catch (err) {
    console.error("[/api/remove-background] unhandled error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/analyze-clothing
 * 인증 필요. 무료 월 10회 / 프리미엄 무제한.
 */
app.post("/api/analyze-clothing", requireAuth, async (req, res) => {
  const userId = req.userId;

  // 1. 월간 한도 확인
  const { allowed, used, limit, isPremium } = await checkLimit(userId, "analyze_clothing");
  if (!allowed) {
    return res.status(429).json({
      error: `이번 달 AI 분석 ${limit}회를 모두 사용했어요. 프리미엄으로 업그레이드하면 무제한으로 이용할 수 있어요.`,
      used,
      limit,
      isPremium,
      upgradeRequired: true,
    });
  }

  // 2. 입력 확인
  const { imageBase64, mimeType } = req.body ?? {};
  if (!imageBase64) {
    return res.status(400).json({ success: false, error: "imageBase64가 필요해요" });
  }

  try {
    const result = await analyzeClothing(imageBase64, mimeType ?? "image/jpeg");

    // 3. 사용 기록 (OpenAI 호출 완료 후)
    await logUsage(userId, "analyze_clothing", {
      success: result.success,
      billed:  true, // OpenAI 토큰 소모됨
    });

    return res.json({ ...result, used: used + 1, limit });
  } catch (err) {
    console.error("[/api/analyze-clothing] unhandled error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/ai-usage
 * 이번 달 남은 AI 사용 횟수 조회 (UI 표시용).
 * 인증 필요.
 * 프리미엄 유저는 isPremium: true, remaining: null 반환.
 */
app.get("/api/ai-usage", requireAuth, async (req, res) => {
  const userId = req.userId;

  // action별 카운트를 병렬로 조회
  const [analyzeResult, removeBgResult] = await Promise.all([
    checkLimit(userId, "analyze_clothing"),
    checkLimit(userId, "remove_background"),
  ]);

  const isPremium = analyzeResult.isPremium;

  const analyzeRemaining  = isPremium ? null : Math.max(0, analyzeResult.limit  - analyzeResult.used);
  const removeBgRemaining = isPremium ? null : Math.max(0, removeBgResult.limit - removeBgResult.used);

  res.json({
    isPremium,
    // top-level 요약: 두 action 중 더 많이 쓴 쪽 기준
    used:      isPremium ? 0 : analyzeResult.used + removeBgResult.used,
    limit:     isPremium ? null : analyzeResult.limit + removeBgResult.limit,
    remaining: isPremium ? null : analyzeRemaining + removeBgRemaining,
    // action별 상세
    analyze: {
      used:      isPremium ? 0 : analyzeResult.used,
      limit:     isPremium ? null : analyzeResult.limit,
      remaining: analyzeRemaining,
    },
    removeBg: {
      used:      isPremium ? 0 : removeBgResult.used,
      limit:     isPremium ? null : removeBgResult.limit,
      remaining: removeBgRemaining,
    },
  });
});

// ─── Health check ─────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({
    ok:              true,
    openai:          !!process.env.OPENAI_API_KEY,
    removeBg:        !!process.env.REMOVE_BG_API_KEY,
    rateLimitActive: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`);
  if (!process.env.OPENAI_API_KEY)            console.warn("[server] ⚠️  OPENAI_API_KEY not set");
  if (!process.env.REMOVE_BG_API_KEY)         console.warn("[server] ⚠️  REMOVE_BG_API_KEY not set");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) console.warn("[server] ⚠️  SUPABASE_SERVICE_ROLE_KEY not set — rate limiting disabled");
});
