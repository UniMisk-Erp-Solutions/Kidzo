/** Editor element model — elements are positioned on the 600×800 design canvas. */

import { BOOK_PAGE_H, BOOK_PAGE_W } from "../BookPages";

export const EDITOR_CANVAS_W = BOOK_PAGE_W;
export const EDITOR_CANVAS_H = BOOK_PAGE_H;

export type ElementBase = {
  id: string;
  /** center-x in design pixels */
  x: number;
  /** center-y in design pixels */
  y: number;
  w: number;
  h: number;
  /** degrees */
  rotation: number;
  z: number;
  /** if true, element cannot be selected/dragged */
  locked?: boolean;
  /** if true, element is not rendered */
  hidden?: boolean;
  /** corner radius in design pixels for rectangular elements */
  radius?: number;
  /** generated from the book template's original editable content */
  source?: "native" | "custom";
};

export type TextElement = ElementBase & {
  type: "text";
  text: string;
  font: "handwritten" | "marker" | "printed" | "serif";
  size: number;
  color: string;
  bg?: string;
  bold?: boolean;
  italic?: boolean;
  align?: "left" | "center" | "right";
  ring?: string;
  shadow?: boolean;
  paddingX?: number;
  paddingY?: number;
};

export type StickerShape =
  | "star"
  | "heart"
  | "sparkle"
  | "flower"
  | "sun"
  | "cloud"
  | "swirl"
  | "arrow"
  | "moon"
  | "balloon"
  | "cake"
  | "gift"
  | "smiley"
  | "lightning"
  | "leaf"
  | "music"
  | "rainbow"
  | "checkmark"
  | "pin"
  | "ribbon"
  | "circle"
  | "square"
  | "triangle"
  | "diamond"
  | "speech"
  | "thoughtbubble"
  | "crown"
  | "rocket"
  | "butterfly"
  | "rose"
  | "tree"
  | "umbrella"
  | "snowflake"
  | "fire"
  | "drop"
  | "eye"
  | "hand"
  | "thumbsup"
  | "peace"
  | "diamondring"
  | "gem"
  | "trophy"
  | "medal"
  | "ticket"
  | "key"
  | "lock"
  | "bell"
  | "camera"
  | "paperplane"
  | "compass";

export type StickerElement = ElementBase & {
  type: "sticker";
  shape: StickerShape;
  color: string;
  filled?: boolean;
};

export type TapeElement = ElementBase & {
  type: "tape";
  color: string;
  pattern: "stripes" | "dots" | "checks" | "solid";
};

export type PhotoElement = ElementBase & {
  type: "photo";
  src: string;
  borderColor?: string;
  borderWidth?: number;
  shadow?: boolean;
  frame?: "cutout" | "polaroid" | "plain";
  caption?: string;
  /** Source-image crop region (0..1, normalized). Defaults to full image. */
  cropX?: number;
  cropY?: number;
  cropW?: number;
  cropH?: number;
};

export type BadgeElement = ElementBase & {
  type: "badge";
  text: string;
  bg: string;
  ring: string;
  color: string;
  variant?: "sticker" | "ticket";
  label?: string;
};

/** Pure emoji sticker — easy access to a huge library. */
export type EmojiElement = ElementBase & {
  type: "emoji";
  emoji: string;
};

export type EditorElement =
  | TextElement
  | StickerElement
  | TapeElement
  | PhotoElement
  | BadgeElement
  | EmojiElement;

/** Per-page custom overlay store keyed by stable page key.
 *  Stored as either:
 *   - legacy: EditorElement[]
 *   - new: { elements, hideNative? }
 */
export type CustomPageData = {
  elements: EditorElement[];
  hideNative?: boolean;
  nativeEditable?: boolean;
};

export type CustomPagesMap = Record<string, EditorElement[] | CustomPageData>;

/** Helpers to read/write the new shape while staying back-compatible. */
export function readPageData(raw: EditorElement[] | CustomPageData | undefined): CustomPageData {
  if (!raw) return { elements: [], hideNative: false };
  if (Array.isArray(raw)) return { elements: raw, hideNative: false };
  return { elements: raw.elements ?? [], hideNative: !!raw.hideNative, nativeEditable: !!raw.nativeEditable };
}

/** Build a stable key for a BookPage so edits persist across reloads. */
export function pageKeyFor(page: { kind: string; memory?: { id: string }; number?: number; spreadKey?: string }): string {
  if (page.kind === "memory" && page.memory) return `memory-${page.memory.id}`;
  if (page.kind === "memory-spread" && page.spreadKey) return `spread-${page.spreadKey}`;
  if (page.kind === "chapter" && typeof page.number === "number") return `chapter-${page.number}`;
  return page.kind;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
