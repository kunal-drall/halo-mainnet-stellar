import {
  rpc,
  TransactionBuilder,
  Networks,
  Contract,
  Address,
  xdr,
  nativeToScVal,
} from "@stellar/stellar-sdk";

// Network configuration
const TESTNET_RPC_URL = process.env.SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = process.env.STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;

// Contract addresses from deployment
export const CONTRACT_ADDRESSES = {
  identity: process.env.IDENTITY_CONTRACT_ADDRESS || "CBRQ7VYKMCNVBT5OGEQLDCNXUWE4OUWAP4BBIZ4MUHLVUD42JDQ5DWGY",
  credit: process.env.CREDIT_CONTRACT_ADDRESS || "CCVZS2N5RBE5O6EBKQ2UW6M3EPGYU4VPTLDV3PMZEUX3PCHI4K42N6GH",
  circle: process.env.CIRCLE_CONTRACT_ADDRESS || "CDNSZTY4IIJ7Y45FDVRHTTUKLIXNM7P53ZWX3FQ7GHKJ23LSLF4TTJ33",
} as const;

// USDC token on testnet
export const USDC_CONTRACT_ADDRESS =
  process.env.USDC_CONTRACT_ADDRESS || "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";

export class StellarClient {
  private server: rpc.Server;

  constructor() {
    this.server = new rpc.Server(TESTNET_RPC_URL);
  }

  // Get account from Stellar network
  async getAccount(publicKey: string) {
    try {
      return await this.server.getAccount(publicKey);
    } catch (error) {
      console.error("Failed to get account:", error);
      throw new Error(`Account not found: ${publicKey}`);
    }
  }

  // Submit a signed transaction
  async submitTransaction(signedXdr: string) {
    const transaction = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

    const result = await this.server.sendTransaction(transaction);

    if (result.status === "PENDING") {
      return await this.pollTransactionStatus(result.hash);
    }

    if (result.status === "ERROR") {
      throw new Error(`Transaction submission error: ${JSON.stringify(result)}`);
    }

    return result;
  }

  // Poll for transaction completion
  private async pollTransactionStatus(hash: string, maxRetries = 15): Promise<rpc.Api.GetTransactionResponse> {
    for (let i = 0; i < maxRetries; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const status = await this.server.getTransaction(hash);

      if (status.status === "SUCCESS") {
        return status;
      } else if (status.status === "FAILED") {
        throw new Error(`Transaction failed: ${hash}`);
      }
      // "NOT_FOUND" means still pending
    }

    throw new Error(`Transaction polling timeout: ${hash}`);
  }

  // Simulate a transaction before submission
  async simulateTransaction(transactionXdr: string) {
    const transaction = TransactionBuilder.fromXDR(transactionXdr, NETWORK_PASSPHRASE);
    return await this.server.simulateTransaction(transaction);
  }

  // Prepare a transaction (simulate and add resource info)
  async prepareTransaction(transactionXdr: string) {
    const transaction = TransactionBuilder.fromXDR(transactionXdr, NETWORK_PASSPHRASE);
    return await this.server.prepareTransaction(transaction);
  }

  // Get contract instance
  getContract(contractId: string): Contract {
    return new Contract(contractId);
  }

  // Get network passphrase
  getNetworkPassphrase(): string {
    return NETWORK_PASSPHRASE;
  }

  // Get RPC server
  getServer(): rpc.Server {
    return this.server;
  }
}

// Singleton instance
export const stellarClient = new StellarClient();

// Helper to convert address string to ScVal
export function addressToScVal(address: string): xdr.ScVal {
  return Address.fromString(address).toScVal();
}

// Helper to convert bytes to ScVal
export function bytesToScVal(bytes: Buffer): xdr.ScVal {
  return xdr.ScVal.scvBytes(bytes);
}

// Helper to convert number to i128 ScVal
export function i128ToScVal(value: bigint): xdr.ScVal {
  return nativeToScVal(value, { type: "i128" });
}

// Helper to convert number to u32 ScVal
export function u32ToScVal(value: number): xdr.ScVal {
  return nativeToScVal(value, { type: "u32" });
}

// Helper to convert number to u64 ScVal
export function u64ToScVal(value: bigint): xdr.ScVal {
  return nativeToScVal(value, { type: "u64" });
}

// Helper to convert string to symbol ScVal
export function symbolToScVal(value: string): xdr.ScVal {
  return nativeToScVal(value, { type: "symbol" });
}
