import jsPDF from "jspdf";
import { format } from "date-fns";
import type { Memory } from "@/hooks/useMemories";
import type { Achievement } from "@/hooks/useAchievements";

type Item =
  | { kind: "memory"; date: Date; data: Memory }
  | { kind: "achievement"; date: Date; data: Achievement };

const PAGE_W = 210; // A4 mm
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;

/** Per-export diagnostics so the UI can show actionable error info. */
export type KeepsakeExportReport = {
  totalItems: number;
  imagesAttempted: number;
  imagesLoaded: number;
  failedImages: string[];
};

async function loadImageAsDataUrl(
  url: string,
  report: KeepsakeExportReport,
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
    const dims: { w: number; h: number } = await new Promise((resolve) => {
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

export async function exportKeepsakePdf(opts: {
  childName: string;
  childDob: Date;
  memories: Memory[];
  achievements: Achievement[];
  fromYear?: number;
  toYear?: number;
  includePhotos?: boolean;
  includeStories?: boolean;
  includeAchievements?: boolean;
}): Promise<KeepsakeExportReport> {
  const {
    childName,
    childDob,
    memories,
    achievements,
    fromYear,
    toYear,
    includePhotos = true,
    includeStories = true,
    includeAchievements = true,
  } = opts;
  const report: KeepsakeExportReport = {
    totalItems: 0,
    imagesAttempted: 0,
    imagesLoaded: 0,
    failedImages: [],
  };
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // Cover
  doc.setFillColor(168, 197, 186); // primary teal
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.text("Kidzopedia", PAGE_W / 2, 110, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text("A keepsake of memories", PAGE_W / 2, 122, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text(childName, PAGE_W / 2, 160, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Born ${format(childDob, "MMMM d, yyyy")}`, PAGE_W / 2, 170, { align: "center" });
  doc.setFontSize(10);
  doc.text(`Exported ${format(new Date(), "MMM d, yyyy")}`, PAGE_W / 2, PAGE_H - 20, { align: "center" });

  // Group items by year (with filters)
  const items: Item[] = [
    ...memories.map<Item>((m) => ({ kind: "memory", date: new Date(m.happened_at), data: m })),
    ...(includeAchievements
      ? achievements.map<Item>((a) => ({ kind: "achievement", date: new Date(a.achievement_date), data: a }))
      : []),
  ]
    .filter((it) => {
      const y = it.date.getFullYear();
      if (fromYear != null && y < fromYear) return false;
      if (toYear != null && y > toYear) return false;
      return true;
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  report.totalItems = items.length;

  const byYear = new Map<number, Item[]>();
  for (const it of items) {
    const y = it.date.getFullYear();
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y)!.push(it);
  }
  const years = [...byYear.keys()].sort((a, b) => b - a);

  let y = MARGIN;
  const ensureSpace = (need: number) => {
    if (y + need > PAGE_H - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const writeTextWrap = (text: string, size: number, weight: "bold" | "normal", colorRGB: [number, number, number]) => {
    doc.setFont("helvetica", weight);
    doc.setFontSize(size);
    doc.setTextColor(...colorRGB);
    const lines = doc.splitTextToSize(text, CONTENT_W);
    for (const line of lines) {
      ensureSpace(size * 0.45 + 1);
      doc.text(line, MARGIN, y);
      y += size * 0.45 + 1;
    }
  };

  for (const year of years) {
    doc.addPage();
    y = MARGIN;

    // Year header
    doc.setFillColor(244, 196, 175); // peach
    doc.roundedRect(MARGIN, y, CONTENT_W, 22, 4, 4, "F");
    doc.setTextColor(80, 50, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(String(year), MARGIN + 8, y + 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const yearItems = byYear.get(year)!;
    const memCount = yearItems.filter((i) => i.kind === "memory").length;
    const achCount = yearItems.filter((i) => i.kind === "achievement").length;
    doc.text(
      `${memCount} memor${memCount === 1 ? "y" : "ies"} · ${achCount} achievement${achCount === 1 ? "" : "s"}`,
      PAGE_W - MARGIN - 8,
      y + 14,
      { align: "right" },
    );
    y += 30;

    for (const item of yearItems) {
      ensureSpace(40);

      // Date pill
      doc.setFillColor(236, 232, 224);
      doc.roundedRect(MARGIN, y, 38, 6, 2, 2, "F");
      doc.setTextColor(110, 100, 90);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(format(item.date, "MMM d, yyyy").toUpperCase(), MARGIN + 2, y + 4.2);

      // Kind tag
      const tagColor: [number, number, number] = item.kind === "memory" ? [168, 197, 186] : [221, 178, 219];
      doc.setFillColor(...tagColor);
      doc.roundedRect(MARGIN + 42, y, 26, 6, 2, 2, "F");
      doc.setTextColor(40, 40, 40);
      doc.text(item.kind === "memory" ? "MEMORY" : "ACHIEVEMENT", MARGIN + 43.5, y + 4.2);

      y += 10;

      // Title
      const title = item.kind === "memory" ? item.data.title : `${item.data.subject}`;
      writeTextWrap(title, 14, "bold", [40, 40, 40]);

      // Body / extras
      if (item.kind === "memory") {
        const m = item.data;
        if (includeStories && m.story) {
          y += 1;
          writeTextWrap(m.story, 10, "normal", [80, 80, 80]);
        }
        const meta: string[] = [];
        if (m.who_was_there?.length) meta.push(`With: ${m.who_was_there.join(", ")}`);
        if (m.tags?.length) meta.push(`Tags: ${m.tags.join(", ")}`);
        if (m.category) meta.push(`Category: ${m.category}`);
        if (meta.length) {
          y += 1;
          writeTextWrap(meta.join("  ·  "), 9, "normal", [140, 130, 120]);
        }
        if (includePhotos) {
          // Resolve highlight + additional photos. Highlight = photo_urls[0] (== photo_url).
          const allUrls: string[] =
            m.photo_urls && m.photo_urls.length > 0
              ? m.photo_urls
              : m.photo_url
                ? [m.photo_url]
                : [];
          const highlightUrl = allUrls[0];
          const extraUrls = allUrls.slice(1);

          if (highlightUrl) {
            const img = await loadImageAsDataUrl(highlightUrl, report);
            if (img) {
              const maxW = CONTENT_W;
              const maxH = 90;
              const ratio = Math.min(maxW / img.w, maxH / img.h);
              const w = img.w * ratio;
              const h = img.h * ratio;
              ensureSpace(h + 4);
              const imgX = MARGIN;
              const imgY = y;
              try {
                doc.addImage(img.data, "JPEG", imgX, imgY, w, h, undefined, "FAST");
              } catch {
                try {
                  doc.addImage(img.data, "PNG", imgX, imgY, w, h, undefined, "FAST");
                } catch {
                  /* skip */
                }
              }
              // ★ Cover badge (only when there's more than one photo)
              if (extraUrls.length > 0) {
                doc.setFillColor(255, 255, 255);
                doc.roundedRect(imgX + 2, imgY + 2, 16, 5.5, 1.5, 1.5, "F");
                doc.setTextColor(180, 120, 30);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(7);
                doc.text("\u2605 COVER", imgX + 3.2, imgY + 5.9);
              }
              y += h + 4;
            }
          }

          // Additional photos as a thumbnail strip (4 per row)
          if (extraUrls.length > 0) {
            const cols = 4;
            const gap = 3;
            const thumbW = (CONTENT_W - gap * (cols - 1)) / cols;
            const thumbH = thumbW * 0.75;
            let col = 0;
            ensureSpace(thumbH + 4);
            let rowY = y;
            for (const url of extraUrls) {
              const img = await loadImageAsDataUrl(url, report);
              const x = MARGIN + col * (thumbW + gap);
              if (img) {
                // Cover-fit the thumbnail by drawing into a fixed box.
                try {
                  doc.addImage(img.data, "JPEG", x, rowY, thumbW, thumbH, undefined, "FAST");
                } catch {
                  try {
                    doc.addImage(img.data, "PNG", x, rowY, thumbW, thumbH, undefined, "FAST");
                  } catch {
                    /* skip */
                  }
                }
              } else {
                doc.setFillColor(240, 236, 230);
                doc.rect(x, rowY, thumbW, thumbH, "F");
              }
              col++;
              if (col >= cols) {
                col = 0;
                rowY += thumbH + gap;
                y = rowY;
                if (extraUrls.indexOf(url) < extraUrls.length - 1) {
                  ensureSpace(thumbH + 4);
                  rowY = y;
                }
              }
            }
            if (col !== 0) {
              rowY += thumbH;
            }
            y = rowY + 4;
          }
        }
      } else {
        const a = item.data;
        const meta: string[] = [`Type: ${a.type}`];
        if (a.grade) meta.push(`Grade: ${a.grade}`);
        writeTextWrap(meta.join("  ·  "), 9, "normal", [140, 130, 120]);
        if (includeStories && a.notes) {
          y += 1;
          writeTextWrap(a.notes, 10, "normal", [80, 80, 80]);
        }
        if (includePhotos && a.photo_url) {
          const img = await loadImageAsDataUrl(a.photo_url, report);
          if (img) {
            const maxW = CONTENT_W;
            const maxH = 90;
            const ratio = Math.min(maxW / img.w, maxH / img.h);
            const w = img.w * ratio;
            const h = img.h * ratio;
            ensureSpace(h + 4);
            try {
              doc.addImage(img.data, "JPEG", MARGIN, y, w, h, undefined, "FAST");
            } catch {
              try {
                doc.addImage(img.data, "PNG", MARGIN, y, w, h, undefined, "FAST");
              } catch {
                /* skip */
              }
            }
            y += h + 4;
          }
        }
      }

      // Divider
      y += 2;
      doc.setDrawColor(230, 226, 220);
      doc.line(MARGIN, y, PAGE_W - MARGIN, y);
      y += 6;
    }
  }

  if (years.length === 0) {
    doc.addPage();
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text("No memories or achievements yet.", PAGE_W / 2, 140, { align: "center" });
  }

  doc.save(`${childName.replace(/\s+/g, "_")}_keepsake_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  return report;
}
