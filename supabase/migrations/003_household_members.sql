CREATE TABLE household_members (
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  joined_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (household_id, user_id)
);
