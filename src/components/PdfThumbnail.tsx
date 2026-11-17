import { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

/** Rendered first pages, kept for the session so scrolling back doesn't fetch and draw again. */
const cache = new Map<string, string>();

async function renderFirstPage(url: string): Promise<string> {
  // Loaded on demand so the PDF engine only downloads when a PDF card is actually on screen.
  const pdfjs = await import("pdfjs-dist");
  const { default: workerUrl } = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const res = await fetch(url);
  if (!res.ok) throw new Error("fetch");
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await res.arrayBuffer()) }).promise;
  try {
    const page = await doc.getPage(1);
    const scale = 480 / page.getViewport({ scale: 1 }).width;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    void doc.destroy();
  }
}

/** First page of a PDF as a card image; shows a "PDF" placeholder while loading or if it can't be read. */
export const PdfThumbnail = ({ url, label = "PDF certificate", className }: { url: string; label?: string; className?: string }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(cache.get(url) ?? null);

  useEffect(() => {
    if (src) return;
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        renderFirstPage(url)
          .then((dataUrl) => {
            cache.set(url, dataUrl);
            if (!cancelled) setSrc(dataUrl);
          })
          .catch(() => {});
      },
      { rootMargin: "200px" },
    );
    observer.observe(host);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [url, src]);

  return (
    <div ref={hostRef} className={cn("relative w-full overflow-hidden bg-muted/60", className)}>
      {src ? (
        <img src={src} alt="" className="h-full w-full bg-white object-cover object-top" />
      ) : (
        <div className="flex h-full w-full items-center justify-center gap-2 text-muted-foreground">
          <FileText className="h-8 w-8" />
          <span className="text-[13px] font-medium">{label}</span>
        </div>
      )}
    </div>
  );
};
