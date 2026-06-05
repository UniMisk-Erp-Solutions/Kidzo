import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import type { Memory } from "@/hooks/useMemories";
import type { BookTemplate, BookTemplateColors } from "@/hooks/useBookTemplates";
import { ElementsOverlay } from "./editor/EditorElements";
import type { EditorElement } from "./editor/types";

/** Fixed canvas size every book page is designed against. Used for both
 *  on-screen preview (scaled with CSS transform to fit any container)
 *  and PDF export (rendered at this exact size into html2canvas). */
export const BOOK_PAGE_W = 600;
export const BOOK_PAGE_H = 800;

/**
 * Scrapbook-style book pages — true collage energy.
 *
 * Pages are intentionally chaotic & layered: cutout polaroids tilted at angles,
 * stacks of magazine clippings, washi tape strips, ticket stubs, sticky notes,
 * hand-drawn doodles & bubble-outline marker titles.
 *
 * Five memory layouts (collage / polaroid-stack / magazine / journal / pocket),
 * plus template-flavored cover, intro, chapter and back pages.
 */

export type ScrapbookFlavor = "timeline" | "first-year" | "birthday" | "holiday" | "everyday" | "mosaic" | "collage-zine" | "pocket-album";

export type MemoryLayout = "collage" | "polaroid-stack" | "magazine" | "journal" | "pocket";

/** Dense layouts that pack multiple memories on a single page. */
export type MemorySpreadLayout = "grid-collage" | "polaroid-mosaic" | "magazine-mosaic";

export type BookPage =
  | { kind: "cover"; title: string; subtitle?: string | null; childName: string; templateName: string; flavor: ScrapbookFlavor }
  | { kind: "intro"; title: string; childName: string; dateRange: string; pageCount: number; flavor: ScrapbookFlavor }
  | { kind: "chapter"; title: string; subtitle: string; number: number; flavor: ScrapbookFlavor }
  | { kind: "memory"; memory: Memory; index: number; total: number; layout: MemoryLayout; flavor: ScrapbookFlavor }
  | { kind: "memory-spread"; memories: Memory[]; index: number; total: number; layout: MemorySpreadLayout; flavor: ScrapbookFlavor; spreadKey: string }
  | { kind: "back"; childName: string; flavor: ScrapbookFlavor };

function flavorFromTemplate(t: BookTemplate): ScrapbookFlavor {
  if (t.slug?.includes("first-year")) return "first-year";
  if (t.slug?.includes("birthday")) return "birthday";
  if (t.slug?.includes("holiday")) return "holiday";
  if (t.slug?.includes("collage-zine")) return "collage-zine";
  if (t.slug?.includes("pocket-album")) return "pocket-album";
  if (t.slug?.includes("mosaic")) return "mosaic";
  if (t.slug?.includes("everyday")) return "everyday";
  return "timeline";
}

/**
 * Dense templates pack N memories per page using a rotating spread layout.
 * Returns null for templates that should keep one-memory-per-page.
 */
function densePackFor(flavor: ScrapbookFlavor): { perPage: number; layouts: MemorySpreadLayout[] } | null {
  switch (flavor) {
    case "mosaic":        return { perPage: 4, layouts: ["grid-collage", "polaroid-mosaic", "magazine-mosaic"] };
    case "collage-zine":  return { perPage: 3, layouts: ["magazine-mosaic", "grid-collage"] };
    case "pocket-album":  return { perPage: 4, layouts: ["polaroid-mosaic"] };
    default: return null;
  }
}


function chapterTitleFor(year: number, childDob?: string, flavor: ScrapbookFlavor = "timeline"): string {
  if (flavor === "first-year" && childDob) {
    const dob = new Date(childDob);
    const months = (year - dob.getFullYear()) * 12;
    if (months <= 0) return `The Beginning · ${year}`;
    return `Month ${months} · ${year}`;
  }
  if (flavor === "birthday" && childDob) {
    const dob = new Date(childDob);
    const age = year - dob.getFullYear();
    if (age <= 0) return `Year One · ${year}`;
    return `Turning ${age} · ${year}`;
  }
  if (!childDob) return `${year}`;
  const dob = new Date(childDob);
  const ageStart = year - dob.getFullYear();
  if (ageStart <= 0) return `Year One · ${year}`;
  if (ageStart === 1) return `Toddler Days · ${year}`;
  if (ageStart <= 4) return `Little Years · ${year}`;
  if (ageStart <= 7) return `Big Kid Days · ${year}`;
  return `Growing Up · ${year}`;
}

const LAYOUT_CYCLE: MemoryLayout[] = ["collage", "polaroid-stack", "magazine", "journal", "pocket"];

export function buildPages(opts: {
  title: string;
  subtitle?: string | null;
  childName: string;
  template: BookTemplate;
  memories: Memory[];
  childDob?: string;
}): BookPage[] {
  const { title, subtitle, childName, template, memories, childDob } = opts;
  const flavor = flavorFromTemplate(template);

  const sorted = [...memories].sort(
    (a, b) => new Date(a.happened_at).getTime() - new Date(b.happened_at).getTime(),
  );
  const dates = sorted.map((m) => new Date(m.happened_at));
  const range =
    dates.length > 0
      ? `${format(dates[0], "MMM yyyy")} – ${format(dates[dates.length - 1], "MMM yyyy")}`
      : "";

  const byYear = new Map<number, Memory[]>();
  sorted.forEach((m) => {
    const y = new Date(m.happened_at).getFullYear();
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y)!.push(m);
  });

  const pages: BookPage[] = [
    { kind: "cover", title, subtitle, childName, templateName: template.name, flavor },
    { kind: "intro", title, childName, dateRange: range, pageCount: memories.length, flavor },
  ];

  let memoryIndex = 0;
  let chapterNum = 0;
  let spreadCount = 0;
  const totalMemories = sorted.length;
  const dense = densePackFor(flavor);
  // total spreads (for index/total display) when in dense mode
  const totalSpreads = dense
    ? Array.from(byYear.values()).reduce(
        (acc, items) => acc + Math.ceil(items.length / dense.perPage),
        0,
      )
    : 0;

  Array.from(byYear.keys())
    .sort((a, b) => a - b)
    .forEach((year) => {
      const items = byYear.get(year)!;
      chapterNum += 1;
      pages.push({
        kind: "chapter",
        title: chapterTitleFor(year, childDob, flavor),
        subtitle: `${items.length} ${items.length === 1 ? "memory" : "memories"}`,
        number: chapterNum,
        flavor,
      });

      if (dense) {
        // Group memories into chunks of dense.perPage and emit a single page per chunk.
        for (let i = 0; i < items.length; i += dense.perPage) {
          const chunk = items.slice(i, i + dense.perPage);
          spreadCount += 1;
          pages.push({
            kind: "memory-spread",
            memories: chunk,
            index: spreadCount,
            total: totalSpreads,
            layout: dense.layouts[(spreadCount - 1) % dense.layouts.length],
            flavor,
            spreadKey: `y${year}-s${i}`,
          });
        }
      } else {
        items.forEach((memory) => {
          pages.push({
            kind: "memory",
            memory,
            index: ++memoryIndex,
            total: totalMemories,
            layout: LAYOUT_CYCLE[(memoryIndex - 1) % LAYOUT_CYCLE.length],
            flavor,
          });
        });
      }
    });

  pages.push({ kind: "back", childName, flavor });
  return pages;
}

