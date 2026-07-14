import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONSENT_EVENT, acceptAll, getConsent, rejectOptional } from "@/lib/consent";

/**
 * Shown once, until the visitor makes a choice. Rejecting is exactly as easy as
 * accepting (one click, same prominence) — that is the DPDP/GDPR expectation.
 */
export const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getConsent() === null);
    const onChange = () => setVisible(getConsent() === null);
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 p-4 shadow-soft backdrop-blur-xl print:hidden"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center">
        <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-primary-deep sm:flex">
          <Cookie className="h-5 w-5" />
        </span>

        <p className="flex-1 text-[13.5px] leading-relaxed text-muted-foreground">
          We use essential storage to keep you signed in. Optional diagnostics help us fix crashes. We never track
          your child, profile them, or run advertising.{" "}
          <Link to="/legal/cookies" className="font-medium text-primary-deep hover:underline">
            Cookie Policy
          </Link>
        </p>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => rejectOptional()}>
            Essential only
          </Button>
          <Button variant="warm" size="sm" onClick={() => acceptAll()}>
            Accept all
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/legal/cookie-preferences">Customise</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
