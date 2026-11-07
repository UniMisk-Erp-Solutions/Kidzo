import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ShippingAddress } from "@/hooks/useBookPayment";

type Key = keyof ShippingAddress;
export type AddressErrors = Partial<Record<Key, string>>;

type Field = {
  key: Key;
  label: string;
  wide?: boolean;
  placeholder?: string;
  props?: React.ComponentProps<typeof Input>;
};

const FIELDS: Field[] = [
  { key: "name", label: "Full name", wide: true },
  { key: "phone", label: "Mobile number (for the courier)", wide: true, props: { type: "tel", inputMode: "tel", maxLength: 13 } },
  { key: "street", label: "Street address", wide: true, placeholder: "Flat / house no., building, area" },
  { key: "landmark", label: "Landmark", wide: true, placeholder: "Near temple, school, shop…" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "zip", label: "PIN code", props: { inputMode: "numeric", maxLength: 6 } },
];

/** Checks every field; returns a message per field that is empty or filled in wrongly. */
export function validateAddress(a: ShippingAddress): AddressErrors {
  const e: AddressErrors = {};
  const req = (k: Key, label: string) => {
    if (!a[k].trim()) e[k] = `${label} is required`;
  };
  req("name", "Full name");
  req("street", "Street address");
  req("landmark", "Landmark");
  req("city", "City");
  req("state", "State");
  if (!a.phone.trim()) e.phone = "Mobile number is required";
  else if (!/^(\+?91)?[6-9][0-9]{9}$/.test(a.phone.replace(/[\s-]/g, ""))) e.phone = "Enter a valid 10-digit mobile number";
  if (!a.zip.trim()) e.zip = "PIN code is required";
  else if (!/^[1-9][0-9]{5}$/.test(a.zip)) e.zip = "Enter a valid 6-digit PIN code";
  return e;
}

/** Scrolls to the first field with an error (in form order) and focuses it. */
export function focusFirstAddressError(errors: AddressErrors) {
  const first = FIELDS.find((f) => errors[f.key]);
  if (!first) return;
  const el = document.getElementById(`ship-${first.key}`);
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => el?.focus({ preventScroll: true }), 350);
}

interface Props {
  address: ShippingAddress;
  errors: AddressErrors;
  onChange: (key: Key, value: string) => void;
}

/** Delivery address (India only). Every field is required; the PIN code accepts digits only. */
export const ShippingForm = ({ address, errors, onChange }: Props) => (
  <section className="rounded-2xl border bg-card p-4 md:p-5">
    <h2 className="text-[15px] font-semibold">Shipping address</h2>
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {FIELDS.map((f) => {
        const err = errors[f.key];
        return (
          <div key={f.key} className={f.wide ? "sm:col-span-2" : undefined}>
            <Label htmlFor={`ship-${f.key}`} className="text-[12px]">
              {f.label} <span className="text-destructive">*</span>
            </Label>
            <Input
              {...f.props}
              id={`ship-${f.key}`}
              value={address[f.key]}
              placeholder={f.placeholder}
              aria-invalid={!!err}
              className={cn(err && "border-destructive bg-destructive/5 focus-visible:ring-destructive")}
              onChange={(e) => onChange(f.key, f.key === "zip" ? e.target.value.replace(/\D/g, "") : e.target.value)}
            />
            {err && <p className="mt-1 text-[12px] font-medium text-destructive">{err}</p>}
          </div>
        );
      })}
      <div>
        <Label className="text-[12px]">Country</Label>
        <Input value="India" readOnly disabled />
      </div>
    </div>
  </section>
);
