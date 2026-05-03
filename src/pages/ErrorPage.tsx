import { useState, useEffect } from "react";

// ============================================================
// Types
// ============================================================
interface ErrorPageProps {
  statusCode?: number;
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}

// ============================================================
// Inline styles (no external CSS needed, Tailwind-free)
// ============================================================
const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "#ffffff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Courier New', Courier, monospace",
    color: "#1e293b",
    padding: "2rem",
    overflow: "hidden",
    position: "relative",
  },
  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
    pointerEvents: "none",
  },
  glowCircle: {
    position: "absolute",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(220,38,38,0.06) 0%, transparent 70%)",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    zIndex: 1,
    textAlign: "center",
    maxWidth: "560px",
    width: "100%",
    border: "1px solid rgba(220,38,38,0.2)",
    borderRadius: "4px",
    padding: "3rem 2.5rem",
    background: "#ffffff",
    boxShadow: "0 4px 32px rgba(0,0,0,0.06), 0 2px 0 rgba(220,38,38,0.4) inset",
  },
  statusCode: {
    fontSize: "clamp(5rem, 18vw, 9rem)",
    fontWeight: "900",
    lineHeight: 1,
    letterSpacing: "-0.04em",
    color: "#dc2626",
    textShadow: "0 2px 24px rgba(220,38,38,0.18)",
    margin: "0 0 0.5rem",
    fontFamily: "'Courier New', Courier, monospace",
  },
  divider: {
    width: "3rem",
    height: "2px",
    background: "linear-gradient(90deg, transparent, #dc2626, transparent)",
    margin: "0 auto 1.5rem",
    border: "none",
  },
  title: {
    fontSize: "1.1rem",
    fontWeight: "600",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "#dc2626",
    margin: "0 0 1rem",
  },
  message: {
    fontSize: "0.875rem",
    color: "#64748b",
    lineHeight: 1.7,
    margin: "0 0 2.5rem",
  },
  actions: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    flexWrap: "wrap" as const,
  },
  btnPrimary: {
    padding: "0.6rem 1.6rem",
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: "2px",
    cursor: "pointer",
    fontSize: "0.8rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    fontFamily: "'Courier New', Courier, monospace",
    transition: "background 0.2s, transform 0.1s",
  },
  btnSecondary: {
    padding: "0.6rem 1.6rem",
    background: "transparent",
    color: "#64748b",
    border: "1px solid rgba(100,116,139,0.3)",
    borderRadius: "2px",
    cursor: "pointer",
    fontSize: "0.8rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    fontFamily: "'Courier New', Courier, monospace",
    transition: "border-color 0.2s, color 0.2s",
  },
  timestamp: {
    marginTop: "2.5rem",
    fontSize: "0.7rem",
    color: "rgba(100,116,139,0.5)",
    letterSpacing: "0.08em",
  },
  blinkCursor: {
    display: "inline-block",
    width: "0.5em",
    height: "1em",
    background: "#dc2626",
    marginLeft: "2px",
    verticalAlign: "middle",
    animation: "blink 1s step-end infinite",
  },
};

// ============================================================
// Preset error configs
// ============================================================
const errorConfig: Record<number, { title: string; message: string }> = {
  400: {
    title: "Bad Request",
    message:
      "The server could not understand the request due to invalid syntax. Please check your input and try again.",
  },
  401: {
    title: "Unauthorized",
    message:
      "You are not authenticated. Please log in and try again.",
  },
  403: {
    title: "Forbidden",
    message:
      "You do not have permission to access this resource.",
  },
  404: {
    title: "Page Not Found",
    message:
      "The resource you are looking for does not exist.",
  },
  500: {
    title: "Internal Server Error",
    message:
      "An unexpected error occurred on the server. Please try again later or contact support if the issue persists.",
  },
  503: {
    title: "Service Unavailable",
    message:
      "The server is temporarily unable to handle the request. Please try again later.",
  },
};

// ============================================================
// Component
// ============================================================
export default function ErrorPage({
  statusCode = 500,
  title,
  message,
  onRetry,
  onGoHome,
}: ErrorPageProps) {
  const [visible, setVisible] = useState(false);
  const [hoverRetry, setHoverRetry] = useState(false);
  const [hoverHome, setHoverHome] = useState(false);

  const config = errorConfig[statusCode] ?? {
    title: "Unexpected Error",
    message: "Something went wrong. Please try again.",
  };

  const displayTitle = title ?? config.title;
  const displayMessage = message ?? config.message;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <>
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .error-card-anim {
          animation: fadeUp 0.5s ease both;
        }
      `}</style>

      <div style={styles.root}>
        {/* Background decorations */}
        <div style={styles.grid} />
        <div style={styles.glowCircle} />

        {/* Main card */}
        <div
          className="error-card-anim"
          style={{ ...styles.card, opacity: visible ? 1 : 0 }}
        >
          <p style={styles.statusCode}>
            {statusCode}
            <span style={styles.blinkCursor} />
          </p>

          <hr style={styles.divider} />

          <h1 style={styles.title}>{displayTitle}</h1>

          <p style={styles.message}>{displayMessage}</p>

          <div style={styles.actions}>
            <button
              style={{
                ...styles.btnPrimary,
                background: hoverRetry ? "#b91c1c" : "#dc2626",
                transform: hoverRetry ? "scale(0.97)" : "scale(1)",
              }}
              onMouseEnter={() => setHoverRetry(true)}
              onMouseLeave={() => setHoverRetry(false)}
              onClick={handleRetry}
            >
              Retry
            </button>

            <button
              style={{
                ...styles.btnSecondary,
                borderColor: hoverHome
                  ? "rgba(100,116,139,0.7)"
                  : "rgba(100,116,139,0.3)",
                color: hoverHome ? "#1e293b" : "#64748b",
              }}
              onMouseEnter={() => setHoverHome(true)}
              onMouseLeave={() => setHoverHome(false)}
              onClick={handleGoHome}
            >
              Go Home
            </button>
          </div>

          <p style={styles.timestamp}>
            {new Date().toISOString()} &nbsp;|&nbsp; ERR_{statusCode}
          </p>
        </div>
      </div>
    </>
  );
}
