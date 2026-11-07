import { GState, type jsPDF } from "jspdf";

/** Tiles a faint diagonal watermark (the child's name) over the whole current page. */
export function stampWatermark(doc: jsPDF, pageW: number, pageH: number, text: string) {
  doc.saveGraphicsState();
  doc.setGState(new GState({ opacity: 0.4 }));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  doc.setTextColor(255, 255, 255);
  const stepX = 90;
  const stepY = 45;
  for (let y = -pageH; y < pageH * 2; y += stepY) {
    const row = Math.round(y / stepY);
    for (let x = -pageW; x < pageW * 2; x += stepX) {
      doc.text(text, x + (row % 2 ? stepX / 2 : 0), y, { angle: 30 });
    }
  }
  doc.restoreGraphicsState();
}
