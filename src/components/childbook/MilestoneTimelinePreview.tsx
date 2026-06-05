import { addDays, addMonths, addYears, differenceInDays, format, isBefore } from "date-fns";
import { Baby, Cake, Footprints, GraduationCap, MessageCircle, Smile, Sparkles, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Props {
  dob?: Date;
  name?: string;
}

interface Stage {
  key: string;
  label: string;
  range: string;
  icon: LucideIcon;
  startMonths: number;
  endMonths: number;
  tone: string;
}

const STAGES: Stage[] = [
  { key: "newborn", label: "Newborn", range: "0–3 months", icon: Baby, startMonths: 0, endMonths: 3, tone: "bg-secondary/30 text-secondary-foreground" },
  { key: "infant", label: "Infant", range: "3–12 months", icon: Smile, startMonths: 3, endMonths: 12, tone: "bg-primary/25 text-primary-deep" },
  { key: "toddler", label: "Toddler", range: "1–3 years", icon: Footprints, startMonths: 12, endMonths: 36, tone: "bg-accent/40 text-accent-foreground" },
  { key: "preschool", label: "Preschooler", range: "3–5 years", icon: Sparkles, startMonths: 36, endMonths: 60, tone: "bg-primary/30 text-primary-deep" },
  { key: "school", label: "School age", range: "5–12 years", icon: GraduationCap, startMonths: 60, endMonths: 144, tone: "bg-secondary/30 text-secondary-foreground" },
];

interface MilestoneSeed {
  label: string;
  atMonths?: number;
  atYears?: number;
  icon: LucideIcon;
}

const MILESTONE_SEEDS: MilestoneSeed[] = [
  { label: "First social smile", atMonths: 2, icon: Smile },
  { label: "First belly laugh", atMonths: 4, icon: Smile },
  { label: "Sits without support", atMonths: 6, icon: Baby },
  { label: "First word", atMonths: 9, icon: MessageCircle },
  { label: "First steps", atMonths: 12, icon: Footprints },
  { label: "First birthday 🎂", atMonths: 12, icon: Cake },
  { label: "Two-word phrases", atMonths: 18, icon: MessageCircle },
  { label: "Second birthday 🎂", atMonths: 24, icon: Cake },
  { label: "Full sentences", atMonths: 30, icon: MessageCircle },
  { label: "Third birthday 🎂", atMonths: 36, icon: Cake },
  { label: "First scribbles & art", atMonths: 42, icon: Sparkles },
  { label: "First day of preschool", atMonths: 48, icon: GraduationCap },
  { label: "Learns to ride a tricycle", atMonths: 48, icon: Trophy },
  { label: "First day of school", atYears: 5, icon: GraduationCap },
  { label: "Reads first book aloud", atYears: 6, icon: Sparkles },
  { label: "Loses first tooth", atYears: 6, icon: Smile },
  { label: "First sports trophy", atYears: 7, icon: Trophy },
];

const ageInMonths = (dob: Date, on: Date) => {
  let m = (on.getFullYear() - dob.getFullYear()) * 12 + (on.getMonth() - dob.getMonth());
  if (on.getDate() < dob.getDate()) m -= 1;
  return Math.max(0, m);
};

const findStage = (months: number) => STAGES.find((s) => months >= s.startMonths && months < s.endMonths) ?? STAGES[STAGES.length - 1];

const milestoneDate = (dob: Date, seed: MilestoneSeed) => {
  if (seed.atYears) return addYears(dob, seed.atYears);
  return addMonths(dob, seed.atMonths ?? 0);
};

const formatRelative = (target: Date, today: Date) => {
  const days = differenceInDays(target, today);
  if (days < 0) {
    const ago = Math.abs(days);
    if (ago < 30) return `${ago}d ago`;
    if (ago < 365) return `${Math.round(ago / 30)}mo ago`;
    return `${Math.round(ago / 365)}y ago`;
  }
  if (days === 0) return "today";
  if (days < 30) return `in ${days}d`;
  if (days < 365) return `in ${Math.round(days / 30)}mo`;
  return `in ${Math.round(days / 365)}y`;
};

export const MilestoneTimelinePreview = ({ dob, name }: Props) => {
  if (!dob) return null;
  const today = new Date();
  if (isBefore(today, dob)) return null;

  const months = ageInMonths(dob, today);
  const stage = findStage(months);
  const display = name?.trim() || "They";

  // Next 3 upcoming milestones (or most recent if past all)
  const withDates = MILESTONE_SEEDS.map((s) => ({ ...s, date: milestoneDate(dob, s) }));
  const upcoming = withDates
    .filter((m) => !isBefore(m.date, addDays(today, -1)))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3);

  // If we somehow ran out of upcoming (very old child), show last 3 past
  const list = upcoming.length
    ? upcoming
    : withDates
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 3)
        .reverse();

  const StageIcon = stage.icon;

  return (
    <div
      aria-live="polite"
      className="space-y-3 rounded-2xl border border-border bg-card/80 p-4 shadow-soft animate-fade-in"
    >
      {/* Stage banner */}
      <div className="flex items-center gap-3 rounded-xl bg-gradient-warm/70 px-3 py-2.5">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stage.tone}`}>
          <StageIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="text-[13px] font-medium uppercase tracking-wider text-muted-foreground">
            Current stage
          </div>
          <div className="text-[15px] font-semibold text-foreground">
            {display} is a <span className="text-primary-deep">{stage.label}</span>
            <span className="text-muted-foreground"> · {stage.range}</span>
          </div>
        </div>
      </div>

      {/* Upcoming milestones */}
      <div>
        <div className="mb-2 flex items-center justify-between px-1">
          <h4 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
            Coming up
          </h4>
          <span className="text-[11px] text-muted-foreground">Typical milestones</span>
        </div>
        <ol className="relative space-y-2 border-l border-border/70 pl-4">
          {list.map((m) => {
            const Icon = m.icon;
            const past = isBefore(m.date, today);
            return (
              <li key={`${m.label}-${m.date.toISOString()}`} className="relative">
                <span className="absolute -left-[21px] top-2 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                <div className="flex items-start gap-2.5 rounded-xl bg-muted/40 px-3 py-2">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary-deep">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold text-foreground">{m.label}</div>
                    <div className="text-[12px] text-muted-foreground">
                      {format(m.date, "MMM yyyy")} · {formatRelative(m.date, today)}
                      {past && " · already past — nice!"}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};
