import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LayoutDashboard, Printer } from "lucide-react";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { LEGAL } from "@/pages/legal/legalConfig";

export type Section = { id: string; title: string; body: ReactNode };

/**
 * Signed-in readers came from the app, so send them back to the dashboard —
 * not to the marketing site, and never to the sign-in page.
 */
export const BackToApp = () => {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <Link
      to="/home"
      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary-deep transition-opacity hover:opacity-80"
    >
      <LayoutDashboard className="h-4 w-4" /> Back to dashboard
    </Link>
  );
};

/** Shared chrome for every legal document: title, dates, table of contents, numbered sections. */
export const LegalDoc = ({
  title,
  description,
  intro,
  sections,
}: {
  title: string;
  description: string;
  intro?: ReactNode;
  sections: Section[];
}) => (
  <LandingLayout>
    <SEO title={`${title} · ${LEGAL.product}`} description={description} />

    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/legal"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Company &amp; Legal
        </Link>
        <BackToApp />
      </div>

      <header className="mt-4 border-b border-border pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{description}</p>
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-muted-foreground">
          <span>Effective from <strong className="font-medium text-foreground">{LEGAL.effectiveFrom}</strong></span>
          <span>Last updated <strong className="font-medium text-foreground">{LEGAL.lastUpdated}</strong></span>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground print:hidden"
          >
            <Printer className="h-3.5 w-3.5" /> Print / save as PDF
          </button>
        </div>
      </header>

      <div className="mt-10 gap-12 lg:flex">
        {/* Table of contents */}
        <nav className="mb-10 shrink-0 lg:sticky lg:top-24 lg:mb-0 lg:h-fit lg:w-64 print:hidden">
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-foreground">On this page</h2>
          <ol className="mt-3 space-y-2 text-[13.5px] text-muted-foreground">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="transition-colors hover:text-foreground">
                  <span className="tabular-nums text-muted-foreground/60">{i + 1}.</span> {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Body */}
        <div className="min-w-0 flex-1">
          {intro && (
            <div className="mb-10 rounded-2xl border border-border bg-muted/30 p-5 text-[14.5px] leading-relaxed text-muted-foreground">
              {intro}
            </div>
          )}

          <div className="space-y-12">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  <span className="mr-2 tabular-nums text-muted-foreground/60">{i + 1}.</span>
                  {s.title}
                </h2>
                <div className="legal-prose mt-4 space-y-4 text-[14.5px] leading-[1.75] text-muted-foreground">
                  {s.body}
                </div>
              </section>
            ))}
          </div>

          <footer className="mt-16 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-[15px] font-semibold text-foreground">Questions about this document?</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
              Write to us at{" "}
              <a href={`mailto:${LEGAL.contactEmail}`} className="font-medium text-primary-deep hover:underline">
                {LEGAL.contactEmail}
              </a>
              . If you are unhappy with our response, you can escalate through our{" "}
              <Link to="/legal/data-rights" className="font-medium text-primary-deep hover:underline">
                grievance redressal process
              </Link>
              .
            </p>
          </footer>
        </div>
      </div>
    </div>
  </LandingLayout>
);

/** Small helpers so the documents themselves stay readable. */
export const P = ({ children }: { children: ReactNode }) => <p>{children}</p>;

export const UL = ({ children }: { children: ReactNode }) => (
  <ul className="list-disc space-y-2 pl-5 marker:text-muted-foreground/50">{children}</ul>
);

export const OL = ({ children }: { children: ReactNode }) => (
  <ol className="list-decimal space-y-2 pl-5 marker:text-muted-foreground/50">{children}</ol>
);

export const H3 = ({ children }: { children: ReactNode }) => (
  <h3 className="pt-2 text-[15px] font-semibold text-foreground">{children}</h3>
);

export const Callout = ({ children }: { children: ReactNode }) => (
  <div className="rounded-xl border border-primary/40 bg-primary/10 p-4 text-[14px] leading-relaxed text-foreground">
    {children}
  </div>
);

/** A simple responsive table that scrolls rather than breaking the page on mobile. */
export const Table = ({ head, rows }: { head: string[]; rows: ReactNode[][] }) => (
  <div className="overflow-x-auto rounded-xl border border-border">
    <table className="w-full min-w-[640px] border-collapse text-left text-[13.5px]">
      <thead className="bg-muted/50">
        <tr>
          {head.map((h) => (
            <th key={h} className="border-b border-border px-4 py-3 font-semibold text-foreground">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="align-top">
            {r.map((cell, j) => (
              <td key={j} className="border-b border-border px-4 py-3 text-muted-foreground last:border-r-0">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
