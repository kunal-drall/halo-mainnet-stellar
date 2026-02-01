import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 grid-pattern" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-neutral-400">Now live on Stellar Testnet</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Build Credit
            <br />
            <span className="text-gradient">Through Community</span>
          </h1>

          <p className="text-xl text-neutral-400 max-w-2xl mx-auto mb-10">
            Join lending circles, make contributions, and build a verifiable credit score
            on the Stellar blockchain. Access financial opportunities you deserve.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="min-w-[200px]">
                Get Started
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" size="lg" className="min-w-[200px]">
                Learn More
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-20 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-white">300-850</div>
              <div className="text-sm text-neutral-500">Credit Score Range</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">3-10</div>
              <div className="text-sm text-neutral-500">Members per Circle</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">$10-500</div>
              <div className="text-sm text-neutral-500">USDC Contributions</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-neutral-400 max-w-xl mx-auto">
              A complete platform for building credit through traditional lending circles,
              powered by blockchain technology.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card variant="glass" className="p-6">
              <CardContent className="p-0">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Lending Circles</h3>
                <p className="text-neutral-400 text-sm">
                  Join or create circles with 3-10 members. Contribute regularly and take turns
                  receiving the pooled funds.
                </p>
              </CardContent>
            </Card>

            <Card variant="glass" className="p-6">
              <CardContent className="p-0">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Credit Score</h3>
                <p className="text-neutral-400 text-sm">
                  Build your on-chain credit score from 300-850 based on payment history,
                  circle completion, and more.
                </p>
              </CardContent>
            </Card>

            <Card variant="glass" className="p-6">
              <CardContent className="p-0">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Secure & Private</h3>
                <p className="text-neutral-400 text-sm">
                  One-time wallet binding with sybil resistance. Your identity is verified
                  but your data stays private.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-neutral-400">
              Get started in minutes with these simple steps
            </p>
          </div>

          <div className="space-y-12">
            {[
              {
                step: "01",
                title: "Sign Up & Verify",
                description:
                  "Create your account with Google and complete KYC verification to prove your identity.",
              },
              {
                step: "02",
                title: "Connect Wallet",
                description:
                  "Link your Freighter wallet. This binding is permanent and ensures one account per person.",
              },
              {
                step: "03",
                title: "Join or Create a Circle",
                description:
                  "Find an existing circle to join or create your own with custom contribution amounts and schedules.",
              },
              {
                step: "04",
                title: "Contribute & Build Credit",
                description:
                  "Make your contributions on time. Each payment builds your credit score and brings you closer to your payout.",
              },
            ].map((item, index) => (
              <div key={item.step} className="flex gap-6">
                <div className="shrink-0">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-mono text-sm">
                    {item.step}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-neutral-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link href="/login">
              <Button size="lg">Start Building Credit</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 border-t border-white/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Build Your Credit?
          </h2>
          <p className="text-neutral-400 mb-8">
            Join thousands of users building verifiable credit scores through community lending.
          </p>
          <Link href="/login">
            <Button size="lg" className="min-w-[200px]">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Image
              src="/logo.png"
              alt="Halo"
              width={100}
              height={40}
              className="h-8 w-auto"
            />

            <div className="flex items-center gap-6">
              <a
                href="https://x.com/halodotfun"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                Twitter
              </a>
              <a
                href="https://t.me/kunaldrall"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                Telegram
              </a>
              <a
                href="https://github.com/kunal-drall/halo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                GitHub
              </a>
              <a
                href="mailto:founder@usehalo.fun"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                Contact
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-neutral-500">
            <p>&copy; {new Date().getFullYear()} Halo Protocol. Built on Stellar.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
