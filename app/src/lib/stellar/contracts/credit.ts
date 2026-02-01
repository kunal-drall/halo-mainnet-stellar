import { TransactionBuilder } from "@stellar/stellar-sdk";
import {
  stellarClient,
  CONTRACT_ADDRESSES,
  bytesToScVal,
} from "../client";

/**
 * Credit tier based on score range
 */
export type CreditTier = "building" | "fair" | "good" | "excellent";

/**
 * Credit data from contract
 */
export interface CreditData {
  uniqueId: Buffer;
  score: number; // 300-850
  totalPayments: number;
  onTimePayments: number;
  latePayments: number;
  missedPayments: number;
  circlesCompleted: number;
  circlesDefaulted: number;
  totalVolume: bigint;
  lastUpdated: number;
  firstActivity: number;
}

/**
 * Score breakdown by component
 */
export interface ScoreBreakdown {
  paymentHistory: number; // max 220
  circleCompletion: number; // max 137
  volume: number; // max 83
  tenure: number; // max 55
  attestation: number; // max 55
  total: number;
}

/**
 * Credit Contract Wrapper
 *
 * Handles interactions with the Halo Credit contract for:
 * - Querying credit scores (public, SDK)
 * - Recording payments (authorized contracts only)
 * - Score decay
 */
export class CreditContract {
  private contractId: string;

  constructor() {
    this.contractId = CONTRACT_ADDRESSES.credit;
  }

  /**
   * Get credit score for a unique ID (public query)
   */
  async getScore(uniqueId: Buffer): Promise<number | null> {
    try {
      const contract = stellarClient.getContract(this.contractId);
      const server = stellarClient.getServer();

      // We need an account to simulate, use the contract itself
      const account = await server.getAccount(this.contractId);

      const transaction = new TransactionBuilder(account, {
        fee: "100",
        networkPassphrase: stellarClient.getNetworkPassphrase(),
      })
        .addOperation(contract.call("get_score", bytesToScVal(uniqueId)))
        .setTimeout(30)
        .build();

      const simulation = await server.simulateTransaction(transaction);

      if ("result" in simulation && simulation.result) {
        // Parse the score from simulation result
        const resultXdr = simulation.result.retval;
        // Would need to decode the Option<u32> here
        return null;
      }

      return null;
    } catch (error) {
      console.error("Error getting credit score:", error);
      return null;
    }
  }

  /**
   * Get full credit data for a unique ID (public query)
   */
  async getCreditData(uniqueId: Buffer): Promise<CreditData | null> {
    // This would query the contract storage
    return null;
  }

  /**
   * Get score breakdown for a unique ID
   */
  async getScoreBreakdown(uniqueId: Buffer): Promise<ScoreBreakdown | null> {
    // This would query the contract
    return null;
  }

  /**
   * Get score tier from score value
   */
  scoreTier(score: number): CreditTier {
    if (score < 450) return "building";
    if (score < 600) return "fair";
    if (score < 750) return "good";
    return "excellent";
  }

  /**
   * Get tier display name
   */
  tierDisplayName(tier: CreditTier): string {
    const names: Record<CreditTier, string> = {
      building: "Building",
      fair: "Fair",
      good: "Good",
      excellent: "Excellent",
    };
    return names[tier];
  }

  /**
   * Get tier color (for UI)
   */
  tierColor(tier: CreditTier): string {
    const colors: Record<CreditTier, string> = {
      building: "#6B7280", // gray
      fair: "#F59E0B", // orange
      good: "#EAB308", // yellow
      excellent: "#22C55E", // green
    };
    return colors[tier];
  }

  /**
   * Calculate on-time rate percentage
   */
  calculateOnTimeRate(totalPayments: number, onTimePayments: number): number {
    if (totalPayments === 0) return 100;
    return Math.round((onTimePayments / totalPayments) * 100);
  }
}

export const creditContract = new CreditContract();
