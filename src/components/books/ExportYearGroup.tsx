import { ChevronDown } from "lucide-react";
import { ExportMemoryCard } from "@/components/books/ExportMemoryCard";
import type { Memory } from "@/hooks/useMemories";
import type { YearItem } from "@/hooks/useYearGroups";

interface HeaderProps {
  year: number;
  open: boolean;
  pickedCount: number;
  total: number;
  onToggleOpen: () => void;
  onToggleAll: () => void;
}

const YearHeader = ({ year, open, pickedCount, total, onToggleOpen, onToggleAll }: HeaderProps) => (
  <div className="flex items-center gap-2 bg-muted/40 pr-3">
    <button
      type="button"
      onClick={onToggleOpen}
      aria-expanded={open}
      className="flex min-w-0 flex-1 items-center gap-2 px-3 py-3 text-left"
    >
      <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
      <span className="font-display text-[15px] font-bold text-foreground">{year}</span>
      <span className="truncate text-xs text-muted-foreground">
        {pickedCount} of {total} selected
      </span>
    </button>
    <button type="button" onClick={onToggleAll} className="shrink-0 text-xs font-medium text-primary-deep hover:underline">
      {pickedCount === total ? "None" : "All"}
    </button>
  </div>
);

const photosOf = (m: Memory) => (m.photo_urls?.length ? m.photo_urls : m.photo_url ? [m.photo_url] : []);

interface Props {
  year: number;
  items: YearItem<Memory>[];
  open: boolean;
  selected: Set<string>;
  coverOverrides: Record<string, string>;
  onToggleOpen: () => void;
  onSetAll: (ids: string[], on: boolean) => void;
  onToggleSelected: (id: string) => void;
  onCover: (id: string, url: string) => void;
  /** Swap two memories' positions in the full list (used to reorder within the year). */
  onSwap: (from: number, to: number | undefined) => void;
}

/** One collapsible year of memories on the Export page. */
export const ExportYearGroup = ({
  year,
  items,
  open,
  selected,
  coverOverrides,
  onToggleOpen,
  onSetAll,
  onToggleSelected,
  onCover,
  onSwap,
}: Props) => {
  const pickedCount = items.filter(({ m }) => selected.has(m.id)).length;
  return (
    <section className="overflow-hidden rounded-xl border border-border">
      <YearHeader
        year={year}
        open={open}
        pickedCount={pickedCount}
        total={items.length}
        onToggleOpen={onToggleOpen}
        onToggleAll={() => onSetAll(items.map(({ m }) => m.id), pickedCount !== items.length)}
      />
      {open && (
        <ul className="grid grid-cols-1 gap-5 p-3 min-[480px]:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {items.map(({ m, idx }, pos) => {
            const photos = photosOf(m);
            const prevIdx = items[pos - 1]?.idx;
            const nextIdx = items[pos + 1]?.idx;
            return (
              <ExportMemoryCard
                key={m.id}
                title={m.title}
                date={m.happened_at}
                photos={photos}
                coverUrl={coverOverrides[m.id] ?? photos[0]}
                selected={selected.has(m.id)}
                onToggle={() => onToggleSelected(m.id)}
                onCover={(url) => onCover(m.id, url)}
                onMove={(dir) => onSwap(idx, dir < 0 ? prevIdx : nextIdx)}
                canPrev={prevIdx !== undefined}
                canNext={nextIdx !== undefined}
              />
            );
          })}
        </ul>
      )}
    </section>
  );
};
