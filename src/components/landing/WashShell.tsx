import { ReactNode, useLayoutEffect } from "react";
import { LandingBackdrop } from "@/components/landing/LandingBackdrop";
import { cn } from "@/lib/utils";

/**
 * Page frame for screens outside LandingLayout (sign in, password reset) that should share the public "Wash House"
 * look: sets `<html data-landing="wash">` and floats the animated backdrop behind the content.
 */
export const WashShell = ({ className, children }: { className?: string; children: ReactNode }) => {
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-landing", "wash");
    return () => document.documentElement.removeAttribute("data-landing");
  }, []);

  return (
    <div className={cn("relative isolate overflow-hidden", className)}>
      <LandingBackdrop />
      {children}
    </div>
  );
};
