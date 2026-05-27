CREATE TABLE categories (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon         TEXT,
  color        TEXT,
  is_default   BOOLEAN DEFAULT FALSE NOT NULL
);
