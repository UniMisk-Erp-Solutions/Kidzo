import { ChevronRight, ImageIcon, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import type { Memory } from "@/hooks/useMemories";
import { cn } from "@/lib/utils";

const tagStyles: Record<string, string> = {
  Milestone: "bg-accent/40 text-accent-foreground",
  Celebration: "bg-secondary/30 text-secondary",
  Everyday: "bg-primary/30 text-primary-deep",
  Cozy: "bg-muted text-muted-foreground",
  Adventure: "bg-success/25 text-success",
  Family: "bg-warning/25 text-warning-foreground",
};

interface Props {
  memories: Memory[];
}

export const RecentMoments = ({ memories }: Props) => {
  const navigate = useNavigate();

  return (
    <section aria-label="Recent moments" className="animate-fade-in-up">
      <header className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Recent moments</h2>
          <p className="text-[13px] text-muted-foreground">Little stories from this month</p>
        </div>
        {memories.length > 0 && (
          <button
            onClick={() => navigate("/moments")}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[13px] font-medium text-primary-deep transition-colors hover:bg-primary/15"
          >
            See all <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </header>

      {memories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/25 text-primary-deep">
            <Sparkles className="h-6 w-6" />
          </span>
          <h3 className="text-[16px] font-semibold text-foreground">No memories yet</h3>
          <p className="mt-1 text-[14px] text-muted-foreground">Let's capture your first moment.</p>
          <Button variant="warm" size="sm" className="mt-4" onClick={() => navigate("/moments/new")}>
            Create a Memory
          </Button>
        </div>
      ) : (
        <div className="-mx-6 overflow-x-auto scrollbar-hide">
          <ul className="flex gap-4 px-6 pb-2">
            {memories.map((m) => (
              <li
                key={m.id}
                className="group w-[180px] flex-shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lift sm:w-[220px]"
              >
                <button onClick={() => navigate("/moments")} className="block w-full text-left">
                  <div className="aspect-square overflow-hidden bg-gradient-warm">
                    {m.photo_url ? (
                      <img
                        src={m.photo_url}
                        alt={m.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 sm:p-4">
                    <span
                      className={cn(
                        "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                        tagStyles[m.category] ?? "bg-muted text-muted-foreground",
                      )}
                    >
                      {m.category}
                    </span>
                    <h3 className="mt-2 line-clamp-2 text-[14px] font-semibold leading-snug text-foreground">
                      {m.title}
                    </h3>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      {formatDistanceToNow(new Date(m.happened_at), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
