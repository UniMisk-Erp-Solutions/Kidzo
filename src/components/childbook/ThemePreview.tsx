import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AppTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

interface ThemePreviewProps {
  open: boolean;
  theme: AppTheme;
  onClose: () => void;
  onApply: () => void;
}

const SCREENS = [
  { id: "home", label: "Home", path: "/home" },
  { id: "moments", label: "Moments", path: "/moments" },
  { id: "grow", label: "Grow", path: "/grow" },
] as const;

export function ThemePreview({ open, theme, onClose, onApply }: ThemePreviewProps) {
  const [idx, setIdx] = useState(0);

  if (!open) return null;

  const src = `${SCREENS[idx].path}?themePreview=${theme}`;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-background">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded-full bg-primary/30 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
            Preview
          </span>
          <span className="font-medium text-foreground">
            {theme === "dream" ? "Soft Pastel Dream" : "Legacy"} · {SCREENS[idx].label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" /> Exit
          </Button>
          <Button variant="warm" size="sm" onClick={onApply}>
            <Check className="h-4 w-4" /> Apply theme
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 border-b border-border bg-muted/40 py-2">
        {SCREENS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setIdx(i)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              i === idx
                ? "bg-primary-deep text-primary-foreground shadow-soft"
                : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <iframe
        key={src}
        src={src}
        title="Theme preview"
        className="flex-1 w-full border-0 bg-background"
      />
    </div>,
    document.body,
  );
}
