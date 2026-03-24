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

// Force dynamic rendering so stats are always fresh
export const dynamic = "force-dynamic";

async function fetchStats() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tryhalo.fun";
    const res = await fetch(`${baseUrl}/api/explorer/stats`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      binding_count: data.binding_count ?? 0,
      circle_count: data.circle_count ?? 0,
      credit_user_count: data.credit_user_count ?? 0,
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
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10">
          <AnimatedCounter
            value={stats.binding_count}
            label="Identities Bound"
          />
          <AnimatedCounter
            value={stats.circle_count}
            label="Circles Created"
          />
          <AnimatedCounter
            value={wallets.length}
            label="Active Wallets"
          />
          <AnimatedCounter
            value={transactions.length}
            label="Transactions"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {wallets.map((wallet, index) => (
                <div
                  key={wallet.address}
                  className="bg-[#0F1319] rounded-2xl p-6 border border-white/[0.06] hover:-translate-y-0.5 hover:border-white/[0.12] transition-all duration-300"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-[#EDEDED]">{wallet.label}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#D4A843]/10 text-[#D4A843] border border-[#D4A843]/20">
                      {wallet.role}
                    </span>
                  </div>
                  <AddressDisplay address={wallet.address} />
                  <div className="mt-3">
                    <a
                      href={`https://stellar.expert/explorer/testnet/account/${wallet.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#545963] hover:text-[#D4A843] transition-colors"
                    >
                      View on stellar.expert &rarr;
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
