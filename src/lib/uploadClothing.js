/**
 * uploadClothing.js
 *
 * Client-side helpers for the clothing upload pipeline.
 * All calls hit the Express API server via Vite's /api proxy.
 * Secret keys never leave the server.
 */

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
export async function uploadForBgRemoval(file) {
  const form = new FormData();
  form.append("image", file);

  const res = await fetch("/api/remove-background", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.json()).error ?? msg; } catch { /* ignore */ }
    throw new Error(msg);
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
export async function analyzeClothingImage(imageBase64, mimeType = "image/jpeg") {
  const res = await fetch("/api/analyze-clothing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, mimeType }),
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.json()).error ?? msg; } catch { /* ignore */ }
    throw new Error(msg);
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
} = {}) {
  try {
    // Step 1 — background removal
    onBgStart();
    const bgResult = await uploadForBgRemoval(file);

    const displayBase64  = bgResult.bgRemoved && bgResult.processedBase64
      ? bgResult.processedBase64
      : bgResult.originalBase64;
    const displayMimeType = bgResult.bgRemoved ? "image/png" : bgResult.originalMimeType;

    // Step 2 — AI analysis (using the display image)
    onAnalyzeStart();
    let analysis = null;
    try {
      analysis = await analyzeClothingImage(displayBase64, displayMimeType);
    } catch (analysisErr) {
      console.warn("[uploadPipeline] analysis failed, continuing without:", analysisErr.message);
      analysis = { success: false, error: analysisErr.message, needsReview: true };
    }

    const result = {
      originalBase64:   bgResult.originalBase64,
      originalMimeType: bgResult.originalMimeType,
      displayBase64,
      displayMimeType,
      bgRemoved:        bgResult.bgRemoved,
      analysis,
    };

    onDone(result);
    return result;
  } catch (err) {
    onError(err);
    throw err;
  }
}
