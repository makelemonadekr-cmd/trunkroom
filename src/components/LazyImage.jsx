/**
 * LazyImage.jsx
 *
 * Production-quality lazy-loading image component.
 *
 * Features:
 *  - IntersectionObserver-based lazy loading (only loads when near viewport)
 *  - Stable placeholder color derived from src (no color jump on load)
 *  - Smooth fade-in transition once loaded
 *  - Error state with SVG fallback icon
 *  - Respects crossOrigin for canvas operations (coordi editor)
 *  - Optional srcSet for responsive Unsplash images
 *  - Accepts all standard img props via ...rest
 *
 * Usage:
 *   <LazyImage
 *     src="https://images.unsplash.com/..."
 *     alt="White T-shirt"
 *     style={{ width: "100%", height: "100%", objectFit: "cover" }}
 *     crossOrigin="anonymous"
 *   />
 */

import { useEffect, useRef, useState } from "react";
import { placeholderColor, unsplashSrcSet } from "../lib/imageUtils";

// ─── Fallback SVG ─────────────────────────────────────────────────────────────

function FallbackIcon({ size = 28, color = "#CCC" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect x="3" y="7" width="22" height="16" rx="2" stroke={color} strokeWidth="1.5" />
      <circle cx="14" cy="15" r="4" stroke={color} strokeWidth="1.5" />
      <path d="M3 20L9 14L13 18L17 13L25 20" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LazyImage({
  src,
  alt = "",
  style = {},
  className = "",
  crossOrigin,
  fallbackSize = 28,
  fallbackColor = "#CCCCCC",
  responsive = false,  // If true, adds srcSet for Unsplash images
  priority = false,    // If true, skips lazy loading (above-the-fold images)
  onLoad,
  onError,
  ...rest
}) {
  const [status,  setStatus]  = useState("idle"); // "idle" | "loading" | "loaded" | "error"
  const [visible, setVisible] = useState(priority);
  const imgRef = useRef(null);
  const wrapRef = useRef(null);

  const bgColor = placeholderColor(src ?? "");

  // ── Intersection observer ──────────────────────────────────────────────────
  useEffect(() => {
    if (priority || visible) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const el = wrapRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // Start loading 200px before entering viewport
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [priority, visible]);

  // ── Start loading once visible ─────────────────────────────────────────────
  useEffect(() => {
    if (!visible || !src) return;
    setStatus("loading");
  }, [visible, src]);

  // ── Reset when src changes ─────────────────────────────────────────────────
  useEffect(() => {
    if (src) {
      setStatus("idle");
      if (priority) setStatus("loading");
    }
  }, [src, priority]);

  function handleLoad(e) {
    setStatus("loaded");
    onLoad?.(e);
  }

  function handleError(e) {
    setStatus("error");
    onError?.(e);
  }

  const isLoaded = status === "loaded";
  const isError  = status === "error";

  // Build srcSet for responsive Unsplash images
  const srcSet = responsive && src ? unsplashSrcSet(src) : undefined;

  return (
    <div
      ref={wrapRef}
      style={{
        ...style,
        position:        "relative",
        overflow:        "hidden",
        backgroundColor: isLoaded ? "transparent" : bgColor,
      }}
      className={className}
    >
      {/* Placeholder shimmer (shown while loading) */}
      {!isLoaded && !isError && (
        <div
          style={{
            position:   "absolute",
            inset:      0,
            background: `linear-gradient(
              90deg,
              ${bgColor} 0%,
              ${bgColor}cc 40%,
              ${bgColor} 80%
            )`,
            backgroundSize: "200% 100%",
            animation:      "lazy-shimmer 1.4s ease infinite",
          }}
        />
      )}

      {/* Error fallback */}
      {isError && (
        <div
          style={{
            position:       "absolute",
            inset:          0,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            backgroundColor: bgColor,
          }}
        >
          <FallbackIcon size={fallbackSize} color={fallbackColor} />
        </div>
      )}

      {/* Actual image */}
      {visible && !isError && src && (
        <img
          ref={imgRef}
          src={src}
          srcSet={srcSet}
          sizes={srcSet ? "(max-width: 400px) 300px, (max-width: 800px) 600px, 900px" : undefined}
          alt={alt}
          crossOrigin={crossOrigin}
          onLoad={handleLoad}
          onError={handleError}
          draggable={false}
          style={{
            position:   "absolute",
            inset:      0,
            width:      "100%",
            height:     "100%",
            objectFit:  style.objectFit  ?? "cover",
            objectPosition: style.objectPosition ?? "center top",
            opacity:    isLoaded ? 1 : 0,
            transition: "opacity 0.25s ease",
            display:    "block",
          }}
          {...rest}
        />
      )}
    </div>
  );
}

// ─── Shimmer keyframe (injected once) ─────────────────────────────────────────

if (typeof document !== "undefined") {
  const styleId = "lazy-image-shimmer";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @keyframes lazy-shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    document.head.appendChild(style);
  }
}
