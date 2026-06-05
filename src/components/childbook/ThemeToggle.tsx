import { forwardRef } from "react";
import { Moon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "default" | "icon";
}

export const ThemeToggle = forwardRef<HTMLButtonElement, ThemeToggleProps>(function ThemeToggle(
  { className, size = "icon" },
  ref,
) {
  const { theme, setTheme } = useTheme();
  const next = theme === "dream" ? "legacy" : "dream";
  const label = theme === "dream" ? "Switch to Legacy theme" : "Switch to Soft Pastel Dream theme";

  if (size === "icon") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={label}
        title={label}
        onClick={() => setTheme(next)}
        className={cn(className)}
        ref={ref}
      >
        {theme === "dream" ? <Moon className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </Button>
    );
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => setTheme(next)}
      className={cn(className)}
      ref={ref}
    >
      {theme === "dream" ? <Moon className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      {theme === "dream" ? "Legacy" : "Dream"}
    </Button>
  );
});

ThemeToggle.displayName = "ThemeToggle";
