import { Link, useLocation, useNavigate } from "react-router-dom";
import { ReactNode, useEffect, useLayoutEffect, useState } from "react";
import { ArrowRight, Github, Instagram, Mail, MapPin, Menu, Phone, Twitter, X } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { LEGAL, LEGAL_DOCS } from "@/pages/legal/legalConfig";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { LandingBackdrop } from "@/components/landing/LandingBackdrop";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/features", label: "Features" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/families", label: "For families" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

/** Footer column listing every legal document (not hidden behind a hub page) plus the company's contact details. */
const ContactInfo = ({ className = "" }: { className?: string }) => (
  <div className={className}>
    <p className="flex items-center gap-2 text-[13px] text-muted-foreground md:text-[13.5px]">
      <Mail className="h-4 w-4 shrink-0" />
      <a href={`mailto:${LEGAL.contactEmail}`} className="hover:text-foreground">{LEGAL.contactEmail}</a>
    </p>
    {LEGAL.phone && (
      <p className="mt-1.5 flex items-center gap-2 text-[13px] text-muted-foreground md:mt-2 md:text-[13.5px]">
        <Phone className="h-4 w-4 shrink-0" />
        <a href={`tel:${String(LEGAL.phone).replace(/\s/g, "")}`} className="hover:text-foreground">{LEGAL.phone}</a>
      </p>
    )}
    {LEGAL.registeredAddress && (
      <p className="mt-1.5 flex items-start gap-2 text-[12.5px] leading-snug text-muted-foreground md:mt-2 md:text-[13.5px] md:leading-relaxed">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{LEGAL.entity}, {LEGAL.registeredAddress}</span>
      </p>
    )}
  </div>
);

const LegalColumn = () => (
    <div className="lg:col-span-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-foreground md:text-[12px]">Legal</h3>
      <ul className="mt-2 grid gap-x-8 gap-y-1.5 text-[12.5px] leading-snug text-muted-foreground sm:grid-cols-2 md:mt-3 md:gap-y-2 md:text-[14px]">
        {LEGAL_DOCS.map((d) => (
          <li key={d.slug}>
            <Link to={d.slug} className="hover:text-foreground">{d.title}</Link>
          </li>
        ))}
      </ul>
      {/* on phones the contact details sit below the columns (see footer) */}
      <ContactInfo className="mt-4 hidden md:block" />
    </div>
);

export const LandingLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  // All public marketing pages share the "Wash House" look (see [data-landing="wash"] in index.css),
  // independent of the in-app theme.
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-landing", "wash");
    return () => document.documentElement.removeAttribute("data-landing");
  }, []);

  // Close mobile menu and scroll to top on route change
  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  const goApp = () => navigate(user ? "/home" : "/auth");

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <Link to={user ? "/home" : "/"} className="flex min-w-0 items-center gap-2">
            <BrandLogo className="h-9 w-9" />
            <span className="truncate text-[17px] font-bold tracking-tight">Kidzopedia</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-muted-foreground lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "transition-colors hover:text-foreground",
                  pathname === item.to && "font-semibold text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {!loading && user ? (
              <Button variant="warm" size="sm" onClick={() => navigate("/home")} className="px-2.5 sm:px-4">
                <span className="hidden sm:inline">Open my Kidzopedia</span>
                <span className="sm:hidden">Open</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="warm" size="sm" onClick={goApp} className="px-2.5 sm:px-4">
                Get started
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {open && (
          <nav className="border-t border-border/40 bg-background/95 lg:hidden">
            <ul className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-3 text-[15px]">
              {NAV.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "block rounded-xl px-3 py-2.5 transition-colors hover:bg-muted",
                      pathname === item.to && "bg-muted font-semibold",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      <main className="relative isolate">
        <LandingBackdrop />
        {children}
      </main>

      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-8 md:py-12">
          <div className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-3 md:gap-10 lg:grid-cols-5">
            <div className="col-span-2 md:col-span-1">
              <Link to={user ? "/home" : "/"} className="flex items-center gap-2">
                <BrandLogo className="h-9 w-9" />
                <span className="text-[17px] font-bold tracking-tight">Kidzopedia</span>
              </Link>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground md:mt-3 md:text-[13px]">
                The little encyclopedia of your child's life — private, warm, and made to last.
              </p>
              <div className="mt-2 flex items-center gap-1 text-muted-foreground md:mt-4 md:gap-3">
                <a href="#" aria-label="Twitter" className="rounded-lg p-2 transition-colors hover:bg-muted hover:text-foreground">
                  <Twitter className="h-4 w-4" />
                </a>
                <a href="#" aria-label="Instagram" className="rounded-lg p-2 transition-colors hover:bg-muted hover:text-foreground">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="#" aria-label="GitHub" className="rounded-lg p-2 transition-colors hover:bg-muted hover:text-foreground">
                  <Github className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="space-y-5 md:contents">
            <div>
              <h3 className="text-[11px] font-semibold md:text-[12px] uppercase tracking-wider text-foreground">Product</h3>
              <ul className="mt-2 space-y-1.5 text-[12.5px] md:mt-3 md:space-y-2 md:text-[14px] text-muted-foreground">
                <li><Link to="/features" className="hover:text-foreground">Features</Link></li>
                <li><Link to="/how-it-works" className="hover:text-foreground">How it works</Link></li>
                <li><Link to="/families" className="hover:text-foreground">For families</Link></li>
                <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-[11px] font-semibold md:text-[12px] uppercase tracking-wider text-foreground">Company</h3>
              <ul className="mt-2 space-y-1.5 text-[12.5px] md:mt-3 md:space-y-2 md:text-[14px] text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground">About</Link></li>
                <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
                <li><Link to="/legal" className="hover:text-foreground">Company &amp; Legal</Link></li>
                <li><Link to={user ? "/home" : "/auth"} className="hover:text-foreground">{user ? "My Kidzopedia" : "Sign in"}</Link></li>
              </ul>
            </div>
            </div>

            <LegalColumn />
            <ContactInfo className="col-span-2 md:hidden" />
          </div>

          <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-border pt-4 text-[11.5px] md:mt-10 md:gap-3 md:pt-6 md:text-[12px] text-muted-foreground sm:flex-row">
            <span>© {new Date().getFullYear()} Kidzopedia. Made with love for families.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
