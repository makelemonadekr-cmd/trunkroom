/**
 * removeBg.js
 *
 * Wrapper for the remove.bg API.
 * Called only from the server — never from the browser.
 *
 * To swap providers later:
 *   1. Replace the `callRemoveBg` function body.
 *   2. Keep the same return shape: { bgRemoved, processedBase64, processedMimeType, error }.
 *
 * Env var required: REMOVE_BG_API_KEY
 */

const REMOVE_BG_ENDPOINT = "https://api.remove.bg/v1.0/removebg";

/**
 * Remove the background from an image buffer.
 *
 * @param {Buffer} imageBuffer — raw image bytes
 * @param {string} mimeType   — e.g. "image/jpeg" or "image/png"
 * @returns {Promise<{
 *   bgRemoved: boolean,
 *   processedBase64: string|null,
 *   processedMimeType: string,
 *   error: string|null
 * }>}
 */
export async function removeBg(imageBuffer, mimeType = "image/jpeg") {
  const apiKey = process.env.REMOVE_BG_API_KEY;

  if (!apiKey) {
    console.warn("[removeBg] REMOVE_BG_API_KEY is not set — skipping background removal.");
    return {
      bgRemoved: false,
      processedBase64: null,
      processedMimeType: "image/png",
      error: "REMOVE_BG_API_KEY not configured",
    };
  }

  try {
    // Build multipart form using Node 18+ native FormData + Blob
    const blob = new Blob([imageBuffer], { type: mimeType });
    const form = new FormData();
    form.append("image_file", blob, "image.jpg");
    form.append("size", "auto");
    form.append("format", "png");
    form.append("bg_color", ""); // transparent

    const res = await fetch(REMOVE_BG_ENDPOINT, {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: form,
    });

    if (!res.ok) {
      // remove.bg returns JSON on error
      let errMsg = `remove.bg HTTP ${res.status}`;
      try {
        const errBody = await res.json();
        errMsg = errBody.errors?.[0]?.title ?? errMsg;
      } catch { /* ignore */ }
      throw new Error(errMsg);
    }

    const resultBuffer = Buffer.from(await res.arrayBuffer());
    return {
      bgRemoved: true,
      processedBase64: resultBuffer.toString("base64"),
      processedMimeType: "image/png",
      error: null,
    };
  } catch (err) {
    console.error("[removeBg] error:", err.message);
    return {
      bgRemoved: false,
      processedBase64: null,
      processedMimeType: "image/png",
      error: err.message,
    };
  }
}
