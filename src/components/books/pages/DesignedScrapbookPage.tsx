import type { CSSProperties } from "react";
import type { BookTemplateColors } from "@/lib/types/bookTemplate";
import type { BookPage } from "../pageTypes";
import type { Memory } from "@/hooks/useMemories";
import { scrapbookDesigns, type PhotoSlot } from "./scrapbookDesigns";

const patterns: Record<string, string> = {
  archive: "repeating-linear-gradient(transparent 0 25px, #5c483022 25px 26px)",
  postcard: "repeating-linear-gradient(135deg, #ffffff44 0 6px, transparent 6px 20px)",
  cutout: "linear-gradient(25deg, #ffffff50 35%, transparent 35% 65%, #ffffff45 65%)",
  botanical: "radial-gradient(ellipse at bottom left, #82995155 0 24%, transparent 25%), radial-gradient(ellipse at top right, #82995144 0 19%, transparent 20%)",
  heart: "radial-gradient(circle at 13% 55%, #fff5 0 12%, transparent 13%), radial-gradient(circle at 85% 28%, #fff6 0 19%, transparent 20%)",
  contact: "linear-gradient(90deg, #0004 0 5%, transparent 5% 95%, #0004 95%)",
  confetti: "radial-gradient(circle at 8px 8px, #fff9 0 3px, transparent 4px), radial-gradient(circle at 24px 23px, #8e49804a 0 2px, transparent 3px)",
  minimal: "linear-gradient(90deg, transparent 6%, #ffffff88 6% 94%, transparent 94%)",
  sparkle: "radial-gradient(ellipse at top, #fff9, transparent 62%)",
  tape: "repeating-linear-gradient(8deg, #6b462509 0 1px, transparent 1px 7px)",
  ribbon: "linear-gradient(146deg, #ffffff72 35%, transparent 35% 64%, #ffffff55 64%)",
  grid: "linear-gradient(90deg, #ffffff20 1px, transparent 1px), linear-gradient(#ffffff20 1px, transparent 1px)",
  gingham: "linear-gradient(90deg, #d952692b 50%, transparent 50%), linear-gradient(#d952692b 50%, transparent 50%)",
  spiral: "repeating-linear-gradient(transparent 0 27px, #9aacc455 27px 28px)",
  postmark: "repeating-linear-gradient(130deg, #cc5553 0 15px, #fff4d9 15px 30px, #223e60 30px 45px, #fff4d9 45px 60px)",
  coast: "linear-gradient(151deg, transparent 49%, #a8c3c888 49% 70%, #faf6e9 70%)",
  film: "repeating-linear-gradient(#fff4dd 0 13px, transparent 13px 30px)",
  meadow: "radial-gradient(ellipse at top left, #b2be81 0 13%, transparent 14%), radial-gradient(ellipse at bottom right, #b2be81 0 21%, transparent 22%)",
  news: "repeating-linear-gradient(90deg, transparent 0 109px, #bba98b55 109px 110px)",
  pockets: "linear-gradient(32deg, #f8dd88 0 34%, transparent 34%), linear-gradient(150deg, #e3f1fc 0 48%, transparent 48%)",
  cloud: "radial-gradient(ellipse at 80% 17%, #fff9 0 16%, transparent 17%), radial-gradient(ellipse at 12% 74%, #fff9 0 23%, transparent 24%)",
};

type PageContent = { memories: Memory[]; title: string | undefined; subtitle: string | null | undefined };

function pageContent(page: BookPage): PageContent {
  switch (page.kind) {
    case "cover":
      return { memories: page.coverMemories ?? [], title: page.title, subtitle: page.subtitle };
    case "memory-spread":
      return { memories: page.memories, title: page.memories[0]?.title, subtitle: undefined };
    case "back":
      return { memories: [], title: page.childName, subtitle: undefined };
    case "chapter":
      return { memories: [], title: page.title, subtitle: page.subtitle };
    case "intro":
      return { memories: [], title: page.title, subtitle: page.dateRange };
    default:
      return { memories: [], title: "", subtitle: undefined };
  }
}

