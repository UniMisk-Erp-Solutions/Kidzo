import { formatCurrency, type calculatePrice } from "@/lib/bookPricing";

type Price = ReturnType<typeof calculatePrice>;

const Line = ({ label, value }: { label: string; value: string }) => (
  <li className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span>{value}</span>
  </li>
);

const Divider = () => <li className="my-2 border-t" />;

interface Props {
  size: string;
  paper: string;
  binding: string;
  quantity: number;
  price: Price;
}

/** Itemised price breakdown. */
export const OrderSummary = ({ size, paper, binding, quantity, price }: Props) => (
  <section className="rounded-2xl border bg-card p-4 md:p-5">
    <h2 className="text-[15px] font-semibold">Order summary</h2>
    <ul className="mt-3 space-y-1.5 text-[13px]">
      <Line label={`Base (${size})`} value={formatCurrency(price.base)} />
      <Line label={`Paper (${paper})`} value={formatCurrency(price.paper)} />
      <Line label={`Binding (${binding})`} value={formatCurrency(price.binding)} />
      <Line label="Quantity" value={`× ${quantity}`} />
      <Divider />
      <Line label="Subtotal" value={formatCurrency(price.subtotal)} />
      <Line label="Shipping" value={formatCurrency(price.shipping)} />
      <Line label="GST (est.)" value={formatCurrency(price.tax)} />
      <Divider />
      <li className="flex items-center justify-between text-[15px] font-bold">
        <span>Total</span>
        <span>{formatCurrency(price.total)}</span>
      </li>
    </ul>
  </section>
);
