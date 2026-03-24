/**
 * Halo Protocol — On-Chain Demo Workflow v5
 *
 * Adds 5 more users with Indian names + 2 more circles to the testnet.
 * Merges results into existing explorer-data.json.
 *
 * Run: cd app && npx ts-node --compiler-options '{"module":"commonjs"}' ../scripts/demo-workflow-v5.ts
 */

import {
  rpc,
  Account,
  Keypair,
  TransactionBuilder,
  Networks,
  Contract,
  Address,
  xdr,
  nativeToScVal,
  Asset,
} from "@stellar/stellar-sdk";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

// ============ Configuration ============

const RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;
const FRIENDBOT_URL = "https://friendbot.stellar.org";

const CONTRACT_ADDRESSES = {
  identity: "CDZHU3HDAARGX3R3SH235IFQGA5CTXTMYQTPCQD3ASRONXCADA2P7HOK",
  credit: "CBBJHJQJQOAZJPQK6QNDA5UKEI5K73UZQJPV5A6QCWI5KMTY6ZXCYZW3",
  circle: "CA2QSALSVD4OI6IO34G7MTRK356UR6SQYH52EZKJF5RGCPDRY34GRJJP",
};

const XLM_SAC_ADDRESS = Asset.native().contractId(NETWORK_PASSPHRASE);
const WALLETS_DIR = path.join(__dirname, "wallets");

// ============ Users ============

const USER_NAMES = [
  "Aditya Bose",
  "Meera Pillai",
  "Nishant Dubey",
  "Pooja Iyer",
  "Samarth Rao",
];

// ============ Helpers ============

function addressToScVal(address: string): xdr.ScVal {
  return Address.fromString(address).toScVal();
}

function bytesToScVal(bytes: Buffer): xdr.ScVal {
  return xdr.ScVal.scvBytes(bytes);
}

function i128ToScVal(value: bigint): xdr.ScVal {
  return nativeToScVal(value, { type: "i128" });
}

function u32ToScVal(value: number): xdr.ScVal {
  return nativeToScVal(value, { type: "u32" });
}

function u64ToScVal(value: bigint): xdr.ScVal {
  return nativeToScVal(value, { type: "u64" });
}

