import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  SCRAPBOOK_KIT,
  TRENDING_SEARCHES,
  searchWebElements,
  svgDataUrl,
  webElementToDataUrl,
  webElementUrl,
  type WebStyle,
} from "./elementLibrary";

interface Props {
  /** Adds an image element (an SVG data URL) to the page. */
  onAdd: (src: string, w: number, h: number) => void;
  /** Colour used for outline icons so they match the book's text. */
  outlineColor: string;
}

/** Canva-style element browser: search stickers from the web, plus a hand-made scrapbook kit. */
export const ElementsPanel = ({ onAdd, outlineColor }: Props) => {
  const [query, setQuery] = useState("");
  const [style, setStyle] = useState<WebStyle>("colorful");
  const [results, setResults] = useState<string[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  // Debounced web search
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults(null);
      setError(null);
      setSearching(false);
      return;
    }
    const ctrl = new AbortController();
    setSearching(true);
    setError(null);
    const t = setTimeout(async () => {
      try {
        setResults(await searchWebElements(q, style, ctrl.signal));
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError("Couldn't search right now. Check your connection and try again.");
        setResults([]);
      } finally {
        if (!ctrl.signal.aborted) setSearching(false);
      }
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, style]);

  const addWeb = async (icon: string) => {
    setAddingId(icon);
    try {
      const src = await webElementToDataUrl(icon, style === "outline" ? outlineColor : undefined);
      onAdd(src, 150, 150);
    } catch {
      setError("Couldn't add that one — try another.");
    } finally {
      setAddingId(null);
    }
  };

  const kitGroups = useMemo(() => {
    const map = new Map<string, typeof SCRAPBOOK_KIT>();
    SCRAPBOOK_KIT.forEach((k) => {
      if (!map.has(k.group)) map.set(k.group, []);
      map.get(k.group)!.push(k);
    });
    return Array.from(map.entries());
  }, []);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stickers: heart, bear, flowers…"
            className="h-10 rounded-xl pl-9 pr-9"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          {(["colorful", "outline"] as WebStyle[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStyle(s)}
              className={cn(
                "rounded-full border px-3 py-1 text-[12px] font-medium capitalize transition-colors",
                style === s ? "border-primary-deep bg-primary/25 text-primary-deep" : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {results === null ? (
        <div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Try searching</div>
          <div className="flex flex-wrap gap-1.5">
            {TRENDING_SEARCHES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setQuery(t)}
                className="rounded-full border bg-card px-2.5 py-1 text-[12px] hover:bg-muted"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>From the web</span>
            {searching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          </div>
          {error && <p className="mb-2 text-[12px] text-destructive">{error}</p>}
          {!searching && results.length === 0 && !error && (
            <p className="text-[12px] text-muted-foreground">Nothing found — try a simpler word.</p>
          )}
          <div className="grid grid-cols-4 gap-1.5">
            {results.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => addWeb(icon)}
                disabled={addingId !== null}
                title={icon.split(":")[1].replace(/-/g, " ")}
                className="relative flex aspect-square items-center justify-center rounded-lg border bg-white p-1.5 transition hover:ring-2 hover:ring-primary disabled:opacity-60"
              >
                <img
                  src={webElementUrl(icon, style === "outline" ? outlineColor : undefined)}
                  alt={icon.split(":")[1]}
                  loading="lazy"
                  className="h-full w-full object-contain"
                />
                {addingId === icon && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </span>
                )}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
            Stickers come from open-licence sets (Noto, Fluent Emoji, Flat Color Icons, Phosphor) via Iconify.
          </p>
        </div>
      )}

      {/* Scrapbook kit */}
      {results === null &&
        kitGroups.map(([group, items]) => (
          <div key={group}>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Scrapbook · {group}
            </div>
            <div className={cn("grid gap-1.5", group === "Washi tape" ? "grid-cols-2" : "grid-cols-3")}>
              {items.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => onAdd(svgDataUrl(k.svg), k.w, k.h)}
                  title={k.label}
                  className="flex items-center justify-center rounded-lg border bg-white p-2 transition hover:ring-2 hover:ring-primary"
                  style={{ aspectRatio: group === "Washi tape" ? "4 / 1.4" : "1 / 1" }}
                >
                  <img src={svgDataUrl(k.svg)} alt={k.label} className="max-h-full max-w-full object-contain" />
                </button>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
};