/* ─────────────────────────────────────────── Decorative atoms ───────── */

const WashiTape = ({
  color,
  className = "",
  rotation = -4,
  width = "7rem",
  pattern = "stripes",
}: {
  color: string;
  className?: string;
  rotation?: number;
  width?: string;
  pattern?: "stripes" | "dots" | "solid" | "checks";
}) => {
  let backgroundImage = "";
  if (pattern === "stripes") {
    backgroundImage = "repeating-linear-gradient(45deg, transparent 0 6px, rgba(255,255,255,0.32) 6px 8px)";
  } else if (pattern === "dots") {
    backgroundImage = "radial-gradient(circle, rgba(255,255,255,0.55) 1.5px, transparent 2px)";
  } else if (pattern === "checks") {
    backgroundImage =
      "linear-gradient(45deg, rgba(255,255,255,0.4) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.4) 25%, transparent 25%)";
  }
  return (
    <span
      className={`absolute h-6 ${className}`}
      style={{
        width,
        backgroundColor: color,
        transform: `rotate(${rotation}deg)`,
        opacity: 0.92,
        backgroundImage,
        backgroundSize: pattern === "dots" ? "8px 8px" : pattern === "checks" ? "10px 10px" : undefined,
        boxShadow: "0 2px 4px rgba(0,0,0,0.12), inset 0 0 0 0.5px rgba(0,0,0,0.04)",
      }}
      aria-hidden
    />
  );
};

const Doodle = ({
  d,
  color,
  className = "",
  size = 28,
  filled = false,
  fillColor,
}: {
  d: string;
  color: string;
  className?: string;
  size?: number;
  filled?: boolean;
  fillColor?: string;
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`absolute ${className}`}
    fill={filled ? (fillColor ?? color) : "none"}
    stroke={color}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d={d} />
  </svg>
);

const STAR = "M12 3l2.4 5.6 6 .5-4.6 4 1.4 5.9-5.2-3.2-5.2 3.2 1.4-5.9-4.6-4 6-.5z";
const HEART = "M12 21s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.7-7 10-7 10z";
const SWIRL = "M4 12c2-6 14-6 16 0s-14 6-12 0";
const SPARKLE = "M12 4v4M12 16v4M4 12h4M16 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6";
const ARROW = "M3 12c5-6 12-6 18 0M16 8l5 4-5 4";
const FLOWER = "M12 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M5 19l4-4M15 9l4-4";
const SUN = "M12 4v3M12 17v3M4 12h3M17 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z";
const CLOUD = "M6 16a4 4 0 1 1 .8-7.9A5 5 0 0 1 17 8a4 4 0 0 1 0 8z";

/** A small floating sticker badge with a chunky outline — like punched-out cardstock. */
const Sticker = ({
  children,
  bg,
  ring,
  ink,
  rotate = 0,
  className = "",
  size = "md",
}: {
  children: React.ReactNode;
  bg: string;
  ring: string;
  ink: string;
  rotate?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}) => {
  const px = size === "sm" ? "px-2 py-0.5 text-[10px]" : size === "lg" ? "px-3.5 py-1.5 text-[14px]" : "px-2.5 py-1 text-[11px]";
  return (
    <span
      className={`cutout-shadow inline-block rounded-full font-marker font-bold uppercase tracking-wider ${px} ${className}`}
      style={{
        backgroundColor: bg,
        color: ink,
        boxShadow: `inset 0 0 0 2px ${ring}, 0 2px 4px rgba(0,0,0,0.18)`,
        transform: `rotate(${rotate}deg)`,
      }}
    >
      {children}
    </span>
  );
};

/** A photo styled as a paper cutout — white deckle border, drop shadow, rotation. */
const CutoutPhoto = ({
  src,
  rotate = 0,
  width,
  height,
  borderColor = "#fff",
  className = "",
  fallbackBg,
  fallbackInk,
  fallbackLabel = "no photo",
}: {
  src?: string | null;
  rotate?: number;
  width: string;
  height: string;
  borderColor?: string;
  className?: string;
  fallbackBg?: string;
  fallbackInk?: string;
  fallbackLabel?: string;
}) => (
  <div
    className={`cutout-shadow overflow-hidden ${className}`}
    style={{
      width,
      height,
      backgroundColor: borderColor,
      padding: 5,
      transform: `rotate(${rotate}deg)`,
    }}
  >
    {src ? (
      <img src={src} alt="" crossOrigin="anonymous" className="h-full w-full object-cover" />
    ) : (
      <div
        className="flex h-full w-full items-center justify-center font-printed text-[12px] uppercase tracking-wider"
        style={{ backgroundColor: fallbackBg ?? "#eee", color: fallbackInk ?? "#666" }}
      >
        {fallbackLabel}
      </div>
    )}
  </div>
);

const Polaroid = ({
  src,
  caption,
  date,
  rotation,
  colors,
  width = "12rem",
  className = "",
}: {
  src?: string | null;
  caption?: string;
  date?: string;
  rotation: number;
  colors: BookTemplateColors;
  width?: string;
  className?: string;
}) => {
  const ink = colors.ink ?? colors.text ?? "#3E3E42";
  return (
    <div
      className={`cutout-shadow relative bg-white p-2 pb-9 ${className}`}
      style={{ width, transform: `rotate(${rotation}deg)` }}
    >
      <div className="aspect-square w-full overflow-hidden bg-muted">
        {src ? (
          <img src={src} alt="" crossOrigin="anonymous" className="h-full w-full object-cover" />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center font-printed text-[11px] uppercase tracking-wider"
            style={{ backgroundColor: colors.accent, color: ink }}
          >
            no photo
          </div>
        )}
      </div>
      <div
        className="absolute bottom-1.5 left-2 right-2 truncate text-center font-handwritten text-[15px]"
        style={{ color: ink }}
      >
        {caption || date || ""}
      </div>
    </div>
  );
};

