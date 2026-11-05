import { useEffect, useState, useCallback } from "react";

/**
 * Kidzopedia themes. The palette itself lives in CSS (src/index.css, `[data-palette="…"]` blocks); this module only
 * decides WHICH palette is active, persists the choice and sets `<html data-palette>`.
 * An identical pre-paint script in index.html applies the saved palette before React loads (no flash).
 */
export type AppTheme = "daydream" | "explorer" | "tales";

export const DEFAULT_THEME: AppTheme = "tales";

export type ThemeMeta = {
  id: AppTheme;
  name: string;
  tagline: string;
  swatches: string[];
  /** <meta name="theme-color"> (browser / Android chrome) */
  chrome: string;
  /** Used only by the Settings preview cards (they must look right whatever theme is active). */
  preview: { bg: string; ink: string; hero: string; button: string; stats: [string, string, string] };
};

export const THEMES: ThemeMeta[] = [
  {
    id: "daydream",
    name: "Colorful Daydream",
    tagline: "Playful, colorful, and dreamy.",
    swatches: ["#A78BFA", "#F472B6", "#FF8A95", "#FFD66B", "#93C5FD"],
    chrome: "#FFFAF5",
    preview: {
      bg: "#FFFAF5", ink: "#302447",
      hero: "linear-gradient(135deg,#C9B8FB,#F9B4D6 55%,#FFD9A8)",
      button: "linear-gradient(135deg,#A78BFA,#FF8A95)",
      stats: ["#FF9AA2", "#FFD66B", "#93C5FD"],
    },
  },
  {
    id: "explorer",
    name: "Little Explorer",
    tagline: "Adventurous, magical, and blue-inspired.",
    swatches: ["#C0E6FD", "#80AAD3", "#5B86B6", "#3F6593", "#1B3554"],
    chrome: "#F5FBFF",
    preview: {
      bg: "#F5FBFF", ink: "#000F22",
      hero: "linear-gradient(120deg,#C0E6FD,#9CBFE0 50%,#6F94BF)",
      button: "linear-gradient(135deg,#3F6593,#1B3554)",
      stats: ["#80AAD3", "#5B86B6", "#C0E6FD"],
    },
  },
  {
    id: "tales",
    name: "Timeless Tales",
    tagline: "Warm, artistic, and universally appealing.",
    swatches: ["#B4533F", "#FBF4E6", "#E9A590", "#E3B563", "#A8C9A0"],
    chrome: "#FBF4E6",
    preview: {
      bg: "#FBF4E6", ink: "#4A2B24",
      hero: "linear-gradient(135deg,#FAE9C9,#F3CDB8 40%,#E7A692 75%,#D5E2CF)",
      button: "linear-gradient(135deg,#B8533F,#8F4030)",
      stats: ["#E9A590", "#E3B563", "#A8C9A0"],
    },
  },
];

const ACTIVE_CHILD_KEY = "childbook:activeChildId";
const THEME_PREFIX = "kidzopedia:theme:"; // per-child: kidzopedia:theme:<childId>
const THEME_GLOBAL = "kidzopedia:theme"; // fallback / pre-child
const LEGACY_INTENSITY_KEYS = ["kidzopedia:theme-intensity"];

/** Inline CSS variables older builds wrote onto <html>; they would override the stylesheet, so clear them. */
const STALE_INLINE_PROPS = [
  "--background", "--foreground", "--card", "--card-foreground", "--popover", "--popover-foreground", "--primary",
  "--primary-foreground", "--primary-deep", "--secondary", "--secondary-foreground", "--muted", "--muted-foreground",
  "--accent", "--accent-foreground", "--success", "--success-foreground", "--warning", "--warning-foreground",
  "--destructive", "--destructive-foreground", "--border", "--input", "--ring", "--radius", "--gradient-warm",
  "--gradient-hero", "--gradient-celebrate", "--shadow-soft", "--shadow-lift", "--shadow-glow",
  "--sidebar-background", "--sidebar-foreground", "--sidebar-primary", "--sidebar-primary-foreground",
  "--sidebar-accent", "--sidebar-accent-foreground", "--sidebar-border", "--sidebar-ring",
];

export const isTheme = (v: unknown): v is AppTheme => v === "daydream" || v === "explorer" || v === "tales";

