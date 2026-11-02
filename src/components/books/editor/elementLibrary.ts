/** Element library for the book editor: a hand-made scrapbook kit (SVG, no network) and a web search
 *  for stickers & emoji via Iconify (https://iconify.design — a free, key-less icon API).
 *
 *  Every library item is added to the page as an image element holding an SVG *data URL*, so the page
 *  keeps working offline, in the PDF export and in the saved book without depending on the network. */

export type KitItem = {
  id: string;
  label: string;
  group: "Washi tape" | "Doodles" | "Paper & stamps";
  /** Size when added to the page (design px; the SVG's aspect ratio is preserved). */
  w: number;
  h: number;
  svg: string;
};

const ink = "#3E3E42";
const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;

export const svgDataUrl = (markup: string) => `data:image/svg+xml;utf8,${encodeURIComponent(markup)}`;

/* ── Washi tape: torn ends + a pattern ── */
type TapePattern = "stripes" | "dots" | "gingham" | "solid";
const TAPE_PATH = "M6 6 L14 0 L22 6 L30 0 L38 6 L46 0 L54 6 L62 0 L70 6 L78 0 L86 6 L94 0 L102 6 L110 0 L118 6 L126 0 L134 6 L142 0 L150 6 L158 0 L166 6 L174 0 L182 6 L190 0 L196 4 L190 12 L196 22 L190 32 L196 42 L190 50 L182 44 L174 50 L166 44 L158 50 L150 44 L142 50 L134 44 L126 50 L118 44 L110 50 L102 44 L94 50 L86 44 L78 50 L70 44 L62 50 L54 44 L46 50 L38 44 L30 50 L22 44 L14 50 L8 42 L14 32 L8 22 L14 12 Z";
function tape(color: string, pattern: TapePattern) {
  const id = `p${Math.random().toString(36).slice(2, 7)}`;
  let overlay = "";
  if (pattern === "stripes") {
    overlay = `<defs><pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="14" fill="#fff" fill-opacity=".45"/></pattern></defs><path d="${TAPE_PATH}" fill="url(#${id})"/>`;
  } else if (pattern === "dots") {
    overlay = `<defs><pattern id="${id}" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r="3" fill="#fff" fill-opacity=".7"/></pattern></defs><path d="${TAPE_PATH}" fill="url(#${id})"/>`;
  } else if (pattern === "gingham") {
    overlay = `<defs><pattern id="${id}" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="10" height="20" fill="#fff" fill-opacity=".35"/><rect width="20" height="10" fill="#fff" fill-opacity=".35"/></pattern></defs><path d="${TAPE_PATH}" fill="url(#${id})"/>`;
  }
  return svg(200, 50, `<path d="${TAPE_PATH}" fill="${color}" fill-opacity=".92"/>${overlay}`);
}

const TAPES: { id: string; label: string; color: string; pattern: TapePattern }[] = [
  { id: "tape-pink-stripes", label: "Pink stripes", color: "#F4B6C2", pattern: "stripes" },
  { id: "tape-butter-dots", label: "Butter dots", color: "#F7E3A1", pattern: "dots" },
  { id: "tape-sage-gingham", label: "Sage gingham", color: "#B9D4B0", pattern: "gingham" },
  { id: "tape-lavender", label: "Lavender", color: "#CDBDF2", pattern: "solid" },
  { id: "tape-sky-stripes", label: "Sky stripes", color: "#B5D8F2", pattern: "stripes" },
  { id: "tape-peach-dots", label: "Peach dots", color: "#F9C9A8", pattern: "dots" },
  { id: "tape-terracotta-gingham", label: "Terracotta gingham", color: "#D98B73", pattern: "gingham" },
  { id: "tape-cream", label: "Cream", color: "#F3E9D2", pattern: "solid" },
];

/* ── Hand-drawn doodles ── */
const stroke = (d: string, color = ink, w = 4) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

