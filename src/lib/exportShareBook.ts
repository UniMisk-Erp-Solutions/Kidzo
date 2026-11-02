import jsPDF from "jspdf";
import { format } from "date-fns";
import type { Memory } from "@/hooks/useMemories";
import { exportBookPdf } from "@/lib/exportBookPdf";
import { SCRAPBOOK_EXPORT_PRESETS, type ScrapbookExportLayout } from "@/lib/scrapbookExportPresets";

export type LayoutStyle = "classic" | "minimal" | "timeline" | ScrapbookExportLayout;

export const isScrapbookLayout = (l: LayoutStyle): l is ScrapbookExportLayout => l in SCRAPBOOK_EXPORT_PRESETS;

export type ShareBookReport = {
  totalItems: number;
  imagesAttempted: number;
  imagesLoaded: number;
  failedImages: string[];
};

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;

async function loadImage(
  url: string,
  report: ShareBookReport,
): Promise<{ data: string; w: number; h: number } | null> {
  report.imagesAttempted++;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      report.failedImages.push(`${url} → HTTP ${res.status}`);
      return null;
    }
    const blob = await res.blob();
    const dataUrl: string = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    const dims = await new Promise<{ w: number; h: number }>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 0, h: 0 });
      img.src = dataUrl;
    });
    if (!dims.w) {
      report.failedImages.push(`${url} → couldn't decode`);
      return null;
    }
    report.imagesLoaded++;
    return { data: dataUrl, w: dims.w, h: dims.h };
  } catch (err) {
    report.failedImages.push(`${url} → ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

const addImageSafe = (
  doc: jsPDF,
  data: string,
  x: number,
  y: number,
  w: number,
  h: number,
) => {
  try {
    doc.addImage(data, "JPEG", x, y, w, h, undefined, "FAST");
  } catch {
    try {
      doc.addImage(data, "PNG", x, y, w, h, undefined, "FAST");
    } catch {
      /* skip */
    }
  }
};

const photoUrlsOf = (m: Memory) => (m.photo_urls?.length ? m.photo_urls : m.photo_url ? [m.photo_url] : []);

const coverPhotoFor = (m: Memory, overrides?: Record<string, string>) => {
  const override = overrides?.[m.id];
  if (override) return override;
  return photoUrlsOf(m)[0] ?? null;
};

/* ───────────────────────────── covers ───────────────────────────── */

function drawMinimalCover(doc: jsPDF, childName: string, childDob: Date) {
  doc.setFillColor(252, 250, 247);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("A KEEPSAKE", PAGE_W / 2, 130, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(42);
  doc.text(childName, PAGE_W / 2, 152, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(140, 130, 120);
  doc.text(format(childDob, "MMMM d, yyyy"), PAGE_W / 2, 162, { align: "center" });
}

function drawTimelineCover(doc: jsPDF, childName: string, childDob: Date) {
  doc.setFillColor(28, 30, 48);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(40);
  doc.text(childName, PAGE_W / 2, 140, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.text("A timeline of moments", PAGE_W / 2, 154, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(180, 180, 200);
  doc.text(format(childDob, "MMMM d, yyyy"), PAGE_W / 2, 166, { align: "center" });
}

/** Classic coffee-table cover. */
function drawClassicCover(doc: jsPDF, childName: string, childDob: Date) {
  doc.setFillColor(168, 197, 186);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.text("Kidzopedia", PAGE_W / 2, 110, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text("A keepsake photo book", PAGE_W / 2, 122, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text(childName, PAGE_W / 2, 160, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Born ${format(childDob, "MMMM d, yyyy")}`, PAGE_W / 2, 170, { align: "center" });
}

function drawCover(doc: jsPDF, layout: LayoutStyle, childName: string, childDob: Date) {
  if (layout === "minimal") drawMinimalCover(doc, childName, childDob);
  else if (layout === "timeline") drawTimelineCover(doc, childName, childDob);
  else drawClassicCover(doc, childName, childDob);
  const isTimeline = layout === "timeline";
  doc.setFontSize(10);
  doc.setTextColor(isTimeline ? 200 : 100, isTimeline ? 200 : 100, isTimeline ? 220 : 100);
  doc.text(`Exported ${format(new Date(), "MMM d, yyyy")}`, PAGE_W / 2, PAGE_H - 20, { align: "center" });
}

/* ───────────────────────── shared page pieces ───────────────────────── */

/**
 * Loads `url` and draws it scaled to fit maxW×maxH at `y`, with its x position chosen from the drawn width.
 * Returns the drawn height (0 when there is no image or it couldn't be loaded).
 */
