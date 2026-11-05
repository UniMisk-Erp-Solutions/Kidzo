import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ShippingAddress } from "@/hooks/useBookPayment";

type Field = {
  key: keyof ShippingAddress;
  label: string;
  wide?: boolean;
  placeholder?: string;
  props?: React.ComponentProps<typeof Input>;
};

const FIELDS: Field[] = [
  { key: "name", label: "Full name", wide: true, placeholder: "Priya Sharma" },
  { key: "phone", label: "Mobile number (for the courier)", wide: true, placeholder: "98765 43210", props: { type: "tel", inputMode: "tel" } },
  { key: "street", label: "Street address", wide: true, placeholder: "Flat / house no., building, area" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "zip", label: "PIN code", placeholder: "380015", props: { inputMode: "numeric", maxLength: 6 } },
];

interface Props {
  address: ShippingAddress;
  onChange: (key: keyof ShippingAddress, value: string) => void;
}

/** Delivery address (India only). The PIN code accepts digits only. */
export const ShippingForm = ({ address, onChange }: Props) => (
  <section className="rounded-2xl border bg-card p-4 md:p-5">
    <h2 className="text-[15px] font-semibold">Shipping address</h2>
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {FIELDS.map((f) => (
        <div key={f.key} className={f.wide ? "sm:col-span-2" : undefined}>
          <Label className="text-[12px]">{f.label}</Label>
          <Input
            {...f.props}
            value={address[f.key]}
            placeholder={f.placeholder}
            onChange={(e) => onChange(f.key, f.key === "zip" ? e.target.value.replace(/\D/g, "") : e.target.value)}
          />
        </div>
      ))}
      <div>
        <Label className="text-[12px]">Country</Label>
        <Input value="India" readOnly disabled />
      </div>
    </div>
  </section>
);
