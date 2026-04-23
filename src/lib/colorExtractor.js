/**
 * colorExtractor.js
 *
 * Canvas-based dominant color extraction + human-friendly Korean color naming.
 * Works entirely in the browser with no external dependencies.
 *
 * Usage:
 *   import { extractColors } from "./colorExtractor";
 *   const colors = await extractColors(dataUri, 5);
 *   // → [{ hex, r, g, b, name, category }, ...]
 */

// ─── RGB / HSL utilities ──────────────────────────────────────────────────────

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, "0"))
      .join("")
  );
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  // return [hue 0-360, saturation 0-100, lightness 0-100]
  return [h * 360, s * 100, l * 100];
}

function colorDist(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

// ─── Color naming (Korean) ────────────────────────────────────────────────────

/**
 * Maps an RGB triplet to a human-friendly Korean color name and category.
 * Uses perceptual HSL classification.
 */
export function nameColor(r, g, b) {
  const [h, s, l] = rgbToHsl(r, g, b);

  // ── Near-white ─────────────────────────────────────────────────────────────
  if (l > 90 && s < 18)  return { name: "화이트",      category: "화이트" };
  if (l > 82 && s < 14)  return { name: "오프화이트",  category: "화이트" };

  // ── Near-black ─────────────────────────────────────────────────────────────
  if (l < 14 && s < 18)  return { name: "블랙",        category: "블랙"   };
  if (l < 22 && s < 16)  return { name: "차콜",        category: "블랙"   };

  // ── Achromatic gray ────────────────────────────────────────────────────────
  if (s < 14) {
    if (l > 75)  return { name: "라이트그레이", category: "그레이" };
    if (l > 58)  return { name: "그레이",       category: "그레이" };
    if (l > 35)  return { name: "다크그레이",   category: "그레이" };
    return               { name: "차콜그레이",  category: "그레이" };
  }

  // ── Warm low-saturation (ivory / cream / beige) ────────────────────────────
  if (s < 30 && l > 78 && h >= 18 && h < 72)
    return { name: "아이보리", category: "화이트" };
  if (s < 34 && l > 70 && h >= 14 && h < 66)
    return { name: "크림",    category: "화이트" };
  if (s >= 14 && s < 44 && l > 60 && l <= 78 && h >= 18 && h < 52)
    return { name: "베이지",  category: "베이지" };
  if (s >= 24 && s < 56 && l >= 40 && l < 62 && h >= 20 && h < 48)
    return { name: "카멜",    category: "베이지" };
  if (s >= 18 && l >= 24 && l < 46 && h >= 10 && h < 42)
    return { name: "브라운",  category: "브라운" };
  if (s >= 14 && l < 28 && h >= 8 && h < 38)
    return { name: "초콜릿",  category: "브라운" };

  // ── Hue-based naming ────────────────────────────────────────────────────────
  // Red (hue wraps around 0/360)
  if (h < 12 || h >= 348) {
    if (l < 28)  return { name: "버건디",    category: "레드" };
    if (l < 42)  return { name: "와인레드",  category: "레드" };
    if (l < 60)  return { name: "레드",      category: "레드" };
    return               { name: "코랄레드", category: "레드" };
  }
  // Red-orange / brick
  if (h < 28) {
    if (l < 38)  return { name: "테라코타",    category: "오렌지" };
    if (l < 55)  return { name: "번트오렌지",  category: "오렌지" };
    return               { name: "코랄",       category: "오렌지" };
  }
  // Orange-yellow
  if (h < 50) {
    if (s < 55 && l < 52)  return { name: "머스타드",  category: "옐로우" };
    if (l < 50)             return { name: "오렌지",    category: "오렌지" };
    return                         { name: "옐로우",    category: "옐로우" };
  }
  // Yellow
  if (h < 72) {
    if (l > 72)  return { name: "라이트옐로우", category: "옐로우" };
    if (s < 50)  return { name: "머스타드",      category: "옐로우" };
    return               { name: "옐로우",       category: "옐로우" };
  }
  // Yellow-green
  if (h < 95) {
    if (s < 44)  return { name: "올리브",  category: "그린" };
    return               { name: "라임",   category: "그린" };
  }
  // Green
  if (h < 150) {
    if (s < 38)  return { name: "올리브그린", category: "그린" };
    if (l < 32)  return { name: "다크그린",   category: "그린" };
    if (l > 62)  return { name: "민트그린",   category: "그린" };
    return               { name: "그린",      category: "그린" };
  }
  // Cyan / teal
  if (h < 188) {
    if (l > 62)  return { name: "민트",  category: "그린" };
    return               { name: "틸",   category: "그린" };
  }
  // Sky blue
  if (h < 212) {
    if (l > 62)  return { name: "스카이블루",  category: "블루" };
    return               { name: "라이트블루", category: "블루" };
  }
  // Blue
  if (h < 248) {
    if (l < 28)  return { name: "네이비",      category: "블루" };
    if (l < 50)  return { name: "블루",        category: "블루" };
    return               { name: "미디엄블루", category: "블루" };
  }
  // Blue-purple / indigo
  if (h < 272) {
    if (l < 38)  return { name: "인디고",    category: "퍼플" };
    return               { name: "퍼플블루", category: "퍼플" };
  }
  // Purple
  if (h < 302) {
    if (l > 65)  return { name: "라벤더",    category: "퍼플" };
    if (l < 38)  return { name: "다크퍼플",  category: "퍼플" };
    return               { name: "퍼플",     category: "퍼플" };
  }
  // Magenta / pink-purple
  if (h < 332) {
    if (l > 65)  return { name: "라이트핑크", category: "핑크" };
    if (l > 50)  return { name: "로즈",       category: "핑크" };
    return               { name: "핫핑크",    category: "핑크" };
  }
  // Pink (332–348)
  if (l > 75)   return { name: "블러쉬핑크", category: "핑크" };
  if (l > 58)   return { name: "핑크",       category: "핑크" };
  if (l > 44)   return { name: "로즈핑크",   category: "핑크" };
  return                { name: "다크로즈",  category: "핑크" };
}

// ─── Main extraction function ─────────────────────────────────────────────────

/**
 * Extracts dominant colors from an image URL or data URI.
 *
 * Algorithm:
 *   1. Draw image to a small 100×100 canvas (fast sampling)
 *   2. Quantize each pixel's RGB to coarse BUCKET-sized bins
 *   3. Skip near-white pixels (avoids extracting image backgrounds)
 *   4. Sort bins by frequency (most dominant first)
 *   5. Greedily pick colors whose perceptual distance > MIN_DIST
 *      (avoids returning near-duplicate shades)
 *   6. Name each selected color with nameColor()
 *
 * @param {string} imageUrl   - data URI or same-origin URL
 * @param {number} count      - max number of dominant colors to return (default 5)
 * @returns {Promise<Array<{hex, r, g, b, name, category}>>}
 */
export function extractColors(imageUrl, count = 5) {
  return new Promise((resolve) => {
    if (!imageUrl) return resolve([]);

    const img    = new Image();
    const canvas = document.createElement("canvas");
    const ctx    = canvas.getContext("2d");
    if (!ctx) return resolve([]);

    img.crossOrigin = "anonymous";

    img.onload = () => {
      const SIZE     = 100; // sample grid size
      const BUCKET   = 28;  // RGB quantization bucket (larger → fewer distinct colors)
      const MIN_DIST = 52;  // minimum perceptual distance between kept colors

      canvas.width  = SIZE;
      canvas.height = SIZE;

      try {
        ctx.drawImage(img, 0, 0, SIZE, SIZE);
      } catch {
        return resolve([]);
      }

      let pixels;
      try {
        pixels = ctx.getImageData(0, 0, SIZE, SIZE).data; // Uint8ClampedArray
      } catch {
        // Tainted canvas (CORS) — fail gracefully
        return resolve([]);
      }

      // ── 1. Bucket all pixels ──────────────────────────────────────────────
      const buckets = {};
      for (let i = 0; i < pixels.length; i += 4) {
        const alpha = pixels[i + 3];
        if (alpha < 128) continue; // skip transparent

        const rr = pixels[i];
        const gg = pixels[i + 1];
        const bb = pixels[i + 2];

        // Skip near-white (common clothing-photo backgrounds)
        if (rr > 236 && gg > 236 && bb > 236) continue;
        // Skip near-black (very dark pixels don't give useful palette info)
        // We still keep dark grays — just skip pitch-black at 0,0,0
        if (rr < 8 && gg < 8 && bb < 8) continue;

        const r   = Math.round(rr / BUCKET) * BUCKET;
        const g   = Math.round(gg / BUCKET) * BUCKET;
        const b   = Math.round(bb / BUCKET) * BUCKET;
        const key = `${r},${g},${b}`;
        buckets[key] = (buckets[key] || 0) + 1;
      }

      // ── 2. Sort by frequency ──────────────────────────────────────────────
      const sorted = Object.entries(buckets).sort((a, b) => b[1] - a[1]);

      // ── 3. Deduplicate & pick top colors ─────────────────────────────────
      const result = [];
      for (const [key] of sorted) {
        if (result.length >= count) break;
        const [r, g, b]  = key.split(",").map(Number);
        const tooClose   = result.some((c) => colorDist(r, g, b, c.r, c.g, c.b) < MIN_DIST);
        if (tooClose) continue;
        const { name, category } = nameColor(r, g, b);
        result.push({ hex: rgbToHex(r, g, b), r, g, b, name, category });
      }

      resolve(result);
    };

    img.onerror = () => resolve([]);
    img.src = imageUrl;
  });
}
