import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Country = { code: string; label: string; flag: string; ex?: string };

/** Country dial codes (most-used first). `code` is the dial code without '+'. */
export const COUNTRY_CODES: Country[] = [
  { code: "91", label: "India", flag: "🇮🇳", ex: "98765 43210" },
  { code: "1", label: "USA / Canada", flag: "🇺🇸", ex: "415 555 0132" },
  { code: "44", label: "United Kingdom", flag: "🇬🇧", ex: "7400 123456" },
  { code: "971", label: "UAE", flag: "🇦🇪", ex: "50 123 4567" },
  { code: "61", label: "Australia", flag: "🇦🇺", ex: "412 345 678" },
  { code: "65", label: "Singapore", flag: "🇸🇬", ex: "8123 4567" },
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

/**
 * One fused control: searchable country dropdown (flag + dial code) on the left,
 * the national number on the right. The user never types the "+91" part.
 */
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
}) => {
  const [open, setOpen] = useState(false);
  const selected = COUNTRY_CODES.find((c) => c.code === dial);

  // A pasted full number ("+91 98765 43210" / "0091…") sets the country for the
  // user instead of ending up inside the national box.
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const raw = e.clipboardData.getData("text").trim();
    if (!/^(\+|00)/.test(raw)) return;
    e.preventDefault();
    const { dial: d, local: l } = fromE164(raw.replace(/^00/, ""));
    onDialChange(d);
    onLocalChange(l);
  };

  return (
    <div
      className={cn(
        "flex h-11 items-stretch overflow-hidden rounded-xl border border-input bg-background",
        "transition-colors focus-within:border-primary-deep focus-within:ring-2 focus-within:ring-primary-deep/20",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-label="Country code"
            disabled={disabled}
            className="flex shrink-0 items-center gap-1.5 pl-3 pr-2.5 text-sm outline-none transition-colors hover:bg-muted/60"
          >
            <span className="text-base leading-none">{selected?.flag ?? "🌐"}</span>
            <span className="font-medium tabular-nums">+{dial}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search country or code…" className="h-10" />
            <CommandList className="max-h-64">
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {COUNTRY_CODES.map((c) => (
                  <CommandItem
                    key={c.code}
                    value={`${c.label} +${c.code}`}
                    onSelect={() => {
                      onDialChange(c.code);
                      setOpen(false);
                    }}
                    className="gap-2"
                  >
                    <span className="text-base leading-none">{c.flag}</span>
                    <span className="flex-1 truncate">{c.label}</span>
                    <span className="tabular-nums text-muted-foreground">+{c.code}</span>
                    {c.code === dial && <Check className="ml-1 h-4 w-4 text-primary-deep" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <span aria-hidden className="my-2 w-px shrink-0 bg-border" />

      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        required
        disabled={disabled}
        placeholder={selected?.ex ?? "Mobile number"}
        value={local}
        onPaste={handlePaste}
        // Digits only, and drop the trunk "0" people habitually type first.
        onChange={(e) => onLocalChange(e.target.value.replace(/[^0-9]/g, "").replace(/^0+/, ""))}
        className="h-full w-full min-w-0 flex-1 bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground md:text-sm"
      />
    </div>
  );
};
