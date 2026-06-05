
-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin manages roles ins" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin manages roles upd" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admin manages roles del" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- one-time claim of super admin if none exists
CREATE OR REPLACE FUNCTION public.claim_super_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'super_admin') THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'super_admin');
  RETURN true;
END; $$;

-- ============ PLANS ============
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text DEFAULT '',
  price_monthly numeric NOT NULL DEFAULT 0,
  price_yearly numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated views plans" ON public.plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public views active plans" ON public.plans FOR SELECT TO anon USING (is_active);
CREATE POLICY "Super admin manages plans ins" ON public.plans FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "Super admin manages plans upd" ON public.plans FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "Super admin manages plans del" ON public.plans FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER plans_updated BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.plan_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  key text NOT NULL,
  value_int int,
  value_bool boolean,
  value_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, key)
);
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated views features" ON public.plan_features FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public views features" ON public.plan_features FOR SELECT TO anon USING (true);
CREATE POLICY "Super admin manages features ins" ON public.plan_features FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "Super admin manages features upd" ON public.plan_features FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "Super admin manages features del" ON public.plan_features FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER plan_features_updated BEFORE UPDATE ON public.plan_features FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SUBSCRIPTIONS ============
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan_id uuid NOT NULL REFERENCES public.plans(id),
  status text NOT NULL DEFAULT 'active',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own sub" ON public.user_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "Super admin manages subs ins" ON public.user_subscriptions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "Super admin manages subs upd" ON public.user_subscriptions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "Super admin manages subs del" ON public.user_subscriptions FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER user_sub_updated BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ INVOICES ============
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid REFERENCES public.plans(id),
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending',
  provider text NOT NULL DEFAULT 'mock',
  provider_ref text,
  billing_cycle text DEFAULT 'monthly',
  notes text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own invoices" ON public.invoices FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "Users create own pending invoice" ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Super admin manages invoices upd" ON public.invoices FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "Super admin manages invoices del" ON public.invoices FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER invoices_updated BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ APP SETTINGS ============
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views settings" ON public.app_settings FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Super admin writes settings ins" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "Super admin writes settings upd" ON public.app_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'super_admin'));

INSERT INTO public.app_settings (key, value) VALUES
  ('signups_open', 'true'::jsonb),
  ('default_plan_slug', '"free"'::jsonb);

-- ============ SEED PLANS ============
INSERT INTO public.plans (slug, name, description, price_monthly, price_yearly, sort_order) VALUES
  ('free', 'Free', 'Start your journey — 1 child, core memories.', 0, 0, 1),
  ('family', 'Family', 'For growing families — up to 5 children, PDF export, sharing.', 299, 2999, 2),
  ('premium', 'Premium', 'Unlimited everything + priority support.', 599, 5999, 3);

INSERT INTO public.plan_features (plan_id, key, value_int, value_bool)
SELECT p.id, f.key, f.vi, f.vb FROM public.plans p
CROSS JOIN LATERAL (VALUES
  ('max_children',
     CASE p.slug WHEN 'free' THEN 1 WHEN 'family' THEN 5 ELSE NULL END,
     NULL::boolean),
  ('pdf_export', NULL, CASE p.slug WHEN 'free' THEN false ELSE true END),
  ('photo_book_orders', NULL, CASE p.slug WHEN 'free' THEN false ELSE true END),
  ('share_links', NULL, CASE p.slug WHEN 'free' THEN false ELSE true END),
  ('family_invites', NULL, CASE p.slug WHEN 'free' THEN false ELSE true END),
  ('ai_suggestions', NULL, CASE p.slug WHEN 'premium' THEN true ELSE false END)
) AS f(key, vi, vb);

-- ============ AUTO SUBSCRIBE NEW USERS TO FREE ============
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_plan_id uuid;
BEGIN
  SELECT id INTO v_plan_id FROM public.plans WHERE slug = 'free' LIMIT 1;
  IF v_plan_id IS NOT NULL THEN
    INSERT INTO public.user_subscriptions (user_id, plan_id, status)
    VALUES (NEW.id, v_plan_id, 'active')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created_sub ON auth.users;
CREATE TRIGGER on_auth_user_created_sub
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

-- backfill existing users
INSERT INTO public.user_subscriptions (user_id, plan_id, status)
SELECT u.id, (SELECT id FROM public.plans WHERE slug='free'), 'active'
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;

-- ============ ENFORCE max_children ON child_profiles ============
CREATE OR REPLACE FUNCTION public.enforce_max_children()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_limit int; v_count int;
BEGIN
  SELECT pf.value_int INTO v_limit
  FROM public.user_subscriptions us
  JOIN public.plan_features pf ON pf.plan_id = us.plan_id AND pf.key = 'max_children'
  WHERE us.user_id = NEW.user_id;

  IF v_limit IS NULL THEN
    RETURN NEW; -- unlimited or no sub row → allow
  END IF;

  SELECT count(*) INTO v_count FROM public.child_profiles WHERE user_id = NEW.user_id;
  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'plan_limit_reached: max_children=%', v_limit USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS enforce_max_children_trg ON public.child_profiles;
CREATE TRIGGER enforce_max_children_trg
  BEFORE INSERT ON public.child_profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_max_children();
