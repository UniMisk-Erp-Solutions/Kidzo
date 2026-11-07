import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { isPdfUrl } from "@/lib/fileKind";
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

/** Shows a stored PDF inside the page (fetched once, shown from memory) so the backend's storage address never appears in the browser's address bar. */
const PdfAttachment = ({ url, title }: { url: string; title: string }) => {
  const [src, setSrc] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  useEffect(() => {
    let revoked = false;
    let objectUrl: string | null = null;
    setState("loading");
    fetch(url)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error("fetch"))))
      .then((b) => {
        if (revoked) return;
        objectUrl = URL.createObjectURL(new Blob([b], { type: "application/pdf" }));
        setSrc(objectUrl);
        setState("ready");
      })
      .catch(() => !revoked && setState("failed"));
    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (state === "loading")
    return (
      <div className="flex h-40 items-center justify-center bg-muted/60">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  if (state === "failed")
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 bg-muted/60 px-4 text-center text-muted-foreground">
        <FileText className="h-8 w-8" />
        <span className="text-[13px]">Couldn't open this PDF.</span>
      </div>
    );
  return <iframe src={src ?? undefined} title={title} className="h-[60vh] w-full border-0 bg-white" />;
};

/** Full view of one achievement, opened from its card. */
export const AchievementDetail = ({ achievement, onClose, onDelete }: Props) => {
  const meta = achievement ? META[achievement.type] : undefined;
  const Icon = meta?.icon ?? Sparkles;
  return (
    <Dialog open={!!achievement} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-md gap-0 overflow-y-auto rounded-3xl border-border bg-card p-0">
        {achievement && (
          <>
            {achievement.photo_url &&
              (isPdfUrl(achievement.photo_url) ? (
                <PdfAttachment url={achievement.photo_url} title={achievement.subject} />
              ) : (
                <img src={achievement.photo_url} alt={achievement.subject} className="max-h-72 w-full object-cover" />
              ))}
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
