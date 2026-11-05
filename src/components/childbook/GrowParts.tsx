import { format } from "date-fns";
import { GraduationCap, Trophy, Music, Award, Plus, X, Sparkles, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AchievementType, Achievement } from "@/hooks/useAchievements";
import { cn } from "@/lib/utils";

export type GrowFilter = AchievementType | "all";

const TYPES: { id: GrowFilter; label: string; icon: LucideIcon; tone: string }[] = [
  { id: "all", label: "All", icon: Sparkles, tone: "bg-muted text-muted-foreground" },
  { id: "academics", label: "Academics", icon: GraduationCap, tone: "bg-primary/25 text-primary-deep" },
  { id: "sports", label: "Sports", icon: Trophy, tone: "bg-accent/40 text-accent-foreground" },
  { id: "cultural", label: "Cultural", icon: Music, tone: "bg-secondary/30 text-secondary" },
  { id: "certifications", label: "Certifications", icon: Award, tone: "bg-success/25 text-success" },
];

/** Type filter: one dropdown on phones, chips from sm up. */
export const TypeFilter = ({ filter, onChange }: { filter: GrowFilter; onChange: (f: GrowFilter) => void }) => (
  <>
    <Select value={filter} onValueChange={(v) => onChange(v as GrowFilter)}>
      <SelectTrigger className="h-11 rounded-full border-border bg-card px-4 text-[14px] sm:hidden" aria-label="Filter by type">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TYPES.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            <span className="flex items-center gap-2">
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    <div className="-mx-6 hidden gap-2 overflow-x-auto px-6 pb-1 scrollbar-hide sm:flex">
      {TYPES.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all",
            filter === t.id
              ? "border-primary-deep bg-primary/25 text-primary-deep"
              : "border-border bg-card text-muted-foreground hover:bg-muted",
          )}
        >
          <t.icon className="h-3.5 w-3.5" />
          {t.label}
        </button>
      ))}
    </div>
  </>
);

export const AchievementCard = ({ a, onOpen, onDelete }: { a: Achievement; onOpen: () => void; onDelete?: () => void }) => {
  const meta = TYPES.find((t) => t.id === a.type);
  const Icon = meta?.icon ?? Sparkles;
  return (
    <li
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}
      className="cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift animate-fade-in-up"
    >
      {a.photo_url && (
        <img src={a.photo_url} alt={a.subject} className="h-36 w-full object-cover" loading="lazy" />
      )}
      <div className="space-y-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
              meta?.tone ?? "bg-muted text-muted-foreground",
            )}
          >
            <Icon className="h-3 w-3" />
            {meta?.label ?? a.type}
          </span>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label="Delete"
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <h3 className="text-[15px] font-semibold leading-snug text-foreground">{a.subject}</h3>
        {a.grade && <p className="text-[13px] font-medium text-primary-deep">{a.grade}</p>}
        <p className="text-[12px] text-muted-foreground">{format(new Date(a.achievement_date), "MMM d, yyyy")}</p>
        {a.notes && <p className="pt-1 text-[13px] text-foreground/80">{a.notes}</p>}
      </div>
    </li>
  );
};

export const GrowEmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <div className="mx-auto max-w-md py-16 text-center animate-fade-in">
    <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-accent/40 text-accent-foreground">
      <Trophy className="h-8 w-8" strokeWidth={2} />
    </span>
    <h2 className="text-xl font-semibold text-foreground">No achievements yet</h2>
    <p className="mt-2 text-[15px] text-muted-foreground">
      Track first words, A+ report cards, swim ribbons — every win matters.
    </p>
    <Button variant="warm" size="lg" className="mt-5" onClick={onAdd}>
      <Plus className="h-4 w-4" /> Add achievement
    </Button>
  </div>
);
