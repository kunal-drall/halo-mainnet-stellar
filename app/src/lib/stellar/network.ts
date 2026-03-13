import { Networks, rpc } from "@stellar/stellar-sdk";

/**
 * Stellar network configuration and utilities.
 */

export function getNetworkPassphrase(): string {
  return process.env.STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;
}

export function getRpcUrl(): string {
  return process.env.SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
}

export function getHorizonUrl(): string {
  return process.env.HORIZON_URL || "https://horizon-testnet.stellar.org";
}

export function createRpcServer(): rpc.Server {
  return new rpc.Server(getRpcUrl());
}

export function isTestnet(): boolean {
  return getNetworkPassphrase() === Networks.TESTNET;
}

export function isMainnet(): boolean {
  return getNetworkPassphrase() === Networks.PUBLIC;
}

/**
 * Check if the Soroban RPC server is healthy.
 */
export async function checkRpcHealth(): Promise<{
  healthy: boolean;
  latestLedger?: number;
  error?: string;
}> {
  try {
    const server = createRpcServer();
    const health = await server.getHealth();
    return {
      healthy: health.status === "healthy",
      latestLedger: health.latestLedger,
    };
  } catch (err) {
    return {
      healthy: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
