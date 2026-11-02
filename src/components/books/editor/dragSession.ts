import type { EditorElement } from "./types";

export type Point = { x: number; y: number };

export type GuideLine = { axis: "v" | "h"; pos: number };

export type DesignBox = { x: number; y: number; w: number; h: number };

/** What the pointer is currently doing on the canvas (null = nothing). */
export type DragSession =
  | null
  | {
      kind: "move";
      ids: string[];
      startClient: Point;
      startEls: Record<string, EditorElement>;
      startBox: DesignBox;
    }
  | {
      kind: "resize";
      id: string;
      startClient: Point;
      startEl: EditorElement;
    }
  | {
      kind: "rotate";
      id: string;
      startEl: EditorElement;
    }
  | {
      kind: "group-resize";
      ids: string[];
      startEls: Record<string, EditorElement>;
      startW: number;
      startH: number;
      anchor: Point;
      startBox: DesignBox;
    }
  | {
      kind: "group-rotate";
      ids: string[];
      startEls: Record<string, EditorElement>;
      center: Point;
      startAngle: number;
    }
  | {
      kind: "marquee";
      startClient: Point;
      startDesign: Point;
      additive: boolean;
      previousIds: string[];
    }
  | {
      kind: "pan";
      startClient: Point;
      startPan: Point;
    };

export type Drag = NonNullable<DragSession>;
