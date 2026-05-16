import { Component } from "react";

/**
 * ErrorBoundary — catches render errors anywhere in its child tree and shows
 * a visible fallback instead of unmounting the whole React root (which would
 * leave the user staring at a blank screen).
 *
 * Reports the error message so we can diagnose from screenshots.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      const msg = String(this.state.error?.message ?? this.state.error ?? "Unknown error");
      return (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "white",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            fontFamily: "'Spoqa Han Sans Neo', -apple-system, sans-serif",
            zIndex: 9999,
          }}
        >
          <span style={{ fontSize: 32 }}>⚠️</span>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", textAlign: "center" }}>
            화면을 표시하는 중 오류가 발생했어요
          </p>
          <p
            style={{
              fontSize: 11,
              color: "#888",
              textAlign: "center",
              maxWidth: 320,
              wordBreak: "break-word",
              backgroundColor: "#F5F5F5",
              padding: "12px 16px",
              borderRadius: 8,
              fontFamily: "monospace",
            }}
          >
            {msg}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "white",
              backgroundColor: "#1a1a1a",
              padding: "10px 24px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
