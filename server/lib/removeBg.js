/**
 * removeBg.js
 *
 * Wrapper for the Photoroom Segment API.
 * Called only from the server — never from the browser.
 *
 * Env var required: PHOTOROOM_API_KEY
 */

const PHOTOROOM_ENDPOINT = "https://sdk.photoroom.com/v1/segment";

/**
 * Remove the background from an image buffer using Photoroom Segment API.
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
  const apiKey = process.env.PHOTOROOM_API_KEY;

  if (!apiKey) {
    console.warn("[removeBg] PHOTOROOM_API_KEY is not set — skipping background removal.");
    return {
      bgRemoved: false,
      processedBase64: null,
      processedMimeType: "image/png",
      error: "PHOTOROOM_API_KEY not configured",
    };
  }

  try {
    const blob = new Blob([imageBuffer], { type: mimeType });
    const form = new FormData();
    form.append("image_file", blob, "image.jpg");

    const res = await fetch(PHOTOROOM_ENDPOINT, {
      method: "POST",
      headers: { "x-api-key": apiKey },
      body: form,
    });

    if (!res.ok) {
      let errMsg = `Photoroom HTTP ${res.status}`;
      try {
        const errBody = await res.json();
        errMsg = errBody.message ?? errBody.error ?? errMsg;
      } catch { /* ignore */ }
      throw new Error(errMsg);
    }

    // Photoroom returns PNG binary directly
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
