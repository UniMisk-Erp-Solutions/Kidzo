import { ChevronRight, ImageIcon, Sparkles, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import type { Memory } from "@/hooks/useMemories";
import type { Achievement } from "@/hooks/useAchievements";
import { cn } from "@/lib/utils";

type FeedItem =
  | { kind: "memory"; id: string; date: Date; data: Memory }
  | { kind: "achievement"; id: string; date: Date; data: Achievement };

const memoryToneByCat: Record<string, string> = {
  Milestone: "bg-accent/40 text-accent-foreground",
  Celebration: "bg-secondary/30 text-secondary",
  Everyday: "bg-primary/30 text-primary-deep",
  Cozy: "bg-muted text-muted-foreground",
  Adventure: "bg-success/25 text-success",
  Family: "bg-warning/25 text-warning-foreground",
};

interface Props {
  memories: Memory[];
  achievements: Achievement[];
  limit?: number;
}

export const RecentTimeline = ({ memories, achievements, limit = 8 }: Props) => {
  const navigate = useNavigate();

  const items: FeedItem[] = [
    ...memories.map<FeedItem>((m) => ({ kind: "memory", id: m.id, date: new Date(m.happened_at), data: m })),
    ...achievements.map<FeedItem>((a) => ({
      kind: "achievement",
      id: a.id,
      date: new Date(a.achievement_date),
      data: a,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);

  return (
    <section aria-label="Recent activity" className="animate-fade-in-up">
      <header className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Recent activity</h2>
          <p className="text-[13px] text-muted-foreground">Memories and achievements together</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => navigate("/moments")}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[13px] font-medium text-primary-deep transition-colors hover:bg-primary/15"
          >
            See all <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/25 text-primary-deep">
            <Sparkles className="h-6 w-6" />
          </span>
          <h3 className="text-[16px] font-semibold text-foreground">Nothing here yet</h3>
          <p className="mt-1 text-[14px] text-muted-foreground">Capture your first moment or achievement.</p>
          <Button variant="warm" size="sm" className="mt-4" onClick={() => navigate("/moments/new")}>
            Create a Memory
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((it) =>
            it.kind === "memory" ? (
              <li key={`m-${it.id}`}>
                <button
                  onClick={() => navigate("/moments")}
                  className="group flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-2.5 text-left shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-warm">
                    {it.data.photo_url ? (
                      <img
                        src={it.data.photo_url}
                        alt={it.data.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                        memoryToneByCat[it.data.category] ?? "bg-muted text-muted-foreground",
                      )}
                    >
                      {it.data.category}
                    </span>
                    <h3 className="mt-1 line-clamp-1 text-[14px] font-semibold text-foreground">{it.data.title}</h3>
                    <p className="text-[12px] text-muted-foreground">
                      {formatDistanceToNow(it.date, { addSuffix: true })}
                    </p>
                  </div>
                </button>
              </li>
            ) : (
              <li key={`a-${it.id}`}>
                <button
                  onClick={() => navigate("/grow")}
                  className="group flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-2.5 text-left shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-accent/30 text-accent-foreground">
                    {it.data.photo_url ? (
                      <img
                        src={it.data.photo_url}
                        alt={it.data.subject}
                        loading="lazy"
                        className="h-full w-full rounded-xl object-cover"
                      />
                    ) : (
                      <Trophy className="h-7 w-7" strokeWidth={2.2} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="inline-block rounded-full bg-accent/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent-foreground">
                      {it.data.type}
                    </span>
                    <h3 className="mt-1 line-clamp-1 text-[14px] font-semibold text-foreground">{it.data.subject}</h3>
                    <p className="text-[12px] text-muted-foreground">
                      {formatDistanceToNow(it.date, { addSuffix: true })}
                      {it.data.grade ? ` · ${it.data.grade}` : ""}
                    </p>
                  </div>
                </button>
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
};
