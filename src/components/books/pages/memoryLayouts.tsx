import type { ReactNode } from "react";
import { format } from "date-fns";
import type { Memory } from "@/hooks/useMemories";
import type { BookTemplateColors } from "@/hooks/useBookTemplates";
import {
  BubbleTitle,
  CLOUD,
  CutoutPhoto,
  Doodle,
  FLOWER,
  HEART,
  Polaroid,
  SPARKLE,
  STAR,
  Sticker,
  StickyNote,
  SUN,
  SWIRL,
  TicketStub,
  WashiTape,
} from "./bookPageParts";

/** Colours / paper shared by every page layout (computed once in BookPageView). */
export interface LayoutTheme {
  colors: BookTemplateColors;
  ink: string;
  paper: string;
  mint: string;
  tex: string;
}

export interface MemoryLayoutProps extends LayoutTheme {
  m: Memory;
  /** The "3 / 24" page number, already rendered. */
  pageNum: ReactNode;
}

/** `text` cut to `n` characters, with an ellipsis when it was longer. */
export const clip = (text: string, n: number) => (text.length > n ? `${text.slice(0, n)}…` : text);

/** "Page 3 / 24" label in the bottom-right corner. */
export const PageNumber = ({ ink, text, bottom = "bottom-4" }: { ink: string; text: string; bottom?: string }) => (
  <div
    className={`absolute ${bottom} right-5 font-marker text-[10px] uppercase tracking-widest`}
    style={{ color: ink, opacity: 0.4 }}
  >
    {text}
  </div>
);

/** ♥ name stickers for the people in a memory (alternating colours). */
const PeopleStickers = ({
  names,
  tones,
  rotations,
}: {
  names: string[];
  tones: [{ bg: string; ink: string }, { bg: string; ink: string }];
  rotations: [number, number];
}) => (
  <>
    {names.map((w, i) => (
      <Sticker key={w} bg={tones[i % 2].bg} ring="#fff" ink={tones[i % 2].ink} rotate={rotations[i % 2]} size="sm">
        ♥ {w}
      </Sticker>
    ))}
  </>
);

/* ─── Layout 1: COLLAGE — chaotic, layered, magazine-cutout energy ─── */
export const CollageLayout = ({ m, colors, ink, paper, mint, tex, pageNum }: MemoryLayoutProps) => {
  const people = (m.who_was_there ?? []).slice(0, 2);
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
        <BubbleTitle text={clip(m.title, 18)} bg={colors.gold} ink={ink} rotate={-3} className="!text-[28px] md:!text-[36px]" />
      </div>

      {/* Big main photo — left, tilted left */}
      <div className="absolute left-6 top-32">
        <CutoutPhoto src={m.photo_url} rotate={-5} width="13rem" height="13rem" fallbackBg={colors.accent} fallbackInk={ink} />
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
          {format(new Date(m.happened_at), "MMMM").toUpperCase()}
        </Sticker>
      </div>

      {/* Sticky-note story bottom-right */}
      {m.story && (
        <div className="absolute bottom-20 right-8">
          <StickyNote text={`"${clip(m.story, 90)}"`} rotation={-4} color={colors.gold} ink={ink} maxWidth="220px" />
        </div>
      )}

      {/* Ticket stub bottom-left */}
      <div className="absolute bottom-10 left-8">
        <TicketStub date={format(new Date(m.happened_at), "MMM d, yyyy")} label="memory" colors={colors} rotate={-3} />
      </div>

      {/* People tags scattered */}
      {people.length > 0 && (
        <div className="absolute bottom-32 left-8 flex flex-col gap-1.5">
          <PeopleStickers
            names={people}
            tones={[{ bg: colors.coral, ink: "#fff" }, { bg: mint, ink }]}
            rotations={[-6, 4]}
          />
        </div>
      )}

      {pageNum}
    </div>
  );
};

