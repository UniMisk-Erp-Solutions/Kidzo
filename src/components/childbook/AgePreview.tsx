import { Cake } from "lucide-react";

interface AgePreviewProps {
  dob?: Date;
  name?: string;
}

const calcAge = (dob: Date) => {
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  let days = now.getDate() - dob.getDate();
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const totalDays = Math.max(0, Math.floor((now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24)));
  return { years, months, days, totalDays };
};

const plural = (n: number, word: string) => `${n} ${n === 1 ? word : `${word}s`}`;

export const AgePreview = ({ dob, name }: AgePreviewProps) => {
  if (!dob) {
    return (
      <div
        aria-live="polite"
        className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-3 text-[13px] text-muted-foreground"
      >
        Pick a birthdate to see a live age preview.
      </div>
    );
  }

  const now = new Date();
  const isFuture = dob.getTime() > now.getTime();
  if (isFuture) {
    return (
      <div
        aria-live="polite"
        className="rounded-2xl border border-dashed border-destructive/40 bg-destructive/5 px-4 py-3 text-[13px] text-destructive"
      >
        That date is in the future — please pick a birthdate on or before today.
      </div>
    );
  }

  const { years, months, days, totalDays } = calcAge(dob);
  const display = name?.trim() ? name.trim() : "They";

  return (
    <div
      aria-live="polite"
      className="flex items-start gap-3 rounded-2xl border border-border bg-gradient-warm/60 px-4 py-3 shadow-soft animate-fade-in"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/25 text-primary-deep">
        <Cake className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="text-[14px] font-semibold text-foreground">
          {display} would be{" "}
          <span className="text-primary-deep">
            {plural(years, "year")}, {plural(months, "month")}, {plural(days, "day")}
          </span>{" "}
          old today.
        </div>
        <div className="text-[12px] text-muted-foreground">
          That's {totalDays.toLocaleString()} {totalDays === 1 ? "day" : "days"} of stories to celebrate.
        </div>
      </div>
    </div>
  );
};
