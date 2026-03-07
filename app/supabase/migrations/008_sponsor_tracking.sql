-- Halo Protocol: Sponsor Tracking
-- Migration 008: Track fee-sponsored transactions

CREATE TABLE sponsor_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  transaction_hash VARCHAR(64),
  fee_paid BIGINT DEFAULT 0, -- Stroops paid by sponsor
  action_type VARCHAR(30),   -- create_circle, join_circle, contribute, bind_identity
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sponsor_tx_user ON sponsor_transactions(user_id);
CREATE INDEX idx_sponsor_tx_created ON sponsor_transactions(created_at DESC);

-- RLS
ALTER TABLE sponsor_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sponsored transactions
CREATE POLICY "Users can view own sponsor transactions" ON sponsor_transactions
  FOR SELECT USING (user_id::text = auth.uid()::text);
