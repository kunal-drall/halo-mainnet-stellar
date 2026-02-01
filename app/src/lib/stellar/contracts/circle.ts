import { TransactionBuilder, xdr } from "@stellar/stellar-sdk";
import {
  stellarClient,
  CONTRACT_ADDRESSES,
  USDC_CONTRACT_ADDRESS,
  addressToScVal,
  bytesToScVal,
  i128ToScVal,
  u32ToScVal,
  u64ToScVal,
  symbolToScVal,
  simulateContractCall,
  scValToBool,
  scValToU32,
  scValToU64,
  scValToI128,
  scValToBytes,
  scValToAddress,
  scValToSymbol,
  scValToMap,
  scValToVec,
  scValIsNone,
} from "../client";

/**
 * Circle configuration for creating a new circle
 */
export interface CircleConfig {
  name: string;
  contributionAmount: bigint; // In USDC stroops (7 decimals)
  totalMembers: number; // 3-10
  periodLength: bigint; // Seconds (30 days = 2592000)
  gracePeriod: bigint; // Seconds (7 days = 604800)
  lateFeePercent: number; // 0-50
}

/**
 * Circle state from contract
 */
export interface CircleState {
  id: Buffer;
  name: string;
  status: "forming" | "active" | "completed" | "cancelled";
  members: string[];
  currentRound: number;
  contributionAmount: bigint;
  totalMembers: number;
  createdAt: number;
  startedAt: number;
  totalContributed: bigint;
  totalPaidOut: bigint;
  inviteCode: Buffer;
}

/**
 * Circle Contract Wrapper
 *
 * Handles interactions with the Halo Circle contract for:
 * - Creating circles
 * - Joining circles
 * - Making contributions
 * - Processing payouts
 */
export class CircleContract {
  private contractId: string;

  constructor() {
    this.contractId = CONTRACT_ADDRESSES.circle;
  }

  /**
   * Build transaction to create a new circle
   * Returns XDR for frontend to sign
   */
  async buildCreateCircleTransaction(
    creatorPublicKey: string,
    config: CircleConfig
  ): Promise<string> {
    const account = await stellarClient.getAccount(creatorPublicKey);
    const contract = stellarClient.getContract(this.contractId);

    // Build the CircleConfig struct as ScVal
    const configScVal = xdr.ScVal.scvMap([
      new xdr.ScMapEntry({
        key: symbolToScVal("name"),
        val: symbolToScVal(config.name),
      }),
      new xdr.ScMapEntry({
        key: symbolToScVal("contribution_amount"),
        val: i128ToScVal(config.contributionAmount),
      }),
      new xdr.ScMapEntry({
        key: symbolToScVal("contribution_token"),
        val: addressToScVal(USDC_CONTRACT_ADDRESS),
      }),
      new xdr.ScMapEntry({
        key: symbolToScVal("total_members"),
        val: u32ToScVal(config.totalMembers),
      }),
      new xdr.ScMapEntry({
        key: symbolToScVal("period_length"),
        val: u64ToScVal(config.periodLength),
      }),
      new xdr.ScMapEntry({
        key: symbolToScVal("grace_period"),
        val: u64ToScVal(config.gracePeriod),
      }),
      new xdr.ScMapEntry({
        key: symbolToScVal("late_fee_percent"),
        val: u32ToScVal(config.lateFeePercent),
      }),
    ]);

    const transaction = new TransactionBuilder(account, {
      fee: "100000",
      networkPassphrase: stellarClient.getNetworkPassphrase(),
    })
      .addOperation(
        contract.call(
          "create_circle",
          addressToScVal(creatorPublicKey),
          configScVal
        )
      )
      .setTimeout(300)
      .build();

    const prepared = await stellarClient.prepareTransaction(transaction.toXDR());
    return prepared.toXDR();
  }