const doodles: KitItem[] = [
  {
    id: "doodle-squiggle", label: "Squiggle", group: "Doodles", w: 220, h: 50,
    svg: svg(220, 50, stroke("M8 28 C 24 6, 40 50, 56 26 S 88 4, 104 28 S 136 50, 152 26 S 184 6, 212 26", "#E36363", 5)),
  },
  {
    id: "doodle-underline", label: "Underline", group: "Doodles", w: 220, h: 36,
    svg: svg(220, 36, stroke("M6 22 C 50 8, 90 30, 130 16 S 190 22, 214 12", ink, 5) + stroke("M20 30 C 70 22, 120 32, 190 26", ink, 3)),
  },
  {
    id: "doodle-circle", label: "Scribble circle", group: "Doodles", w: 200, h: 160,
    svg: svg(200, 160, stroke("M170 40 C 150 8, 60 2, 28 44 C -4 88, 40 150, 108 148 C 170 146, 196 98, 176 54 C 168 36, 140 22, 108 20", "#7A5CD6", 4)),
  },
  {
    id: "doodle-arrow", label: "Curvy arrow", group: "Doodles", w: 180, h: 120,
    svg: svg(180, 120, stroke("M12 100 C 30 30, 100 10, 160 40", ink, 5) + stroke("M132 18 L162 40 L130 62", ink, 5)),
  },
  {
    id: "doodle-heart", label: "Heart outline", group: "Doodles", w: 130, h: 120,
    svg: svg(130, 120, stroke("M65 108 C 10 70, 6 28, 36 18 C 54 12, 62 26, 65 34 C 68 26, 78 12, 96 18 C 124 28, 120 70, 65 108 Z", "#E36363", 5)),
  },
  {
    id: "doodle-star", label: "Star outline", group: "Doodles", w: 130, h: 126,
    svg: svg(130, 126, stroke("M65 10 L81 46 L120 50 L91 76 L99 114 L65 94 L31 114 L39 76 L10 50 L49 46 Z", "#E0A526", 5)),
  },
  {
    id: "doodle-sparkles", label: "Sparkles", group: "Doodles", w: 160, h: 140,
    svg: svg(160, 140,
      `<path d="M60 8 Q64 50 106 56 Q64 62 60 104 Q56 62 14 56 Q56 50 60 8Z" fill="#F2C94C"/>` +
      `<path d="M120 70 Q122 90 142 94 Q122 98 120 118 Q118 98 98 94 Q118 90 120 70Z" fill="#F4A6C0"/>` +
      `<path d="M128 14 Q129 24 139 26 Q129 28 128 38 Q127 28 117 26 Q127 24 128 14Z" fill="#8FB8E8"/>`),
  },
  {
    id: "doodle-flower", label: "Daisy", group: "Doodles", w: 140, h: 140,
    svg: svg(140, 140,
      Array.from({ length: 8 }, (_, i) => `<ellipse cx="70" cy="30" rx="13" ry="26" fill="#fff" stroke="${ink}" stroke-width="3" transform="rotate(${i * 45} 70 70)"/>`).join("") +
      `<circle cx="70" cy="70" r="16" fill="#F2C94C" stroke="${ink}" stroke-width="3"/>`),
  },
  {
    id: "doodle-sun", label: "Sun", group: "Doodles", w: 140, h: 140,
    svg: svg(140, 140,
      Array.from({ length: 10 }, (_, i) => `<line x1="70" y1="10" x2="70" y2="26" stroke="#E0A526" stroke-width="5" stroke-linecap="round" transform="rotate(${i * 36} 70 70)"/>`).join("") +
      `<circle cx="70" cy="70" r="30" fill="#F7D774" stroke="#E0A526" stroke-width="4"/>`),
  },
  {
    id: "doodle-cloud", label: "Cloud", group: "Doodles", w: 170, h: 110,
    svg: svg(170, 110, `<path d="M40 88 C 6 88, 6 48, 38 46 C 40 18, 84 8, 98 34 C 124 22, 156 42, 144 70 C 160 84, 148 90, 130 88 Z" fill="#fff" stroke="#8FB8E8" stroke-width="5" stroke-linejoin="round"/>`),
  },
  {
    id: "doodle-confetti", label: "Confetti", group: "Doodles", w: 200, h: 120,
    svg: svg(200, 120, [
      ["#F4A6C0", 20, 30, 20], ["#F2C94C", 70, 80, -30], ["#8FB8E8", 120, 24, 40], ["#B9D4B0", 170, 70, -10],
      ["#CDBDF2", 40, 96, 60], ["#F9C9A8", 100, 56, 15], ["#E36363", 160, 18, -50], ["#F2C94C", 186, 104, 25],
    ].map(([c, x, y, r]) => `<rect x="${x}" y="${y}" width="16" height="7" rx="3" fill="${c}" transform="rotate(${r} ${Number(x) + 8} ${Number(y) + 3})"/>`).join("")),
  },
  {
    id: "doodle-bow", label: "Ribbon bow", group: "Doodles", w: 160, h: 120,
    svg: svg(160, 120, `<path d="M80 56 C 50 10, 8 14, 14 52 C 18 84, 56 78, 80 62 Z" fill="#F4A6C0" stroke="${ink}" stroke-width="3"/><path d="M80 56 C 110 10, 152 14, 146 52 C 142 84, 104 78, 80 62 Z" fill="#F4A6C0" stroke="${ink}" stroke-width="3"/><path d="M76 64 L52 112 L72 104 L80 116 L88 104 L108 112 L84 64 Z" fill="#E88AA8" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><circle cx="80" cy="58" r="12" fill="#E88AA8" stroke="${ink}" stroke-width="3"/>`),
  },
  /* ── Paper & stamps ── */
  {
    id: "paper-torn", label: "Torn paper", group: "Paper & stamps", w: 240, h: 170,
    svg: svg(240, 170, `<path d="M10 14 L40 8 L70 16 L104 6 L140 16 L176 8 L210 16 L232 10 L228 60 L234 100 L226 140 L232 160 L196 154 L160 162 L120 154 L84 162 L48 154 L12 160 L18 118 L8 80 L16 44 Z" fill="#F7F0E0" stroke="#E2D6BB" stroke-width="2"/>` + [44, 68, 92, 116].map((y) => `<line x1="30" y1="${y}" x2="206" y2="${y}" stroke="#C9D6E8" stroke-width="2"/>`).join("")),
  },
  {
    id: "paper-sticky", label: "Sticky note", group: "Paper & stamps", w: 190, h: 190,
    svg: svg(190, 190, `<path d="M10 12 L176 8 L182 168 L18 182 Z" fill="#FBE98A"/><path d="M12 16 L178 12" stroke="#EBD36A" stroke-width="10" opacity=".5"/>`),
  },
  {
    id: "paper-ticket", label: "Ticket stub", group: "Paper & stamps", w: 230, h: 100,
    svg: svg(230, 100, `<path d="M8 8 H222 V36 A14 14 0 0 0 222 64 V92 H8 V64 A14 14 0 0 0 8 36 Z" fill="#F4A6C0" stroke="#E88AA8" stroke-width="3"/><line x1="160" y1="12" x2="160" y2="88" stroke="#fff" stroke-width="3" stroke-dasharray="6 6"/><text x="82" y="58" text-anchor="middle" font-family="Georgia,serif" font-size="26" font-weight="700" fill="#fff">ADMIT ONE</text>`),
  },
  {
    id: "paper-stamp", label: "Postage stamp", group: "Paper & stamps", w: 150, h: 180,
    svg: svg(150, 180,
      `<path d="${(() => {
        // scalloped border
        let d = "M6 6";
        for (let x = 6; x < 144; x += 12) d += ` a6 6 0 0 0 12 0`;
        for (let y = 6; y < 174; y += 12) d += ` a6 6 0 0 0 0 12`;
        for (let x = 144; x > 6; x -= 12) d += ` a6 6 0 0 0 -12 0`;
        for (let y = 174; y > 6; y -= 12) d += ` a6 6 0 0 0 0 -12`;
        return d + " Z";
      })()}" fill="#fff" stroke="#D9CFBA" stroke-width="2"/><rect x="22" y="22" width="106" height="120" fill="#CFE3F5"/><circle cx="75" cy="68" r="20" fill="#F7D774"/><path d="M22 142 L56 98 L84 126 L104 108 L128 142 Z" fill="#B9D4B0"/><text x="75" y="164" text-anchor="middle" font-family="Georgia,serif" font-size="12" fill="${ink}">POST · 2007</text>`),
  },
  {
    id: "paper-clip", label: "Paper clip", group: "Paper & stamps", w: 70, h: 160,
    svg: svg(70, 160, stroke("M46 54 V122 A16 16 0 0 1 14 122 V34 A22 22 0 0 1 58 34 V112", "#9AA3AE", 6)),
  },
  {
    id: "paper-pin", label: "Push pin", group: "Paper & stamps", w: 70, h: 90,
    svg: svg(70, 90, `<line x1="35" y1="44" x2="35" y2="84" stroke="#8A8F99" stroke-width="5" stroke-linecap="round"/><circle cx="35" cy="30" r="24" fill="#E36363"/><circle cx="27" cy="22" r="7" fill="#fff" fill-opacity=".55"/>`),
  },
  {
    id: "paper-corners", label: "Photo corners", group: "Paper & stamps", w: 220, h: 160,
    svg: svg(220, 160, [
      `<path d="M6 6 H52 L6 52 Z"/>`, `<path d="M214 6 H168 L214 52 Z"/>`, `<path d="M6 154 H52 L6 108 Z"/>`, `<path d="M214 154 H168 L214 108 Z"/>`,
    ].map((p) => p.replace("<path", `<path fill="#3E3E42" fill-opacity=".85"`)).join("")),
  },
];

