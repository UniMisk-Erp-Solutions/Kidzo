import { Check, Palette } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { THEMES, useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

/** Quick theme switcher for the top bar: each option shows its colour palette so the themes are easy to tell apart. */
export const ThemeMenu = () => {
  const { theme, setTheme } = useTheme();
  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Change theme (now ${current.name})`}
        title={`Theme: ${current.name}`}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground"
      >
        <Palette className="h-[18px] w-[18px]" strokeWidth={2} />
        {/* tiny swatch of the active theme */}
        <span
          aria-hidden
          className="absolute bottom-1.5 right-1.5 h-2.5 w-2.5 rounded-full border border-card"
          style={{ background: current.swatches[0] }}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 rounded-2xl p-2">
        <DropdownMenuLabel className="px-2 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
          Choose a theme
        </DropdownMenuLabel>
        {THEMES.map((t) => {
          const active = t.id === theme;
          return (
            <DropdownMenuItem
              key={t.id}
              onSelect={() => {
                setTheme(t.id);
                toast.success(`Theme: ${t.name}`);
              }}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl p-2.5",
                active && "bg-primary/10",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="font-display text-[15px] font-bold text-foreground">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.tagline}</div>
                <div className="mt-2 flex gap-1.5" aria-hidden>
                  {t.swatches.map((c) => (
                    <span key={c} className="h-5 w-5 rounded-full border border-black/10" style={{ background: c }} />
                  ))}
                </div>
              </div>
              {active && (
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-deep text-primary-foreground"
                  aria-label="Current theme"
                >
                  <Check className="h-3 w-3" />
                </span>
              )}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="rounded-lg text-xs text-muted-foreground">
          <Link to="/settings">More options in Settings</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
