import {
  BookOpen, Camera, Cloud, Compass, Flower2, Footprints, Gift, Leaf, Music, Rocket, Send, Star, Stamp, Sun, TreeDeciduous,
  Orbit,
  type LucideIcon,
} from "lucide-react";
import { Heart, Sparkle } from "@/components/childbook/Doodles";
import { useLocation } from "react-router-dom";
import { useTheme, type AppTheme } from "@/hooks/useTheme";

type Item = { Icon: LucideIcon; side: "left" | "right"; top: string; x: string; size: number; color: string; delay: string; rot: string };

/**
 * Translucent floating keepsakes in the empty side margins of wide screens (>=1280px). Each theme has its own cast;
 * colours come from the theme's slot tokens (--coral etc.), so they re-tint automatically.
 * Purely decorative: aria-hidden, no pointer events; motion is disabled by the global reduced-motion rule.
 */
const SETS: Record<AppTheme, Item[]> = {
  daydream: [
    { Icon: Camera, side: "left", top: "14%", x: "1.2vw", size: 46, color: "--coral", delay: "0s", rot: "-12deg" },
    { Icon: Star, side: "left", top: "34%", x: "4.5vw", size: 30, color: "--butter", delay: "-1.5s", rot: "10deg" },
    { Icon: BookOpen, side: "left", top: "55%", x: "1.8vw", size: 50, color: "--lavender", delay: "-3s", rot: "8deg" },
    { Icon: Footprints, side: "left", top: "76%", x: "4vw", size: 34, color: "--mint", delay: "-2s", rot: "-8deg" },
    { Icon: Sun, side: "right", top: "16%", x: "2vw", size: 44, color: "--butter", delay: "-1s", rot: "0deg" },
    { Icon: Gift, side: "right", top: "38%", x: "4.5vw", size: 40, color: "--peach", delay: "-2.5s", rot: "10deg" },
    { Icon: Cloud, side: "right", top: "58%", x: "1.5vw", size: 54, color: "--sky", delay: "-4s", rot: "0deg" },
    { Icon: Music, side: "right", top: "78%", x: "4vw", size: 32, color: "--lavender", delay: "-0.5s", rot: "-10deg" },
  ],
  explorer: [
    { Icon: Cloud, side: "left", top: "12%", x: "1.2vw", size: 56, color: "--sky", delay: "0s", rot: "0deg" },
    { Icon: Send, side: "left", top: "32%", x: "4vw", size: 38, color: "--lavender", delay: "-1.5s", rot: "-14deg" },
    { Icon: Orbit, side: "left", top: "54%", x: "1.6vw", size: 48, color: "--coral", delay: "-3s", rot: "10deg" },
    { Icon: Star, side: "left", top: "76%", x: "4.2vw", size: 30, color: "--butter", delay: "-2s", rot: "8deg" },
    { Icon: Rocket, side: "right", top: "15%", x: "2vw", size: 44, color: "--lavender", delay: "-1s", rot: "12deg" },
    { Icon: Compass, side: "right", top: "38%", x: "4.5vw", size: 40, color: "--coral", delay: "-2.5s", rot: "0deg" },
    { Icon: Cloud, side: "right", top: "58%", x: "1.5vw", size: 50, color: "--sky", delay: "-4s", rot: "0deg" },
    { Icon: Star, side: "right", top: "79%", x: "4vw", size: 28, color: "--butter", delay: "-0.5s", rot: "-10deg" },
  ],
  tales: [
    { Icon: Leaf, side: "left", top: "13%", x: "1.4vw", size: 46, color: "--mint", delay: "0s", rot: "-18deg" },
    { Icon: Sun, side: "left", top: "34%", x: "4.2vw", size: 36, color: "--butter", delay: "-1.5s", rot: "0deg" },
    { Icon: Stamp, side: "left", top: "55%", x: "1.8vw", size: 46, color: "--coral", delay: "-3s", rot: "-6deg" },
    { Icon: Flower2, side: "left", top: "77%", x: "4vw", size: 36, color: "--lavender", delay: "-2s", rot: "8deg" },
    { Icon: TreeDeciduous, side: "right", top: "16%", x: "2vw", size: 48, color: "--mint", delay: "-1s", rot: "0deg" },
    { Icon: Star, side: "right", top: "38%", x: "4.5vw", size: 32, color: "--butter", delay: "-2.5s", rot: "12deg" },
    { Icon: Leaf, side: "right", top: "58%", x: "1.8vw", size: 44, color: "--sky", delay: "-4s", rot: "20deg" },
    { Icon: Camera, side: "right", top: "78%", x: "4vw", size: 34, color: "--coral", delay: "-0.5s", rot: "-8deg" },
  ],
};

export const AmbientDecor = () => {
  const { pathname } = useLocation();
  const { theme } = useTheme();
  // only inside the signed-in app, not landing/auth/legal
  if (!/^\/(home|moments|grow|books|documents|family|export|records|settings)/.test(pathname)) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[1] hidden xl:block">
      {SETS[theme].map(({ Icon, side, top, x, size, color, delay, rot }, i) => (
        <span
          key={`${theme}-${i}`}
          className="float-slow absolute"
          style={{ top, [side]: x, animationDelay: delay, ["--r" as string]: rot, color: `hsl(var(${color}) / 0.5)` }}
        >
          <Icon style={{ width: size, height: size }} strokeWidth={1.5} />
        </span>
      ))}
      <Heart className="float-med absolute left-[6.5vw] top-[24%] h-5 w-5 text-coral/40" />
      <Heart className="float-med absolute right-[7vw] top-[68%] h-5 w-5 text-coral/40" />
      <Sparkle className="twinkle absolute left-[3vw] top-[90%] h-5 w-5 text-butter/60" />
      <Sparkle className="twinkle absolute right-[3vw] top-[7%] h-5 w-5 text-lavender/60" />
    </div>
  );
};
