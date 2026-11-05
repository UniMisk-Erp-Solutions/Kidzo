-- ============================================================================
-- CCAvenue hosted-checkout payments (plan purchases + printed books) — replaces Razorpay.
--
-- A dedicated ledger (`ccavenue_payments`) holds every CCAvenue attempt, keyed by
-- the unique merchant order id we send to the gateway. All state changes go through
-- ONE atomic function (`ccavenue_apply_result`) that is idempotent and is the only
-- place a plan is activated / a book order is confirmed for CCAvenue. It is callable
-- by the service role only (edge functions), never by clients.
-- Idempotent / safe to re-run.
-- ============================================================================

-- --- book orders: provider-neutral payment fields ---------------------------
ALTER TABLE public.book_orders
  ADD COLUMN IF NOT EXISTS payment_provider    text,
  ADD COLUMN IF NOT EXISTS gateway_payment_ref text;

-- --- ledger ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ccavenue_payments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         text NOT NULL UNIQUE,            -- merchant order id sent to CCAvenue
  user_id          uuid NOT NULL,
  kind             text NOT NULL CHECK (kind IN ('subscription', 'book')),
  invoice_id       uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  book_order_id    uuid REFERENCES public.book_orders(id) ON DELETE SET NULL,
  plan_id          uuid REFERENCES public.plans(id),
  billing_cycle    text,
  amount           numeric(10,2) NOT NULL CHECK (amount > 0),   -- server-computed, INR
  currency         text NOT NULL DEFAULT 'INR',
  status           text NOT NULL DEFAULT 'created'
                   CHECK (status IN ('created','pending','success','failure','cancelled','amount_mismatch','refunded')),
  tracking_id      text,                            -- CCAvenue reference number
  bank_ref_no      text,
  payment_mode     text,
  failure_message  text,
  gateway_status   text,                            -- last raw status string seen from the gateway API
  verify_attempts  integer NOT NULL DEFAULT 0,
  last_verified_at timestamptz,
  fulfilled_at     timestamptz,
  refunded_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ccavenue_kind_target CHECK (
    (kind = 'subscription' AND invoice_id IS NOT NULL AND plan_id IS NOT NULL) OR
    (kind = 'book'         AND book_order_id IS NOT NULL)
  )
);

-- one gateway reference can only ever settle one order
CREATE UNIQUE INDEX IF NOT EXISTS ccavenue_payments_tracking_uidx
  ON public.ccavenue_payments (tracking_id) WHERE tracking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ccavenue_payments_user_idx   ON public.ccavenue_payments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ccavenue_payments_open_idx   ON public.ccavenue_payments (status, created_at)
  WHERE status IN ('created', 'pending');

DROP TRIGGER IF EXISTS ccavenue_payments_updated ON public.ccavenue_payments;
CREATE TRIGGER ccavenue_payments_updated BEFORE UPDATE ON public.ccavenue_payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.ccavenue_payments ENABLE ROW LEVEL SECURITY;
-- Users may read their own attempts; nobody can write from the client (service role only).
DROP POLICY IF EXISTS "Users view own ccavenue payments" ON public.ccavenue_payments;
CREATE POLICY "Users view own ccavenue payments" ON public.ccavenue_payments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));

