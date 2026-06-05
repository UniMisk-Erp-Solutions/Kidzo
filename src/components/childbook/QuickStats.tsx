import { Camera, GraduationCap, ShieldCheck, type LucideIcon } from "lucide-react";

type Stat = {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: "primary" | "accent" | "secondary";
};

const toneStyles: Record<Stat["tone"], string> = {
  primary: "bg-primary/25 text-primary-deep",
  accent: "bg-accent/30 text-accent-foreground",
  secondary: "bg-secondary/25 text-secondary",
};

interface Props {
  memoriesCount: number;
  achievementsCount: number;
  documentsCount: number;
}

export const QuickStats = ({ memoriesCount, achievementsCount, documentsCount }: Props) => {
  const stats: Stat[] = [
    { label: "Memories captured", value: memoriesCount, icon: Camera, tone: "primary" },
    { label: "Achievements", value: achievementsCount, icon: GraduationCap, tone: "accent" },
    { label: "Documents safe", value: documentsCount, icon: ShieldCheck, tone: "secondary" },
  ];

  return (
    <section aria-label="Quick stats" className="grid grid-cols-3 gap-3 sm:gap-4">
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className="group rounded-2xl border border-border bg-card p-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift sm:p-5 animate-fade-in-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${toneStyles[s.tone]}`}>
              <Icon className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div className="text-2xl font-bold text-foreground sm:text-3xl">{s.value}</div>
            <div className="mt-0.5 text-[12px] font-medium leading-tight text-muted-foreground sm:text-[13px]">
              {s.label}
            </div>
          </div>
        );
      })}
    </section>
  );
};
