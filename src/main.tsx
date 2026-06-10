import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";
import "./hooks/useTheme"; // applies persisted theme class to <html> on load
import { initMonitoring } from "./lib/monitoring";

// Start GlitchTip error/perf monitoring before anything renders.
initMonitoring();

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary
    fallback={
      <div style={{ padding: 24, fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>Something went wrong</h1>
        <p style={{ opacity: 0.7 }}>The team has been notified. Please refresh the page.</p>
      </div>
    }
  >
    <App />
  </Sentry.ErrorBoundary>,
);
