import { ArrowLeft, ImageIcon, Plus, Sparkles } from "lucide-react";
import type { Memory } from "@/hooks/useMemories";
import { Button } from "@/components/ui/button";
import { MemoryPolaroid } from "./MemoryPolaroid";

export interface YearAlbum {
  year: number;
  items: Memory[];
  cover: string | null;
}

const countLabel = (n: number) => `${n} ${n === 1 ? "memory" : "memories"}`;

/** One cover card per year. */
export const YearCard = ({ album, onSelect }: { album: YearAlbum; onSelect: (year: number) => void }) => (
  <button
    onClick={() => onSelect(album.year)}
    className="rounded-md border border-border bg-card p-2 pb-3 text-left shadow-soft transition-all odd:-rotate-1 even:rotate-1 hover:-translate-y-0.5 hover:rotate-0"
  >
    <div className="aspect-[4/3] overflow-hidden rounded bg-muted">
      {album.cover ? (
        <img src={album.cover} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <ImageIcon className="h-7 w-7" />
        </div>
      )}
    </div>
    <div className="mt-2 px-1">
      <div className="font-display text-[20px] font-semibold leading-tight text-foreground">{album.year}</div>
      <div className="text-[12px] text-muted-foreground">{countLabel(album.items.length)}</div>
    </div>
  </button>
);

interface EmptyYearProps {
  year: number;
  category: string;
  onCreate?: () => void;
}

const EmptyYear = ({ year, category, onCreate }: EmptyYearProps) => {
  const filtered = category !== "All";
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/25 text-primary-deep">
        <Sparkles className="h-7 w-7" />
      </span>
      <h3 className="text-lg font-semibold text-foreground">
        {filtered ? `No ${category.toLowerCase()} memories in ${year}` : `No memories in ${year}`}
      </h3>
      <p className="mt-1.5 text-[14px] text-muted-foreground">
        {filtered ? "Pick another category, or add one to this year." : "Add one to this year."}
      </p>
      {onCreate && (
        <Button variant="warm" className="mt-4" onClick={onCreate}>
          <Plus className="h-4 w-4" /> Add a memory
        </Button>
      )}
    </div>
  );
};

interface OpenYearProps {
  album: YearAlbum;
  category: string;
  onBack: () => void;
  onOpen: (m: Memory) => void;
  linkedLabelFor?: (m: Memory) => string | undefined;
  onCreate?: () => void;
}

/** One opened year: its heading and its memories as polaroids. */
export const OpenYear = ({ album, category, onBack, onOpen, linkedLabelFor, onCreate }: OpenYearProps) => (
  <section key={album.year} className="animate-fade-in">
    <button
      onClick={onBack}
      className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-muted-foreground hover:bg-muted"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> All years
    </button>
    <div className="mb-6 flex items-center gap-4">
      <span className="-rotate-2 rounded-sm border-[3px] border-double border-primary-deep/50 bg-card px-4 py-0.5 font-display text-[24px] font-semibold tracking-wide text-primary-deep shadow-soft">
        {album.year}
      </span>
      <span className="h-0 flex-1 border-t-2 border-dashed border-primary/40" aria-hidden />
      <span className="text-[12px] text-muted-foreground">{countLabel(album.items.length)}</span>
    </div>
    {album.items.length === 0 ? (
      <EmptyYear year={album.year} category={category} onCreate={onCreate} />
    ) : (
      <ul className="flex flex-wrap gap-x-7 gap-y-9 px-1">
        {album.items.map((m, i) => (
          <li key={m.id} className="w-[calc(50%-14px)] min-w-[150px] sm:w-[220px]">
            <MemoryPolaroid memory={m} index={i} onOpen={onOpen} linkedLabel={linkedLabelFor?.(m)} />
          </li>
        ))}
      </ul>
    )}
  </section>
);
