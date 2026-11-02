import type { BookPage } from "../BookPages";
import {
  ARROW,
  BubbleTitle,
  CLOUD,
  COVER_TAGLINE,
  Doodle,
  FLOWER,
  HEART,
  SPARKLE,
  STAR,
  Sticker,
  SUN,
  SWIRL,
  TicketStub,
  WashiTape,
} from "./bookPageParts";
import type { LayoutTheme } from "./memoryLayouts";

type Kind<K extends BookPage["kind"]> = LayoutTheme & { page: Extract<BookPage, { kind: K }> };

/** Cover page. */
export const CoverPage = ({ page, colors, ink, paper, mint, tex }: Kind<"cover">) => (
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

/** Intro page. */
export const IntroPage = ({ page, colors, ink, paper, mint, tex }: Kind<"intro">) => (
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

/** Chapter divider page. */
export const ChapterPage = ({ page, colors, ink, paper, mint, tex }: Kind<"chapter">) => (
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

/** Back cover page. */
export const BackPage = ({ page, colors, ink, paper, mint, tex }: Kind<"back">) => (
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
