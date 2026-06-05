import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookHeart,
  Camera,
  CheckCircle2,
  FileText,
  Heart,
  Sparkles,
  Star,
  Trophy,
  Users,
  Cake,
  GraduationCap,
  Music,
  Award,
  BookOpen,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { SEO } from "@/components/SEO";
import heroImage from "@/assets/landing-hero.jpg";
import heroImageDream from "@/assets/landing-hero-dream.jpg";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import featMemories from "@/assets/landing-feature-memories.png";
import featGrow from "@/assets/landing-feature-grow.png";
import featRecords from "@/assets/landing-feature-records.png";
import featFamily from "@/assets/landing-feature-family.png";
import logo from "@/assets/kidzopedia-logo.png";
import ogImage from "@/assets/og-kidzopedia.jpg";
import { buildFaqJsonLd } from "@/lib/seoJsonLd";

const HOME_FAQS = [
  { question: "What is Kidzopedia?", answer: "Kidzopedia is a warm, private digital keepsake where parents capture photos, milestones, achievements and important records for each child — and turn them into a printable PDF book." },
  { question: "Is Kidzopedia free?", answer: "Yes. The Free plan covers one child with unlimited memories and milestones. Family and Lifetime plans add multi-child support and extra storage." },
  { question: "Who can see my child's memories?", answer: "Only you and the family members you explicitly invite. Every child has its own access list and roles (viewer or editor) you control." },
  { question: "Can grandparents and co-parents join?", answer: "Yes — share per child with a single magic link. They sign up in seconds with no app store or special setup." },
  { question: "Can I export everything as a printable book?", answer: "Yes. Filter by year, choose what to include, and download a beautiful PDF keepsake any time." },
  { question: "Is my data private?", answer: "Always. Your data is yours. We don't sell data, we don't run ads, and access is locked down by strict per-child rules." },
  { question: "Does Kidzopedia work on mobile?", answer: "Yes. Kidzopedia is mobile-first — capture a memory in seconds wherever you are, with the photo's date filled in automatically from EXIF." },
];

