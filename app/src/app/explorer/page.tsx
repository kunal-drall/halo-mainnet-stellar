import { Header } from "@/components/layout/header";
import { AnimatedCounter } from "./components/animated-counter";
import { AddressDisplay } from "./components/address-display";
import { TransactionTimeline } from "./components/transaction-timeline";
import { ContractTable } from "./components/contract-table";
import explorerData from "@/data/explorer-data.json";

export const metadata = {
  title: "Protocol Explorer | Halo Protocol",
  description:
    "Real-time on-chain activity explorer for the Halo Protocol on Stellar testnet.",
};

// Force dynamic rendering so stats are always fresh
export const dynamic = "force-dynamic";

async function fetchStats() {
  try {
    const res = await fetch("https://app.tryhalo.fun/api/explorer/stats", {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      binding_count: (data.binding_count as number) ?? 0,
      circle_count: (data.circle_count as number) ?? 0,
    };
  } catch (error) {
    console.error("Failed to fetch explorer stats:", error);
    return { binding_count: 0, circle_count: 0 };
  }
}

// Derive contracts array from the JSON (it's stored as an object keyed by name)
const contractsList = Array.isArray(explorerData.contracts)
  ? explorerData.contracts
  : Object.values(explorerData.contracts as Record<string, { name: string; address: string; description: string }>);

const wallets = explorerData.wallets as { address: string; role: string; label: string }[];
const transactions = explorerData.transactions as { hash: string; type: string; wallet: string; timestamp: string; details: string }[];

export default async function ExplorerPage() {
  const stats = await fetchStats();

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
