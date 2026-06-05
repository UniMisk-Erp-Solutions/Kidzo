import { useEffect, useState, useCallback } from "react";

export type AppTheme = "legacy" | "dream";

const ACTIVE_CHILD_KEY = "childbook:activeChildId";
const THEME_PREFIX = "kidzopedia:theme:";   // per-child: kidzopedia:theme:<childId>
const THEME_GLOBAL = "kidzopedia:theme";    // fallback / pre-child
const INTENSITY_PREFIX = "kidzopedia:theme-intensity:"; // per-child intensity for dream
const INTENSITY_GLOBAL = "kidzopedia:theme-intensity";

const THEME_CLASSES: AppTheme[] = ["legacy", "dream"];

const THEME_READY_ATTR = "data-theme-ready";

const LEGACY_TOKENS: Record<string, string> = {
  "--background": "41 60% 97%",
  "--foreground": "240 4% 25%",
  "--card": "0 0% 100%",
  "--card-foreground": "240 4% 25%",
  "--popover": "0 0% 100%",
  "--popover-foreground": "240 4% 25%",
  "--primary": "153 19% 72%",
  "--primary-foreground": "240 6% 20%",
  "--primary-deep": "153 22% 58%",
  "--secondary": "17 65% 72%",
  "--secondary-foreground": "0 0% 100%",
  "--muted": "36 23% 95%",
  "--muted-foreground": "240 4% 45%",
  "--accent": "32 41% 71%",
  "--accent-foreground": "240 6% 20%",
  "--success": "150 19% 57%",
  "--success-foreground": "0 0% 100%",
  "--warning": "32 47% 64%",
  "--warning-foreground": "240 6% 20%",
  "--destructive": "0 39% 73%",
  "--destructive-foreground": "0 0% 100%",
  "--border": "33 22% 86%",
  "--input": "33 22% 86%",
  "--ring": "153 22% 58%",
  "--radius": "0.875rem",
  "--gradient-warm": "linear-gradient(135deg, hsl(41 60% 97%) 0%, hsl(36 35% 92%) 100%)",
  "--gradient-hero": "linear-gradient(140deg, hsl(153 30% 86%) 0%, hsl(32 50% 86%) 100%)",
  "--gradient-celebrate": "linear-gradient(135deg, hsl(32 41% 71%) 0%, hsl(17 65% 78%) 100%)",
  "--shadow-soft": "0 1px 2px hsl(33 22% 50% / 0.04), 0 4px 16px hsl(33 22% 40% / 0.06)",
  "--shadow-lift": "0 4px 8px hsl(33 22% 50% / 0.06), 0 12px 28px hsl(33 22% 40% / 0.10)",
  "--shadow-glow": "0 8px 32px hsl(153 25% 60% / 0.18)",
  "--sidebar-background": "41 60% 97%",
  "--sidebar-foreground": "240 4% 25%",
  "--sidebar-primary": "153 22% 58%",
  "--sidebar-primary-foreground": "0 0% 100%",
  "--sidebar-accent": "36 23% 95%",
  "--sidebar-accent-foreground": "240 4% 25%",
  "--sidebar-border": "33 22% 86%",
  "--sidebar-ring": "153 22% 58%",
};

// Dream theme: each token is [H, S, baseL, deltaL] where final L = clamp(baseL + deltaL * intensity, 0..100)
// intensity ∈ [0, 1]. Negative deltaL = darker as intensity increases.
type Tok = [number, number, number, number];
const DREAM_HSL: Record<string, Tok> = {
  "--background":         [280, 25, 97, -8],
  "--foreground":         [260, 30, 28, -10],
  "--card":               [280, 25, 97, -8],
  "--card-foreground":    [260, 30, 28, -10],
  "--popover":            [280, 25, 97, -8],
  "--popover-foreground": [260, 30, 28, -10],
  "--primary":            [261, 60, 78, -22],
  "--primary-foreground": [260, 30, 28, -10],
  "--primary-deep":       [254, 45, 58, -22],
  "--secondary":          [261, 55, 84, -22],
  "--secondary-foreground":[260, 30, 28, -10],
  "--muted":              [270, 30, 94, -10],
  "--muted-foreground":   [257, 25, 55, -18],
  "--accent":             [338, 75, 88, -18],
  "--accent-foreground":  [260, 30, 28, -10],
  "--success":            [138, 40, 76, -18],
  "--success-foreground": [260, 30, 28, -10],
  "--warning":            [36, 85, 82, -18],
  "--warning-foreground": [260, 30, 28, -10],
  "--destructive":        [346, 60, 80, -22],
  "--destructive-foreground":[260, 30, 28, -10],
  "--border":             [270, 35, 90, -14],
  "--input":              [270, 35, 90, -14],
  "--ring":               [254, 45, 58, -22],
  "--sidebar-background": [280, 25, 97, -8],
  "--sidebar-foreground": [260, 30, 28, -10],
  "--sidebar-primary":    [254, 45, 58, -22],
  "--sidebar-primary-foreground":[260, 30, 28, -10],
  "--sidebar-accent":     [270, 30, 94, -10],
  "--sidebar-accent-foreground":[260, 30, 28, -10],
  "--sidebar-border":     [270, 35, 90, -14],
  "--sidebar-ring":       [254, 45, 58, -22],
};

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

