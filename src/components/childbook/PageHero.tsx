import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Sparkle } from "./Doodles";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  /** Buttons / controls shown on the right (wraps below the text on phones). */
  actions?: ReactNode;
  className?: string;
}

/**
 * The colourful gradient banner used at the top of every app page, matching the Home hero.
 * Colours come from the section tokens (--sec-*), so it follows the active theme.
 */
export const PageHero = ({ title, subtitle, icon: Icon, actions, className }: Props) => (
  <header
    className={cn(
      "relative overflow-hidden rounded-[1.75rem] bg-sec-hero p-5 shadow-soft animate-fade-in-up sm:rounded-[2rem] sm:p-7",
      className,
    )}
  >
    <div className="absolute -bottom-10 -right-8 h-32 w-32 rounded-full bg-white/25" aria-hidden />

    <div className="relative flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        {Icon && (
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-soft sm:h-12 sm:w-12"
            style={{ color: "hsl(var(--plum))" }}
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.2} />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold leading-tight sm:text-3xl" style={{ color: "hsl(var(--plum))" }}>
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-[13px] text-plum/75 sm:text-[14px]">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="relative flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  </header>
);
