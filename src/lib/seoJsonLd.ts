/**
 * Reusable JSON-LD builders for SEO.
 * All builders return plain objects ready to drop into the SEO component's `jsonLd` prop.
 */

export interface FaqEntry {
  question: string;
  answer: string;
}

export const buildFaqJsonLd = (faqs: FaqEntry[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.answer,
    },
  })),
});

export interface BlogPostingInput {
  url: string;
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  keywords?: string[];
}

export const buildBlogPostingJsonLd = (post: BlogPostingInput) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  mainEntityOfPage: { "@type": "WebPage", "@id": post.url },
  headline: post.headline,
  description: post.description,
  image: post.image,
  datePublished: post.datePublished,
  dateModified: post.dateModified ?? post.datePublished,
  author: { "@type": "Organization", name: post.author ?? "Kidzopedia" },
  publisher: {
    "@type": "Organization",
    name: "Kidzopedia",
    logo: { "@type": "ImageObject", url: "https://kidzopedia.com/og-kidzopedia.jpg" },
  },
  keywords: post.keywords?.join(", "),
});