function dreamTokens(intensity: number): Record<string, string> {
  const i = clamp(intensity, 0, 1);
  const out: Record<string, string> = { "--radius": "1.125rem" };
  for (const [k, [h, s, baseL, dL]] of Object.entries(DREAM_HSL)) {
    const L = clamp(baseL + dL * i).toFixed(1);
    out[k] = `${h} ${s}% ${L}%`;
  }
  // Recompute gradients/shadows using lightness shifts too.
  const bgL = clamp(97 + -8 * i).toFixed(1);
  const fgL = clamp(28 + -10 * i).toFixed(1);
  const primDeepL = clamp(58 + -22 * i).toFixed(1);
  out["--gradient-warm"] = `linear-gradient(135deg, hsl(270 30% ${clamp(96 - 8 * i).toFixed(1)}%) 0%, hsl(330 40% ${clamp(97 - 8 * i).toFixed(1)}%) 40%, hsl(39 60% ${clamp(96 - 8 * i).toFixed(1)}%) 100%)`;
  out["--gradient-hero"] = `linear-gradient(140deg, hsl(261 55% ${clamp(90 - 18 * i).toFixed(1)}%) 0%, hsl(338 70% ${clamp(90 - 18 * i).toFixed(1)}%) 60%, hsl(38 80% ${clamp(90 - 18 * i).toFixed(1)}%) 100%)`;
  out["--gradient-celebrate"] = `linear-gradient(135deg, hsl(261 60% ${clamp(82 - 22 * i).toFixed(1)}%) 0%, hsl(338 75% ${clamp(88 - 22 * i).toFixed(1)}%) 55%, hsl(36 90% ${clamp(82 - 22 * i).toFixed(1)}%) 100%)`;
  out["--shadow-soft"] = `0 2px 8px hsl(260 30% ${fgL}% / ${(0.05 + 0.05 * i).toFixed(2)}), 0 4px 20px hsl(260 30% ${fgL}% / ${(0.07 + 0.05 * i).toFixed(2)})`;
  out["--shadow-lift"] = `0 4px 20px hsl(260 30% ${fgL}% / ${(0.07 + 0.06 * i).toFixed(2)}), 0 12px 40px hsl(260 30% ${fgL}% / ${(0.09 + 0.06 * i).toFixed(2)})`;
  out["--shadow-glow"] = `0 12px 40px hsl(254 45% ${primDeepL}% / ${(0.28 + 0.1 * i).toFixed(2)})`;
  // Use background L marker (lint silence)
  void bgL;
  return out;
}

function tokensFor(theme: AppTheme, intensity: number): Record<string, string> {
  if (theme === "legacy") return LEGACY_TOKENS;
  return dreamTokens(intensity);
}

function keyForChild(childId: string | null): string {
  return childId ? `${THEME_PREFIX}${childId}` : THEME_GLOBAL;
}
function intensityKeyForChild(childId: string | null): string {
  return childId ? `${INTENSITY_PREFIX}${childId}` : INTENSITY_GLOBAL;
}

function readTheme(childId: string | null): AppTheme {
  if (typeof window === "undefined") return "legacy";
  const v = childId ? localStorage.getItem(keyForChild(childId)) : localStorage.getItem(THEME_GLOBAL);
  return v === "dream" || v === "legacy" ? v : "legacy";
}

function readIntensity(childId: string | null): number {
  if (typeof window === "undefined") return 0;
  const raw = childId
    ? localStorage.getItem(intensityKeyForChild(childId)) ?? localStorage.getItem(INTENSITY_GLOBAL)
    : localStorage.getItem(INTENSITY_GLOBAL);
  const n = raw == null ? NaN : Number(raw);
  if (!isFinite(n)) return 0;
  return clamp(n, 0, 1);
}

function getActiveChildId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_CHILD_KEY);
}

