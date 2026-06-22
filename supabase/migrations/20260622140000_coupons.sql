-- ============================================================================
-- Coupons / discount codes (Shopify-style). Applied via the one-time order path
-- (discounted single payment, no auto-renew). Idempotent / safe to re-run.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,                     -- stored as entered; matched case-insensitively
  description text DEFAULT '',
  discount_type text NOT NULL DEFAULT 'percent', -- 'percent' | 'fixed'
  discount_value numeric NOT NULL DEFAULT 0,     -- percent (0-100) or fixed amount
  currency text NOT NULL DEFAULT 'INR',
  scope text NOT NULL DEFAULT 'general',         -- 'general' | 'emails' | 'users'
  allowed_emails text[],                         -- when scope='emails'
  allowed_user_ids uuid[],                       -- when scope='users'
  applicable_plan_slugs text[],                  -- null/empty => all paid plans
  applicable_cycles text[],                      -- null/empty => monthly & yearly
  min_amount numeric NOT NULL DEFAULT 0,
  max_redemptions int,                           -- total cap; null => unlimited
  per_user_limit int NOT NULL DEFAULT 1,
  first_time_only boolean NOT NULL DEFAULT false,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  redeemed_count int NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
-- Only super admins can see/manage coupons (codes are validated server-side via service role).
DROP POLICY IF EXISTS "Super admin reads coupons" ON public.coupons;
CREATE POLICY "Super admin reads coupons" ON public.coupons FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
DROP POLICY IF EXISTS "Super admin ins coupons" ON public.coupons;
CREATE POLICY "Super admin ins coupons" ON public.coupons FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'super_admin'));
DROP POLICY IF EXISTS "Super admin upd coupons" ON public.coupons;
CREATE POLICY "Super admin upd coupons" ON public.coupons FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
DROP POLICY IF EXISTS "Super admin del coupons" ON public.coupons;
CREATE POLICY "Super admin del coupons" ON public.coupons FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
DROP TRIGGER IF EXISTS coupons_updated ON public.coupons;
CREATE TRIGGER coupons_updated BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  invoice_id uuid,
  amount_discounted numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, invoice_id)
);
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Super admin reads redemptions" ON public.coupon_redemptions;
CREATE POLICY "Super admin reads redemptions" ON public.coupon_redemptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
-- writes only via SECURITY DEFINER function (service role)

-- invoices: remember which coupon was used + how much was knocked off
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS coupon_id uuid;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0;

