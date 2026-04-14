
-- 1. Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone authed can read invite by code" ON public.couple_invites;

-- 2. Drop the current UPDATE policy
DROP POLICY IF EXISTS "Authed users can accept pending invite" ON public.couple_invites;

-- 3. Create a SECURITY DEFINER function for safe invite lookup
CREATE OR REPLACE FUNCTION public.find_invite_by_code(_code TEXT)
RETURNS TABLE(id UUID, couple_id UUID, invited_by UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ci.id, ci.couple_id, ci.invited_by
  FROM public.couple_invites ci
  WHERE ci.invite_code = _code
    AND ci.status = 'pending'
  LIMIT 1;
$$;

-- 4. Create a SECURITY DEFINER function for accepting an invite
CREATE OR REPLACE FUNCTION public.accept_invite(_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invite RECORD;
  _user_id UUID := auth.uid();
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Find the pending invite
  SELECT ci.id, ci.couple_id, ci.invited_by
  INTO _invite
  FROM public.couple_invites ci
  WHERE ci.invite_code = _code
    AND ci.status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;

  IF _invite.invited_by = _user_id THEN
    RAISE EXCEPTION 'Cannot accept your own invite';
  END IF;

  -- Update couple with partner_b
  UPDATE public.couples
  SET partner_b = _user_id
  WHERE id = _invite.couple_id
    AND partner_b IS NULL;

  -- Update user's profile
  UPDATE public.profiles
  SET couple_id = _invite.couple_id
  WHERE id = _user_id;

  -- Mark invite as accepted
  UPDATE public.couple_invites
  SET status = 'accepted'
  WHERE id = _invite.id;

  RETURN _invite.couple_id;
END;
$$;

-- 5. Restrictive UPDATE policy: only inviters can modify their own invites
CREATE POLICY "Inviter can update own invites"
  ON public.couple_invites FOR UPDATE
  USING (invited_by = auth.uid());
