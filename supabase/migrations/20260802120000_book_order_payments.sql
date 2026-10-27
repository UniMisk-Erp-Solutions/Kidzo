-- Real payments for printed photo books (Razorpay).
-- Orders are created ONLY by the server (edge function) after pricing the book server-side,
-- and become 'paid' only after the Razorpay signature / webhook is verified. Idempotent.

ALTER TABLE public.book_orders
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS razorpay_order_id text,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id text,
  ADD COLUMN IF NOT EXISTS amount_paid numeric(10,2),
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_book_orders_rzp_order
  ON public.book_orders(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;

-- Clients may no longer insert orders directly (they could create "orders" without paying).
DROP POLICY IF EXISTS "Users insert orders for their own books" ON public.book_orders;

-- Marks an order paid and the book as 'ordered'. Idempotent; callable by the service role only.
CREATE OR REPLACE FUNCTION public.mark_book_order_paid(
  p_razorpay_order text, p_payment text, p_amount numeric
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_book uuid;
BEGIN
  UPDATE public.book_orders
     SET payment_status = 'paid',
         status = CASE WHEN status IN ('awaiting_payment','pending') THEN 'paid' ELSE status END,
         razorpay_payment_id = p_payment,
         amount_paid = p_amount,
         paid_at = now()
   WHERE razorpay_order_id = p_razorpay_order AND payment_status <> 'paid'
   RETURNING user_book_id INTO v_book;

  IF v_book IS NOT NULL THEN
    UPDATE public.user_books
       SET status = 'ordered', order_date = now(), price_total = COALESCE(p_amount, price_total)
     WHERE id = v_book;
  END IF;
  RETURN v_book;
END; $$;

REVOKE ALL ON FUNCTION public.mark_book_order_paid(text, text, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_book_order_paid(text, text, numeric) TO service_role;
