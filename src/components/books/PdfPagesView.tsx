import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

/** Draws one PDF page onto a new canvas. */
async function renderPageToCanvas(page: pdfjs.PDFPageProxy, scale: number): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.className = "w-full rounded-md border border-border bg-white shadow-sm";
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

/**
 * Lays out a placeholder per page right away and only draws a page when it scrolls near the view,
 * so a long book shows its first pages immediately instead of after every page is drawn.
 */
async function renderAllPages(host: HTMLElement, blob: Blob, isCancelled: () => boolean) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
  const scale = Math.min(1.5, (window.devicePixelRatio || 1) * 1.25);
  const first = await doc.getPage(1);
  const vp = first.getViewport({ scale: 1 });
  const ratio = vp.height / vp.width;
  if (isCancelled()) return;

  const root = host.closest(".overflow-y-auto") as HTMLElement | null;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const slot = e.target as HTMLElement;
        observer.unobserve(slot);
        const n = Number(slot.dataset.page);
        void doc
          .getPage(n)
          .then((pg) => renderPageToCanvas(pg, scale))
          .then((canvas) => {
            if (!isCancelled()) slot.replaceChildren(canvas);
          })
          .catch(() => {});
      }
    },
    { root, rootMargin: "600px 0px" },
  );
  for (let i = 1; i <= doc.numPages; i++) {
    const slot = document.createElement("div");
    slot.dataset.page = String(i);
    slot.className = "mx-auto mb-3 w-full max-w-[560px]";
    slot.style.aspectRatio = `1 / ${ratio}`;
    host.appendChild(slot);
    observer.observe(slot);
  }
  const stop = setInterval(() => {
    if (isCancelled()) {
      observer.disconnect();
      clearInterval(stop);
    }
  }, 500);
}

/**
 * Renders each page of a PDF blob to a canvas (no PDF viewer, so no toolbar, download or print
 * button) and lets the parent append content — e.g. a locked panel — right after the last page.
 */
export const PdfPagesView = ({ blob, children }: { blob: Blob; children?: React.ReactNode }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    host.replaceChildren();
    setLoading(true);
    setError(false);
    renderAllPages(host, blob, () => cancelled)
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [blob]);

  return (
    <div>
      {loading && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {error && <p className="py-6 text-center text-sm text-muted-foreground">Couldn't display the preview.</p>}
      <div ref={hostRef} />
      {!loading && children}
    </div>
  );
};