export function applyTheme(theme: AppTheme, intensity = 0) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute(THEME_READY_ATTR, "false");
  THEME_CLASSES.forEach((t) => root.classList.remove(`theme-${t}`));
  root.classList.add(`theme-${theme}`);
  const tokens = tokensFor(theme, intensity);
  Object.entries(tokens).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
  root.style.colorScheme = "light";
  root.setAttribute("data-theme", theme);
  root.setAttribute("data-theme-intensity", intensity.toFixed(2));
  root.setAttribute(THEME_READY_ATTR, "true");
}

/** Reset the persisted theme for the active child (and clear global default). */
export function resetTheme() {
  if (typeof window === "undefined") return;
  const childId = getActiveChildId();
  localStorage.removeItem(keyForChild(childId));
  localStorage.removeItem(intensityKeyForChild(childId));
  if (!childId) {
    localStorage.removeItem(THEME_GLOBAL);
    localStorage.removeItem(INTENSITY_GLOBAL);
  }
  applyTheme("legacy", 0);
  window.dispatchEvent(new CustomEvent("kidzopedia:theme-changed", { detail: "legacy" }));
}

export function useTheme() {
  const [childId, setChildId] = useState<string | null>(getActiveChildId);
  const [theme, setThemeState] = useState<AppTheme>(() => readTheme(getActiveChildId()));
  const [intensity, setIntensityState] = useState<number>(() => readIntensity(getActiveChildId()));
  const [previewTheme, setPreviewTheme] = useState<AppTheme | null>(null);

  // Re-read when active child changes
  useEffect(() => {
    const onChild = () => {
      const id = getActiveChildId();
      const nextTheme = readTheme(id);
      const nextIntensity = readIntensity(id);
      applyTheme(nextTheme, nextIntensity);
      setChildId(id);
      setThemeState(nextTheme);
      setIntensityState(nextIntensity);
    };
    window.addEventListener("childbook:active-child-changed", onChild);
    return () => window.removeEventListener("childbook:active-child-changed", onChild);
  }, []);

  // Apply
  useEffect(() => {
    applyTheme(previewTheme ?? theme, intensity);
  }, [theme, previewTheme, intensity]);

  // Persist
  useEffect(() => {
    if (childId) {
      localStorage.setItem(keyForChild(childId), theme);
      localStorage.setItem(intensityKeyForChild(childId), String(intensity));
    } else {
      localStorage.setItem(THEME_GLOBAL, theme);
      localStorage.setItem(INTENSITY_GLOBAL, String(intensity));
    }
    window.dispatchEvent(new CustomEvent("kidzopedia:theme-changed", { detail: theme }));
  }, [theme, intensity, childId]);

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === keyForChild(childId) || e.key === THEME_GLOBAL) {
        const v = e.newValue;
        if ((v === "dream" || v === "legacy") && v !== theme) setThemeState(v);
      }
      if (e.key === intensityKeyForChild(childId) || e.key === INTENSITY_GLOBAL) {
        const n = Number(e.newValue);
        if (isFinite(n)) setIntensityState(clamp(n, 0, 1));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [theme, childId]);

  const setTheme = useCallback((t: AppTheme) => {
    setThemeState(t);
  }, []);
  const setIntensity = useCallback((n: number) => {
    setIntensityState(clamp(n, 0, 1));
  }, []);
  const startPreview = useCallback((t: AppTheme) => setPreviewTheme(t), []);
  const stopPreview = useCallback(() => setPreviewTheme(null), []);
  const reset = useCallback(() => {
    setPreviewTheme(null);
    setThemeState("legacy");
    setIntensityState(0);
    if (typeof window !== "undefined") {
      localStorage.removeItem(keyForChild(childId));
      localStorage.removeItem(intensityKeyForChild(childId));
      if (!childId) {
        localStorage.removeItem(THEME_GLOBAL);
        localStorage.removeItem(INTENSITY_GLOBAL);
      }
    }
  }, [childId]);

  return { theme, setTheme, intensity, setIntensity, previewTheme, startPreview, stopPreview, reset, childId };
}

// Apply once at module load so theme is set before React renders.
if (typeof window !== "undefined") {
  const params = new URLSearchParams(window.location.search);
  const preview = params.get("themePreview");
  const childId = getActiveChildId();
  if (preview === "dream" || preview === "legacy") {
    const previewIntensity = Number(params.get("themeIntensity"));
    applyTheme(preview, isFinite(previewIntensity) ? clamp(previewIntensity, 0, 1) : readIntensity(childId));
  } else {
    applyTheme(readTheme(childId), readIntensity(childId));
  }
}
