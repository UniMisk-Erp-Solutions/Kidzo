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
import { Squiggle } from "@/components/childbook/Doodles";
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
  { question: "Is Kidzopedia free?", answer: "Yes. The Free plan covers one child profile, free forever. Family (₹299/month, 2 children) and Premium (₹599/month, 5 children) add more children, storage and features." },
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

// Feature-card colours (olive, mustard, coral, lilac) with readable ink on each; defined in index.css
const TONES = [
  { bg: "olive", fg: "cream" },
  { bg: "mustard", fg: "ink" },
  { bg: "coral", fg: "ink" },
  { bg: "lilac", fg: "ink" },
];

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Kidzopedia",
            url: "https://kidzopedia.com",
            logo: "https://kidzopedia.byteosaurus.com/app-icon-512.png",
          },
          buildFaqJsonLd(HOME_FAQS),
        ]}
      />
      <div>
      {/* Hero — "Wash House"-style: peach cream, terracotta, olive ink, organic blob photo and a spinning badge */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-12 sm:px-6 md:grid-cols-[1.05fr_1fr] md:items-center md:gap-8 md:pb-24 md:pt-16">
          <div className="min-w-0 animate-fade-in-up">
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-primary">
              A loving keepsake for every childhood
            </p>
            <h1 className="font-display mt-4 text-[2.6rem] font-extrabold leading-[1.02] text-foreground sm:text-6xl lg:text-7xl">
              The little encyclopedia of your child's life.
            </h1>
            <Squiggle className="mt-5 h-3 w-20 text-[hsl(var(--wash-lilac-deep))]" />
            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-foreground/75 sm:text-[17px]">
              Thoughtful keepsakes. Serious memories. A warm, private home for every photo, milestone, certificate and
              tiny moment — made for daily rituals and a happier family.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button variant="warm" size="lg" onClick={goApp} className="max-w-full whitespace-normal rounded-lg">
                <span className="hidden sm:inline">
                  {user ? "Open my Kidzopedia" : "Start free — capture your first memory"}
                </span>
                <span className="sm:hidden">{user ? "Open my Kidzopedia" : "Start free"}</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Button>
              <Link
                to="/features"
                className="text-sm font-semibold text-foreground underline decoration-primary decoration-2 underline-offset-[6px] hover:text-primary"
              >
                See how it works
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[560px] animate-fade-in">
            <div
              aria-hidden
              className="absolute -right-5 -top-5 h-[90%] w-[90%] bg-[hsl(var(--wash-coral))]"
              style={{ borderRadius: "58% 42% 46% 54% / 44% 56% 44% 56%" }}
            />
            <div
              className="relative overflow-hidden bg-card shadow-lift"
              style={{ borderRadius: "42% 58% 38% 62% / 52% 40% 60% 48%" }}
            >
              <img
                src={heroImage}
                alt="A warm illustration of a family looking through their child's memory book together"
                width={1280}
                height={1024}
                className="aspect-square h-auto w-full object-cover"
              />
            </div>

            <div className="absolute -left-2 top-8 hidden rounded-2xl border border-border bg-card px-3 py-2 shadow-soft md:flex md:items-center md:gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-foreground">
                <Heart className="h-4 w-4" />
              </span>
              <div className="text-left">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">First word</div>
                <div className="text-[13px] font-semibold">"Mama" — Day 287</div>
              </div>
            </div>
            <div className="absolute -left-4 bottom-10 hidden rounded-2xl border border-border bg-card px-3 py-2 shadow-soft md:flex md:items-center md:gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-foreground">
                <Trophy className="h-4 w-4" />
              </span>
              <div className="text-left">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Achievement</div>
                <div className="text-[13px] font-semibold">Swim badge — Level 2</div>
              </div>
            </div>

            {/* Spinning "made with love" badge */}
            <div className="absolute -bottom-5 right-0 h-28 w-28 sm:h-32 sm:w-32" aria-hidden>
              <svg viewBox="0 0 120 120" className="wash-spin h-full w-full">
                <defs>
                  <path id="badge-ring" d="M60,60 m-41,0 a41,41 0 1,1 82,0 a41,41 0 1,1 -82,0" />
                </defs>
                <circle cx="60" cy="60" r="58" fill="hsl(var(--accent))" />
                <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1" strokeDasharray="2 4" />
                <text fontSize="10" fontWeight="700" fill="hsl(var(--foreground))">
                  <textPath href="#badge-ring" textLength="252" lengthAdjust="spacing">MADE WITH LOVE · MADE TO KEEP ·</textPath>
                </text>
              </svg>
              <Heart className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 fill-primary text-primary" />
            </div>
          </div>
        </div>
      </section>

      {/* Lilac band, like the reference's values strip */}
      <section className="bg-[hsl(var(--wash-lilac))]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-5 px-6 py-7 sm:grid-cols-4">
          {[
            { icon: Lock, label: "Private by default" },
            { icon: FileText, label: "PDF keepsake export" },
            { icon: Users, label: "Share with grandparents" },
            { icon: BookHeart, label: "Made for every family" },
          ].map((v) => (
            <div key={v.label} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-foreground/70 text-foreground">
                <v.icon className="h-[18px] w-[18px]" />
              </span>
              <span className="text-[12px] font-bold uppercase leading-tight tracking-wider text-foreground">{v.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features quick grid */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-primary-deep">Everything in one place</span>
          <h2 className="font-display mt-2 text-3xl font-bold md:text-4xl">A keepsake that grows with them</h2>
          <p className="mt-3 text-muted-foreground">
            Four warm, focused modules — designed to make remembering effortless and beautiful.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {features.map((f, i) => (
            <article
              key={f.title}
              style={{ background: `hsl(var(--wash-${TONES[i % 4].bg}))`, color: `hsl(var(--wash-${TONES[i % 4].fg}))` }}
              className="group relative overflow-hidden rounded-3xl p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift sm:p-8"
            >
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-[hsl(var(--wash-ink))]">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display mt-3 text-2xl font-extrabold">{f.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed opacity-90">{f.body}</p>
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
            <h2 className="font-display mt-2 text-3xl font-bold md:text-4xl">Milestones, beautifully kept by year</h2>
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
          <h2 className="font-display mt-2 text-3xl font-bold md:text-4xl">A little love letter to childhood</h2>
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
          <h2 className="font-display text-3xl font-bold md:text-4xl">Start your child's Kidzopedia today.</h2>
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
      </div>
    </LandingLayout>
  );
};

export default Landing;
