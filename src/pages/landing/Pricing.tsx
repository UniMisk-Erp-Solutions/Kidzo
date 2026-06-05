import { Button } from "@/components/ui/button";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { SEO } from "@/components/SEO";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import ogImage from "@/assets/og-kidzopedia.jpg";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    description: "Everything you need to start your child's book.",
    cta: "Start free",
    featured: false,
    features: [
      "1 child profile",
      "Unlimited memories & milestones",
      "PDF keepsake export",
      "Invite up to 2 family members",
      "Private by default",
    ],
  },
  {
    name: "Family",
    price: "$5",
    cadence: "/month",
    description: "For families building books for more than one little one.",
    cta: "Start free trial",
    featured: true,
    features: [
      "Up to 5 child profiles",
      "Unlimited family invites",
      "Priority PDF rendering",
      "Records vault with extra storage",
      "Email support",
    ],
  },
  {
    name: "Lifetime",
    price: "$99",
    cadence: "one-time",
    description: "Pay once, keep your books for life — including the kids' future.",
    cta: "Get lifetime",
    featured: false,
    features: [
      "Everything in Family",
      "Pay once, no subscription",
      "Hand-off to your child at 18",
      "Bonus print-quality export",
    ],
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <LandingLayout>
      <SEO
        title="Pricing — Simple, Gentle Plans for Every Family | Kidzopedia"
        description="Start free with one child and unlimited memories. Upgrade to Family for multiple kids, or buy Lifetime once — no ads, ever."
        ogImage={ogImage}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: "Kidzopedia",
            description: "A warm, private digital keepsake for parents to capture memories and milestones.",
            brand: { "@type": "Brand", name: "Kidzopedia" },
            offers: PLANS.map((p) => ({
              "@type": "Offer",
              name: p.name,
              price: p.price.replace(/[^0-9.]/g, "") || "0",
              priceCurrency: "USD",
              description: p.description,
            })),
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              { "@type": "Question", name: "Is there really a free tier?", acceptedAnswer: { "@type": "Answer", text: "Yes — one child, unlimited memories, milestones and PDF export. Most families start here." } },
              { "@type": "Question", name: "Can I switch plans?", acceptedAnswer: { "@type": "Answer", text: "Any time. Upgrades take effect immediately; downgrades at the end of your billing cycle." } },
              { "@type": "Question", name: "What happens to my data if I cancel?", acceptedAnswer: { "@type": "Answer", text: "Your account stays intact and you can always export everything as a PDF keepsake before leaving." } },
              { "@type": "Question", name: "Do you offer refunds?", acceptedAnswer: { "@type": "Answer", text: "Yes — within 14 days of purchase, no questions asked. Email hello@kidzopedia.com." } },
              { "@type": "Question", name: "Is Lifetime really pay-once?", acceptedAnswer: { "@type": "Answer", text: "Yes. One payment, no renewals. Includes everything in Family forever." } },
              { "@type": "Question", name: "Are there family or education discounts?", acceptedAnswer: { "@type": "Answer", text: "Yes — get in touch and we'll do our best for parent groups, schools and non-profits." } },
              { "@type": "Question", name: "What payment methods are supported?", acceptedAnswer: { "@type": "Answer", text: "Major credit and debit cards, plus Apple Pay and Google Pay where available." } },
            ],
          },
        ]}
      />
      <section className="bg-gradient-warm">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center md:py-24">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1 text-[12px] font-medium text-foreground/80 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Pricing
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Simple, gentle pricing for every family.
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">
            Start free, upgrade when you're ready. No ads, ever — your child's story isn't a product.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((p) => (
            <article
              key={p.name}
              className={cn(
                "relative rounded-3xl border bg-card p-7 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift",
                p.featured ? "border-primary/50 ring-2 ring-primary/30" : "border-border",
              )}
            >
              {p.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground shadow-soft">
                  Most loved
                </span>
              )}
              <h3 className="text-lg font-semibold uppercase tracking-wider text-muted-foreground">{p.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">{p.price}</span>
                <span className="text-[14px] text-muted-foreground">{p.cadence}</span>
              </div>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{p.description}</p>
              <ul className="mt-5 space-y-2 text-[14px]">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={p.featured ? "warm" : "soft"}
                size="lg"
                className="mt-6 w-full"
                onClick={() => navigate(user ? "/home" : "/auth")}
              >
                {p.cta} <ArrowRight className="h-4 w-4" />
              </Button>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-[13px] text-muted-foreground">
          Pricing shown in USD. Subscriptions can be cancelled any time. Lifetime is a one-off, no renewals.
        </p>
      </section>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-3xl px-6 py-14 md:py-16">
          <h2 className="text-center text-2xl font-bold md:text-3xl">Common pricing questions</h2>
          <dl className="mt-8 space-y-4">
            {[
              { q: "Is there really a free tier?", a: "Yes — one child, unlimited memories. Most families start here." },
              { q: "Can I switch plans?", a: "Any time. Upgrades take effect immediately; downgrades at the end of your billing cycle." },
              { q: "What happens to my data if I cancel?", a: "Your account stays intact, and you can always export everything as a PDF keepsake." },
            ].map((f) => (
              <div key={f.q} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <dt className="text-[15px] font-semibold">{f.q}</dt>
                <dd className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </LandingLayout>
  );
};

export default Pricing;
