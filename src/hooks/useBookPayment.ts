import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUpdateUserBook } from "@/hooks/useUserBooks";
import { failureReason, redirectToCcavenue, type CcavenueOrder } from "@/lib/ccavenue";
import type { BindingType, BookSize, PaperQuality } from "@/lib/bookPricing";

export type ShippingAddress = {
  name: string;
  phone: string;
  street: string;
  landmark: string;
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

/** Saves the chosen options, has the server price the order, then sends the customer to CCAvenue's hosted checkout. */
export function useBookPayment() {
  const update = useUpdateUserBook();
  const [placing, setPlacing] = useState(false);

  const pay = async (input: PayInput) => {
    setPlacing(true);
    try {
      // 1) Save the chosen options (the order is only confirmed by the server once payment is verified)
      await update.mutateAsync({
        id: input.bookId,
        patch: { book_size: input.size, paper_quality: input.paper, binding_type: input.binding, quantity: input.quantity },
      });
      // 2) The server prices the order and encrypts the CCAvenue request
      const { data, error } = await supabase.functions.invoke("ccavenue-create-order", {
        body: {
          kind: "book",
          user_book_id: input.bookId,
          size: input.size,
          paper: input.paper,
          binding: input.binding,
          quantity: input.quantity,
          shipping_address: input.address,
        },
      });
      if (error || !data || data.error) {
        const reason = await failureReason(data, error);
        console.error("ccavenue-create-order failed:", reason ?? error);
        toast.error(reason || "Could not start payment. Please try again.");
        setPlacing(false);
        return;
      }
      // 3) Hosted checkout — the page navigates away; the result page picks up on return
      redirectToCcavenue(data as CcavenueOrder);
    } catch (e) {
      console.error(e);
      toast.error("Could not start payment. Please try again.");
      setPlacing(false);
    }
  };

  return { placing, pay };
}
