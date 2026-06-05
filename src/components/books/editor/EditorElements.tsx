/** Pure renderer for editor elements — used both inside the editor and for read-only display in BookPageFrame and the PDF export. */

import type { EditorElement, StickerElement, StickerShape, TapeElement } from "./types";

// Most paths designed in a 24×24 viewBox
const STAR = "M12 3l2.4 5.6 6 .5-4.6 4 1.4 5.9-5.2-3.2-5.2 3.2 1.4-5.9-4.6-4 6-.5z";
const HEART = "M12 21s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.7-7 10-7 10z";
const SWIRL = "M4 12c2-6 14-6 16 0s-14 6-12 0";
const SPARKLE = "M12 4v4M12 16v4M4 12h4M16 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6";
const ARROW = "M3 12c5-6 12-6 18 0M16 8l5 4-5 4";
const FLOWER =
  "M12 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M5 19l4-4M15 9l4-4";
const SUN = "M12 4v3M12 17v3M4 12h3M17 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z";
const CLOUD = "M6 16a4 4 0 1 1 .8-7.9A5 5 0 0 1 17 8a4 4 0 0 1 0 8z";
const MOON = "M20 14a8 8 0 1 1-9-9 6.5 6.5 0 0 0 9 9z";
const BALLOON = "M12 3a5 5 0 0 1 5 5c0 4-5 8-5 8s-5-4-5-8a5 5 0 0 1 5-5zM11 16l1 5 1-5";
const CAKE = "M5 12h14v8H5zM5 12V9a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3M9 6V3M12 6V3M15 6V3";
const GIFT = "M3 8h18v4H3zM5 12v9h14v-9M12 8v13M8 8a2 2 0 1 1 2-3c0 1 1 3 2 3-1 0-2 2-2 3a2 2 0 1 1-2-3z";
const SMILEY = "M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zM8 10v.5M16 10v.5M8 14c1 2 3 3 4 3s3-1 4-3";
const LIGHTNING = "M13 2L4 14h7l-2 8 9-12h-7z";
const LEAF = "M5 19c0-9 8-15 16-15-1 9-7 15-16 15zM5 19l5-5";
const MUSIC = "M9 18V5l12-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zM21 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3z";
const RAINBOW = "M3 18a9 9 0 0 1 18 0M5 18a7 7 0 0 1 14 0M7 18a5 5 0 0 1 10 0M9 18a3 3 0 0 1 6 0";
const CHECKMARK = "M5 12l5 5L20 7";
const PIN = "M12 2a6 6 0 0 0-6 6c0 5 6 13 6 13s6-8 6-13a6 6 0 0 0-6-6zM12 6a2 2 0 1 1 0 4 2 2 0 0 1 0-4z";
const RIBBON = "M5 3l7 9 7-9M12 12v9l-3-3M12 21l3-3";
const CIRCLE = "M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20z";
const SQUARE = "M3 3h18v18H3z";
const TRIANGLE = "M12 3l10 18H2z";
const DIAMOND = "M12 2l10 10-10 10L2 12z";
const SPEECH = "M3 5h18v12h-9l-5 4v-4H3z";
const THOUGHT = "M5 8a4 4 0 0 1 7-2 5 5 0 0 1 7 6 4 4 0 0 1-4 4h-7a4 4 0 0 1-3-8zM5 19a1.5 1.5 0 1 1 0 .01M3 22a1 1 0 1 1 0 .01";
const CROWN = "M3 8l4 8 5-9 5 9 4-8v12H3z";
const ROCKET = "M14 2c4 0 8 4 8 8l-6 6-2-2 2-2-4-4-2 2-2-2 6-6zM4 20l4-4M2 22l4-4";
const BUTTERFLY = "M12 12c-3-6-9-6-9-2s3 6 9 4M12 12c3-6 9-6 9-2s-3 6-9 4M12 4v16";
const ROSE = "M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM12 12c0 4-4 8-4 8M12 12c0 4 4 8 4 8M8 14c-2 0-3 2-2 4M16 14c2 0 3 2 2 4";
const TREE = "M12 2l5 7h-3l4 6h-4l3 5H7l3-5H6l4-6H7zM11 20h2v3h-2z";
const UMBRELLA = "M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9zM12 12v8a2 2 0 0 1-4 0";
const SNOWFLAKE = "M12 2v20M2 12h20M5 5l14 14M19 5L5 19M9 4l3 2 3-2M9 20l3-2 3 2M4 9l2 3-2 3M20 9l-2 3 2 3";
const FIRE = "M12 3c-2 4-6 6-6 11a6 6 0 0 0 12 0c0-3-2-4-3-7-1 2-2 3-3 0 0-2 0-2 0-4z";
const DROP = "M12 3c-3 6-7 9-7 13a7 7 0 0 0 14 0c0-4-4-7-7-13z";
const EYE = "M2 12c4-7 16-7 20 0-4 7-16 7-20 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z";
const HAND = "M7 11V5a2 2 0 0 1 4 0v6M11 11V4a2 2 0 0 1 4 0v7M15 11V6a2 2 0 0 1 4 0v9c0 5-3 7-7 7s-7-2-9-7l-2-4 4 1 2 4";
const THUMBSUP = "M2 12h4v10H2zM6 12l4-9c2 0 3 1 3 3v3h6a2 2 0 0 1 2 2l-2 8a2 2 0 0 1-2 2H6";
const PEACE = "M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zM12 2v20M12 12l-7 7M12 12l7 7";
const DIAMONDRING = "M9 4h6l4 5-7 11L5 9zM9 4l3 5 3-5M5 9h14";
const GEM = "M3 9l4-5h10l4 5-9 12zM7 4l5 5 5-5M3 9h18";
const TROPHY = "M7 4h10v5a5 5 0 0 1-10 0zM7 6H3v2a3 3 0 0 0 3 3M17 6h4v2a3 3 0 0 1-3 3M9 14h6v3H9zM7 17h10v3H7z";
const MEDAL = "M8 2l4 7 4-7M12 9a6 6 0 1 1 0 12 6 6 0 0 1 0-12zM12 13v4M10 15h4";
const TICKET = "M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z";
const KEY = "M14 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM10 12H2M5 12v3M8 12v2";
const LOCK = "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4";
const BELL = "M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0";
const CAMERA = "M3 7h4l2-2h6l2 2h4v12H3zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8z";
const PAPERPLANE = "M22 2L2 11l8 3 3 8z";
const COMPASS = "M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zM16 8l-2 6-6 2 2-6z";

