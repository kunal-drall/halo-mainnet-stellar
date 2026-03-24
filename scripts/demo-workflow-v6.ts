/**
 * Halo Protocol — On-Chain Demo Workflow v6
 *
 * Adds 8 new users with Indian names + 3 new circles to the testnet.
 * Merges results into existing explorer-data.json.
 *
 * Run: cd app && npx ts-node --compiler-options '{"module":"commonjs"}' ../scripts/demo-workflow-v6.ts
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

const RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;
const FRIENDBOT_URL = "https://friendbot.stellar.org";

const CONTRACT_ADDRESSES = {
  identity: "CDZHU3HDAARGX3R3SH235IFQGA5CTXTMYQTPCQD3ASRONXCADA2P7HOK",
  credit:   "CBBJHJQJQOAZJPQK6QNDA5UKEI5K73UZQJPV5A6QCWI5KMTY6ZXCYZW3",
  circle:   "CA2QSALSVD4OI6IO34G7MTRK356UR6SQYH52EZKJF5RGCPDRY34GRJJP",
};

const XLM_SAC_ADDRESS = Asset.native().contractId(NETWORK_PASSPHRASE);
const WALLETS_DIR = path.join(__dirname, "wallets");

const USER_NAMES = [
  "Deepak Sharma",
  "Simran Kaur",
  "Arnav Gupta",
  "Tanvi Reddy",
  "Kabir Khan",
  "Shreya Jain",
  "Manish Patel",
  "Aditi Verma",
];

// ============ Helpers ============

function addressToScVal(a: string): xdr.ScVal { return Address.fromString(a).toScVal(); }
function bytesToScVal(b: Buffer): xdr.ScVal { return xdr.ScVal.scvBytes(b); }
function i128ToScVal(v: bigint): xdr.ScVal { return nativeToScVal(v, { type: "i128" }); }
function u32ToScVal(v: number): xdr.ScVal { return nativeToScVal(v, { type: "u32" }); }
function u64ToScVal(v: bigint): xdr.ScVal { return nativeToScVal(v, { type: "u64" }); }
function symbolToScVal(v: string): xdr.ScVal { return nativeToScVal(v, { type: "symbol" }); }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface TxResult {
  hash: string; type: string; wallet: string; label: string;
  timestamp: string; details: string; success: boolean;
}
const results: TxResult[] = [];

async function buildAndSubmit(
  server: rpc.Server, keypair: Keypair, label: string,
  contractId: string, method: string, args: xdr.ScVal[],
  txType: string, details: string
): Promise<string> {
  const account = await server.getAccount(keypair.publicKey());
  const tx = new TransactionBuilder(account, { fee: "10000000", networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(300).build();
  const prepared = await server.prepareTransaction(tx);
  prepared.sign(keypair);
  const sent = await server.sendTransaction(prepared);
  console.log(`   Submitted ${txType}: ${sent.hash.slice(0, 16)}... (${sent.status})`);
  if (sent.status === "ERROR") throw new Error(`Submit error: ${JSON.stringify(sent)}`);
  for (let i = 0; i < 30; i++) {
    await sleep(2000);
    const s = await server.getTransaction(sent.hash);
    if (s.status === "SUCCESS") {
      console.log(`   ✓ ${txType} confirmed!`);
      results.push({ hash: sent.hash, type: txType, wallet: keypair.publicKey(), label, timestamp: new Date().toISOString(), details, success: true });
      return sent.hash;
    } else if (s.status === "FAILED") {
      results.push({ hash: sent.hash, type: txType, wallet: keypair.publicKey(), label, timestamp: new Date().toISOString(), details: `FAILED: ${details}`, success: false });
      throw new Error(`FAILED: ${sent.hash}`);
    }
  }
  throw new Error(`Timeout: ${sent.hash}`);
}

async function simulate(server: rpc.Server, contractId: string, method: string, args: xdr.ScVal[]): Promise<xdr.ScVal | null> {
  const tx = new TransactionBuilder(new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0"), { fee: "100", networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(30).build();
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationSuccess(sim) && sim.result) return sim.result.retval;
  return null;
}

async function runCircle(server: rpc.Server, circleName: string, shortName: string, creator: any, members: any[], xlm: number) {
  console.log(`\n  ── Circle: "${circleName}" (${xlm} XLM, ${1 + members.length} members) ──\n`);
  const all = [creator, ...members];
  const config = xdr.ScVal.scvMap([
    new xdr.ScMapEntry({ key: symbolToScVal("contribution_amount"), val: i128ToScVal(BigInt(xlm * 10_000_000)) }),
    new xdr.ScMapEntry({ key: symbolToScVal("contribution_token"),  val: addressToScVal(XLM_SAC_ADDRESS) }),
    new xdr.ScMapEntry({ key: symbolToScVal("grace_period"),        val: u64ToScVal(BigInt(3600)) }),
    new xdr.ScMapEntry({ key: symbolToScVal("late_fee_percent"),    val: u32ToScVal(5) }),
    new xdr.ScMapEntry({ key: symbolToScVal("name"),                val: symbolToScVal(shortName) }),
    new xdr.ScMapEntry({ key: symbolToScVal("period_length"),       val: u64ToScVal(BigInt(86400)) }),
    new xdr.ScMapEntry({ key: symbolToScVal("total_members"),       val: u32ToScVal(all.length) }),
  ]);

  let circleId: Buffer | null = null;
  const txHash = await buildAndSubmit(server, creator.keypair, creator.label, CONTRACT_ADDRESSES.circle, "create_circle",
    [addressToScVal(creator.publicKey), config], "create_circle",
    `${creator.label} created "${circleName}" (${xlm} XLM, ${all.length} members)`);
  const txResp = await server.getTransaction(txHash);
  if (txResp.status === "SUCCESS" && txResp.returnValue?.switch().name === "scvBytes") {
    circleId = Buffer.from(txResp.returnValue.bytes());
    console.log(`   Circle ID: ${circleId.toString("hex").slice(0, 16)}...`);
  }
  if (!circleId) { console.error("   ✗ No circle ID"); return; }

  let inviteCode: Buffer | null = null;
  const state = await simulate(server, CONTRACT_ADDRESSES.circle, "get_circle", [bytesToScVal(circleId)]);
  if (state?.switch().name === "scvMap") {
    for (const e of state.map() || []) {
      if (e.key().switch().name === "scvSymbol" && e.key().sym().toString() === "invite_code" && e.val().switch().name === "scvBytes") {
        inviteCode = Buffer.from(e.val().bytes());
        console.log(`   Invite: ${inviteCode.toString("hex").slice(0, 16)}...`);
      }
    }
  }
  if (!inviteCode) { console.error("   ✗ No invite code"); return; }

  for (const m of members) {
    try {
      await buildAndSubmit(server, m.keypair, m.label, CONTRACT_ADDRESSES.circle, "join_circle",
        [bytesToScVal(inviteCode), addressToScVal(m.publicKey)], "join_circle", `${m.label} joined "${circleName}"`);
      await sleep(2000);
    } catch (e: any) { console.error(`   ✗ join failed: ${e.message}`); }
  }

  for (const p of all) {
    try {
      await buildAndSubmit(server, p.keypair, p.label, CONTRACT_ADDRESSES.circle, "contribute",
        [bytesToScVal(circleId), addressToScVal(p.publicKey)], "contribute",
        `${p.label} contributed ${xlm} XLM to "${circleName}" round 1`);
      await sleep(2000);
    } catch (e: any) { console.error(`   ✗ contribute failed: ${e.message}`); }
  }

  const final = await simulate(server, CONTRACT_ADDRESSES.circle, "get_circle", [bytesToScVal(circleId)]);
  if (final?.switch().name === "scvMap") {
    for (const e of final.map() || []) {
      if (e.key().switch().name === "scvSymbol" && e.key().sym().toString() === "current_round") {
        const round = e.val().switch().name === "scvU32" ? e.val().u32() : 0;
        console.log(`   Current round: ${round}`);
        if (round > 1) {
          console.log(`   ✓ Payout processed! Round → ${round}`);
          results.push({ hash: "auto-processed", type: "payout", wallet: creator.publicKey, label: creator.label,
            timestamp: new Date().toISOString(), details: `${creator.label} received ${xlm * all.length} XLM from "${circleName}"`, success: true });
        }
      }
    }
  }
}

async function main() {
  console.log("═".repeat(60));
  console.log("  Halo Protocol — v6 Workflow (8 users, 3 circles)");
  console.log("═".repeat(60));

  const server = new rpc.Server(RPC_URL);
  if (!fs.existsSync(WALLETS_DIR)) fs.mkdirSync(WALLETS_DIR, { recursive: true });

  // Step 1: Generate 8 wallets
  console.log("\n━━━ Step 1: Generate Wallets ━━━\n");
  const wallets: any[] = USER_NAMES.map((name, i) => {
    const kp = Keypair.random();
    const uid = crypto.createHash("sha256").update(`halo-v6-${name}-${Date.now()}-${i}`).digest();
    console.log(`   ${name}: ${kp.publicKey()}`);
    return { label: name, publicKey: kp.publicKey(), secretKey: kp.secret(), uniqueId: uid.toString("hex"), uniqueIdBuffer: uid, keypair: kp };
  });

  fs.writeFileSync(path.join(WALLETS_DIR, "v6-wallets.json"),
    JSON.stringify(wallets.map(w => ({ label: w.label, publicKey: w.publicKey, secretKey: w.secretKey, uniqueId: w.uniqueId })), null, 2));

  // Step 2: Fund
  console.log("\n━━━ Step 2: Fund via Friendbot ━━━\n");
  for (const w of wallets) {
    const resp = await fetch(`${FRIENDBOT_URL}?addr=${w.publicKey}`);
    console.log(`   ${resp.ok ? "✓" : "⚠"} ${w.label}`);
    await sleep(800);
  }

  // Step 3: Bind identities
  console.log("\n━━━ Step 3: Bind Identities ━━━\n");
  for (const w of wallets) {
    try {
      await buildAndSubmit(server, w.keypair, w.label, CONTRACT_ADDRESSES.identity, "bind_wallet",
        [bytesToScVal(w.uniqueIdBuffer), addressToScVal(w.publicKey)], "bind_wallet", `Bound identity for ${w.label}`);
      await sleep(2000);
    } catch (e: any) { console.error(`   ✗ bind failed: ${e.message}`); }
  }

  const bindCount = await simulate(server, CONTRACT_ADDRESSES.identity, "get_binding_count", []);
  if (bindCount) { try { console.log(`\n   Total bindings on-chain: ${Number(bindCount.u64())}`); } catch {} }

  // Step 4: 3 Circles
  // Circle 1: Deepak (0), Simran (1), Arnav (2)
  await runCircle(server, "Mumbai Tech Savers", "MumTech", wallets[0], [wallets[1], wallets[2]], 60);
  await sleep(3000);

  // Circle 2: Tanvi (3), Kabir (4), Shreya (5)
  await runCircle(server, "Jaipur Savings Circle", "JaipurSave", wallets[3], [wallets[4], wallets[5]], 45);
  await sleep(3000);

  // Circle 3: Manish (6), Aditi (7), Simran (1) — cross-circle member
  await runCircle(server, "Pune Wealth Fund", "PuneWealth", wallets[6], [wallets[7], wallets[1]], 90);

  // Step 5: Credit scores
  console.log("\n━━━ Credit Scores ━━━\n");
  for (const w of wallets) {
    const score = await simulate(server, CONTRACT_ADDRESSES.credit, "get_score", [bytesToScVal(w.uniqueIdBuffer)]);
    if (score && score.switch().name !== "scvVoid") {
      try { console.log(`   ${w.label}: ${score.u32()}`); } catch { console.log(`   ${w.label}: initialized`); }
    } else { console.log(`   ${w.label}: not yet initialized`); }
  }

  saveResults(wallets);
  console.log("\n" + "═".repeat(60));
  console.log("  ✓ v6 workflow complete!");
  console.log("═".repeat(60));
}

function saveResults(wallets: any[]) {
  const explorerPath = path.join(__dirname, "..", "app", "src", "data", "explorer-data.json");
  let existing: any = { wallets: [], transactions: [] };
  if (fs.existsSync(explorerPath)) { try { existing = JSON.parse(fs.readFileSync(explorerPath, "utf8")); } catch {} }

  const creatorIdxs = new Set([0, 3, 6]);
  const existingAddrs = new Set((existing.wallets || []).map((w: any) => w.address));
  const existingHashes = new Set((existing.transactions || []).map((t: any) => t.hash));

  const newWallets = wallets.filter(w => !existingAddrs.has(w.publicKey))
    .map((w, i) => ({ address: w.publicKey, label: w.label, role: creatorIdxs.has(i) ? "Circle Creator" : "Circle Member" }));
  const newTxs = results.filter(r => r.success && !existingHashes.has(r.hash))
    .map(r => ({ hash: r.hash, type: r.type, wallet: r.wallet, label: r.label, timestamp: r.timestamp, details: r.details }));

  const merged = { ...existing, lastUpdated: new Date().toISOString(), wallets: [...(existing.wallets||[]), ...newWallets], transactions: [...(existing.transactions||[]), ...newTxs] };
  if (!fs.existsSync(path.dirname(explorerPath))) fs.mkdirSync(path.dirname(explorerPath), { recursive: true });
  fs.writeFileSync(explorerPath, JSON.stringify(merged, null, 2));
  console.log(`\n   → Explorer data: ${merged.wallets.length} wallets, ${merged.transactions.length} txns`);

  fs.writeFileSync(path.join(WALLETS_DIR, "v6-results.json"),
    JSON.stringify({ timestamp: new Date().toISOString(), contracts: CONTRACT_ADDRESSES, wallets: wallets.map(w => ({ label: w.label, publicKey: w.publicKey, uniqueId: w.uniqueId })), transactions: results }, null, 2));
}

main().catch(err => { console.error("\nFATAL:", err); process.exit(1); });
