/**
 * Application-wide constants.
 */

// Circle constraints
export const MIN_CIRCLE_MEMBERS = 3;
export const MAX_CIRCLE_MEMBERS = 12;
export const MIN_CONTRIBUTION_AMOUNT = 10; // In stroops
export const MAX_CONTRIBUTION_AMOUNT = 1_000_000_000_000; // 100k XLM

// Credit score ranges
export const CREDIT_SCORE_MIN = 300;
export const CREDIT_SCORE_MAX = 850;
export const CREDIT_SCORE_STARTING = 300;

export const CREDIT_TIERS = [
  { name: "Building", min: 300, max: 499, color: "#ef4444" },
  { name: "Fair", min: 500, max: 649, color: "#f59e0b" },
  { name: "Good", min: 650, max: 749, color: "#3b82f6" },
  { name: "Excellent", min: 750, max: 850, color: "#10b981" },
] as const;

// Rate limits
export const RATE_LIMIT_AUTH = { max: 10, windowMs: 60_000 };
export const RATE_LIMIT_CREATE = { max: 5, windowMs: 60_000 };
export const RATE_LIMIT_JOIN = { max: 5, windowMs: 60_000 };
export const RATE_LIMIT_CONTRIBUTE = { max: 10, windowMs: 60_000 };
export const RATE_LIMIT_SUBMIT = { max: 20, windowMs: 60_000 };

// Fee sponsorship
export const SPONSOR_DAILY_LIMIT = 10;
export const SPONSOR_MAX_FEE = "200000"; // 0.02 XLM

// Stellar network
export const STELLAR_NETWORK = process.env.STELLAR_NETWORK || "TESTNET";
export const SOROBAN_RPC_URL =
  process.env.SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";

// Invite codes
export const INVITE_CODE_LENGTH = 8;
export const INVITE_CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"; // No I, O to avoid confusion
