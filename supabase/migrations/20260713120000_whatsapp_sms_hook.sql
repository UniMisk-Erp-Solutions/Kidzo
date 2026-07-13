-- ============================================================================
-- Phone (WhatsApp) OTP: Supabase Auth "send SMS" hook implemented as a Postgres
-- function. GoTrue calls it over its existing DB connection (no HTTP round-trip),
-- and pg_net posts to OpenWA asynchronously -> it returns instantly, so GoTrue's
-- hard 5s hook timeout is never hit. Auth still owns OTP generation/verification
-- and the session, so phone signup / login / phone-change all work natively.
-- Idempotent.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_net;

-- Secrets table: RLS on, NO policies -> anon/authenticated can never read it.
-- (Deliberately NOT app_settings, which is world-readable.)
CREATE TABLE IF NOT EXISTS public.integration_secrets (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.integration_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.integration_secrets FROM anon, authenticated;

-- The hook. GoTrue passes: { "user": {...,"phone":"9198..."}, "sms": {"otp":"123456"} }
CREATE OR REPLACE FUNCTION public.send_sms_whatsapp(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone text;
  v_otp   text;
  v_url   text;
  v_key   text;
  v_sess  text;
  v_text  text;
BEGIN
  v_phone := regexp_replace(coalesce(event->'user'->>'phone', ''), '[^0-9]', '', 'g');
  v_otp   := coalesce(event->'sms'->>'otp', '');

  IF v_phone = '' OR v_otp = '' THEN
    RETURN jsonb_build_object('error',
      jsonb_build_object('http_code', 400, 'message', 'Missing phone or OTP'));
  END IF;

  SELECT value->>'url', value->>'api_key', value->>'session_id'
    INTO v_url, v_key, v_sess
  FROM public.integration_secrets
  WHERE key = 'openwa';

  IF v_url IS NULL OR v_key IS NULL OR v_sess IS NULL THEN
    RETURN jsonb_build_object('error',
      jsonb_build_object('http_code', 500, 'message', 'WhatsApp sender is not configured'));
  END IF;

  v_text :=
    '*' || v_otp || '* is your Kidzopedia verification code.' || E'\n\n' ||
    'Enter it in the app to continue. It expires in 10 minutes.' || E'\n\n' ||
    'If you did not request this, you can ignore this message. Never share this code with anyone.';

  -- fire-and-forget: pg_net queues the request and returns immediately
  PERFORM net.http_post(
    url     := v_url || '/api/sessions/' || v_sess || '/messages/send-text',
    headers := jsonb_build_object('content-type', 'application/json', 'x-api-key', v_key),
    body    := jsonb_build_object('chatId', v_phone || '@c.us', 'text', v_text)
  );

  RETURN '{}'::jsonb;  -- {} == delivered, per the Auth hook contract
END;
$$;

-- Only the auth service may run it.
REVOKE ALL ON FUNCTION public.send_sms_whatsapp(jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.send_sms_whatsapp(jsonb) TO supabase_auth_admin;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
