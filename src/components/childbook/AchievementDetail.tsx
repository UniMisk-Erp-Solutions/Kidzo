import { format } from "date-fns";
import { Award, GraduationCap, Music, Sparkles, Trash2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Achievement, AchievementType } from "@/hooks/useAchievements";
import { cn } from "@/lib/utils";

const META: Record<AchievementType, { label: string; icon: typeof Trophy; tone: string }> = {
  academics: { label: "Academics", icon: GraduationCap, tone: "bg-primary/25 text-primary-deep" },
  sports: { label: "Sports", icon: Trophy, tone: "bg-accent/40 text-accent-foreground" },
  cultural: { label: "Cultural", icon: Music, tone: "bg-secondary/30 text-secondary" },
  certifications: { label: "Certifications", icon: Award, tone: "bg-success/25 text-success" },
};

interface Props {
  achievement: Achievement | null;
  onClose: () => void;
  /** Shown only when the viewer may remove achievements. */
  onDelete?: (achievement: Achievement) => void;
}

/** Full view of one achievement, opened from its card. */
export const AchievementDetail = ({ achievement, onClose, onDelete }: Props) => {
  const meta = achievement ? META[achievement.type] : undefined;
  const Icon = meta?.icon ?? Sparkles;
  return (
    <Dialog open={!!achievement} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-md gap-0 overflow-y-auto rounded-3xl border-border bg-card p-0">
        {achievement && (
          <>
            {achievement.photo_url && (
              <img src={achievement.photo_url} alt={achievement.subject} className="max-h-72 w-full object-cover" />
            )}
            <div className="space-y-2 p-6">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                  meta?.tone ?? "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="h-3 w-3" />
                {meta?.label ?? achievement.type}
              </span>
              <DialogTitle className="text-xl font-semibold leading-snug text-foreground">{achievement.subject}</DialogTitle>
              <DialogDescription className="text-[13px] text-muted-foreground">
                {format(new Date(achievement.achievement_date), "EEEE, MMMM d, yyyy")}
              </DialogDescription>
              {achievement.grade && <p className="text-[14px] font-medium text-primary-deep">{achievement.grade}</p>}
              {achievement.notes && <p className="pt-1 text-[14px] text-foreground/80">{achievement.notes}</p>}
              {onDelete && (
                <div className="pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(achievement)}
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
