import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, CalendarClock, Camera, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const TOUR_KEY = "childbook:featureTour:v1";

type Step = {
  icon: typeof Sparkles;
  title: string;
  body: string;
  cta?: { label: string; to: string };
};

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: "Welcome to Kidzopedia 💛",
    body: "A private home for your child's memories, milestones and keepsakes. Let's show you two little things that make capturing easier.",
  },
  {
    icon: CalendarClock,
    title: "Live milestone timeline preview",
    body: "When you add or edit your child's birthdate, you'll instantly see which stage they're in (Newborn → Toddler → School age) and the next firsts to look forward to. Try changing the date — the timeline updates live.",
    cta: { label: "Try it in Settings", to: "/settings" },
  },
  {
    icon: Camera,
    title: "Auto-fill date from your photo",
    body: "Upload a photo to a new memory and we'll read the EXIF metadata to fill 'Date & time' precisely — including the hour. You can still adjust it in the picker, and the calendar remembers your last view.",
    cta: { label: "Try it now", to: "/moments/new" },
  },
];

export const FeatureTour = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(TOUR_KEY);
    if (!seen) {
      // Slight delay so the dashboard mounts first
      const t = setTimeout(() => setOpen(true), 400);
      return () => clearTimeout(t);
    }
  }, []);

  const finish = () => {
    localStorage.setItem(TOUR_KEY, "1");
    setOpen(false);
    setStep(0);
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else finish();
  };

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : finish())}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <button
          type="button"
          onClick={finish}
          aria-label="Skip tour"
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <DialogHeader className="space-y-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/25 text-primary-deep">
            <Icon className="h-6 w-6" />
          </span>
          <DialogTitle className="text-xl">{current.title}</DialogTitle>
        </DialogHeader>

        <p className="text-[14px] leading-relaxed text-muted-foreground">{current.body}</p>

        {/* Step indicators */}
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "w-6 bg-primary-deep" : "w-1.5 bg-border",
              )}
            />
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button variant="ghost" onClick={finish} className="sm:order-1">
            Skip tour
          </Button>
          <div className="flex gap-2 sm:order-2">
            {current.cta && (
              <Button
                variant="soft"
                onClick={() => {
                  finish();
                  navigate(current.cta!.to);
                }}
              >
                {current.cta.label}
              </Button>
            )}
            <Button variant="warm" onClick={next}>
              {isLast ? "Got it" : "Next"}
              {!isLast && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
