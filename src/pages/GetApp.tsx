import { useEffect, useState } from "react";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import {
  Apple,
  Smartphone,
  Download,
  Share,
  PlusSquare,
  Globe,
  CheckCircle2,
} from "lucide-react";

/**
 * Public download URL for the Android build.
 * The APK is served as a static file from /public — drop the signed build at
 * public/downloads/kidzopedia.apk (or point this at a GitHub Release / object store).
 */
const ANDROID_APK_URL = "/downloads/kidzopedia.apk";

type Platform = "android" | "ios" | "desktop";

const detectPlatform = (): Platform => {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua) || (/Mac/i.test(ua) && "ontouchend" in document))
    return "ios";
  return "desktop";
};

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-soft sm:p-8">
    {children}
  </div>
);

const Step = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3 text-left text-muted-foreground">
    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary-deep" strokeWidth={2.2} />
    <span>{children}</span>
  </li>
);

const GetApp = () => {
  const [platform, setPlatform] = useState<Platform>("desktop");

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  return (
    <LandingLayout>
      <SEO
        title="Get the Kidzopedia App — Android & iPhone"
        description="Install Kidzopedia on your phone. Download the Android app or add Kidzopedia to your iPhone home screen — same app, same account, works everywhere."
      />

      <section className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-20">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/30 text-primary-deep shadow-soft">
          <Smartphone className="h-7 w-7" strokeWidth={2.2} />
        </span>
        <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
          Take Kidzopedia anywhere
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground sm:text-lg">
          The same Kidzopedia you love — now on your phone. Same account, same
          memories, perfectly in sync. Install it, or just keep using it in your
          browser.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {/* Android */}
          <Card>
            <div className="flex items-center justify-center gap-2 text-primary-deep">
              <Smartphone className="h-6 w-6" strokeWidth={2.2} />
              <h2 className="text-xl font-semibold">Android</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Download and install the Kidzopedia app.
            </p>
            <Button asChild size="lg" className="mt-5 w-full">
              <a href={ANDROID_APK_URL} download>
                <Download className="mr-2 h-5 w-5" />
                Download for Android
              </a>
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              After downloading, open the file and tap <b>Install</b>. You may
              need to allow “Install from this source”.
            </p>
          </Card>

          {/* iPhone / iPad */}
          <Card>
            <div className="flex items-center justify-center gap-2 text-primary-deep">
              <Apple className="h-6 w-6" strokeWidth={2.2} />
              <h2 className="text-xl font-semibold">iPhone &amp; iPad</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Add Kidzopedia to your home screen — it opens just like an app.
            </p>
            <ul className="mt-5 space-y-3 text-sm">
              <Step>
                Open this page in <b>Safari</b>.
              </Step>
              <Step>
                Tap the <Share className="inline h-4 w-4 align-text-bottom" />{" "}
                <b>Share</b> button.
              </Step>
              <Step>
                Choose{" "}
                <PlusSquare className="inline h-4 w-4 align-text-bottom" />{" "}
                <b>Add to Home Screen</b>.
              </Step>
            </ul>
          </Card>
        </div>

        {/* Browser */}
        <div className="mt-6">
          <Card>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:text-left">
              <div className="flex items-center gap-3">
                <Globe className="h-6 w-6 text-primary-deep" strokeWidth={2.2} />
                <div>
                  <h2 className="text-lg font-semibold">Prefer the browser?</h2>
                  <p className="text-sm text-muted-foreground">
                    Kidzopedia works fully in any browser — no install needed.
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="lg">
                <a href="/">Open in browser</a>
              </Button>
            </div>
          </Card>
        </div>

        {/* Contextual hint based on the visitor's device */}
        {platform === "ios" && (
          <p className="mt-8 text-sm text-muted-foreground">
            You’re on an iPhone/iPad — follow the steps above to add Kidzopedia
            to your home screen.
          </p>
        )}
        {platform === "android" && (
          <p className="mt-8 text-sm text-muted-foreground">
            You’re on Android — tap “Download for Android” above to install.
          </p>
        )}
        {platform === "desktop" && (
          <p className="mt-8 text-sm text-muted-foreground">
            On a computer? Open this page on your phone to install the app, or
            keep using Kidzopedia right here in your browser.
          </p>
        )}
      </section>
    </LandingLayout>
  );
};

export default GetApp;
