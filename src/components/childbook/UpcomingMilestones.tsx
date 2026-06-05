import { Cake, Stethoscope, Sparkles } from "lucide-react";
import { addYears, differenceInDays, format } from "date-fns";

interface Props {
  dob: Date;
  childName: string;
}

export const UpcomingMilestones = ({ dob, childName }: Props) => {
  // Next birthday
  const today = new Date();
  let nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
  if (nextBirthday < today) nextBirthday = addYears(nextBirthday, 1);
  const daysToBirthday = differenceInDays(nextBirthday, today);
  const ageThen = nextBirthday.getFullYear() - dob.getFullYear();

  const milestones = [
    {
      icon: Cake,
      title: `${childName}'s ${ordinal(ageThen)} birthday`,
      when: `in ${daysToBirthday} ${daysToBirthday === 1 ? "day" : "days"}`,
      tone: "bg-secondary/25 text-secondary",
    },
    {
      icon: Sparkles,
      title: "Capture a monthly photo",
      when: format(nextFirstOfMonth(today), "MMM d"),
      tone: "bg-accent/40 text-accent-foreground",
    },
    {
      icon: Stethoscope,
      title: "Schedule next checkup",
      when: "When you're ready",
      tone: "bg-primary/30 text-primary-deep",
    },
  ];

  return (
    <section aria-label="Upcoming milestones" className="animate-fade-in-up">
      <h2 className="mb-3 text-xl font-semibold text-foreground sm:text-2xl">Coming up</h2>
      <ul className="space-y-2.5">
        {milestones.map((m, i) => {
          const Icon = m.icon;
          return (
            <li
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift sm:p-4"
            >
              <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${m.tone}`}>
                <Icon className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold text-foreground">{m.title}</div>
                <div className="text-[13px] text-muted-foreground">{m.when}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const nextFirstOfMonth = (from: Date) => {
  const next = new Date(from.getFullYear(), from.getMonth() + 1, 1);
  return next;
};
