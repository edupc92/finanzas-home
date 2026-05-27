CREATE OR REPLACE FUNCTION public.accept_household_invitation(invitation_token UUID)
RETURNS BOOLEAN AS $$
DECLARE
  inv RECORD;
BEGIN
  SELECT * INTO inv FROM public.invitations
  WHERE token = invitation_token
    AND accepted_at IS NULL
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.household_members (household_id, user_id, role)
  VALUES (inv.household_id, auth.uid(), 'member')
  ON CONFLICT (household_id, user_id) DO NOTHING;

  UPDATE public.invitations SET accepted_at = NOW() WHERE id = inv.id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