const SHAPE_PATH: Record<StickerShape, string> = {
  star: STAR,
  heart: HEART,
  sparkle: SPARKLE,
  flower: FLOWER,
  sun: SUN,
  cloud: CLOUD,
  swirl: SWIRL,
  arrow: ARROW,
  moon: MOON,
  balloon: BALLOON,
  cake: CAKE,
  gift: GIFT,
  smiley: SMILEY,
  lightning: LIGHTNING,
  leaf: LEAF,
  music: MUSIC,
  rainbow: RAINBOW,
  checkmark: CHECKMARK,
  pin: PIN,
  ribbon: RIBBON,
  circle: CIRCLE,
  square: SQUARE,
  triangle: TRIANGLE,
  diamond: DIAMOND,
  speech: SPEECH,
  thoughtbubble: THOUGHT,
  crown: CROWN,
  rocket: ROCKET,
  butterfly: BUTTERFLY,
  rose: ROSE,
  tree: TREE,
  umbrella: UMBRELLA,
  snowflake: SNOWFLAKE,
  fire: FIRE,
  drop: DROP,
  eye: EYE,
  hand: HAND,
  thumbsup: THUMBSUP,
  peace: PEACE,
  diamondring: DIAMONDRING,
  gem: GEM,
  trophy: TROPHY,
  medal: MEDAL,
  ticket: TICKET,
  key: KEY,
  lock: LOCK,
  bell: BELL,
  camera: CAMERA,
  paperplane: PAPERPLANE,
  compass: COMPASS,
};

