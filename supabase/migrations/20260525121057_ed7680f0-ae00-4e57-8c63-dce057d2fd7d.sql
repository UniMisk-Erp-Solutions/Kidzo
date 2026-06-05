CREATE TABLE public.admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin views audit log"
ON public.admin_audit_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin inserts audit log"
ON public.admin_audit_log FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin') AND admin_id = auth.uid());

CREATE INDEX idx_admin_audit_log_target ON public.admin_audit_log(target_user_id);
CREATE INDEX idx_admin_audit_log_created ON public.admin_audit_log(created_at DESC);