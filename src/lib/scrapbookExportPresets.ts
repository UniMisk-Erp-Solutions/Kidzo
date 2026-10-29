import type { BookTemplate } from "@/hooks/useBookTemplates";

/**
 * Built-in scrapbook looks for the "Export & share" PDF. They reuse the same page renderer as the
 * book templates (BookPageView), so the PDF matches the template previews. The slug picks the layouts.
 */
export type ScrapbookExportLayout = "scrapbook-kraft" | "scrapbook-film" | "scrapbook-news";

const base = {
  category: "everyday",
  cover_image_url: null,
  page_layouts: [],
  suggested_age_range: "All ages",
  pages_needed: 24,
  is_premium: false,
  sort_order: 0,
  created_at: "",
} satisfies Partial<BookTemplate>;

export const SCRAPBOOK_EXPORT_PRESETS: Record<ScrapbookExportLayout, BookTemplate> = {
  "scrapbook-kraft": {
    ...base,
    id: "export-kraft",
    slug: "scrapbook-kraft-export",
    name: "Burgundy Diary",
    description: "Kraft paper, torn burgundy panels and a vintage camera.",
    color_scheme: { primary: "#C8A57A", accent: "#E3C9A0", gold: "#E0B24A", coral: "#7A1F2B", mint: "#A9B79A", ink: "#3A1F1A", paper: "#CDAA7E" },
  },
  "scrapbook-film": {
    ...base,
    id: "export-film",
    slug: "scrapbook-filmroll-export",
    name: "Film Roll",
    description: "A hero photo with a film roll running across the page.",
    color_scheme: { primary: "#E4DCCB", accent: "#8FB3C4", gold: "#F0C84A", coral: "#C8483E", mint: "#9CC0B0", ink: "#1F2430", paper: "#E4DCCB" },
  },
  "scrapbook-news": {
    ...base,
    id: "export-news",
    slug: "scrapbook-newsprint-export",
    name: "Newsprint Collage",
    description: "Taped, tilted photos over vintage newspaper.",
    color_scheme: { primary: "#E8E1D1", accent: "#B7C7A3", gold: "#F3C94C", coral: "#D4553F", mint: "#9DB8A8", ink: "#26282E", paper: "#E8E1D1" },
  },
};
