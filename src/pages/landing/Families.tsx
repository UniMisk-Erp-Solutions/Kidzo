import { Button } from "@/components/ui/button";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { SEO } from "@/components/SEO";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Users, Heart, ShieldCheck, Eye, Pencil, MapPin, Star, CheckCircle2 } from "lucide-react";
import ogImage from "@/assets/og-kidzopedia.jpg";

const ROLES = [
  { icon: Pencil, role: "Editor", desc: "Add and edit memories, milestones and records — perfect for co-parents." },
  { icon: Eye, role: "Viewer", desc: "Read everything but can't change anything — perfect for grandparents and aunts/uncles." },
];

const Families = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <LandingLayout>
      <SEO
        title="For Families — Co-Parents & Grandparents Welcome | Kidzopedia"
        description="Per-child sharing with viewer or editor roles. Share by link, no app stores, no friction. Anyone can leave any time."
        ogImage={ogImage}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Kidzopedia for families",
            description: "Per-child sharing with viewer or editor roles, designed for the whole family.",
            audience: { "@type": "Audience", audienceType: "Parents, grandparents, co-parents" },
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              { "@type": "Question", name: "How do I invite a family member?", acceptedAnswer: { "@type": "Answer", text: "Open the Family page, choose a child, and send a magic invite link by email. They sign up in seconds." } },
              { "@type": "Question", name: "What's the difference between viewer and editor?", acceptedAnswer: { "@type": "Answer", text: "Viewers see everything but can't change anything. Editors can add and edit memories, milestones and records." } },
              { "@type": "Question", name: "Can I share one child without sharing the others?", acceptedAnswer: { "@type": "Answer", text: "Yes. Each child has its own access list — perfect for blended families or shared custody." } },
              { "@type": "Question", name: "Can I revoke access later?", acceptedAnswer: { "@type": "Answer", text: "Any time, with one click. The person loses access immediately." } },
              { "@type": "Question", name: "Does the family member need a paid plan?", acceptedAnswer: { "@type": "Answer", text: "No. Anyone you invite can join for free — only the book owner pays." } },
              { "@type": "Question", name: "Do grandparents need an app?", acceptedAnswer: { "@type": "Answer", text: "No app required — Kidzopedia opens in any modern browser on phone, tablet or desktop." } },
            ],
          },
        ]}
      />
      <section className="bg-gradient-warm">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center md:py-24">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-primary-deep">For families</span>
          <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">
            A book the whole family writes together.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">
            Co-parents, grandparents, aunts and uncles — Kidzopedia is built for the people who love your child most.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="grid gap-6 md:grid-cols-2">
          {ROLES.map((r) => (
            <article key={r.role} className="rounded-3xl border border-border bg-card p-7 shadow-soft">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/30 text-primary-deep">
                <r.icon className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-2xl font-semibold">{r.role}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{r.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-muted/30">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-3 md:py-20">
          {[
            { icon: ShieldCheck, t: "You stay in control", d: "Owners can revoke access at any time. Everyone you invite can also leave on their own." },
            { icon: Users, t: "Per-child sharing", d: "Share one child without sharing the others. Each book has its own access list." },
            { icon: MapPin, t: "Distance disappears", d: "Grandparents thousands of miles away can be there for every milestone, the day it happens." },
          ].map((b) => (
            <div key={b.t} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/30 text-secondary-foreground">
                <b.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-lg font-semibold">{b.t}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-soft sm:p-10">
          <Heart className="h-7 w-7 text-primary-deep" />
          <blockquote className="mt-3 text-xl font-medium leading-relaxed text-foreground sm:text-2xl">
            "I'm a grandparent thousands of miles away. Now I see every milestone the day it happens. I cried at the first one."
          </blockquote>
          <div className="mt-4 flex items-center gap-1 text-accent">
            {Array.from({ length: 5 }).map((_, k) => (
              <Star key={k} className="h-4 w-4 fill-current" strokeWidth={0} />
            ))}
          </div>
          <p className="mt-2 text-[14px] text-muted-foreground">— George, grandpa of Theo (1)</p>
        </div>
      </section>

      <section className="border-t border-border bg-gradient-warm">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center md:py-20">
          <h2 className="text-3xl font-bold md:text-4xl">Ready to write together?</h2>
          <ul className="mx-auto mt-5 grid max-w-md gap-2 text-left text-[15px]">
            {["Per-child sharing", "Viewer & editor roles", "Share-by-link, no setup", "Anyone can leave any time"].map((b) => (
              <li key={b} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />{b}</li>
            ))}
          </ul>
          <div className="mt-7">
            <Button variant="warm" size="lg" onClick={() => navigate(user ? "/family" : "/auth")}>
              {user ? "Open family settings" : "Create your family book"} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
};

export default Families;
