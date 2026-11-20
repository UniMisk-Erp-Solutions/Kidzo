CREATE TABLE public.signup_acknowledgements (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  terms_version text NOT NULL,
  privacy_version text NOT NULL,
  adult_confirmed boolean NOT NULL CHECK (adult_confirmed),
  account_data_consented boolean NOT NULL CHECK (account_data_consented),
  recorded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.signup_acknowledgements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.signup_acknowledgements FROM anon, authenticated;

CREATE FUNCTION public.record_signup_acknowledgement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  acknowledgement jsonb := NEW.raw_user_meta_data -> 'signup_acknowledgement';
BEGIN
  IF acknowledgement ->> 'terms_version' = '2026-11-18'
    AND acknowledgement ->> 'privacy_version' = '2026-11-18'
    AND acknowledgement -> 'adult_confirmed' = 'true'::jsonb
    AND acknowledgement -> 'account_data_consented' = 'true'::jsonb THEN
    INSERT INTO public.signup_acknowledgements (user_id, terms_version, privacy_version, adult_confirmed, account_data_consented)
    VALUES (NEW.id, '2026-11-18', '2026-11-18', true, true);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER record_signup_acknowledgement
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.record_signup_acknowledgement();

ALTER TABLE public.child_profiles
  ADD COLUMN guardian_notice_version text,
  ADD COLUMN guardian_authorized_at timestamptz;

CREATE FUNCTION public.record_child_profile_authorization()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.guardian_notice_version := OLD.guardian_notice_version;
    NEW.guardian_authorized_at := OLD.guardian_authorized_at;
  ELSE
    IF auth.uid() IS NOT NULL AND NEW.guardian_notice_version IS DISTINCT FROM '2026-11-18' THEN
      RAISE EXCEPTION 'Confirm your authority before creating a child profile.' USING ERRCODE = 'check_violation';
    END IF;
    NEW.guardian_authorized_at := CASE WHEN NEW.guardian_notice_version = '2026-11-18' THEN now() ELSE NULL END;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER record_child_profile_authorization
BEFORE INSERT OR UPDATE OF guardian_notice_version, guardian_authorized_at
ON public.child_profiles
FOR EACH ROW EXECUTE FUNCTION public.record_child_profile_authorization();
