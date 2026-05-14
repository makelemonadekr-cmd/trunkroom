/**
 * uploadClothing.js
 *
 * Client-side helpers for the clothing upload pipeline.
 * On web (Netlify) /api is proxied to the API server.
 * On Capacitor iOS the WebView runs at capacitor://localhost so we MUST
 * prefix with the absolute API base URL.
 */

const API_BASE = import.meta.env.VITE_AI_BASE_URL ?? "";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a File/Blob to a raw base64 string (no data-URL prefix). */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => {
      const result = reader.result;
      // Strip "data:<mime>;base64," prefix
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Background removal ───────────────────────────────────────────────────────

/**
 * Upload a File/Blob to the server for background removal.
 *
 * @param {File} file
 * @returns {Promise<{
 *   bgRemoved:         boolean,
 *   originalBase64:    string,
 *   originalMimeType:  string,
 *   processedBase64:   string|null,
 *   processedMimeType: string,
 *   error:             string|null,
 * }>}
 */
export async function uploadForBgRemoval(file, accessToken = null) {
  const form = new FormData();
  form.append("image", file);

  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  const res = await fetch(`${API_BASE}/api/remove-background`, {
    method: "POST",
    headers,
    body: form,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.json()).error ?? msg; } catch { /* ignore */ }
    const err = new Error(msg);
    if (res.status === 429) err.isRateLimit = true;
    throw err;
  }

  return res.json();
}

// ─── AI clothing analysis ─────────────────────────────────────────────────────

/**
 * Ask the server to classify a clothing image with OpenAI Vision.
 *
 * @param {string} imageBase64 — base64-encoded image (no data-URL prefix)
 * @param {string} mimeType    — e.g. "image/jpeg" or "image/png"
 * @returns {Promise<ClothingAnalysis>}
 */
export async function analyzeClothingImage(imageBase64, mimeType = "image/jpeg", accessToken = null) {
  const res = await fetch(`${API_BASE}/api/analyze-clothing`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ imageBase64, mimeType }),
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.json()).error ?? msg; } catch { /* ignore */ }
    const err = new Error(msg);
    if (res.status === 429) err.isRateLimit = true;
    throw err;
  }

  return res.json();
}

// ─── Full pipeline helper ─────────────────────────────────────────────────────

/**
 * Run the complete upload pipeline for a single clothing image:
 *   1. Upload → background removal
 *   2. Analyze the bg-removed image (or original on failure)
 *
 * Calls each onProgress callback so the UI can show step-by-step states.
 *
 * @param {File} file
 * @param {{ onBgStart, onAnalyzeStart, onDone, onError }} callbacks
 * @returns {Promise<{
 *   originalBase64:   string,
 *   originalMimeType: string,
 *   displayBase64:    string,       — bg-removed if available, else original
 *   displayMimeType:  string,
 *   bgRemoved:        boolean,
 *   analysis:         ClothingAnalysis|null,
 * }>}
 */
export async function runUploadPipeline(file, {
  onBgStart      = () => {},
  onAnalyzeStart = () => {},
  onDone         = () => {},
  onError        = () => {},
  accessToken    = null,
} = {}) {
  // Read the file once so we always have the original base64
  const originalBase64   = await fileToBase64(file);
  const originalMimeType = file.type || "image/jpeg";

  try {
    // Step 1 — background removal (best-effort; continue with original if server is down)
    onBgStart();
    let bgResult;
    try {
      bgResult = await uploadForBgRemoval(file, accessToken);
    } catch (bgErr) {
      // 429 = rate limit exceeded → propagate immediately, don't silently fall back
      if (bgErr.isRateLimit) throw bgErr;
      console.warn("[uploadPipeline] bg removal unavailable, using original:", bgErr.message);
      bgResult = {
        bgRemoved:        false,
        originalBase64,
        originalMimeType,
        processedBase64:  null,
        processedMimeType: "image/png",
        error:            bgErr.message,
      };
    }

    const displayBase64   = bgResult.bgRemoved && bgResult.processedBase64
      ? bgResult.processedBase64
      : originalBase64;
    const displayMimeType = bgResult.bgRemoved ? "image/png" : originalMimeType;

    // Step 2 — AI analysis (best-effort; continue without if server is down)
    onAnalyzeStart();
    let analysis = null;
    try {
      analysis = await analyzeClothingImage(displayBase64, displayMimeType, accessToken);
    } catch (analysisErr) {
      // 429 = rate limit exceeded → propagate immediately
      if (analysisErr.isRateLimit) throw analysisErr;
      console.warn("[uploadPipeline] analysis unavailable:", analysisErr.message);
      analysis = { success: false, error: analysisErr.message, needsReview: true };
    }

    const result = {
      originalBase64,
      originalMimeType,
      displayBase64,
      displayMimeType,
      bgRemoved: bgResult.bgRemoved,
      analysis,
    };

    onDone(result);
    return result;
  } catch (err) {
    onError(err);
    throw err;
  }
}
