import { useLayoutEffect, useRef, type ReactNode } from "react";
import { uid, type EditorElement, type PhotoElement, type TextElement } from "./types";

/**
 * "Make photos & text movable": the page's own photos and text blocks are copied into editor elements, and
 * the originals are hidden in place (a photo becomes invisible, text turns transparent). Everything else the
 * page draws — frames, tape, torn paper, stickers, doodles, the camera — stays exactly where it is.
 * The originals are identified by their position in document order, so the same page always hides the same parts.
 */
export type NativeMoved = { imgs: number[]; texts: number[] };

const GENERIC_FONTS = new Set(["serif", "sans-serif", "cursive", "fantasy", "monospace", "system-ui", "inherit"]);

const rotationOf = (el: HTMLElement, root: HTMLElement) => {
  let deg = 0;
  for (let n: HTMLElement | null = el; n; n = n.parentElement) {
    const t = getComputedStyle(n).transform;
    if (t && t !== "none") {
      const m = new DOMMatrix(t);
      deg += (Math.atan2(m.b, m.a) * 180) / Math.PI;
    }
    if (n === root) break;
  }
  return Math.round(deg * 10) / 10;
};

const isLetterOfALargerWord = (el: HTMLElement) =>
  (el.textContent ?? "").trim().length <= 1 && (el.parentElement?.children.length ?? 0) >= 3;

const hasOwnText = (el: HTMLElement) =>
  Array.from(el.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim() !== "");

/** The page's photos and text blocks, in document order. */
export function collectNativeParts(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll("img")).filter((i) => i.offsetWidth >= 16 && i.offsetHeight >= 16);
  const texts: HTMLElement[] = [];
  root.querySelectorAll<HTMLElement>("*").forEach((el) => {
    if (el.tagName === "IMG" || el.closest("svg")) return;
    if (!hasOwnText(el) || el.offsetWidth === 0 || isLetterOfALargerWord(el)) return;
    if (texts.some((t) => t.contains(el))) return; // already part of a text block
    texts.push(el);
  });
  return { imgs, texts };
}

const hideText = (block: HTMLElement) => {
  [block, ...Array.from(block.querySelectorAll<HTMLElement>("*"))].forEach((n) => {
    n.style.setProperty("color", "transparent", "important");
    n.style.setProperty("-webkit-text-fill-color", "transparent", "important");
    n.style.setProperty("text-shadow", "none", "important");
  });
};

/** Hides the originals listed in `moved`. */
export function hideMovedParts(root: HTMLElement, moved?: NativeMoved) {
  if (!moved) return;
  const { imgs, texts } = collectNativeParts(root);
  moved.imgs.forEach((i) => imgs[i]?.style.setProperty("visibility", "hidden", "important"));
  moved.texts.forEach((i) => texts[i] && hideText(texts[i]));
}

/** Wraps a page's original design and hides the photos/text that were turned into movable elements. */
export const NativeHider = ({ moved, children }: { moved?: NativeMoved; children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (ref.current) hideMovedParts(ref.current, moved);
  });
  return (
    <div ref={ref} className="contents">
      {children}
    </div>
  );
};

const placeOf = (el: HTMLElement, root: HTMLElement, frame: DOMRect, scale: number) => {
  const r = el.getBoundingClientRect();
  return {
    x: (r.left + r.width / 2 - frame.left) / scale,
    y: (r.top + r.height / 2 - frame.top) / scale,
    rotation: rotationOf(el, root),
  };
};

const photoFrom = (img: HTMLImageElement, place: ReturnType<typeof placeOf>, z: number): PhotoElement => ({
  id: uid(),
  type: "photo",
  src: img.currentSrc || img.src,
  ...place,
  w: img.offsetWidth,
  h: img.offsetHeight,
  z,
  frame: "plain",
  borderWidth: 0,
  borderColor: "transparent",
  shadow: false,
  source: "native",
});

const textFrom = (el: HTMLElement, place: ReturnType<typeof placeOf>, z: number): TextElement => {
  const cs = getComputedStyle(el);
  const family = cs.fontFamily.split(",")[0]?.replace(/["']/g, "").trim();
  const raw = el.innerText || el.textContent || "";
  return {
    id: uid(),
    type: "text",
    text: cs.textTransform === "uppercase" ? raw.toUpperCase() : raw,
    font: "printed",
    fontFamily: family && !GENERIC_FONTS.has(family.toLowerCase()) ? family : undefined,
    size: parseFloat(cs.fontSize) || 16,
    color: cs.color,
    bold: parseInt(cs.fontWeight, 10) >= 600,
    italic: cs.fontStyle === "italic",
    align: cs.textAlign === "center" ? "center" : cs.textAlign === "right" ? "right" : "left",
    paddingX: 0,
    paddingY: 0,
    ...place,
    w: el.offsetWidth + 8,
    h: el.offsetHeight,
    z,
    source: "native",
  };
};

/**
 * Reads the page as it is drawn and returns one editor element per photo / text block at the same spot,
 * plus which originals they replace. `root` is the original design at its natural 600×800 size.
 */
export function extractNativeParts(root: HTMLElement): { elements: EditorElement[]; moved: NativeMoved } {
  const frame = root.getBoundingClientRect();
  const scale = frame.width / (root.offsetWidth || frame.width) || 1;
  const { imgs, texts } = collectNativeParts(root);
  const elements: EditorElement[] = [
    ...imgs.map((img, i) => photoFrom(img, placeOf(img, root, frame, scale), i + 1)),
    ...texts.map((el, i) => textFrom(el, placeOf(el, root, frame, scale), imgs.length + i + 1)),
  ];
  return { elements, moved: { imgs: imgs.map((_, i) => i), texts: texts.map((_, i) => i) } };
}
