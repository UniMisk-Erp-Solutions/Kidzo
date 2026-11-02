import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUpdateUserBook } from "@/hooks/useUserBooks";
import { loadRazorpay } from "@/lib/razorpay";
import type { BindingType, BookSize, PaperQuality } from "@/lib/bookPricing";

export type ShippingAddress = {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
};

export interface PayInput {
  bookId: string;
  size: BookSize;
  paper: PaperQuality;
  binding: BindingType;
  quantity: number;
  address: ShippingAddress;
}

type BookOrder = {
  key_id: string;
  order_id: string;
  amount: number;
  currency: string;
  description: string;
  prefill: unknown;
  book_order_id: string;
};

type CheckoutCallbacks = {
  onPaid: (resp: any) => Promise<void>;
  onDismiss: () => void;
  onFailed: (r: any) => void;
};

/** On a non-2xx the real reason is in the response body, not error.message. */
async function failureReason(order: { error?: string } | null, error: unknown): Promise<string | undefined> {
  let reason: string | undefined = order?.error;
  if (!reason && error && typeof error === "object" && "context" in error) {
    reason = await (error as { context: Response }).context.json().then((b) => b?.error).catch(() => undefined);
  }
  return reason;
}

/** The server prices the order and creates the Razorpay order. Returns null (after telling the user) on failure. */
async function createBookOrder(input: PayInput): Promise<BookOrder | null> {
  const { data: order, error } = await supabase.functions.invoke("razorpay-create-book-order", {
    body: {
      user_book_id: input.bookId,
      size: input.size,
      paper: input.paper,
      binding: input.binding,
      quantity: input.quantity,
      shipping_address: input.address,
    },
  });
  if (!error && order && !order.error) return order as BookOrder;
  const reason = await failureReason(order, error);
  console.error("razorpay-create-book-order failed:", reason ?? error);
  toast.error(reason || error?.message || "Could not start payment. Please try again.");
  return null;
}

/** The signature is verified server-side after Razorpay reports success. */
async function verifyPayment(resp: any, bookOrderId: string): Promise<boolean> {
  const { data: verify, error } = await supabase.functions.invoke("razorpay-verify-book-payment", {
    body: {
      razorpay_order_id: resp.razorpay_order_id,
      razorpay_payment_id: resp.razorpay_payment_id,
      razorpay_signature: resp.razorpay_signature,
      book_order_id: bookOrderId,
    },
  });
  return !(error || !verify || verify.error || !verify.ok);
}

function openCheckout(order: BookOrder, cb: CheckoutCallbacks) {
  const rzp = new window.Razorpay({
    key: order.key_id,
    order_id: order.order_id,
    amount: order.amount,
    currency: order.currency,
    name: "Kidzopedia",
    description: order.description,
    prefill: order.prefill,
    theme: { color: "#E29578" },
    handler: cb.onPaid,
    modal: { ondismiss: cb.onDismiss },
  });
  rzp.on("payment.failed", cb.onFailed);
  rzp.open();
}

/** Saves the chosen options, creates the Razorpay order and opens the payment window for a printed book. */
export function useBookPayment() {
  const navigate = useNavigate();
  const update = useUpdateUserBook();
  const [placing, setPlacing] = useState(false);

  const onPaid = (input: PayInput, order: BookOrder) => async (resp: any) => {
    if (!(await verifyPayment(resp, order.book_order_id))) {
      toast.error(
        "We couldn't confirm your payment yet. If money was deducted, your order will be confirmed automatically within a minute — or write to us and we'll sort it out.",
      );
      setPlacing(false);
      return;
    }
    toast.success("Payment successful — order placed! 🎉");
    navigate(`/books/${input.bookId}/confirmation`);
  };

  const pay = async (input: PayInput) => {
    setPlacing(true);
    try {
      // 1) Save the chosen options (the order status is set by the server once payment is verified)
      await update.mutateAsync({
        id: input.bookId,
        patch: { book_size: input.size, paper_quality: input.paper, binding_type: input.binding, quantity: input.quantity },
      });
      // 2) Load Razorpay Checkout
      if (!(await loadRazorpay())) {
        toast.error("Couldn't load the secure payment window. Check your connection and try again.");
        setPlacing(false);
        return;
      }
      // 3) The server prices the order and creates the Razorpay order
      const order = await createBookOrder(input);
      if (!order) {
        setPlacing(false);
        return;
      }
      // 4) Open Razorpay; the signature is verified server-side on success
      openCheckout(order, {
        onPaid: onPaid(input, order),
        onDismiss: () => {
          setPlacing(false);
          toast("Payment cancelled. Your book is saved — you can order any time.");
        },
        onFailed: (r) => {
          toast.error(r?.error?.description || "Payment failed. Please try again.");
          setPlacing(false);
        },
      });
    } catch (e) {
      console.error(e);
      toast.error("Could not start payment. Please try again.");
      setPlacing(false);
    }
  };

  return { placing, pay };
}
