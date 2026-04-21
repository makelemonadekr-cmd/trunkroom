/**
 * analyzeClothing.js
 *
 * Calls OpenAI Vision with structured JSON output to classify a clothing item.
 * Called only from the server — never from the browser.
 *
 * To swap AI providers later:
 *   1. Replace the `callOpenAI` helper.
 *   2. Keep the same return shape that maps to `CLOTHING_ANALYSIS_SCHEMA`.
 *
 * Env var required: OPENAI_API_KEY
 */

import OpenAI from "openai";
import {
  MAIN_CATEGORIES,
  ALL_SUBCATEGORIES,
  TAXONOMY,
  resolveMainCategory,
  resolveSubCategory,
} from "./categoryMapping.js";

// ─── OpenAI JSON schema for structured output ─────────────────────────────────

const CLOTHING_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    mainCategory: {
      type: "string",
      description: `Must be one of: ${MAIN_CATEGORIES.join(", ")}`,
    },
    subCategory: {
      type: "string",
      description: `Must match the taxonomy for the chosen mainCategory. Valid values per category: ${
        Object.entries(TAXONOMY)
          .map(([cat, subs]) => `${cat}: [${subs.join(", ")}]`)
          .join("; ")
      }`,
    },
    color: { type: "string", description: "Primary color in Korean (e.g. 화이트, 블랙, 베이지)" },
    secondaryColor: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description: "Secondary/accent color in Korean, or null if solid color",
    },
    season: {
      type: "array",
      items: { type: "string", enum: ["봄", "여름", "가을", "겨울"] },
      description: "Suitable seasons inferred from style, weight, and fabric cues",
    },
    styleTags: {
      type: "array",
      items: {
        type: "string",
        enum: ["미니멀", "캐주얼", "페미닌", "오피스", "스트릿", "스포티", "빈티지", "포멀", "트렌디", "로맨틱"],
      },
      description: "Up to 4 style tags that best describe this item",
    },
    pattern: {
      type: "string",
      enum: ["plain", "stripe", "check", "floral", "graphic", "dot", "animal", "abstract", "other"],
    },
    materialGuess: {
      type: "string",
      description: "Best guess at fabric/material in English (e.g. cotton, wool, linen, polyester)",
    },
    sleeveLength: {
      anyOf: [
        { type: "string", enum: ["sleeveless", "short", "3/4", "long"] },
        { type: "null" },
      ],
      description: "Sleeve length if applicable, null for bottoms/bags/accessories",
    },
    fitGuess: {
      type: "string",
      enum: ["slim", "regular", "oversized", "wide", "fitted", "relaxed", "n/a"],
      description: "Fit silhouette. Use n/a for bags, accessories, shoes.",
    },
    confidence: {
      type: "number",
      description: "Your classification confidence from 0.0 to 1.0",
    },
    displayName: {
      type: "string",
      description: "Human-friendly Korean item name, e.g. '화이트 코튼 셔츠' or '오버핏 블랙 후드티'",
    },
    analysisNotes: {
      type: "string",
      description: "Brief English explanation of key visual observations used for classification",
    },
    needsReview: {
      type: "boolean",
      description: "true if confidence < 0.7 or classification is ambiguous or image quality is poor",
    },
  },
  required: [
    "mainCategory", "subCategory", "color", "secondaryColor",
    "season", "styleTags", "pattern", "materialGuess",
    "sleeveLength", "fitGuess", "confidence", "displayName",
    "analysisNotes", "needsReview",
  ],
  additionalProperties: false,
};

// ─── Classification prompt ────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert clothing classifier for a Korean wardrobe management app called Trunk Room.

Your task:
1. Look at the clothing item in the image.
2. Classify ONLY the main visible garment or accessory — ignore backgrounds, people, and props.
3. Choose values that match the app's strict taxonomy (provided in the schema).
4. Use Korean for all user-facing text fields (mainCategory, subCategory, color, displayName, styleTags).
5. Use English for materialGuess, pattern, fitGuess, sleeveLength, analysisNotes.
6. If the image is unclear, of poor quality, or shows multiple items equally, lower confidence and set needsReview=true.
7. Do not invent details you cannot see. If unsure about secondary color, return null.
8. For season: infer from visible fabric weight, silhouette, and garment type — not from lighting.
9. displayName should be a natural Korean product-style name a shopper would understand.

Accuracy matters more than completeness. A confident wrong answer is worse than an honest low-confidence answer.`;

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Analyze a clothing image using OpenAI Vision + structured output.
 *
 * @param {string} imageBase64 — base64-encoded image
 * @param {string} mimeType    — e.g. "image/jpeg" or "image/png"
 * @returns {Promise<ClothingAnalysis>}
 */
export async function analyzeClothing(imageBase64, mimeType = "image/jpeg") {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn("[analyzeClothing] OPENAI_API_KEY is not set.");
    return {
      success: false,
      error: "OPENAI_API_KEY not configured",
      needsReview: true,
    };
  }

  const openai = new OpenAI({ apiKey });

  try {
    const imageUrl = `data:${mimeType};base64,${imageBase64}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageUrl, detail: "high" },
            },
            {
              type: "text",
              text: "Please classify this clothing item according to the schema.",
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "clothing_analysis",
          strict: true,
          schema: CLOTHING_ANALYSIS_SCHEMA,
        },
      },
    });

    const rawContent = response.choices[0]?.message?.content;
    if (!rawContent) throw new Error("Empty response from OpenAI");

    const parsed = JSON.parse(rawContent);

    // Normalize + validate against our taxonomy (safety net in case model strays)
    const mainCategory = resolveMainCategory(parsed.mainCategory);
    const subCategory  = resolveSubCategory(parsed.subCategory, mainCategory);

    return {
      success: true,
      ...parsed,
      mainCategory,
      subCategory,
    };
  } catch (err) {
    console.error("[analyzeClothing] error:", err.message);

    // Return a partial result so the client can still open the form
    return {
      success: false,
      error: err.message,
      needsReview: true,
      confidence: 0,
    };
  }
}
