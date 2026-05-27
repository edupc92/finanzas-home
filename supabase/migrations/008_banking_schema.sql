CREATE TABLE bank_connections (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id     UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider         TEXT NOT NULL DEFAULT 'gocardless',
  institution_id   TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  requisition_id   TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'revoked')),
  last_sync_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE bank_accounts (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bank_connection_id  UUID NOT NULL REFERENCES bank_connections(id) ON DELETE CASCADE,
  household_id        UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  external_account_id TEXT NOT NULL,
  iban                TEXT,
  name                TEXT NOT NULL,
  currency            TEXT DEFAULT 'EUR' NOT NULL,
  is_active           BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TABLE invitations (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  token        UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  created_by   UUID NOT NULL REFERENCES auth.users(id),
  expires_at   TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days') NOT NULL,
  accepted_at  TIMESTAMPTZ,
  UNIQUE (household_id, email)
);
