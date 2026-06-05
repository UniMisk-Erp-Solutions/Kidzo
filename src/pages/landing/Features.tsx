import { ArrowRight, Camera, FileText, Trophy, Users, Calendar, Sparkles, Lock, Share2, Download, BookHeart, Heart, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { SEO } from "@/components/SEO";
import { useNavigate } from "react-router-dom";
import ogImage from "@/assets/og-kidzopedia.jpg";
import { useAuth } from "@/contexts/AuthContext";

const FEATURES = [
  { icon: Camera, title: "Memories that breathe", body: "Capture photos, stories, reactions, and tag who was there. Auto-fill the date from your photo's metadata." },
  { icon: Trophy, title: "Grow with them", body: "Track academics, sports, music and art achievements with photos and a year-by-year summary." },
  { icon: FileText, title: "A safe records vault", body: "Birth certificates, vaccinations, school papers — privately stored and searchable." },
  { icon: Users, title: "Made for the whole family", body: "Invite a co-parent or grandparent as viewer or editor — per child, fully under your control." },
  { icon: Calendar, title: "Milestone timelines", body: "See typical developmental milestones and where your child lands today." },
  { icon: Download, title: "PDF keepsake export", body: "Filter by year and choose what to include, then download a printable book in seconds." },
  { icon: Lock, title: "Private by default", body: "Your data is yours. Strict access rules — only the people you invite see anything." },
  { icon: Share2, title: "Easy share links", body: "Send a magic link and family members are in. No app stores, no friction." },
  { icon: ImageIcon, title: "Smart photo dates", body: "Upload a photo and we'll set the date automatically from EXIF or the file's timestamp." },
];

const Features = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <LandingLayout>
      <SEO
        title="Features — Memories, Milestones & Records | Kidzopedia"
        description="Capture photos & stories, track achievements, store records, share with family, and export a beautiful PDF keepsake — all in one warm, private place."
        ogImage={ogImage}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Kidzopedia features",
            itemListElement: FEATURES.map((f, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: f.title,
              description: f.body,
            })),
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              { "@type": "Question", name: "Can I track more than one child?", acceptedAnswer: { "@type": "Answer", text: "Yes — each child has its own profile, memory book and sharing controls. Family and Lifetime plans support up to five." } },
              { "@type": "Question", name: "What kinds of memories can I capture?", acceptedAnswer: { "@type": "Answer", text: "Photos, tiny stories, reactions, who was there, mood and category — anything you'd like to remember in a year, in ten, in thirty." } },
              { "@type": "Question", name: "How are achievements tracked?", acceptedAnswer: { "@type": "Answer", text: "Log academics, sports, music and art achievements with photos, grades or notes. We build a beautiful year-by-year summary automatically." } },
              { "@type": "Question", name: "Is the records vault secure?", acceptedAnswer: { "@type": "Answer", text: "Yes. Records are stored privately under strict per-user access rules and only visible to you and the family you invite." } },
              { "@type": "Question", name: "Can I export my book?", acceptedAnswer: { "@type": "Answer", text: "Yes — download a printable PDF keepsake any time, filter by year, and choose what to include." } },
              { "@type": "Question", name: "Does Kidzopedia auto-detect photo dates?", acceptedAnswer: { "@type": "Answer", text: "Yes. We read the EXIF date from your photo (or the file timestamp) so the memory is dated correctly with no extra typing." } },
            ],
          },
        ]}
      />
      <section className="relative overflow-hidden bg-gradient-warm">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center md:py-24">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1 text-[12px] font-medium text-foreground/80 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Features
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Everything you need to remember the little things.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">
            Kidzopedia gathers memories, milestones and important records into one warm, private place — and turns them into a keepsake you'll cherish.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article key={f.title} className="rounded-3xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/30 text-primary-deep">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center md:py-20">
          <BookHeart className="mx-auto h-10 w-10 text-primary-deep" />
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">Ready to start your child's book?</h2>
          <p className="mt-3 text-muted-foreground">It's free to start. Add your first memory in under a minute.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="warm" size="lg" onClick={() => navigate(user ? "/home" : "/auth")}>
              {user ? "Open Kidzopedia" : "Create your free account"} <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="soft" size="lg" onClick={() => navigate("/how-it-works")}>
              See how it works
            </Button>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
};

export default Features;
