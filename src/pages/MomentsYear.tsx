import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ArrowDownUp, ArrowLeft, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/childbook/TopBar";
import { BottomNav } from "@/components/childbook/BottomNav";
import { MemoryDetail } from "@/components/childbook/MemoryDetail";
import { MemoryMediaThumbnail } from "@/components/childbook/MemoryMediaThumbnail";
import { memoryMediaOf } from "@/lib/memoryMedia";
import { useActiveChild } from "@/hooks/useActiveChild";
import { useMemoriesInYears } from "@/hooks/useMemoryPages";
import type { Memory } from "@/hooks/useMemories";

const Tile = ({ m, onOpen }: { m: Memory; onOpen: (m: Memory) => void }) => {
  const media = memoryMediaOf(m);
  const cover = media[0];
  const extra = media.length - 1;
  return (
    <button
      type="button"
      onClick={() => onOpen(m)}
      className="group relative block aspect-square w-full overflow-hidden rounded-2xl border border-border bg-gradient-warm text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {cover ? (
        <MemoryMediaThumbnail item={cover} alt={m.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center text-muted-foreground">
          <ImageIcon className="h-6 w-6" />
          <span className="line-clamp-3 text-[12px] font-medium text-foreground/80">{m.title}</span>
        </div>
      )}
      {extra > 0 && (
        <span className="absolute right-2 top-2 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-soft">+{extra}</span>
      )}
      {cover && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-2.5 pt-8">
          <p className="font-caption line-clamp-1 text-[13px] text-white">{m.title}</p>
          <p className="text-[10.5px] text-white/80">{format(new Date(m.happened_at), "MMM d")}</p>
        </div>
      )}
    </button>
  );
};

/** Every memory from one year as a scrollable photo gallery. Reached from "See more" on the Moments grid. */
const MomentsYear = () => {
  const navigate = useNavigate();
  const { year: yearParam } = useParams();
  const year = Number(yearParam);
  const validYear = Number.isInteger(year) && year > 1900 && year < 3000;
  const { data: child } = useActiveChild();
  const { data, isLoading } = useMemoriesInYears(child?.id, validYear ? year : undefined, validYear ? year : undefined);
  const [oldestFirst, setOldestFirst] = useState(false);
  const [open, setOpen] = useState<Memory | null>(null);

  const memories = useMemo(() => {
    const list = [...(data ?? [])];
    list.sort((a, b) => new Date(a.happened_at).getTime() - new Date(b.happened_at).getTime());
    return oldestFirst ? list : list.reverse();
  }, [data, oldestFirst]);

  return (
    <div className="min-h-screen bg-background pb-28">
      <TopBar childName={child?.name ?? "Your child"} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" className="-ml-3" onClick={() => navigate("/moments")}>
            <ArrowLeft className="h-4 w-4" /> Moments
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => setOldestFirst((v) => !v)}>
            <ArrowDownUp className="h-4 w-4" /> {oldestFirst ? "Oldest first" : "Newest first"}
          </Button>
        </div>

        <div className="mb-6 mt-4 flex items-center gap-4">
          <span className="-rotate-2 rounded-sm border-[3px] border-double border-primary-deep/50 bg-card px-4 py-0.5 font-display text-[26px] font-semibold tracking-wide text-primary-deep shadow-soft">
            {validYear ? year : "Year"}
          </span>
          <span className="h-0 flex-1 border-t-2 border-dashed border-primary/40" aria-hidden />
          <span className="text-[12px] text-muted-foreground">
            {memories.length} {memories.length === 1 ? "memory" : "memories"}
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : memories.length === 0 ? (
          <p className="py-16 text-center text-[14px] text-muted-foreground">No memories found for this year.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
            {memories.map((m) => (
              <li key={m.id}>
                <Tile m={m} onOpen={setOpen} />
              </li>
            ))}
          </ul>
        )}
      </main>
      <MemoryDetail memory={open} onClose={() => setOpen(null)} />
      <BottomNav />
    </div>
  );
};

export default MomentsYear;
