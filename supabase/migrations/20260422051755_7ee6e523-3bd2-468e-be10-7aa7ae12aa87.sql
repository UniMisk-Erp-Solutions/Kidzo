-- Allow shared users to remove their own access (leave a shared child)
CREATE POLICY "Shared user can leave"
ON public.child_shares
FOR DELETE
TO authenticated
USING (auth.uid() = shared_with_user_id);