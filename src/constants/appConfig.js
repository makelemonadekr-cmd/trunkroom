/**
 * appConfig.js
 *
 * Single source of truth for all contact/legal/company constants.
 * Change a value here and it updates everywhere in the app.
 */

// ─── Company info ────────────────────────────────────────────────────────────
export const COMPANY_NAME            = "(주)메이크레모네이드";
export const COMPANY_CEO             = "김윤";
export const BUSINESS_NUMBER         = "564-81-01782";
export const APP_NAME                = "트렁크룸";
export const APP_VERSION             = "1.0.0";

// ─── URLs & contact ──────────────────────────────────────────────────────────
export const COMPANY_URL             = "https://makelemonde.kr";
export const SUPPORT_EMAIL           = "hello@makelemonade.kr";
export const PARTNERSHIP_EMAIL       = "hello@makelemonade.kr";
export const CUSTOMER_SERVICE_PHONE  = "1800-8474";
export const SUPPORT_HOURS           = "평일 10:00–17:00 (주말·공휴일 휴무)";

// ─── Link action helpers ─────────────────────────────────────────────────────

/**
 * Open a URL in the system external browser.
 * @param {string} url
 */
export function openExternalUrl(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Open the mail composer with optional pre-filled subject & body.
 * @param {string} email
 * @param {string} [subject]
 * @param {string} [body]
 */
export function openMailTo(email, subject = "", body = "") {
  const parts = [];
  if (subject) parts.push(`subject=${encodeURIComponent(subject)}`);
  if (body)    parts.push(`body=${encodeURIComponent(body)}`);
  const query  = parts.length ? `?${parts.join("&")}` : "";
  window.location.href = `mailto:${email}${query}`;
}

/**
 * Open the phone dialer.
 * @param {string} phone  — human-readable e.g. "1800-8474"
 */
export function openTel(phone) {
  window.location.href = `tel:${phone.replace(/[^0-9+]/g, "")}`;
}
