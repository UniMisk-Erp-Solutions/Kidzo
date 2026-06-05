import jsPDF from "jspdf";
import { format } from "date-fns";
import type { Memory } from "@/hooks/useMemories";

export type LayoutStyle = "classic" | "minimal" | "timeline";

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

const coverPhotoFor = (m: Memory, overrides?: Record<string, string>) => {
  const override = overrides?.[m.id];
  if (override) return override;
  const all = m.photo_urls?.length ? m.photo_urls : m.photo_url ? [m.photo_url] : [];
  return all[0] ?? null;
};

export async function exportShareBook(opts: {
  childName: string;
  childDob: Date;
  memories: Memory[]; // pre-ordered by caller
  coverOverrides?: Record<string, string>;
  layout: LayoutStyle;
  download?: boolean;
}): Promise<{ blob: Blob; filename: string; report: ShareBookReport }> {
  const { childName, childDob, memories, coverOverrides, layout, download = false } = opts;
  const report: ShareBookReport = {
    totalItems: memories.length,
    imagesAttempted: 0,
    imagesLoaded: 0,
    failedImages: [],
  };
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // ---- COVER ----
  if (layout === "minimal") {
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
  } else if (layout === "timeline") {
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
  } else {
    // classic coffee-table
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
  doc.setFontSize(10);
  doc.setTextColor(layout === "timeline" ? 200 : 100, layout === "timeline" ? 200 : 100, layout === "timeline" ? 220 : 100);
  doc.text(`Exported ${format(new Date(), "MMM d, yyyy")}`, PAGE_W / 2, PAGE_H - 20, { align: "center" });

  if (memories.length === 0) {
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

  // ---- BODY by layout ----
  for (const m of memories) {
    doc.addPage();
    const coverUrl = coverPhotoFor(m, coverOverrides);
    const allUrls = m.photo_urls?.length ? m.photo_urls : m.photo_url ? [m.photo_url] : [];
    const extras = allUrls.filter((u) => u !== coverUrl);

    if (layout === "classic") {
      // Hero photo top half + caption below
      let y = MARGIN;
      if (coverUrl) {
        const img = await loadImage(coverUrl, report);
        if (img) {
          const maxW = CONTENT_W;
          const maxH = 150;
          const r = Math.min(maxW / img.w, maxH / img.h);
          const w = img.w * r;
          const h = img.h * r;
          const x = MARGIN + (CONTENT_W - w) / 2;
          addImageSafe(doc, img.data, x, y, w, h);
          y += h + 8;
        }
      }
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      const titleLines = doc.splitTextToSize(m.title, CONTENT_W);
      for (const line of titleLines) {
        doc.text(line, MARGIN, y);
        y += 8;
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(140, 130, 120);
      doc.text(format(new Date(m.happened_at), "MMMM d, yyyy"), MARGIN, y);
      y += 8;
      if (m.story) {
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(11);
        const lines = doc.splitTextToSize(m.story, CONTENT_W);
        for (const line of lines) {
          if (y > PAGE_H - MARGIN - 30) break;
          doc.text(line, MARGIN, y);
          y += 5.5;
        }
      }
      // extras strip at bottom
      if (extras.length) {
        const cols = Math.min(4, extras.length);
        const gap = 3;
        const thumbW = (CONTENT_W - gap * (cols - 1)) / cols;
        const thumbH = thumbW * 0.75;
        const stripY = PAGE_H - MARGIN - thumbH;
        for (let i = 0; i < Math.min(cols, extras.length); i++) {
          const img = await loadImage(extras[i], report);
          const x = MARGIN + i * (thumbW + gap);
          if (img) addImageSafe(doc, img.data, x, stripY, thumbW, thumbH);
          else {
            doc.setFillColor(240, 236, 230);
            doc.rect(x, stripY, thumbW, thumbH, "F");
          }
        }
      }
    } else if (layout === "minimal") {
      // huge whitespace, single image centered, tiny caption
      doc.setFillColor(252, 250, 247);
      doc.rect(0, 0, PAGE_W, PAGE_H, "F");
      if (coverUrl) {
        const img = await loadImage(coverUrl, report);
        if (img) {
          const maxW = CONTENT_W - 20;
          const maxH = 170;
          const r = Math.min(maxW / img.w, maxH / img.h);
          const w = img.w * r;
          const h = img.h * r;
          const x = (PAGE_W - w) / 2;
          const y = 60;
          addImageSafe(doc, img.data, x, y, w, h);
        }
      }
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(format(new Date(m.happened_at), "MMM d, yyyy").toUpperCase(), PAGE_W / 2, 245, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      const titleLines = doc.splitTextToSize(m.title, CONTENT_W);
      doc.text(titleLines, PAGE_W / 2, 255, { align: "center" });
      if (m.story) {
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
    } else {
      // timeline-first: left date rail + right content
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

      let y = MARGIN;
      const contentX = railW + 10;
      const contentW = PAGE_W - contentX - MARGIN;
      if (coverUrl) {
        const img = await loadImage(coverUrl, report);
        if (img) {
          const maxH = 110;
          const r = Math.min(contentW / img.w, maxH / img.h);
          const w = img.w * r;
          const h = img.h * r;
          addImageSafe(doc, img.data, contentX, y, w, h);
          y += h + 8;
        }
      }
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      const titleLines = doc.splitTextToSize(m.title, contentW);
      for (const line of titleLines) {
        doc.text(line, contentX, y);
        y += 7;
      }
      if (m.story) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(70, 70, 70);
        const lines = doc.splitTextToSize(m.story, contentW);
        for (const line of lines) {
          if (y > PAGE_H - MARGIN - 30) break;
          doc.text(line, contentX, y);
          y += 5.2;
        }
      }
      if (extras.length) {
        const cols = 3;
        const gap = 3;
        const thumbW = (contentW - gap * (cols - 1)) / cols;
        const thumbH = thumbW * 0.75;
        const stripY = PAGE_H - MARGIN - thumbH;
        for (let i = 0; i < Math.min(cols, extras.length); i++) {
          const img = await loadImage(extras[i], report);
          const x = contentX + i * (thumbW + gap);
          if (img) addImageSafe(doc, img.data, x, stripY, thumbW, thumbH);
        }
      }
    }
  }

  const filename = `${childName.replace(/\s+/g, "_")}_keepsake_${layout}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
  const blob = doc.output("blob");
  if (download) doc.save(filename);
  return { blob, filename, report };
}
