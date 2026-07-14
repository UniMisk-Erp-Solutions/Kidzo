import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Lock, RotateCcw } from "lucide-react";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { getConsent, resetConsent, saveConsent } from "@/lib/consent";
import { LEGAL } from "@/pages/legal/legalConfig";

const CookiePreferences = () => {
  const [diagnostics, setDiagnostics] = useState(false);
  const [preferences, setPreferences] = useState(false);
  const [decidedAt, setDecidedAt] = useState<string | null>(null);

  useEffect(() => {
    const c = getConsent();
    setDiagnostics(c?.diagnostics ?? false);
    setPreferences(c?.preferences ?? false);
    setDecidedAt(c?.decidedAt ?? null);
  }, []);

  const save = () => {
    const c = saveConsent({ diagnostics, preferences });
    setDecidedAt(c.decidedAt);
    toast.success("Preferences saved", {
      description: diagnostics
        ? "Diagnostics are on. You can turn them off here at any time."
        : "Optional cookies are off. Only strictly necessary storage is used.",
    });
  };

  const withdraw = () => {
    resetConsent();
    setDiagnostics(false);
    setPreferences(false);
    setDecidedAt(null);
    toast.success("Consent withdrawn", { description: "We've forgotten your choice and will ask again." });
  };

  return (
    <LandingLayout>
      <SEO
        title="Cookie Preferences · Kidzopedia"
        description="Turn Kidzopedia's optional cookies and diagnostics on or off. Withdrawing consent is as easy as giving it."
      />

      <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <Link
          to="/legal"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Company &amp; Legal
        </Link>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Cookie Preferences</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Your choice is stored on this device only and never leaves your browser. Under the DPDP Act, withdrawing
          consent must be as easy as giving it — so it is one button, right here.
        </p>

        <div className="mt-8 space-y-4">
          {/* Essential — locked */}
          <div className="rounded-2xl border border-border bg-muted/30 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
                  <Lock className="h-4 w-4 text-muted-foreground" /> Strictly necessary
                </h2>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                  Keeps you signed in and remembers this consent choice. The service cannot run without it, so it
                  cannot be switched off — and it needs no separate consent.
                </p>
              </div>
              <span className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[12px] font-medium text-primary-deep">
                <Check className="h-3 w-3" /> Always on
              </span>
            </div>
          </div>

          {/* Preferences */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-foreground">Preferences</h2>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                  Remembers your theme (light or dark) and which child you were last viewing, so the app opens where
                  you left off.
                </p>
              </div>
              <Switch checked={preferences} onCheckedChange={setPreferences} aria-label="Preferences cookies" />
            </div>
          </div>

          {/* Diagnostics */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-foreground">Error diagnostics</h2>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                  Sends a technical crash report when something breaks, so we can fix it. Runs on our own self-hosted
                  server with personal-information capture disabled, and reports are deleted after 90 days. The app
                  works exactly the same if you leave this off.
                </p>
              </div>
              <Switch checked={diagnostics} onCheckedChange={setDiagnostics} aria-label="Error diagnostics" />
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button variant="warm" onClick={save}>
            Save preferences
          </Button>
          <Button variant="outline" onClick={withdraw}>
            <RotateCcw className="h-4 w-4" /> Withdraw all consent
          </Button>
        </div>

        {decidedAt && (
          <p className="mt-4 text-[13px] text-muted-foreground">
            Your current choice was recorded on{" "}
            <strong className="font-medium text-foreground">
              {new Date(decidedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </strong>
            .
          </p>
        )}

        <p className="mt-10 text-[13.5px] leading-relaxed text-muted-foreground">
          For the full list of every cookie and storage key we set, see the{" "}
          <Link to="/legal/cookies" className="font-medium text-primary-deep hover:underline">
            Cookie Policy
          </Link>
          . Questions? Write to{" "}
          <a href={`mailto:${LEGAL.contactEmail}`} className="font-medium text-primary-deep hover:underline">
            {LEGAL.contactEmail}
          </a>
          .
        </p>
      </div>
    </LandingLayout>
  );
};

export default CookiePreferences;
