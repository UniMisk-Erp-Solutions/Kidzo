import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import type { Memory } from "@/hooks/useMemories";
import { BOOK_PAGE_H, BOOK_PAGE_W, type BookPage, type MemoryLayout, type MemorySpreadLayout, type ScrapbookFlavor } from "./pageTypes";
import type { BookTemplate, BookTemplateColors } from "@/hooks/useBookTemplates";
import { ElementsOverlay } from "./editor/EditorElements";
import type { EditorElement } from "./editor/types";
import { ScrapbookSpreadView } from "./ScrapbookSpreads";
import { paperTextureFor } from "./pages/bookPageParts";
import { BackPage, ChapterPage, CoverPage, IntroPage } from "./pages/staticPages";
import {
  CollageLayout,
  JournalLayout,
  MagazineLayout,
  PageNumber,
  PocketLayout,
  PolaroidStackLayout,
  type LayoutTheme,
  type MemoryLayoutProps,
} from "./pages/memoryLayouts";
import { GridCollageSpread, MagazineMosaicSpread, PolaroidMosaicSpread, RoadTrailSpread } from "./pages/spreadLayouts";

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

export { BOOK_PAGE_W, BOOK_PAGE_H };
export type { ScrapbookFlavor, MemoryLayout, MemorySpreadLayout, BookPage };

function flavorFromTemplate(t: BookTemplate): ScrapbookFlavor {
  if (t.slug?.includes("kraft")) return "kraft";
  if (t.slug?.includes("filmroll")) return "filmroll";
  if (t.slug?.includes("newsprint")) return "newsprint";
  if (t.slug?.includes("first-year")) return "first-year";
  if (t.slug?.includes("birthday")) return "birthday";
  if (t.slug?.includes("holiday")) return "holiday";
  if (t.slug?.includes("collage-zine")) return "collage-zine";
  if (t.slug?.includes("pocket-album")) return "pocket-album";
  if (t.slug?.includes("road-trail")) return "road-trail";
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
    case "road-trail":    return { perPage: 4, layouts: ["road-trail"] };
    case "kraft":         return { perPage: 4, layouts: ["kraft-collage", "newsprint-collage"] };
    case "filmroll":      return { perPage: 4, layouts: ["film-strip", "kraft-collage"] };
    case "newsprint":     return { perPage: 4, layouts: ["newsprint-collage", "film-strip"] };
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

/* ─────────────────────────────────────────── Page renderers ─────────── */

interface PageProps {
  page: BookPage;
  colors: BookTemplateColors;
}

type Kind<K extends BookPage["kind"]> = LayoutTheme & { page: Extract<BookPage, { kind: K }> };

const MEMORY_LAYOUTS: Record<MemoryLayout, (p: MemoryLayoutProps) => JSX.Element> = {
  "collage": CollageLayout,
  "polaroid-stack": PolaroidStackLayout,
  "magazine": MagazineLayout,
  "journal": JournalLayout,
  "pocket": PocketLayout,
};

/** A single-memory page in its chosen layout (the pocket layout is the fallback). */
const MemoryPage = ({ page, ...theme }: Kind<"memory">) => {
  const Layout = MEMORY_LAYOUTS[page.layout] ?? PocketLayout;
  const pageNum = <PageNumber ink={theme.ink} text={`${page.index} / ${page.total}`} />;
  return <Layout m={page.memory} pageNum={pageNum} {...theme} />;
};

/** A multi-memory spread (4 memories on one page) in its chosen layout. */
const SpreadPage = ({ page, ...theme }: Kind<"memory-spread">) => {
  const items = page.memories;
  const pageNum = <PageNumber ink={theme.ink} bottom="bottom-3" text={`spread ${page.index} / ${page.total}`} />;
  switch (page.layout) {
    case "grid-collage":
      return <GridCollageSpread items={items} pageNum={pageNum} {...theme} />;
    case "kraft-collage":
    case "film-strip":
    case "newsprint-collage":
      return <ScrapbookSpreadView kind={page.layout} items={items} colors={theme.colors} index={page.index} total={page.total} />;
    case "road-trail":
      return <RoadTrailSpread items={items} pageNum={pageNum} {...theme} />;
    case "polaroid-mosaic":
      return <PolaroidMosaicSpread items={items} pageNum={pageNum} {...theme} />;
    default:
      return <MagazineMosaicSpread items={items} pageNum={pageNum} {...theme} />;
  }
};

export const BookPageView = ({ page, colors }: PageProps) => {
  const flavor = page.kind === "memory" ? page.flavor : (page as { flavor?: ScrapbookFlavor }).flavor ?? "timeline";
  const theme: LayoutTheme = {
    colors,
    ink: colors.ink ?? colors.text ?? "#3E3E42",
    paper: colors.paper ?? colors.primary,
    mint: colors.mint ?? colors.accent,
    tex: paperTextureFor(flavor),
  };

  switch (page.kind) {
    case "cover":
      return <CoverPage page={page} {...theme} />;
    case "intro":
      return <IntroPage page={page} {...theme} />;
    case "chapter":
      return <ChapterPage page={page} {...theme} />;
    case "memory":
      return <MemoryPage page={page} {...theme} />;
    case "memory-spread":
      return <SpreadPage page={page} {...theme} />;
    case "back":
      return <BackPage page={page} {...theme} />;
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

