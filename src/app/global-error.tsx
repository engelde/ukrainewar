"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          backgroundColor: "#1a1a2e",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
          }}
        >
          <div
            style={{
              maxWidth: "28rem",
              padding: "2rem",
              textAlign: "center",
              borderRadius: "0.75rem",
              border: "1px solid rgba(255,255,255,0.1)",
              backgroundColor: "rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠</div>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                marginBottom: "0.5rem",
              }}
            >
              Critical Error
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#a1a1aa",
                marginBottom: "1.5rem",
              }}
            >
              The application encountered a critical error. Please try refreshing the page.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "0.5rem",
                border: "none",
                backgroundColor: "#2563eb",
                color: "white",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Refresh Page
            </button>
            {error.digest && (
              <p
                style={{
                  marginTop: "1rem",
                  fontSize: "0.75rem",
                  color: "#52525b",
                }}
              >
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
