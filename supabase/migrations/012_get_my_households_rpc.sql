CREATE OR REPLACE FUNCTION public.get_my_households()
RETURNS TABLE(id UUID, name TEXT, created_at TIMESTAMPTZ, owner_id UUID) AS $$
  SELECT h.id, h.name, h.created_at, h.owner_id
  FROM public.household_members hm
  JOIN public.households h ON h.id = hm.household_id
  WHERE hm.user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;
