import { BookOpen, Camera, Cloud, Footprints, Gift, Music, Star, Sun, type LucideIcon } from "lucide-react";
import { Heart, Sparkle } from "@/components/childbook/Doodles";

/**
 * Animated, translucent keepsakes drifting behind the landing page content. Sits in a negative-z layer inside an
 * `isolate` wrapper (see pages/Landing.tsx) so it is always behind text and never intercepts clicks.
 * Colours come from the page's --wash-* tokens; motion is disabled by the global reduced-motion rule.
 */
type Icon = { Icon: LucideIcon; top: string; left: string; size: number; color: string; anim: string; delay: string; rot: string };

const ICONS: Icon[] = [
  { Icon: Camera, top: "6%", left: "3%", size: 54, color: "--wash-coral", anim: "float-slow", delay: "0s", rot: "-12deg" },
  { Icon: Star, top: "14%", left: "47%", size: 34, color: "--wash-mustard", anim: "float-med", delay: "-2s", rot: "10deg" },
  { Icon: Cloud, top: "9%", left: "78%", size: 72, color: "--wash-lilac-deep", anim: "drift", delay: "-3s", rot: "0deg" },
  { Icon: BookOpen, top: "27%", left: "92%", size: 50, color: "--wash-olive", anim: "float-slow", delay: "-1s", rot: "8deg" },
  { Icon: Gift, top: "36%", left: "2%", size: 46, color: "--wash-mustard", anim: "float-med", delay: "-4s", rot: "-8deg" },
  { Icon: Sun, top: "46%", left: "90%", size: 58, color: "--wash-mustard", anim: "wash-spin-slow", delay: "0s", rot: "0deg" },
  { Icon: Music, top: "55%", left: "5%", size: 40, color: "--wash-lilac-deep", anim: "float-slow", delay: "-2.5s", rot: "-10deg" },
  { Icon: Cloud, top: "62%", left: "70%", size: 64, color: "--wash-lilac-deep", anim: "drift", delay: "-6s", rot: "0deg" },
  { Icon: Footprints, top: "72%", left: "93%", size: 44, color: "--wash-coral", anim: "float-med", delay: "-1.5s", rot: "12deg" },
  { Icon: Star, top: "80%", left: "8%", size: 38, color: "--wash-coral", anim: "float-slow", delay: "-3.5s", rot: "-6deg" },
  { Icon: Camera, top: "88%", left: "48%", size: 44, color: "--wash-olive", anim: "float-med", delay: "-5s", rot: "9deg" },
];

const POLAROIDS = [
  { top: "20%", left: "40%", tone: "--wash-coral", rot: "-9deg", delay: "-1s" },
  { top: "44%", left: "84%", tone: "--wash-lilac-deep", rot: "7deg", delay: "-3s" },
  { top: "68%", left: "16%", tone: "--wash-mustard", rot: "6deg", delay: "-2s" },
];

export const LandingBackdrop = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
    {/* soft drifting colour pools */}
    <div className="blob drift left-[-8%] top-[4%] h-80 w-80 opacity-50" style={{ background: "hsl(var(--wash-coral) / 0.45)" }} />
    <div className="blob drift right-[-6%] top-[22%] h-96 w-96 opacity-60" style={{ background: "hsl(var(--wash-mustard) / 0.4)", animationDelay: "-5s" }} />
    <div className="blob drift left-[20%] top-[52%] h-96 w-96 opacity-50" style={{ background: "hsl(var(--wash-lilac) / 0.7)", animationDelay: "-9s" }} />
    <div className="blob drift right-[8%] top-[78%] h-80 w-80 opacity-50" style={{ background: "hsl(var(--wash-coral) / 0.35)", animationDelay: "-2s" }} />

    {ICONS.map(({ Icon, top, left, size, color, anim, delay, rot }, i) => (
      <span
        key={i}
        className={`absolute ${anim}`}
        style={{ top, left, animationDelay: delay, ["--r" as string]: rot, color: `hsl(var(${color}) / 0.45)` }}
      >
        <Icon style={{ width: size, height: size }} strokeWidth={1.4} />
      </span>
    ))}

    {POLAROIDS.map((p, i) => (
      <span
        key={i}
        className="float-slow absolute block h-16 w-14 bg-white/70 p-1 pb-4 shadow-soft"
        style={{ top: p.top, left: p.left, animationDelay: p.delay, ["--r" as string]: p.rot }}
      >
        <span className="block h-full w-full" style={{ background: `hsl(var(${p.tone}) / 0.55)` }} />
      </span>
    ))}

    <Heart className="float-med absolute left-[30%] top-[12%] h-6 w-6 text-[hsl(var(--wash-coral))] opacity-50" />
    <Heart className="float-slow absolute left-[62%] top-[40%] h-5 w-5 text-[hsl(var(--wash-coral))] opacity-40" />
    <Heart className="float-med absolute left-[24%] top-[84%] h-6 w-6 text-[hsl(var(--wash-coral))] opacity-40" />
    <Sparkle className="twinkle absolute left-[55%] top-[6%] h-5 w-5 text-[hsl(var(--wash-mustard))]" />
    <Sparkle className="twinkle absolute left-[12%] top-[26%] h-4 w-4 text-[hsl(var(--wash-lilac-deep))]" />
    <Sparkle className="twinkle absolute left-[78%] top-[58%] h-5 w-5 text-[hsl(var(--wash-mustard))]" />
    <Sparkle className="twinkle absolute left-[40%] top-[74%] h-4 w-4 text-[hsl(var(--wash-coral))]" />
    <Sparkle className="twinkle absolute left-[88%] top-[90%] h-5 w-5 text-[hsl(var(--wash-lilac-deep))]" />
  </div>
);
