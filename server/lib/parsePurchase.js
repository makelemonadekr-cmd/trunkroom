/**
 * parsePurchase.js
 *
 * 쇼핑 주문완료/상품 페이지 "스크린샷"에서 구매 정보를 추출한다.
 * (무신사·지그재그·쿠팡·네이버쇼핑·29CM 등 한국 쇼핑앱 캡쳐 대응)
 *
 * analyzeClothing.js와 동일한 OpenAI Vision + structured output 패턴.
 * Env var required: OPENAI_API_KEY
 */

import OpenAI from "openai";
import { MAIN_CATEGORIES, TAXONOMY } from "./categoryMapping.js";

const PURCHASE_PARSE_SCHEMA = {
  type: "object",
  properties: {
    isPurchaseScreenshot: {
      type: "boolean",
      description: "true if the image looks like a shopping app/website screenshot (order confirmation, product page, cart). false if it's a regular photo.",
    },
    productName: {
      type: "string",
      description: "Product name in Korean as shown on screen, cleaned of option codes. Empty string if not found.",
    },
    brand: {
      type: "string",
      description: "Brand or seller name if visible. Empty string if not found.",
    },
    price: {
      type: "number",
      description: "Final paid price in KRW as a plain number (e.g. 89000). Use the discounted/paid price if both are shown. 0 if not found.",
    },
    mainCategory: {
      type: "string",
      description: `Best-guess clothing category. Must be one of: ${MAIN_CATEGORIES.join(", ")}. Use product image/name cues.`,
    },
    subCategory: {
      type: "string",
      description: `Must match the taxonomy for the chosen mainCategory: ${
        Object.entries(TAXONOMY).map(([cat, subs]) => `${cat}: [${subs.join(", ")}]`).join("; ")
      }. Empty string if unsure.`,
    },
    color: {
      type: "string",
      description: "Color in Korean if visible in option text or product image (e.g. 블랙, 아이보리). Empty string if not found.",
    },
    size: {
      type: "string",
      description: "Size if visible in option text (e.g. M, 95, FREE). Empty string if not found.",
    },
    mall: {
      type: "string",
      description: "Shopping platform name if identifiable (e.g. 무신사, 쿠팡, 지그재그, 네이버, 29CM). Empty string if unknown.",
    },
    confidence: {
      type: "number",
      description: "Extraction confidence 0.0–1.0",
    },
  },
  required: [
    "isPurchaseScreenshot", "productName", "brand", "price",
    "mainCategory", "subCategory", "color", "size", "mall", "confidence",
  ],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You are a receipt/screenshot parser for a Korean wardrobe app called Trunk Room.

The user uploads a SCREENSHOT from a Korean shopping app or website (order confirmation, payment complete page, product detail page, or cart).

Your task:
1. Read all visible Korean/English text in the screenshot.
2. Extract the purchased clothing item's name, brand, paid price (KRW), option color/size, and the shopping platform.
3. If multiple items appear, extract the FIRST/most prominent one.
4. price must be the actually-paid (discounted) price when both original and discounted prices are visible. Strip commas and the 원 symbol — return a plain number.
5. Guess mainCategory/subCategory from the product name and any product thumbnail.
6. If the image is NOT a shopping screenshot (e.g. a regular photo of clothes or a selfie), set isPurchaseScreenshot=false and leave other fields empty/0.
7. Do not invent values you cannot see. Empty string / 0 is better than a guess for text fields; category may be a reasonable inference.`;

/**
 * @param {string} imageBase64
 * @param {string} mimeType
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function parsePurchase(imageBase64, mimeType = "image/jpeg") {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[parsePurchase] OPENAI_API_KEY is not set.");
    return { success: false, error: "OPENAI_API_KEY not configured" };
  }

  const openai = new OpenAI({ apiKey });

  try {
    const imageUrl = `data:${mimeType};base64,${imageBase64}`;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 512,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageUrl, detail: "high" } },
            { type: "text", text: "Extract the purchase info from this shopping screenshot." },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "purchase_parse", strict: true, schema: PURCHASE_PARSE_SCHEMA },
      },
    });

    const rawContent = response.choices[0]?.message?.content;
    if (!rawContent) return { success: false, error: "Empty response from OpenAI" };

    const data = JSON.parse(rawContent);
    return { success: true, data };
  } catch (err) {
    console.error("[parsePurchase] error:", err.message);
    return { success: false, error: err.message };
  }
}
