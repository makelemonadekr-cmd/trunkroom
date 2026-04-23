/**
 * toastUtils.js
 *
 * Lightweight, framework-agnostic toast utility.
 * Dispatches a CustomEvent that App.jsx listens to and renders as a global overlay.
 *
 * Usage (from any file):
 *   import { showToast } from "../lib/toastUtils";
 *   showToast("저장되었어요", "success");
 *   showToast("서버 오류가 발생했어요", "error");
 *
 * Types: "info" (default) | "success" | "error" | "warning"
 */

export const TOAST_EVENT = "trunkroom:toast";

/**
 * Fire a toast notification.
 * @param {string} message
 * @param {"info"|"success"|"error"|"warning"} [type="info"]
 * @param {number} [duration=3000] — auto-dismiss delay in ms
 */
export function showToast(message, type = "info", duration = 3000) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, {
      detail: { message, type, duration, id: Date.now() },
    })
  );
}
