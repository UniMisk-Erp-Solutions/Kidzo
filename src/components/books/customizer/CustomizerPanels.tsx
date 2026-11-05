import { RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BookTemplateColors } from "@/hooks/useBookTemplates";

export const PRESETS: { name: string; colors: BookTemplateColors }[] = [
  { name: "Warm", colors: { primary: "#E8A087", accent: "#D4B896", gold: "#D4B896", coral: "#E8A087", text: "#3E3E42" } },
  { name: "Cool", colors: { primary: "#A8C5BA", accent: "#7FA8B5", gold: "#C9D8E0", coral: "#9DB7C9", text: "#2E3A3F" } },
  { name: "Elegant", colors: { primary: "#3E3E42", accent: "#D4B896", gold: "#C9A06C", coral: "#9B7B6B", text: "#1F1F22" } },
  { name: "Soft", colors: { primary: "#F5E6D3", accent: "#E8C5B4", gold: "#F0D9B5", coral: "#F2B8A2", text: "#5E4D45" } },
];

const COLOR_KEYS: (keyof BookTemplateColors)[] = ["primary", "accent", "gold", "coral", "text"];

/** A colour the native picker accepts (#rrggbb); templates can leave a colour empty. */
const safeHex = (v?: string) => (/^#[0-9a-f]{6}$/i.test(v ?? "") ? (v as string) : "#000000");

/* ───────── Cover preview ───────── */
export const CoverPreview = ({ colors, templateName, title, subtitle, childName }: {
  colors: BookTemplateColors; templateName?: string; title: string; subtitle: string; childName: string;
}) => (
  <div className="overflow-hidden rounded-3xl border shadow-soft" style={{ backgroundColor: colors.primary }}>
    <div className="relative aspect-[4/5] flex flex-col items-center justify-center p-8 text-center">
      <div className="absolute inset-4 rounded-2xl border-2" style={{ borderColor: colors.accent }} />
      <div className="text-[11px] font-semibold uppercase tracking-[0.3em]" style={{ color: colors.accent }}>
        {templateName}
      </div>
      <h2
        className="mt-3 max-w-md text-balance text-[28px] font-bold leading-tight md:text-[36px]"
        style={{ color: colors.text }}
      >
        {title || "Untitled book"}
      </h2>
      {subtitle && (
        <p className="mt-3 max-w-sm text-[14px]" style={{ color: colors.text, opacity: 0.75 }}>
          {subtitle}
        </p>
      )}
      <div
        className="mt-6 inline-block rounded-full px-4 py-1 text-[11px] font-semibold uppercase tracking-wider"
        style={{ backgroundColor: colors.gold, color: colors.text }}
      >
        {childName}
      </div>
    </div>
  </div>
);

/* ───────── Page thumbnails ───────── */
interface ThumbMemory { photo_url?: string | null }

const PageThumb = ({ memory, index, total, onMove, onRemove }: {
  memory: ThumbMemory; index: number; total: number; onMove: (delta: number) => void; onRemove: () => void;
}) => (
  <div className="group relative overflow-hidden rounded-xl border bg-card">
    <div className="aspect-[3/4] bg-muted">
      {memory.photo_url && <img src={memory.photo_url} alt="" className="h-full w-full object-cover" loading="lazy" />}
    </div>
    <div className="absolute left-1 top-1 rounded-md bg-background/90 px-1.5 py-0.5 text-[10px] font-bold">{index + 1}</div>
    <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100">
      <button onClick={() => onMove(-1)} disabled={index === 0} className="rounded bg-background px-1.5 text-[10px] font-bold disabled:opacity-30">
        ←
      </button>
      <button onClick={onRemove} className="rounded bg-background px-1.5 text-[10px] font-bold text-destructive">
        ×
      </button>
      <button onClick={() => onMove(1)} disabled={index === total - 1} className="rounded bg-background px-1.5 text-[10px] font-bold disabled:opacity-30">
        →
      </button>
    </div>
  </div>
);

export const PageThumbnails = ({ pageOrder, memoriesById, onMove, onRemove }: {
  pageOrder: string[];
  memoriesById: Record<string, ThumbMemory>;
  onMove: (index: number, delta: number) => void;
  onRemove: (index: number) => void;
}) => (
  <div className="mt-6">
    <h3 className="mb-3 text-[14px] font-semibold">Pages ({pageOrder.length})</h3>
    {pageOrder.length === 0 ? (
      <div className="rounded-2xl border border-dashed p-6 text-center text-[13px] text-muted-foreground">
        No memories selected. Go back to add some.
      </div>
    ) : (
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {pageOrder.map((mid, idx) => {
          const memory = memoriesById[mid];
          if (!memory) return null;
          return (
            <PageThumb
              key={mid}
              memory={memory}
              index={idx}
              total={pageOrder.length}
              onMove={(delta) => onMove(idx, delta)}
              onRemove={() => onRemove(idx)}
            />
          );
        })}
      </div>
    )}
  </div>
);

/* ───────── Side panels ───────── */
export const TitlePanel = ({ title, subtitle, onTitle, onSubtitle }: {
  title: string; subtitle: string; onTitle: (v: string) => void; onSubtitle: (v: string) => void;
}) => (
  <section className="rounded-2xl border bg-card p-4">
    <h3 className="text-[14px] font-semibold">Title & subtitle</h3>
    <div className="mt-3 space-y-3">
      <div>
        <Label htmlFor="title" className="text-[12px]">Book title</Label>
        <Input id="title" value={title} onChange={(e) => onTitle(e.target.value)} placeholder="Clara's first year" />
      </div>
      <div>
        <Label htmlFor="subtitle" className="text-[12px]">Subtitle (optional)</Label>
        <Input id="subtitle" value={subtitle} onChange={(e) => onSubtitle(e.target.value)} placeholder="A year of growth & joy" />
      </div>
    </div>
  </section>
);

const ColorRow = ({ name, value, onChange }: { name: string; value?: string; onChange: (v: string) => void }) => (
  <div className="flex items-center gap-3">
    <label className="w-16 text-[12px] capitalize text-muted-foreground">{name}</label>
    <input
      type="color"
      value={safeHex(value)}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-12 cursor-pointer rounded-lg border bg-transparent"
    />
    <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="h-9 font-mono text-[12px]" />
  </div>
);

const PresetButton = ({ preset, onPick }: { preset: (typeof PRESETS)[number]; onPick: () => void }) => (
  <button
    onClick={onPick}
    className="group flex items-center gap-2 rounded-xl border p-2 text-left text-[12px] transition hover:border-primary"
  >
    <div className="flex -space-x-1">
      {COLOR_KEYS.slice(0, 4).map((k) => (
        <span key={k} className="h-4 w-4 rounded-full border border-card" style={{ backgroundColor: preset.colors[k] }} />
      ))}
    </div>
    <span className="font-medium">{preset.name}</span>
  </button>
);

export const ColorsPanel = ({ colors, onChange, onReset }: {
  colors: BookTemplateColors; onChange: (next: BookTemplateColors) => void; onReset: () => void;
}) => (
  <section className="rounded-2xl border bg-card p-4">
    <div className="flex items-center justify-between">
      <h3 className="text-[14px] font-semibold">Colors</h3>
      <button onClick={onReset} className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground">
        <RotateCcw className="h-3 w-3" /> Reset
      </button>
    </div>
    <div className="mt-3 space-y-3">
      {COLOR_KEYS.map((key) => (
        <ColorRow key={key} name={key} value={colors[key]} onChange={(v) => onChange({ ...colors, [key]: v })} />
      ))}
    </div>
    <div className="mt-4">
      <div className="mb-2 text-[12px] font-medium text-muted-foreground">Presets</div>
      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map((p) => <PresetButton key={p.name} preset={p} onPick={() => onChange(p.colors)} />)}
      </div>
    </div>
  </section>
);

export const SummaryPanel = ({ templateName, pages, target }: { templateName?: string; pages: number; target: number }) => (
  <section className="rounded-2xl border bg-card p-4">
    <h3 className="text-[14px] font-semibold">Summary</h3>
    <ul className="mt-3 space-y-1.5 text-[13px]">
      <li className="flex justify-between">
        <span className="text-muted-foreground">Template</span>
        <span className="font-medium">{templateName}</span>
      </li>
      <li className="flex justify-between">
        <span className="text-muted-foreground">Pages</span>
        <span className="font-medium">{pages}</span>
      </li>
      <li className="flex justify-between">
        <span className="text-muted-foreground">Target</span>
        <span className="font-medium">{target}</span>
      </li>
    </ul>
  </section>
);
