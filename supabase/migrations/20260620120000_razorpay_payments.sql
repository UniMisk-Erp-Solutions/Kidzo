-- ============================================================================
-- Razorpay payments: extend invoices, add webhook idempotency, and a single
-- atomic activation function used by the verify + webhook edge functions.
-- Idempotent / safe to run on the existing DB.
-- ============================================================================

-- --- invoices: track Razorpay order + payment ids -------------------------
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS provider_order_id   text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS provider_payment_id text;
CREATE INDEX IF NOT EXISTS invoices_provider_order_id_idx ON public.invoices (provider_order_id);

-- --- webhook idempotency: never process the same event twice ---------------
CREATE TABLE IF NOT EXISTS public.payment_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider    text NOT NULL DEFAULT 'razorpay',
  event_id    text NOT NULL,
  event_type  text,
  payload     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
-- No policies => only service_role (edge functions) can read/write. Good.

-- --- atomic activation: mark invoice paid + upsert subscription ------------
-- SECURITY DEFINER so it runs with full rights; only ever called by the
-- edge functions (service_role). It computes the period end from the cycle.
CREATE OR REPLACE FUNCTION public.activate_paid_subscription(
  p_user        uuid,
  p_plan        uuid,
  p_cycle       text,
  p_invoice     uuid,
  p_payment_id  text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_end timestamptz;
BEGIN
  v_end := CASE WHEN p_cycle = 'yearly'
                THEN now() + interval '1 year'
                ELSE now() + interval '1 month' END;

  -- 1) mark the invoice paid (no-op if already paid)
  IF p_invoice IS NOT NULL THEN
    UPDATE public.invoices
       SET status = 'paid',
           provider = 'razorpay',
           provider_payment_id = COALESCE(p_payment_id, provider_payment_id),
           paid_at = COALESCE(paid_at, now()),
           updated_at = now()
     WHERE id = p_invoice;
  END IF;

  -- 2) upsert the user's subscription onto the paid plan
  INSERT INTO public.user_subscriptions
    (user_id, plan_id, status, billing_cycle, current_period_end, cancel_at_period_end)
  VALUES
    (p_user, p_plan, 'active', COALESCE(p_cycle, 'monthly'), v_end, false)
  ON CONFLICT (user_id) DO UPDATE
    SET plan_id = EXCLUDED.plan_id,
        status = 'active',
        billing_cycle = EXCLUDED.billing_cycle,
        current_period_end = EXCLUDED.current_period_end,
        cancel_at_period_end = false,
        updated_at = now();
END;
$$;

-- Only the edge functions (service_role) may call this; never the client roles.
REVOKE ALL ON FUNCTION public.activate_paid_subscription(uuid, uuid, text, uuid, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_paid_subscription(uuid, uuid, text, uuid, text) TO service_role;
