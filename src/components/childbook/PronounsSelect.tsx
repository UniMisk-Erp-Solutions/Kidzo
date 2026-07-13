import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const PRONOUN_OPTIONS = ["she/her", "he/him", "they/them"] as const;
const NONE = "__none__";

/**
 * Pronouns picker. Stores the same plain text as before ("she/her", ...), so
 * existing child_profiles.pronouns values keep working. If a child already has
 * a custom/legacy value, it's shown as an extra option so it is never lost.
 */
export const PronounsSelect = ({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  id?: string;
}) => {
  const legacy = value && !PRONOUN_OPTIONS.includes(value as (typeof PRONOUN_OPTIONS)[number]) ? value : null;

  return (
    <Select value={value ? value : NONE} onValueChange={(v) => onChange(v === NONE ? "" : v)}>
      <SelectTrigger id={id} className="h-11 rounded-xl">
        <SelectValue placeholder="Select pronouns" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>Prefer not to say</SelectItem>
        {PRONOUN_OPTIONS.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
        {legacy && <SelectItem value={legacy}>{legacy}</SelectItem>}
      </SelectContent>
    </Select>
  );
};
