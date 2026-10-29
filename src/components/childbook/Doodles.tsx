import { Leaf, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";

/** Tiny decorative SVGs for the scrapbook look. All are aria-hidden. */
export const Sparkle = ({ className, color = "currentColor" }: { className?: string; color?: string }) => (
  <svg aria-hidden viewBox="0 0 24 24" className={cn("h-5 w-5", className)} fill={color}>
    <path d="M12 0c.6 5.6 2.4 9.4 12 12-9.6 2.6-11.4 6.4-12 12-.6-5.6-2.4-9.4-12-12C9.6 9.4 11.4 5.6 12 0z" />
  </svg>
);

export const Squiggle = ({ className, color = "currentColor" }: { className?: string; color?: string }) => (
  <svg aria-hidden viewBox="0 0 80 12" className={cn("h-3 w-16", className)} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round">
    <path d="M3 6c6-8 10 8 16 0s10 8 16 0 10 8 16 0 10 8 22 0" />
  </svg>
);

export const Heart = ({ className, color = "currentColor" }: { className?: string; color?: string }) => (
  <svg aria-hidden viewBox="0 0 24 24" className={cn("h-5 w-5", className)} fill={color}>
    <path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z" />
  </svg>
);

export const Washi = ({ className, tone = "butter" }: { className?: string; tone?: "butter" | "coral" | "mint" | "sky" | "lavender" | "peach" }) => (
  <span aria-hidden className={cn("washi", className)} style={{ ["--tape" as string]: `var(--${tone})` }} />
);

/** The small floating accent that gives each theme its personality: heart (Daydream), paper plane (Explorer), leaf (Tales). */
export const ThemeAccent = ({ className }: { className?: string }) => {
  const { theme } = useTheme();
  if (theme === "explorer") return <Send aria-hidden className={cn("h-5 w-5", className)} strokeWidth={1.8} />;
  if (theme === "tales") return <Leaf aria-hidden className={cn("h-5 w-5", className)} strokeWidth={1.8} />;
  return <Heart className={className} />;
};
