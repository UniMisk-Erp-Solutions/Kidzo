import type { BookTemplateColors } from "@/hooks/useBookTemplates";
import type { ScrapbookFlavor } from "../pageTypes";

/** Decorative building blocks shared by every book page layout (washi tape, doodles, stickers, photo frames). */

/* ─────────────────────────────────────────── Decorative atoms ───────── */

export const WashiTape = ({
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

export const Doodle = ({
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

export const STAR = "M12 3l2.4 5.6 6 .5-4.6 4 1.4 5.9-5.2-3.2-5.2 3.2 1.4-5.9-4.6-4 6-.5z";
export const HEART = "M12 21s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.7-7 10-7 10z";
export const SWIRL = "M4 12c2-6 14-6 16 0s-14 6-12 0";
export const SPARKLE = "M12 4v4M12 16v4M4 12h4M16 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6";
export const ARROW = "M3 12c5-6 12-6 18 0M16 8l5 4-5 4";
export const FLOWER = "M12 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M5 19l4-4M15 9l4-4";
export const SUN = "M12 4v3M12 17v3M4 12h3M17 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z";
export const CLOUD = "M6 16a4 4 0 1 1 .8-7.9A5 5 0 0 1 17 8a4 4 0 0 1 0 8z";

/** A small floating sticker badge with a chunky outline — like punched-out cardstock. */
export const Sticker = ({
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
        // a real border (not an inset shadow): html2canvas paints inset shadows as a solid fill in the PDF
        border: `2px solid ${ring}`,
        boxShadow: "0 2px 4px rgba(0,0,0,0.18)",
        lineHeight: 1.3,
        transform: `rotate(${rotate}deg)`,
      }}
    >
      {children}
    </span>
  );
};

/** A photo styled as a paper cutout — white deckle border, drop shadow, rotation. */
export const CutoutPhoto = ({
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

export const Polaroid = ({
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

export const TicketStub = ({
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

export const StickyNote = ({
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
export const BubbleTitle = ({
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
    className={`cutout-shadow inline-block px-4 py-1.5 font-handwritten text-[34px] font-bold md:text-[44px] ${className}`}
    style={{
      backgroundColor: bg,
      color: ink,
      transform: `rotate(${rotate}deg)`,
      letterSpacing: "0.02em",
      borderRadius: "8px",
      // real border + roomy line box so the PDF capture keeps the text centred in the box
      border: "3px solid #fff",
      lineHeight: 1.25,
      boxShadow: "0 4px 10px rgba(0,0,0,0.18)",
    }}
  >
    {text}
  </span>
);


export const COVER_TAGLINE: Record<ScrapbookFlavor, string> = {
  "timeline": "A scrapbook of the year",
  "first-year": "Baby's first chapter",
  "birthday": "Year by year, candle by candle",
  "holiday": "Cozy days & holiday glow",
  "everyday": "The little, lovely days",
  "mosaic": "Many memories, one mosaic",
  "collage-zine": "A zine of small wonders",
  "pocket-album": "Polaroids in every pocket",
  "road-trail": "The road of our memories",
  "kraft": "Pressed between the pages",
  "filmroll": "Frame by frame, our story",
  "newsprint": "Extra! Extra! Our big news",
};

/** Pick a paper texture class based on flavor — gives each template a personality. */
export function paperTextureFor(flavor: ScrapbookFlavor): string {
  switch (flavor) {
    case "first-year": return "paper-dots";
    case "birthday": return "paper-grain";
    case "holiday": return "paper-gingham";
    case "everyday": return "paper-ruled";
    case "kraft": return "paper-kraft";
    default: return "paper-grain";
  }
}

