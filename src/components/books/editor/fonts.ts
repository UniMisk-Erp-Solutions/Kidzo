/** Font library for the book editor (Google Fonts, loaded on demand).
 *  Only fonts the user actually picks are fetched for the page; the picker loads the whole list once, on open. */

export type FontGroup = "Handwriting" | "Script" | "Fun" | "Elegant" | "Typewriter";

export const FONT_LIBRARY: { family: string; group: FontGroup }[] = [
  // Handwriting — the classic scrapbook look
  { family: "Caveat", group: "Handwriting" },
  { family: "Shadows Into Light", group: "Handwriting" },
  { family: "Indie Flower", group: "Handwriting" },
  { family: "Patrick Hand", group: "Handwriting" },
  { family: "Gloria Hallelujah", group: "Handwriting" },
  { family: "Kalam", group: "Handwriting" },
  { family: "Reenie Beanie", group: "Handwriting" },
  { family: "Covered By Your Grace", group: "Handwriting" },
  { family: "Homemade Apple", group: "Handwriting" },
  { family: "Rock Salt", group: "Handwriting" },
  { family: "Nanum Pen Script", group: "Handwriting" },
  { family: "Gaegu", group: "Handwriting" },
  { family: "Mansalva", group: "Handwriting" },
  { family: "Just Another Hand", group: "Handwriting" },
  { family: "Gochi Hand", group: "Handwriting" },
  // Script — pretty, flowing
  { family: "Pacifico", group: "Script" },
  { family: "Dancing Script", group: "Script" },
  { family: "Satisfy", group: "Script" },
  { family: "Sacramento", group: "Script" },
  { family: "Great Vibes", group: "Script" },
  { family: "Cookie", group: "Script" },
  { family: "Courgette", group: "Script" },
  { family: "Allura", group: "Script" },
  { family: "Alex Brush", group: "Script" },
  { family: "Parisienne", group: "Script" },
  { family: "Yellowtail", group: "Script" },
  { family: "Kaushan Script", group: "Script" },
  { family: "Lobster", group: "Script" },
  // Fun & bold — headlines, stickers
  { family: "Permanent Marker", group: "Fun" },
  { family: "Amatic SC", group: "Fun" },
  { family: "Bangers", group: "Fun" },
  { family: "Chewy", group: "Fun" },
  { family: "Fredoka", group: "Fun" },
  { family: "Baloo 2", group: "Fun" },
  { family: "Londrina Solid", group: "Fun" },
  { family: "Luckiest Guy", group: "Fun" },
  { family: "Boogaloo", group: "Fun" },
  { family: "Shrikhand", group: "Fun" },
  { family: "Righteous", group: "Fun" },
  { family: "Sniglet", group: "Fun" },
  // Elegant — serif & display
  { family: "Playfair Display", group: "Elegant" },
  { family: "DM Serif Display", group: "Elegant" },
  { family: "Abril Fatface", group: "Elegant" },
  { family: "Cormorant Garamond", group: "Elegant" },
  { family: "Lora", group: "Elegant" },
  { family: "Bebas Neue", group: "Elegant" },
  // Typewriter
  { family: "Special Elite", group: "Typewriter" },
  { family: "Cutive Mono", group: "Typewriter" },
  { family: "Courier Prime", group: "Typewriter" },
];

const cssUrl = (families: string[]) =>
  `https://fonts.googleapis.com/css2?${families.map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}`).join("&")}&display=swap`;

const requested = new Set<string>();

/** Adds the Google Fonts stylesheet for these families (once each) and resolves when they are usable. */
export async function loadFonts(families: string[]): Promise<void> {
  if (typeof document === "undefined") return;
  const known = new Set(FONT_LIBRARY.map((f) => f.family));
  const fresh = Array.from(new Set(families)).filter((f) => known.has(f) && !requested.has(f));
  if (fresh.length > 0) {
    fresh.forEach((f) => requested.add(f));
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssUrl(fresh);
    document.head.appendChild(link);
    await new Promise<void>((resolve) => {
      link.onload = () => resolve();
      link.onerror = () => resolve();
      setTimeout(resolve, 4000);
    });
  }
  try {
    await Promise.all(
      Array.from(new Set(families))
        .filter((f) => known.has(f))
        .map((f) => document.fonts.load(`24px "${f}"`)),
    );
  } catch {
    /* a font that fails to load just falls back */
  }
}

/** CSS font-family value for a picked family, with a safe fallback. */
export const fontStack = (family: string) => `'${family}', cursive`;
