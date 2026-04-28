/**
 * storageService.js
 *
 * Supabase Storage helpers for clothing images.
 *
 * Bucket: "clothing-images"
 * Path format: "{userId}/{timestamp}.{ext}"
 */

import { supabase }             from "../lib/supabase.js";
import {
  MAX_UPLOAD_BYTES,
  ACCEPTED_IMAGE_TYPES,
} from "../lib/imageUtils.js";

export const CLOTHING_BUCKET = "clothing-images";

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Validate a raw base64 payload before uploading to Storage.
 * Checks MIME type and approximate decoded byte size.
 *
 * @param {string} base64
 * @param {string} mimeType
 * @returns {{ valid: boolean, error: string|null }}
 */
function validateBase64Upload(base64, mimeType) {
  // MIME type check (allow heic/heif loosely)
  const allowedMime = [...ACCEPTED_IMAGE_TYPES, "image/heic", "image/heif"];
  if (!allowedMime.includes(mimeType)) {
    return {
      valid: false,
      error: `지원하지 않는 파일 형식이에요 (${mimeType || "unknown"}). jpg, png, webp, heic 만 허용돼요.`,
    };
  }
  // Approximate decoded byte size: base64 length × 0.75
  const approxBytes = Math.round(base64.length * 0.75);
  if (approxBytes > MAX_UPLOAD_BYTES) {
    const mb = (approxBytes / 1024 / 1024).toFixed(1);
    return {
      valid: false,
      error: `파일이 너무 커요 (약 ${mb}MB). 10MB 이하 이미지만 업로드할 수 있어요.`,
    };
  }
  return { valid: true, error: null };
}

/**
 * Upload a base64-encoded image to Supabase Storage.
 *
 * @param {string} userId   — auth.users.id of the owner
 * @param {string} base64   — raw base64, NO "data:..." prefix
 * @param {string} mimeType — e.g. "image/jpeg" | "image/png"
 * @returns {Promise<{ url: string|null, path: string|null, error: Error|null }>}
 */
export async function uploadClothingImage(userId, base64, mimeType) {
  // ── 검증 ───────────────────────────────────────────────────────────────────
  const { valid, error: validErr } = validateBase64Upload(base64, mimeType);
  if (!valid) return { url: null, path: null, error: new Error(validErr) };

  try {
    // Decode base64 → Uint8Array → Blob
    const byteChars = atob(base64);
    const bytes     = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
    const blob = new Blob([bytes], { type: mimeType });

    const ext  = mimeType === "image/png" ? "png" : "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from(CLOTHING_BUCKET)
      .upload(path, blob, { contentType: mimeType, upsert: false });

    if (uploadErr) return { url: null, path: null, error: uploadErr };

    const { data } = supabase.storage.from(CLOTHING_BUCKET).getPublicUrl(path);
    return { url: data.publicUrl, path, error: null };
  } catch (err) {
    return {
      url: null,
      path: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Delete an image from Supabase Storage by its storage path.
 *
 * @param {string} path — e.g. "userId/1234567890.jpg"
 * @returns {Promise<{ error: Error|null }>}
 */
export async function deleteClothingImage(path) {
  const { error } = await supabase.storage.from(CLOTHING_BUCKET).remove([path]);
  return { error };
}

/**
 * Upload a stylebook cover photo from a data URL.
 * Stored under "{userId}/styles/{timestamp}.{ext}" in the clothing-images bucket.
 *
 * @param {string} userId
 * @param {string} dataUrl — "data:image/jpeg;base64,..."
 * @returns {Promise<{ url: string|null, error: Error|null }>}
 */
export async function uploadStylePhoto(userId, dataUrl) {
  try {
    const res  = await fetch(dataUrl);
    const blob = await res.blob();

    // ── 크기 검증 ─────────────────────────────────────────────────────────────
    if (blob.size > MAX_UPLOAD_BYTES) {
      const mb = (blob.size / 1024 / 1024).toFixed(1);
      return {
        url:   null,
        error: new Error(`스타일 사진이 너무 커요 (${mb}MB). 10MB 이하만 업로드할 수 있어요.`),
      };
    }

    const ext  = blob.type === "image/png" ? "png" : "jpg";
    const path = `${userId}/styles/${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from(CLOTHING_BUCKET)
      .upload(path, blob, { contentType: blob.type, upsert: false });

    if (uploadErr) return { url: null, error: uploadErr };

    const { data } = supabase.storage.from(CLOTHING_BUCKET).getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  } catch (err) {
    return { url: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
