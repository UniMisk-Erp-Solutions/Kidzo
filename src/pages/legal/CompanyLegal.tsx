import { Link } from "react-router-dom";
import { ArrowRight, FileText, Scale, ShieldCheck } from "lucide-react";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { SEO } from "@/components/SEO";
import { LEGAL, LEGAL_DOCS } from "@/pages/legal/legalConfig";

const CompanyLegal = () => (
  <LandingLayout>
    <SEO
      title="Company & Legal · Kidzopedia"
      description="Kidzopedia's terms, privacy policy, data processing, cookie policy and grievance redressal — written to India's Digital Personal Data Protection Act, 2023."
    />

    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <header className="max-w-3xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-[12px] font-medium text-primary-deep">
          <Scale className="h-3.5 w-3.5" /> Company &amp; Legal
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          How we handle your family's data
        </h1>
        <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">
          Kidzopedia holds some of the most personal information a family has — photographs of children, health and
          school records, first words and first steps. These documents set out exactly what we do with it, what we
          will never do with it, and the rights you have. They are written to India's{" "}
          <strong className="font-medium text-foreground">Digital Personal Data Protection Act, 2023</strong> and the
          rules made under it.
        </p>
      </header>

      {/* The promises that matter most, stated up front */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: ShieldCheck,
            t: "No advertising, ever",
            d: "We do not sell your data, share it with brokers, or run ads. We are funded by subscriptions.",
          },
          {
            icon: ShieldCheck,
            t: "No child profiling",
            d: "The DPDP Act forbids tracking and targeted advertising directed at children. So do we, by design.",
          },
          {
            icon: ShieldCheck,
            t: "Your data stays in India",
            d: "Your memories and documents live on our own servers in India, not on a third-party cloud.",
          },
        ].map((c) => (
          <div key={c.t} className="rounded-2xl border border-border bg-card p-5">
            <c.icon className="h-5 w-5 text-primary-deep" />
            <h2 className="mt-3 text-[15px] font-semibold text-foreground">{c.t}</h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{c.d}</p>
          </div>
        ))}
      </div>

      {/* Document index */}
      <h2 className="mt-14 text-[12px] font-semibold uppercase tracking-wider text-foreground">Documents</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {LEGAL_DOCS.map((d) => (
          <Link
            key={d.slug}
            to={d.slug}
            className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-muted/40"
          >
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary-deep">
              <FileText className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-[15px] font-semibold text-foreground">
                {d.title}
                <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
              </span>
              <span className="mt-1 block text-[13.5px] leading-relaxed text-muted-foreground">{d.summary}</span>
            </span>
          </Link>
        ))}
      </div>

      {/* Entity + contact */}
      <div className="mt-12 rounded-2xl border border-border bg-muted/30 p-6">
        <h2 className="text-[15px] font-semibold text-foreground">Who you are dealing with</h2>
        <dl className="mt-4 grid gap-x-8 gap-y-3 text-[14px] sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Product</dt>
            <dd className="font-medium text-foreground">{LEGAL.product}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Operated by (Data Fiduciary)</dt>
            <dd className="font-medium text-foreground">{LEGAL.entity}</dd>
          </div>
          {LEGAL.registeredAddress && (
            <div>
              <dt className="text-muted-foreground">Registered office</dt>
              <dd className="font-medium text-foreground">{LEGAL.registeredAddress}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">Contact &amp; Grievance Officer</dt>
            <dd className="font-medium text-foreground">
              <a href={`mailto:${LEGAL.grievanceEmail}`} className="text-primary-deep hover:underline">
                {LEGAL.grievanceEmail}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Last updated</dt>
            <dd className="font-medium text-foreground">{LEGAL.lastUpdated}</dd>
          </div>
        </dl>
      </div>
    </div>
  </LandingLayout>
);

export default CompanyLegal;
