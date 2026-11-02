import { useMemo } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUserBook } from "@/hooks/useUserBooks";
import { useMemories } from "@/hooks/useMemories";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The book being edited — its child's uploaded photos are what we offer. */
  bookId?: string;
  onPick: (url: string) => void;
}

/** Lets the user add a photo to a page from the photos already uploaded to their memories. */
export const MemoryPhotoPicker = ({ open, onOpenChange, bookId, onPick }: Props) => {
  const { data: book } = useUserBook(bookId);
  const { data: memories = [], isLoading } = useMemories(book?.child_id);

  // Every uploaded photo, newest memory first, each URL once.
  const photos = useMemo(() => {
    const seen = new Set<string>();
    const out: { url: string; title: string; date: string }[] = [];
    [...memories]
      .sort((a, b) => new Date(b.happened_at).getTime() - new Date(a.happened_at).getTime())
      .forEach((m) => {
        const urls = m.photo_urls?.length ? m.photo_urls : m.photo_url ? [m.photo_url] : [];
        urls.forEach((url) => {
          if (!url || seen.has(url)) return;
          seen.add(url);
          out.push({ url, title: m.title, date: m.happened_at });
        });
      });
    return out;
  }, [memories]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] max-w-2xl flex-col gap-3 p-4">
        <DialogHeader>
          <DialogTitle>Add an image</DialogTitle>
          <DialogDescription>Choose from the photos you've already uploaded.</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : photos.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="text-sm font-semibold">No photos uploaded yet</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Add a moment with photos first, then come back to use them here.
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link to="/moments/new">Add a moment</Link>
              </Button>
            </div>
          ) : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {photos.map((p) => (
                <li key={p.url}>
                  <button
                    type="button"
                    onClick={() => {
                      onPick(p.url);
                      onOpenChange(false);
                    }}
                    className="group relative block aspect-square w-full overflow-hidden rounded-xl border bg-muted transition hover:ring-2 hover:ring-primary"
                    title={`${p.title} · ${format(new Date(p.date), "PP")}`}
                  >
                    <img src={p.url} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-1.5 py-0.5 text-left text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                      {p.title}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