  /**
   * Build transaction to join a circle via invite code
   */
  async buildJoinCircleTransaction(
    inviteCode: Buffer, // 16 bytes
    memberPublicKey: string
  ): Promise<string> {
    const account = await stellarClient.getAccount(memberPublicKey);
    const contract = stellarClient.getContract(this.contractId);

    const transaction = new TransactionBuilder(account, {
      fee: "100000",
      networkPassphrase: stellarClient.getNetworkPassphrase(),
    })
      .addOperation(
        contract.call(
          "join_circle",
          bytesToScVal(inviteCode),
          addressToScVal(memberPublicKey)
        )
      )
      .setTimeout(300)
      .build();

    const prepared = await stellarClient.prepareTransaction(transaction.toXDR());
    return prepared.toXDR();
  }

  /**
   * Build transaction to join a circle by ID (for direct joining)
   */
  async buildJoinCircleByIdTransaction(
    circleId: Buffer, // 32 bytes
    memberPublicKey: string
  ): Promise<string> {
    const account = await stellarClient.getAccount(memberPublicKey);
    const contract = stellarClient.getContract(this.contractId);

    const transaction = new TransactionBuilder(account, {
      fee: "100000",
      networkPassphrase: stellarClient.getNetworkPassphrase(),
    })
      .addOperation(
        contract.call(
          "join_circle_by_id",
          bytesToScVal(circleId),
          addressToScVal(memberPublicKey)
        )
      )
      .setTimeout(300)
      .build();

    const prepared = await stellarClient.prepareTransaction(transaction.toXDR());
    return prepared.toXDR();
  }

  /**
   * Build transaction to make a contribution
   */
  async buildContributeTransaction(
    circleId: Buffer, // 32 bytes
    memberPublicKey: string
  ): Promise<string> {
    const account = await stellarClient.getAccount(memberPublicKey);
    const contract = stellarClient.getContract(this.contractId);

    const transaction = new TransactionBuilder(account, {
      fee: "100000",
      networkPassphrase: stellarClient.getNetworkPassphrase(),
    })
      .addOperation(
        contract.call(
          "contribute",
          bytesToScVal(circleId),
          addressToScVal(memberPublicKey)
        )
      )
      .setTimeout(300)
      .build();

    const prepared = await stellarClient.prepareTransaction(transaction.toXDR());
    return prepared.toXDR();
  }

  /**
   * Build transaction to process a payout
   */
  async buildProcessPayoutTransaction(
    circleId: Buffer,
    callerPublicKey: string
  ): Promise<string> {
    const account = await stellarClient.getAccount(callerPublicKey);
    const contract = stellarClient.getContract(this.contractId);

    const transaction = new TransactionBuilder(account, {
      fee: "100000",
      networkPassphrase: stellarClient.getNetworkPassphrase(),
    })
      .addOperation(contract.call("process_payout", bytesToScVal(circleId)))
      .setTimeout(300)
      .build();

    const prepared = await stellarClient.prepareTransaction(transaction.toXDR());
    return prepared.toXDR();
  }

  /**
   * Get circle state from contract.
   * Calls the contract's `get_circle` function which returns Option<CircleState>.
   * @param circleId - The 32-byte circle ID
   * @returns The circle state, or null if not found
   */
  async getCircleState(circleId: Buffer): Promise<CircleState | null> {
    try {
      const result = await simulateContractCall(
        this.contractId,
        "get_circle",
        [bytesToScVal(circleId)]
      );

      if (result && !scValIsNone(result)) {
        return this.parseCircleState(result);
      }

      return null;
    } catch (error) {
      console.error("Error getting circle state:", error);
      return null;
    }
  }

  /**
   * Get circle by invite code.
   * Calls the contract's `get_circle_by_invite` function.
   * @param inviteCode - The 16-byte invite code
   * @returns The circle state, or null if not found
   */
  async getCircleByInvite(inviteCode: Buffer): Promise<CircleState | null> {
    try {
      const result = await simulateContractCall(
        this.contractId,
        "get_circle_by_invite",
        [bytesToScVal(inviteCode)]
      );

      if (result && !scValIsNone(result)) {
        return this.parseCircleState(result);
      }

      return null;
    } catch (error) {
      console.error("Error getting circle by invite:", error);
      return null;
    }
  }

