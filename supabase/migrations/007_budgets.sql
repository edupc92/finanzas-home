CREATE TABLE budgets (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  category_id  UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount       NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  month        TEXT NOT NULL,
  UNIQUE (household_id, category_id, month)
);
