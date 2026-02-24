import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Yield Vault | Halo Protocol",
  description: "Earn yield on your USDC deposits through community lending circles",
};

export default function YieldPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Yield Vault</h1>
        <p className="text-neutral-400 mt-1">
          Earn yield on your USDC through community-backed lending
        </p>
      </div>

      {/* Coming Soon Card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 lg:p-12">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10" />

        <div className="relative flex flex-col items-center text-center space-y-6">
          {/* Icon */}
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
              Coming Soon
            </span>
            <h2 className="text-xl font-semibold text-white">
              Yield Vault is Under Development
            </h2>
            <p className="text-neutral-400 max-w-lg mx-auto">
              Deposit USDC into community-backed yield vaults to earn returns. Your deposits help fund lending circles while you earn competitive yield backed by the Halo credit system.
            </p>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mt-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-bold text-emerald-400">5-8%</p>
              <p className="text-xs text-neutral-500 mt-1">Estimated APY</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-xs text-neutral-500 mt-1">Collateralized</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-bold text-white">USDC</p>
              <p className="text-xs text-neutral-500 mt-1">Stablecoin</p>
            </div>
          </div>

          <Link
            href="/circles"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-medium text-sm hover:bg-neutral-200 transition-colors mt-4"
          >
            Explore Circles Instead
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* How It Works */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
        <h3 className="text-lg font-semibold text-white mb-4">How Yield Vault Will Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white font-bold text-sm">1</div>
            <h4 className="text-sm font-medium text-white">Deposit USDC</h4>
            <p className="text-xs text-neutral-500">Deposit any amount of USDC into the vault. Your funds are used to back lending circles.</p>
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white font-bold text-sm">2</div>
            <h4 className="text-sm font-medium text-white">Earn Yield</h4>
            <p className="text-xs text-neutral-500">Earn yield from circle contributions and late fees. Returns are distributed proportionally.</p>
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white font-bold text-sm">3</div>
            <h4 className="text-sm font-medium text-white">Withdraw Anytime</h4>
            <p className="text-xs text-neutral-500">Withdraw your deposits plus earned yield at any time with no lock-up periods.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
