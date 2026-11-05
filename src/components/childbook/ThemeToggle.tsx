import { forwardRef } from "react";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { THEMES, useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "default" | "icon";
}

/** Cycles Colorful Daydream → Little Explorer → Timeless Tales. */
export const ThemeToggle = forwardRef<HTMLButtonElement, ThemeToggleProps>(function ThemeToggle(
  { className, size = "icon" },
  ref,
) {
  const { theme, setTheme } = useTheme();
  const idx = THEMES.findIndex((t) => t.id === theme);
  const next = THEMES[(idx + 1) % THEMES.length];
  const label = `Switch to ${next.name} theme`;

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      aria-label={label}
      title={label}
      onClick={() => setTheme(next.id)}
      className={cn(className)}
      ref={ref}
    >
      <Palette className={size === "icon" ? "h-5 w-5" : "h-4 w-4"} />
      {size !== "icon" && next.name}
    </Button>
  );
});

ThemeToggle.displayName = "ThemeToggle";
