import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./hooks/useTheme"; // applies persisted theme class to <html> on load

createRoot(document.getElementById("root")!).render(<App />);
