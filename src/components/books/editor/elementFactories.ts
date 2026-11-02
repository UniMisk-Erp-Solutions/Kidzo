import { EDITOR_CANVAS_H, EDITOR_CANVAS_W, uid, type EditorElement } from "./types";

/** A free text box holding `text`, centred on the page. */
export function newTextBox(text: string, z: number, color: string): EditorElement {
  return {
    id: uid(),
    type: "text",
    x: EDITOR_CANVAS_W / 2,
    y: EDITOR_CANVAS_H / 2,
    w: 320,
    h: 90,
    rotation: 0,
    z,
    text,
    font: "handwritten",
    size: 28,
    color,
    align: "center",
  };
}

/** A library image (web sticker / scrapbook piece). `n` offsets each new one a little so they don't hide each other. */
export function newLibraryImage(src: string, w: number, h: number, z: number, n: number): EditorElement {
  return {
    id: uid(),
    type: "photo",
    x: EDITOR_CANVAS_W / 2 + n * 18,
    y: EDITOR_CANVAS_H / 2 + n * 18,
    w,
    h,
    rotation: 0,
    z,
    src,
    frame: "plain",
    borderWidth: 0,
    borderColor: "transparent",
    shadow: false,
  };
}

/** The book's text colour (templates may only define the legacy `text`). */
export const inkOf = (colors: { ink?: string; text?: string }) => colors.ink ?? colors.text ?? "#3E3E42";
