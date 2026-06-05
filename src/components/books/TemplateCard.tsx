import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BookTemplate } from "@/hooks/useBookTemplates";
import type { Memory } from "@/hooks/useMemories";
import { BookPageFrame, buildPages } from "./BookPages";

const CATEGORY_LABEL: Record<string, string> = {
  timeline: "Timeline",
  "0-12m": "First Year",
  birthday: "Birthday Book",
  seasonal: "Holiday",
  everyday: "Everyday",
};

interface Props {
  template: BookTemplate;
  onSelect: (t: BookTemplate) => void;
  onPreview: (t: BookTemplate) => void;
}

/** Build 2 lightweight mock memories so the card carousel can render real
 *  collage spreads (cover + 2 memory pages) using the actual BookPageView. */
function buildMockMemories(template: BookTemplate): Memory[] {
  const now = new Date();
  const last = new Date(now);
  last.setMonth(last.getMonth() - 4);
  const earlier = new Date(now);
  earlier.setMonth(earlier.getMonth() - 9);

  const flavorByCat: Record<string, { title1: string; title2: string; story1: string; story2: string }> = {
    timeline: {
      title1: "First snow",
      title2: "Beach day",
      story1: "We bundled up and made the world's tiniest snowman together.",
      story2: "Sand in every pocket and the biggest smile of the summer.",
    },
    "0-12m": {
      title1: "First giggle",
      title2: "First steps",
      story1: "It started as a hiccup and ended in the loudest belly laugh.",
      story2: "Wobbly, brave, and impossibly proud of yourself.",
    },
    birthday: {
      title1: "Cake smash",
      title2: "Party balloons",
      story1: "Frosting from your eyebrows to your toes.",
      story2: "All your favourite people in one bright room.",
    },
    seasonal: {
      title1: "Cozy mornings",
      title2: "Twinkly nights",
      story1: "Hot cocoa, fuzzy socks and a stack of new books.",
      story2: "We watched the lights come on, hand in tiny hand.",
    },
    everyday: {
      title1: "Pancake Sunday",
      title2: "Park afternoon",
      story1: "You insisted on a smiley face out of blueberries.",
      story2: "Three swings, two slides and one giant dandelion.",
    },
  };
  const f = flavorByCat[template.category] ?? flavorByCat.timeline;

  const base = {
    user_id: "preview",
    child_id: "preview",
    photo_url: null,
    reaction: null,
    created_at: now.toISOString(),
  };

  return [
    {
      ...base,
      id: `mock-1-${template.id}`,
      title: f.title1,
      story: f.story1,
      happened_at: earlier.toISOString(),
      category: template.category === "0-12m" ? "Milestone" : "Memory",
      who_was_there: ["Mom", "Dad"],
      tags: ["love"],
    } as Memory,
    {
      ...base,
      id: `mock-2-${template.id}`,
      title: f.title2,
      story: f.story2,
      happened_at: last.toISOString(),
      category: "Adventure",
      who_was_there: ["Grandma"],
      tags: ["fun"],
    } as Memory,
  ];
}

/**
 * Scrapbook-style template card with a swipeable 3-page sample carousel
 * (cover → memory spread 1 → memory spread 2). Uses the same BookPageView
 * the final book uses, so the preview is always WYSIWYG.
 */
export const TemplateCard = ({ template, onSelect, onPreview }: Props) => {
  const c = template.color_scheme;
  const ink = c.ink ?? c.text ?? "#3E3E42";
  const mint = c.mint ?? c.accent;
  const swatches = [c.primary, c.accent, c.gold, c.coral, mint];

  const [slide, setSlide] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  const samplePages = useMemo(() => {
    const memories = buildMockMemories(template);
    const all = buildPages({
      title: template.name.split("·")[0].trim(),
      subtitle: template.description.slice(0, 60),
      childName: "Sweet Pea",
      childDob: undefined,
      template,
      memories,
    });
    // Pick: cover (0), and 2 memory pages
    const memoryPages = all.filter((p) => p.kind === "memory").slice(0, 2);
    return [all[0], ...memoryPages].filter(Boolean);
  }, [template]);

  // Autoplay
  useEffect(() => {
    if (!autoplay || samplePages.length <= 1) return;
    const t = setInterval(() => {
      setSlide((s) => (s + 1) % samplePages.length);
    }, 3500);
    return () => clearInterval(t);
  }, [autoplay, samplePages.length]);

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAutoplay(false);
    setSlide((s) => (s - 1 + samplePages.length) % samplePages.length);
  };
  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAutoplay(false);
    setSlide((s) => (s + 1) % samplePages.length);
  };

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lift hover:border-primary/40",
      )}
      onMouseEnter={() => setAutoplay(false)}
      onMouseLeave={() => setAutoplay(true)}
    >
      {/* Live carousel preview using BookPageFrame */}
      <button
        type="button"
        onClick={() => onPreview(template)}
        className="relative block aspect-[4/3] w-full overflow-hidden"
        style={{ backgroundColor: c.primary }}
        aria-label={`Preview ${template.name}`}
      >
        {/* Stack each page absolutely; fade between them */}
        {samplePages.map((page, idx) => (
          <div
            key={idx}
            className="absolute inset-0 transition-opacity duration-500"
            style={{ opacity: idx === slide ? 1 : 0, pointerEvents: idx === slide ? "auto" : "none" }}
          >
            <BookPageFrame page={page} colors={c} className="h-full w-full" />
          </div>
        ))}

        {/* Carousel controls */}
        {samplePages.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 rounded-full bg-card/95 p-1 shadow-soft opacity-0 transition group-hover:opacity-100"
              aria-label="Previous sample page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-card/95 p-1 shadow-soft opacity-0 transition group-hover:opacity-100"
              aria-label="Next sample page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
              {samplePages.map((_, idx) => (
                <span
                  key={idx}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    idx === slide ? "w-4 bg-foreground/80" : "w-1.5 bg-foreground/30",
                  )}
                  aria-hidden
                />
              ))}
            </div>
          </>
        )}

        {template.is_premium && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground shadow-soft">
            <Sparkles className="h-3 w-3" />
            Premium
          </span>
        )}

        {/* Sample-page label */}
        <span
          className="absolute left-2 top-2 rounded-full bg-card/95 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground shadow-soft"
          aria-hidden
        >
          {slide === 0 ? "Cover" : `Spread ${slide}`}
        </span>
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-[15px] font-semibold leading-tight text-foreground">{template.name}</h3>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {CATEGORY_LABEL[template.category] ?? template.category} · {template.pages_needed} pages
          </p>
        </div>

        <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {template.description}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3">
          <div className="flex items-center -space-x-1.5">
            {swatches.map((sw, i) => (
              <span
                key={i}
                className="h-5 w-5 rounded-full border-2 border-card"
                style={{ backgroundColor: sw }}
                aria-hidden
              />
            ))}
          </div>

          <Button size="sm" variant="warm" onClick={() => onSelect(template)}>
            Select
          </Button>
        </div>
      </div>
    </article>
  );
};

// Re-export type for legacy imports (kept from old file)
export { type BookTemplate };