async function placeImage(
  doc: jsPDF,
  url: string | null,
  report: ShareBookReport,
  box: { maxW: number; maxH: number; y: number; xFor: (w: number) => number },
): Promise<number> {
  if (!url) return 0;
  const img = await loadImage(url, report);
  if (!img) return 0;
  const r = Math.min(box.maxW / img.w, box.maxH / img.h);
  const w = img.w * r;
  const h = img.h * r;
  addImageSafe(doc, img.data, box.xFor(w), box.y, w, h);
  return h;
}

/** Bold title (wrapped) at x, starting at y; returns the y after the last line. */
function drawTitleLines(doc: jsPDF, title: string, at: { x: number; y: number; width: number; size: number; lineH: number }) {
  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(at.size);
  let y = at.y;
  for (const line of doc.splitTextToSize(title, at.width)) {
    doc.text(line, at.x, y);
    y += at.lineH;
  }
  return y;
}

/** Story lines from y down, stopping before the bottom strip. Set font/colour/size before calling. */
function drawStoryLines(doc: jsPDF, story: string, at: { x: number; y: number; width: number; lineH: number }) {
  let y = at.y;
  for (const line of doc.splitTextToSize(story, at.width)) {
    if (y > PAGE_H - MARGIN - 30) break;
    doc.text(line, at.x, y);
    y += at.lineH;
  }
}

/** A row of extra photos along the bottom edge. */
async function drawExtrasStrip(
  doc: jsPDF,
  extras: string[],
  report: ShareBookReport,
  strip: { x0: number; width: number; cols: number; placeholder: boolean },
) {
  const gap = 3;
  const thumbW = (strip.width - gap * (strip.cols - 1)) / strip.cols;
  const thumbH = thumbW * 0.75;
  const stripY = PAGE_H - MARGIN - thumbH;
  for (let i = 0; i < Math.min(strip.cols, extras.length); i++) {
    const img = await loadImage(extras[i], report);
    const x = strip.x0 + i * (thumbW + gap);
    if (img) addImageSafe(doc, img.data, x, stripY, thumbW, thumbH);
    else if (strip.placeholder) {
      doc.setFillColor(240, 236, 230);
      doc.rect(x, stripY, thumbW, thumbH, "F");
    }
  }
}

/* ───────────────────────── per-layout memory pages ───────────────────────── */

type PageInput = { m: Memory; coverUrl: string | null; extras: string[] };

/** Hero photo top half + caption below. */
async function drawClassicPage(doc: jsPDF, { m, coverUrl, extras }: PageInput, report: ShareBookReport) {
  const h = await placeImage(doc, coverUrl, report, {
    maxW: CONTENT_W,
    maxH: 150,
    y: MARGIN,
    xFor: (w) => MARGIN + (CONTENT_W - w) / 2,
  });
  let y = h ? MARGIN + h + 8 : MARGIN;
  y = drawTitleLines(doc, m.title, { x: MARGIN, y, width: CONTENT_W, size: 20, lineH: 8 });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(140, 130, 120);
  doc.text(format(new Date(m.happened_at), "MMMM d, yyyy"), MARGIN, y);
  y += 8;
  if (m.story) {
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(11);
    drawStoryLines(doc, m.story, { x: MARGIN, y, width: CONTENT_W, lineH: 5.5 });
  }
  if (extras.length) {
    await drawExtrasStrip(doc, extras, report, { x0: MARGIN, width: CONTENT_W, cols: Math.min(4, extras.length), placeholder: true });
  }
}

/** Huge whitespace, single image centred, tiny caption. */
async function drawMinimalPage(doc: jsPDF, { m, coverUrl }: PageInput, report: ShareBookReport) {
  doc.setFillColor(252, 250, 247);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  await placeImage(doc, coverUrl, report, { maxW: CONTENT_W - 20, maxH: 170, y: 60, xFor: (w) => (PAGE_W - w) / 2 });
  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(format(new Date(m.happened_at), "MMM d, yyyy").toUpperCase(), PAGE_W / 2, 245, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(m.title, CONTENT_W);
  doc.text(titleLines, PAGE_W / 2, 255, { align: "center" });
  if (!m.story) return;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120, 110, 100);
  const lines = doc.splitTextToSize(m.story, CONTENT_W - 30);
  let ly = 268;
  for (const line of lines.slice(0, 3)) {
    doc.text(line, PAGE_W / 2, ly, { align: "center" });
    ly += 5;
  }
}

