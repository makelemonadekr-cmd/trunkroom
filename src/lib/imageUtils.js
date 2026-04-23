/**
 * imageUtils.js
 *
 * Shared image processing utilities used across the app.
 *
 * ─── CAPABILITIES ────────────────────────────────────────────────────────────
 *  - Unsplash URL generation with consistent quality params
 *  - Client-side image compression before upload (quality + max-dimension)
 *  - Data URL ↔ Blob conversion helpers
 *  - Aspect-ratio safe resize for canvas placements
 *  - Placeholder color generation from image URL (for blur-up effect)
 *  - MIME type validation
 *
 * ─── FUTURE AI INTEGRATION ──────────────────────────────────────────────────
 *  Replace `compressImage()` with a server-side optimized endpoint when
 *  image quality is critical (e.g. for outfit generation / model training).
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const MAX_UPLOAD_BYTES     = 20 * 1024 * 1024; // 20 MB
export const MAX_COMPRESSED_DIM   = 1200;              // px — max side after compression
export const COMPRESS_QUALITY     = 0.85;              // JPEG quality for uploads
export const THUMBNAIL_DIM        = 400;               // px — coordi thumbnails
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

// ─── Unsplash URL helpers ─────────────────────────────────────────────────────

/**
 * Build an optimized Unsplash URL.
 * Adds auto=format (WebP on supporting browsers), fit=crop, quality, and width.
 *
 * @param {string} baseUrl  - Unsplash photo URL (with or without params)
 * @param {number} [w=600]  - Desired width in px
 * @param {number} [q=85]   - Quality 1–100
 * @returns {string}
 */
export function unsplashUrl(baseUrl, w = 600, q = 85) {
  if (!baseUrl) return "";
  // Local assets (start with "/" or are data URLs) — return as-is, no Unsplash params needed
  if (!baseUrl.includes("unsplash.com")) return baseUrl;
  // Strip any existing query params from Unsplash URLs and rebuild cleanly
  const [base] = baseUrl.split("?");
  return `${base}?w=${w}&q=${q}&fit=crop&auto=format`;
}

/**
 * Get a responsive srcSet for an Unsplash image.
 *
 * @param {string} baseUrl
 * @returns {string} — srcSet string for <img>
 */
export function unsplashSrcSet(baseUrl) {
  if (!baseUrl || !baseUrl.includes("unsplash.com")) return "";
  const [base] = baseUrl.split("?");
  return [300, 600, 900, 1200]
    .map((w) => `${base}?w=${w}&q=80&fit=crop&auto=format ${w}w`)
    .join(", ");
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Check if a file is a valid image type and within the size limit.
 *
 * @param {File} file
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateImageFile(file) {
  if (!file) return { valid: false, error: "파일이 없어요" };
  if (file.size > MAX_UPLOAD_BYTES) {
    return { valid: false, error: `파일 크기는 20MB 이하여야 해요 (현재: ${(file.size / 1024 / 1024).toFixed(1)}MB)` };
  }
  // HEIC/HEIF check by extension (MIME type may be application/octet-stream on some browsers)
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "heic" || ext === "heif") return { valid: true, error: null };
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: `지원하지 않는 파일 형식이에요 (${file.type || "unknown"})` };
  }
  return { valid: true, error: null };
}

// ─── Compression ──────────────────────────────────────────────────────────────

/**
 * Compress an image file to a JPEG/PNG data URL.
 * Preserves transparency for PNGs (does not convert to JPEG if PNG).
 *
 * @param {File|Blob} file
 * @param {object}    [opts]
 * @param {number}    [opts.maxDim=1200]    - Max dimension in px
 * @param {number}    [opts.quality=0.85]   - JPEG quality 0–1
 * @param {boolean}   [opts.forceJpeg=false]- Force JPEG output (drops alpha)
 * @returns {Promise<{ dataUrl: string, mimeType: string, width: number, height: number, bytes: number }>}
 */
export function compressImage(file, {
  maxDim    = MAX_COMPRESSED_DIM,
  quality   = COMPRESS_QUALITY,
  forceJpeg = false,
} = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("파일을 읽을 수 없어요"));
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = () => reject(new Error("이미지를 불러올 수 없어요"));
      img.onload = () => {
        const { naturalWidth: w, naturalHeight: h } = img;

        // Scale to maxDim while keeping aspect ratio
        let tw = w, th = h;
        if (w > maxDim || h > maxDim) {
          if (w >= h) { tw = maxDim; th = Math.round((h / w) * maxDim); }
          else        { th = maxDim; tw = Math.round((w / h) * maxDim); }
        }

        const canvas = document.createElement("canvas");
        canvas.width  = tw;
        canvas.height = th;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, tw, th);

        const isPng     = !forceJpeg && (file.type === "image/png");
        const mimeType  = isPng ? "image/png" : "image/jpeg";
        const dataUrl   = canvas.toDataURL(mimeType, isPng ? undefined : quality);
        const bytes     = Math.round((dataUrl.length - 22) * 0.75); // approx decoded size

        resolve({ dataUrl, mimeType, width: tw, height: th, bytes });
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Compress specifically for thumbnails (smaller output, slightly higher compression).
 *
 * @param {File|Blob|string} fileOrDataUrl
 * @returns {Promise<string>} dataUrl
 */
