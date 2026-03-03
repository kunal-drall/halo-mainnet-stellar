-- Halo Protocol: Analytics Tables
-- Migration 007: User activity tracking and platform metrics

-- User Activity table - tracks all user actions for DAU/WAU/MAU
CREATE TABLE user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  activity_type VARCHAR(30) NOT NULL
    CHECK (activity_type IN (
      'login', 'create_circle', 'join_circle', 'contribute',
      'view_dashboard', 'bind_wallet', 'payout_received'
    )),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_user_activity_created ON user_activity(created_at DESC);
CREATE INDEX idx_user_activity_user ON user_activity(user_id);
CREATE INDEX idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX idx_user_activity_user_created ON user_activity(user_id, created_at DESC);

-- RLS
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Only service role can insert (server-side tracking)
-- Users can view their own activity
CREATE POLICY "Users can view own activity" ON user_activity
  FOR SELECT USING (user_id::text = auth.uid()::text);

-- Platform Metrics table - daily snapshots
CREATE TABLE platform_metrics (
  date DATE PRIMARY KEY,
  total_users INTEGER DEFAULT 0,
  active_users_daily INTEGER DEFAULT 0,
  active_users_weekly INTEGER DEFAULT 0,
  active_users_monthly INTEGER DEFAULT 0,
  total_circles INTEGER DEFAULT 0,
  active_circles INTEGER DEFAULT 0,
  forming_circles INTEGER DEFAULT 0,
  completed_circles INTEGER DEFAULT 0,
  total_contributions BIGINT DEFAULT 0,
  contribution_count INTEGER DEFAULT 0,
  total_payouts BIGINT DEFAULT 0,
  payout_count INTEGER DEFAULT 0,
  avg_credit_score NUMERIC(6,2) DEFAULT 300,
  total_transaction_volume BIGINT DEFAULT 0,
  new_users_today INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS - readable by authenticated users
ALTER TABLE platform_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view metrics" ON platform_metrics
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- View: Credit score distribution
CREATE OR REPLACE VIEW v_credit_score_distribution AS
SELECT
  CASE
    WHEN score BETWEEN 300 AND 499 THEN 'Building (300-499)'
    WHEN score BETWEEN 500 AND 649 THEN 'Fair (500-649)'
    WHEN score BETWEEN 650 AND 749 THEN 'Good (650-749)'
    WHEN score BETWEEN 750 AND 850 THEN 'Excellent (750-850)'
  END AS tier,
  COUNT(*) AS user_count,
  ROUND(AVG(score), 1) AS avg_score
FROM credit_scores
GROUP BY
  CASE
    WHEN score BETWEEN 300 AND 499 THEN 'Building (300-499)'
    WHEN score BETWEEN 500 AND 649 THEN 'Fair (500-649)'
    WHEN score BETWEEN 650 AND 749 THEN 'Good (650-749)'
    WHEN score BETWEEN 750 AND 850 THEN 'Excellent (750-850)'
  END
ORDER BY MIN(score);

-- View: Circle statistics
CREATE OR REPLACE VIEW v_circle_stats AS
SELECT
  status,
  COUNT(*) AS circle_count,
  COALESCE(SUM(member_count), 0) AS total_capacity,
  COALESCE(AVG(contribution_amount), 0) AS avg_contribution
FROM circles
GROUP BY status;

-- View: Daily contribution volume (last 30 days)
CREATE OR REPLACE VIEW v_daily_contributions AS
SELECT
  DATE(paid_at) AS contribution_date,
  COUNT(*) AS contribution_count,
  COALESCE(SUM(amount), 0) AS total_amount,
  COUNT(CASE WHEN on_time = true THEN 1 END) AS on_time_count,
  COUNT(CASE WHEN on_time = false THEN 1 END) AS late_count
FROM contributions
WHERE paid_at >= NOW() - INTERVAL '30 days'
  AND status IN ('paid', 'late')
GROUP BY DATE(paid_at)
ORDER BY contribution_date DESC;
