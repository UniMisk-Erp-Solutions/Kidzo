import { useEffect, useRef } from "react";
import { fetchImageAsDataUrl, loadImageDims, parseClipboardHtml } from "./clipboardParser";
import { EDITOR_CANVAS_H, EDITOR_CANVAS_W, uid, type EditorElement } from "./types";

export interface PasteContext {
  nextZ: number;
  /** Default text colour. */
  ink: string;
  addPhoto: (dataUrl: string) => void;
  addElement: (el: EditorElement) => void;
  /** Add several elements at once and select them. */
  addMany: (els: EditorElement[]) => void;
}

const isTypingTarget = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
};

/** The first image file on the clipboard (a screenshot or a copied image), if any. */
const clipboardImage = (data: DataTransfer): File | null => {
  const item = Array.from(data.items).find((i) => i.kind === "file" && i.type.startsWith("image/") && i.getAsFile());
  return item?.getAsFile() ?? null;
};

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(file);
  });

/** Downloads a pasted picture and sizes it to fit (max 280px); null if it can't be loaded. */
async function loadPastedPhoto(el: EditorElement & { type: "photo" }): Promise<EditorElement | null> {
  try {
    const dataUrl = await fetchImageAsDataUrl(el.src);
    const dims = await loadImageDims(dataUrl);
    const scale = Math.min(280 / dims.w, 280 / dims.h, 1);
    return { ...el, src: dataUrl, w: Math.max(60, dims.w * scale), h: Math.max(60, dims.h * scale) };
  } catch {
    return null; // skip a broken image
  }
}

/** Resolves the parsed pieces of a paste (pictures are fetched so they can be sized properly). */
async function resolvePasted(parsed: EditorElement[]): Promise<EditorElement[]> {
  const out: EditorElement[] = [];
  for (const el of parsed) {
    const item = el.type === "photo" ? await loadPastedPhoto(el) : el;
    if (item) out.push(item);
  }
  return out;
}

const textElement = (text: string, z: number, color: string): EditorElement => ({
  id: uid(),
  type: "text",
  x: EDITOR_CANVAS_W / 2,
  y: EDITOR_CANVAS_H / 2,
  w: Math.min(480, Math.max(120, text.length * 12)),
  h: 60,
  rotation: 0,
  z,
  text: text.slice(0, 500),
  font: "handwritten",
  size: 28,
  color,
  align: "center",
});

function handlePaste(e: ClipboardEvent, c: PasteContext) {
  if (isTypingTarget(e.target) || !e.clipboardData) return;
  const data = e.clipboardData;

  // 1. A picture on the clipboard (screenshot, copied image)
  const file = clipboardImage(data);
  if (file) {
    e.preventDefault();
    void readAsDataUrl(file).then(c.addPhoto);
    return;
  }

  // 2. Smart paste: HTML from Canva, Google Docs, web pages
  const html = data.getData("text/html");
  const parsed = html.trim() ? parseClipboardHtml(html, { z: c.nextZ, defaultColor: c.ink, centerX: EDITOR_CANVAS_W / 2, centerY: EDITOR_CANVAS_H / 2 }) : [];
  if (parsed.length > 0) {
    e.preventDefault();
    void resolvePasted(parsed).then((els) => els.length > 0 && c.addMany(els));
    return;
  }

  // 3. Plain text fallback — one text element
  const text = data.getData("text/plain");
  if (text) {
    e.preventDefault();
    c.addElement(textElement(text, c.nextZ, c.ink));
  }
}

/** Paste images and text (including from Canva or web pages) straight onto the page. */
export function useEditorPaste(ctx: PasteContext) {
  // Always use the latest editor state at paste time, so the listener is added only once.
  const latest = useRef(ctx);
  latest.current = ctx;

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => handlePaste(e, latest.current);
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);
}
