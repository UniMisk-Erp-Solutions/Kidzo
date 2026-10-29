-- DEV ONLY: dummy login on the Family plan (Rs 299). Run in the Supabase SQL editor.
-- Do NOT run against a production project you care about; delete the user afterwards if needed.
-- Idempotent: re-running resets the password and keeps the account on Family.

DO $$
DECLARE
  v_email text := 'admin@unimisk.com';
  v_password text := 'qwertyui';
  v_user_id uuid;
  v_plan_id uuid;
BEGIN
  SELECT id INTO v_plan_id FROM public.plans WHERE slug = 'family';
  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'Family plan not found in public.plans';
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      v_email, crypt(v_password, gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now(),
      '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(), v_user_id, v_user_id::text,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
      'email', now(), now(), now()
    );
  ELSE
    UPDATE auth.users
       SET encrypted_password = crypt(v_password, gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, now()),
           updated_at = now()
     WHERE id = v_user_id;
  END IF;

  -- The signup trigger creates a Free subscription; switch it to Family (or create it).
  INSERT INTO public.user_subscriptions (user_id, plan_id, status, billing_cycle, current_period_end)
  VALUES (v_user_id, v_plan_id, 'active', 'monthly', now() + interval '1 year')
  ON CONFLICT (user_id) DO UPDATE
    SET plan_id = EXCLUDED.plan_id,
        status = 'active',
        billing_cycle = 'monthly',
        current_period_end = EXCLUDED.current_period_end,
        cancel_at_period_end = false;
END $$;

-- Verify
SELECT u.email, p.slug AS plan, s.status
FROM auth.users u
JOIN public.user_subscriptions s ON s.user_id = u.id
JOIN public.plans p ON p.id = s.plan_id
WHERE u.email = 'admin@unimisk.com';