const TicketStub = ({
  date,
  label,
  colors,
  rotate = 0,
}: {
  date: string;
  label?: string;
  colors: BookTemplateColors;
  rotate?: number;
}) => {
  const ink = colors.ink ?? colors.text ?? "#3E3E42";
  return (
    <div
      className="cutout-shadow relative inline-flex items-center gap-3 px-4 py-2 text-left"
      style={{
        backgroundColor: colors.gold,
        color: ink,
        borderRadius: "3px",
        transform: `rotate(${rotate}deg)`,
      }}
    >
      <span
        className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full"
        style={{ backgroundColor: "currentColor", opacity: 0.18 }}
      />
      <span
        className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full"
        style={{ backgroundColor: "currentColor", opacity: 0.18 }}
      />
      <div className="flex flex-col leading-tight">
        <span className="font-marker text-[9px] uppercase tracking-[0.25em] opacity-70">{label ?? "Admit one"}</span>
        <span className="font-handwritten text-[18px] font-bold">{date}</span>
      </div>
    </div>
  );
};

const StickyNote = ({
  text,
  rotation,
  color,
  ink,
  maxWidth = "220px",
}: {
  text: string;
  rotation: number;
  color: string;
  ink: string;
  maxWidth?: string;
}) => (
  <div
    className="cutout-shadow px-3 py-2.5 text-left font-handwritten text-[15px] leading-snug"
    style={{
      backgroundColor: color,
      color: ink,
      transform: `rotate(${rotation}deg)`,
      maxWidth,
    }}
  >
    {text}
  </div>
);

/** Big bubble-outline title, like the magazine-cutout headlines in the references. */
const BubbleTitle = ({
  text,
  bg,
  ink,
  rotate = 0,
  className = "",
}: {
  text: string;
  bg: string;
  ink: string;
  rotate?: number;
  className?: string;
}) => (
  <span
    className={`cutout-shadow inline-block px-4 py-1.5 font-handwritten text-[34px] font-bold leading-none md:text-[44px] ${className}`}
    style={{
      backgroundColor: bg,
      color: ink,
      transform: `rotate(${rotate}deg)`,
      letterSpacing: "0.02em",
      borderRadius: "8px",
      boxShadow: `inset 0 0 0 3px #fff, 0 4px 10px rgba(0,0,0,0.18)`,
    }}
  >
    {text}
  </span>
);

/* ─────────────────────────────────────────── Page renderers ─────────── */

interface PageProps {
  page: BookPage;
  colors: BookTemplateColors;
}

const COVER_TAGLINE: Record<ScrapbookFlavor, string> = {
  "timeline": "A scrapbook of the year",
  "first-year": "Baby's first chapter",
  "birthday": "Year by year, candle by candle",
  "holiday": "Cozy days & holiday glow",
  "everyday": "The little, lovely days",
  "mosaic": "Many memories, one mosaic",
  "collage-zine": "A zine of small wonders",
  "pocket-album": "Polaroids in every pocket",
};

/** Pick a paper texture class based on flavor — gives each template a personality. */
function paperTextureFor(flavor: ScrapbookFlavor): string {
  switch (flavor) {
    case "first-year": return "paper-dots";
    case "birthday": return "paper-grain";
    case "holiday": return "paper-gingham";
    case "everyday": return "paper-ruled";
    default: return "paper-grain";
  }
}

