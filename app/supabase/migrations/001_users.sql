-- Halo Protocol: Users Table
-- Migration 001: Core user table with authentication, KYC, and wallet binding

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  profile_image TEXT,
  google_id VARCHAR(255) UNIQUE,

  -- KYC Status
  kyc_status VARCHAR(20) DEFAULT 'pending'
    CHECK (kyc_status IN ('pending', 'processing', 'verified', 'rejected')),
  kyc_session_id VARCHAR(255),
  kyc_verified_at TIMESTAMPTZ,

  -- Unique ID (anti-sybil, derived from KYC data - 32 bytes as hex)
  unique_id VARCHAR(64) UNIQUE,

  -- Wallet binding
  wallet_address VARCHAR(56), -- Stellar public key (G...)
  wallet_bound_at TIMESTAMPTZ,
  wallet_binding_tx VARCHAR(64), -- Transaction hash

  -- Onboarding tracking
  onboarding_completed BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_users_unique_id ON users(unique_id);
CREATE INDEX idx_users_kyc_status ON users(kyc_status);
CREATE INDEX idx_users_google_id ON users(google_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS Policy
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);
