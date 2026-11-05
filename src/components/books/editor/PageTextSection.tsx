import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PageTextField, TextOverrides } from "./pageText";

interface RowProps {
  field: PageTextField;
  value: string;
  edited: boolean;
  showGroup: boolean;
  onChange: (value: string) => void;
  onReset: () => void;
  onStyle: () => void;
}

const FieldRow = ({ field, value, edited, showGroup, onChange, onReset, onStyle }: RowProps) => (
  <div>
    {showGroup && <div className="mb-1 truncate text-[11px] font-semibold text-foreground">{field.group}</div>}
    <div className="mb-1 flex items-center justify-between">
      <Label className="text-[11px] text-muted-foreground">{field.label}</Label>
      <div className="flex items-center gap-2">
        {edited && (
          <button type="button" className="text-[11px] text-muted-foreground hover:text-foreground" onClick={onReset}>
            Reset
          </button>
        )}
        <button
          type="button"
          disabled={!value.trim()}
          className="text-[11px] font-medium text-primary-deep hover:underline disabled:opacity-40"
          onClick={onStyle}
        >
          Style
        </button>
      </div>
    </div>
    {field.multiline ? (
      <Textarea value={value} rows={3} onChange={(e) => onChange(e.target.value)} className="text-[13px]" />
    ) : (
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-9 text-[13px]" />
    )}
  </div>
);

interface Props {
  fields: PageTextField[];
  overrides: TextOverrides;
  onChange: (key: string, original: string, value: string) => void;
  /** Move a text into a free text box so it can be styled. */
  onStyle: (key: string, current: string) => void;
}

/** The page's own words (titles, stories, names) — rewrite them, or move one into a styled text box. */
export const PageTextSection = ({ fields, overrides, onChange, onStyle }: Props) => {
  if (fields.length === 0) return null;
  return (
    <section className="rounded-md border bg-muted/30 p-2">
      <div className="mb-2 text-xs font-bold uppercase tracking-wide">Page text</div>
      <p className="mb-2 text-[11px] text-muted-foreground">
        Change the words that are already on this page. Use “Style” to change the font, size and colour.
      </p>
      <div className="space-y-3">
        {fields.map((f, i) => {
          const edited = f.key in overrides;
          const value = edited ? overrides[f.key] : f.original;
          return (
            <FieldRow
              key={f.key}
              field={f}
              value={value}
              edited={edited}
              showGroup={f.group !== undefined && f.group !== fields[i - 1]?.group}
              onChange={(v) => onChange(f.key, f.original, v)}
              onReset={() => onChange(f.key, f.original, f.original)}
              onStyle={() => onStyle(f.key, value)}
            />
          );
        })}
      </div>
    </section>
  );
};
