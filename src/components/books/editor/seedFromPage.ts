/** Convert a BookPage's native scrapbook content into editable EditorElements.
 *
 *  Goal: when the user clicks "Make elements editable", the resulting elements
 *  should appear EXACTLY where they were in the native design — same titles,
 *  same photos, same date / category badges, same story positions — so the
 *  page LOOKS THE SAME but is now fully editable.
 *
 *  The native scrapbook background (washi tapes, doodles, paper texture,
 *  pocket panels, sticky-note shapes) stays underneath by default. The user
 *  can toggle it off if they want a blank slate.
 *
 *  All coordinates are in design pixels on the 600×800 canvas. They mirror
 *  the absolute positions used in BookPages.tsx (1rem = 16px). Centers (x,y)
 *  here equal the rendered visual centers there. */

import { format } from "date-fns";
import type { BookPage } from "../BookPages";
import type { BookTemplateColors } from "@/hooks/useBookTemplates";
import {
  EDITOR_CANVAS_W,
  EDITOR_CANVAS_H,
  uid,
  type EditorElement,
} from "./types";

const REM = 16;

export function seedElementsFromPage(
  page: BookPage,
  colors: BookTemplateColors,
): EditorElement[] {
  const ink = colors.ink ?? colors.text ?? "#3E3E42";
  const cx = EDITOR_CANVAS_W / 2;
  let z = 1;
  const next = () => z++;

  const out: EditorElement[] = [];

  switch (page.kind) {
    /* ──────────────────────────────── COVER ──────────────────────────── */
    case "cover": {
      // Template-name sticker tab
      out.push({
        id: uid(),
        type: "badge",
        x: cx,
        y: 200,
        w: 180,
        h: 28,
        rotation: -3,
        z: next(),
        text: page.templateName,
        bg: colors.accent,
        ring: "#fff",
        color: ink,
      });
      // Bubble title
      out.push({
        id: uid(),
        type: "text",
        x: cx,
        y: 290,
        w: 460,
        h: 90,
        rotation: -2,
        z: next(),
        text: page.title || "Our Little Story",
        font: "handwritten",
        size: 56,
        color: "#fff",
        bg: colors.coral ?? "#E36363",
        bold: true,
        align: "center",
      });
      // tagline / subtitle
      if (page.subtitle) {
        out.push({
          id: uid(),
          type: "text",
          x: cx,
          y: 380,
          w: 420,
          h: 40,
          rotation: 0,
          z: next(),
          text: page.subtitle,
          font: "printed",
          size: 18,
          color: ink,
          italic: true,
          align: "center",
        });
      }
      // Child name (handwritten signature, lower)
      out.push({
        id: uid(),
        type: "text",
        x: cx,
        y: 600,
        w: 320,
        h: 80,
        rotation: -4,
        z: next(),
        text: page.childName,
        font: "handwritten",
        size: 40,
        color: ink,
        bg: colors.accent,
        bold: true,
        align: "center",
      });
      break;
    }

    /* ──────────────────────────────── INTRO ──────────────────────────── */
    case "intro": {
      out.push({
        id: uid(),
        type: "text",
        x: cx,
        y: 320,
        w: 480,
        h: 80,
        rotation: 0,
        z: next(),
        text: page.title,
        font: "handwritten",
        size: 48,
        color: ink,
        bold: true,
        align: "center",
      });
      if (page.dateRange) {
        out.push({
          id: uid(),
          type: "text",
          x: cx,
          y: 410,
          w: 360,
          h: 40,
          rotation: 0,
          z: next(),
          text: page.dateRange,
          font: "printed",
          size: 18,
          color: ink,
          align: "center",
        });
      }
      out.push({
        id: uid(),
        type: "text",
        x: cx,
        y: 530,
        w: 440,
        h: 90,
        rotation: 0,
        z: next(),
        text: `A keepsake of ${page.pageCount} ${page.pageCount === 1 ? "memory" : "memories"} — the small everyday moments that make a childhood.`,
        font: "printed",
        size: 16,
        color: ink,
        align: "center",
      });
      break;
    }

    /* ──────────────────────────────── CHAPTER ────────────────────────── */
    case "chapter": {
      out.push({
        id: uid(),
        type: "badge",
        x: cx,
        y: 280,
        w: 200,
        h: 44,
        rotation: -3,
        z: next(),
        text: `Chapter ${page.number}`,
        bg: colors.paper ?? colors.primary,
        ring: colors.gold ?? "#F2C94C",
        color: ink,
      });
      out.push({
        id: uid(),
        type: "text",
        x: cx,
        y: 400,
        w: 480,
        h: 100,
        rotation: -1,
        z: next(),
        text: page.title,
        font: "handwritten",
        size: 56,
        color: ink,
        bold: true,
        align: "center",
      });
      out.push({
        id: uid(),
        type: "text",
        x: cx,
        y: 520,
        w: 320,
        h: 36,
        rotation: 2,
        z: next(),
        text: page.subtitle,
        font: "printed",
        size: 16,
        color: ink,
        align: "center",
      });
      break;
    }

    /* ──────────────────────────────── MEMORY (per-layout) ────────────── */
    case "memory": {
      const m = page.memory;
      const dateLabel = format(new Date(m.happened_at), "MMM d, yyyy");
      const shortDate = format(new Date(m.happened_at), "MMM d");
      const monthLabel = format(new Date(m.happened_at), "MMMM").toUpperCase();

      switch (page.layout) {
        /* COLLAGE — title top, big photo left @ left-6 top-32, secondary photo right */
        case "collage": {
          // Bubble title — top center (~y 92 in design px, since top-12=48 + height/2)
          out.push({
            id: uid(),
            type: "text",
            x: cx,
            y: 100,
            w: 360,
            h: 64,
            rotation: -3,
            z: next(),
            text: m.title,
            font: "handwritten",
            size: 32,
            color: ink,
            bg: colors.gold ?? "#F2C94C",
            bold: true,
            align: "center",
          });
          // Big main photo — left-6 (24px) top-32 (128px), 13rem (208px) square
          if (m.photo_url) {
            out.push({
              id: uid(),
              type: "photo",
              x: 24 + 208 / 2,
              y: 128 + 208 / 2,
              w: 208,
              h: 208,
              rotation: -5,
              z: next(),
              src: m.photo_url,
              borderColor: "#fff",
            });
            // Secondary photo — right-6 top-44 (176px), 9rem × 11rem (144 × 176)
            out.push({
              id: uid(),
              type: "photo",
              x: EDITOR_CANVAS_W - 24 - 144 / 2,
              y: 176 + 176 / 2,
              w: 144,
              h: 176,
              rotation: 7,
              z: next(),
              src: m.photo_url,
              borderColor: colors.gold ?? "#F2C94C",
            });
          }
          // Category sticker — right-3 top-32
          if (m.category) {
            out.push({
              id: uid(),
              type: "badge",
              x: EDITOR_CANVAS_W - 60,
              y: 142,
              w: 110,
              h: 26,
              rotation: -12,
              z: next(),
              text: m.category,
              bg: colors.coral ?? "#E36363",
              ring: "#fff",
              color: "#fff",
            });
          }
          // Month sticker — left-44 (176px) top-28 (112px)
          out.push({
            id: uid(),
            type: "badge",
            x: 176 + 50,
            y: 124,
            w: 100,
            h: 24,
            rotation: 8,
            z: next(),
            text: monthLabel,
            bg: colors.mint ?? colors.accent,
            ring: "#fff",
            color: ink,
          });
          // Sticky-note story bottom-right (bottom-20 right-8)
          if (m.story) {
            out.push({
              id: uid(),
              type: "text",
              x: EDITOR_CANVAS_W - 32 - 110,
              y: EDITOR_CANVAS_H - 80 - 50,
              w: 220,
              h: 100,
              rotation: -4,
              z: next(),
              text: `"${m.story.slice(0, 90)}${m.story.length > 90 ? "…" : ""}"`,
              font: "handwritten",
              size: 15,
              color: ink,
              bg: colors.gold ?? "#F2C94C",
              align: "center",
            });
          }
          // Date ticket — bottom-10 left-8
          out.push({
            id: uid(),
            type: "badge",
            x: 32 + 90,
            y: EDITOR_CANVAS_H - 40 - 18,
            w: 180,
            h: 36,
            rotation: -3,
            z: next(),
            text: dateLabel,
            bg: colors.gold ?? "#F2C94C",
            ring: "#fff",
            color: ink,
          });
          break;
        }

        /* POLAROID-STACK — bubble title top, three polaroids overlapping centre */
        case "polaroid-stack": {
          out.push({
            id: uid(),
            type: "text",
            x: cx,
            y: 80,
            w: 360,
            h: 60,
            rotation: -2,
            z: next(),
            text: m.title,
            font: "handwritten",
            size: 30,
            color: "#fff",
            bg: colors.coral ?? "#E36363",
            bold: true,
            align: "center",
          });
          // Polaroid 1 — left -9°, width 11rem
          if (m.photo_url) {
            const polW = 176;
            const polH = 200;
            out.push({
              id: uid(),
              type: "photo",
              x: cx - 80,
              y: 240,
              w: polW,
              h: polH,
              rotation: -9,
              z: next(),
              src: m.photo_url,
              borderColor: "#fff",
            });
            out.push({
              id: uid(),
              type: "photo",
              x: cx,
              y: 250,
              w: polW,
              h: polH,
              rotation: 4,
              z: next(),
              src: m.photo_url,
              borderColor: "#fff",
            });
            out.push({
              id: uid(),
              type: "photo",
              x: cx + 90,
              y: 280,
              w: 160,
              h: 184,
              rotation: 11,
              z: next(),
              src: m.photo_url,
              borderColor: "#fff",
            });
          }
          // Story bottom
          if (m.story) {
            out.push({
              id: uid(),
              type: "text",
              x: cx,
              y: 580,
              w: 460,
              h: 80,
              rotation: 0,
              z: next(),
              text: `"${m.story.slice(0, 110)}${m.story.length > 110 ? "…" : ""}"`,
              font: "handwritten",
              size: 20,
              color: ink,
              align: "center",
            });
          }
          out.push({
            id: uid(),
            type: "badge",
            x: cx,
            y: 700,
            w: 200,
            h: 36,
            rotation: -2,
            z: next(),
            text: dateLabel,
            bg: colors.gold ?? "#F2C94C",
            ring: "#fff",
            color: ink,
          });
          break;
        }

        /* MAGAZINE — full-bleed photo top 58%, bubble title + story bottom 42% */
        case "magazine": {
          // Photo — 58% of 800 = 464, full width
          if (m.photo_url) {
            out.push({
              id: uid(),
              type: "photo",
              x: cx,
              y: 232,
              w: EDITOR_CANVAS_W,
              h: 464,
              rotation: 0,
              z: next(),
              src: m.photo_url,
              borderColor: colors.paper ?? colors.primary,
            });
          }
          // Month sticker — right-5 top-5 on photo
          out.push({
            id: uid(),
            type: "badge",
            x: EDITOR_CANVAS_W - 60,
            y: 30,
            w: 100,
            h: 28,
            rotation: 6,
            z: next(),
            text: monthLabel,
            bg: colors.gold ?? "#F2C94C",
            ring: "#fff",
            color: ink,
          });
          // Ticket overlapping photo bottom-left
          out.push({
            id: uid(),
            type: "badge",
            x: 24 + 80,
            y: 460,
            w: 160,
            h: 36,
            rotation: -3,
            z: next(),
            text: shortDate,
            bg: colors.gold ?? "#F2C94C",
            ring: "#fff",
            color: ink,
          });
          // Bubble title in lower band
          out.push({
            id: uid(),
            type: "text",
            x: cx,
            y: 540,
            w: 460,
            h: 66,
            rotation: -2,
            z: next(),
            text: m.title,
            font: "handwritten",
            size: 32,
            color: "#fff",
            bg: colors.coral ?? "#E36363",
            bold: true,
            align: "center",
          });
          if (m.story) {
            out.push({
              id: uid(),
              type: "text",
              x: cx,
              y: 650,
              w: 500,
              h: 110,
              rotation: 0,
              z: next(),
              text: m.story.slice(0, 220),
              font: "printed",
              size: 14,
              color: ink,
              align: "left",
            });
          }
          break;
        }

        /* JOURNAL — diary entry: dear-diary line, bubble title, polaroid right, story col */
        case "journal": {
          // "Dear diary" line, top-left after margin (left-14 = 56px)
          out.push({
            id: uid(),
            type: "text",
            x: 56 + 90,
            y: 60,
            w: 180,
            h: 28,
            rotation: 0,
            z: next(),
            text: "Dear diary —",
            font: "marker",
            size: 12,
            color: ink,
            align: "left",
          });
          // Date ticket top-right
          out.push({
            id: uid(),
            type: "badge",
            x: EDITOR_CANVAS_W - 110,
            y: 60,
            w: 180,
            h: 36,
            rotation: -3,
            z: next(),
            text: dateLabel,
            bg: colors.gold ?? "#F2C94C",
            ring: "#fff",
            color: ink,
          });
          // Bubble title
          out.push({
            id: uid(),
            type: "text",
            x: 56 + 200,
            y: 140,
            w: 380,
            h: 64,
            rotation: -1,
            z: next(),
            text: m.title,
            font: "handwritten",
            size: 32,
            color: ink,
            bg: colors.gold ?? "#F2C94C",
            bold: true,
            align: "center",
          });
          // Polaroid right top-32
          if (m.photo_url) {
            out.push({
              id: uid(),
              type: "photo",
              x: EDITOR_CANVAS_W - 24 - 72,
              y: 128 + 90,
              w: 144,
              h: 176,
              rotation: 6,
              z: next(),
              src: m.photo_url,
              borderColor: "#fff",
            });
          }
          // Handwritten story — left col
          out.push({
            id: uid(),
            type: "text",
            x: 56 + 150,
            y: 360,
            w: 320,
            h: 240,
            rotation: 0,
            z: next(),
            text: m.story
              ? `"${m.story.slice(0, 320)}${m.story.length > 320 ? "…" : ""}"`
              : `Today was ${m.title.toLowerCase()}. A little day worth keeping forever.`,
            font: "handwritten",
            size: 20,
            color: ink,
            align: "left",
          });
          break;
        }

        /* POCKET — bubble title, photo in pocket, sticky-note memo */
        default: {
          out.push({
            id: uid(),
            type: "text",
            x: cx,
            y: 80,
            w: 360,
            h: 60,
            rotation: -2,
            z: next(),
            text: m.title,
            font: "handwritten",
            size: 30,
            color: ink,
            bg: colors.mint ?? colors.accent,
            bold: true,
            align: "center",
          });
          if (m.photo_url) {
            out.push({
              id: uid(),
              type: "photo",
              x: cx,
              y: 280,
              w: 224,
              h: 224,
              rotation: -4,
              z: next(),
              src: m.photo_url,
              borderColor: "#fff",
            });
          }
          // pocket label ticket
          out.push({
            id: uid(),
            type: "badge",
            x: cx,
            y: 410,
            w: 160,
            h: 36,
            rotation: 3,
            z: next(),
            text: shortDate,
            bg: colors.gold ?? "#F2C94C",
            ring: "#fff",
            color: ink,
          });
          // sticky note story
          out.push({
            id: uid(),
            type: "text",
            x: cx,
            y: 560,
            w: 320,
            h: 110,
            rotation: -2,
            z: next(),
            text: m.story
              ? `"${m.story.slice(0, 130)}${m.story.length > 130 ? "…" : ""}"`
              : `A little ${m.category ?? "everyday"} memory.`,
            font: "handwritten",
            size: 18,
            color: "#fff",
            bg: colors.coral ?? "#E36363",
            align: "center",
          });
          break;
        }
      }
      break;
    }

    /* ─────────────────────── MEMORY-SPREAD (multi-memory) ─────────────── */
    case "memory-spread": {
      // Seed each memory in the spread as a photo + handwritten title pair, in
      // a simple 2×2 grid. Native scrapbook background stays underneath so the
      // visual fidelity is preserved; the user can drag/resize/edit freely.
      const cellsW = 260;
      const cellsH = 260;
      const padX = 30;
      const padY = 80;
      page.memories.slice(0, 4).forEach((m, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const px = padX + col * (cellsW + 20) + cellsW / 2;
        const py = padY + row * (cellsH + 20) + cellsH / 2;
        out.push({
          id: uid(),
          type: "photo",
          x: px,
          y: py,
          w: cellsW,
          h: cellsH - 50,
          rotation: i % 2 === 0 ? -2 : 2,
          z: next(),
          src: m.photo_url ?? "",
          frame: "polaroid",
          borderWidth: 8,
        });
        out.push({
          id: uid(),
          type: "text",
          x: px,
          y: py + (cellsH - 50) / 2 + 22,
          w: cellsW - 20,
          h: 36,
          rotation: 0,
          z: next(),
          text: `${format(new Date(m.happened_at), "MMM d")} · ${m.title}`,
          font: "handwritten",
          size: 16,
          color: ink,
          align: "center",
        });
      });
      break;
    }

    /* ──────────────────────────────── BACK ───────────────────────────── */
    case "back": {
      out.push({
        id: uid(),
        type: "text",
        x: cx,
        y: EDITOR_CANVAS_H / 2 - 40,
        w: 460,
        h: 100,
        rotation: -2,
        z: next(),
        text: `The end — for now ♥`,
        font: "handwritten",
        size: 48,
        color: ink,
        bold: true,
        align: "center",
      });
      out.push({
        id: uid(),
        type: "text",
        x: cx,
        y: EDITOR_CANVAS_H / 2 + 60,
        w: 360,
        h: 40,
        rotation: 0,
        z: next(),
        text: page.childName,
        font: "marker",
        size: 22,
        color: ink,
        align: "center",
      });
      break;
    }
  }

  return out.map((el) => {
    if (el.type === "text") {
      const isBubble = !!el.bg && (!!el.bold || el.size >= 28);
      return {
        ...el,
        source: "native" as const,
        radius: el.bg ? (isBubble ? 8 : 0) : el.radius,
        shadow: !!el.bg,
        ring: isBubble ? "#fff" : undefined,
        paddingX: el.bg ? (isBubble ? 16 : 12) : undefined,
        paddingY: el.bg ? (isBubble ? 6 : 10) : undefined,
      };
    }
    if (el.type === "badge") {
      const isTicket = /\d/.test(el.text) && !/^chapter/i.test(el.text);
      return {
        ...el,
        source: "native" as const,
        variant: isTicket ? "ticket" as const : "sticker" as const,
        label: isTicket ? "memory" : undefined,
        radius: isTicket ? 3 : 9999,
      };
    }
    if (el.type === "photo") {
      const fullBleed = el.w >= EDITOR_CANVAS_W - 1 || el.h >= EDITOR_CANVAS_H - 1;
      return {
        ...el,
        source: "native" as const,
        frame: fullBleed ? "plain" as const : "cutout" as const,
        borderWidth: fullBleed ? 0 : 5,
        shadow: !fullBleed,
        radius: fullBleed ? 0 : el.radius,
      };
    }
    return { ...el, source: "native" as const };
  });
}

// keep REM symbol used (for clarity / future tweaks)
void REM;