const ORNAMENTS: Record<string, string> = {
  heart: "♡",
  botanical: "❧",
  sparkle: "✦",
  confetti: "✦",
  cutout: "✦",
};

function textureStyleFor(pattern: string): CSSProperties {
  return {
    position: "absolute",
    inset: pattern === "postmark" ? 0 : undefined,
    backgroundImage: patterns[pattern],
    backgroundSize: ["grid", "gingham", "confetti"].includes(pattern) ? "42px 42px" : undefined,
  };
}

type HeaderLayout = { mediaPage: boolean; studio: boolean; taped: boolean };

function headerStyleFor(pattern: string, colors: BookTemplateColors, ink: string, layout: HeaderLayout): CSSProperties {
  const { mediaPage, studio, taped } = layout;
  const mediaTop = studio ? 22 : 28;
  const mediaMinHeight = studio ? 132 : 146;
  return {
    top: mediaPage ? mediaTop : 240,
    left: 34,
    width: 532,
    minHeight: mediaPage ? mediaMinHeight : 300,
    backgroundColor: pattern === "grid" ? colors.gold : colors.accent,
    color: pattern === "grid" ? colors.primary : ink,
    borderBlock: pattern === "news" ? "4px double currentColor" : undefined,
    borderRadius: pattern === "cloud" ? "76px" : undefined,
    transform: taped || pattern === "cutout" ? "rotate(-3deg)" : undefined,
    clipPath: pattern === "ribbon" ? "polygon(0 0,100% 0,96% 50%,100% 100%,0 100%,4% 50%)" : undefined,
    textAlign: ["archive", "contact", "postcard"].includes(pattern) ? "left" : "center",
    letterSpacing: pattern === "minimal" ? "0.04em" : undefined,
  };
}

function titleFontSize(title: string | undefined, studio: boolean): number {
  if (title && title.length > 28) return 38;
  return studio ? 46 : 55;
}

function PatternDecorations({ pattern, colors, paper }: { pattern: string; colors: BookTemplateColors; paper: string }) {
  const ornament = ORNAMENTS[pattern] ?? null;
  return (
    <>
      {pattern === "postmark" && <div aria-hidden className="absolute inset-[13px]" style={{ backgroundColor: paper }} />}
      {pattern === "spiral" && (
        <div aria-hidden className="absolute inset-y-0 left-[287px] flex w-[26px] flex-col justify-evenly border-x border-black/20 bg-black/5">
          {Array.from({ length: 18 }, (_, i) => <div key={i} className="h-[8px] rounded-full border-2 border-[#574b42] bg-[#928274]" />)}
        </div>
      )}
      {pattern === "film" && (
        <div aria-hidden className="absolute bottom-[44px] left-[203px] top-[183px] w-[12px]" style={{ backgroundImage: patterns.film }} />
      )}
      {ornament && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ color: colors.gold }}>
          <span className="absolute left-5 top-[38%] rotate-[-18deg] text-[88px]">{ornament}</span>
          <span className="absolute right-4 top-[61%] rotate-[19deg] text-[102px]">{ornament}</span>
          <span className="absolute bottom-0 left-[42%] text-[72px]">{ornament}</span>
        </div>
      )}
    </>
  );
}

function figureBorderRadius(pattern: string, index: number): string | undefined {
  if (pattern === "cloud") return "44% 44% 24% 24%";
  if (pattern === "botanical") return "46% 46% 4% 4%";
  if (pattern === "meadow" && index === 0) return "50% 10% 50% 10%";
  return undefined;
}

function figureBorder(pattern: string, colors: BookTemplateColors): string | undefined {
  if (pattern === "postcard") return `4px dotted ${colors.gold}`;
  if (pattern === "postmark") return "4px dotted #839DA8";
  return undefined;
}

