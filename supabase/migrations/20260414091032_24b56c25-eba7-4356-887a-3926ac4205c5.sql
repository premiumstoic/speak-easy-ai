
-- Enums
CREATE TYPE public.invite_status AS ENUM ('pending', 'accepted', 'expired');
CREATE TYPE public.session_status AS ENUM ('in_progress', 'completed', 'abandoned');

-- 1. couples (created before profiles so profiles can FK to it)
CREATE TABLE public.couples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_a UUID NOT NULL,
  partner_b UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

-- 2. profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  couple_id UUID REFERENCES public.couples(id),
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Now add FK constraints on couples referencing profiles
ALTER TABLE public.couples
  ADD CONSTRAINT fk_couples_partner_a FOREIGN KEY (partner_a) REFERENCES public.profiles(id),
  ADD CONSTRAINT fk_couples_partner_b FOREIGN KEY (partner_b) REFERENCES public.profiles(id);

-- 3. couple_invites
CREATE TABLE public.couple_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id),
  invite_code TEXT NOT NULL UNIQUE,
  status invite_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.couple_invites ENABLE ROW LEVEL SECURITY;

-- 4. sessions
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  technique_id TEXT NOT NULL DEFAULT 'imago_core_dialogue',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  status session_status NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- 5. session_turns
CREATE TABLE public.session_turns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  state_key TEXT NOT NULL,
  speaker_id UUID NOT NULL REFERENCES public.profiles(id),
  role TEXT NOT NULL,
  transcript TEXT NOT NULL DEFAULT '',
  selected_emotion TEXT,
  duration_seconds INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.session_turns ENABLE ROW LEVEL SECURITY;

-- Helper: check if user belongs to a couple (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.is_couple_member(_user_id UUID, _couple_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.couples
    WHERE id = _couple_id
      AND (partner_a = _user_id OR partner_b = _user_id)
  )
$$;

-- ==================== RLS POLICIES ====================

-- profiles
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can read partner profile"
  ON public.profiles FOR SELECT
  USING (
    couple_id IS NOT NULL
    AND public.is_couple_member(auth.uid(), couple_id)
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- couples
CREATE POLICY "Members can read own couple"
  ON public.couples FOR SELECT
  USING (partner_a = auth.uid() OR partner_b = auth.uid());

CREATE POLICY "Authenticated users can create couple"
  ON public.couples FOR INSERT
  WITH CHECK (partner_a = auth.uid());

CREATE POLICY "Members can update own couple"
  ON public.couples FOR UPDATE
  USING (partner_a = auth.uid() OR partner_b = auth.uid());

-- couple_invites
CREATE POLICY "Inviter can read own invites"
  ON public.couple_invites FOR SELECT
  USING (invited_by = auth.uid());

CREATE POLICY "Anyone authed can read invite by code"
  ON public.couple_invites FOR SELECT
  USING (true);

CREATE POLICY "Inviter can create invite"
  ON public.couple_invites FOR INSERT
  WITH CHECK (invited_by = auth.uid());

CREATE POLICY "Authed users can update invite"
  ON public.couple_invites FOR UPDATE
  USING (true);

-- sessions
CREATE POLICY "Couple members can read sessions"
  ON public.sessions FOR SELECT
  USING (public.is_couple_member(auth.uid(), couple_id));

CREATE POLICY "Couple members can create sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (public.is_couple_member(auth.uid(), couple_id));

CREATE POLICY "Couple members can update sessions"
  ON public.sessions FOR UPDATE
  USING (public.is_couple_member(auth.uid(), couple_id));

-- session_turns
CREATE POLICY "Couple members can read turns"
  ON public.session_turns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id
        AND public.is_couple_member(auth.uid(), s.couple_id)
    )
  );

CREATE POLICY "Couple members can insert turns"
  ON public.session_turns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_id
        AND public.is_couple_member(auth.uid(), s.couple_id)
    )
  );

-- ==================== TRIGGER: auto-create profile on signup ====================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