/* ─── Layout 2: POLAROID-STACK — three overlapping polaroids ─── */
export const PolaroidStackLayout = ({ m, colors, ink, paper, mint, tex, pageNum }: MemoryLayoutProps) => {
  const shortDate = format(new Date(m.happened_at), "MMM d");
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
        <BubbleTitle text={clip(m.title, 16)} bg={colors.coral} ink="#fff" rotate={-2} className="!text-[26px] md:!text-[34px]" />
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
              {format(new Date(m.happened_at), "MMMM").toUpperCase()}
            </Sticker>
          </div>
        </div>
      </div>

      {/* Story bottom */}
      <div className="absolute inset-x-8 bottom-10 flex flex-col items-center gap-3 text-center">
        {m.story && (
          <p className="font-handwritten text-[20px] leading-snug" style={{ color: ink }}>
            "{clip(m.story, 110)}"
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          <TicketStub date={format(new Date(m.happened_at), "MMM d, yyyy")} label={m.category} colors={colors} rotate={-2} />
          <PeopleStickers
            names={(m.who_was_there ?? []).slice(0, 2)}
            tones={[{ bg: mint, ink }, { bg: colors.coral, ink: "#fff" }]}
            rotations={[3, -3]}
          />
        </div>
      </div>

      {pageNum}
    </div>
  );
};

/** Full-bleed photo, or a "no photo" block. */
const FullBleedPhoto = ({ src, colors, ink }: { src: string | null; colors: BookTemplateColors; ink: string }) =>
  src ? (
    <img src={src} alt="" crossOrigin="anonymous" className="h-full w-full object-cover" />
  ) : (
    <div
      className="flex h-full w-full items-center justify-center font-printed text-[14px]"
      style={{ backgroundColor: colors.accent, color: ink }}
    >
      no photo
    </div>
  );

/* ─── Layout 3: MAGAZINE — bold full-bleed photo + headline strip ─── */
export const MagazineLayout = ({ m, colors, ink, paper, mint, tex, pageNum }: MemoryLayoutProps) => (
  <div className="paper-crinkle relative h-full w-full overflow-hidden" style={{ backgroundColor: paper, color: ink }}>
    {/* Photo top 60% — full bleed with deckle border underneath */}
    <div className="relative h-[58%] w-full overflow-hidden">
      <FullBleedPhoto src={m.photo_url} colors={colors} ink={ink} />
      {/* tape strips on photo */}
      <WashiTape color={colors.coral} className="-top-2 left-1/4" rotation={-7} width="8rem" />
      <WashiTape color={mint} className="-top-2 right-1/4" rotation={5} width="7rem" pattern="dots" />

      {/* Floating sticker badge */}
      <div className="absolute right-5 top-5">
        <Sticker bg={colors.gold} ring="#fff" ink={ink} rotate={6} size="md">
          {format(new Date(m.happened_at), "MMMM").toUpperCase()}
        </Sticker>
      </div>

      {/* Ticket overlapping bottom */}
      <div className="absolute -bottom-4 left-6">
        <TicketStub date={format(new Date(m.happened_at), "MMM d")} label={m.category} colors={colors} rotate={-3} />
      </div>
    </div>

    {/* Bottom 42% — bubble headline + story */}
    <div className={`relative h-[42%] w-full p-7 ${tex}`} style={{ backgroundColor: paper }}>
      <Doodle d={STAR} color={colors.gold} className="right-6 top-5" size={22} filled fillColor={colors.gold} />
      <Doodle d={HEART} color={colors.coral} className="bottom-6 right-12" size={20} filled fillColor={colors.coral} />
      <Doodle d={SPARKLE} color={mint} className="top-10 left-6" size={18} />

      <div className="-mt-2 mb-3">
        <BubbleTitle text={clip(m.title, 22)} bg={colors.coral} ink="#fff" rotate={-2} className="!text-[28px] md:!text-[36px]" />
      </div>

      {m.story && (
        <p className="font-printed text-[14px] leading-relaxed" style={{ color: ink, opacity: 0.88 }}>
          {clip(m.story, 220)}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PeopleStickers
          names={(m.who_was_there ?? []).slice(0, 3)}
          tones={[{ bg: mint, ink }, { bg: colors.gold, ink }]}
          rotations={[-3, 3]}
        />
        {m.tags?.slice(0, 2).map((t, i) => (
          <Sticker key={t} bg={colors.coral} ring="#fff" ink="#fff" rotate={i === 0 ? 4 : -4} size="sm">
            #{t}
          </Sticker>
        ))}
      </div>
    </div>

    {pageNum}
  </div>
);

/* ─── Layout 4: JOURNAL — ruled paper, polaroid corner, handwritten entry ─── */
export const JournalLayout = ({ m, colors, ink, paper, mint, pageNum }: MemoryLayoutProps) => (
  <div className="paper-crinkle paper-ruled relative h-full w-full overflow-hidden p-8" style={{ backgroundColor: paper, color: ink }}>
    {/* Red margin line — like a real notebook */}
    <span className="absolute left-12 top-0 h-full w-px" style={{ backgroundColor: colors.coral, opacity: 0.45 }} aria-hidden />

    <WashiTape color={colors.accent} className="-top-2 right-12" rotation={6} width="8rem" />
    <Doodle d={HEART} color={colors.coral} className="top-6 left-3" size={20} filled fillColor={colors.coral} />
    <Doodle d={STAR} color={colors.gold} className="bottom-12 right-8" size={22} filled fillColor={colors.gold} />
    <Doodle d={FLOWER} color={mint} className="bottom-32 right-3" size={24} />

    {/* Date stamp top */}
    <div className="ml-14 flex items-center justify-between">
      <span className="font-marker text-[12px] uppercase tracking-[0.25em]" style={{ color: ink, opacity: 0.6 }}>
        Dear diary —
      </span>
      <TicketStub date={format(new Date(m.happened_at), "MMM d, yyyy")} label={m.category} colors={colors} rotate={-3} />
    </div>

    {/* Bubble title */}
    <div className="ml-14 mt-4">
      <BubbleTitle text={clip(m.title, 20)} bg={colors.gold} ink={ink} rotate={-1} className="!text-[30px] md:!text-[38px]" />
    </div>

    {/* Polaroid in top right, overlapping */}
    <div className="absolute right-6 top-32">
      <Polaroid src={m.photo_url} rotation={6} colors={colors} caption={format(new Date(m.happened_at), "MMM d")} width="9rem" />
    </div>

    {/* Handwritten story — left column, wraps under polaroid */}
    <div className="ml-14 mr-44 mt-6 font-handwritten text-[20px] leading-[1.4]" style={{ color: ink }}>
      {m.story
        ? `"${clip(m.story, 320)}"`
        : `Today was ${m.title.toLowerCase()}. A little day worth keeping forever.`}
    </div>

    {/* People + tags as sticker row */}
    <div className="absolute bottom-12 left-14 flex flex-wrap gap-2">
      <PeopleStickers
        names={(m.who_was_there ?? []).slice(0, 3)}
        tones={[{ bg: colors.coral, ink: "#fff" }, { bg: mint, ink }]}
        rotations={[-4, 3]}
      />
      {m.tags?.slice(0, 2).map((t) => (
        <Sticker key={t} bg={colors.gold} ring="#fff" ink={ink} rotate={-2} size="sm">
          #{t}
        </Sticker>
      ))}
    </div>

    {pageNum}
  </div>
);

/* ─── Layout 5: POCKET — ticket-stub + photo "in pocket" + memo card ─── */
export const PocketLayout = ({ m, colors, ink, paper, mint, tex, pageNum }: MemoryLayoutProps) => {
  const people = (m.who_was_there ?? []).slice(0, 3);
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
        <BubbleTitle text={clip(m.title, 20)} bg={mint} ink={ink} rotate={-2} className="!text-[28px] md:!text-[36px]" />
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
          <CutoutPhoto src={m.photo_url} rotate={-4} width="14rem" height="14rem" fallbackBg={colors.accent} fallbackInk={ink} />
        </div>
        {/* "Pocket" label */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
          <TicketStub date={format(new Date(m.happened_at), "MMM d")} label={m.category} colors={colors} rotate={3} />
        </div>
      </div>

      {/* Memo card (sticky note) */}
      <div className="mt-12 flex justify-center">
        <StickyNote
          text={m.story ? `"${clip(m.story, 130)}"` : `A little ${m.category} memory.`}
          rotation={-2}
          color={colors.coral}
          ink="#fff"
          maxWidth="320px"
        />
      </div>

      {/* People stickers */}
      {people.length > 0 && (
        <div className="absolute bottom-10 left-6 flex flex-wrap gap-2">
          <PeopleStickers names={people} tones={[{ bg: colors.gold, ink }, { bg: mint, ink }]} rotations={[-3, 4]} />
        </div>
      )}

      {pageNum}
    </div>
  );
};
