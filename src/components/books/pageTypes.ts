/** Low-level book page types and size. Kept free of imports from other book modules so the page renderers,
 *  the editor and the PDF export can all share them without forming an import cycle. */
import type { Memory } from "@/hooks/useMemories";

/** Fixed canvas size every book page is designed against. Used for both
 *  on-screen preview (scaled with CSS transform to fit any container)
 *  and PDF export (rendered at this exact size into html2canvas). */
export const BOOK_PAGE_W = 600;
export const BOOK_PAGE_H = 800;

export type ScrapbookFlavor = "timeline" | "first-year" | "birthday" | "holiday" | "everyday" | "mosaic" | "collage-zine" | "pocket-album" | "road-trail" | "kraft" | "filmroll" | "newsprint";

export type MemoryLayout = "collage" | "polaroid-stack" | "magazine" | "journal" | "pocket";

/** Dense layouts that pack multiple memories on a single page. */
export type MemorySpreadLayout = "grid-collage" | "polaroid-mosaic" | "magazine-mosaic" | "road-trail" | "kraft-collage" | "film-strip" | "newsprint-collage";

export type BookPage =
  | { kind: "cover"; title: string; subtitle?: string | null; childName: string; templateName: string; flavor: ScrapbookFlavor }
  | { kind: "intro"; title: string; childName: string; dateRange: string; pageCount: number; flavor: ScrapbookFlavor }
  | { kind: "chapter"; title: string; subtitle: string; number: number; flavor: ScrapbookFlavor }
  | { kind: "memory"; memory: Memory; index: number; total: number; layout: MemoryLayout; flavor: ScrapbookFlavor }
  | { kind: "memory-spread"; memories: Memory[]; index: number; total: number; layout: MemorySpreadLayout; flavor: ScrapbookFlavor; spreadKey: string }
  | { kind: "back"; childName: string; flavor: ScrapbookFlavor };
