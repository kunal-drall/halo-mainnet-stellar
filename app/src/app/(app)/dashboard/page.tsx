import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Dashboard - Halo Protocol",
};

// Disable caching to always fetch fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const supabase = createAdminClient();

  // Fetch real data
  let creditScore = 300;
  let tier = "building";
  let activeCircles = 0;
  let pendingActions = 0;
  let hasWallet = false;
  let userCircles: Array<{
    id: string;
    name: string;
    status: string;
    contribution_amount: number;
    member_count: number;
    current_period: number | null;
    position?: number;
  }> = [];

  if (session?.user?.id) {
    // Get user's wallet status from database (not session, which may be stale)
    const { data: userData } = await supabase
      .from("users")
      .select("wallet_address")
      .eq("id", session.user.id)
      .single();

    hasWallet = !!(userData as any)?.wallet_address;

    // Get credit score
    const { data: creditData } = await supabase
      .from("credit_scores")
      .select("score, tier")
      .eq("user_id", session.user.id)
      .single();

    if (creditData) {
      creditScore = (creditData as any).score || 300;
      tier = (creditData as any).tier || "building";
    }

    // Get user's active circles count
    const { data: memberships } = await supabase
      .from("memberships")
      .select("circle_id, payout_position")
      .eq("user_id", session.user.id);

    if (memberships) {
      // Get circles that are active or forming
      const circleIds = memberships.map((m: any) => m.circle_id);
      if (circleIds.length > 0) {
        const { data: circles } = await supabase
          .from("circles")
          .select("id, name, status, contribution_amount, member_count, current_period")
          .in("id", circleIds)
          .in("status", ["active", "forming"]);
        activeCircles = circles?.length || 0;
        userCircles = (circles || []).map((c: any) => {
          const membership = memberships.find((m: any) => m.circle_id === c.id);
          return {
            ...c,
            position: (membership as any)?.payout_position,
          };
        });
      }
    }

    // Get pending contributions count
    const { count } = await supabase
      .from("contributions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .eq("status", "pending");

    pendingActions = count || 0;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const tierColor =
    creditScore >= 700
      ? "text-[#2DD4A0]"
      : creditScore >= 500
        ? "text-[#D4A843]"
        : "text-[#787E88]";

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 10_000_000);
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      forming: "bg-[#D4A843]/10 text-[#D4A843] border-[#D4A843]/20",
      active: "bg-[#2DD4A0]/10 text-[#2DD4A0] border-[#2DD4A0]/20",
      completed: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    };
    return colors[status] || "bg-white/5 text-[#787E88] border-white/10";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Wallet Connection Banner */}
      {!hasWallet && (
        <div className="animate-in p-4 bg-[#D4A843]/10 border border-[#D4A843]/20 rounded-xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#D4A843] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-[#D4A843] font-medium text-sm">Connect your wallet</p>
                <p className="text-[#D4A843]/70 text-xs">Link a Freighter wallet to participate in circles</p>
              </div>
            </div>
            <Link
              href="/onboarding/wallet"
              className="shrink-0 px-4 py-2 bg-[#D4A843] text-[#080B12] text-sm font-semibold rounded-lg hover:bg-[#D4A843]/90 transition-colors"
            >
              Connect Wallet
            </Link>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="animate-in delay-1">
        <h1
          className="text-2xl font-bold text-[#EDEDED]"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          Dashboard
        </h1>
        <p className="text-[#787E88] text-sm mt-1" style={{ fontFamily: "var(--font-mono), monospace" }}>
          {dateStr}
        </p>
      </div>

      {/* Key Metrics Row */}
      <div className="animate-in delay-2 flex flex-col sm:flex-row items-stretch">
        {/* Credit Score */}
        <div className="flex-1 py-4 sm:pr-6">
          <p className="text-[10px] uppercase tracking-widest text-[#545963] mb-1">Credit Score</p>
          <p className={`text-3xl font-bold ${tierColor}`} style={{ fontFamily: "var(--font-mono), monospace" }}>
            {creditScore}
          </p>
          <p className="text-xs text-[#787E88] mt-0.5 capitalize">{tier}</p>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px bg-white/[0.06] self-stretch" />
        <div className="sm:hidden h-px bg-white/[0.06] w-full" />

        {/* Active Circles */}
        <div className="flex-1 py-4 sm:px-6">
          <p className="text-[10px] uppercase tracking-widest text-[#545963] mb-1">Active Circles</p>
          <p className="text-3xl font-bold text-[#EDEDED]" style={{ fontFamily: "var(--font-mono), monospace" }}>
            {activeCircles}
          </p>
          <p className="text-xs text-[#787E88] mt-0.5">circles</p>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px bg-white/[0.06] self-stretch" />
        <div className="sm:hidden h-px bg-white/[0.06] w-full" />

        {/* Pending Actions */}
        <div className="flex-1 py-4 sm:pl-6">
          <p className="text-[10px] uppercase tracking-widest text-[#545963] mb-1">Pending</p>
          <p className="text-3xl font-bold text-[#EDEDED]" style={{ fontFamily: "var(--font-mono), monospace" }}>
            {pendingActions}
          </p>
          <p className="text-xs text-[#787E88] mt-0.5">{pendingActions > 0 ? "payments due" : "all clear"}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="animate-in delay-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/circles/create"
          className="group bg-[#0F1319] border border-white/[0.06] rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.15)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:border-white/[0.12]"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#D4A843]/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#D4A843]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-[#EDEDED] font-semibold" style={{ fontFamily: "var(--font-display), sans-serif" }}>
                Create Circle
              </h3>
              <p className="text-[#545963] text-sm mt-0.5">Start a lending circle and invite friends</p>
            </div>
          </div>
        </Link>

        <Link
          href="/circles/join"
          className="group bg-[#0F1319] border border-white/[0.06] rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.15)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:border-white/[0.12]"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#D4A843]/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#D4A843]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h3 className="text-[#EDEDED] font-semibold" style={{ fontFamily: "var(--font-display), sans-serif" }}>
                Join Circle
              </h3>
              <p className="text-[#545963] text-sm mt-0.5">Enter an invite code to join an existing circle</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Active Circles List */}
      <div className="animate-in delay-4 space-y-4">
        <div className="flex items-center gap-3">
          <h2
            className="text-lg font-semibold text-[#EDEDED]"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            Your Circles
          </h2>
          {userCircles.length > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-[#787E88]">
              {userCircles.length}
            </span>
          )}
        </div>

        {userCircles.length === 0 ? (
          <div className="bg-[#0F1319] border border-white/[0.06] rounded-2xl p-8 text-center">
            <p className="text-[#787E88] mb-4">
              No circles yet. Create one or join with an invite code.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/circles/create"
                className="px-5 py-2.5 bg-[#D4A843] text-[#080B12] text-sm font-semibold rounded-lg hover:bg-[#D4A843]/90 transition-colors"
              >
                Create Circle
              </Link>
              <Link
                href="/circles/join"
                className="px-5 py-2.5 border border-white/[0.12] text-[#EDEDED] text-sm font-semibold rounded-lg hover:bg-white/[0.04] transition-colors"
              >
                Join Circle
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {userCircles.map((circle) => (
              <Link key={circle.id} href={`/circles/${circle.id}`}>
                <div className="bg-[#0F1319] border border-white/[0.06] rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.15)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:border-white/[0.12] cursor-pointer">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div>
                        <h3
                          className="text-[#EDEDED] font-semibold truncate"
                          style={{ fontFamily: "var(--font-display), sans-serif" }}
                        >
                          {circle.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-[#787E88]">
                          <span style={{ fontFamily: "var(--font-mono), monospace" }}>
                            {formatCurrency(circle.contribution_amount)}
                          </span>
                          <span className="text-[#545963]">|</span>
                          <span>{circle.member_count} members</span>
                          {circle.position && (
                            <>
                              <span className="text-[#545963]">|</span>
                              <span>Position #{circle.position}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${statusBadge(circle.status)}`}>
                        {circle.status}
                      </span>
                      <svg className="w-4 h-4 text-[#545963]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Getting Started Guide */}
      {creditScore === 300 && activeCircles === 0 && (
        <div className="animate-in delay-5">
          <details className="group" open>
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <h2
                className="text-lg font-semibold text-[#EDEDED]"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                Getting Started
              </h2>
              <svg className="w-4 h-4 text-[#545963] transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>

            {/* Progress bar */}
            <div className="mt-4 mb-5">
              <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#D4A843] rounded-full transition-all duration-500"
                  style={{ width: `${(hasWallet ? 33 : 0)}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-[#0F1319]/50">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${hasWallet ? "bg-[#2DD4A0]/15 text-[#2DD4A0]" : "bg-white/[0.06] text-[#545963]"}`}>
                  {hasWallet ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-xs font-bold">1</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${hasWallet ? "text-[#2DD4A0]" : "text-[#EDEDED]"}`}>
                    Connect Wallet
                  </p>
                  <p className="text-xs text-[#545963]">Link a Stellar wallet to your account</p>
                </div>
                {!hasWallet && (
                  <Link href="/onboarding/wallet" className="text-xs text-[#D4A843] font-medium hover:underline shrink-0">
                    Connect
                  </Link>
                )}
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-[#0F1319]/50">
                <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0 text-[#545963]">
                  <span className="text-xs font-bold">2</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#EDEDED]">Join or create a circle</p>
                  <p className="text-xs text-[#545963]">Start participating in lending circles</p>
                </div>
                <Link href="/circles" className="text-xs text-[#D4A843] font-medium hover:underline shrink-0">
                  Browse
                </Link>
              </div>

              {/* Step 3 */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-[#0F1319]/50">
                <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0 text-[#545963]">
                  <span className="text-xs font-bold">3</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#EDEDED]">Make on-time payments</p>
                  <p className="text-xs text-[#545963]">Build your credit score with each payment</p>
                </div>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
