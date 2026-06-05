import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TopBar } from "@/components/childbook/TopBar";
import { BottomNav } from "@/components/childbook/BottomNav";
import { useUserBook, useUpdateUserBook } from "@/hooks/useUserBooks";
import { useChildren } from "@/hooks/useChildren";
import {
  BOOK_SIZES,
  PAPER_QUALITIES,
  BINDING_TYPES,
  calculatePrice,
  formatCurrency,
  type BookSize,
  type PaperQuality,
  type BindingType,
} from "@/lib/bookPricing";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type RadioOption<T extends string> = { id: T; label: string; price: number; subtitle: string };

function RadioGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: RadioOption<T>[];
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const selected = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "flex w-full items-start justify-between gap-3 rounded-xl border p-3 text-left transition",
              selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-foreground/30",
            )}
          >
            <div className="min-w-0">
              <div className="text-[14px] font-semibold">{opt.label}</div>
              <div className="text-[12px] text-muted-foreground">{opt.subtitle}</div>
            </div>
            <div className="shrink-0 text-[13px] font-semibold">
              {opt.price === 0 ? "Included" : `+${formatCurrency(opt.price)}`}
            </div>
          </button>
        );
      })}
    </div>
  );
}

const BookCheckout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: book, isLoading } = useUserBook(id);
  const { data: children } = useChildren();
  const update = useUpdateUserBook();

  const child = children?.find((c) => c.id === book?.child_id);

  const [size, setSize] = useState<BookSize>((book?.book_size as BookSize) ?? "8x10");
  const [paper, setPaper] = useState<PaperQuality>((book?.paper_quality as PaperQuality) ?? "matte");
  const [binding, setBinding] = useState<BindingType>((book?.binding_type as BindingType) ?? "soft");
  const [quantity, setQuantity] = useState(book?.quantity ?? 1);

  // Shipping
  const [name, setName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("United States");
  const [terms, setTerms] = useState(false);
  const [placing, setPlacing] = useState(false);

  const price = useMemo(
    () => calculatePrice({ size, paper, binding, quantity }),
    [size, paper, binding, quantity],
  );

  const sizeOptions: RadioOption<BookSize>[] = (Object.entries(BOOK_SIZES) as [BookSize, typeof BOOK_SIZES[BookSize]][]).map(
    ([id, v]) => ({ id, label: v.label, price: v.price, subtitle: v.subtitle }),
  );
  const paperOptions: RadioOption<PaperQuality>[] = (Object.entries(PAPER_QUALITIES) as [PaperQuality, typeof PAPER_QUALITIES[PaperQuality]][]).map(
    ([id, v]) => ({ id, label: v.label, price: v.price, subtitle: v.subtitle }),
  );
  const bindingOptions: RadioOption<BindingType>[] = (Object.entries(BINDING_TYPES) as [BindingType, typeof BINDING_TYPES[BindingType]][]).map(
    ([id, v]) => ({ id, label: v.label, price: v.price, subtitle: v.subtitle }),
  );

  const validAddress = name && street && city && state && zip && country;

  const handlePlaceOrder = async () => {
    if (!book || !user) return;
    if (!validAddress) {
      toast.error("Please complete your shipping address");
      return;
    }
    if (!terms) {
      toast.error("Please agree to the terms");
      return;
    }
    setPlacing(true);
    try {
      // 1) Persist book selections + status
      await update.mutateAsync({
        id: book.id,
        patch: {
          book_size: size,
          paper_quality: paper,
          binding_type: binding,
          quantity,
          status: "ordered",
        },
      });
      // 2) Create order row (Printful is stubbed — placeholder external id)
      const stubExternalId = `stub-${book.id.slice(0, 8)}-${Date.now()}`;
      const { error } = await supabase.from("book_orders").insert({
        user_book_id: book.id,
        printful_order_id: stubExternalId,
        status: "pending",
        shipping_address: { name, street, city, state, zip, country },
        cost_breakdown: {
          base: price.base,
          paper: price.paper,
          binding: price.binding,
          unit: price.unit,
          subtotal: price.subtotal,
          shipping: price.shipping,
          tax: price.tax,
          total: price.total,
          quantity,
        },
      });
      if (error) throw error;
      toast.success("Order placed! 🎉");
      navigate(`/books/${book.id}/confirmation`);
    } catch (e) {
      console.error(e);
      toast.error("Could not place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (isLoading || !book) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-40 md:pb-12">
      <TopBar childName={child?.name ?? ""} />
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/books/${book.id}/preview`)}
          className="-ml-3 mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> Preview
        </Button>

        <div className="mb-6">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Step 4 of 4
          </div>
          <h1 className="mt-1 text-[24px] font-bold tracking-tight md:text-[28px]">Order your book</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Choose your size, paper, and where to ship it.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* LEFT: Specs */}
          <div className="space-y-5">
            <section className="rounded-2xl border bg-card p-4 md:p-5">
              <h2 className="text-[15px] font-semibold">Size</h2>
              <p className="text-[12px] text-muted-foreground">Pick the dimensions of your printed book.</p>
              <div className="mt-3">
                <RadioGroup<BookSize> value={size} onChange={setSize} options={sizeOptions} />
              </div>
            </section>

            <section className="rounded-2xl border bg-card p-4 md:p-5">
              <h2 className="text-[15px] font-semibold">Paper quality</h2>
              <div className="mt-3">
                <RadioGroup<PaperQuality> value={paper} onChange={setPaper} options={paperOptions} />
              </div>
            </section>

            <section className="rounded-2xl border bg-card p-4 md:p-5">
              <h2 className="text-[15px] font-semibold">Binding</h2>
              <div className="mt-3">
                <RadioGroup<BindingType> value={binding} onChange={setBinding} options={bindingOptions} />
              </div>
            </section>

            <section className="rounded-2xl border bg-card p-4 md:p-5">
              <h2 className="text-[15px] font-semibold">Quantity</h2>
              <p className="text-[12px] text-muted-foreground">
                Order an extra for grandparents — they will love it.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  −
                </Button>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="h-10 w-20 text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  disabled={quantity >= 10}
                >
                  +
                </Button>
              </div>
            </section>

            <section className="rounded-2xl border bg-card p-4 md:p-5">
              <h2 className="text-[15px] font-semibold">Shipping address</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label className="text-[12px]">Full name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-[12px]">Street address</Label>
                  <Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="123 Main St, Apt 4" />
                </div>
                <div>
                  <Label className="text-[12px]">City</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div>
                  <Label className="text-[12px]">State / Province</Label>
                  <Input value={state} onChange={(e) => setState(e.target.value)} />
                </div>
                <div>
                  <Label className="text-[12px]">ZIP / Postal code</Label>
                  <Input value={zip} onChange={(e) => setZip(e.target.value)} />
                </div>
                <div>
                  <Label className="text-[12px]">Country</Label>
                  <Input value={country} onChange={(e) => setCountry(e.target.value)} />
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT: Pricing */}
          <aside className="space-y-3">
            <section className="rounded-2xl border bg-card p-4 md:p-5">
              <h2 className="text-[15px] font-semibold">Order summary</h2>
              <ul className="mt-3 space-y-1.5 text-[13px]">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Base ({size})</span>
                  <span>{formatCurrency(price.base)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Paper ({paper})</span>
                  <span>{formatCurrency(price.paper)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Binding ({binding})</span>
                  <span>{formatCurrency(price.binding)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Quantity</span>
                  <span>× {quantity}</span>
                </li>
                <li className="my-2 border-t" />
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(price.subtotal)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatCurrency(price.shipping)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Tax (est.)</span>
                  <span>{formatCurrency(price.tax)}</span>
                </li>
                <li className="my-2 border-t" />
                <li className="flex items-center justify-between text-[15px] font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(price.total)}</span>
                </li>
              </ul>
            </section>

            <section className="rounded-2xl border bg-card p-4 md:p-5">
              <h3 className="text-[14px] font-semibold">Payment</h3>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Payments aren't live yet. We will reserve your book and email you when checkout opens.
              </p>
              <label className="mt-3 flex items-start gap-2 text-[12px]">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  I agree to the order terms and understand pricing is for preview only.
                </span>
              </label>
            </section>
          </aside>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-16 z-30 border-t bg-card/95 backdrop-blur md:bottom-0">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="text-[13px]">
            <span className="text-muted-foreground">Total</span>{" "}
            <span className="font-bold">{formatCurrency(price.total)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(`/books/${book.id}/preview`)}>
              Edit book
            </Button>
            <Button onClick={handlePlaceOrder} disabled={placing}>
              {placing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" /> Place order
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default BookCheckout;
