import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Halo Card | Halo Protocol",
  description: "The crypto-native credit card powered by your on-chain credit score",
};

export default function CardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Halo Card</h1>
        <p className="text-neutral-400 mt-1">
          The crypto-native credit card backed by your on-chain reputation
        </p>
      </div>

      {/* Coming Soon Card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 lg:p-12">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-rose-500/10" />

        <div className="relative flex flex-col items-center text-center space-y-6">
          {/* Card Preview */}
          <div className="w-72 h-44 rounded-2xl bg-gradient-to-br from-neutral-800 via-neutral-900 to-black border border-white/20 p-6 flex flex-col justify-between shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold text-lg tracking-wider">HALO</span>
              <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </div>
            <div>
              <div className="text-white/60 text-xs tracking-widest font-mono">
                **** **** **** 0000
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-white/60 text-xs">YOUR NAME</span>
                <span className="text-white/60 text-xs">XX/XX</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">
              Coming Soon
            </span>
            <h2 className="text-xl font-semibold text-white">
              Halo Card is Under Development
            </h2>
            <p className="text-neutral-400 max-w-lg mx-auto">
              A crypto-native credit card that uses your on-chain Halo credit score for credit limits. Spend anywhere, build credit everywhere.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mt-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-left">
              <svg className="w-6 h-6 text-amber-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
              <h4 className="text-sm font-medium text-white">Spend Anywhere</h4>
              <p className="text-xs text-neutral-500 mt-1">Use at any merchant that accepts Visa/Mastercard</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-left">
              <svg className="w-6 h-6 text-amber-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <h4 className="text-sm font-medium text-white">On-Chain Credit</h4>
              <p className="text-xs text-neutral-500 mt-1">Credit limit based on your verifiable Halo score</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-left">
              <svg className="w-6 h-6 text-amber-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
              </svg>
              <h4 className="text-sm font-medium text-white">Cashback Rewards</h4>
              <p className="text-xs text-neutral-500 mt-1">Earn cashback in USDC on every purchase</p>
            </div>
          </div>

          <Link
            href="/circles"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-medium text-sm hover:bg-neutral-200 transition-colors mt-4"
          >
            Build Your Credit Score First
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
