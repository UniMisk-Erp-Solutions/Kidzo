import jsPDF from "jspdf";
import { createRoot } from "react-dom/client";
import { createElement } from "react";
import { format } from "date-fns";
import type { BookTemplateColors } from "@/lib/types/bookTemplate";
import {
  POLAROID_PAPER,
  POLAROIDS_PER_PAGE,
  PolaroidGridPage,
  type PolaroidItem,
} from "@/components/books/PolaroidGridPage";
import { createRenderHost, snapshot, waitForFonts, waitForImages } from "@/lib/exportBookPdf";
import { loadFonts } from "@/lib/editorFonts";

export type PolaroidExportItem = PolaroidItem & { date: Date };

const COLORS: BookTemplateColors = { primary: POLAROID_PAPER, paper: POLAROID_PAPER, accent: "#1A1A1A", gold: "#E0B24A", coral: "#7A1F2B" };

const PAGE_W_MM = 210;
const PAGE_H_MM = 280;

type PageSpec = { title: string; footer: string; items: PolaroidItem[] };

const monthsLabel = (items: PolaroidExportItem[]) => {
  const first = format(items[0].date, "MMMM").toLowerCase();
  const last = format(items[items.length - 1].date, "MMMM").toLowerCase();
  return first === last ? first : `${first} – ${last}`;
};

/** Year by year, oldest first, nine photos to a page. */
const buildPageSpecs = (childName: string, items: PolaroidExportItem[]): PageSpec[] => {
  const sorted = [...items].sort((a, b) => a.date.getTime() - b.date.getTime());
  const byYear = new Map<number, PolaroidExportItem[]>();
  for (const it of sorted) {
    const y = it.date.getFullYear();
    byYear.set(y, [...(byYear.get(y) ?? []), it]);
  }
  const pages: PageSpec[] = [];
  for (const [year, list] of byYear) {
    for (let i = 0; i < list.length; i += POLAROIDS_PER_PAGE) {
      const chunk = list.slice(i, i + POLAROIDS_PER_PAGE);
      pages.push({ title: `${childName.toLowerCase()} · ${year}`, footer: monthsLabel(chunk), items: chunk });
    }
  }
  return pages;
};

/**
 * Keepsake PDF: kraft-paper pages of taped polaroids, nine to a page, grouped by year.
 * Pages are drawn at the design size, captured with html2canvas and placed one per PDF page.
 */
export async function exportPolaroidPdf(opts: {
  childName: string;
  items: PolaroidExportItem[];
  filename: string;
}): Promise<Blob> {
  const pages = buildPageSpecs(opts.childName, opts.items);
  if (pages.length === 0) throw new Error("No pages to export");

  const host = createRenderHost(COLORS);
  const root = createRoot(host);
  try {
    await waitForFonts();
    await loadFonts(["Special Elite"]);

    const doc = new jsPDF({ unit: "mm", format: [PAGE_W_MM, PAGE_H_MM] });
    for (let i = 0; i < pages.length; i++) {
      root.render(createElement(PolaroidGridPage, pages[i]));
      // let React commit and the browser lay out and paint before capturing
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
      );
      await waitForImages(host);
      await waitForFonts();

      const canvas = await snapshot(host, COLORS);
      if (i > 0) doc.addPage([PAGE_W_MM, PAGE_H_MM], "portrait");
      doc.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, PAGE_W_MM, PAGE_H_MM, undefined, "FAST");
    }

    const blob = doc.output("blob");
    doc.save(opts.filename);
    return blob;
  } finally {
    try {
      root.unmount();
    } catch {
      /* ignore */
    }
    host.remove();
  }
}
