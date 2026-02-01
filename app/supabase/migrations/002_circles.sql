-- Halo Protocol: Circles Table
-- Migration 002: Circle metadata and configuration

CREATE TABLE circles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- On-chain reference (32 bytes as hex string)
  contract_circle_id VARCHAR(64) NOT NULL,

  -- Circle details
  name VARCHAR(30) NOT NULL,
  contribution_amount BIGINT NOT NULL, -- In stroops (1 USDC = 10^7 stroops)
  member_count INTEGER NOT NULL CHECK (member_count >= 3 AND member_count <= 10),
  start_date DATE NOT NULL,

  -- Fixed for MVP
  frequency VARCHAR(20) DEFAULT 'monthly',
  payout_method VARCHAR(20) DEFAULT 'rotation',
  contribution_token VARCHAR(56) NOT NULL, -- USDC contract address

  -- Status
  status VARCHAR(20) DEFAULT 'forming'
    CHECK (status IN ('forming', 'active', 'completed', 'cancelled')),
  current_period INTEGER DEFAULT 0,

  -- Invite
  invite_code VARCHAR(16) UNIQUE NOT NULL,

  -- Relations
  organizer_id UUID NOT NULL REFERENCES users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_circles_invite_code ON circles(invite_code);
CREATE INDEX idx_circles_organizer ON circles(organizer_id);
CREATE INDEX idx_circles_status ON circles(status);
CREATE INDEX idx_circles_contract_id ON circles(contract_circle_id);

-- Updated at trigger
CREATE TRIGGER circles_updated_at
  BEFORE UPDATE ON circles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;

-- Anyone can view circles (public listing)
CREATE POLICY "Anyone can view circles" ON circles
  FOR SELECT USING (true);

-- Only organizer can update their circles
CREATE POLICY "Organizers can update circles" ON circles
  FOR UPDATE USING (auth.uid()::text = organizer_id::text);

-- Only authenticated users can create circles
CREATE POLICY "Authenticated users can create circles" ON circles
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
