// Isolated dev server that runs the REAL Kidzopedia React app against demo data.
// Run from the repo root:  npx vite --config video/harness/vite.config.ts
// Nothing in /src is modified: only the Supabase client module is swapped for an in-memory demo backend.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");

export default defineConfig({
  root: here,
  publicDir: path.join(here, "public"),
  server: { host: "127.0.0.1", port: 5199, strictPort: true, fs: { allow: [repo] }, hmr: { overlay: false } },
  css: { postcss: repo },
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@/integrations/supabase/client", replacement: path.join(here, "mockSupabase.ts") },
      { find: "@", replacement: path.join(repo, "src") },
    ],
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
});