export const ALL_STICKER_SHAPES: StickerShape[] = Object.keys(SHAPE_PATH) as StickerShape[];

function fontFamilyFor(font: string) {
  switch (font) {
    case "handwritten":
      return "var(--font-handwritten, 'Caveat', cursive)";
    case "marker":
      return "var(--font-marker, 'Permanent Marker', cursive)";
    case "printed":
      return "var(--font-printed, 'Special Elite', monospace)";
    default:
      return "Georgia, serif";
  }
}

function tapeBackground(pattern: TapeElement["pattern"]) {
  if (pattern === "stripes")
    return "repeating-linear-gradient(45deg, transparent 0 6px, rgba(255,255,255,0.32) 6px 8px)";
  if (pattern === "dots")
    return "radial-gradient(circle, rgba(255,255,255,0.55) 1.5px, transparent 2px)";
  if (pattern === "checks")
    return "linear-gradient(45deg, rgba(255,255,255,0.4) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.4) 25%, transparent 25%)";
  return "";
}

const cutoutShadow = "0 6px 18px rgba(0,0,0,0.2)";

function elementRadius(el: EditorElement, fallback = 0) {
  return typeof el.radius === "number" ? el.radius : fallback;
}

export function renderElement(el: EditorElement) {
  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: el.x - el.w / 2,
    top: el.y - el.h / 2,
    width: el.w,
    height: el.h,
    boxSizing: "border-box",
    transform: `rotate(${el.rotation}deg)`,
    transformOrigin: "center center",
    pointerEvents: "none",
  };

  switch (el.type) {
    case "text": {
      const t = el as import("./types").TextElement;
      return (
        <div
          style={{
            ...baseStyle,
            fontFamily: fontFamilyFor(t.font),
            fontSize: t.size,
            fontWeight: t.bold ? 700 : 400,
            fontStyle: t.italic ? "italic" : "normal",
            color: t.color,
            background: t.bg ?? "transparent",
            padding: t.bg ? `${t.paddingY ?? 4}px ${t.paddingX ?? 10}px` : 0,
            borderRadius: t.bg ? elementRadius(t, 6) : 0,
            boxShadow: t.shadow ? `${t.ring ? `inset 0 0 0 3px ${t.ring}, ` : ""}0 4px 10px rgba(0,0,0,0.18)` : undefined,
            display: "flex",
            alignItems: "center",
            justifyContent:
              t.align === "left" ? "flex-start" : t.align === "right" ? "flex-end" : "center",
            textAlign: t.align ?? "center",
            lineHeight: 1.15,
            overflow: "hidden",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {t.text}
        </div>
      );
    }
    case "sticker": {
      const path = SHAPE_PATH[el.shape];
      return (
        <svg
          viewBox="0 0 24 24"
          style={baseStyle}
          fill={el.filled ? el.color : "none"}
          stroke={el.color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={path} />
        </svg>
      );
    }
    case "tape":
      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: el.color,
            backgroundImage: tapeBackground(el.pattern),
            backgroundSize:
              el.pattern === "dots" ? "8px 8px" : el.pattern === "checks" ? "10px 10px" : undefined,
            opacity: 0.92,
            boxShadow: "0 2px 4px rgba(0,0,0,0.12), inset 0 0 0 0.5px rgba(0,0,0,0.04)",
            borderRadius: elementRadius(el, 0),
          }}
        />
      );
    case "photo":
      const borderWidth = el.borderWidth ?? (el.frame === "plain" ? 0 : 6);
      const isPolaroid = el.frame === "polaroid" || !!el.caption;
      const cx = el.cropX ?? 0;
      const cy = el.cropY ?? 0;
      const cw = el.cropW ?? 1;
      const ch = el.cropH ?? 1;
      const hasCrop = cx !== 0 || cy !== 0 || cw !== 1 || ch !== 1;
      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: el.borderColor ?? "#fff",
            padding: borderWidth,
            paddingBottom: isPolaroid ? Math.max(borderWidth, 26) : borderWidth,
            boxShadow: el.shadow === false ? undefined : cutoutShadow,
            borderRadius: elementRadius(el, 0),
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              overflow: "hidden",
              borderRadius: Math.max(0, elementRadius(el, 0) - borderWidth),
            }}
          >
            <img
              src={el.src}
              alt=""
              crossOrigin="anonymous"
              style={
                hasCrop
                  ? {
                      position: "absolute",
                      left: `${(-cx / cw) * 100}%`,
                      top: `${(-cy / ch) * 100}%`,
                      width: `${(1 / cw) * 100}%`,
                      height: `${(1 / ch) * 100}%`,
                      objectFit: "cover",
                      display: "block",
                    }
                  : { width: "100%", height: "100%", objectFit: "cover", display: "block" }
              }
            />
          </div>
          {isPolaroid && el.caption && (
            <div
              style={{
                position: "absolute",
                left: borderWidth,
                right: borderWidth,
                bottom: 4,
                color: "#3E3E42",
                fontFamily: fontFamilyFor("handwritten"),
                fontSize: 15,
                textAlign: "center",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              {el.caption}
            </div>
          )}
        </div>
      );
    case "badge":
      if (el.variant === "ticket") {
        return (
          <div
            style={{
              ...baseStyle,
              backgroundColor: el.bg,
              color: el.color,
              boxShadow: "0 2px 4px rgba(0,0,0,0.18)",
              borderRadius: elementRadius(el, 3),
              display: "flex",
              alignItems: "center",
              padding: "8px 16px",
              gap: 12,
              overflow: "visible",
            }}
          >
            <span style={{ position: "absolute", left: -6, top: "50%", width: 12, height: 12, marginTop: -6, borderRadius: 999, background: "currentColor", opacity: 0.18 }} />
            <span style={{ position: "absolute", right: -6, top: "50%", width: 12, height: 12, marginTop: -6, borderRadius: 999, background: "currentColor", opacity: 0.18 }} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
              <span style={{ fontFamily: fontFamilyFor("marker"), fontSize: 9, textTransform: "uppercase", letterSpacing: "0.25em", opacity: 0.7 }}>{el.label ?? "memory"}</span>
              <span style={{ fontFamily: fontFamilyFor("handwritten"), fontWeight: 700, fontSize: 18 }}>{el.text}</span>
            </div>
          </div>
        );
      }
      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: el.bg,
            color: el.color,
            boxShadow: `inset 0 0 0 2px ${el.ring}, 0 2px 4px rgba(0,0,0,0.18)`,
            borderRadius: elementRadius(el, 9999),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: fontFamilyFor("marker"),
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontSize: Math.max(10, Math.min(el.h * 0.45, 18)),
            padding: "0 10px",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {el.text}
        </div>
      );
    case "emoji":
      return (
        <div
          style={{
            ...baseStyle,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: Math.min(el.w, el.h) * 0.85,
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          {el.emoji}
        </div>
      );
  }
}

/** Read-only overlay layer — sits above BookPageView at design canvas resolution. */
export function ElementsOverlay({ elements }: { elements: EditorElement[] }) {
  const sorted = [...elements]
    .filter((e) => !e.hidden)
    .sort((a, b) => a.z - b.z);
  return (
    <div className="pointer-events-none absolute inset-0">
      {sorted.map((el) => (
        <div key={el.id}>{renderElement(el)}</div>
      ))}
    </div>
  );
}
