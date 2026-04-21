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
import { removeBg } from "./lib/removeBg.js";
import { analyzeClothing } from "./lib/analyzeClothing.js";

const app  = express();
const port = process.env.API_PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────

// JSON bodies (for /api/analyze-clothing)
app.use(express.json({ limit: "20mb" }));

// Multipart file upload (for /api/remove-background)
// Store in memory — files are small enough (~5 MB typical)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB hard cap
});

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/remove-background
 *
 * Multipart form body:
 *   image  — the image file
 *
 * Response JSON:
 *   {
 *     bgRemoved:          boolean
 *     originalBase64:     string      (base64 of the original file)
 *     originalMimeType:   string
 *     processedBase64:    string|null (base64 of the bg-removed PNG, or null on failure)
 *     processedMimeType:  "image/png"
 *     error:              string|null
 *   }
 */
app.post("/api/remove-background", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const { buffer, mimetype } = req.file;
    const originalBase64 = buffer.toString("base64");

    const result = await removeBg(buffer, mimetype);

    return res.json({
      bgRemoved:         result.bgRemoved,
      originalBase64,
      originalMimeType:  mimetype,
      processedBase64:   result.processedBase64,
      processedMimeType: result.processedMimeType,
      error:             result.error,
    });
  } catch (err) {
    console.error("[/api/remove-background] unhandled error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/analyze-clothing
 *
 * JSON body:
 *   {
 *     imageBase64: string   — base64-encoded image
 *     mimeType:    string   — e.g. "image/jpeg" or "image/png"
 *   }
 *
 * Response JSON: ClothingAnalysis object (see analyzeClothing.js)
 */
app.post("/api/analyze-clothing", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body ?? {};

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: "imageBase64 is required" });
    }

    const result = await analyzeClothing(imageBase64, mimeType ?? "image/jpeg");
    return res.json(result);
  } catch (err) {
    console.error("[/api/analyze-clothing] unhandled error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Health check ─────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    openai:   !!process.env.OPENAI_API_KEY,
    removeBg: !!process.env.REMOVE_BG_API_KEY,
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`);
  if (!process.env.OPENAI_API_KEY)   console.warn("[server] OPENAI_API_KEY not set — AI analysis disabled");
  if (!process.env.REMOVE_BG_API_KEY) console.warn("[server] REMOVE_BG_API_KEY not set — background removal disabled");
});
