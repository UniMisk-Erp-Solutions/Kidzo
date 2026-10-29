import { Check, Cloud, Eye, Leaf, RotateCcw, Send, Sparkles, Star, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DEFAULT_THEME, THEMES, type AppTheme, type ThemeMeta } from "@/hooks/useTheme";

const DECOR: Record<AppTheme, { Icon: typeof Cloud; className: string }[]> = {
  daydream: [{ Icon: Sparkles, className: "right-2 top-2" }, { Icon: Star, className: "left-[46%] bottom-9" }],
  explorer: [{ Icon: Cloud, className: "right-2 top-2" }, { Icon: Send, className: "left-[48%] bottom-9" }],
  tales: [{ Icon: Leaf, className: "right-2 top-2" }, { Icon: Sun, className: "left-[48%] bottom-9" }],
};

/** A miniature of the real theme. Uses fixed colours from THEMES[].preview so it looks right whatever theme is active. */
const MiniPreview = ({ t }: { t: ThemeMeta }) => (
  <div
    aria-hidden
    className="relative h-36 overflow-hidden rounded-xl border border-black/5"
    style={{ background: t.preview.bg, color: t.preview.ink }}
  >
    <div className="absolute inset-x-2 top-2 h-[58px] rounded-lg" style={{ background: t.preview.hero }} />
    <div className="absolute left-4 top-4 space-y-1">
      <div className="h-2 w-16 rounded-full" style={{ background: t.preview.ink, opacity: 0.85 }} />
      <div className="h-1.5 w-10 rounded-full" style={{ background: t.preview.ink, opacity: 0.35 }} />
      <div className="mt-2 h-4 w-14 rounded-full" style={{ background: t.preview.button }} />
    </div>
    <div
      className="absolute right-5 top-5 h-9 w-8 rotate-6 rounded-[2px] bg-white shadow-md"
      style={{ padding: "2px 2px 7px" }}
    >
      <div className="h-full w-full rounded-[1px]" style={{ background: t.preview.stats[0], opacity: 0.8 }} />
    </div>
    {DECOR[t.id].map(({ Icon, className }, i) => (
      <Icon key={i} className={cn("absolute h-3.5 w-3.5 opacity-60", className)} style={{ color: t.preview.stats[i % 3] }} />
    ))}
    <div className="absolute inset-x-2 top-[72px] grid grid-cols-3 gap-1.5">
      {t.preview.stats.map((c, i) => (
        <div key={i} className="h-8 rounded-lg" style={{ background: c, opacity: 0.9 }} />
      ))}
    </div>
    <div className="absolute inset-x-2 bottom-1.5 flex justify-between rounded-lg bg-white/80 px-2 py-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className="h-2 w-5 rounded-full" style={{ background: i === 0 ? t.preview.stats[0] : "#0000001a" }} />
      ))}
    </div>
  </div>
);

interface Props {
  theme: AppTheme;
  onSelect: (t: AppTheme) => void;
  onPreview: (t: AppTheme) => void;
  onReset: () => void;
}

export const ThemePicker = ({ theme, onSelect, onPreview, onReset }: Props) => (
  <div>
    <div className="grid gap-4 md:grid-cols-3" role="radiogroup" aria-label="Theme">
      {THEMES.map((t) => {
        const active = theme === t.id;
        return (
          <div
            key={t.id}
            className={cn(
              "group relative flex flex-col gap-3 rounded-3xl border-2 p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift",
              active ? "border-primary-deep bg-primary/5 shadow-soft" : "border-border bg-card",
            )}
          >
            <button
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(t.id)}
              className="rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MiniPreview t={t} />
              <div className="mt-3 flex items-center justify-between gap-2 px-1">
                <div className="font-display text-base font-bold text-foreground">{t.name}</div>
                {active && (
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-deep text-primary-foreground"
                    aria-label="Selected"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
              <p className="px-1 text-xs text-muted-foreground">{t.tagline}</p>
              <div className="mt-2 flex gap-1.5 px-1">
                {t.swatches.map((c) => (
                  <span key={c} className="h-5 w-5 rounded-full border border-black/10" style={{ background: c }} title={c} />
                ))}
              </div>
            </button>
            <Button type="button" variant="outline" size="sm" onClick={() => onPreview(t.id)} className="mt-auto">
              <Eye className="h-4 w-4" /> Preview
            </Button>
          </div>
        );
      })}
    </div>
    <div className="mt-3 flex justify-end">
      <Button type="button" variant="ghost" size="sm" onClick={onReset}>
        <RotateCcw className="h-4 w-4" /> Reset to {THEMES.find((t) => t.id === DEFAULT_THEME)?.name}
      </Button>
    </div>
  </div>
);
