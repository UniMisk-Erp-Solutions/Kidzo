import { useEffect, useMemo, useRef, useState } from "react";
import { Pipette, Plus, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RECENTS_KEY_PREFIX = "lovable.editor.recentColors";
const SWATCHES_KEY_PREFIX = "lovable.editor.savedSwatches";
const MAX_RECENTS = 10;

/** Curated palette — pastel lilac / violet / lavender / yellow forward. */
const PALETTE: { name: string; colors: string[] }[] = [
  {
    name: "Lilac & Lavender",
    colors: ["#F3EAFE", "#E9DCFB", "#DCC7F7", "#CDB4F0", "#BFA2EA", "#A98EDC", "#9C7BD1", "#7E5DB8"],
  },
  {
    name: "Violet pastels",
    colors: ["#F0E6FF", "#E2D1FF", "#D1B8FF", "#C0A0FF", "#B19CD9", "#9F86C0", "#8A6FBF", "#6F4FAE"],
  },
  {
    name: "Pastel yellow & butter",
    colors: ["#FFFDE4", "#FFF9C7", "#FFF2A8", "#FFE680", "#FFD96B", "#F7C948", "#EAD27A", "#D9B44A"],
  },
  {
    name: "Lilac × Yellow combo",
    colors: ["#E9DCFB", "#FFF2A8", "#DCC7F7", "#FFE680", "#CDB4F0", "#FFF9C7", "#BFA2EA", "#FFFDE4"],
  },
  {
    name: "Soft pastels",
    colors: ["#FDE2E4", "#FAD2E1", "#FFD8BE", "#FFE5B4", "#D0F4DE", "#CDE7F0", "#D6CDEA", "#E4C1F9"],
  },
  {
    name: "Muted accents",
    colors: ["#A8C5BA", "#B19CD9", "#E8A087", "#D4B896", "#C9A06C", "#9B7B6B", "#9DB7C9", "#6B7280"],
  },
  {
    name: "Neutrals",
    colors: ["#000000", "#1F2937", "#3E3E42", "#6B7280", "#9CA3AF", "#D1D5DB", "#F3F4F6", "#FFFFFF"],
  },
];

/* ---------- storage helpers (per-book scope) ---------- */

function recentsKey(scope?: string) {
  return scope ? `${RECENTS_KEY_PREFIX}.${scope}` : RECENTS_KEY_PREFIX;
}
function swatchesKey(scope?: string) {
  return scope ? `${SWATCHES_KEY_PREFIX}.${scope}` : SWATCHES_KEY_PREFIX;
}

function loadList<T = string>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function loadRecents(scope?: string): string[] {
  return loadList<string>(recentsKey(scope))
    .filter((c) => typeof c === "string")
    .slice(0, MAX_RECENTS);
}

function saveRecent(color: string, scope?: string) {
  try {
    const cur = loadRecents(scope);
    const next = [color, ...cur.filter((c) => c.toLowerCase() !== color.toLowerCase())].slice(0, MAX_RECENTS);
    localStorage.setItem(recentsKey(scope), JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("lovable:recent-colors-updated", { detail: { scope } }));
  } catch {
    /* ignore */
  }
}

export type SavedSwatch = { name: string; value: string };

function loadSwatches(scope?: string): SavedSwatch[] {
  return loadList<SavedSwatch>(swatchesKey(scope)).filter(
    (s) => s && typeof s.name === "string" && typeof s.value === "string",
  );
}

function persistSwatches(list: SavedSwatch[], scope?: string) {
  try {
    localStorage.setItem(swatchesKey(scope), JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("lovable:saved-swatches-updated", { detail: { scope } }));
  } catch {
    /* ignore */
  }
}

/* ---------- color math: contrast ---------- */

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function relLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  const ch = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

export function contrastRatio(a: string, b: string): number | null {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return null;
  const la = relLuminance(ra);
  const lb = relLuminance(rb);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function contrastGrade(ratio: number) {
  if (ratio >= 7) return { label: "AAA", ok: true };
  if (ratio >= 4.5) return { label: "AA", ok: true };
  if (ratio >= 3) return { label: "AA Large", ok: true };
  return { label: "Fail", ok: false };
}

/* ---------- gradient helpers ---------- */

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function isGradient(value: string) {
  return typeof value === "string" && /gradient\(/i.test(value);
}

export function buildGradient(angle: number, from: string, to: string) {
  return `linear-gradient(${angle}deg, ${from}, ${to})`;
}

/** Best-effort parse so existing gradient values can be edited. */
function parseGradient(value: string): { angle: number; from: string; to: string } | null {
  const m = /linear-gradient\(\s*(-?\d+(?:\.\d+)?)deg\s*,\s*(#[0-9a-fA-F]{6})\s*,\s*(#[0-9a-fA-F]{6})\s*\)/i.exec(
    value,
  );
  if (!m) return null;
  return { angle: parseFloat(m[1]), from: m[2], to: m[3] };
}

/* ---------- component ---------- */

interface ColorPickerProps {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  /** Stable id (e.g. book id) — recents & swatches are scoped here. */
  scope?: string;
  /** When set, shows WCAG contrast info between value and contrastAgainst. */
  contrastAgainst?: string;
  /** Allow gradient tab. Defaults to true. */
  allowGradient?: boolean;
}

export function ColorPicker({
  value,
  onChange,
  className,
  scope,
  contrastAgainst,
  allowGradient = true,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [recents, setRecents] = useState<string[]>(() => loadRecents(scope));
  const [swatches, setSwatches] = useState<SavedSwatch[]>(() => loadSwatches(scope));
  const [draft, setDraft] = useState(value);
  const commitTimer = useRef<number | null>(null);

  const initialMode = isGradient(value) ? "gradient" : "solid";
  const [mode, setMode] = useState<"solid" | "gradient">(initialMode);

  // Gradient sub-state
  const parsedG = useMemo(() => parseGradient(value), [value]);
  const [gFrom, setGFrom] = useState<string>(parsedG?.from ?? (HEX_RE.test(value) ? value : "#A8C5BA"));
  const [gTo, setGTo] = useState<string>(parsedG?.to ?? "#E8A087");
  const [gAngle, setGAngle] = useState<number>(parsedG?.angle ?? 135);

  // Saved-swatch UI
  const [newName, setNewName] = useState("");

  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    setRecents(loadRecents(scope));
    setSwatches(loadSwatches(scope));
  }, [scope]);

  useEffect(() => {
    const refreshR = (e: Event) => {
      const ev = e as CustomEvent<{ scope?: string }>;
      if (ev.detail?.scope === scope) setRecents(loadRecents(scope));
    };
    const refreshS = (e: Event) => {
      const ev = e as CustomEvent<{ scope?: string }>;
      if (ev.detail?.scope === scope) setSwatches(loadSwatches(scope));
    };
    window.addEventListener("lovable:recent-colors-updated", refreshR);
    window.addEventListener("lovable:saved-swatches-updated", refreshS);
    return () => {
      window.removeEventListener("lovable:recent-colors-updated", refreshR);
      window.removeEventListener("lovable:saved-swatches-updated", refreshS);
    };
  }, [scope]);

  const commit = (c: string, persist = true) => {
    onChange(c);
    if (persist && HEX_RE.test(c)) saveRecent(c, scope);
  };

  const onNativePick = (c: string) => {
    setDraft(c);
    onChange(c);
    if (commitTimer.current) window.clearTimeout(commitTimer.current);
    commitTimer.current = window.setTimeout(() => saveRecent(c, scope), 400);
  };

  const eyedropperSupported = typeof window !== "undefined" && "EyeDropper" in window;

  const pickFromScreen = async () => {
    try {
      // @ts-expect-error EyeDropper is a newer Web API not yet in TS lib
      const ed = new window.EyeDropper();
      const result = await ed.open();
      if (result?.sRGBHex) commit(result.sRGBHex);
    } catch {
      /* user cancelled */
    }
  };

  const applyGradient = (angle: number, from: string, to: string) => {
    setGAngle(angle);
    setGFrom(from);
    setGTo(to);
    const g = buildGradient(angle, from, to);
    onChange(g);
    if (HEX_RE.test(from)) saveRecent(from, scope);
    if (HEX_RE.test(to)) saveRecent(to, scope);
  };

  const addSwatch = () => {
    const name = newName.trim();
    if (!name) return;
    const v = mode === "gradient" ? buildGradient(gAngle, gFrom, gTo) : value;
    const next = [...swatches.filter((s) => s.name.toLowerCase() !== name.toLowerCase()), { name, value: v }];
    persistSwatches(next, scope);
    setSwatches(next);
    setNewName("");
  };

  const removeSwatch = (name: string) => {
    const next = swatches.filter((s) => s.name !== name);
    persistSwatches(next, scope);
    setSwatches(next);
  };

  /* contrast — only meaningful for solid colors */
  const contrast = useMemo(() => {
    if (!contrastAgainst || isGradient(value) || isGradient(contrastAgainst)) return null;
    const r = contrastRatio(value, contrastAgainst);
    if (r == null) return null;
    return { ratio: r, ...contrastGrade(r) };
  }, [value, contrastAgainst]);

  /* swatch button preview */
  const previewBg = isGradient(value) ? value : value;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Pick color"
          className={cn(
            "h-7 w-10 shrink-0 rounded border shadow-inner",
            className,
          )}
          style={{ background: previewBg }}
        />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3">
        <Tabs value={mode} onValueChange={(v) => setMode(v as "solid" | "gradient")}>
          <TabsList className={cn("grid w-full", allowGradient ? "grid-cols-2" : "grid-cols-1")}>
            <TabsTrigger value="solid">Solid</TabsTrigger>
            {allowGradient && <TabsTrigger value="gradient">Gradient</TabsTrigger>}
          </TabsList>

          {/* ───── Solid ───── */}
          <TabsContent value="solid" className="mt-3 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={HEX_RE.test(draft) ? draft : "#000000"}
                onChange={(e) => onNativePick(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border bg-transparent"
              />
              <Input
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  if (HEX_RE.test(e.target.value)) commit(e.target.value);
                }}
                className="h-9 flex-1 font-mono text-xs"
                placeholder="#RRGGBB"
              />
              {eyedropperSupported && (
                <button
                  type="button"
                  onClick={pickFromScreen}
                  title="Pick color from screen"
                  className="flex h-9 w-9 items-center justify-center rounded border hover:bg-muted"
                >
                  <Pipette className="h-4 w-4" />
                </button>
              )}
            </div>

            {contrast && (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-md border px-2 py-1.5 text-[11px]",
                  contrast.ok ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-amber-300 bg-amber-50 text-amber-800",
                )}
              >
                {contrast.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                <span>
                  Contrast {contrast.ratio.toFixed(2)}:1 — <strong>{contrast.label}</strong>
                </span>
                <span
                  className="ml-auto inline-flex h-4 w-8 overflow-hidden rounded border"
                  title="Preview"
                >
                  <span className="block h-full w-full text-center text-[9px] font-bold leading-4" style={{ background: contrastAgainst, color: value }}>
                    Aa
                  </span>
                </span>
              </div>
            )}

            {/* Recents */}
            <Section title={scope ? "Recent (this book)" : "Recent"}>
              {recents.length === 0 ? (
                <div className="text-[11px] text-muted-foreground">No recent colors yet</div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {recents.map((c) => (
                    <SwatchButton key={c} value={c} onClick={() => commit(c)} />
                  ))}
                </div>
              )}
            </Section>

            {/* Saved swatches */}
            <Section title="Saved swatches">
              {swatches.length === 0 ? (
                <div className="text-[11px] text-muted-foreground">No saved swatches yet</div>
              ) : (
                <div className="space-y-1">
                  {swatches.map((s) => (
                    <div key={s.name} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (isGradient(s.value)) {
                            const p = parseGradient(s.value);
                            if (p) {
                              setMode("gradient");
                              applyGradient(p.angle, p.from, p.to);
                              return;
                            }
                          }
                          commit(s.value);
                        }}
                        className="h-5 w-5 rounded border shadow-sm"
                        style={{ background: s.value }}
                        title={s.value}
                      />
                      <span className="flex-1 truncate text-[11px]">{s.name}</span>
                      <button
                        type="button"
                        onClick={() => removeSwatch(s.name)}
                        className="text-muted-foreground hover:text-destructive"
                        title="Remove"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-2 flex gap-1">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder='Name (e.g. "Clara Teal")'
                  className="h-7 flex-1 text-[11px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSwatch();
                    }
                  }}
                />
                <Button type="button" size="sm" variant="outline" onClick={addSwatch} className="h-7 px-2">
                  <Plus className="h-3.5 w-3.5" /> Save
                </Button>
              </div>
            </Section>

            {/* Curated palette */}
            <Section title="Palette">
              <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                {PALETTE.map((group) => (
                  <div key={group.name}>
                    <div className="mb-1 text-[10px] text-muted-foreground">{group.name}</div>
                    <div className="grid grid-cols-8 gap-1">
                      {group.colors.map((c) => (
                        <SwatchButton key={c} value={c} onClick={() => commit(c)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </TabsContent>

          {/* ───── Gradient ───── */}
          {allowGradient && (
            <TabsContent value="gradient" className="mt-3 space-y-3">
              <div
                className="h-12 w-full rounded border shadow-inner"
                style={{ background: buildGradient(gAngle, gFrom, gTo) }}
              />
              <div className="grid grid-cols-2 gap-2">
                <GradientStop
                  label="From"
                  value={gFrom}
                  onChange={(c) => applyGradient(gAngle, c, gTo)}
                />
                <GradientStop
                  label="To"
                  value={gTo}
                  onChange={(c) => applyGradient(gAngle, gFrom, c)}
                />
              </div>
              <label className="block text-[11px] text-muted-foreground">
                Angle: {gAngle}°
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={gAngle}
                  onChange={(e) => applyGradient(parseInt(e.target.value, 10), gFrom, gTo)}
                  className="mt-1 w-full"
                />
              </label>
              <div>
                <div className="mb-1 text-[10px] text-muted-foreground">Quick presets</div>
                <div className="grid grid-cols-6 gap-1">
                  {GRADIENT_PRESETS.map((p) => (
                    <button
                      key={`${p.from}-${p.to}-${p.angle}`}
                      type="button"
                      onClick={() => applyGradient(p.angle, p.from, p.to)}
                      className="h-6 w-full rounded border shadow-sm transition hover:scale-105"
                      style={{ background: buildGradient(p.angle, p.from, p.to) }}
                      title={`${p.from} → ${p.to}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-1">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Name this gradient"
                  className="h-7 flex-1 text-[11px]"
                />
                <Button type="button" size="sm" variant="outline" onClick={addSwatch} className="h-7 px-2">
                  <Plus className="h-3.5 w-3.5" /> Save
                </Button>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

/* ---------- subcomponents ---------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}

function SwatchButton({ value, onClick }: { value: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={value}
      className="h-7 w-7 rounded border shadow-sm transition hover:scale-110"
      style={{ background: value }}
    />
  );
}

function GradientStop({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
      <span>{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="color"
          value={HEX_RE.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border"
        />
        <Input
          value={value}
          onChange={(e) => {
            if (HEX_RE.test(e.target.value)) onChange(e.target.value);
          }}
          className="h-8 flex-1 font-mono text-[11px]"
        />
      </div>
    </label>
  );
}

const GRADIENT_PRESETS: { from: string; to: string; angle: number }[] = [
  { from: "#E9DCFB", to: "#FFF2A8", angle: 135 }, // lilac → butter
  { from: "#DCC7F7", to: "#FFE680", angle: 135 }, // lavender → yellow
  { from: "#F0E6FF", to: "#FFFDE4", angle: 135 }, // soft violet → cream
  { from: "#CDB4F0", to: "#FAD2E1", angle: 135 }, // lilac → pink
  { from: "#B19CD9", to: "#FFD96B", angle: 135 }, // violet → mustard pastel
  { from: "#E4C1F9", to: "#D0F4DE", angle: 135 }, // lilac → mint
  { from: "#FFF9C7", to: "#DCC7F7", angle: 90 },  // butter → lavender
  { from: "#D6CDEA", to: "#FFE5B4", angle: 90 },  // lavender → peach
  { from: "#A98EDC", to: "#F7C948", angle: 135 }, // violet → golden pastel
  { from: "#F3EAFE", to: "#FFFDE4", angle: 180 }, // ultra soft lilac → cream
  { from: "#9F86C0", to: "#E9DCFB", angle: 135 }, // deep → light violet
  { from: "#FFFFFF", to: "#CDB4F0", angle: 180 }, // white → lilac wash
];
