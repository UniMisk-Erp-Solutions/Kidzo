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
  canvas.className = "mx-auto mb-3 w-full max-w-[560px] rounded-md border border-border bg-white shadow-sm";
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
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
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;
    host.replaceChildren();
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const doc = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
        const scale = Math.min(2, (window.devicePixelRatio || 1) * 1.25);
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          if (cancelled) return;
          const canvas = await renderPageToCanvas(page, scale);
          if (cancelled) return;
          host.appendChild(canvas);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
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
