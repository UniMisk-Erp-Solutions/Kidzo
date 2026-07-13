import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Country dial codes (most-used first). Value is the dial code without '+'. */
export const COUNTRY_CODES: { code: string; label: string; flag: string }[] = [
  { code: "91", label: "India", flag: "🇮🇳" },
  { code: "1", label: "USA / Canada", flag: "🇺🇸" },
  { code: "44", label: "United Kingdom", flag: "🇬🇧" },
  { code: "971", label: "UAE", flag: "🇦🇪" },
  { code: "61", label: "Australia", flag: "🇦🇺" },
  { code: "65", label: "Singapore", flag: "🇸🇬" },
  { code: "60", label: "Malaysia", flag: "🇲🇾" },
  { code: "64", label: "New Zealand", flag: "🇳🇿" },
  { code: "27", label: "South Africa", flag: "🇿🇦" },
  { code: "49", label: "Germany", flag: "🇩🇪" },
  { code: "33", label: "France", flag: "🇫🇷" },
  { code: "39", label: "Italy", flag: "🇮🇹" },
  { code: "34", label: "Spain", flag: "🇪🇸" },
  { code: "31", label: "Netherlands", flag: "🇳🇱" },
  { code: "353", label: "Ireland", flag: "🇮🇪" },
  { code: "966", label: "Saudi Arabia", flag: "🇸🇦" },
  { code: "974", label: "Qatar", flag: "🇶🇦" },
  { code: "965", label: "Kuwait", flag: "🇰🇼" },
  { code: "968", label: "Oman", flag: "🇴🇲" },
  { code: "973", label: "Bahrain", flag: "🇧🇭" },
  { code: "94", label: "Sri Lanka", flag: "🇱🇰" },
  { code: "977", label: "Nepal", flag: "🇳🇵" },
  { code: "880", label: "Bangladesh", flag: "🇧🇩" },
  { code: "92", label: "Pakistan", flag: "🇵🇰" },
  { code: "81", label: "Japan", flag: "🇯🇵" },
  { code: "82", label: "South Korea", flag: "🇰🇷" },
  { code: "86", label: "China", flag: "🇨🇳" },
  { code: "62", label: "Indonesia", flag: "🇮🇩" },
  { code: "63", label: "Philippines", flag: "🇵🇭" },
  { code: "66", label: "Thailand", flag: "🇹🇭" },
  { code: "84", label: "Vietnam", flag: "🇻🇳" },
  { code: "20", label: "Egypt", flag: "🇪🇬" },
  { code: "234", label: "Nigeria", flag: "🇳🇬" },
  { code: "254", label: "Kenya", flag: "🇰🇪" },
  { code: "55", label: "Brazil", flag: "🇧🇷" },
  { code: "52", label: "Mexico", flag: "🇲🇽" },
];

/** Build the E.164 number Supabase expects, e.g. "+919876543210". */
export const toE164 = (dial: string, local: string) =>
  `+${dial}${local.replace(/[^0-9]/g, "")}`;

/** Split an E.164 number back into (dial, local) for display. */
export const fromE164 = (e164?: string | null): { dial: string; local: string } => {
  const digits = (e164 ?? "").replace(/[^0-9]/g, "");
  if (!digits) return { dial: "91", local: "" };
  const match = [...COUNTRY_CODES]
    .sort((a, b) => b.code.length - a.code.length)
    .find((c) => digits.startsWith(c.code));
  return match
    ? { dial: match.code, local: digits.slice(match.code.length) }
    : { dial: "91", local: digits };
};

export const PhoneField = ({
  dial,
  local,
  onDialChange,
  onLocalChange,
  id = "phone",
  disabled,
}: {
  dial: string;
  local: string;
  onDialChange: (v: string) => void;
  onLocalChange: (v: string) => void;
  id?: string;
  disabled?: boolean;
}) => (
  <div className="flex gap-2">
    <Select value={dial} onValueChange={onDialChange} disabled={disabled}>
      <SelectTrigger className="h-11 w-[132px] shrink-0 rounded-xl" aria-label="Country code">
        <SelectValue>
          {(() => {
            const c = COUNTRY_CODES.find((x) => x.code === dial);
            return c ? `${c.flag} +${c.code}` : `+${dial}`;
          })()}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {COUNTRY_CODES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.flag} +{c.code} · {c.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    <Input
      id={id}
      type="tel"
      inputMode="numeric"
      autoComplete="tel-national"
      required
      disabled={disabled}
      placeholder="WhatsApp number"
      value={local}
      onChange={(e) => onLocalChange(e.target.value.replace(/[^0-9]/g, ""))}
      className="h-11 flex-1 rounded-xl"
    />
  </div>
);
