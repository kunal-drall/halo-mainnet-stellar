import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
      .select("circle_id")
      .eq("user_id", session.user.id);

    if (memberships) {
      // Get circles that are active or forming
      const circleIds = memberships.map((m: any) => m.circle_id);
      if (circleIds.length > 0) {
        const { data: circles } = await supabase
          .from("circles")
          .select("id, status")
          .in("id", circleIds)
          .in("status", ["active", "forming"]);
        activeCircles = circles?.length || 0;
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

  return (
    <div className="space-y-8">
      {/* Wallet Connection Banner */}
      {!hasWallet && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-yellow-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-yellow-400 font-medium text-sm">Connect your wallet</p>
                <p className="text-yellow-400/70 text-xs">Link a Freighter wallet to participate in circles</p>
              </div>
            </div>
            <Link href="/onboarding/wallet">
              <Button size="sm">Connect Wallet</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {session?.user?.name?.split(" ")[0] || "User"}
        </h1>
        <p className="text-neutral-400 mt-1">
          Here's an overview of your credit journey
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Credit Score Card */}
        <Card variant="glass" className="md:col-span-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-neutral-400">Credit Score</span>
              <Badge variant={tier as any}>{tier}</Badge>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-white">{creditScore}</span>
              <span className="text-sm text-neutral-500 mb-1">/ 850</span>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${((creditScore - 300) / 550) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-neutral-500">
                <span>300</span>
                <span>850</span>
              </div>
            </div>
            <Link href="/credit" className="block mt-4">
              <Button variant="ghost" size="sm" className="w-full">
                View Details →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Active Circles */}
        <Card variant="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-neutral-400">Active Circles</span>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-white">{activeCircles}</div>
            <p className="text-sm text-neutral-500 mt-1">circle{activeCircles !== 1 ? "s" : ""} in progress</p>
            <Link href="/circles" className="block mt-4">
              <Button variant="ghost" size="sm" className="w-full">
                View Circles →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card variant="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-neutral-400">Pending Actions</span>
              {pendingActions > 0 && (
                <span className="w-6 h-6 rounded-full bg-yellow-500 text-black text-xs font-bold flex items-center justify-center">
                  {pendingActions}
                </span>
              )}
            </div>
            <div className="text-3xl font-bold text-white">{pendingActions}</div>
            <p className="text-sm text-neutral-500 mt-1">
              {pendingActions > 0 ? "payment(s) due" : "all caught up!"}
            </p>
            <Link href="/circles" className="block mt-4">
              <Button variant="ghost" size="sm" className="w-full">
                View Circles →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg">Create a Circle</CardTitle>
            <CardDescription>
              Start your own lending circle and invite friends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/circles/create">
              <Button className="w-full" disabled={!hasWallet}>
                {hasWallet ? "Create Circle" : "Connect Wallet First"}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg">Join a Circle</CardTitle>
            <CardDescription>
              Have an invite code? Join an existing circle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/circles">
              <Button variant="outline" className="w-full">
                Browse Circles
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Guide for new users */}
      {creditScore === 300 && activeCircles === 0 && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Complete these steps to build your credit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasWallet ? "bg-green-500/20 text-green-400" : "bg-white/10 text-neutral-400"}`}>
                  {hasWallet ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-sm font-bold">1</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Connect your wallet</p>
                  <p className="text-xs text-neutral-400">Link a Stellar wallet to your account</p>
                </div>
                {!hasWallet && (
                  <Link href="/onboarding/wallet">
                    <Button size="sm" variant="outline">Connect</Button>
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 text-neutral-400 flex items-center justify-center">
                  <span className="text-sm font-bold">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Join or create a circle</p>
                  <p className="text-xs text-neutral-400">Start participating in lending circles</p>
                </div>
                <Link href="/circles">
                  <Button size="sm" variant="outline">Browse</Button>
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 text-neutral-400 flex items-center justify-center">
                  <span className="text-sm font-bold">3</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Make on-time payments</p>
                  <p className="text-xs text-neutral-400">Build your credit score with each payment</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
