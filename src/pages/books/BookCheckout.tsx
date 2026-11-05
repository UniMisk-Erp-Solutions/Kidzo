import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/childbook/TopBar";
import { BottomNav } from "@/components/childbook/BottomNav";
import { SpecSections } from "@/components/books/checkout/SpecSections";
import { ShippingForm } from "@/components/books/checkout/ShippingForm";
import { OrderSummary } from "@/components/books/checkout/OrderSummary";
import { PaymentCard } from "@/components/books/checkout/PaymentCard";
import { CheckoutBar } from "@/components/books/checkout/CheckoutBar";
import { UpgradeGate } from "@/components/books/checkout/UpgradeGate";
import { useUserBook } from "@/hooks/useUserBooks";
import { useChildren } from "@/hooks/useChildren";
import { useBookPayment, type ShippingAddress } from "@/hooks/useBookPayment";
import { useAuth } from "@/contexts/AuthContext";
import { useEntitlements } from "@/hooks/useEntitlements";
import { calculatePrice, type BindingType, type BookSize, type PaperQuality } from "@/lib/bookPricing";

const EMPTY_ADDRESS: ShippingAddress = { name: "", phone: "", street: "", city: "", state: "", zip: "" };

const BookCheckout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: book, isLoading } = useUserBook(id);
  const { data: children } = useChildren();
  const { can, loading: entLoading } = useEntitlements();
  const { placing, pay } = useBookPayment();

  const child = children?.find((c) => c.id === book?.child_id);

  const [size, setSize] = useState<BookSize>((book?.book_size as BookSize) ?? "8x10");
  const [paper, setPaper] = useState<PaperQuality>((book?.paper_quality as PaperQuality) ?? "matte");
  const [binding, setBinding] = useState<BindingType>((book?.binding_type as BindingType) ?? "soft");
  const [quantity, setQuantity] = useState(book?.quantity ?? 1);
  const [address, setAddress] = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [terms, setTerms] = useState(false);

  const price = useMemo(() => calculatePrice({ size, paper, binding, quantity }), [size, paper, binding, quantity]);
  const validAddress = Object.values(address).every(Boolean);

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
    await pay({ bookId: book.id, size, paper, binding, quantity, address });
  };

  if (isLoading || !book || entLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const toPreview = () => navigate(`/books/${book.id}/preview`);

  if (!can("photo_book_orders")) {
    return <UpgradeGate childName={child?.name ?? ""} onBack={toPreview} onSeePlans={() => navigate("/pricing-plans")} />;
  }

  return (
    <div className="min-h-screen bg-background pb-56 md:pb-56">
      <TopBar childName={child?.name ?? ""} />
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
        <Button variant="ghost" size="sm" onClick={toPreview} className="-ml-3 mb-3">
          <ArrowLeft className="h-4 w-4" /> Preview
        </Button>

        <div className="mb-6">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Step 4 of 4</div>
          <h1 className="font-display mt-1 text-[24px] font-bold tracking-tight md:text-[28px]">Order your book</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Choose your size, paper, and where to ship it.</p>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <SpecSections
              size={size}
              paper={paper}
              binding={binding}
              quantity={quantity}
              onSize={setSize}
              onPaper={setPaper}
              onBinding={setBinding}
              onQuantity={setQuantity}
            />
            <ShippingForm address={address} onChange={(key, value) => setAddress({ ...address, [key]: value })} />
          </div>

          <aside className="space-y-3">
            <OrderSummary size={size} paper={paper} binding={binding} quantity={quantity} price={price} />
            <PaymentCard terms={terms} onTerms={setTerms} />
          </aside>
        </div>
      </main>

      <CheckoutBar total={price.total} placing={placing} onEdit={toPreview} onPay={handlePlaceOrder} />
      <BottomNav />
    </div>
  );
};

export default BookCheckout;
