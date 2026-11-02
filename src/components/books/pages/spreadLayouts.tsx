import type { ReactNode } from "react";
import { format } from "date-fns";
import type { Memory } from "@/hooks/useMemories";
import type { BookTemplateColors } from "@/hooks/useBookTemplates";
import {
  BubbleTitle,
  CutoutPhoto,
  Doodle,
  FLOWER,
  HEART,
  Polaroid,
  SPARKLE,
  STAR,
  Sticker,
  StickyNote,
  SWIRL,
  TicketStub,
  WashiTape,
} from "./bookPageParts";
import { clip, type LayoutTheme } from "./memoryLayouts";

export interface SpreadLayoutProps extends LayoutTheme {
  items: Memory[];
  /** The "spread 1 / 16" label, already rendered. */
  pageNum: ReactNode;
}

type Tone = "accent" | "coral" | "gold" | "mint";
const toneColor = (tone: Tone, colors: BookTemplateColors, mint: string) => (tone === "mint" ? mint : colors[tone]);

const GRID_SLOTS: Array<{ left: string; top: string; w: string; h: string; rot: number; tone: Tone }> = [
  { left: "1.25rem", top: "4.5rem", w: "15rem", h: "11rem", rot: -3, tone: "accent" },
  { left: "16.75rem", top: "3.25rem", w: "12rem", h: "8.5rem", rot: 4, tone: "coral" },
  { left: "1.25rem", top: "16.75rem", w: "11rem", h: "9.5rem", rot: 2, tone: "gold" },
  { left: "13.5rem", top: "13.25rem", w: "15rem", h: "12rem", rot: -2, tone: "mint" },
];

/** One polaroid of the grid collage (the first and last get a month sticker on the corner). */
const GridSlot = ({ m, i, theme }: { m: Memory; i: number; theme: LayoutTheme }) => {
  const { colors, ink, mint } = theme;
  const s = GRID_SLOTS[i];
  const date = format(new Date(m.happened_at), "MMM d");
  return (
    <div className="absolute" style={{ left: s.left, top: s.top }}>
      <Polaroid src={m.photo_url} caption={`${date} · ${m.title.slice(0, 18)}`} rotation={s.rot} colors={colors} width={s.w} />
      {/* tiny corner sticker */}
      {(i === 0 || i === 3) && (
        <div className="absolute -right-2 -top-2">
          <Sticker bg={i % 2 === 0 ? colors.coral : mint} ring="#fff" ink={i % 2 === 0 ? "#fff" : ink} rotate={-12} size="sm">
            {format(new Date(m.happened_at), "MMM").toUpperCase()}
          </Sticker>
        </div>
      )}
      <span className="sr-only">{toneColor(s.tone, colors, mint)}</span>
    </div>
  );
};

/* ─── Spread A: GRID-COLLAGE — 4 photos in a tilted asymmetric grid ─── */
export const GridCollageSpread = ({ items, pageNum, ...theme }: SpreadLayoutProps) => {
  const { colors, ink, paper, mint, tex } = theme;
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

      {items.slice(0, 4).map((m, i) => (
        <GridSlot key={m.id} m={m} i={i} theme={theme} />
      ))}

      {pageNum}
    </div>
  );
};

// Canvas is 600×800. Photos sit left/right of the road, each with a red pin + label.
const ROAD_STOPS = [
  { left: 372, top: 60, w: 200, h: 140, rot: 2, side: "right" as const },
  { left: 28, top: 235, w: 200, h: 140, rot: -2, side: "left" as const },
  { left: 372, top: 420, w: 200, h: 140, rot: 2, side: "right" as const },
  { left: 28, top: 590, w: 200, h: 140, rot: -2, side: "left" as const },
];

const Pin = ({ color }: { color: string }) => (
  <span className="text-[16px] leading-none" style={{ color }}>
    📍
  </span>
);

/** One photo along the road, with its pin and label. */
const RoadStop = ({ m, i, theme }: { m: Memory; i: number; theme: LayoutTheme }) => {
  const { colors, ink, mint } = theme;
  const s = ROAD_STOPS[i];
  const onRight = s.side === "right";
  return (
    <div className="absolute" style={{ left: s.left, top: s.top, width: s.w }}>
      <CutoutPhoto
        src={m.photo_url}
        rotate={s.rot}
        width={`${s.w}px`}
        height={`${s.h}px`}
        fallbackBg={i % 2 === 0 ? colors.accent : mint}
        fallbackInk={ink}
      />
      <div className={`mt-2 flex items-center gap-1.5 ${onRight ? "" : "justify-end"}`}>
        {onRight && <Pin color={colors.coral} />}
        <div className={onRight ? "text-left" : "text-right"}>
          <div className="font-printed text-[12px] font-bold uppercase leading-tight tracking-wide" style={{ color: ink }}>
            {clip(m.title, 22)}
          </div>
          <div className="font-marker text-[10px] uppercase tracking-widest" style={{ color: ink, opacity: 0.6 }}>
            {format(new Date(m.happened_at), "MMM d, yyyy")}
          </div>
        </div>
        {!onRight && <Pin color={colors.coral} />}
      </div>
    </div>
  );
};

