-- Halo Protocol: Memberships Table
-- Migration 003: Circle membership tracking

CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),

  -- Position in payout rotation (1-indexed)
  payout_position INTEGER NOT NULL,

  -- Status tracking
  has_received_payout BOOLEAN DEFAULT FALSE,

  -- Timestamps
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(circle_id, user_id),
  UNIQUE(circle_id, payout_position)
);

-- Indexes
CREATE INDEX idx_memberships_circle ON memberships(circle_id);
CREATE INDEX idx_memberships_user ON memberships(user_id);

-- RLS
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Members can view memberships in circles they belong to
CREATE POLICY "Members can view circle memberships" ON memberships
  FOR SELECT USING (
    user_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.circle_id = memberships.circle_id
      AND m.user_id::text = auth.uid()::text
    )
  );

-- Users can join circles (insert membership)
CREATE POLICY "Users can join circles" ON memberships
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
