import * as Sentry from "@sentry/react";

// Error & performance monitoring via self-hosted GlitchTip.
// GlitchTip speaks the Sentry protocol, so we use the open-source Sentry SDK
// pointed at OUR GlitchTip server (the DSN host). Nothing is sent to sentry.io.
//
// Configure with VITE_GLITCHTIP_DSN (set it locally in .env and in
// Vercel → Project Settings → Environment Variables). DSNs are public/client-safe.

const dsn = import.meta.env.VITE_GLITCHTIP_DSN as string | undefined;

export function initMonitoring(): void {
  if (!dsn) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info("[monitoring] VITE_GLITCHTIP_DSN not set — error reporting disabled");
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE, // "development" | "production"
    release: (import.meta.env.VITE_APP_RELEASE as string) || undefined,
    // Performance tracing (GlitchTip supports transactions). Tune via env.
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: Number(import.meta.env.VITE_GLITCHTIP_TRACES_SAMPLE_RATE ?? 0.2),
    // GlitchTip does not support Session Replay — intentionally omitted.
    sendDefaultPii: false,
    // Don't spam the project from local dev unless a DSN is explicitly set.
    enabled: true,
  });
}

// Re-export so app code can do: import { captureException } from "@/lib/monitoring"
export const captureException = Sentry.captureException;
export const captureMessage = Sentry.captureMessage;
export const setUser = Sentry.setUser;