type FrameProps = {
  slot: PhotoSlot;
  index: number;
  memory: Memory | undefined;
  cover: boolean;
  pattern: string;
  colors: BookTemplateColors;
  ink: string;
  studio: boolean;
  taped: boolean;
  dark: boolean;
};

function figureStyleFor({ slot, index, pattern, colors, ink, studio, dark }: FrameProps): CSSProperties {
  const [left, top, width, height, rotation = 0] = slot;
  return {
    left, top, width, height,
    transform: `rotate(${rotation}deg)`,
    background: dark || studio ? colors.accent : "#FFFAEF",
    color: dark ? ink : "#342A2B",
    border: figureBorder(pattern, colors),
    borderRadius: figureBorderRadius(pattern, index),
    borderInline: pattern === "contact" ? `5px dashed ${colors.gold}` : undefined,
    boxShadow: pattern === "news" ? undefined : "3px 5px 10px #2a20202b",
  };
}

function FrameCaption({ memory, index }: { memory: Memory | undefined; index: number }) {
  return (
    <figcaption className="px-2 pt-2 text-center leading-tight">
      {index > 0 && <p className="line-clamp-1 break-words text-lg font-bold">{memory?.title}</p>}
      {memory?.story && <p className="line-clamp-2 whitespace-pre-line break-words text-base">{memory.story}</p>}
    </figcaption>
  );
}

function PhotoFrame(props: FrameProps) {
  const { index, memory, cover, colors, studio, taped } = props;
  const showCaption = !cover && !!(memory?.story || (index > 0 && memory?.title));
  return (
    <figure className="absolute flex flex-col overflow-hidden p-[10px]" style={figureStyleFor(props)}>
      <div className="relative min-h-0 flex-1 overflow-hidden" style={{ backgroundColor: colors.gold }}>
        {memory?.photo_url && <img className="block h-full w-full object-cover" src={memory.photo_url} alt="" />}
      </div>
      {taped && studio && (
        <span aria-hidden className="pointer-events-none absolute left-[35%] top-0 h-8 w-[30%] rotate-[-8deg] opacity-65" style={{ backgroundColor: colors.gold }} />
      )}
      {showCaption && <FrameCaption memory={memory} index={index} />}
    </figure>
  );
}

export function DesignedScrapbookPage({ page, colors }: { page: BookPage; colors: BookTemplateColors }) {
  const design = scrapbookDesigns[page.scrapbookDesign ?? ""];
  if (!design) return null;

  const { pattern, font, slots } = design;
  const cover = page.kind === "cover";
  const { memories, title, subtitle } = pageContent(page);
  const paper = colors.paper ?? colors.primary;
  const ink = colors.ink ?? "#30271E";
  const mediaPage = cover || page.kind === "memory-spread";
  const studio = !!page.scrapbookDesign?.startsWith("studio-");
  const dark = pattern === "contact" || pattern === "film";
  const taped = pattern === "tape" || pattern === "gingham";

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: paper, color: ink, fontFamily: font }}>
      <div aria-hidden className="absolute inset-0" style={textureStyleFor(pattern)} />
      <PatternDecorations pattern={pattern} colors={colors} paper={paper} />
      <header
        className="absolute z-10 grid content-center gap-2 px-5 text-center"
        style={headerStyleFor(pattern, colors, ink, { mediaPage, studio, taped })}
      >
        <h1 className="line-clamp-2 break-words font-bold leading-[1.03]" style={{ fontSize: titleFontSize(title, studio) }}>
          {title}
        </h1>
        {subtitle && <p className="line-clamp-2 text-lg leading-tight">{subtitle}</p>}
        {cover && <p className="line-clamp-1 text-base">{page.childName}</p>}
      </header>

      {mediaPage && slots.map((slot, index) => (
        (memories[index] || cover) && (
          <PhotoFrame key={index} {...{ slot, index, cover, pattern, colors, ink, studio, taped, dark }} memory={memories[index]} />
        )
      ))}
    </div>
  );
}