function symbolToScVal(value: string): xdr.ScVal {
  return nativeToScVal(value, { type: "symbol" });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface TxResult {
  hash: string;
  type: string;
  wallet: string;
  label: string;
  timestamp: string;
  details: string;
  success: boolean;
}

const results: TxResult[] = [];

// ============ Core helpers ============

async function buildAndSubmit(
  server: rpc.Server,
  keypair: Keypair,
  label: string,
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  txType: string,
  details: string
): Promise<string> {
  const account = await server.getAccount(keypair.publicKey());
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: "10000000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(300)
    .build();

  const prepared = await server.prepareTransaction(tx);
  prepared.sign(keypair);

  const sendResult = await server.sendTransaction(prepared);
  console.log(`   Submitted ${txType}: ${sendResult.hash.slice(0, 16)}... (${sendResult.status})`);

  if (sendResult.status === "ERROR") {
    throw new Error(`Submit error: ${JSON.stringify(sendResult)}`);
  }

  const hash = sendResult.hash;
  for (let i = 0; i < 30; i++) {
    await sleep(2000);
    const status = await server.getTransaction(hash);
    if (status.status === "SUCCESS") {
      console.log(`   ✓ ${txType} confirmed!`);
      results.push({ hash, type: txType, wallet: keypair.publicKey(), label, timestamp: new Date().toISOString(), details, success: true });
      return hash;
    } else if (status.status === "FAILED") {
      const errMsg = `Transaction FAILED: ${hash}`;
      results.push({ hash, type: txType, wallet: keypair.publicKey(), label, timestamp: new Date().toISOString(), details: `FAILED: ${details}`, success: false });
      throw new Error(errMsg);
    }
  }
  throw new Error(`Polling timeout: ${hash}`);
}

async function simulateContractCall(
  server: rpc.Server,
  contractId: string,
  method: string,
  args: xdr.ScVal[]
): Promise<xdr.ScVal | null> {
  const contract = new Contract(contractId);
  const sourceAccount = new Account(
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
  return null;
}

// ============ Circle Workflow ============

async function runCircle(
  server: rpc.Server,
  circleName: string,
  circleNameShort: string,
  creator: any,
  members: any[],
  contributionXlm: number
): Promise<void> {
  console.log(`\n  ── Circle: "${circleName}" ──\n`);
  const allParticipants = [creator, ...members];

  const configScVal = xdr.ScVal.scvMap([
    new xdr.ScMapEntry({ key: symbolToScVal("contribution_amount"), val: i128ToScVal(BigInt(contributionXlm * 10_000_000)) }),
    new xdr.ScMapEntry({ key: symbolToScVal("contribution_token"), val: addressToScVal(XLM_SAC_ADDRESS) }),
    new xdr.ScMapEntry({ key: symbolToScVal("grace_period"), val: u64ToScVal(BigInt(3600)) }),
    new xdr.ScMapEntry({ key: symbolToScVal("late_fee_percent"), val: u32ToScVal(5) }),
    new xdr.ScMapEntry({ key: symbolToScVal("name"), val: symbolToScVal(circleNameShort) }),
    new xdr.ScMapEntry({ key: symbolToScVal("period_length"), val: u64ToScVal(BigInt(86400)) }),
    new xdr.ScMapEntry({ key: symbolToScVal("total_members"), val: u32ToScVal(allParticipants.length) }),
  ]);

  // Create
  let circleId: Buffer | null = null;
  try {
    const txHash = await buildAndSubmit(
      server, creator.keypair, creator.label,
      CONTRACT_ADDRESSES.circle, "create_circle",
      [addressToScVal(creator.publicKey), configScVal],
      "create_circle",
      `${creator.label} created circle "${circleName}" (${contributionXlm} XLM, ${allParticipants.length} members)`
    );

    const txResponse = await server.getTransaction(txHash);
    if (txResponse.status === "SUCCESS" && txResponse.returnValue) {
      const rv = txResponse.returnValue;
      if (rv.switch().name === "scvBytes") {
        circleId = Buffer.from(rv.bytes());
        console.log(`   Circle ID: ${circleId.toString("hex").slice(0, 16)}...`);
      }
    }
  } catch (err: any) {
    console.error(`   ✗ create_circle failed: ${err.message}`);
    return;
  }

  if (!circleId) { console.error("   ✗ No circle ID returned"); return; }

  // Get invite code
  let inviteCode: Buffer | null = null;
  const circleState = await simulateContractCall(server, CONTRACT_ADDRESSES.circle, "get_circle", [bytesToScVal(circleId)]);
  if (circleState && circleState.switch().name === "scvMap") {
    for (const entry of circleState.map() || []) {
      if (entry.key().switch().name === "scvSymbol" && entry.key().sym().toString() === "invite_code") {
        const val = entry.val();
        if (val.switch().name === "scvBytes") {
          inviteCode = Buffer.from(val.bytes());
          console.log(`   Invite code: ${inviteCode.toString("hex").slice(0, 16)}...`);
        }
      }
    }
  }
  if (!inviteCode) { console.error("   ✗ No invite code"); return; }

  // Join
  for (const member of members) {
    try {
      await buildAndSubmit(server, member.keypair, member.label,
        CONTRACT_ADDRESSES.circle, "join_circle",
        [bytesToScVal(inviteCode), addressToScVal(member.publicKey)],
        "join_circle", `${member.label} joined "${circleName}"`);
      await sleep(2000);
    } catch (err: any) {
      console.error(`   ✗ join failed for ${member.label}: ${err.message}`);
    }
  }

  // Contribute
  for (const participant of allParticipants) {
    try {
      await buildAndSubmit(server, participant.keypair, participant.label,
        CONTRACT_ADDRESSES.circle, "contribute",
        [bytesToScVal(circleId), addressToScVal(participant.publicKey)],
        "contribute", `${participant.label} contributed ${contributionXlm} XLM to "${circleName}" round 1`);
      await sleep(2000);
    } catch (err: any) {
      console.error(`   ✗ contribute failed for ${participant.label}: ${err.message}`);
    }
  }

  // Check result
  const finalState = await simulateContractCall(server, CONTRACT_ADDRESSES.circle, "get_circle", [bytesToScVal(circleId)]);
  if (finalState && finalState.switch().name === "scvMap") {
    for (const entry of finalState.map() || []) {
      const key = entry.key();
      if (key.switch().name === "scvSymbol" && key.sym().toString() === "current_round") {
        const round = entry.val().switch().name === "scvU32" ? entry.val().u32() : 0;
        console.log(`   Current round: ${round}`);
        if (round > 1) {
          console.log(`   ✓ Payout auto-processed! Round advanced to ${round}.`);
          results.push({
            hash: "auto-processed",
            type: "payout",
            wallet: creator.publicKey,
            label: creator.label,
            timestamp: new Date().toISOString(),
            details: `${creator.label} received ${contributionXlm * allParticipants.length} XLM payout from "${circleName}"`,
            success: true,
          });
        }
      }
    }
  }
}

// ============ Main ============

async function main() {
  console.log("═".repeat(60));
  console.log("  Halo Protocol — v5 Workflow (5 users, 2 circles)");
  console.log("═".repeat(60));

  const server = new rpc.Server(RPC_URL);
  if (!fs.existsSync(WALLETS_DIR)) fs.mkdirSync(WALLETS_DIR, { recursive: true });

  // Step 1: Generate wallets
  console.log("\n━━━ Step 1: Generate Wallets ━━━\n");
  const wallets: any[] = [];
  for (let i = 0; i < 5; i++) {
    const kp = Keypair.random();
    const seed = `halo-v5-${USER_NAMES[i]}-${Date.now()}-${i}`;
    const uniqueId = crypto.createHash("sha256").update(seed).digest();
    wallets.push({
      label: USER_NAMES[i],
      publicKey: kp.publicKey(),
      secretKey: kp.secret(),
      uniqueId: uniqueId.toString("hex"),
      uniqueIdBuffer: uniqueId,
      keypair: kp,
    });
    console.log(`   ${USER_NAMES[i]}: ${kp.publicKey()}`);
  }

  // Save secrets (gitignored)
  fs.writeFileSync(
    path.join(WALLETS_DIR, "v5-wallets.json"),
    JSON.stringify(wallets.map(w => ({ label: w.label, publicKey: w.publicKey, secretKey: w.secretKey, uniqueId: w.uniqueId })), null, 2)
  );

  // Step 2: Fund
  console.log("\n━━━ Step 2: Fund via Friendbot ━━━\n");
  for (const w of wallets) {
    try {
      const resp = await fetch(`${FRIENDBOT_URL}?addr=${w.publicKey}`);
      console.log(`   ${resp.ok ? "✓" : "⚠"} ${w.label}: ${w.publicKey.slice(0, 10)}...`);
      await sleep(1000);
    } catch {
      console.error(`   ✗ Fund failed for ${w.label}`);
    }
  }

  // Step 3: Bind identities
  console.log("\n━━━ Step 3: Bind Identities ━━━\n");
  for (const w of wallets) {
    try {
      await buildAndSubmit(server, w.keypair, w.label,
        CONTRACT_ADDRESSES.identity, "bind_wallet",
        [bytesToScVal(w.uniqueIdBuffer), addressToScVal(w.publicKey)],
        "bind_wallet", `Bound identity for ${w.label}`);
      await sleep(2000);
    } catch (err: any) {
      console.error(`   ✗ bind failed for ${w.label}: ${err.message}`);
    }
  }

  const bindCount = await simulateContractCall(server, CONTRACT_ADDRESSES.identity, "get_binding_count", []);
  if (bindCount) {
    try { console.log(`\n   Total bindings on-chain: ${Number(bindCount.u64())}`); } catch {}
  }

  // Step 4: Circle 1 — Ananya (creator), Karan, Vikram
  await runCircle(
    server,
    "Chennai Wealth Circle",
    "ChennWealth",
    wallets[0], // Aditya Bose
    [wallets[1], wallets[2]], // Meera Pillai, Nishant Dubey
    65
  );

  await sleep(3000);

  // Step 5: Circle 2 — Divya (creator), Rahul, Karan
  await runCircle(
    server,
    "Kolkata Savings Pool",
    "KolSave",
    wallets[3], // Pooja Iyer
    [wallets[4], wallets[1]], // Samarth Rao, Meera Pillai (in 2 circles)
    80
  );

  // Step 6: Credit scores
  console.log("\n━━━ Credit Scores ━━━\n");
  for (const w of wallets) {
    const scoreResult = await simulateContractCall(server, CONTRACT_ADDRESSES.credit, "get_score", [bytesToScVal(w.uniqueIdBuffer)]);
    if (scoreResult && scoreResult.switch().name !== "scvVoid") {
      try { console.log(`   ${w.label}: ${scoreResult.u32()}`); } catch { console.log(`   ${w.label}: initialized`); }
    } else {
      console.log(`   ${w.label}: not yet initialized`);
    }
  }

  saveResults(wallets);

  console.log("\n" + "═".repeat(60));
  console.log("  ✓ v5 workflow complete!");
  console.log("═".repeat(60));
}

function saveResults(wallets: any[]) {
  const explorerDataPath = path.join(__dirname, "..", "app", "src", "data", "explorer-data.json");

  // Load and merge with existing
  let existing: any = { wallets: [], transactions: [] };
  if (fs.existsSync(explorerDataPath)) {
    try { existing = JSON.parse(fs.readFileSync(explorerDataPath, "utf8")); } catch {}
  }

  const roleMap: Record<number, string> = { 0: "Circle Creator", 3: "Circle Creator" };
  const newWallets = wallets.map((w, i) => ({
    address: w.publicKey,
    label: w.label,
    role: roleMap[i] || "Circle Member",
  }));

  const newTxs = results.filter(r => r.success).map(r => ({
    hash: r.hash,
    type: r.type,
    wallet: r.wallet,
    label: r.label,
    timestamp: r.timestamp,
    details: r.details,
  }));

  const merged = {
    network: "testnet",
    rpcUrl: RPC_URL,
    lastUpdated: new Date().toISOString(),
    contracts: {
      identity: { address: CONTRACT_ADDRESSES.identity, name: "Identity Registry", description: "Sybil-resistant identity binding — one wallet per verified user" },
      credit: { address: CONTRACT_ADDRESSES.credit, name: "Credit Score Engine", description: "On-chain credit scoring based on payment history (300–850)" },
      circle: { address: CONTRACT_ADDRESSES.circle, name: "Circle Manager", description: "ROSCA circle lifecycle — creation, contributions, and payouts" },
    },
    wallets: [...(existing.wallets || []), ...newWallets],
    transactions: [...(existing.transactions || []), ...newTxs],
  };

  const dataDir = path.dirname(explorerDataPath);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(explorerDataPath, JSON.stringify(merged, null, 2));
  console.log(`\n   → Explorer data: ${merged.wallets.length} wallets, ${merged.transactions.length} txns total`);
  console.log(`   → Saved to app/src/data/explorer-data.json`);

  // Private results
  fs.writeFileSync(
    path.join(WALLETS_DIR, "v5-results.json"),
    JSON.stringify({ timestamp: new Date().toISOString(), contracts: CONTRACT_ADDRESSES, wallets: wallets.map(w => ({ label: w.label, publicKey: w.publicKey, uniqueId: w.uniqueId })), transactions: results }, null, 2)
  );
}

main().catch(err => { console.error("\nFATAL:", err); process.exit(1); });
