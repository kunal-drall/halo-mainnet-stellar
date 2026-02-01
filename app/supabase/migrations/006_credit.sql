-- Halo Protocol: Credit Tables
-- Migration 006: Credit scores and events

-- Credit Scores (cached from on-chain)
CREATE TABLE credit_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),

  -- Current score (synced from chain)
  score INTEGER DEFAULT 300 CHECK (score >= 300 AND score <= 850),
  tier VARCHAR(20) DEFAULT 'building'
    CHECK (tier IN ('building', 'fair', 'good', 'excellent')),

  -- Stats (synced from chain)
  total_payments INTEGER DEFAULT 0,
  on_time_payments INTEGER DEFAULT 0,
  late_payments INTEGER DEFAULT 0,
  missed_payments INTEGER DEFAULT 0,
  circles_completed INTEGER DEFAULT 0,

  -- Sync tracking
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_credit_scores_user ON credit_scores(user_id);
CREATE INDEX idx_credit_scores_score ON credit_scores(score);
CREATE INDEX idx_credit_scores_tier ON credit_scores(tier);

-- Updated at trigger
CREATE TRIGGER credit_scores_updated_at
  BEFORE UPDATE ON credit_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE credit_scores ENABLE ROW LEVEL SECURITY;

-- Users can view their own credit score
CREATE POLICY "Users can view own credit score" ON credit_scores
  FOR SELECT USING (user_id::text = auth.uid()::text);

-- Credit Events (history log)
CREATE TABLE credit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),

  -- Event type
  event_type VARCHAR(30) NOT NULL
    CHECK (event_type IN (
      'payment_ontime', 'payment_late', 'payment_missed', 'circle_completed'
    )),

  -- Points change
  points_change INTEGER NOT NULL,
  score_after INTEGER NOT NULL,

  -- Context
  circle_id UUID REFERENCES circles(id),
  description TEXT NOT NULL,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_credit_events_user ON credit_events(user_id);
CREATE INDEX idx_credit_events_type ON credit_events(event_type);
CREATE INDEX idx_credit_events_created ON credit_events(created_at DESC);

-- RLS
ALTER TABLE credit_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own credit events
CREATE POLICY "Users can view own credit events" ON credit_events
  FOR SELECT USING (user_id::text = auth.uid()::text);