-- --- the single, atomic, idempotent state transition -------------------------
-- p_result is the gateway-verified outcome: success | failure | cancelled | pending | refunded.
-- Returns: success | already_success | amount_mismatch | failure | cancelled | pending |
--          refunded | ignored | not_found
CREATE OR REPLACE FUNCTION public.ccavenue_apply_result(
  p_order_id     text,
  p_result       text,
  p_tracking_id  text,
  p_amount       numeric,
  p_currency     text,
  p_payment_mode text,
  p_bank_ref     text,
  p_message      text,
  p_gateway_status text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v          public.ccavenue_payments%ROWTYPE;
  v_coupon   uuid;
  v_discount numeric;
  v_book     uuid;
BEGIN
  IF p_result NOT IN ('success','failure','cancelled','pending','refunded') THEN
    RETURN 'ignored';
  END IF;

  -- lock the row so concurrent callbacks / reconcile runs serialise
  SELECT * INTO v FROM public.ccavenue_payments WHERE order_id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;

  UPDATE public.ccavenue_payments
     SET gateway_status = COALESCE(p_gateway_status, gateway_status),
         last_verified_at = now(),
         verify_attempts = verify_attempts + 1
   WHERE id = v.id;

  -- ---- already settled: only a refund may move it ----
  IF v.status = 'success' THEN
    IF p_result = 'refunded' THEN
      UPDATE public.ccavenue_payments SET status = 'refunded', refunded_at = now() WHERE id = v.id;
      RETURN 'refunded';
    END IF;
    RETURN 'already_success';
  END IF;
  IF v.status IN ('refunded', 'amount_mismatch') THEN RETURN 'ignored'; END IF;

  -- ---- successful payment: validate, then fulfil exactly once ----
  IF p_result = 'success' THEN
    IF p_amount IS NULL
       OR round(p_amount * 100) <> round(v.amount * 100)
       OR upper(COALESCE(p_currency, '')) <> upper(v.currency) THEN
      UPDATE public.ccavenue_payments
         SET status = 'amount_mismatch',
             tracking_id = COALESCE(tracking_id, p_tracking_id),
             failure_message = 'Gateway amount/currency does not match the order — needs manual review'
       WHERE id = v.id;
      RETURN 'amount_mismatch';
    END IF;

    IF v.kind = 'subscription' THEN
      -- reuse the one place that knows how to put a user on a paid plan
      PERFORM public.activate_paid_subscription(v.user_id, v.plan_id, COALESCE(v.billing_cycle, 'monthly'),
                                                v.invoice_id, p_tracking_id);
      UPDATE public.invoices
         SET provider = 'ccavenue', provider_ref = p_tracking_id, provider_order_id = v.order_id
       WHERE id = v.invoice_id
       RETURNING coupon_id, discount_amount INTO v_coupon, v_discount;
      IF v_coupon IS NOT NULL THEN
        PERFORM public.redeem_coupon(v_coupon, v.user_id, v.invoice_id, COALESCE(v_discount, 0));
      END IF;
    ELSE
      UPDATE public.book_orders
         SET payment_status = 'paid',
             status = CASE WHEN status IN ('awaiting_payment', 'pending') THEN 'paid' ELSE status END,
             payment_provider = 'ccavenue',
             gateway_payment_ref = p_tracking_id,
             amount_paid = v.amount,
             paid_at = COALESCE(paid_at, now())
       WHERE id = v.book_order_id
       RETURNING user_book_id INTO v_book;
      IF v_book IS NOT NULL THEN
        UPDATE public.user_books
           SET status = 'ordered', order_date = now(), price_total = v.amount
         WHERE id = v_book;
      END IF;
    END IF;

    UPDATE public.ccavenue_payments
       SET status = 'success', tracking_id = p_tracking_id, bank_ref_no = p_bank_ref,
           payment_mode = p_payment_mode, failure_message = NULL, fulfilled_at = now()
     WHERE id = v.id;
    RETURN 'success';
  END IF;

  -- ---- unsuccessful / abandoned ----
  IF p_result IN ('failure', 'cancelled') THEN
    UPDATE public.ccavenue_payments
       SET status = p_result, failure_message = left(p_message, 500),
           tracking_id = COALESCE(tracking_id, p_tracking_id), payment_mode = COALESCE(p_payment_mode, payment_mode)
     WHERE id = v.id;
    IF v.kind = 'subscription' THEN
      UPDATE public.invoices SET status = 'failed', notes = COALESCE(notes, '') || ' · CCAvenue ' || p_result
       WHERE id = v.invoice_id AND status = 'pending';
    ELSE
      UPDATE public.book_orders SET status = CASE WHEN p_result = 'cancelled' THEN 'cancelled' ELSE 'failed' END
       WHERE id = v.book_order_id AND payment_status <> 'paid' AND status = 'awaiting_payment';
    END IF;
    RETURN p_result;
  END IF;

  IF p_result = 'pending' THEN
    UPDATE public.ccavenue_payments SET status = 'pending' WHERE id = v.id AND status = 'created';
    RETURN 'pending';
  END IF;

  RETURN 'ignored';
END;
$$;

REVOKE ALL ON FUNCTION public.ccavenue_apply_result(text,text,text,numeric,text,text,text,text,text) FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.ccavenue_apply_result(text,text,text,numeric,text,text,text,text,text) TO service_role;
