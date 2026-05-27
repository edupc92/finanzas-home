-- Helper functions
CREATE OR REPLACE FUNCTION is_household_member(hid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = hid AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION is_household_owner(hid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM households
    WHERE id = hid AND owner_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can view all profiles" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());

-- households
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members can view household" ON households FOR SELECT USING (is_household_member(id));
CREATE POLICY "authenticated can insert household" ON households FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner can update household" ON households FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "owner can delete household" ON households FOR DELETE USING (owner_id = auth.uid());

-- household_members
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members can view members" ON household_members FOR SELECT USING (is_household_member(household_id) OR user_id = auth.uid());
CREATE POLICY "owner can insert members" ON household_members FOR INSERT WITH CHECK (is_household_owner(household_id) OR user_id = auth.uid());
CREATE POLICY "owner can delete members" ON household_members FOR DELETE USING (is_household_owner(household_id) OR user_id = auth.uid());

-- categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members can view categories" ON categories FOR SELECT USING (is_household_member(household_id));
CREATE POLICY "owner can insert categories" ON categories FOR INSERT WITH CHECK (is_household_owner(household_id));
CREATE POLICY "owner can update categories" ON categories FOR UPDATE USING (is_household_owner(household_id));
CREATE POLICY "owner can delete categories" ON categories FOR DELETE USING (is_household_owner(household_id));

-- transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members can view transactions" ON transactions FOR SELECT USING (is_household_member(household_id));
CREATE POLICY "members can insert transactions" ON transactions FOR INSERT WITH CHECK (is_household_member(household_id) AND user_id = auth.uid());
CREATE POLICY "author can update transaction" ON transactions FOR UPDATE USING (user_id = auth.uid() OR is_household_owner(household_id));
CREATE POLICY "author or owner can delete transaction" ON transactions FOR DELETE USING (user_id = auth.uid() OR is_household_owner(household_id));

-- budgets
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members can view budgets" ON budgets FOR SELECT USING (is_household_member(household_id));
CREATE POLICY "owner can insert budgets" ON budgets FOR INSERT WITH CHECK (is_household_owner(household_id));
CREATE POLICY "owner can update budgets" ON budgets FOR UPDATE USING (is_household_owner(household_id));
CREATE POLICY "owner can delete budgets" ON budgets FOR DELETE USING (is_household_owner(household_id));

-- bank_connections
ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members can view bank connections" ON bank_connections FOR SELECT USING (is_household_member(household_id));
CREATE POLICY "owner can manage bank connections" ON bank_connections FOR ALL USING (is_household_owner(household_id));

-- bank_accounts
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members can view bank accounts" ON bank_accounts FOR SELECT USING (is_household_member(household_id));
CREATE POLICY "owner can manage bank accounts" ON bank_accounts FOR ALL USING (is_household_owner(household_id));

-- invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner can manage invitations" ON invitations FOR ALL USING (is_household_owner(household_id));
CREATE POLICY "public can read invitation by token" ON invitations FOR SELECT USING (TRUE);