export const SCRAPBOOK_KIT: KitItem[] = [
  ...TAPES.map<KitItem>((t) => ({
    id: t.id,
    label: t.label,
    group: "Washi tape",
    w: 200,
    h: 50,
    svg: tape(t.color, t.pattern),
  })),
  ...doodles,
];

/* ── Web search (Iconify) ──
 * Licences matter for a printed keepsake, so only sets with permissive licences are searched:
 *   noto (Apache-2.0), fluent-emoji-flat (MIT), flat-color-icons (MIT) for colourful stickers,
 *   ph (MIT) for outline icons. */
export type WebStyle = "colorful" | "outline";
const PREFIXES: Record<WebStyle, string> = {
  colorful: "noto,fluent-emoji-flat,flat-color-icons",
  outline: "ph",
};

export async function searchWebElements(query: string, style: WebStyle, signal?: AbortSignal): Promise<string[]> {
  const q = query.trim();
  if (!q) return [];
  const res = await fetch(
    `https://api.iconify.design/search?query=${encodeURIComponent(q)}&limit=72&prefixes=${PREFIXES[style]}`,
    { signal },
  );
  if (!res.ok) throw new Error("Search failed");
  const data = (await res.json()) as { icons?: string[] };
  return data.icons ?? [];
}

/** URL of a search result as an image (for the thumbnail grid). */
export const webElementUrl = (icon: string, color?: string) => {
  const [prefix, name] = icon.split(":");
  return `https://api.iconify.design/${prefix}/${name}.svg${color ? `?color=${encodeURIComponent(color)}` : ""}`;
};

/** Downloads the SVG and returns it as a data URL so it is stored with the page. */
export async function webElementToDataUrl(icon: string, color?: string): Promise<string> {
  const res = await fetch(webElementUrl(icon, color));
  if (!res.ok) throw new Error("Couldn't download that element");
  const text = await res.text();
  if (!text.trim().startsWith("<svg")) throw new Error("Unexpected response");
  return svgDataUrl(text);
}

export const TRENDING_SEARCHES = [
  "heart", "star", "flower", "butterfly", "rainbow", "cake", "balloon", "camera",
  "teddy bear", "moon", "cloud", "gift", "sparkles", "baby", "crown", "unicorn",
];
