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
   * Get circle state from contract
   */
  async getCircleState(circleId: Buffer): Promise<CircleState | null> {
    // This would read contract data using Soroban RPC
    // Implementation would use server.getContractData()
    return null;
  }

  /**
   * Check if an address is a member of a circle
   */
  async isMember(circleId: Buffer, address: string): Promise<boolean> {
    // This would read contract data
    return false;
  }

  /**
   * Get contribution status for current round
   */
  async getContributionStatus(
    circleId: Buffer
  ): Promise<{ contributed: number; total: number }> {
    // This would read contract data
    return { contributed: 0, total: 0 };
  }
}

export const circleContract = new CircleContract();
