/**
 * nativeBgRemoval.js
 *
 * 아이폰 네이티브 누끼 (iOS 17+ Vision 프레임워크) 브릿지.
 * 온디바이스 처리 — 무료, 빠름, 업로드 없음(프라이버시), API 비용 0.
 *
 * 네이티브 플러그인(BackgroundRemovalPlugin.swift)이 Xcode App 타겟에 추가돼야 동작.
 * 미지원(웹/안드로이드/iOS16↓) 또는 실패 시 null 반환 → 호출부에서 remove.bg 서버로 폴백.
 */

import { registerPlugin, Capacitor } from "@capacitor/core";

const BackgroundRemoval = registerPlugin("BackgroundRemoval");

/**
 * @param {string} base64 — 원본 이미지 base64 (data: 접두사 있어도 됨)
 * @returns {Promise<{ bgRemoved: true, processedBase64: string } | null>}
 *   null = 미지원/실패 → 서버 폴백 신호
 */
export async function tryNativeBgRemoval(base64) {
  // iOS 네이티브 앱에서만 시도. 그 외(웹·안드)는 즉시 폴백.
  if (Capacitor.getPlatform() !== "ios" || !Capacitor.isNativePlatform()) return null;
  if (!base64) return null;

  try {
    const res = await BackgroundRemoval.removeBackground({ base64 });
    if (res && res.base64) {
      return { bgRemoved: true, processedBase64: res.base64 };
    }
    return null;
  } catch (e) {
    // iOS 17 미만, 피사체 못 찾음, 플러그인 미설치 등 → 서버 폴백
    console.warn("[nativeBgRemoval] 네이티브 누끼 미사용, 서버 폴백:", e?.message);
    return null;
  }
}
