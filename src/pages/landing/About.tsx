import { Button } from "@/components/ui/button";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { SEO } from "@/components/SEO";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Heart, Lock, Sparkles, BookHeart } from "lucide-react";
import logo from "@/assets/kidzopedia-logo.png";
import ogImage from "@/assets/og-kidzopedia.jpg";

const VALUES = [
  { icon: Heart, t: "Family-first", d: "Every feature exists to help families stay close to the people they love most." },
  { icon: Lock, t: "Private by default", d: "Your child's story belongs to you. We never sell data and we don't run ads." },
  { icon: Sparkles, t: "Beautifully gentle", d: "Soft colours, calm motion, generous whitespace — designed to feel like a hug." },
  { icon: BookHeart, t: "Built to last", d: "We design Kidzopedia so the book you start today is still cherished decades from now." },
];

const About = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <LandingLayout>
      <SEO
        title="About Kidzopedia — Built for Families, Made to Last"
        description="Kidzopedia is the warmest place on the internet for childhood — private by default, family-first, and designed to be cherished for decades."
        ogImage={ogImage}
        ogType="article"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: "About Kidzopedia",
            description: "The story behind Kidzopedia and the values that guide us.",
            publisher: { "@type": "Organization", name: "Kidzopedia" },
          },
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            mainEntityOfPage: { "@type": "WebPage", "@id": "https://kidzopedia.com/about" },
            headline: "About Kidzopedia — Built for Families, Made to Last",
            description: "The story behind Kidzopedia: a warm, private home for every photo, milestone and record of childhood.",
            image: "https://kidzopedia.com/og-kidzopedia.jpg",
            datePublished: "2024-09-01",
            dateModified: "2026-04-23",
            author: { "@type": "Organization", name: "Kidzopedia" },
            publisher: {
              "@type": "Organization",
              name: "Kidzopedia",
              logo: { "@type": "ImageObject", url: "https://kidzopedia.com/og-kidzopedia.jpg" },
            },
            keywords: "childhood keepsake, memory book, family app, milestones, baby book, parents",
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              { "@type": "Question", name: "Who built Kidzopedia?", acceptedAnswer: { "@type": "Answer", text: "A small team of parents, grandparents and designers who wanted childhood to feel cherishable, not scrollable." } },
              { "@type": "Question", name: "What makes Kidzopedia different?", acceptedAnswer: { "@type": "Answer", text: "It's private by default, ad-free, family-first, and designed to be enjoyed decades from now — not just this week." } },
              { "@type": "Question", name: "Do you sell my data?", acceptedAnswer: { "@type": "Answer", text: "Never. Your child's story belongs to you. We don't sell data and we don't run ads." } },
              { "@type": "Question", name: "Is Kidzopedia a non-profit?", acceptedAnswer: { "@type": "Answer", text: "No — but we're independent and family-funded so the product can stay calm and ad-free." } },
              { "@type": "Question", name: "Can I hand my child their book when they grow up?", acceptedAnswer: { "@type": "Answer", text: "Yes. We design Kidzopedia so the book you start today can be handed to your child at 18 — a love letter from their family." } },
              { "@type": "Question", name: "How can I get involved?", acceptedAnswer: { "@type": "Answer", text: "Use it, share feedback, and tell another family. We read every email." } },
            ],
          },
        ]}
      />
      <section className="bg-gradient-warm">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center md:py-24">
          <img src={logo} alt="Kidzopedia logo" width={72} height={72} className="mx-auto h-16 w-16" />
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            We're building the warmest place on the internet for childhood.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">
            Kidzopedia started as a love letter — a single dad trying to remember everything, a grandparent across an ocean,
            a family realising the camera roll was already too full to scroll.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 md:py-20">
        <h2 className="text-3xl font-bold tracking-tight">Our story</h2>
        <div className="mt-5 space-y-5 text-[16px] leading-relaxed text-muted-foreground">
          <p>
            Children grow at the speed of light. The first words, the first steps, the strange little phrases only your family knows —
            they slip past in a blur of work, school runs and bedtime routines.
          </p>
          <p>
            We built Kidzopedia because no one should have to choose between living the moment and remembering it.
            One photo, one tiny story, one tap — and a beautiful keepsake begins to form, year by year.
          </p>
          <p>
            We believe a child's story is sacred. Private by default, owned by the family, and lovingly designed to last decades —
            not buried in a feed or sold to advertisers.
          </p>
        </div>
      </section>

      <section className="bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight">What we believe</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {VALUES.map((v) => (
              <article key={v.t} className="rounded-3xl border border-border bg-card p-7 shadow-soft">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/30 text-primary-deep">
                  <v.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-xl font-semibold">{v.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{v.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center md:py-20">
          <h2 className="text-3xl font-bold md:text-4xl">Come build a book with us.</h2>
          <p className="mt-3 text-muted-foreground">Free to start. Treasured forever.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="warm" size="lg" onClick={() => navigate(user ? "/home" : "/auth")}>
              {user ? "Open Kidzopedia" : "Start your child's book"} <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="soft" size="lg" onClick={() => navigate("/contact")}>
              Get in touch
            </Button>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
};

export default About;
