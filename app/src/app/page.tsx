import Link from "next/link";

import { Header } from "@/components/layout/header";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080B12]">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
          {/* Dot grid background */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          {/* Radial glow from center */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 600px 400px at 50% 45%, rgba(212,168,67,0.06) 0%, transparent 70%)",
            }}
          />

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <h1
              className="font-[var(--font-display)] text-5xl md:text-7xl font-bold tracking-tight text-[#EDEDED] mb-6"
              style={{
                fontFamily: "var(--font-display), sans-serif",
                animation: "fadeInUp 0.5s ease-out both",
              }}
            >
              Build Credit.
              <br />
              Together.
            </h1>

            <p
              className="text-[#787E88] text-lg max-w-lg mx-auto mb-10"
              style={{
                fontFamily: "var(--font-body), sans-serif",
                animation: "fadeInUp 0.5s ease-out 0.05s both",
              }}
            >
              Decentralized lending circles on Stellar. Contribute, earn trust,
              unlock opportunity.
            </p>

            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
              style={{ animation: "fadeInUp 0.5s ease-out 0.1s both" }}
            >
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl bg-[#D4A843] text-[#080B12] font-medium text-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(212,168,67,0.25)]"
              >
                Start Building
              </Link>
              <Link
                href="/explorer"
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl border border-[rgba(255,255,255,0.15)] text-[#EDEDED] font-medium text-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-[rgba(255,255,255,0.04)]"
              >
                Explore Protocol
              </Link>
            </div>

            <p
              className="text-[#545963] text-xs tracking-wide"
              style={{
                fontFamily: "var(--font-mono), monospace",
                animation: "fadeInUp 0.5s ease-out 0.15s both",
              }}
            >
              3 Smart Contracts &middot; Stellar Testnet &middot; Open Source
            </p>
          </div>
        </section>

        {/* Protocol Stats Bar */}
        <section
          className="border-t border-b border-[rgba(255,255,255,0.06)] py-10"
          style={{ animation: "fadeInUp 0.5s ease-out 0.2s both" }}
        >
          <div className="max-w-4xl mx-auto px-4 flex items-center justify-center">
            <div className="flex items-center divide-x divide-[rgba(255,255,255,0.08)]">
              <div className="px-10 text-center">
                <div
                  className="text-3xl font-bold text-[#EDEDED] mb-1"
                  style={{ fontFamily: "var(--font-mono), monospace" }}
                >
                  6+
                </div>
                <div className="text-xs text-[#545963] uppercase tracking-wider">
                  Identities
                </div>
              </div>
              <div className="px-10 text-center">
                <div
                  className="text-3xl font-bold text-[#EDEDED] mb-1"
                  style={{ fontFamily: "var(--font-mono), monospace" }}
                >
                  2+
                </div>
                <div className="text-xs text-[#545963] uppercase tracking-wider">
                  Circles
                </div>
              </div>
              <div className="px-10 text-center">
                <div
                  className="text-3xl font-bold text-[#EDEDED] mb-1"
                  style={{ fontFamily: "var(--font-mono), monospace" }}
                >
                  300+
                </div>
                <div className="text-xs text-[#545963] uppercase tracking-wider">
                  Credit Score Base
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 px-4">
          <div className="max-w-5xl mx-auto">
            <h2
              className="text-3xl font-bold tracking-tight text-[#EDEDED] mb-16"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              How it works
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  num: "01",
                  title: "Verify & Connect",
                  desc: "Bind your identity to a Stellar wallet. One account, one person, fully verified.",
                  offset: false,
                },
                {
                  num: "02",
                  title: "Join a Circle",
                  desc: "Pool funds with trusted members each period. Everyone contributes, everyone benefits.",
                  offset: true,
                },
                {
                  num: "03",
                  title: "Build Your Score",
                  desc: "Every on-time payment strengthens your credit. Your history lives on-chain, transparent and portable.",
                  offset: false,
                },
              ].map((step, i) => (
                <div
                  key={step.num}
                  className={step.offset ? "md:mt-10" : ""}
                  style={{
                    animation: `fadeInUp 0.5s ease-out ${0.25 + i * 0.05}s both`,
                  }}
                >
                  <div
                    className="text-6xl font-bold text-[#D4A843] opacity-20 mb-4"
                    style={{ fontFamily: "var(--font-mono), monospace" }}
                  >
                    {step.num}
                  </div>
                  <h3
                    className="text-xl font-semibold text-[#EDEDED] mb-2"
                    style={{ fontFamily: "var(--font-display), sans-serif" }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#787E88] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 px-4">
          <div className="max-w-5xl mx-auto">
            <h2
              className="text-3xl font-bold tracking-tight text-[#EDEDED] mb-16"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              What makes Halo different
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Large card - spans 2 cols */}
              <div
                className="md:col-span-2 bg-[#0F1319] border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                style={{ animation: "fadeInUp 0.5s ease-out 0.3s both" }}
              >
                <h3
                  className="text-xl font-semibold text-[#EDEDED] mb-3"
                  style={{ fontFamily: "var(--font-display), sans-serif" }}
                >
                  On-Chain Credit Score
                </h3>
                <p className="text-sm text-[#787E88] max-w-2xl leading-relaxed">
                  300-850 score calculated from your payment history, circle
                  completion rate, and contribution consistency. Fully
                  transparent, fully verifiable, stored on Stellar.
                </p>
              </div>

              {/* Normal card */}
              <div
                className="bg-[#0F1319] border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                style={{ animation: "fadeInUp 0.5s ease-out 0.35s both" }}
              >
                <h3
                  className="text-xl font-semibold text-[#EDEDED] mb-3"
                  style={{ fontFamily: "var(--font-display), sans-serif" }}
                >
                  Sybil Resistant
                </h3>
                <p className="text-sm text-[#787E88] leading-relaxed">
                  One wallet per verified identity. No duplicates, no gaming the
                  system.
                </p>
              </div>

              {/* Normal card */}
              <div
                className="bg-[#0F1319] border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                style={{ animation: "fadeInUp 0.5s ease-out 0.4s both" }}
              >
                <h3
                  className="text-xl font-semibold text-[#EDEDED] mb-3"
                  style={{ fontFamily: "var(--font-display), sans-serif" }}
                >
                  Gas-Free Transactions
                </h3>
                <p className="text-sm text-[#787E88] leading-relaxed">
                  Fee sponsorship for new users. Start building credit without
                  needing crypto upfront.
                </p>
              </div>

              {/* Wide card - spans 2 cols */}
              <div
                className="md:col-span-2 bg-[#0F1319] border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                style={{ animation: "fadeInUp 0.5s ease-out 0.45s both" }}
              >
                <h3
                  className="text-xl font-semibold text-[#EDEDED] mb-3"
                  style={{ fontFamily: "var(--font-display), sans-serif" }}
                >
                  Open Protocol
                </h3>
                <p className="text-sm text-[#787E88] max-w-2xl leading-relaxed">
                  Smart contracts on Stellar, composable with any DeFi protocol.
                  Build on top of Halo or integrate credit scores into your own
                  application.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4">
          <div
            className="max-w-3xl mx-auto text-center"
            style={{ animation: "fadeInUp 0.5s ease-out 0.5s both" }}
          >
            <h2
              className="text-3xl md:text-5xl font-bold tracking-tight text-[#EDEDED] mb-8"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              Ready to build your credit?
            </h2>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-[#D4A843] text-[#080B12] font-medium text-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(212,168,67,0.25)] mb-4"
            >
              Get Started &mdash; It&apos;s Free
            </Link>
            <p className="text-[#545963] text-sm mt-4">
              No credit check required. No minimum deposit.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[rgba(255,255,255,0.06)] py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center">
              <img src="/logo-icon.svg" alt="Halo" width={32} height={32} className="h-8 w-8" />
              <span className="ml-2 text-lg font-bold tracking-wide font-[family-name:var(--font-display)] text-[#EDEDED]">HALO</span>
            </div>

            <div className="flex items-center gap-6">
              <Link
                href="/explorer"
                className="text-sm text-[#545963] hover:text-[#EDEDED] transition-colors"
              >
                Explorer
              </Link>
              <a
                href="https://github.com/kunal-drall/halo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#545963] hover:text-[#EDEDED] transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://x.com/halodotfun"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#545963] hover:text-[#EDEDED] transition-colors"
              >
                Twitter
              </a>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-[#545963]">
            &copy; {new Date().getFullYear()} Halo Protocol. Built on Stellar.
          </div>
        </div>
      </footer>

      {/* Keyframes for staggered fade-in */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(8px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `,
        }}
      />
    </div>
  );
}
