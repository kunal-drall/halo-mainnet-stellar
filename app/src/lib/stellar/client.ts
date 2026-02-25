import {
  rpc,
  TransactionBuilder,
  Networks,
  Contract,
  Address,
  xdr,
  nativeToScVal,
  Account,
  scValToNative,
} from "@stellar/stellar-sdk";

// Network configuration
const TESTNET_RPC_URL = process.env.SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = process.env.STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;

// Contract addresses from deployment
export const CONTRACT_ADDRESSES = {
  identity: process.env.IDENTITY_CONTRACT_ADDRESS || "CDZHU3HDAARGX3R3SH235IFQGA5CTXTMYQTPCQD3ASRONXCADA2P7HOK",
  credit: process.env.CREDIT_CONTRACT_ADDRESS || "CBBJHJQJQOAZJPQK6QNDA5UKEI5K73UZQJPV5A6QCWI5KMTY6ZXCYZW3",
  circle: process.env.CIRCLE_CONTRACT_ADDRESS || "CAZR2RDDZ2AJ6LUYFKOYAPI3PFW4KSQQBJ7REQLHQPYSMD6KZJEE5V4U",
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

// ============ ScVal Parsing Helpers ============

/**
 * Parse a boolean result from ScVal
 */
export function scValToBool(scVal: xdr.ScVal): boolean {
  if (scVal.switch().name === "scvBool") {
    return scVal.b();
  }
  return false;
}

/**
 * Parse a u32 result from ScVal
 */
export function scValToU32(scVal: xdr.ScVal): number {
  if (scVal.switch().name === "scvU32") {
    return scVal.u32();
  }
  return 0;
}

/**
 * Parse a u64 result from ScVal
 */
export function scValToU64(scVal: xdr.ScVal): bigint {
  if (scVal.switch().name === "scvU64") {
    return BigInt(scVal.u64().toString());
  }
  return BigInt(0);
}

/**
 * Parse an i128 result from ScVal
 */
export function scValToI128(scVal: xdr.ScVal): bigint {
  if (scVal.switch().name === "scvI128") {
    const i128 = scVal.i128();
    const hi = BigInt(i128.hi().toString());
    const lo = BigInt(i128.lo().toString());
    return (hi << BigInt(64)) | lo;
  }
  return BigInt(0);
}

/**
 * Parse bytes (BytesN) from ScVal
 */
export function scValToBytes(scVal: xdr.ScVal): Buffer {
  if (scVal.switch().name === "scvBytes") {
    return Buffer.from(scVal.bytes());
  }
  return Buffer.alloc(0);
}

/**
 * Parse an Address from ScVal
 */
export function scValToAddress(scVal: xdr.ScVal): string | null {
  if (scVal.switch().name === "scvAddress") {
    const addr = scVal.address();
    return Address.fromScAddress(addr).toString();
  }
  return null;
}

/**
 * Parse a Symbol from ScVal
 */
export function scValToSymbol(scVal: xdr.ScVal): string {
  if (scVal.switch().name === "scvSymbol") {
    return scVal.sym().toString();
  }
  return "";
}

/**
 * Check if ScVal is void/none (Option::None)
 */
export function scValIsNone(scVal: xdr.ScVal): boolean {
  return scVal.switch().name === "scvVoid";
}

/**
 * Parse a Map/Struct from ScVal
 */
export function scValToMap(scVal: xdr.ScVal): Map<string, xdr.ScVal> {
  const result = new Map<string, xdr.ScVal>();
  if (scVal.switch().name === "scvMap") {
    const entries = scVal.map();
    if (entries) {
      for (const entry of entries) {
        const keyVal = entry.key();
        const key = keyVal.switch().name === "scvSymbol" ? keyVal.sym().toString() : "";
        result.set(key, entry.val());
      }
    }
  }
  return result;
}

/**
 * Parse a Vec from ScVal
 */
export function scValToVec(scVal: xdr.ScVal): xdr.ScVal[] {
  if (scVal.switch().name === "scvVec") {
    return scVal.vec() || [];
  }
  return [];
}

/**
 * Create a mock account for read-only simulations
 * This allows us to simulate contract calls without needing a funded account
 */
function createMockAccount(): Account {
  // Use the zero address as a placeholder for simulations
  // The account doesn't need to exist on-chain for read-only operations
  return new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0");
}

/**
 * Generic simulation helper to call a contract read function
 * @param contractId - The contract address to call
 * @param method - The method name to call
 * @param args - Optional array of ScVal arguments
 * @returns The return value as ScVal, or null if the call failed
 */
export async function simulateContractCall(
  contractId: string,
  method: string,
  args: xdr.ScVal[] = []
): Promise<xdr.ScVal | null> {
  const server = stellarClient.getServer();
  const contract = stellarClient.getContract(contractId);

  try {
    // Create a mock account for simulation
    const sourceAccount = createMockAccount();

    // Build the transaction
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: "100",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build();

    const simulation = await server.simulateTransaction(transaction);

    // Check for successful simulation
    if (rpc.Api.isSimulationSuccess(simulation) && simulation.result) {
      return simulation.result.retval;
    }

    return null;
  } catch (error) {
    console.error(`Error simulating ${method}:`, error);
    return null;
  }
}

/**
 * Parse simulation result using the SDK's scValToNative helper
 * This provides automatic conversion for most types
 */
export { scValToNative };