  /**
   * Check if an address is a member of a circle.
   * Calls the contract's `is_member` function which returns bool.
   * @param circleId - The 32-byte circle ID
   * @param address - The wallet address to check
   * @returns True if the address is a member
   */
  async isMember(circleId: Buffer, address: string): Promise<boolean> {
    try {
      const result = await simulateContractCall(
        this.contractId,
        "is_member",
        [bytesToScVal(circleId), addressToScVal(address)]
      );

      if (result) {
        return scValToBool(result);
      }

      return false;
    } catch (error) {
      console.error("Error checking membership:", error);
      return false;
    }
  }

  /**
   * Get contribution status for current round.
   * Calls the contract's `get_contribution_status` function which returns (u32, u32).
   * @param circleId - The 32-byte circle ID
   * @returns Object with contributed and total member counts
   */
  async getContributionStatus(
    circleId: Buffer
  ): Promise<{ contributed: number; total: number }> {
    try {
      const result = await simulateContractCall(
        this.contractId,
        "get_contribution_status",
        [bytesToScVal(circleId)]
      );

      if (result) {
        // The result is a tuple (u32, u32) returned as a Vec
        const vec = scValToVec(result);
        if (vec.length >= 2) {
          return {
            contributed: scValToU32(vec[0]),
            total: scValToU32(vec[1]),
          };
        }
      }

      return { contributed: 0, total: 0 };
    } catch (error) {
      console.error("Error getting contribution status:", error);
      return { contributed: 0, total: 0 };
    }
  }

  /**
   * Get total circle count.
   * Calls the contract's `get_circle_count` function which returns u64.
   * @returns The total number of circles created
   */
  async getCircleCount(): Promise<number> {
    try {
      const result = await simulateContractCall(
        this.contractId,
        "get_circle_count",
        []
      );

      if (result) {
        return Number(scValToU64(result));
      }

      return 0;
    } catch (error) {
      console.error("Error getting circle count:", error);
      return 0;
    }
  }

  /**
   * Parse CircleState struct from ScVal.
   * Maps the contract's CircleState struct to the TypeScript interface.
   */
  private parseCircleState(scVal: xdr.ScVal): CircleState | null {
    try {
      const map = scValToMap(scVal);
      if (map.size === 0) return null;

      // Parse the nested config
      const configVal = map.get("config");
      const configMap = configVal ? scValToMap(configVal) : new Map();

      // Parse members list
      const membersVal = map.get("members");
      const membersVec = membersVal ? scValToVec(membersVal) : [];
      const members = membersVec.map((m) => scValToAddress(m) || "").filter((m) => m !== "");

      // Parse status enum
      const statusVal = map.get("status");
      let status: "forming" | "active" | "completed" | "cancelled" = "forming";
      if (statusVal) {
        // Soroban enums are typically represented as a map with a single key
        const statusMap = scValToMap(statusVal);
        const statusKey = Array.from(statusMap.keys())[0] || "";
        if (statusKey.toLowerCase() === "active") status = "active";
        else if (statusKey.toLowerCase() === "completed") status = "completed";
        else if (statusKey.toLowerCase() === "cancelled") status = "cancelled";
        // Also check if it's a symbol directly
        if (statusVal.switch().name === "scvSymbol") {
          const sym = scValToSymbol(statusVal).toLowerCase();
          if (sym === "active") status = "active";
          else if (sym === "completed") status = "completed";
          else if (sym === "cancelled") status = "cancelled";
        }
      }

      return {
        id: scValToBytes(map.get("id")!),
        name: configMap.has("name") ? scValToSymbol(configMap.get("name")!) : "",
        status,
        members,
        currentRound: scValToU32(map.get("current_round")!),
        contributionAmount: configMap.has("contribution_amount")
          ? scValToI128(configMap.get("contribution_amount")!)
          : BigInt(0),
        totalMembers: configMap.has("total_members")
          ? scValToU32(configMap.get("total_members")!)
          : 0,
        createdAt: Number(scValToU64(map.get("created_at")!)),
        startedAt: Number(scValToU64(map.get("started_at")!)),
        totalContributed: scValToI128(map.get("total_contributed")!),
        totalPaidOut: scValToI128(map.get("total_paid_out")!),
        inviteCode: scValToBytes(map.get("invite_code")!),
      };
    } catch (error) {
      console.error("Error parsing circle state:", error);
      return null;
    }
  }
}

export const circleContract = new CircleContract();
