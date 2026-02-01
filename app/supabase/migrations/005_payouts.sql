-- Halo Protocol: Payouts Table
-- Migration 005: Payout distribution tracking

CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id),

  -- Period
  period INTEGER NOT NULL,

  -- Amount
  amount BIGINT NOT NULL, -- In stroops

  -- Status
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

  -- On-chain reference
  transaction_hash VARCHAR(64),

  -- Timestamps
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(circle_id, period)
);

-- Indexes
CREATE INDEX idx_payouts_circle ON payouts(circle_id);
CREATE INDEX idx_payouts_recipient ON payouts(recipient_id);
CREATE INDEX idx_payouts_status ON payouts(status);

-- RLS
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Circle members can view payouts
CREATE POLICY "Circle members can view payouts" ON payouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.circle_id = payouts.circle_id
      AND m.user_id::text = auth.uid()::text
    )
  );
