import { TransactionBuilder, xdr } from "@stellar/stellar-sdk";
import {
  stellarClient,
  CONTRACT_ADDRESSES,
  bytesToScVal,
  simulateContractCall,
  scValToU32,
  scValToU64,
  scValToI128,
  scValToBytes,
  scValToMap,
  scValIsNone,
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
   * Get credit score for a unique ID (public query).
   * Calls the contract's `get_score` function which returns Option<u32>.
   * @param uniqueId - The 32-byte unique ID to look up
   * @returns The credit score (300-850), or null if not found
   */
  async getScore(uniqueId: Buffer): Promise<number | null> {
    try {
      const result = await simulateContractCall(
        this.contractId,
        "get_score",
        [bytesToScVal(uniqueId)]
      );

      if (result && !scValIsNone(result)) {
        return scValToU32(result);
      }

      return null;
    } catch (error) {
      console.error("Error getting credit score:", error);
      return null;
    }
  }

  /**
   * Get full credit data for a unique ID (public query).
   * Calls the contract's `get_credit_data` function which returns Option<CreditData>.
   * @param uniqueId - The 32-byte unique ID to look up
   * @returns The full credit data, or null if not found
   */
  async getCreditData(uniqueId: Buffer): Promise<CreditData | null> {
    try {
      const result = await simulateContractCall(
        this.contractId,
        "get_credit_data",
        [bytesToScVal(uniqueId)]
      );

      if (result && !scValIsNone(result)) {
        return this.parseCreditData(result);
      }

      return null;
    } catch (error) {
      console.error("Error getting credit data:", error);
      return null;
    }
  }

  /**
   * Get score breakdown for a unique ID.
   * Calls the contract's `get_score_breakdown` function which returns Option<ScoreBreakdown>.
   * @param uniqueId - The 32-byte unique ID to look up
   * @returns The score breakdown, or null if not found
   */
  async getScoreBreakdown(uniqueId: Buffer): Promise<ScoreBreakdown | null> {
    try {
      const result = await simulateContractCall(
        this.contractId,
        "get_score_breakdown",
        [bytesToScVal(uniqueId)]
      );

      if (result && !scValIsNone(result)) {
        return this.parseScoreBreakdown(result);
      }

      return null;
    } catch (error) {
      console.error("Error getting score breakdown:", error);
      return null;
    }
  }

  /**
   * Get on-time payment rate (0-100) for a unique ID.
   * Calls the contract's `get_on_time_rate` function which returns Option<u32>.
   * @param uniqueId - The 32-byte unique ID to look up
   * @returns The on-time rate percentage, or null if not found
   */
  async getOnTimeRate(uniqueId: Buffer): Promise<number | null> {
    try {
      const result = await simulateContractCall(
        this.contractId,
        "get_on_time_rate",
        [bytesToScVal(uniqueId)]
      );

      if (result && !scValIsNone(result)) {
        return scValToU32(result);
      }

      return null;
    } catch (error) {
      console.error("Error getting on-time rate:", error);
      return null;
    }
  }

  /**
   * Get total number of users with credit scores.
   * Calls the contract's `get_user_count` function which returns u64.
   * @returns The total number of users
   */
  async getUserCount(): Promise<number> {
    try {
      const result = await simulateContractCall(
        this.contractId,
        "get_user_count",
        []
      );

      if (result) {
        return Number(scValToU64(result));
      }

      return 0;
    } catch (error) {
      console.error("Error getting user count:", error);
      return 0;
    }
  }

  /**
   * Parse CreditData struct from ScVal
   */
  private parseCreditData(scVal: xdr.ScVal): CreditData | null {
    try {
      const map = scValToMap(scVal);
      if (map.size === 0) return null;

      return {
        uniqueId: scValToBytes(map.get("unique_id")!),
        score: scValToU32(map.get("score")!),
        totalPayments: scValToU32(map.get("total_payments")!),
        onTimePayments: scValToU32(map.get("on_time_payments")!),
        latePayments: scValToU32(map.get("late_payments")!),
        missedPayments: scValToU32(map.get("missed_payments")!),
        circlesCompleted: scValToU32(map.get("circles_completed")!),
        circlesDefaulted: scValToU32(map.get("circles_defaulted")!),
        totalVolume: scValToI128(map.get("total_volume")!),
        lastUpdated: Number(scValToU64(map.get("last_updated")!)),
        firstActivity: Number(scValToU64(map.get("first_activity")!)),
      };
    } catch (error) {
      console.error("Error parsing credit data:", error);
      return null;
    }
  }

  /**
   * Parse ScoreBreakdown struct from ScVal
   */
  private parseScoreBreakdown(scVal: xdr.ScVal): ScoreBreakdown | null {
    try {
      const map = scValToMap(scVal);
      if (map.size === 0) return null;

      return {
        paymentHistory: scValToU32(map.get("payment_history")!),
        circleCompletion: scValToU32(map.get("circle_completion")!),
        volume: scValToU32(map.get("volume")!),
        tenure: scValToU32(map.get("tenure")!),
        attestation: scValToU32(map.get("attestation")!),
        total: scValToU32(map.get("total")!),
      };
    } catch (error) {
      console.error("Error parsing score breakdown:", error);
      return null;
    }
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
