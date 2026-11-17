-- Auth "Send SMS" hook (GoTrue -> pg-functions://postgres/public/send_sms_whatsapp).
--
-- When a user links a mobile number for the first time, or changes it, GoTrue puts the
-- number being verified in user.new_phone and leaves user.phone empty (or set to the OLD
-- number). The hook only read user.phone, so linking a number failed with
-- "Missing phone or OTP" and a change would have sent the code to the old number.
-- Now it prefers new_phone and falls back to phone (login / signup OTPs).

CREATE OR REPLACE FUNCTION public.send_sms_whatsapp(event jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_phone text;
  v_otp   text;
  v_url   text;
  v_key   text;
  v_sess  text;
  v_text  text;
BEGIN
  v_phone := regexp_replace(
    coalesce(nullif(event->'user'->>'new_phone', ''), event->'user'->>'phone', ''),
    '[^0-9]', '', 'g');
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
$function$;
