/** Smart clipboard parsing for the page editor.
 *  Converts HTML clipboard payloads (from Canva, Google Docs, web pages, etc.)
 *  into editable EditorElements (text + photo). */

import type { EditorElement, PhotoElement, TextElement } from "./types";
import { uid } from "./types";

interface ParseOptions {
  z: number;
  defaultColor: string;
  centerX: number;
  centerY: number;
}

interface PartialPhoto {
  type: "photo";
  src: string;
  // sizing is finalised after image dimensions are known
}
interface PartialText {
  type: "text";
  text: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  size?: number;
  font?: TextElement["font"];
  align?: TextElement["align"];
}

type Partial = PartialPhoto | PartialText;

const MAX_TEXT_LEN = 800;

/** Parse a clipboard HTML string into a list of editor elements.
 *  Photos still have only their `src` populated — caller resolves dimensions. */
export function parseClipboardHtml(html: string, opts: ParseOptions): EditorElement[] {
  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(html, "text/html");
  } catch {
    return [];
  }

  const partials: Partial[] = [];
  walk(doc.body, partials);

  if (partials.length === 0) return [];

  // Layout heuristic: spread elements vertically around centre, slight rotation jitter.
  const out: EditorElement[] = [];
  let z = opts.z;
  const total = partials.length;
  partials.forEach((p, i) => {
    const offsetY = (i - (total - 1) / 2) * 70;
    const jitterX = ((i % 3) - 1) * 18;
    const jitterRot = ((i % 5) - 2) * 1.5;
    if (p.type === "photo") {
      const el: PhotoElement = {
        id: uid(),
        type: "photo",
        x: opts.centerX + jitterX,
        y: opts.centerY + offsetY,
        w: 220,
        h: 220,
        rotation: jitterRot,
        z: z++,
        src: p.src,
        borderColor: "#fff",
      };
      out.push(el);
    } else {
      const text = p.text.slice(0, MAX_TEXT_LEN);
      const fontSize = p.size ?? 28;
      const estW = Math.min(480, Math.max(140, text.length * fontSize * 0.55));
      const lines = Math.ceil(text.length / Math.max(1, estW / (fontSize * 0.55)));
      const el: TextElement = {
        id: uid(),
        type: "text",
        x: opts.centerX + jitterX,
        y: opts.centerY + offsetY,
        w: estW,
        h: Math.max(40, lines * fontSize * 1.3),
        rotation: jitterRot,
        z: z++,
        text,
        font: p.font ?? "handwritten",
        size: fontSize,
        color: p.color ?? opts.defaultColor,
        bold: p.bold,
        italic: p.italic,
        align: p.align ?? "center",
      };
      out.push(el);
    }
  });
  return out;
}

function walk(node: Node, out: Partial[]): void {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === "img") {
      const src = el.getAttribute("src");
      if (src && (src.startsWith("http") || src.startsWith("data:"))) {
        out.push({ type: "photo", src });
      }
      return;
    }

    if (tag === "script" || tag === "style" || tag === "noscript") return;

    // Block-level text containers — collect their plain text as a single element
    if (
      tag === "p" ||
      tag === "h1" ||
      tag === "h2" ||
      tag === "h3" ||
      tag === "h4" ||
      tag === "h5" ||
      tag === "h6" ||
      tag === "li" ||
      (tag === "div" && hasOnlyInlineChildren(el))
    ) {
      const text = (el.textContent || "").trim();
      if (text.length > 0 && !containsImage(el)) {
        const style = inlineStyleOf(el);
        const headingSize: Record<string, number> = { h1: 44, h2: 36, h3: 30, h4: 26, h5: 22, h6: 20 };
        out.push({
          type: "text",
          text,
          color: style.color,
          bold: style.bold || /^h[1-6]$/.test(tag),
          italic: style.italic,
          size: headingSize[tag] ?? style.size,
          align: style.align,
          font: style.font,
        });
        return;
      }
    }
  }

  // Recurse
  node.childNodes.forEach((child) => walk(child, out));
}

function hasOnlyInlineChildren(el: HTMLElement): boolean {
  for (const c of Array.from(el.children)) {
    const t = c.tagName.toLowerCase();
    if (["p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "table", "img"].includes(t))
      return false;
  }
  return true;
}

function containsImage(el: HTMLElement): boolean {
  return el.querySelector("img") !== null;
}

interface ParsedStyle {
  color?: string;
  bold?: boolean;
  italic?: boolean;
  size?: number;
  align?: TextElement["align"];
  font?: TextElement["font"];
}

function inlineStyleOf(el: HTMLElement): ParsedStyle {
  const out: ParsedStyle = {};
  const style = el.getAttribute("style") || "";
  const get = (prop: string): string | undefined => {
    const m = style.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, "i"));
    return m ? m[1].trim() : undefined;
  };

  const color = get("color");
  if (color) out.color = normaliseColor(color);

  const fw = get("font-weight");
  if (fw && (fw === "bold" || parseInt(fw, 10) >= 600)) out.bold = true;

  const fs = get("font-style");
  if (fs && fs.toLowerCase().includes("italic")) out.italic = true;

  const sz = get("font-size");
  if (sz) {
    const m = sz.match(/([\d.]+)\s*(px|pt|em|rem)?/);
    if (m) {
      let v = parseFloat(m[1]);
      const unit = (m[2] || "px").toLowerCase();
      if (unit === "pt") v = v * 1.333;
      else if (unit === "em" || unit === "rem") v = v * 16;
      out.size = Math.max(10, Math.min(96, Math.round(v)));
    }
  }

  const ta = get("text-align");
  if (ta === "left" || ta === "center" || ta === "right") out.align = ta;

  const ff = (get("font-family") || "").toLowerCase();
  if (ff) {
    if (/serif/.test(ff) && !/sans/.test(ff)) out.font = "serif";
    else if (/marker|impact|permanent/.test(ff)) out.font = "marker";
    else if (/cursive|hand|caveat|kalam|patrick|brush/.test(ff)) out.font = "handwritten";
    else out.font = "printed";
  }

  return out;
}

function normaliseColor(c: string): string {
  // Strip rgb()/rgba() — return hex; otherwise pass through
  const m = c.match(/rgba?\(([^)]+)\)/i);
  if (m) {
    const parts = m[1].split(",").map((p) => parseFloat(p.trim()));
    if (parts.length >= 3) {
      const [r, g, b] = parts;
      const hex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
      return `#${hex(r)}${hex(g)}${hex(b)}`;
    }
  }
  return c;
}

/** Fetch a remote image and convert to a data URL so it survives saving / export.
 *  Falls back to the original URL if CORS blocks the fetch. */
export async function fetchImageAsDataUrl(src: string): Promise<string> {
  if (src.startsWith("data:")) return src;
  try {
    const resp = await fetch(src, { mode: "cors" });
    if (!resp.ok) throw new Error("bad response");
    const blob = await resp.blob();
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch {
    return src;
  }
}

/** Read intrinsic dimensions of an image. */
export function loadImageDims(src: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 220, h: img.naturalHeight || 220 });
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}
