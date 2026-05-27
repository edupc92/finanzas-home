-- Auto-create household, membership, and default categories when a new user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_household_id UUID;
  user_display_name TEXT;
BEGIN
  user_display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Create public profile
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, user_display_name);

  -- Create personal household
  INSERT INTO households (name, owner_id)
  VALUES ('Mi Hogar', NEW.id)
  RETURNING id INTO new_household_id;

  -- Add as owner
  INSERT INTO household_members (household_id, user_id, role)
  VALUES (new_household_id, NEW.id, 'owner');

  -- Default expense categories
  INSERT INTO categories (household_id, name, type, icon, color, is_default) VALUES
    (new_household_id, 'Alimentación',   'expense', '🛒', '#E74C3C', TRUE),
    (new_household_id, 'Transporte',     'expense', '🚗', '#F39C12', TRUE),
    (new_household_id, 'Vivienda',       'expense', '🏠', '#1E3A5F', TRUE),
    (new_household_id, 'Suministros',    'expense', '💡', '#F39C12', TRUE),
    (new_household_id, 'Salud',          'expense', '🏥', '#2ECC71', TRUE),
    (new_household_id, 'Educación',      'expense', '📚', '#1E3A5F', TRUE),
    (new_household_id, 'Ocio',           'expense', '🎬', '#9B59B6', TRUE),
    (new_household_id, 'Ropa',           'expense', '👕', '#E67E22', TRUE),
    (new_household_id, 'Restaurantes',   'expense', '🍽️', '#E74C3C', TRUE),
    (new_household_id, 'Otros gastos',   'expense', '📦', '#718096', TRUE),
    -- Default income categories
    (new_household_id, 'Nómina',         'income',  '💼', '#2ECC71', TRUE),
    (new_household_id, 'Freelance',      'income',  '💻', '#2ECC71', TRUE),
    (new_household_id, 'Inversiones',    'income',  '📈', '#1E3A5F', TRUE),
    (new_household_id, 'Otros ingresos', 'income',  '💰', '#2ECC71', TRUE);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
