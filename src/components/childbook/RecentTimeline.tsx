import { useState } from "react";
import { ChevronDown, ChevronRight, ImageIcon, Sparkles, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, subDays } from "date-fns";
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

/** How far back "Recent activity" looks before "See all" is needed. */
const RECENT_DAYS = 7;

const rowClass =
  "group flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-2.5 text-left shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift";

const MemoryRow = ({ memory, date, onOpen }: { memory: Memory; date: Date; onOpen: () => void }) => (
  <button onClick={onOpen} className={rowClass}>
    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-warm">
      {memory.photo_url ? (
        <img
          src={memory.photo_url}
          alt={memory.title}
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
          memoryToneByCat[memory.category] ?? "bg-muted text-muted-foreground",
        )}
      >
        {memory.category}
      </span>
      <h3 className="mt-1 line-clamp-1 text-[14px] font-semibold text-foreground">{memory.title}</h3>
      <p className="text-[12px] text-muted-foreground">{formatDistanceToNow(date, { addSuffix: true })}</p>
    </div>
  </button>
);

const AchievementRow = ({ achievement, date, onOpen }: { achievement: Achievement; date: Date; onOpen: () => void }) => (
  <button onClick={onOpen} className={rowClass}>
    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-accent/30 text-accent-foreground">
      {achievement.photo_url ? (
        <img src={achievement.photo_url} alt={achievement.subject} loading="lazy" className="h-full w-full rounded-xl object-cover" />
      ) : (
        <Trophy className="h-7 w-7" strokeWidth={2.2} />
      )}
    </div>
    <div className="min-w-0 flex-1">
      <span className="inline-block rounded-full bg-accent/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent-foreground">
        {achievement.type}
      </span>
      <h3 className="mt-1 line-clamp-1 text-[14px] font-semibold text-foreground">{achievement.subject}</h3>
      <p className="text-[12px] text-muted-foreground">
        {formatDistanceToNow(date, { addSuffix: true })}
        {achievement.grade ? ` · ${achievement.grade}` : ""}
      </p>
    </div>
  </button>
);

/** Every memory and achievement, newest first. */
const buildFeed = (memories: Memory[], achievements: Achievement[]): FeedItem[] =>
  [
    ...memories.map<FeedItem>((m) => ({ kind: "memory", id: m.id, date: new Date(m.happened_at), data: m })),
    ...achievements.map<FeedItem>((a) => ({ kind: "achievement", id: a.id, date: new Date(a.achievement_date), data: a })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

const EmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
    <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/25 text-primary-deep">
      <Sparkles className="h-6 w-6" />
    </span>
    <h3 className="text-[16px] font-semibold text-foreground">Nothing here yet</h3>
    <p className="mt-1 text-[14px] text-muted-foreground">Capture your first moment or achievement.</p>
    <Button variant="warm" size="sm" className="mt-4" onClick={onCreate}>
      Create a Memory
    </Button>
  </div>
);

interface Props {
  memories: Memory[];
  achievements: Achievement[];
}

/** The last week of memories and achievements; "See all" opens everything in place. */
export const RecentTimeline = ({ memories, achievements }: Props) => {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  const feed = buildFeed(memories, achievements);
  const weekAgo = subDays(new Date(), RECENT_DAYS);
  const items = showAll ? feed : feed.filter((it) => it.date >= weekAgo);
  const hasOlder = feed.length > items.length;

  return (
    <section aria-label="Recent activity" className="animate-fade-in-up">
      <header className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">{showAll ? "All activity" : "Recent activity"}</h2>
          <p className="text-[13px] text-muted-foreground">
            {showAll ? "Every memory and achievement" : `Memories and achievements from the last ${RECENT_DAYS} days`}
          </p>
        </div>
        {(hasOlder || showAll) && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[13px] font-medium text-primary-deep transition-colors hover:bg-primary/15"
          >
            {showAll ? "Show less" : "See all"}
            {showAll ? <ChevronDown className="h-4 w-4 rotate-180" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        )}
      </header>

      {feed.length === 0 && <EmptyState onCreate={() => navigate("/moments/new")} />}
      {feed.length > 0 && items.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border bg-card/60 p-6 text-center text-[14px] text-muted-foreground">
          Nothing new in the last {RECENT_DAYS} days. Tap “See all” to look back.
        </p>
      )}
      {items.length > 0 && (
        <ul className="space-y-4">
          {items.map((it) => (
            <li key={`${it.kind}-${it.id}`}>
              {it.kind === "memory" ? (
                <MemoryRow memory={it.data} date={it.date} onOpen={() => navigate("/moments")} />
              ) : (
                <AchievementRow achievement={it.data} date={it.date} onOpen={() => navigate("/grow")} />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
