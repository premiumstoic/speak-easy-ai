
-- Drop the overly permissive update policy
DROP POLICY "Authed users can update invite" ON public.couple_invites;

-- Replace with a scoped policy: only the inviter or the accepting user can update
CREATE POLICY "Authed users can accept pending invite"
  ON public.couple_invites FOR UPDATE
  USING (
    invited_by = auth.uid()
    OR status = 'pending'
  )
  WITH CHECK (
    invited_by = auth.uid()
    OR status = 'accepted'
  );
