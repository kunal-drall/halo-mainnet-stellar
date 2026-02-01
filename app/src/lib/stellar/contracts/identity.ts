import { TransactionBuilder, Networks, Address, xdr, rpc } from "@stellar/stellar-sdk";
import {
  stellarClient,
  CONTRACT_ADDRESSES,
  addressToScVal,
  bytesToScVal,
  simulateContractCall,
  scValToBool,
  scValToBytes,
  scValToAddress,
  scValToU64,
  scValIsNone,
} from "../client";

/**
 * Identity Contract Wrapper
 *
 * Handles interactions with the Halo Identity contract for:
 * - Wallet binding (one-time, permanent)
 * - Identity verification
 * - Lookup functions
 */
export class IdentityContract {
  private contractId: string;

  constructor() {
    this.contractId = CONTRACT_ADDRESSES.identity;
  }

  /**
   * Build a transaction to bind a wallet to a unique ID
   * The user will sign this transaction with their wallet (Freighter)
   */
  async buildBindWalletTransaction(
    uniqueId: Buffer, // 32 bytes from KYC
    walletPublicKey: string
  ): Promise<string> {
    const account = await stellarClient.getAccount(walletPublicKey);
    const contract = stellarClient.getContract(this.contractId);

    const transaction = new TransactionBuilder(account, {
      fee: "100000", // 0.01 XLM
      networkPassphrase: stellarClient.getNetworkPassphrase(),
    })
      .addOperation(
        contract.call(
          "bind_wallet",
          bytesToScVal(uniqueId),
          addressToScVal(walletPublicKey)
        )
      )
      .setTimeout(300)
      .build();

    // Simulate to get resource estimates
    const prepared = await stellarClient.prepareTransaction(transaction.toXDR());

    return prepared.toXDR();
  }

  /**
   * Check if a wallet is already bound to an identity
   */
  async isBound(walletPublicKey: string): Promise<boolean> {
    try {
      const result = await simulateContractCall(
        this.contractId,
        "is_bound",
        [addressToScVal(walletPublicKey)]
      );

      if (result) {
        return scValToBool(result);
      }

      return false;
    } catch (error) {
      console.error("Error checking if wallet is bound:", error);
      return false;
    }
  }

  /**
   * Get the unique ID bound to a wallet address.
   * Calls the contract's `get_id` function which returns Result<BytesN<32>, IdentityError>.
   * @param walletPublicKey - The Stellar public key to look up
   * @returns The 32-byte unique ID buffer, or null if not bound or error
   */
  async getUniqueId(walletPublicKey: string): Promise<Buffer | null> {
    try {
      const result = await simulateContractCall(
        this.contractId,
        "get_id",
        [addressToScVal(walletPublicKey)]
      );

      if (result && !scValIsNone(result)) {
        // The result is a BytesN<32> on success
        // Check if it's an error variant (contract error returns a specific structure)
        if (result.switch().name === "scvBytes") {
          return scValToBytes(result);
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting unique ID:", error);
      return null;
    }
  }

  /**
   * Get the wallet address bound to a unique ID.
   * Calls the contract's `get_wallet` function which returns Result<Address, IdentityError>.
   * @param uniqueId - The 32-byte unique ID to look up
   * @returns The wallet address string, or null if not bound or error
   */
  async getWallet(uniqueId: Buffer): Promise<string | null> {
    try {
      const result = await simulateContractCall(
        this.contractId,
        "get_wallet",
        [bytesToScVal(uniqueId)]
      );

      if (result && !scValIsNone(result)) {
        // The result is an Address on success
        if (result.switch().name === "scvAddress") {
          return scValToAddress(result);
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting wallet:", error);
      return null;
    }
  }

  /**
   * Get total binding count.
   * Calls the contract's `get_binding_count` function which returns u64.
   * @returns The total number of wallet bindings
   */
  async getBindingCount(): Promise<number> {
    try {
      const result = await simulateContractCall(
        this.contractId,
        "get_binding_count",
        []
      );

      if (result) {
        return Number(scValToU64(result));
      }

      return 0;
    } catch (error) {
      console.error("Error getting binding count:", error);
      return 0;
    }
  }

  /**
   * Get the admin address.
   * @returns The admin address string, or null if not initialized
   */
  async getAdmin(): Promise<string | null> {
    try {
      const result = await simulateContractCall(
        this.contractId,
        "get_admin",
        []
      );

      if (result && !scValIsNone(result)) {
        if (result.switch().name === "scvAddress") {
          return scValToAddress(result);
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting admin:", error);
      return null;
    }
  }
}

export const identityContract = new IdentityContract();
