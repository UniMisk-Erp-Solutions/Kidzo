import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export type Section = "home" | "moments" | "grow" | "books" | "docs" | "family";

const PREFIXES: [string, Section][] = [
  ["/moments", "moments"],
  ["/grow", "grow"],
  ["/books", "books"],
  ["/export", "books"],
  ["/documents", "docs"],
  ["/records", "docs"],
  ["/family", "family"],
];

export const sectionForPath = (pathname: string): Section =>
  PREFIXES.find(([p]) => pathname.startsWith(p))?.[1] ?? "home";

/** Sets <html data-section> so each area picks up its own colour identity (tokens live in index.css). */
export const SectionTheme = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    document.documentElement.dataset.section = sectionForPath(pathname);
  }, [pathname]);
  return null;
};

/** Fades/slides each route in; honours prefers-reduced-motion via the global rule in index.css. */
export const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="page-in">
      {children}
    </div>
  );
};
