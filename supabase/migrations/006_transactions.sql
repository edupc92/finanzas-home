CREATE TABLE transactions (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
  amount       NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  type         TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description  TEXT,
  date         DATE NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  source       TEXT DEFAULT 'manual' NOT NULL CHECK (source IN ('manual', 'bank')),
  external_tx_id TEXT UNIQUE
);

CREATE INDEX idx_transactions_household_date ON transactions (household_id, date DESC);
CREATE INDEX idx_transactions_category ON transactions (category_id);
CREATE INDEX idx_transactions_user ON transactions (user_id);
