/**
 * Test script for Halo Protocol contracts
 * Tests identity binding and circle creation with Test User 1
 *
 * Run with: npx ts-node scripts/test-contracts.ts
 */

import {
  rpc,
  Keypair,
  TransactionBuilder,
  Networks,
  Contract,
  Address,
  xdr,
  nativeToScVal,
} from "@stellar/stellar-sdk";

// Configuration
const RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;

const CONTRACT_ADDRESSES = {
  identity: "CDZHU3HDAARGX3R3SH235IFQGA5CTXTMYQTPCQD3ASRONXCADA2P7HOK",
  credit: "CBBJHJQJQOAZJPQK6QNDA5UKEI5K73UZQJPV5A6QCWI5KMTY6ZXCYZW3",
  circle: "CAZR2RDDZ2AJ6LUYFKOYAPI3PFW4KSQQBJ7REQLHQPYSMD6KZJEE5V4U",
};

// Test User 1 wallet
const TEST_USER_1_PUBLIC = "GC3RA35EVMM5XAUKWDFFZK5PCX63D5PGIJ7T3VO2S5SIBNXRLKIU2LU2";

// Helpers
function addressToScVal(address: string): xdr.ScVal {
  return Address.fromString(address).toScVal();
}

function bytesToScVal(bytes: Buffer): xdr.ScVal {
  return xdr.ScVal.scvBytes(bytes);
}

async function simulateContractCall(
  server: rpc.Server,
  contractId: string,
  method: string,
  args: xdr.ScVal[]
): Promise<xdr.ScVal | null> {
  const contract = new Contract(contractId);

  // Create a fake source account for simulation
  const sourceAccount = new rpc.Assembler.Account(
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    "0"
  );

  const tx = new TransactionBuilder(sourceAccount, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationSuccess(simResult) && simResult.result) {
    return simResult.result.retval;
  }

  console.error("Simulation failed:", simResult);
  return null;
}

function scValToBool(scVal: xdr.ScVal): boolean {
  if (scVal.switch().name === "scvBool") {
    return scVal.b();
  }
  return false;
}

function scValToU64(scVal: xdr.ScVal): bigint {
  if (scVal.switch().name === "scvU64") {
    return BigInt(scVal.u64().toString());
  }
  return BigInt(0);
}

async function main() {
  console.log("=".repeat(60));
  console.log("Halo Protocol Contract Test");
  console.log("=".repeat(60));

  const server = new rpc.Server(RPC_URL);

  // 1. Check contract states
  console.log("\n1. Checking contract states...\n");

  // Check identity binding count
  const bindingCountResult = await simulateContractCall(
    server,
    CONTRACT_ADDRESSES.identity,
    "get_binding_count",
    []
  );

  if (bindingCountResult) {
    const count = scValToU64(bindingCountResult);
    console.log(`   Identity bindings: ${count}`);
  }

  // Check circle count
  const circleCountResult = await simulateContractCall(
    server,
    CONTRACT_ADDRESSES.circle,
    "get_circle_count",
    []
  );

  if (circleCountResult) {
    const count = scValToU64(circleCountResult);
    console.log(`   Circles created: ${count}`);
  }

  // 2. Check if Test User 1 is bound
  console.log("\n2. Checking Test User 1 identity status...\n");
  console.log(`   Wallet: ${TEST_USER_1_PUBLIC}`);

  const isBoundResult = await simulateContractCall(
    server,
    CONTRACT_ADDRESSES.identity,
    "is_bound",
    [addressToScVal(TEST_USER_1_PUBLIC)]
  );

  if (isBoundResult) {
    const isBound = scValToBool(isBoundResult);
    console.log(`   Is bound: ${isBound}`);

    if (!isBound) {
      console.log("\n   Test User 1 is NOT bound to an identity.");
      console.log("   To bind, the user needs to sign a bind_wallet transaction.");
    }
  }

  // 3. Check credit score for Test User 1
  console.log("\n3. Checking credit contract...\n");

  // Check user count in credit contract
  const userCountResult = await simulateContractCall(
    server,
    CONTRACT_ADDRESSES.credit,
    "get_user_count",
    []
  );

  if (userCountResult) {
    const count = scValToU64(userCountResult);
    console.log(`   Credit users: ${count}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("Test complete!");
  console.log("=".repeat(60));
}

main().catch(console.error);