/** Left date rail + right content. */
async function drawTimelinePage(doc: jsPDF, { m, coverUrl, extras }: PageInput, report: ShareBookReport) {
  const railW = 50;
  doc.setFillColor(28, 30, 48);
  doc.rect(0, 0, railW, PAGE_H, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(format(new Date(m.happened_at), "yyyy"), railW / 2, 40, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(format(new Date(m.happened_at), "MMM d"), railW / 2, 52, { align: "center" });

  const contentX = railW + 10;
  const contentW = PAGE_W - contentX - MARGIN;
  const h = await placeImage(doc, coverUrl, report, { maxW: contentW, maxH: 110, y: MARGIN, xFor: () => contentX });
  let y = h ? MARGIN + h + 8 : MARGIN;
  y = drawTitleLines(doc, m.title, { x: contentX, y, width: contentW, size: 18, lineH: 7 });
  if (m.story) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(70, 70, 70);
    drawStoryLines(doc, m.story, { x: contentX, y, width: contentW, lineH: 5.2 });
  }
  if (extras.length) {
    await drawExtrasStrip(doc, extras, report, { x0: contentX, width: contentW, cols: 3, placeholder: false });
  }
}

async function drawMemoryPage(
  doc: jsPDF,
  layout: LayoutStyle,
  m: Memory,
  coverOverrides: Record<string, string> | undefined,
  report: ShareBookReport,
) {
  const coverUrl = coverPhotoFor(m, coverOverrides);
  const extras = photoUrlsOf(m).filter((u) => u !== coverUrl);
  const input: PageInput = { m, coverUrl, extras };
  if (layout === "classic") await drawClassicPage(doc, input, report);
  else if (layout === "minimal") await drawMinimalPage(doc, input, report);
  else await drawTimelinePage(doc, input, report);
}

/* ───────────────────────────── export ───────────────────────────── */

type ShareBookOptions = {
  childName: string;
  childDob: Date;
  memories: Memory[]; // pre-ordered by caller
  coverOverrides?: Record<string, string>;
  layout: LayoutStyle;
  download?: boolean;
  /** Cap the PDF at this many pages (free-plan preview). The rest is never generated. */
  maxPages?: number;
};

type ShareBookResult = { blob: Blob; filename: string; report: ShareBookReport };

/** Scrapbook collage looks: rendered by the book page renderer (many photos per page, tape, film roll…). */
async function exportScrapbook(opts: ShareBookOptions, layout: ScrapbookExportLayout): Promise<ShareBookResult> {
  const { childName, childDob, coverOverrides, download = false, maxPages } = opts;
  const template = SCRAPBOOK_EXPORT_PRESETS[layout];
  const withCovers = opts.memories.map((m) => ({ ...m, photo_url: coverPhotoFor(m, coverOverrides) }));
  const filename = `${childName.replace(/\s+/g, "_")}_scrapbook_${layout}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  const photoCount = withCovers.filter((m) => m.photo_url).length;
  const blob = await exportBookPdf({
    title: `${childName}'s Memory Book`,
    childName,
    childDob: childDob.toISOString(),
    template,
    colors: template.color_scheme,
    memories: withCovers,
    maxPages,
    filename: download ? filename : undefined,
  });
  return {
    blob,
    filename,
    // the page renderer doesn't report per-image failures, so count what we handed it
    report: { totalItems: withCovers.length, imagesAttempted: photoCount, imagesLoaded: photoCount, failedImages: [] },
  };
}

/** The book when no memory is selected: the cover plus a "No memories selected." page. */
function finishEmptyBook(doc: jsPDF, childName: string, download: boolean, report: ShareBookReport): ShareBookResult {
  doc.addPage();
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text("No memories selected.", PAGE_W / 2, 140, { align: "center" });
  const blob = doc.output("blob");
  const filename = `${childName.replace(/\s+/g, "_")}_keepsake_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  if (download) doc.save(filename);
  return { blob, filename, report };
}

export async function exportShareBook(opts: ShareBookOptions): Promise<ShareBookResult> {
  const { childName, childDob, coverOverrides, layout, download = false, maxPages } = opts;

  if (isScrapbookLayout(layout)) return exportScrapbook(opts, layout);

  // page 1 is the cover, so a cap of N leaves room for N-1 memory pages
  const memories = maxPages ? opts.memories.slice(0, Math.max(0, maxPages - 1)) : opts.memories;
  const report: ShareBookReport = {
    totalItems: memories.length,
    imagesAttempted: 0,
    imagesLoaded: 0,
    failedImages: [],
  };
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  drawCover(doc, layout, childName, childDob);
  if (memories.length === 0) return finishEmptyBook(doc, childName, download, report);

  for (const m of memories) {
    doc.addPage();
    await drawMemoryPage(doc, layout, m, coverOverrides, report);
  }

  if (maxPages) {
    while (doc.getNumberOfPages() > maxPages) doc.deletePage(doc.getNumberOfPages());
  }
  const filename = `${childName.replace(/\s+/g, "_")}_keepsake_${layout}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  const blob = doc.output("blob");
  if (download) doc.save(filename);
  return { blob, filename, report };
}
