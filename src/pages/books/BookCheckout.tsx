import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Lock, ShoppingBag } from "lucide-react";
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
import { loadRazorpay } from "@/lib/razorpay";
import { useEntitlements } from "@/hooks/useEntitlements";
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
  const { can, loading: entLoading } = useEntitlements();

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
  const [phone, setPhone] = useState("");
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

  const validAddress = name && street && city && state && zip && phone;

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
      // 1) Save the chosen options (the order status is set by the server once payment is verified)
      await update.mutateAsync({
        id: book.id,
        patch: { book_size: size, paper_quality: paper, binding_type: binding, quantity },
      });

      // 2) Load Razorpay Checkout
      if (!(await loadRazorpay())) {
        toast.error("Couldn't load the secure payment window. Check your connection and try again.");
        setPlacing(false);
        return;
      }

      // 3) The server prices the order and creates the Razorpay order
      const { data: order, error } = await supabase.functions.invoke("razorpay-create-book-order", {
        body: {
          user_book_id: book.id,
          size,
          paper,
          binding,
          quantity,
          shipping_address: { name, phone, street, city, state, zip },
        },
      });
      if (error || !order || order.error) {
        toast.error(order?.error || error?.message || "Could not start payment. Please try again.");
        setPlacing(false);
        return;
      }

      // 4) Open Razorpay; the signature is verified server-side on success
      const rzp = new window.Razorpay({
        key: order.key_id,
        order_id: order.order_id,
        amount: order.amount,
        currency: order.currency,
        name: "Kidzopedia",
        description: order.description,
        prefill: order.prefill,
        theme: { color: "#E29578" },
        handler: async (resp: any) => {
          const { data: verify, error: vErr } = await supabase.functions.invoke("razorpay-verify-book-payment", {
            body: {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              book_order_id: order.book_order_id,
            },
          });
          if (vErr || !verify || verify.error || !verify.ok) {
            toast.error(
              "We couldn't confirm your payment yet. If money was deducted, your order will be confirmed automatically within a minute — or write to us and we'll sort it out.",
            );
            setPlacing(false);
            return;
          }
          toast.success("Payment successful — order placed! 🎉");
          navigate(`/books/${book.id}/confirmation`);
        },
        modal: {
          ondismiss: () => {
            setPlacing(false);
            toast("Payment cancelled. Your book is saved — you can order any time.");
          },
        },
      });
      rzp.on("payment.failed", (r: any) => {
        toast.error(r?.error?.description || "Payment failed. Please try again.");
        setPlacing(false);
      });
      rzp.open();
    } catch (e) {
      console.error(e);
      toast.error("Could not start payment. Please try again.");
      setPlacing(false);
    }
  };

  if (isLoading || !book || entLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // The free plan can create and preview a book but not order it (also enforced on the server).
  if (!can("photo_book_orders")) {
    return (
      <div className="min-h-screen bg-background pb-28 md:pb-12">
        <TopBar childName={child?.name ?? ""} />
        <main className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/30">
            <Lock className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-[22px] font-bold">Upgrade to order your book</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
            Your free plan can create and preview books. Family and Premium unlock every page, PDF download and
            printed copies delivered to your door.
          </p>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/books/${book.id}/preview`)}>
              Back to preview
            </Button>
            <Button variant="warm" onClick={() => navigate("/pricing-plans")}>
              See plans
            </Button>
          </div>
        </main>
        <BottomNav />
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
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya Sharma" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-[12px]">Mobile number (for the courier)</Label>
                  <Input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-[12px]">Street address</Label>
                  <Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Flat / house no., building, area" />
                </div>
                <div>
                  <Label className="text-[12px]">City</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div>
                  <Label className="text-[12px]">State</Label>
                  <Input value={state} onChange={(e) => setState(e.target.value)} />
                </div>
                <div>
                  <Label className="text-[12px]">PIN code</Label>
                  <Input inputMode="numeric" maxLength={6} value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))} placeholder="380015" />
                </div>
                <div>
                  <Label className="text-[12px]">Country</Label>
                  <Input value="India" readOnly disabled />
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
                  <span className="text-muted-foreground">GST (est.)</span>
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
                Secure payment by Razorpay — UPI, cards, net banking and wallets. We never see your card details. We currently deliver within India only.
              </p>
              <label className="mt-3 flex items-start gap-2 text-[12px]">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  I agree to the <a href="/legal/terms" target="_blank" rel="noreferrer" className="underline">Terms</a>, <a href="/legal/refund-policy" target="_blank" rel="noreferrer" className="underline">Refund Policy</a> and <a href="/legal/shipping-policy" target="_blank" rel="noreferrer" className="underline">Shipping Policy</a>. I understand my book is printed to order.
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
                  <ShoppingBag className="h-4 w-4" /> Pay {formatCurrency(price.total)}
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
