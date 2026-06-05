import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface SEOProps {
  title: string;
  description: string;
  /** Optional canonical override; defaults to window.location.origin + pathname */
  canonical?: string;
  /** Optional structured data object (will be JSON-stringified into a JSON-LD script tag) */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  ogImage?: string;
  /** og:type — "website" (default), "article", "profile", etc. */
  ogType?: string;
  /** twitter:card — "summary_large_image" (default) or "summary" */
  twitterCard?: "summary" | "summary_large_image";
}

const setMeta = (
  selector: string,
  attrName: "name" | "property",
  attrValue: string,
  content: string,
) => {
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const setLink = (rel: string, href: string) => {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

export const SEO = ({
  title,
  description,
  canonical,
  jsonLd,
  ogImage,
  ogType = "website",
  twitterCard = "summary_large_image",
}: SEOProps) => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Title + description
    document.title = title;
    setMeta('meta[name="description"]', "name", "description", description);

    // Canonical (always points to a clean URL, consolidating duplicate content)
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const canonicalUrl = canonical ?? `${origin}${pathname}`;
    setLink("canonical", canonicalUrl);

    // Resolve absolute OG image URL (social crawlers require absolute URLs)
    const absoluteImage = ogImage
      ? ogImage.startsWith("http")
        ? ogImage
        : `${origin}${ogImage.startsWith("/") ? "" : "/"}${ogImage}`
      : undefined;

    // Open Graph
    setMeta('meta[property="og:type"]', "property", "og:type", ogType);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:url"]', "property", "og:url", canonicalUrl);
    setMeta('meta[property="og:site_name"]', "property", "og:site_name", "Kidzopedia");
    if (absoluteImage) {
      setMeta('meta[property="og:image"]', "property", "og:image", absoluteImage);
      setMeta('meta[property="og:image:alt"]', "property", "og:image:alt", title);
    }

    // Twitter
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", twitterCard);
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    if (absoluteImage) {
      setMeta('meta[name="twitter:image"]', "name", "twitter:image", absoluteImage);
      setMeta('meta[name="twitter:image:alt"]', "name", "twitter:image:alt", title);
    }

    // JSON-LD (replace any prior tags from this component)
    document.head.querySelectorAll('script[data-seo-jsonld="true"]').forEach((s) => s.remove());
    if (jsonLd) {
      const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      items.forEach((item) => {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.setAttribute("data-seo-jsonld", "true");
        script.text = JSON.stringify(item);
        document.head.appendChild(script);
      });
    }
  }, [title, description, canonical, pathname, jsonLd, ogImage, ogType, twitterCard]);

  return null;
};

