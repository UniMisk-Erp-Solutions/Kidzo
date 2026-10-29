import { Camera, GraduationCap, ShieldCheck, type LucideIcon } from "lucide-react";
import { Sparkle } from "./Doodles";

type Stat = {
  label: string;
  value: number;
  icon: LucideIcon;
  /** [from, to] palette slot variables (re-mapped per theme) */
  hsl: [string, string];
  tilt: string;
};

interface Props {
  memoriesCount: number;
  achievementsCount: number;
  documentsCount: number;
}

export const QuickStats = ({ memoriesCount, achievementsCount, documentsCount }: Props) => {
  const stats: Stat[] = [
    { label: "Memories captured", value: memoriesCount, icon: Camera, hsl: ["--coral", "--peach"], tilt: "-rotate-1" },
    { label: "Achievements", value: achievementsCount, icon: GraduationCap, hsl: ["--butter", "--peach"], tilt: "rotate-1" },
    { label: "Documents safe", value: documentsCount, icon: ShieldCheck, hsl: ["--sky", "--mint"], tilt: "-rotate-1" },
  ];

  return (
    <section aria-label="Quick stats" className="grid grid-cols-3 gap-4 sm:gap-8">
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            style={{
              animationDelay: `${i * 80}ms`,
              backgroundImage: `linear-gradient(145deg, hsl(var(${s.hsl[0]}) / 0.9), hsl(var(${s.hsl[1]}) / 0.85))`,
            }}
            className={`group relative overflow-hidden rounded-3xl p-4 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:rotate-0 hover:shadow-lift sm:p-7 animate-fade-in-up ${s.tilt}`}
          >
            <Sparkle className="twinkle absolute right-2 top-2 h-3.5 w-3.5 text-white/90" />
            <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-white/30" aria-hidden />
            <div
              className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 shadow-soft transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
              style={{ color: "hsl(var(--plum))" }}
            >
              <Icon className="h-5 w-5" strokeWidth={2.3} />
            </div>
            <div className="font-display text-3xl font-bold leading-none sm:text-4xl" style={{ color: "hsl(var(--plum))" }}>
              {s.value}
            </div>
            <div className="mt-1 text-[12px] font-semibold leading-tight text-plum/75 sm:text-[13px]">{s.label}</div>
          </div>
        );
      })}
    </section>
  );
};