export async function makeThumbnail(fileOrDataUrl) {
  if (typeof fileOrDataUrl === "string") {
    // Compress from data URL by creating a Blob
    const res  = await fetch(fileOrDataUrl);
    const blob = await res.blob();
    const { dataUrl } = await compressImage(blob, { maxDim: THUMBNAIL_DIM, quality: 0.80, forceJpeg: true });
    return dataUrl;
  }
  const { dataUrl } = await compressImage(fileOrDataUrl, { maxDim: THUMBNAIL_DIM, quality: 0.80, forceJpeg: true });
  return dataUrl;
}

// ─── Data URL helpers ─────────────────────────────────────────────────────────

/**
 * Extract base64 string and MIME type from a data URL.
 *
 * @param {string} dataUrl - "data:image/jpeg;base64,..."
 * @returns {{ base64: string, mimeType: string }}
 */
export function parseDataUrl(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mimeType = header.match(/data:([^;]+)/)?.[1] ?? "image/jpeg";
  return { base64, mimeType };
}

/**
 * Build a data URL from base64 + mimeType.
 *
 * @param {string} base64
 * @param {string} [mimeType="image/jpeg"]
 * @returns {string}
 */
export function buildDataUrl(base64, mimeType = "image/jpeg") {
  if (!base64) return "";
  if (base64.startsWith("data:")) return base64;
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Convert a data URL to a File object.
 *
 * @param {string} dataUrl
 * @param {string} [filename="image.jpg"]
 * @returns {File}
 */
export function dataUrlToFile(dataUrl, filename = "image.jpg") {
  const { base64, mimeType } = parseDataUrl(dataUrl);
  const binary  = atob(base64);
  const bytes   = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mimeType });
}

// ─── Aspect-ratio helpers (for canvas / editor) ───────────────────────────────

/**
 * Calculate fit dimensions within a container, preserving aspect ratio.
 * Useful for placing items on the coordi canvas.
 *
 * @param {number} srcW  - Source image width
 * @param {number} srcH  - Source image height
 * @param {number} maxW  - Container max width
 * @param {number} maxH  - Container max height
 * @param {number} [pct=0.45] - Fraction of the smaller dimension to use as target
 * @returns {{ width: number, height: number }}
 */
export function fitDimensions(srcW, srcH, maxW, maxH, pct = 0.45) {
  const targetMax = Math.min(maxW, maxH) * pct;
  const ratio = srcW / srcH;
  let w = targetMax, h = targetMax;
  if (ratio > 1) h = w / ratio;
  else           w = h * ratio;
  return { width: Math.round(w), height: Math.round(h) };
}

// ─── Color extraction (placeholder colors) ───────────────────────────────────

/**
 * Generate a stable placeholder color from a string (image URL or ID).
 * Used for skeleton loading states.
 *
 * @param {string} seed
 * @returns {string} CSS hex color
 */
export function placeholderColor(seed = "") {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 12%, 92%)`; // muted, light — works as image placeholder
}

// ─── Image load state machine ─────────────────────────────────────────────────

/**
 * Preload an image and return a promise.
 * Useful for preloading images before showing a modal.
 *
 * @param {string} src
 * @returns {Promise<HTMLImageElement>}
 */
export function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
}

// ─── Background removal (client-side brightness-based) ───────────────────────
//
// This is a lightweight local approximation.
// For production quality, use the server-side remove.bg integration
// via uploadClothing.js → /api/remove-background.

/**
 * Remove near-white backgrounds from an image using canvas pixel manipulation.
 * Works best on product-style images with clean backgrounds.
 *
 * @param {string} src - Image src (URL or data URL, must be CORS-accessible)
 * @param {object} [opts]
 * @param {number} [opts.threshold=235]  - Brightness threshold (0–255)
 * @param {number} [opts.tolerance=40]   - Max RGB channel spread for "white" detection
 * @param {number} [opts.edgeSoftness=8] - Feather edge in pixels (higher = softer)
 * @returns {Promise<string>} PNG data URL with transparent background
 */
export async function removeBackgroundLocal(src, {
  threshold    = 235,
  tolerance    = 40,
  edgeSoftness = 8,
} = {}) {
  const img = await preloadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width  = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const brightness = (r + g + b) / 3;
    const spread     = Math.max(r, g, b) - Math.min(r, g, b);

    if (brightness > threshold && spread < tolerance) {
      // Fully transparent
      data[i + 3] = 0;
    } else if (brightness > threshold - edgeSoftness && spread < tolerance + 15) {
      // Soft edge — partial alpha
      const t = (brightness - (threshold - edgeSoftness)) / edgeSoftness;
      data[i + 3] = Math.floor(data[i + 3] * (1 - t));
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}