const ROAD_PATH = "M300 -10 C 240 90, 240 180, 300 260 S 360 420, 300 520 S 240 680, 300 810";

/* ─── Spread D: ROAD-TRAIL — winding road, photos alternate sides with map pins ─── */
export const RoadTrailSpread = ({ items, pageNum, ...theme }: SpreadLayoutProps) => {
  const { colors, ink, paper, mint, tex } = theme;
  return (
    <div className={`paper-crinkle relative h-full w-full overflow-hidden ${tex}`} style={{ backgroundColor: paper, color: ink }}>
      {/* the road */}
      <svg viewBox="0 0 600 800" className="absolute inset-0 h-full w-full" aria-hidden>
        <path d={ROAD_PATH} fill="none" stroke="#3b3b3f" strokeWidth="56" strokeLinecap="round" />
        <path d={ROAD_PATH} fill="none" stroke="#f4efe3" strokeWidth="3" strokeDasharray="16 14" />
      </svg>

      <WashiTape color={colors.accent} className="-top-2 left-8" rotation={-8} width="8rem" />
      <WashiTape color={colors.coral} className="-top-2 right-10" rotation={6} width="6rem" pattern="dots" />
      <Doodle d={STAR} color={colors.gold} className="left-6 top-24" size={24} filled fillColor={colors.gold} />
      <Doodle d={SPARKLE} color={mint} className="bottom-24 right-6" size={24} />

      {items.slice(0, 4).map((m, i) => (
        <RoadStop key={m.id} m={m} i={i} theme={theme} />
      ))}

      {pageNum}
    </div>
  );
};

const MOSAIC_ROTATIONS = [-4, 3, 2, -3];

/** One polaroid of the pocket-album page, with a date sticker. */
const MosaicCell = ({ m, i, theme }: { m: Memory; i: number; theme: LayoutTheme }) => {
  const { colors, ink, mint } = theme;
  return (
    <div className="flex justify-center" style={{ transform: `rotate(${MOSAIC_ROTATIONS[i]}deg)` }}>
      <Polaroid src={m.photo_url} caption={clip(m.title, 22)} rotation={0} colors={colors} width="11.5rem" />
      <div className="absolute -mt-2 ml-28">
        <Sticker bg={i % 2 === 0 ? mint : colors.coral} ring="#fff" ink={i % 2 === 0 ? ink : "#fff"} rotate={-8} size="sm">
          {format(new Date(m.happened_at), "MMM d, yyyy")}
        </Sticker>
      </div>
    </div>
  );
};

/* ─── Spread B: POLAROID-MOSAIC — pocket-album style 4-up grid ─── */
export const PolaroidMosaicSpread = ({ items, pageNum, ...theme }: SpreadLayoutProps) => {
  const { colors, ink, paper, mint, tex } = theme;
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
        {items.slice(0, 4).map((m, i) => (
          <MosaicCell key={m.id} m={m} i={i} theme={theme} />
        ))}
      </div>

      <div className="absolute bottom-3 left-5">
        <TicketStub date={`${items.length} memories`} label="album page" colors={colors} rotate={-2} />
      </div>

      {pageNum}
    </div>
  );
};

/** A small feature card (photo + title + date) under the hero. */
const FeatureCard = ({ m, i, theme }: { m: Memory; i: number; theme: LayoutTheme }) => {
  const { colors, ink, mint } = theme;
  return (
    <div className="relative">
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
        {format(new Date(m.happened_at), "MMM d")} · {m.category}
      </p>
    </div>
  );
};

/** The hero photo (or a "no photo" block) with its headline strip. */
const MosaicHero = ({ hero, theme }: { hero?: Memory; theme: LayoutTheme }) => {
  const { colors, ink } = theme;
  return (
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
          text={hero ? clip(hero.title, 22) : "Spread"}
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
  );
};

/* ─── Spread C: MAGAZINE-MOSAIC — 1 hero photo + 2 small features (also used for collage-zine) ─── */
export const MagazineMosaicSpread = ({ items, pageNum, ...theme }: SpreadLayoutProps) => {
  const { colors, ink, paper, mint, tex } = theme;
  const [hero, ...rest] = items;
  return (
    <div className={`paper-crinkle relative h-full w-full overflow-hidden ${tex}`} style={{ backgroundColor: paper, color: ink }}>
      <MosaicHero hero={hero} theme={theme} />

      {/* Bottom half — 2 feature cards + sticky note */}
      <div className="relative h-[54%] w-full p-4">
        <WashiTape color={mint} className="-top-2 left-16" rotation={-4} width="9rem" pattern="checks" />
        <Doodle d={STAR} color={colors.gold} className="top-2 right-6" size={22} filled fillColor={colors.gold} />

        <div className="grid h-full grid-cols-2 gap-3 pt-2">
          {rest.slice(0, 2).map((m, i) => (
            <FeatureCard key={m.id} m={m} i={i} theme={theme} />
          ))}
        </div>

        {hero?.story && (
          <div className="absolute bottom-3 right-4">
            <StickyNote text={`"${clip(hero.story, 70)}"`} rotation={-4} color={colors.gold} ink={ink} maxWidth="180px" />
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

      {pageNum}
    </div>
  );
};
