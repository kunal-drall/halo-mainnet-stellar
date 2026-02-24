import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Lending | Halo Protocol",
  description: "Access credit-score-based lending powered by your Halo credit history",
};

export default function LendingPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Lending</h1>
        <p className="text-neutral-400 mt-1">
          Access loans based on your Halo credit score
        </p>
      </div>

      {/* Coming Soon Card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 lg:p-12">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10" />

        <div className="relative flex flex-col items-center text-center space-y-6">
          {/* Icon */}
          <div className="w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">
              Coming Soon
            </span>
            <h2 className="text-xl font-semibold text-white">
              Lending is Under Development
            </h2>
            <p className="text-neutral-400 max-w-lg mx-auto">
              Use your Halo credit score to access under-collateralized loans. The higher your score from circle participation, the better your loan terms.
            </p>
          </div>

          {/* Loan Tiers Preview */}
          <div className="w-full max-w-2xl mt-4">
            <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
              <div className="grid grid-cols-4 gap-px bg-white/5 text-xs font-medium text-neutral-500 p-3">
                <span>Credit Tier</span>
                <span>Score Range</span>
                <span>Collateral</span>
                <span>Max Loan</span>
              </div>
              <div className="divide-y divide-white/5">
                <div className="grid grid-cols-4 gap-px p-3 text-sm">
                  <span className="text-red-400 font-medium">Building</span>
                  <span className="text-neutral-400">300-499</span>
                  <span className="text-neutral-400">150%</span>
                  <span className="text-neutral-400">$100</span>
                </div>
                <div className="grid grid-cols-4 gap-px p-3 text-sm">
                  <span className="text-orange-400 font-medium">Fair</span>
                  <span className="text-neutral-400">500-599</span>
                  <span className="text-neutral-400">120%</span>
                  <span className="text-neutral-400">$500</span>
                </div>
                <div className="grid grid-cols-4 gap-px p-3 text-sm">
                  <span className="text-yellow-400 font-medium">Good</span>
                  <span className="text-neutral-400">600-699</span>
                  <span className="text-neutral-400">100%</span>
                  <span className="text-neutral-400">$2,000</span>
                </div>
                <div className="grid grid-cols-4 gap-px p-3 text-sm">
                  <span className="text-emerald-400 font-medium">Excellent</span>
                  <span className="text-neutral-400">700-850</span>
                  <span className="text-neutral-400">75%</span>
                  <span className="text-neutral-400">$10,000</span>
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/credit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-medium text-sm hover:bg-neutral-200 transition-colors mt-4"
          >
            Check Your Credit Score
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
