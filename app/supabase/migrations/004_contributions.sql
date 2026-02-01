-- Halo Protocol: Contributions Table
-- Migration 004: Payment tracking per period

CREATE TABLE contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  membership_id UUID NOT NULL REFERENCES memberships(id),

  -- Period/round
  period INTEGER NOT NULL,

  -- Amount details
  amount BIGINT NOT NULL, -- In stroops
  late_fee BIGINT DEFAULT 0,

  -- Timing
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,

  -- Status
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'late', 'missed')),
  on_time BOOLEAN,

  -- On-chain reference
  transaction_hash VARCHAR(64),

  -- Credit impact
  credit_points INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(circle_id, user_id, period)
);

-- Indexes
CREATE INDEX idx_contributions_circle ON contributions(circle_id);
CREATE INDEX idx_contributions_user ON contributions(user_id);
CREATE INDEX idx_contributions_status ON contributions(status);
CREATE INDEX idx_contributions_period ON contributions(circle_id, period);
CREATE INDEX idx_contributions_due_date ON contributions(due_date);

-- RLS
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Circle members can view contributions
CREATE POLICY "Circle members can view contributions" ON contributions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.circle_id = contributions.circle_id
      AND m.user_id::text = auth.uid()::text
    )
  );

-- Users can update their own contributions (when paying)
CREATE POLICY "Users can update own contributions" ON contributions
  FOR UPDATE USING (user_id::text = auth.uid()::text);
