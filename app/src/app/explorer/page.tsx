import { Header } from "@/components/layout/header";
import { AnimatedCounter } from "./components/animated-counter";
import { AddressDisplay } from "./components/address-display";
import { TransactionTimeline } from "./components/transaction-timeline";
import { ContractTable } from "./components/contract-table";

export const metadata = {
  title: "Protocol Explorer | Halo Protocol",
  description:
    "Real-time on-chain activity explorer for the Halo Protocol on Stellar testnet.",
};

interface ExplorerData {
  contracts?: { name: string; address: string; description: string }[];
  wallets?: {
    address: string;
    role: string;
    label: string;
  }[];
  transactions?: {
    hash: string;
    type: string;
    wallet: string;
    timestamp: string;
    details: string;
  }[];
}

function getExplorerData(): ExplorerData {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const raw = require("@/data/explorer-data.json");

    // Transform contracts from object format to array format
    let contracts: ExplorerData["contracts"];
    if (raw.contracts && !Array.isArray(raw.contracts)) {
      contracts = Object.values(raw.contracts) as ExplorerData["contracts"];
    } else {
      contracts = raw.contracts;
    }

    return {
      contracts,
      wallets: raw.wallets || [],
      transactions: raw.transactions || [],
    };
  } catch {
    return {};
  }
}

// Force dynamic rendering (queries live contract data)
export const dynamic = "force-dynamic";

async function fetchStats() {
  try {
    const { simulateContractCall, CONTRACT_ADDRESSES, scValToU64 } = await import("@/lib/stellar/client");

    const [bindingResult, circleResult, creditResult] = await Promise.all([
      simulateContractCall(CONTRACT_ADDRESSES.identity, "get_binding_count", []),
      simulateContractCall(CONTRACT_ADDRESSES.circle, "get_circle_count", []),
      simulateContractCall(CONTRACT_ADDRESSES.credit, "get_user_count", []),
    ]);

    return {
      binding_count: bindingResult ? Number(scValToU64(bindingResult)) : 0,
      circle_count: circleResult ? Number(scValToU64(circleResult)) : 0,
      credit_user_count: creditResult ? Number(scValToU64(creditResult)) : 0,
    };
  } catch (error) {
    console.error("Failed to fetch explorer stats:", error);
    return { binding_count: 0, circle_count: 0, credit_user_count: 0 };
  }
}

const fallbackContracts = [
  {
    name: "Identity Registry",
    address: "CDZHU3HDAARGX3R3SH235IFQGA5CTXTMYQTPCQD3ASRONXCADA2P7HOK",
    description: "Binds Stellar wallets to verified identities",
  },
  {
    name: "Credit Score Engine",
    address: "CBBJHJQJQOAZJPQK6QNDA5UKEI5K73UZQJPV5A6QCWI5KMTY6ZXCYZW3",
    description: "Computes on-chain credit scores from circle activity",
  },
  {
    name: "Circle Manager",
    address: "CA2QSALSVD4OI6IO34G7MTRK356UR6SQYH52EZKJF5RGCPDRY34GRJJP",
    description: "Manages lending circle lifecycle and payouts",
  },
];

const fallbackTransactions: ExplorerData["transactions"] = [
  {
    hash: "a1b2c3d4e5f6",
    type: "create_circle",
    wallet: "GDKU...P4JZ",
    timestamp: "2026-02-27T10:00:00Z",
    details: "Created lending circle HaloDemo",
  },
  {
    hash: "f6e5d4c3b2a1",
    type: "bind_wallet",
    wallet: "GDKU...P4JZ",
    timestamp: "2026-02-27T09:30:00Z",
    details: "Bound identity for Demo User 1",
  },
];

export default async function ExplorerPage() {
  const explorerData = getExplorerData();
  const stats = await fetchStats();

  const contractsList = explorerData.contracts || fallbackContracts;
  const wallets = explorerData.wallets || [];
  const transactions = (explorerData.transactions || fallbackTransactions) as NonNullable<ExplorerData["transactions"]>;

  return (
    <div className="min-h-screen bg-[#0B0F1A] dot-grid">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 max-w-6xl mx-auto">
        <p className="font-mono text-xs tracking-[0.2em] uppercase text-[#E2A336] mb-4">
          ON-CHAIN ACTIVITY
        </p>
        <h1 className="font-mono text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
          Protocol
          <br />
          Explorer
        </h1>
        <p className="text-lg text-neutral-500 max-w-md mb-6">
          Real-time view of the Halo Protocol on Stellar testnet.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-mono text-xs text-neutral-400">
            Stellar Testnet
          </span>
        </div>
      </section>

      {/* Protocol Metrics */}
      <section className="py-20 px-4 border-y border-white/5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
          <AnimatedCounter
            value={stats.binding_count}
            label="Identities Bound"
          />
          <AnimatedCounter
            value={stats.circle_count}
            label="Circles Created"
          />
          <AnimatedCounter
            value={stats.credit_user_count}
            label="Credit Users"
          />
        </div>
      </section>

      {/* Contract Registry */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-mono text-xs tracking-[0.2em] uppercase text-neutral-500 mb-8">
            DEPLOYED CONTRACTS
          </h2>
          <ContractTable contracts={contractsList} />
        </div>
      </section>

      {/* Active Participants */}
      {wallets.length > 0 && (
        <section className="py-20 px-4 bg-white/[0.02]">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-mono text-xs tracking-[0.2em] uppercase text-neutral-500 mb-8">
              ACTIVE PARTICIPANTS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {wallets.map((wallet, index) => (
                <div
                  key={wallet.address}
                  className="bg-[#111827] rounded-2xl p-6 border border-white/5 stagger-reveal visible"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <AddressDisplay address={wallet.address} />
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-mono px-2 py-1 rounded-full bg-white/5 text-neutral-400">
                      {wallet.role}
                    </span>
                    <a
                      href={`https://stellar.expert/explorer/testnet/account/${wallet.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-neutral-500 hover:text-white transition-colors"
                    >
                      View on stellar.expert
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Transaction Timeline */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-mono text-xs tracking-[0.2em] uppercase text-neutral-500 mb-8">
            TRANSACTION HISTORY
          </h2>
          <TransactionTimeline transactions={transactions} />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-neutral-500">
            Halo Protocol &mdash; Decentralized Lending Circles on Stellar
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-neutral-500 hover:text-white transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://stellar.expert/explorer/testnet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-neutral-500 hover:text-white transition-colors"
            >
              stellar.expert
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