/** Maps stored values (including the retired "legacy" / "dream" ids) to a current theme. */
const normalize = (v: string | null): AppTheme => (isTheme(v) ? v : DEFAULT_THEME);

const keyForChild = (childId: string | null) => (childId ? `${THEME_PREFIX}${childId}` : THEME_GLOBAL);

function getActiveChildId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_CHILD_KEY);
}

function readTheme(childId: string | null): AppTheme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const own = childId ? localStorage.getItem(keyForChild(childId)) : null;
    return normalize(own ?? localStorage.getItem(THEME_GLOBAL));
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyTheme(theme: AppTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  STALE_INLINE_PROPS.forEach((p) => root.style.removeProperty(p));
  root.classList.remove("theme-legacy", "theme-dream");
  root.setAttribute("data-palette", theme);
  root.style.colorScheme = "light";
  const meta = THEMES.find((t) => t.id === theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", meta?.chrome ?? "#FFFAF5");
}

/** Reset the persisted theme for the active child (and the global default). */
export function resetTheme() {
  if (typeof window === "undefined") return;
  const childId = getActiveChildId();
  try {
    localStorage.removeItem(keyForChild(childId));
    if (!childId) localStorage.removeItem(THEME_GLOBAL);
  } catch {
    /* storage unavailable */
  }
  applyTheme(DEFAULT_THEME);
  window.dispatchEvent(new CustomEvent("kidzopedia:theme-changed", { detail: DEFAULT_THEME }));
}

export function useTheme() {
  const [childId, setChildId] = useState<string | null>(getActiveChildId);
  const [theme, setThemeState] = useState<AppTheme>(() => readTheme(getActiveChildId()));
  // `?themePreview=<id>` (used by the Settings preview iframe) shows a theme without saving it
  const [previewTheme, setPreviewTheme] = useState<AppTheme | null>(() => {
    if (typeof window === "undefined") return null;
    const q = new URLSearchParams(window.location.search).get("themePreview");
    return isTheme(q) ? q : null;
  });

  // Re-read when active child changes
  useEffect(() => {
    const onChild = () => {
      const id = getActiveChildId();
      setChildId(id);
      setThemeState(readTheme(id));
    };
    window.addEventListener("childbook:active-child-changed", onChild);
    return () => window.removeEventListener("childbook:active-child-changed", onChild);
  }, []);

  // Apply
  useEffect(() => {
    applyTheme(previewTheme ?? theme);
  }, [theme, previewTheme]);

  // Persist (also mirrors to the global key so the landing/auth screens, which have no child, match)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("themePreview")) return;
    try {
      localStorage.setItem(keyForChild(childId), theme);
      localStorage.setItem(THEME_GLOBAL, theme);
      LEGACY_INTENSITY_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch {
      /* storage unavailable: theme still applies for this session */
    }
    window.dispatchEvent(new CustomEvent("kidzopedia:theme-changed", { detail: theme }));
  }, [theme, childId]);

  // Cross-tab sync, and sync between hook instances in the same tab
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === keyForChild(childId) || e.key === THEME_GLOBAL) {
        const v = normalize(e.newValue);
        if (v !== theme) setThemeState(v);
      }
    };
    const onChanged = (e: Event) => {
      const v = (e as CustomEvent<AppTheme>).detail;
      if (isTheme(v) && v !== theme) setThemeState(v);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("kidzopedia:theme-changed", onChanged);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("kidzopedia:theme-changed", onChanged);
    };
  }, [theme, childId]);

  const setTheme = useCallback((t: AppTheme) => setThemeState(t), []);
  const startPreview = useCallback((t: AppTheme) => setPreviewTheme(t), []);
  const stopPreview = useCallback(() => setPreviewTheme(null), []);
  const reset = useCallback(() => {
    setPreviewTheme(null);
    setThemeState(DEFAULT_THEME);
    try {
      localStorage.removeItem(keyForChild(childId));
    } catch {
      /* ignore */
    }
  }, [childId]);

  return { theme, setTheme, previewTheme, startPreview, stopPreview, reset, childId };
}

// Apply once at module load so the theme is set before React renders (index.html also does this pre-paint).
if (typeof window !== "undefined") {
  const preview = new URLSearchParams(window.location.search).get("themePreview");
  applyTheme(isTheme(preview) ? preview : readTheme(getActiveChildId()));
}