-- Authoritative quote + validation (single source of truth for FE preview and create-order).
CREATE OR REPLACE FUNCTION public.coupon_quote(p_code text, p_user uuid, p_plan_slug text, p_cycle text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.coupons; v_base numeric; v_disc numeric; v_final numeric; v_used int; v_email text;
BEGIN
  SELECT CASE WHEN p_cycle='yearly' THEN price_yearly ELSE price_monthly END INTO v_base
  FROM public.plans WHERE slug=p_plan_slug AND is_active;
  IF v_base IS NULL THEN RETURN jsonb_build_object('valid',false,'reason','Plan not found'); END IF;
  IF v_base <= 0 THEN RETURN jsonb_build_object('valid',false,'reason','This plan is free'); END IF;

  SELECT * INTO c FROM public.coupons WHERE upper(code)=upper(btrim(p_code));
  IF c.id IS NULL THEN RETURN jsonb_build_object('valid',false,'reason','Invalid code'); END IF;
  IF NOT c.is_active THEN RETURN jsonb_build_object('valid',false,'reason','This code is not active'); END IF;
  IF c.starts_at IS NOT NULL AND now() < c.starts_at THEN RETURN jsonb_build_object('valid',false,'reason','This code is not active yet'); END IF;
  IF c.expires_at IS NOT NULL AND now() > c.expires_at THEN RETURN jsonb_build_object('valid',false,'reason','This code has expired'); END IF;
  IF c.applicable_plan_slugs IS NOT NULL AND array_length(c.applicable_plan_slugs,1) IS NOT NULL
     AND NOT (p_plan_slug = ANY(c.applicable_plan_slugs)) THEN
    RETURN jsonb_build_object('valid',false,'reason','Not valid for this plan'); END IF;
  IF c.applicable_cycles IS NOT NULL AND array_length(c.applicable_cycles,1) IS NOT NULL
     AND NOT (p_cycle = ANY(c.applicable_cycles)) THEN
    RETURN jsonb_build_object('valid',false,'reason','Not valid for this billing cycle'); END IF;
  IF v_base < COALESCE(c.min_amount,0) THEN RETURN jsonb_build_object('valid',false,'reason','Order is below the minimum for this code'); END IF;

  IF c.scope='users' THEN
    IF p_user IS NULL OR NOT (p_user = ANY(COALESCE(c.allowed_user_ids,'{}'::uuid[]))) THEN
      RETURN jsonb_build_object('valid',false,'reason','This code is not available for your account'); END IF;
  ELSIF c.scope='emails' THEN
    SELECT email INTO v_email FROM auth.users WHERE id=p_user;
    IF v_email IS NULL OR NOT EXISTS (
      SELECT 1 FROM unnest(COALESCE(c.allowed_emails,'{}'::text[])) e WHERE lower(e)=lower(v_email)
    ) THEN RETURN jsonb_build_object('valid',false,'reason','This code is not available for your account'); END IF;
  END IF;

  IF c.first_time_only AND EXISTS (SELECT 1 FROM public.invoices WHERE user_id=p_user AND status='paid') THEN
    RETURN jsonb_build_object('valid',false,'reason','This code is only for first-time purchases'); END IF;

  IF c.max_redemptions IS NOT NULL AND c.redeemed_count >= c.max_redemptions THEN
    RETURN jsonb_build_object('valid',false,'reason','This code has reached its redemption limit'); END IF;
  SELECT count(*) INTO v_used FROM public.coupon_redemptions WHERE coupon_id=c.id AND user_id=p_user;
  IF c.per_user_limit IS NOT NULL AND v_used >= c.per_user_limit THEN
    RETURN jsonb_build_object('valid',false,'reason','You have already used this code'); END IF;

  IF c.discount_type='percent' THEN v_disc := round(v_base * least(c.discount_value,100) / 100.0, 2);
  ELSE v_disc := least(c.discount_value, v_base); END IF;
  v_final := greatest(round(v_base - v_disc, 2), 1);   -- Razorpay minimum is ₹1
  v_disc  := round(v_base - v_final, 2);

  RETURN jsonb_build_object(
    'valid',true,'coupon_id',c.id,'code',c.code,'discount_type',c.discount_type,'discount_value',c.discount_value,
    'base_amount',v_base,'discount_amount',v_disc,'final_amount',v_final,'currency',c.currency);
END; $$;

-- Record a redemption (idempotent on coupon+invoice). Called by verify-payment after success.
CREATE OR REPLACE FUNCTION public.redeem_coupon(p_coupon uuid, p_user uuid, p_invoice uuid, p_amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_coupon IS NULL THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.coupon_redemptions WHERE coupon_id=p_coupon AND invoice_id=p_invoice) THEN RETURN; END IF;
  INSERT INTO public.coupon_redemptions (coupon_id, user_id, invoice_id, amount_discounted)
  VALUES (p_coupon, p_user, p_invoice, COALESCE(p_amount,0));
  UPDATE public.coupons SET redeemed_count = redeemed_count + 1, updated_at = now() WHERE id = p_coupon;
END; $$;

REVOKE ALL ON FUNCTION public.coupon_quote(text,uuid,text,text) FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.coupon_quote(text,uuid,text,text) TO service_role;
REVOKE ALL ON FUNCTION public.redeem_coupon(uuid,uuid,uuid,numeric) FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.redeem_coupon(uuid,uuid,uuid,numeric) TO service_role;
