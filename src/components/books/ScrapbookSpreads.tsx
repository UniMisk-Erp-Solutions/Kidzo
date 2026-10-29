import type { CSSProperties } from "react";
import { format } from "date-fns";
import type { Memory } from "@/hooks/useMemories";
import type { BookTemplateColors } from "@/hooks/useBookTemplates";

/**
 * Dense "collage" spreads inspired by aesthetic digital scrapbooks: kraft paper with torn
 * burgundy panels, film-strip rolls and newsprint backgrounds, with ransom-note titles.
 * Every spread is laid out on the fixed 600×800 book canvas using absolute pixel positions
 * (same contract as the other BookPages layouts, so preview and PDF export match).
 */

export type ScrapbookSpreadKind = "kraft-collage" | "film-strip" | "newsprint-collage";

/* ───────────────────────────── helpers ───────────────────────────── */

const rng = (seed: number) => {
  let s = seed % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

/** Jagged "torn paper" polygon points for a w×h box. */
const tornPoints = (w: number, h: number, seed: number) => {
  const r = rng(seed + 7);
  const pts: string[] = [];
  const step = 13;
  for (let x = 0; x <= w; x += step) pts.push(`${x},${(r() * 8).toFixed(1)}`);
  for (let y = 0; y <= h; y += step) pts.push(`${(w - r() * 8).toFixed(1)},${y}`);
  for (let x = w; x >= 0; x -= step) pts.push(`${x},${(h - r() * 8).toFixed(1)}`);
  for (let y = h; y >= 0; y -= step) pts.push(`${(r() * 8).toFixed(1)},${y}`);
  return pts.join(" ");
};

const photoOf = (m?: Memory) => m?.photo_url ?? null;
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

const STAR = "M12 3l2.4 5.6 6 .5-4.6 4 1.4 5.9-5.2-3.2-5.2 3.2 1.4-5.9-4.6-4 6-.5z";

/* ───────────────────────────── atoms ───────────────────────────── */

const Star = ({ x, y, size = 22, color, rot = 0 }: { x: number; y: number; size?: number; color: string; rot?: number }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className="absolute"
    style={{ left: x, top: y, transform: `rotate(${rot}deg)` }}
    aria-hidden
  >
    <path d={STAR} fill={color} stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
);

const Tape = ({ x, y, rot, w = 96, color }: { x: number; y: number; rot: number; w?: number; color: string }) => (
  <span
    className="absolute"
    style={{
      left: x,
      top: y,
      width: w,
      height: 24,
      backgroundColor: color,
      opacity: 0.86,
      transform: `rotate(${rot}deg)`,
      backgroundImage: "repeating-linear-gradient(45deg, transparent 0 6px, rgba(255,255,255,0.3) 6px 8px)",
      boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
    }}
    aria-hidden
  />
);

/** Torn paper panel (SVG) with a paler under-edge so it reads like ripped cardstock. */
const TornPanel = ({
  x, y, w, h, color, edge = "#f3e9d6", seed, rot = 0,
}: { x: number; y: number; w: number; h: number; color: string; edge?: string; seed: number; rot?: number }) => (
  <svg
    width={w + 12}
    height={h + 12}
    viewBox={`-6 -6 ${w + 12} ${h + 12}`}
    className="absolute"
    style={{ left: x - 6, top: y - 6, transform: `rotate(${rot}deg)`, filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.22))" }}
    aria-hidden
  >
    <polygon points={tornPoints(w, h, seed + 31)} fill={edge} transform="translate(2.5 2.5)" />
    <polygon points={tornPoints(w, h, seed)} fill={color} />
  </svg>
);

const SCRAP_FONTS: CSSProperties[] = [
  { fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700 },
  { fontFamily: "'Courier New', monospace", fontWeight: 700 },
  { fontFamily: "'Arial Black', Impact, sans-serif", fontWeight: 900 },
  { fontFamily: "'Caveat', cursive", fontWeight: 700 },
  { fontFamily: "'Patrick Hand', cursive", fontWeight: 400 },
];

/** Ransom-note / magazine-cutout title: every letter its own scrap of paper. */
const Ransom = ({
  text, x, y, size = 26, rot = 0, tones, seed = 1, maxWidth = 520,
}: { text: string; x: number; y: number; size?: number; rot?: number; tones: { bg: string; ink: string }[]; seed?: number; maxWidth?: number }) => {
  const r = rng(seed * 13 + 5);
  return (
    <div className="absolute flex flex-wrap items-end" style={{ left: x, top: y, transform: `rotate(${rot}deg)`, maxWidth, gap: 2 }}>
      {Array.from(text).map((ch, i) => {
        if (ch === " ") return <span key={i} style={{ width: size * 0.45 }} />;
        const t = tones[(i + seed) % tones.length];
        const f = SCRAP_FONTS[Math.floor(r() * SCRAP_FONTS.length)];
        return (
          <span
            key={i}
            style={{
              ...f,
              display: "inline-block",
              backgroundColor: t.bg,
              color: t.ink,
              fontSize: size * (0.82 + r() * 0.3),
              lineHeight: 1,
              padding: `${size * 0.1}px ${size * 0.17}px`,
              transform: `rotate(${(r() * 10 - 5).toFixed(1)}deg) translateY(${(r() * 6 - 3).toFixed(1)}px)`,
              boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

/** White-bordered photo with a little paper caption tag under it. */
const Frame = ({
  m, x, y, w, h, rot, border = 8, tape, tapeRot = -6, label = true,
  ink, paper, tapeColor,
}: {
  m?: Memory; x: number; y: number; w: number; h: number; rot: number; border?: number;
  tape?: boolean; tapeRot?: number; label?: boolean; ink: string; paper: string; tapeColor: string;
}) => {
  if (!m) return null;
  const src = photoOf(m);
  return (
    <div className="absolute" style={{ left: x, top: y, width: w, transform: `rotate(${rot}deg)` }}>
      <div style={{ width: w, height: h, backgroundColor: "#fff", padding: border, boxShadow: "0 4px 10px rgba(0,0,0,0.28)" }}>
        {src ? (
          <img src={src} alt="" crossOrigin="anonymous" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-printed text-[12px] uppercase tracking-wider" style={{ backgroundColor: paper, color: ink }}>
            photo
          </div>
        )}
      </div>
      {tape && <Tape x={w / 2 - 44} y={-12} rot={tapeRot} w={88} color={tapeColor} />}
      {label && (
        <div
          className="absolute left-2 right-2 px-2 py-1"
          style={{ top: h + 5, backgroundColor: "rgba(255,255,255,0.88)", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transform: "rotate(-1deg)" }}
        >
          <div className="truncate font-printed text-[11px] font-bold uppercase leading-tight tracking-wide" style={{ color: ink }}>
            {m.title}
          </div>
          <div className="font-marker text-[9px] uppercase tracking-widest" style={{ color: ink, opacity: 0.6 }}>
            {format(new Date(m.happened_at), "MMM d, yyyy")}
          </div>
        </div>
      )}
    </div>
  );
};

/** Little retro digital camera with a photo on its screen. */
const Camera = ({ m, x, y, w, ink, paper }: { m?: Memory; x: number; y: number; w: number; ink: string; paper: string }) => {
  const h = w * 0.68;
  const src = photoOf(m);
  return (
    <div className="absolute" style={{ left: x, top: y, width: w, height: h, transform: "rotate(2deg)", filter: "drop-shadow(0 5px 6px rgba(0,0,0,0.3))" }}>
      <svg viewBox="0 0 250 170" width={w} height={h} aria-hidden>
        <rect x="6" y="22" width="238" height="140" rx="16" fill="#aeb1b6" />
        <rect x="6" y="22" width="238" height="30" rx="16" fill="#c9ccd0" />
        <rect x="26" y="8" width="44" height="22" rx="5" fill="#8c8f94" />
        <rect x="178" y="30" width="46" height="14" rx="4" fill="#fff" opacity="0.75" />
        <circle cx="205" cy="124" r="26" fill="#6e7176" />
        <circle cx="205" cy="124" r="17" fill="#3a3c40" />
        <circle cx="198" cy="117" r="5" fill="#fff" opacity="0.5" />
        <rect x="20" y="58" width="150" height="92" rx="6" fill="#2a2b2e" />
      </svg>
      <div className="absolute overflow-hidden" style={{ left: w * 0.1, top: h * 0.4, width: w * 0.56, height: h * 0.52, backgroundColor: paper }}>
        {src ? (
          <img src={src} alt="" crossOrigin="anonymous" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-printed text-[11px] uppercase" style={{ color: ink }}>photo</div>
        )}
      </div>
    </div>
  );
};

/* ───────────────────────────── backgrounds ───────────────────────────── */

const NEWS_WORDS = "the daily memory times morning edition our little world story weekend trip family smile adventure summer city lights old town sunday market friends laughter golden hour cafe street".split(" ");

const newsLines = (() => {
  const r = rng(99);
  return Array.from({ length: 96 }, () =>
    Array.from({ length: 24 }, () => NEWS_WORDS[Math.floor(r() * NEWS_WORDS.length)]).join(" "),
  );
})();

const NewsprintBg = ({ base, strength = 0.2 }: { base: string; strength?: number }) => (
  <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: base }} aria-hidden>
    <div
      className="absolute inset-0 font-printed uppercase"
      style={{ fontSize: 7, lineHeight: "9px", letterSpacing: "0.06em", color: `rgba(40,35,25,${strength})`, whiteSpace: "nowrap", columnCount: 1 }}
    >
      {newsLines.map((l, i) => (
        <div key={i} style={{ marginLeft: -((i * 37) % 90) }}>{l}</div>
      ))}
    </div>
    <div className="absolute left-0 right-0 top-0 text-center font-handwritten text-[64px] font-bold" style={{ color: "rgba(40,35,25,0.07)", transform: "rotate(-2deg)", top: 20 }}>
      THE DAILY MEMORY
    </div>
    <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35), transparent 55%), radial-gradient(circle at 80% 90%, rgba(120,90,50,0.18), transparent 55%)" }} />
  </div>
);

const KraftBg = ({ base }: { base: string }) => (
  <div
    className="absolute inset-0"
    style={{
      backgroundColor: base,
      backgroundImage:
        "repeating-linear-gradient(115deg, rgba(90,60,25,0.07) 0 2px, transparent 2px 9px), repeating-linear-gradient(25deg, rgba(255,255,255,0.07) 0 2px, transparent 2px 13px), radial-gradient(circle at 30% 25%, rgba(255,255,255,0.18), transparent 60%), radial-gradient(circle at 85% 85%, rgba(70,40,10,0.22), transparent 60%)",
    }}
    aria-hidden
  />
);

/* ───────────────────────────── spreads ───────────────────────────── */

const PHRASES = ["I wanna be yours", "best day ever", "our little world", "remember this", "good vibes only", "made of moments"];

const SpreadFooter = ({ label, ink }: { label: string; ink: string }) => (
  <div className="absolute bottom-3 right-5 font-marker text-[10px] uppercase tracking-widest" style={{ color: ink, opacity: 0.55 }}>
    {label}
  </div>
);

export const ScrapbookSpreadView = ({
  kind, items, colors, index, total,
}: { kind: ScrapbookSpreadKind; items: Memory[]; colors: BookTemplateColors; index: number; total: number }) => {
  const ink = colors.ink ?? colors.text ?? "#3E3E42";
  const paper = colors.paper ?? colors.primary;
  const mint = colors.mint ?? colors.accent;
  const [a, b, c, d] = items;
  const footer = `spread ${index} / ${total}`;
  const tapeA = colors.accent;
  const tapeB = colors.gold;
  const tones = [
    { bg: "#fff", ink: ink },
    { bg: colors.coral, ink: "#fff" },
    { bg: colors.gold, ink: ink },
    { bg: ink, ink: "#fff" },
    { bg: mint, ink: ink },
  ];
  const frame = { ink, paper, tapeColor: tapeA };

  /* ─── KRAFT: kraft paper + torn coloured panels + camera + gingham ─── */
  if (kind === "kraft-collage") {
    const phrase = PHRASES[(index - 1) % PHRASES.length];
    return (
      <div className="relative h-full w-full overflow-hidden" style={{ color: ink }}>
        <KraftBg base={paper} />
        <TornPanel x={14} y={28} w={274} h={372} color={colors.coral} seed={index * 3 + 1} rot={-1} />
        <TornPanel x={316} y={400} w={270} h={356} color={colors.coral} seed={index * 3 + 2} rot={1} />
        {/* gingham strip */}
        <div
          className="absolute"
          style={{
            left: 24, top: 688, width: 290, height: 74, transform: "rotate(-3deg)", backgroundColor: "#f7efe0",
            backgroundImage: `repeating-linear-gradient(0deg, ${colors.coral}88 0 14px, transparent 14px 28px), repeating-linear-gradient(90deg, ${colors.coral}88 0 14px, transparent 14px 28px)`,
            boxShadow: "0 2px 5px rgba(0,0,0,0.25)",
          }}
          aria-hidden
        />
        <Ransom text={phrase} x={34} y={48} size={25} rot={-3} tones={tones} seed={index} maxWidth={236} />
        {a && (
          <div
            className="absolute px-3 py-2.5 font-handwritten text-[19px] leading-snug"
            style={{ left: 330, top: 262, width: 200, backgroundColor: "#fbf4e3", color: ink, transform: "rotate(3deg)", boxShadow: "0 3px 7px rgba(0,0,0,0.28)" }}
          >
            <Tape x={70} y={-16} rot={-4} w={64} color={tapeB} />
            “{a.story ? clip(a.story, 64) : clip(a.title, 40)}”
            <div className="mt-1 font-marker text-[10px] uppercase tracking-widest" style={{ opacity: 0.6 }}>
              {format(new Date(a.happened_at), "MMMM yyyy")}
            </div>
          </div>
        )}
        <Frame m={a} x={46} y={146} w={206} h={196} rot={-5} tape tapeRot={-8} {...frame} />
        <Camera m={b} x={322} y={46} w={254} ink={ink} paper={paper} />
        <Frame m={c} x={38} y={440} w={246} h={190} rot={3} tape tapeRot={5} {...frame} />
        <Frame m={d} x={342} y={436} w={226} h={236} rot={-3} tape tapeRot={-5} {...frame} />
        <Star x={298} y={236} size={26} color={colors.gold} rot={-10} />
        <Star x={560} y={372} size={20} color={colors.coral} rot={14} />
        <Star x={296} y={680} size={20} color={colors.gold} />
        <SpreadFooter label={footer} ink={ink} />
      </div>
    );
  }

  /* ─── FILM STRIP: big hero photo + film roll across the page ─── */
  if (kind === "film-strip") {
    const filmW = 640;
    const frameW = 184;
    const holes = Array.from({ length: 27 }, (_, i) => i);
    const stripFrames = [b, c, d];
    return (
      <div className="relative h-full w-full overflow-hidden" style={{ color: ink }}>
        <NewsprintBg base={paper} strength={0.17} />
        {/* marker scribble */}
        <svg className="absolute" style={{ left: 300, top: 8 }} width="290" height="40" viewBox="0 0 290 40" aria-hidden>
          <path d="M4 26 C 50 6, 90 40, 140 18 S 230 4, 286 22" fill="none" stroke={colors.gold} strokeWidth="7" strokeLinecap="round" opacity="0.9" />
        </svg>
        <Frame m={a} x={30} y={40} w={540} h={322} rot={-1.2} border={10} tape tapeRot={-5} label={false} {...frame} />
        {a && (
          <div className="absolute" style={{ left: 54, top: 346, transform: "rotate(-1.5deg)" }}>
            <div className="inline-block bg-white/90 px-3 py-1 font-handwritten text-[22px] font-bold" style={{ color: ink, boxShadow: "0 2px 4px rgba(0,0,0,0.25)" }}>
              {clip(a.title, 30)} · {format(new Date(a.happened_at), "MMM d")}
            </div>
          </div>
        )}
        {/* film roll */}
        <div className="absolute" style={{ left: -20, top: 428, width: filmW, height: 182, transform: "rotate(-3deg)", backgroundColor: "#16161a", boxShadow: "0 6px 10px rgba(0,0,0,0.4)" }}>
          {holes.map((i) => (
            <span key={`t${i}`} className="absolute rounded-[2px]" style={{ left: 8 + i * 23.5, top: 8, width: 13, height: 9, backgroundColor: "#f1ece0" }} />
          ))}
          {holes.map((i) => (
            <span key={`b${i}`} className="absolute rounded-[2px]" style={{ left: 8 + i * 23.5, bottom: 8, width: 13, height: 9, backgroundColor: "#f1ece0" }} />
          ))}
          {stripFrames.map((m, i) => (
            <div
              key={i}
              className="absolute overflow-hidden"
              style={{ left: 34 + i * (frameW + 14), top: 28, width: frameW, height: 126, border: "2px solid #34343a", backgroundColor: "#2a2a2e" }}
            >
              {m && photoOf(m) ? (
                <img src={photoOf(m)!} alt="" crossOrigin="anonymous" className="h-full w-full object-cover" />
              ) : m ? (
                <div className="flex h-full w-full items-center justify-center font-printed text-[11px] uppercase" style={{ backgroundColor: paper, color: ink }}>photo</div>
              ) : null}
            </div>
          ))}
        </div>
        <div className="absolute left-8 right-8 text-center font-handwritten text-[19px]" style={{ top: 628, color: ink }}>
          {stripFrames.filter(Boolean).map((m) => clip((m as Memory).title, 16)).join("  ·  ")}
        </div>
        <Ransom text={(a ? clip(a.title, 14) : "memories").toUpperCase()} x={34} y={672} size={30} rot={-2} tones={tones} seed={index + 4} />
        <Star x={500} y={676} size={28} color={colors.gold} rot={10} />
        <Star x={540} y={718} size={18} color={colors.coral} rot={-12} />
        <Tape x={470} y={30} rot={8} w={96} color={tapeB} />
        <SpreadFooter label={footer} ink={ink} />
      </div>
    );
  }

  /* ─── NEWSPRINT: tilted taped photos over newsprint, ransom title ─── */
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ color: ink }}>
      <NewsprintBg base={paper} strength={0.22} />
      <Frame m={a} x={30} y={52} w={332} h={232} rot={-2.5} tape tapeRot={-7} {...frame} />
      <Frame m={b} x={392} y={86} w={178} h={224} rot={4} tape tapeRot={6} {...frame} />
      <Frame m={c} x={38} y={352} w={198} h={246} rot={3} tape tapeRot={-4} {...frame} />
      <Frame m={d} x={266} y={380} w={304} h={216} rot={-2} tape tapeRot={5} {...frame} />
      <svg className="absolute" style={{ left: 40, top: 700 }} width="330" height="26" viewBox="0 0 330 26" aria-hidden>
        <path d="M4 14 C 60 2, 110 24, 170 12 S 280 6, 326 16" fill="none" stroke={colors.gold} strokeWidth="8" strokeLinecap="round" opacity="0.85" />
      </svg>
      <Ransom text={(a ? clip(a.title, 14) : "memories").toUpperCase()} x={36} y={650} size={36} rot={-2} tones={tones} seed={index + 2} />
      <div className="absolute font-handwritten text-[22px] font-bold" style={{ left: 380, top: 690, color: ink, transform: "rotate(-3deg)" }}>
        {a ? format(new Date(a.happened_at), "MMMM yyyy") : ""}
      </div>
      <Star x={24} y={20} size={24} color={colors.gold} rot={-8} />
      <Star x={540} y={26} size={20} color={colors.coral} rot={10} />
      <Star x={548} y={640} size={26} color={colors.gold} rot={14} />
      <Tape x={236} y={36} rot={-10} w={100} color={tapeB} />
      <SpreadFooter label={footer} ink={ink} />
    </div>
  );
};
