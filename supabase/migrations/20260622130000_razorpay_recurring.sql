-- ============================================================================
-- Razorpay RECURRING subscriptions: auto-renewal + auto-expiry.
-- Idempotent / safe to run on the existing DB.
-- ============================================================================

-- Track the Razorpay subscription id on the user's subscription row.
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS provider_subscription_id text;
CREATE INDEX IF NOT EXISTS user_subs_provider_sub_idx ON public.user_subscriptions (provider_subscription_id);

-- Mode-aware Razorpay plan-id map (TEST ids seeded; fill "live" when going live).
INSERT INTO public.app_settings (key, value) VALUES (
  'razorpay_plans',
  '{"test":{"family_monthly":"plan_T4cC9gOh0KBbNo","family_yearly":"plan_T4cCA7dkjYNREg","premium_monthly":"plan_T4cCAW8KZ7m6MJ","premium_yearly":"plan_T4cCAw3PqYoq1P"},"live":{}}'::jsonb
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- Initial activation of a recurring subscription (also stores the subscription id).
CREATE OR REPLACE FUNCTION public.activate_subscription_v2(
  p_user uuid, p_plan uuid, p_cycle text, p_invoice uuid, p_payment_id text, p_sub_id text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_end timestamptz;
BEGIN
  v_end := CASE WHEN p_cycle = 'yearly' THEN now() + interval '1 year' ELSE now() + interval '1 month' END;
  IF p_invoice IS NOT NULL THEN
    UPDATE public.invoices
       SET status='paid', provider='razorpay',
           provider_payment_id=COALESCE(p_payment_id, provider_payment_id),
           paid_at=COALESCE(paid_at, now()), updated_at=now()
     WHERE id=p_invoice;
  END IF;
  INSERT INTO public.user_subscriptions
    (user_id, plan_id, status, billing_cycle, current_period_end, cancel_at_period_end, provider_subscription_id)
  VALUES (p_user, p_plan, 'active', COALESCE(p_cycle,'monthly'), v_end, false, p_sub_id)
  ON CONFLICT (user_id) DO UPDATE
    SET plan_id=EXCLUDED.plan_id, status='active', billing_cycle=EXCLUDED.billing_cycle,
        current_period_end=EXCLUDED.current_period_end, cancel_at_period_end=false,
        provider_subscription_id=EXCLUDED.provider_subscription_id, updated_at=now();
END; $$;

-- Renewal: Razorpay charged the next cycle -> extend period + log a paid invoice (idempotent on payment id).
CREATE OR REPLACE FUNCTION public.renew_subscription(p_sub_id text, p_payment_id text, p_amount numeric)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid; v_plan uuid; v_cycle text; v_end timestamptz;
BEGIN
  SELECT user_id, plan_id, billing_cycle INTO v_user, v_plan, v_cycle
  FROM public.user_subscriptions WHERE provider_subscription_id = p_sub_id;
  IF v_user IS NULL THEN RETURN false; END IF;   -- not activated yet; caller falls back to invoice
  v_end := CASE WHEN v_cycle = 'yearly' THEN now() + interval '1 year' ELSE now() + interval '1 month' END;
  UPDATE public.user_subscriptions
     SET status='active', current_period_end=v_end, cancel_at_period_end=false, updated_at=now()
   WHERE user_id=v_user;
  IF p_payment_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.invoices WHERE provider_payment_id=p_payment_id) THEN
    INSERT INTO public.invoices
      (user_id, plan_id, amount, currency, status, provider, provider_payment_id, provider_order_id, billing_cycle, paid_at, notes)
    VALUES (v_user, v_plan, COALESCE(p_amount,0), 'INR', 'paid', 'razorpay', p_payment_id, p_sub_id, v_cycle, now(), 'Auto-renewal');
  END IF;
  RETURN true;
END; $$;

-- Status change (halted / cancelled / pending / completed). Keep the plan until period end; cron downgrades.
CREATE OR REPLACE FUNCTION public.set_subscription_status(p_sub_id text, p_status text, p_cancel_at_end boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.user_subscriptions
     SET status=p_status, cancel_at_period_end=COALESCE(p_cancel_at_end, cancel_at_period_end), updated_at=now()
   WHERE provider_subscription_id=p_sub_id;
END; $$;

-- Expiry backstop (run daily by cron): downgrade any lapsed non-free plan to free.
CREATE OR REPLACE FUNCTION public.expire_due_subscriptions()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_free uuid; v_count int;
BEGIN
  SELECT id INTO v_free FROM public.plans WHERE slug='free' LIMIT 1;
  WITH due AS (
    SELECT us.user_id
    FROM public.user_subscriptions us
    JOIN public.plans p ON p.id = us.plan_id
    WHERE us.current_period_end IS NOT NULL
      AND us.current_period_end < now()
      AND p.slug <> 'free'
  )
  UPDATE public.user_subscriptions us
     SET plan_id=v_free, status='expired', cancel_at_period_end=false,
         provider_subscription_id=NULL, updated_at=now()
  FROM due WHERE us.user_id = due.user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END; $$;

-- Lock down: only the edge functions (service_role) may call these.
REVOKE ALL ON FUNCTION public.activate_subscription_v2(uuid,uuid,text,uuid,text,text) FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.activate_subscription_v2(uuid,uuid,text,uuid,text,text) TO service_role;
REVOKE ALL ON FUNCTION public.renew_subscription(text,text,numeric) FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.renew_subscription(text,text,numeric) TO service_role;
REVOKE ALL ON FUNCTION public.set_subscription_status(text,text,boolean) FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.set_subscription_status(text,text,boolean) TO service_role;
REVOKE ALL ON FUNCTION public.expire_due_subscriptions() FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.expire_due_subscriptions() TO service_role;
