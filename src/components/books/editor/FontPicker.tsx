import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { FONT_LIBRARY, fontStack, loadFonts, type FontGroup } from "./fonts";

interface Props {
  /** Current Google font family, or undefined when one of the built-in styles is in use. */
  family?: string;
  /** Label of the built-in style shown when no family is chosen (e.g. "Handwritten"). */
  builtInLabel: string;
  onPick: (family: string) => void;
  /** The book's original font styles, offered at the top of the list. */
  builtIns?: { value: string; label: string }[];
  onPickBuiltIn?: (value: string) => void;
}

const GROUP_ORDER: FontGroup[] = ["Handwriting", "Script", "Fun", "Elegant", "Typewriter"];

/** Searchable font list; every option is drawn in its own font. */
export const FontPicker = ({ family, builtInLabel, onPick, builtIns, onPickBuiltIn }: Props) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  // Load the whole list once, the first time the picker opens, so previews show real fonts.
  useEffect(() => {
    if (open) void loadFonts(FONT_LIBRARY.map((f) => f.family));
  }, [open]);
  // A saved font must be loaded to show on the trigger button too.
  useEffect(() => {
    if (family) void loadFonts([family]);
  }, [family]);

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return GROUP_ORDER.map((g) => ({
      group: g,
      fonts: FONT_LIBRARY.filter((f) => f.group === g && (!needle || f.family.toLowerCase().includes(needle))),
    })).filter((g) => g.fonts.length > 0);
  }, [q]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-md border bg-background px-2 py-1.5 text-left text-sm"
          style={family ? { fontFamily: fontStack(family) } : undefined}
        >
          <span className="truncate">{family ?? builtInLabel}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-[260px] p-2">
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search fonts…" className="h-8 pl-8 text-[13px]" />
        </div>
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {!q && builtIns && onPickBuiltIn && (
            <div>
              <div className="px-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Book styles</div>
              <div className="flex flex-wrap gap-1 px-1">
                {builtIns.map((b) => (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => {
                      onPickBuiltIn(b.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[12px] hover:bg-muted",
                      !family && b.label === builtInLabel && "border-primary-deep bg-primary/15",
                    )}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {groups.length === 0 && <p className="px-1 py-3 text-center text-[12px] text-muted-foreground">No fonts match.</p>}
          {groups.map(({ group, fonts }) => (
            <div key={group}>
              <div className="px-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{group}</div>
              {fonts.map((f) => (
                <button
                  key={f.family}
                  type="button"
                  onClick={() => {
                    onPick(f.family);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[18px] leading-tight hover:bg-muted",
                    family === f.family && "bg-primary/15",
                  )}
                  style={{ fontFamily: fontStack(f.family) }}
                >
                  <span className="truncate">{f.family}</span>
                  {family === f.family && <Check className="h-4 w-4 shrink-0 text-primary-deep" />}
                </button>
              ))}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
