import {
  Keypair,
  TransactionBuilder,
  Transaction,
  Networks,
} from "@stellar/stellar-sdk";

const NETWORK_PASSPHRASE =
  process.env.STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;
const MAX_SPONSOR_FEE = "200000"; // 0.02 XLM max fee for sponsor
const DAILY_LIMIT_PER_USER = 10; // Max sponsored txns per user per day

// In-memory tracking for daily limits (resets on deploy)
const dailyUsage = new Map<string, { count: number; resetAt: number }>();

// Clean up expired daily usage entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, usage] of dailyUsage) {
    if (now >= usage.resetAt) dailyUsage.delete(key);
  }
}, 3_600_000);

/**
 * Wrap a user-signed transaction in a fee-bump transaction
 * paid by the sponsor account.
 *
 * The user's transaction remains valid — the sponsor just pays the fee.
 */
export async function sponsorTransaction(
  signedUserXdr: string,
  userId?: string
): Promise<string> {
  const sponsorSecret = process.env.SPONSOR_SECRET_KEY;
  if (!sponsorSecret) {
    throw new Error("Fee sponsorship not configured: SPONSOR_SECRET_KEY missing");
  }

  // Check daily limit for user
  if (userId) {
    const now = Date.now();
    const usage = dailyUsage.get(userId);

    if (usage && now < usage.resetAt) {
      if (usage.count >= DAILY_LIMIT_PER_USER) {
        throw new Error(
          `Daily sponsorship limit reached (${DAILY_LIMIT_PER_USER} transactions). Please try again tomorrow.`
        );
      }
      usage.count++;
    } else {
      // Reset or create new tracking entry
      dailyUsage.set(userId, {
        count: 1,
        resetAt: now + 24 * 60 * 60 * 1000, // 24 hours
      });
    }
  }

  const sponsorKeypair = Keypair.fromSecret(sponsorSecret);

  // Parse the user's signed transaction
  const innerTx = TransactionBuilder.fromXDR(
    signedUserXdr,
    NETWORK_PASSPHRASE
  ) as Transaction;

  // Build a fee-bump transaction with the sponsor paying
  const feeBumpTx = TransactionBuilder.buildFeeBumpTransaction(
    sponsorKeypair,
    MAX_SPONSOR_FEE,
    innerTx,
    NETWORK_PASSPHRASE
  );

  // Sign with sponsor key
  feeBumpTx.sign(sponsorKeypair);

  return feeBumpTx.toXDR();
}

/**
 * Check if fee sponsorship is available and configured.
 */
export function isSponsorshipEnabled(): boolean {
  return !!process.env.SPONSOR_SECRET_KEY;
}

/**
 * Get the sponsor account's public key for display purposes.
 */
export function getSponsorPublicKey(): string | null {
  const secret = process.env.SPONSOR_SECRET_KEY;
  if (!secret) return null;
  try {
    return Keypair.fromSecret(secret).publicKey();
  } catch {
    return null;
  }
}

/**
 * Get remaining sponsored transactions for a user today.
 */
export function getRemainingSponsored(userId: string): number {
  const usage = dailyUsage.get(userId);
  if (!usage || Date.now() >= usage.resetAt) return DAILY_LIMIT_PER_USER;
  return Math.max(0, DAILY_LIMIT_PER_USER - usage.count);
}