export const BookPageView = ({ page, colors }: PageProps) => {
  const ink = colors.ink ?? colors.text ?? "#3E3E42";
  const paper = colors.paper ?? colors.primary;
  const mint = colors.mint ?? colors.accent;
  const tex = paperTextureFor(page.kind === "memory" ? page.flavor : (page as { flavor?: ScrapbookFlavor }).flavor ?? "timeline");

  switch (page.kind) {
    /* ──────────────────────────────── COVER ──────────────────────────── */
    case "cover":
      return (
        <div
          className={`paper-crinkle relative flex h-full w-full flex-col items-center justify-center overflow-hidden p-8 text-center ${tex}`}
          style={{ backgroundColor: paper, color: ink }}
        >
          {/* layered tape strips */}
          <WashiTape color={colors.accent} className="-top-2 left-4" rotation={-14} width="9rem" />
          <WashiTape color={colors.coral} className="-top-3 left-32" rotation={6} width="6rem" pattern="dots" />
          <WashiTape color={colors.gold} className="-top-2 right-4" rotation={12} width="8rem" pattern="checks" />

          {/* corner stickers */}
          <Doodle d={STAR} color={colors.gold} className="top-16 left-8" size={34} filled fillColor={colors.gold} />
          <Doodle d={HEART} color={colors.coral} className="top-24 right-12" size={30} filled fillColor={colors.coral} />
          <Doodle d={SUN} color={colors.gold} className="bottom-32 right-8" size={36} />
          <Doodle d={FLOWER} color={mint} className="bottom-20 left-10" size={32} />
          <Doodle d={SWIRL} color={colors.coral} className="bottom-12 right-1/3" size={32} />

          {/* dashed "scrapbook frame" */}
          <div
            className="absolute inset-6 rounded-[24px] border-[3px] border-dashed pointer-events-none"
            style={{ borderColor: colors.accent, opacity: 0.55 }}
          />

          {/* template-name sticker tab */}
          <div className="mt-2">
            <Sticker bg={colors.accent} ring="#fff" ink={ink} rotate={-3} size="sm">
              {page.templateName}
            </Sticker>
          </div>

          {/* Bubble-outline title */}
          <div className="mt-5 max-w-md">
            <BubbleTitle
              text={page.title || "Our Little Story"}
              bg={colors.coral}
              ink="#fff"
              rotate={-2}
            />
          </div>

          {/* Subtitle */}
          <p
            className="mt-6 max-w-sm font-printed text-[16px] italic md:text-[18px]"
            style={{ color: ink, opacity: 0.78 }}
          >
            {page.subtitle || COVER_TAGLINE[page.flavor]}
          </p>

          {/* Polaroid name plate stack */}
          <div className="relative mt-10 h-32 w-64">
            <div className="absolute inset-x-0 top-0 flex justify-center">
              <div
                className="cutout-shadow inline-block bg-white p-2 pb-7"
                style={{ transform: "rotate(-4deg)" }}
              >
                <div
                  className="flex h-16 w-48 items-center justify-center px-3"
                  style={{ backgroundColor: colors.accent }}
                >
                  <span className="font-handwritten text-[28px] font-bold" style={{ color: ink }}>
                    {page.childName}
                  </span>
                </div>
              </div>
            </div>
            <div className="absolute right-2 -top-2">
              <Sticker bg={colors.gold} ring="#fff" ink={ink} rotate={12} size="sm">
                ♥ ours
              </Sticker>
            </div>
          </div>
        </div>
      );

    /* ──────────────────────────────── INTRO ──────────────────────────── */
    case "intro":
      return (
        <div
          className={`paper-crinkle relative flex h-full w-full flex-col items-center justify-center p-12 text-center ${tex}`}
          style={{ backgroundColor: paper, color: ink }}
        >
          <WashiTape color={mint} className="top-6 left-1/2 -translate-x-1/2" rotation={3} pattern="dots" />
          <Doodle d={STAR} color={colors.gold} className="top-12 right-12" size={24} filled fillColor={colors.gold} />
          <Doodle d={HEART} color={colors.coral} className="bottom-12 left-12" size={24} filled fillColor={colors.coral} />
          <Doodle d={SPARKLE} color={mint} className="top-1/3 left-10" size={20} />
          <Doodle d={SPARKLE} color={colors.coral} className="bottom-1/3 right-12" size={20} />

          <div className="mt-2">
            <Sticker bg={colors.accent} ring="#fff" ink={ink} rotate={-2}>
              For {page.childName} ✿ with love
            </Sticker>
          </div>

          <h2
            className="mt-6 font-handwritten text-[40px] font-bold leading-tight md:text-[48px]"
            style={{ color: ink }}
          >
            {page.title}
          </h2>

          {page.dateRange && (
            <div className="mt-5">
              <TicketStub date={page.dateRange} label="Our story" colors={colors} rotate={-2} />
            </div>
          )}

          <div className="mt-10 max-w-sm font-printed text-[15px] leading-relaxed" style={{ color: ink, opacity: 0.78 }}>
            A keepsake of <span className="font-bold">{page.pageCount}</span>{" "}
            {page.pageCount === 1 ? "memory" : "memories"} — the small everyday
            moments that make a childhood.
          </div>

          <div className="mt-10 flex items-center gap-2">
            <span className="h-px w-12" style={{ backgroundColor: colors.accent }} />
            <span className="font-marker text-[10px] uppercase tracking-[0.3em]" style={{ color: colors.accent }}>
              made with love
            </span>
            <span className="h-px w-12" style={{ backgroundColor: colors.accent }} />
          </div>
        </div>
      );

    /* ──────────────────────────────── CHAPTER ────────────────────────── */
    case "chapter":
      return (
        <div
          className={`paper-crinkle relative flex h-full w-full flex-col items-center justify-center p-12 text-center ${tex}`}
          style={{ backgroundColor: colors.accent, color: ink }}
        >
          <WashiTape color={colors.gold} className="-top-2 left-8" rotation={-9} width="8rem" />
          <WashiTape color={colors.coral} className="-top-2 right-8" rotation={7} width="9rem" pattern="checks" />
          <Doodle d={SPARKLE} color={ink} className="top-16 left-16" size={28} />
          <Doodle d={STAR} color={colors.gold} className="bottom-24 right-16" size={32} filled fillColor={colors.gold} />
          <Doodle d={HEART} color={colors.coral} className="bottom-32 left-12" size={26} filled fillColor={colors.coral} />
          <Doodle d={CLOUD} color={ink} className="top-24 right-20" size={32} />
          <Doodle d={ARROW} color={ink} className="bottom-12 left-1/2 -translate-x-1/2" size={48} />

          <Sticker bg={paper} ring={colors.gold} ink={ink} rotate={-3}>
            Chapter {page.number}
          </Sticker>

          <div className="mt-6 max-w-md">
            <BubbleTitle text={page.title} bg={paper} ink={ink} rotate={-1} />
          </div>

          <div className="mt-7">
            <TicketStub date={page.subtitle} label="Inside" colors={colors} rotate={2} />
          </div>
        </div>
      );

    /* ──────────────────────────────── MEMORY ─────────────────────────── */
    case "memory": {
      const m = page.memory;
      const dateLabel = format(new Date(m.happened_at), "MMM d, yyyy");
      const shortDate = format(new Date(m.happened_at), "MMM d");
      const monthLabel = format(new Date(m.happened_at), "MMMM").toUpperCase();

      const PageNum = (
        <div
          className="absolute bottom-4 right-5 font-marker text-[10px] uppercase tracking-widest"
          style={{ color: ink, opacity: 0.4 }}
        >
          {page.index} / {page.total}
        </div>
      );

      /* ─── Layout 1: COLLAGE — chaotic, layered, magazine-cutout energy ─── */
      if (page.layout === "collage") {
        return (
          <div
            className={`paper-crinkle relative h-full w-full overflow-hidden p-6 ${tex}`}
            style={{ backgroundColor: paper, color: ink }}
          >
            {/* tapes */}
            <WashiTape color={colors.accent} className="-top-2 left-10" rotation={-12} width="8rem" />
            <WashiTape color={colors.coral} className="-top-3 right-12" rotation={10} width="7rem" pattern="dots" />
            <WashiTape color={mint} className="-top-2 right-44" rotation={-4} width="5rem" pattern="checks" />

            {/* doodles scattered */}
            <Doodle d={STAR} color={colors.gold} className="top-24 left-6" size={22} filled fillColor={colors.gold} />
            <Doodle d={HEART} color={colors.coral} className="top-16 right-1/3" size={20} filled fillColor={colors.coral} />
            <Doodle d={SWIRL} color={mint} className="bottom-32 left-1/4" size={28} />
            <Doodle d={SPARKLE} color={colors.gold} className="bottom-20 right-10" size={22} />
            <Doodle d={FLOWER} color={colors.coral} className="bottom-8 left-12" size={26} />

            {/* Bubble title — top */}
            <div className="absolute left-6 right-6 top-12 flex justify-center">
              <BubbleTitle
                text={m.title.length > 18 ? m.title.slice(0, 18) + "…" : m.title}
                bg={colors.gold}
                ink={ink}
                rotate={-3}
                className="!text-[28px] md:!text-[36px]"
              />
            </div>

            {/* Big main photo — left, tilted left */}
            <div className="absolute left-6 top-32">
              <CutoutPhoto
                src={m.photo_url}
                rotate={-5}
                width="13rem"
                height="13rem"
                fallbackBg={colors.accent}
                fallbackInk={ink}
              />
            </div>

            {/* Secondary photo — right, smaller, tilted right */}
            <div className="absolute right-6 top-44">
              <CutoutPhoto
                src={m.photo_url}
                rotate={7}
                width="9rem"
                height="11rem"
                borderColor={colors.gold}
                fallbackBg={colors.coral}
                fallbackInk="#fff"
              />
            </div>

            {/* Sticker badges */}
            <div className="absolute right-3 top-32">
              <Sticker bg={colors.coral} ring="#fff" ink="#fff" rotate={-12} size="sm">
                {m.category}
              </Sticker>
            </div>
            <div className="absolute left-44 top-28">
              <Sticker bg={mint} ring="#fff" ink={ink} rotate={8} size="sm">
                {monthLabel}
              </Sticker>
            </div>

            {/* Sticky-note story bottom-right */}
            {m.story && (
              <div className="absolute bottom-20 right-8">
                <StickyNote
                  text={`"${m.story.slice(0, 90)}${m.story.length > 90 ? "…" : ""}"`}
                  rotation={-4}
                  color={colors.gold}
                  ink={ink}
                  maxWidth="220px"
                />
              </div>
            )}

            {/* Ticket stub bottom-left */}
            <div className="absolute bottom-10 left-8">
              <TicketStub date={dateLabel} label="memory" colors={colors} rotate={-3} />
            </div>

            {/* People tags scattered */}
            {(m.who_was_there?.length ?? 0) > 0 && (
              <div className="absolute bottom-32 left-8 flex flex-col gap-1.5">
                {m.who_was_there!.slice(0, 2).map((w, i) => (
                  <Sticker
                    key={w}
                    bg={i % 2 === 0 ? colors.coral : mint}
                    ring="#fff"
                    ink={i % 2 === 0 ? "#fff" : ink}
                    rotate={i % 2 === 0 ? -6 : 4}
                    size="sm"
                  >
                    ♥ {w}
                  </Sticker>
                ))}
              </div>
            )}

            {PageNum}
          </div>
        );
      }

      /* ─── Layout 2: POLAROID-STACK — three overlapping polaroids ─── */
      if (page.layout === "polaroid-stack") {
        return (
          <div
            className={`paper-crinkle relative h-full w-full overflow-hidden p-8 ${tex}`}
            style={{ backgroundColor: paper, color: ink }}
          >
            <WashiTape color={colors.accent} className="-top-2 left-1/3" rotation={-3} width="10rem" pattern="checks" />
            <Doodle d={SUN} color={colors.gold} className="top-10 right-8" size={30} />
            <Doodle d={STAR} color={colors.coral} className="top-14 left-8" size={24} filled fillColor={colors.coral} />
            <Doodle d={SPARKLE} color={mint} className="bottom-32 left-10" size={22} />

            {/* Bubble title */}
            <div className="absolute left-1/2 top-8 -translate-x-1/2">
              <BubbleTitle
                text={m.title.length > 16 ? m.title.slice(0, 16) + "…" : m.title}
                bg={colors.coral}
                ink="#fff"
                rotate={-2}
                className="!text-[26px] md:!text-[34px]"
              />
            </div>

            {/* Polaroid stack — center */}
            <div className="absolute inset-x-0 top-28 flex justify-center">
              <div className="relative h-72 w-80">
                <div className="absolute left-2 top-3">
                  <Polaroid src={m.photo_url} rotation={-9} colors={colors} width="11rem" />
                </div>
                <div className="absolute left-24 top-0">
                  <Polaroid src={m.photo_url} caption={shortDate} rotation={4} colors={colors} width="11rem" />
                </div>
                <div className="absolute right-0 top-16">
                  <Polaroid src={m.photo_url} rotation={11} colors={colors} width="10rem" />
                </div>
                {/* Sticker on top */}
                <div className="absolute -right-2 -top-2">
                  <Sticker bg={colors.gold} ring="#fff" ink={ink} rotate={-12} size="sm">
                    {monthLabel}
                  </Sticker>
                </div>
              </div>
            </div>

            {/* Story bottom */}
            <div className="absolute inset-x-8 bottom-10 flex flex-col items-center gap-3 text-center">
              {m.story && (
                <p className="font-handwritten text-[20px] leading-snug" style={{ color: ink }}>
                  "{m.story.slice(0, 110)}{m.story.length > 110 ? "…" : ""}"
                </p>
              )}
              <div className="flex flex-wrap justify-center gap-2">
                <TicketStub date={dateLabel} label={m.category} colors={colors} rotate={-2} />
                {m.who_was_there?.slice(0, 2).map((w, i) => (
                  <Sticker key={w} bg={i % 2 === 0 ? mint : colors.coral} ring="#fff" ink={i % 2 === 0 ? ink : "#fff"} rotate={i % 2 === 0 ? 3 : -3} size="sm">
                    ♥ {w}
                  </Sticker>
                ))}
              </div>
            </div>

            {PageNum}
          </div>
        );
      }

      /* ─── Layout 3: MAGAZINE — bold full-bleed photo + headline strip ─── */
      if (page.layout === "magazine") {
        return (
          <div
            className="paper-crinkle relative h-full w-full overflow-hidden"
            style={{ backgroundColor: paper, color: ink }}
          >
            {/* Photo top 60% — full bleed with deckle border underneath */}
            <div className="relative h-[58%] w-full overflow-hidden">
              {m.photo_url ? (
                <img src={m.photo_url} alt="" crossOrigin="anonymous" className="h-full w-full object-cover" />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center font-printed text-[14px]"
                  style={{ backgroundColor: colors.accent, color: ink }}
                >
                  no photo
                </div>
              )}
              {/* tape strips on photo */}
              <WashiTape color={colors.coral} className="-top-2 left-1/4" rotation={-7} width="8rem" />
              <WashiTape color={mint} className="-top-2 right-1/4" rotation={5} width="7rem" pattern="dots" />

              {/* Floating sticker badge */}
              <div className="absolute right-5 top-5">
                <Sticker bg={colors.gold} ring="#fff" ink={ink} rotate={6} size="md">
                  {monthLabel}
                </Sticker>
              </div>

              {/* Ticket overlapping bottom */}
              <div className="absolute -bottom-4 left-6">
                <TicketStub date={shortDate} label={m.category} colors={colors} rotate={-3} />
              </div>
            </div>

            {/* Bottom 42% — bubble headline + story */}
            <div className={`relative h-[42%] w-full p-7 ${tex}`} style={{ backgroundColor: paper }}>
              <Doodle d={STAR} color={colors.gold} className="right-6 top-5" size={22} filled fillColor={colors.gold} />
              <Doodle d={HEART} color={colors.coral} className="bottom-6 right-12" size={20} filled fillColor={colors.coral} />
              <Doodle d={SPARKLE} color={mint} className="top-10 left-6" size={18} />

              <div className="-mt-2 mb-3">
                <BubbleTitle
                  text={m.title.length > 22 ? m.title.slice(0, 22) + "…" : m.title}
                  bg={colors.coral}
                  ink="#fff"
                  rotate={-2}
                  className="!text-[28px] md:!text-[36px]"
                />
              </div>

              {m.story && (
                <p className="font-printed text-[14px] leading-relaxed" style={{ color: ink, opacity: 0.88 }}>
                  {m.story.slice(0, 220)}{m.story.length > 220 ? "…" : ""}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {m.who_was_there?.slice(0, 3).map((w, i) => (
                  <Sticker key={w} bg={i % 2 === 0 ? mint : colors.gold} ring="#fff" ink={ink} rotate={i % 2 === 0 ? -3 : 3} size="sm">
                    ♥ {w}
                  </Sticker>
                ))}
                {m.tags?.slice(0, 2).map((t, i) => (
                  <Sticker key={t} bg={colors.coral} ring="#fff" ink="#fff" rotate={i === 0 ? 4 : -4} size="sm">
                    #{t}
                  </Sticker>
                ))}
              </div>
            </div>

            {PageNum}
          </div>
        );
      }

      /* ─── Layout 4: JOURNAL — ruled paper, polaroid corner, handwritten entry ─── */
      if (page.layout === "journal") {
        return (
          <div
            className="paper-crinkle paper-ruled relative h-full w-full overflow-hidden p-8"
            style={{ backgroundColor: paper, color: ink }}
          >
            {/* Red margin line — like a real notebook */}
            <span
              className="absolute left-12 top-0 h-full w-px"
              style={{ backgroundColor: colors.coral, opacity: 0.45 }}
              aria-hidden
            />

            <WashiTape color={colors.accent} className="-top-2 right-12" rotation={6} width="8rem" />
            <Doodle d={HEART} color={colors.coral} className="top-6 left-3" size={20} filled fillColor={colors.coral} />
            <Doodle d={STAR} color={colors.gold} className="bottom-12 right-8" size={22} filled fillColor={colors.gold} />
            <Doodle d={FLOWER} color={mint} className="bottom-32 right-3" size={24} />

            {/* Date stamp top */}
            <div className="ml-14 flex items-center justify-between">
              <span className="font-marker text-[12px] uppercase tracking-[0.25em]" style={{ color: ink, opacity: 0.6 }}>
                Dear diary —
              </span>
              <TicketStub date={dateLabel} label={m.category} colors={colors} rotate={-3} />
            </div>

            {/* Bubble title */}
            <div className="ml-14 mt-4">
              <BubbleTitle
                text={m.title.length > 20 ? m.title.slice(0, 20) + "…" : m.title}
                bg={colors.gold}
                ink={ink}
                rotate={-1}
                className="!text-[30px] md:!text-[38px]"
              />
            </div>

            {/* Polaroid in top right, overlapping */}
            <div className="absolute right-6 top-32">
              <Polaroid src={m.photo_url} rotation={6} colors={colors} caption={shortDate} width="9rem" />
            </div>

            {/* Handwritten story — left column, wraps under polaroid */}
            <div
              className="ml-14 mr-44 mt-6 font-handwritten text-[20px] leading-[1.4]"
              style={{ color: ink }}
            >
              {m.story
                ? `"${m.story.slice(0, 320)}${m.story.length > 320 ? "…" : ""}"`
                : `Today was ${m.title.toLowerCase()}. A little day worth keeping forever.`}
            </div>

            {/* People + tags as sticker row */}
            <div className="absolute bottom-12 left-14 flex flex-wrap gap-2">
              {m.who_was_there?.slice(0, 3).map((w, i) => (
                <Sticker key={w} bg={i % 2 === 0 ? colors.coral : mint} ring="#fff" ink={i % 2 === 0 ? "#fff" : ink} rotate={i % 2 === 0 ? -4 : 3} size="sm">
                  ♥ {w}
                </Sticker>
              ))}
              {m.tags?.slice(0, 2).map((t) => (
                <Sticker key={t} bg={colors.gold} ring="#fff" ink={ink} rotate={-2} size="sm">
                  #{t}
                </Sticker>
              ))}
            </div>

            {PageNum}
          </div>
        );
      }

      /* ─── Layout 5: POCKET — ticket-stub + photo "in pocket" + memo card ─── */
      return (
        <div
          className={`paper-crinkle relative h-full w-full overflow-hidden p-6 ${tex}`}
          style={{ backgroundColor: paper, color: ink }}
        >
          <WashiTape color={mint} className="-top-2 left-1/4" rotation={-5} width="9rem" pattern="dots" />
          <WashiTape color={colors.coral} className="-top-2 right-12" rotation={8} width="6rem" />
          <Doodle d={CLOUD} color={colors.accent} className="top-12 left-6" size={28} />
          <Doodle d={SUN} color={colors.gold} className="top-10 right-1/3" size={28} />
          <Doodle d={SWIRL} color={colors.coral} className="bottom-20 right-6" size={32} />

          {/* Bubble title */}
          <div className="mt-6 flex justify-center">
            <BubbleTitle
              text={m.title.length > 20 ? m.title.slice(0, 20) + "…" : m.title}
              bg={mint}
              ink={ink}
              rotate={-2}
              className="!text-[28px] md:!text-[36px]"
            />
          </div>

          {/* Photo wedged into a "pocket" — angled cut underneath */}
          <div className="relative mx-auto mt-6 w-72">
            {/* Pocket back panel */}
            <div
              className="cutout-shadow absolute inset-x-0 top-12 h-44 rounded-b-[80px_24px]"
              style={{ backgroundColor: colors.gold, opacity: 0.85 }}
              aria-hidden
            />
            <div className="relative flex justify-center">
              <CutoutPhoto
                src={m.photo_url}
                rotate={-4}
                width="14rem"
                height="14rem"
                fallbackBg={colors.accent}
                fallbackInk={ink}
              />
            </div>
            {/* "Pocket" label */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <TicketStub date={shortDate} label={m.category} colors={colors} rotate={3} />
            </div>
          </div>

          {/* Memo card (sticky note) */}
          <div className="mt-12 flex justify-center">
            <StickyNote
              text={m.story ? `"${m.story.slice(0, 130)}${m.story.length > 130 ? "…" : ""}"` : `A little ${m.category} memory.`}
              rotation={-2}
              color={colors.coral}
              ink="#fff"
              maxWidth="320px"
            />
          </div>

          {/* People stickers */}
          {(m.who_was_there?.length ?? 0) > 0 && (
            <div className="absolute bottom-10 left-6 flex flex-wrap gap-2">
              {m.who_was_there!.slice(0, 3).map((w, i) => (
                <Sticker key={w} bg={i % 2 === 0 ? colors.gold : mint} ring="#fff" ink={ink} rotate={i % 2 === 0 ? -3 : 4} size="sm">
                  ♥ {w}
                </Sticker>
              ))}
            </div>
          )}

          {PageNum}
        </div>
      );
    }

    /* ────────────────────────── MEMORY-SPREAD ─────────────────────────── */
    case "memory-spread": {
      const items = page.memories;
      const PageNum = (
        <div
          className="absolute bottom-3 right-5 font-marker text-[10px] uppercase tracking-widest"
          style={{ color: ink, opacity: 0.4 }}
        >
          spread {page.index} / {page.total}
        </div>
      );

      /* ─── Spread A: GRID-COLLAGE — 4 photos in a tilted asymmetric grid ─── */
      if (page.layout === "grid-collage") {
        const slots: Array<{ left: string; top: string; w: string; h: string; rot: number; tone: "accent" | "coral" | "gold" | "mint" }> = [
          { left: "1.25rem", top: "4.5rem", w: "15rem", h: "11rem", rot: -3, tone: "accent" },
          { left: "16.75rem", top: "3.25rem", w: "12rem", h: "8.5rem", rot: 4, tone: "coral" },
          { left: "1.25rem", top: "16.75rem", w: "11rem", h: "9.5rem", rot: 2, tone: "gold" },
          { left: "13.5rem", top: "13.25rem", w: "15rem", h: "12rem", rot: -2, tone: "mint" },
        ];
        return (
          <div
            className={`paper-crinkle relative h-full w-full overflow-hidden p-5 ${tex}`}
            style={{ backgroundColor: paper, color: ink }}
          >
            <WashiTape color={colors.accent} className="-top-2 left-12" rotation={-8} width="9rem" />
            <WashiTape color={colors.coral} className="-top-3 right-16" rotation={6} width="7rem" pattern="dots" />
            <WashiTape color={mint} className="bottom-1 left-20" rotation={-4} width="11rem" pattern="checks" />
            <Doodle d={STAR} color={colors.gold} className="top-3 right-3" size={22} filled fillColor={colors.gold} />
            <Doodle d={SPARKLE} color={mint} className="bottom-12 right-5" size={22} />

            <div className="absolute left-5 top-2">
              <Sticker bg={colors.gold} ring="#fff" ink={ink} rotate={-3} size="sm">
                Mosaic · {items.length} memories
              </Sticker>
            </div>

            {items.slice(0, 4).map((m, i) => {
              const s = slots[i];
              const fallbackBg = s.tone === "accent" ? colors.accent : s.tone === "coral" ? colors.coral : s.tone === "gold" ? colors.gold : mint;
              const date = format(new Date(m.happened_at), "MMM d");
              return (
                <div key={m.id} className="absolute" style={{ left: s.left, top: s.top }}>
                  <Polaroid src={m.photo_url} caption={`${date} · ${m.title.slice(0, 18)}`} rotation={s.rot} colors={colors} width={s.w} />
                  {/* tiny corner sticker */}
                  {(i === 0 || i === 3) && (
                    <div className="absolute -right-2 -top-2">
                      <Sticker bg={i % 2 === 0 ? colors.coral : mint} ring="#fff" ink={i % 2 === 0 ? "#fff" : ink} rotate={-12} size="sm">
                        {format(new Date(m.happened_at), "MMM").toUpperCase()}
                      </Sticker>
                    </div>
                  )}
                  <span className="sr-only">{fallbackBg}</span>
                </div>
              );
            })}

            {PageNum}
          </div>
        );
      }

      /* ─── Spread B: POLAROID-MOSAIC — pocket-album style 4-up grid ─── */
      if (page.layout === "polaroid-mosaic") {
        const slots = [
          { col: 0, row: 0, rot: -4 },
          { col: 1, row: 0, rot: 3 },
          { col: 0, row: 1, rot: 2 },
          { col: 1, row: 1, rot: -3 },
        ];
        return (
          <div
            className={`paper-crinkle relative h-full w-full overflow-hidden p-6 ${tex}`}
            style={{ backgroundColor: paper, color: ink }}
          >
            <WashiTape color={colors.accent} className="-top-2 left-1/4" rotation={-3} width="14rem" pattern="checks" />
            <Doodle d={HEART} color={colors.coral} className="top-3 right-6" size={22} filled fillColor={colors.coral} />
            <Doodle d={FLOWER} color={mint} className="bottom-12 left-4" size={22} />
            <Doodle d={SWIRL} color={colors.gold} className="bottom-16 right-8" size={26} />

            <div className="absolute left-1/2 top-3 -translate-x-1/2">
              <BubbleTitle text="Pocket pages" bg={colors.gold} ink={ink} rotate={-2} className="!text-[22px] md:!text-[26px]" />
            </div>

            <div className="absolute inset-x-5 top-16 grid grid-cols-2 gap-3">
              {items.slice(0, 4).map((m, i) => {
                const s = slots[i];
                const date = format(new Date(m.happened_at), "MMM d, yyyy");
                return (
                  <div key={m.id} className="flex justify-center" style={{ transform: `rotate(${s.rot}deg)` }}>
                    <Polaroid
                      src={m.photo_url}
                      caption={`${m.title.slice(0, 22)}${m.title.length > 22 ? "…" : ""}`}
                      rotation={0}
                      colors={colors}
                      width="11.5rem"
                    />
                    <div className="absolute -mt-2 ml-28">
                      <Sticker bg={i % 2 === 0 ? mint : colors.coral} ring="#fff" ink={i % 2 === 0 ? ink : "#fff"} rotate={-8} size="sm">
                        {date}
                      </Sticker>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="absolute bottom-3 left-5">
              <TicketStub date={`${items.length} memories`} label="album page" colors={colors} rotate={-2} />
            </div>

            {PageNum}
          </div>
        );
      }

      /* ─── Spread C: MAGAZINE-MOSAIC — 1 hero photo + 2 small features ─── */
      // (also used for collage-zine)
      const [hero, ...rest] = items;
      const features = rest.slice(0, 2);
      return (
        <div
          className={`paper-crinkle relative h-full w-full overflow-hidden ${tex}`}
          style={{ backgroundColor: paper, color: ink }}
        >
          {/* Hero photo top half */}
          <div className="relative h-[46%] w-full overflow-hidden">
            {hero?.photo_url ? (
              <img src={hero.photo_url} alt="" crossOrigin="anonymous" className="h-full w-full object-cover" />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center font-printed text-[14px]"
                style={{ backgroundColor: colors.accent, color: ink }}
              >
                no photo
              </div>
            )}
            {/* Headline strip */}
            <div className="absolute bottom-3 left-4 right-4">
              <BubbleTitle
                text={hero ? (hero.title.length > 22 ? hero.title.slice(0, 22) + "…" : hero.title) : "Spread"}
                bg={colors.coral}
                ink="#fff"
                rotate={-2}
                className="!text-[24px] md:!text-[30px]"
              />
            </div>
            <div className="absolute right-4 top-3">
              <Sticker bg={colors.gold} ring="#fff" ink={ink} rotate={-6} size="sm">
                Featured
              </Sticker>
            </div>
          </div>

          {/* Bottom half — 2 feature cards + sticky note */}
          <div className="relative h-[54%] w-full p-4">
            <WashiTape color={mint} className="-top-2 left-16" rotation={-4} width="9rem" pattern="checks" />
            <Doodle d={STAR} color={colors.gold} className="top-2 right-6" size={22} filled fillColor={colors.gold} />

            <div className="grid h-full grid-cols-2 gap-3 pt-2">
              {features.map((m, i) => {
                const date = format(new Date(m.happened_at), "MMM d");
                return (
                  <div key={m.id} className="relative">
                    <CutoutPhoto
                      src={m.photo_url}
                      rotate={i === 0 ? -3 : 3}
                      width="100%"
                      height="9rem"
                      fallbackBg={i === 0 ? mint : colors.coral}
                      fallbackInk={i === 0 ? ink : "#fff"}
                    />
                    <p className="mt-2 line-clamp-2 font-handwritten text-[15px] leading-tight" style={{ color: ink }}>
                      {m.title}
                    </p>
                    <p className="mt-1 font-marker text-[10px] uppercase tracking-widest" style={{ color: ink, opacity: 0.6 }}>
                      {date} · {m.category}
                    </p>
                  </div>
                );
              })}
            </div>

            {hero?.story && (
              <div className="absolute bottom-3 right-4">
                <StickyNote
                  text={`"${hero.story.slice(0, 70)}${hero.story.length > 70 ? "…" : ""}"`}
                  rotation={-4}
                  color={colors.gold}
                  ink={ink}
                  maxWidth="180px"
                />
              </div>
            )}
            <div className="absolute bottom-3 left-4">
              <TicketStub
                date={hero ? format(new Date(hero.happened_at), "MMM yyyy") : ""}
                label={`${items.length} memories`}
                colors={colors}
                rotate={-2}
              />
            </div>
          </div>

          {PageNum}
        </div>
      );
    }

    /* ──────────────────────────────── BACK ────────────────────────────── */
    case "back":
      return (
        <div
          className={`paper-crinkle relative flex h-full w-full flex-col items-center justify-center p-12 text-center ${tex}`}
          style={{ backgroundColor: paper, color: ink }}
        >
          <WashiTape color={colors.accent} className="-top-2 left-12" rotation={-6} />
          <WashiTape color={colors.coral} className="-top-2 right-12" rotation={6} pattern="dots" />
          <Doodle d={STAR} color={colors.gold} className="top-20 left-16" size={28} filled fillColor={colors.gold} />
          <Doodle d={HEART} color={colors.coral} className="top-24 right-16" size={28} filled fillColor={colors.coral} />
          <Doodle d={SPARKLE} color={mint} className="bottom-20 left-1/2 -translate-x-1/2" size={28} />
          <Doodle d={FLOWER} color={mint} className="top-1/3 right-10" size={26} />

          <Sticker bg={colors.accent} ring="#fff" ink={ink} rotate={-2}>
            The end ✿ for now
          </Sticker>

          <div className="mt-5 max-w-md">
            <BubbleTitle text={`Thank you, ${page.childName}.`} bg={colors.coral} ink="#fff" rotate={-1} className="!text-[32px] md:!text-[40px]" />
          </div>

          <p className="mt-6 max-w-sm font-printed text-[15px] leading-relaxed" style={{ color: ink, opacity: 0.75 }}>
            Made with Kidzopedia — the cozy place to keep your child's story.
          </p>

          <div className="mt-10">
            <TicketStub date="To be continued…" label="Next chapter" colors={colors} rotate={-2} />
          </div>
        </div>
      );
  }
};

/* ─────────────────────────────────────────── Frame wrapper ──────────── */

/**
 * Renders a BookPageView at the design canvas size (600×800) and uniformly
 * CSS-scales it to fit a responsive container. Guarantees the layout always
 * fits the screen, no matter the viewport, *and* matches the PDF render exactly.
 */
export const BookPageFrame = ({
  page,
  colors,
  className = "",
  overlay,
  hideNative = false,
}: {
  page: BookPage;
  colors: BookTemplateColors;
  className?: string;
  overlay?: EditorElement[];
  hideNative?: boolean;
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w === 0 || h === 0) return;
      setScale(Math.min(w / BOOK_PAGE_W, h / BOOK_PAGE_H));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`relative overflow-hidden ${className}`}
      style={{ backgroundColor: colors.paper ?? colors.primary }}
    >
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: BOOK_PAGE_W,
          height: BOOK_PAGE_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {!hideNative && <BookPageView page={page} colors={colors} />}
        {overlay && overlay.length > 0 && <ElementsOverlay elements={overlay} />}
      </div>
    </div>
  );
};

