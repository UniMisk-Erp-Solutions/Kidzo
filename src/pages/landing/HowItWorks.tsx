import { Button } from "@/components/ui/button";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { SEO } from "@/components/SEO";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, UserPlus, Camera, Sparkles, Share2, BookOpen, CheckCircle2 } from "lucide-react";
import ogImage from "@/assets/og-kidzopedia.jpg";

const STEPS = [
  {
    n: "01",
    icon: UserPlus,
    title: "Add your child",
    body: "Create a private profile in seconds — name, birthday, pronouns. We'll use the date of birth to surface age-appropriate milestone suggestions.",
  },
  {
    n: "02",
    icon: Camera,
    title: "Capture moments as they happen",
    body: "Snap a photo, jot a tiny story, tag who was there. We'll auto-fill the date from your photo's metadata so you can keep moving.",
  },
  {
    n: "03",
    icon: Sparkles,
    title: "Track milestones & achievements",
    body: "Log first words, first steps, first sports trophies — and watch a beautiful year-by-year story take shape.",
  },
  {
    n: "04",
    icon: Share2,
    title: "Invite the whole family",
    body: "Share per-child with a co-parent or grandparent as viewer or editor. They sign up with a single link and join in.",
  },
  {
    n: "05",
    icon: BookOpen,
    title: "Export a keepsake",
    body: "Filter by year and choose what to include, then download a printable PDF book — or just scroll back through any year, any time.",
  },
];

const HowItWorks = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <LandingLayout>
      <SEO
        title="How It Works — From First Hello to Lifelong Keepsake | Kidzopedia"
        description="Five gentle steps: add your child, capture moments, track milestones, invite family, and export a printable keepsake book."
        ogImage={ogImage}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "How Kidzopedia works",
            description: "Five gentle steps to build your child's keepsake.",
            step: STEPS.map((s, i) => ({
              "@type": "HowToStep",
              position: i + 1,
              name: s.title,
              text: s.body,
            })),
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              { "@type": "Question", name: "How long does it take to set up?", acceptedAnswer: { "@type": "Answer", text: "About sixty seconds. Add your child's name, birthday and pronouns and you're ready to capture your first memory." } },
              { "@type": "Question", name: "Do I need a different account for each parent?", acceptedAnswer: { "@type": "Answer", text: "No. Each adult has their own account and you grant them per-child access as viewer or editor." } },
              { "@type": "Question", name: "What if I add a memory on the wrong date?", acceptedAnswer: { "@type": "Answer", text: "You can edit the date, story and photo at any time — even years later." } },
              { "@type": "Question", name: "Can I import old photos?", acceptedAnswer: { "@type": "Answer", text: "Yes. Upload any photo and we'll auto-fill the date from its EXIF metadata so older memories land in the right year." } },
              { "@type": "Question", name: "Are milestones age-appropriate?", acceptedAnswer: { "@type": "Answer", text: "Yes. We use your child's birthday to surface developmental milestones that match their stage." } },
              { "@type": "Question", name: "Can I print my keepsake?", acceptedAnswer: { "@type": "Answer", text: "Yes — export a beautifully laid-out PDF that prints crisply at home or with any print shop." } },
            ],
          },
        ]}
      />
      <section className="bg-gradient-warm">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center md:py-24">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-primary-deep">How it works</span>
          <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">
            From first hello to lifelong keepsake — in five gentle steps.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">
            No spreadsheets, no scattered camera rolls. Just a calm, warm place that grows with your child.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 md:py-20">
        <ol className="space-y-6">
          {STEPS.map((s, i) => (
            <li key={s.n} className="relative rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex shrink-0 items-center gap-3 sm:flex-col">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/30 text-primary-deep">
                    <s.icon className="h-6 w-6" />
                  </span>
                  <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Step {s.n}</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold sm:text-2xl">{s.title}</h2>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div aria-hidden className="absolute left-9 -bottom-3 h-3 w-px bg-border sm:left-12" />
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center md:py-20">
          <h2 className="text-3xl font-bold md:text-4xl">Quietly powerful, gently designed.</h2>
          <ul className="mx-auto mt-6 grid max-w-xl gap-2 text-left text-[15px]">
            {[
              "Private by default — your data is yours",
              "Mobile-first — capture moments wherever you are",
              "Per-child sharing with viewer/editor roles",
              "PDF keepsake export with year filtering",
            ].map((b) => (
              <li key={b} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Button variant="warm" size="lg" onClick={() => navigate(user ? "/home" : "/auth")}>
              {user ? "Open Kidzopedia" : "Get started — it's free"} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
};

export default HowItWorks;
