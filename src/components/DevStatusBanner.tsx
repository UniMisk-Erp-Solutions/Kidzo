import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

type Status =
  | { kind: "ready" }
  | { kind: "updating" }
  | { kind: "error"; message: string }
  | { kind: "hidden" };

/**
 * Lightweight dev-only banner that surfaces Vite build / HMR state and
 * runtime startup errors. Rendered as a no-op in production builds.
 */
export const DevStatusBanner = () => {
  const [status, setStatus] = useState<Status>({ kind: "ready" });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    // Auto-hide the "ready" toast after a moment.
    const readyTimer = window.setTimeout(() => {
      setStatus((s) => (s.kind === "ready" ? { kind: "hidden" } : s));
    }, 2500);

    const hot = (import.meta as unknown as { hot?: ViteHotContext }).hot;
    hot?.on?.("vite:beforeUpdate", () => setStatus({ kind: "updating" }));
    hot?.on?.("vite:afterUpdate", () => {
      setStatus({ kind: "ready" });
      setDismissed(false);
    });
    hot?.on?.("vite:error", (payload: { err?: { message?: string } }) => {
      setStatus({ kind: "error", message: payload?.err?.message ?? "Build error" });
      setDismissed(false);
    });

    const onError = (e: ErrorEvent) => {
      setStatus({ kind: "error", message: e.message || "Runtime error" });
      setDismissed(false);
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      const message =
        reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "Unhandled rejection";
      setStatus({ kind: "error", message });
      setDismissed(false);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.clearTimeout(readyTimer);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  if (!import.meta.env.DEV) return null;
  if (dismissed || status.kind === "hidden") return null;

  const base =
    "fixed bottom-3 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-2 rounded-full border px-3 py-1.5 text-xs shadow-md backdrop-blur";

  if (status.kind === "ready") {
    return (
      <div className={`${base} border-border bg-card/90 text-foreground`}>
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        <span>Dev server ready</span>
      </div>
    );
  }

  if (status.kind === "updating") {
    return (
      <div className={`${base} border-border bg-card/90 text-muted-foreground`}>
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
        <span>Rebuilding…</span>
      </div>
    );
  }

  return (
    <div className={`${base} max-w-[90vw] border-destructive/40 bg-destructive/10 text-destructive`}>
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate font-medium">{status.message}</span>
      <button
        onClick={() => setDismissed(true)}
        className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
        aria-label="Dismiss"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};

type ViteHotContext = {
  on: (event: string, cb: (payload: never) => void) => void;
};
