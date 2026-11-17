import { createRoot } from "react-dom/client";
import App from "../../src/App.tsx";
import "../../src/index.css";
import "../../src/hooks/useTheme";

// Pre-answer the cookie banner and the welcome tour so neither covers the app in captures.
try {
  localStorage.setItem(
    "kidzo_consent_v1",
    JSON.stringify({ essential: true, diagnostics: false, preferences: true, decidedAt: "2026-01-01T00:00:00.000Z", version: 1 }),
  );
  localStorage.setItem("childbook:featureTour:v1", "1");
  localStorage.setItem("childbook:featureTour:v1:demo-user", "1");
  localStorage.setItem("childbook:activeChildId", "child-mia");
} catch {
  /* ignore */
}

createRoot(document.getElementById("root")!).render(<App />);