const features = [
  {
    icon: Camera,
    title: "Memories that breathe",
    body: "Capture photos, little stories and reactions. Tag who was there. Search by date, mood or category later.",
    image: featMemories,
    accent: "from-secondary/30 to-primary/20",
  },
  {
    icon: Trophy,
    title: "Grow with them",
    body: "Track academics, sports, music, art and certifications — with photos and a beautiful year-by-year summary.",
    image: featGrow,
    accent: "from-primary/30 to-accent/30",
  },
  {
    icon: FileText,
    title: "A safe records vault",
    body: "Birth certificates, vaccinations, school papers — privately stored and organised, always within reach.",
    image: featRecords,
    accent: "from-accent/30 to-secondary/20",
  },
  {
    icon: Users,
    title: "Made for the whole family",
    body: "Invite a co-parent or grandparent as a viewer or editor — per child, fully under your control.",
    image: featFamily,
    accent: "from-primary/25 to-secondary/25",
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const hero = theme === "dream" ? heroImageDream : heroImage;
  const goApp = () => navigate(user ? "/home" : "/auth");

  return (
    <LandingLayout>
      <SEO
        title="Kidzopedia — The Little Encyclopedia of Your Child's Life"
        description="A warm, private digital keepsake for parents to capture memories, track milestones, and safely store every important document of your child's life."
        ogImage={ogImage}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Kidzopedia",
            description: "Capture memories, track milestones, and store records — turn it all into a printed keepsake.",
            applicationCategory: "LifestyleApplication",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Kidzopedia",
            url: "https://kidzopedia.com",
            logo: "https://kidzopedia.com/og-kidzopedia.jpg",
          },
          buildFaqJsonLd(HOME_FAQS),
        ]}
      />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -top-10 right-0 h-80 w-80 rounded-full bg-secondary/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-12 sm:px-6 md:grid-cols-2 md:items-center md:gap-12 md:pt-20 md:pb-24">
          <div className="min-w-0 animate-fade-in-up">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1 text-[12px] font-medium text-foreground/80 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              A loving keepsake for every childhood
            </span>
            <h1 className="mt-4 text-[2rem] font-bold leading-[1.1] tracking-tight [hyphens:none] [overflow-wrap:normal] sm:text-4xl md:text-5xl lg:text-6xl">
              The little{" "}
              <span className="inline-block bg-gradient-celebrate bg-clip-text text-transparent [-webkit-background-clip:text]">
                encyclopedia
              </span>{" "}
              of your child's life.
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-muted-foreground sm:text-[17px]">
              Kidzopedia is a warm, private home for every photo, milestone, certificate and tiny moment —
              gathered in one beautiful keepsake you'll cherish for decades.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button variant="warm" size="lg" onClick={goApp} className="max-w-full whitespace-normal">
                <span className="hidden sm:inline">
                  {user ? "Open my Kidzopedia" : "Start free — capture your first memory"}
                </span>
                <span className="sm:hidden">{user ? "Open my Kidzopedia" : "Start free"}</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Button>
              <Link to="/features" className="text-sm font-medium text-primary-deep underline-offset-4 hover:underline">
                See how it works
              </Link>
            </div>

            {/* Theme selector */}
            <div className="mt-5 inline-flex items-center gap-1 rounded-full border border-border bg-card/70 p-1 shadow-soft backdrop-blur">
              <span className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Theme
              </span>
              {([
                { id: "legacy" as const, label: "Legacy" },
                { id: "dream" as const, label: "Dream" },
              ]).map((t) => {
                const active = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "bg-primary-deep text-primary-foreground shadow-soft"
                        : "text-foreground/70 hover:bg-muted hover:text-foreground",
                    )}
                    aria-pressed={active}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted-foreground">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Private by default</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> PDF keepsake export</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Share with grandparents</li>
            </ul>
          </div>

          <div className="relative animate-fade-in">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-hero opacity-70 blur-2xl" aria-hidden />
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-lift">
              <img
                src={hero}
                alt="A warm illustration of a family looking through their child's memory book together"
                width={1280}
                height={1024}
                className="h-auto w-full object-cover"
              />
            </div>
            <div className="absolute -left-4 top-6 hidden rounded-2xl border border-border bg-card px-3 py-2 shadow-soft md:flex md:items-center md:gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/40 text-secondary-foreground">
                <Heart className="h-4 w-4" />
              </span>
              <div className="text-left">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">First word</div>
                <div className="text-[13px] font-semibold">"Mama" — Day 287</div>
              </div>
            </div>
            <div className="absolute -right-3 bottom-6 hidden rounded-2xl border border-border bg-card px-3 py-2 shadow-soft md:flex md:items-center md:gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/30 text-primary-deep">
                <Trophy className="h-4 w-4" />
              </span>
              <div className="text-left">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Achievement</div>
                <div className="text-[13px] font-semibold">Swim badge — Level 2</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats / belief strip */}
      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 sm:grid-cols-3">
          {[
            { k: "Every photo,", v: "kept beautifully" },
            { k: "Every milestone,", v: "celebrated forever" },
            { k: "Every record,", v: "safe and at hand" },
          ].map((s) => (
            <div key={s.k} className="text-center">
              <div className="text-[13px] font-medium uppercase tracking-wider text-muted-foreground">{s.k}</div>
              <div className="mt-1 text-xl font-semibold text-foreground md:text-2xl">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features quick grid */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-primary-deep">Everything in one place</span>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">A keepsake that grows with them</h2>
          <p className="mt-3 text-muted-foreground">
            Four warm, focused modules — designed to make remembering effortless and beautiful.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {features.map((f) => (
            <article
              key={f.title}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift sm:p-7"
            >
              <div className={`pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br ${f.accent} blur-2xl`} aria-hidden />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/30 text-primary-deep">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 text-xl font-semibold">{f.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
                <img
                  src={f.image}
                  alt={`${f.title} — illustration of the Kidzopedia feature`}
                  loading="lazy"
                  width={768}
                  height={768}
                  className="h-32 w-32 shrink-0 object-contain transition-transform group-hover:scale-105 sm:h-40 sm:w-40"
                />
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button variant="soft" size="lg" onClick={() => navigate("/features")}>
            Explore all features <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Keepsake / milestone preview */}
      <section className="bg-gradient-warm">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-primary-deep">A peek inside</span>
            <h2 className="mt-2 text-3xl font-bold md:text-4xl">Milestones, beautifully kept by year</h2>
          </div>

          <div className="mt-12 grid items-start gap-8 md:grid-cols-5 md:gap-10">
            <div className="md:col-span-3">
              <div className="rounded-[2rem] border border-border bg-card p-5 shadow-soft sm:p-7">
                {[
                  {
                    year: "2025", age: "Age 4",
                    items: [
                      { icon: GraduationCap, t: "First day of pre-K", d: "Brave smile, tiny backpack.", tone: "bg-primary/25 text-primary-deep" },
                      { icon: Music, t: "First piano recital", d: "Played 'Twinkle Twinkle' end-to-end.", tone: "bg-secondary/30 text-secondary-foreground" },
                    ],
                  },
                  {
                    year: "2024", age: "Age 3",
                    items: [
                      { icon: Cake, t: "Third birthday", d: "Strawberry cake, three big candles.", tone: "bg-accent/40 text-accent-foreground" },
                      { icon: Award, t: "Swim badge — Level 1", d: "Floated unaided for ten whole seconds!", tone: "bg-primary/25 text-primary-deep" },
                    ],
                  },
                  {
                    year: "2023", age: "Age 2",
                    items: [
                      { icon: Heart, t: "First full sentence", d: "'I do it myself!' — independence unlocked.", tone: "bg-secondary/30 text-secondary-foreground" },
                    ],
                  },
                ].map((y, idx, arr) => (
                  <div key={y.year} className={idx < arr.length - 1 ? "pb-6" : ""}>
                    <div className="mb-4 flex items-baseline justify-between border-b border-border/60 pb-2">
                      <h3 className="text-2xl font-bold tracking-tight text-foreground">{y.year}</h3>
                      <span className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">{y.age}</span>
                    </div>
                    <ul className="space-y-3">
                      {y.items.map((m) => (
                        <li key={m.t} className="flex items-start gap-3 rounded-2xl bg-muted/40 p-3 transition-colors hover:bg-muted/70">
                          <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${m.tone}`}>
                            <m.icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="text-[15px] font-semibold text-foreground">{m.t}</div>
                            <div className="text-[13px] text-muted-foreground">{m.d}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="relative">
                <div aria-hidden className="pointer-events-none absolute -inset-4 rounded-[2.5rem] bg-gradient-celebrate opacity-30 blur-2xl" />
                <div className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-warm p-6 shadow-lift">
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/30 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-secondary-foreground">
                        <BookOpen className="h-3 w-3" /> Keepsake
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">PDF · 2024</span>
                    </div>
                    <div className="mt-5 text-center">
                      <BookHeart className="mx-auto h-10 w-10 text-primary-deep" strokeWidth={1.8} />
                      <div className="mt-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">The book of</div>
                      <div className="mt-1 text-2xl font-bold tracking-tight text-foreground">Clara, age 3</div>
                      <div className="mt-0.5 text-[12px] text-muted-foreground">A year in 47 little moments</div>
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      {[
                        "from-primary/30 to-primary/10",
                        "from-secondary/30 to-secondary/10",
                        "from-accent/40 to-accent/10",
                        "from-accent/30 to-accent/10",
                        "from-primary/25 to-primary/10",
                        "from-secondary/25 to-secondary/10",
                      ].map((c, i) => (
                        <div key={i} className={`aspect-square rounded-lg bg-gradient-to-br ${c}`} />
                      ))}
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3 text-[12px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" /> Private</span>
                      <span>Made with Kidzopedia</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-primary-deep">Loved by families</span>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">A little love letter to childhood</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { q: "It's like a baby book — but it grows with her. I open it every Sunday and add little things from the week.", a: "Priya, mom of Aanya (3)" },
            { q: "I'm a grandparent thousands of miles away. Now I see every milestone the day it happens. I cried at the first one.", a: "George, grandpa of Theo (1)" },
            { q: "All our school certificates and vaccination cards in one safe place. I exported the year as a PDF — gorgeous.", a: "Noor, dad of Zayn (7) and Ali (4)" },
          ].map((t) => (
            <figure key={t.a} className="rounded-3xl border border-border bg-card p-7 shadow-soft">
              <div className="flex items-center gap-0.5 text-accent">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="h-4 w-4 fill-current" strokeWidth={0} />
                ))}
              </div>
              <blockquote className="mt-3 text-[15px] leading-relaxed text-foreground/90">"{t.q}"</blockquote>
              <figcaption className="mt-4 text-[13px] font-medium text-muted-foreground">— {t.a}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 pb-20">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-border bg-gradient-hero p-10 text-center shadow-lift md:p-16">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full bg-secondary/40 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -left-16 -bottom-16 h-60 w-60 rounded-full bg-primary/40 blur-3xl" />
          <img src={logo} alt="Kidzopedia logo" width={64} height={64} className="mx-auto mb-4 h-16 w-16" />
          <h2 className="text-3xl font-bold md:text-4xl">Start your child's Kidzopedia today.</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            One photo, one tiny story — and a beautiful keepsake begins.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button variant="warm" size="lg" onClick={goApp}>
              {user ? "Open my Kidzopedia" : "Create your free account"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            {!user && (
              <Button variant="ghost" size="lg" onClick={() => navigate("/auth")}>
                I already have an account
              </Button>
            )}
          </div>
        </div>
      </section>
    </LandingLayout>
  );
};

export default Landing;
