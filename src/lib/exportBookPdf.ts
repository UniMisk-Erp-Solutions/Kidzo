import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { createRoot, type Root } from "react-dom/client";
import { createElement } from "react";
import type { Memory } from "@/hooks/useMemories";
import type { BookTemplate, BookTemplateColors } from "@/hooks/useBookTemplates";
import {
  BOOK_PAGE_H,
  BOOK_PAGE_W,
  BookPageView,
  buildPages,
} from "@/components/books/BookPages";
import { ElementsOverlay } from "@/components/books/editor/EditorElements";
import { pageKeyFor, readPageData, type CustomPagesMap } from "@/components/books/editor/types";

const HANDWRITING_FONTS = /Caveat|Kalam|Patrick Hand|Shadows Into Light/i;

/**
 * html2canvas draws these web fonts about 0.2em lower than the browser does, which pushes titles out of
 * their boxes in the PDF. Nudge only the text (not its box) back up, on the cloned DOM used for the capture.
 */
export function nudgeHandwritingText(root: HTMLElement) {
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  if (!view) return;
  root.querySelectorAll<HTMLElement>("*").forEach((el) => {
    if (!HANDWRITING_FONTS.test(view.getComputedStyle(el).fontFamily)) return;
    Array.from(el.childNodes).forEach((n) => {
      if (n.nodeType !== Node.TEXT_NODE || !n.textContent?.trim()) return;
      const shift = doc.createElement("span");
      shift.style.position = "relative";
      shift.style.top = "-0.2em";
      n.replaceWith(shift);
      shift.appendChild(n);
    });
  });
}

export type PdfProgressPhase =
  | "preparing"
  | "fonts"
  | "rendering"
  | "snapshot"
  | "writing"
  | "done";

export type PdfProgress = {
  phase: PdfProgressPhase;
  current: number; // page index 1-based once rendering
  total: number;
  message?: string;
};

/**
 * Export the user's memory book to PDF.
 *
 * Strategy: render every BookPageView into an off-screen DOM node at the
 * exact design canvas size (600×800), wait for fonts + images, snapshot via
 * html2canvas at 2× DPI, then drop each onto its own A-format PDF page.
 * The downloaded PDF visually matches the on-screen book exactly.
 */
export async function exportBookPdf(opts: {
  title: string;
  subtitle?: string | null;
  childName: string;
  childDob?: string;
  template: BookTemplate;
  colors: BookTemplateColors;
  memories: Memory[];
  customPages?: CustomPagesMap;
  filename?: string;
  /** Only render the first N pages (free-plan preview). */
  maxPages?: number;
  onProgress?: (progress: PdfProgress) => void;
}): Promise<Blob> {
  const { title, subtitle, childName, childDob, template, colors, memories, customPages, filename, maxPages, onProgress } = opts;

  const allPages = buildPages({ title, subtitle, childName, childDob, template, memories });
  const pages = maxPages ? allPages.slice(0, maxPages) : allPages;
  if (pages.length === 0) throw new Error("No pages to export");

  const report = (p: PdfProgress) => {
    try { onProgress?.(p); } catch { /* ignore */ }
  };

  report({ phase: "preparing", current: 0, total: pages.length });

  // Off-screen render host
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-100000px";
  host.style.top = "0";
  host.style.width = `${BOOK_PAGE_W}px`;
  host.style.height = `${BOOK_PAGE_H}px`;
  host.style.background = colors.paper ?? colors.primary ?? "#fff";
  host.setAttribute("aria-hidden", "true");
  document.body.appendChild(host);

  let root: Root | null = null;

  try {
    // Wait once up-front for web fonts to be ready so the very first page is correct.
    report({ phase: "fonts", current: 0, total: pages.length, message: "Loading fonts…" });
    try {
      await (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready;
    } catch {
      /* ignore */
    }

    root = createRoot(host);

    const PAGE_W_MM = 210;
    const PAGE_H_MM = 280;
    const doc = new jsPDF({ unit: "mm", format: [PAGE_W_MM, PAGE_H_MM] });

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const oneBased = i + 1;

      report({ phase: "rendering", current: oneBased, total: pages.length });

      // Render this page into the off-screen root.
      const key = pageKeyFor(page as { kind: string; memory?: { id: string }; number?: number; spreadKey?: string });
      const data = readPageData(customPages?.[key]);
      const overlay = data.elements;
      await new Promise<void>((resolve) => {
        root!.render(
          createElement(
            "div",
            {
              style: {
                position: "relative",
                width: `${BOOK_PAGE_W}px`,
                height: `${BOOK_PAGE_H}px`,
                background: colors.paper ?? colors.primary ?? "#fff",
              },
            },
            data.hideNative ? null : createElement(BookPageView, { page, colors }),
            overlay.length > 0 ? createElement(ElementsOverlay, { elements: overlay }) : null,
          ),
        );
        // wait for React commit + 2 frames so layout/paint is final
        requestAnimationFrame(() =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => resolve()),
          ),
        );
      });

      // Wait for any images on this page to fully decode.
      const imgs = Array.from(host.querySelectorAll("img"));
      if (imgs.length > 0) {
        await Promise.all(
          imgs.map((img) =>
            new Promise<void>((res) => {
              if (img.complete && img.naturalWidth > 0) {
                // try to decode for crisper rendering
                if ("decode" in img) {
                  (img as HTMLImageElement & { decode: () => Promise<void> })
                    .decode()
                    .then(() => res())
                    .catch(() => res());
                  return;
                }
                return res();
              }
              const done = () => res();
              img.addEventListener("load", done, { once: true });
              img.addEventListener("error", done, { once: true });
            }),
          ),
        );
      }

      // Belt-and-suspenders: re-await fonts ready (cheap if already resolved).
      try {
        await (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready;
      } catch {
        /* ignore */
      }

      report({ phase: "snapshot", current: oneBased, total: pages.length });

      const canvas = await html2canvas(host, {
        backgroundColor: colors.paper ?? colors.primary ?? "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        width: BOOK_PAGE_W,
        height: BOOK_PAGE_H,
        windowWidth: BOOK_PAGE_W,
        windowHeight: BOOK_PAGE_H,
        imageTimeout: 8000,
        onclone: (_doc, cloned) => nudgeHandwritingText(cloned),
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      if (i > 0) doc.addPage([PAGE_W_MM, PAGE_H_MM], "portrait");
      doc.addImage(imgData, "JPEG", 0, 0, PAGE_W_MM, PAGE_H_MM, undefined, "FAST");
    }

    report({ phase: "writing", current: pages.length, total: pages.length, message: "Saving PDF…" });

    const blob = doc.output("blob");
    if (filename) doc.save(filename);

    report({ phase: "done", current: pages.length, total: pages.length });
    return blob;
  } finally {
    try {
      root?.unmount();
    } catch {
      /* ignore */
    }
    host.remove();
  }
}
