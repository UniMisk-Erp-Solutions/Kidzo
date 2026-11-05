import { Lock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { BookTemplateColors } from "@/hooks/useBookTemplates";

/**
 * Stand-in for a page the viewer's plan can't see. It is deliberately NOT the real page with a
 * blur on top — the real content is never rendered, so it can't be recovered from the DOM or
 * by removing a CSS filter. The "blurred" look is purely decorative shapes.
 */
export const LockedBookPage = ({
  colors,
  pageNumber,
}: {
  colors: BookTemplateColors;
  pageNumber: number;
}) => {
  const navigate = useNavigate();
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ backgroundColor: colors.primary }}>
      {/* decorative blurred blocks (no real content) */}
      <div className="absolute inset-0 blur-2xl" aria-hidden>
        <div className="absolute left-[8%] top-[10%] h-[34%] w-[46%] rotate-[-4deg] rounded-lg" style={{ backgroundColor: colors.accent, opacity: 0.55 }} />
        <div className="absolute right-[8%] top-[18%] h-[30%] w-[38%] rotate-[3deg] rounded-lg" style={{ backgroundColor: colors.coral, opacity: 0.45 }} />
        <div className="absolute bottom-[12%] left-[14%] h-[28%] w-[40%] rotate-[2deg] rounded-lg" style={{ backgroundColor: colors.gold, opacity: 0.5 }} />
        <div className="absolute bottom-[10%] right-[10%] h-[24%] w-[34%] rotate-[-3deg] rounded-lg" style={{ backgroundColor: colors.mint ?? colors.accent, opacity: 0.5 }} />
      </div>
      <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" aria-hidden />

      <div className="relative flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-soft">
          <Lock className="h-5 w-5 text-foreground" />
        </span>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Page {pageNumber} · locked
          </div>
          <h3 className="mt-1 text-[18px] font-bold leading-tight text-foreground">Upgrade to view</h3>
          <p className="mx-auto mt-1 max-w-[16rem] text-[13px] leading-relaxed text-muted-foreground">
            The free plan previews the first 2 pages. Upgrade to see every page, download your book and order a
            printed copy.
          </p>
        </div>
        <Button size="sm" variant="warm" onClick={() => navigate("/pricing-plans")}>
          <Sparkles className="h-4 w-4" /> Upgrade
        </Button>
      </div>
    </div>
  );
};
