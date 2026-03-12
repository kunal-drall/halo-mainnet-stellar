"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Circle {
  id: string;
  name: string;
  contribution_amount: number;
  member_count: number;
  status: "forming" | "active" | "completed";
  current_period: number | null;
  start_date: string | null;
  invite_code: string;
  created_at: string;
}

interface Membership {
  payout_position: number;
  has_received_payout: boolean;
  joined_at: string;
  circles: Circle;
}

interface DiscoverableCircle {
  id: string;
  name: string;
  contribution_amount: number;
  member_count: number;
  status: string;
  invite_code: string;
  current_members: number;
  organizer_name: string;
  created_at: string;
}

export default function CirclesPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [discoverable, setDiscoverable] = useState<DiscoverableCircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"my" | "discover">("my");

  useEffect(() => {
    fetchCircles();
  }, []);

  const fetchCircles = async () => {
    try {
      const response = await fetch("/api/circles");
      if (!response.ok) {
        throw new Error("Failed to fetch circles");
      }
      const data = await response.json();
      setMemberships(data.circles || []);
      setDiscoverable(data.discoverable || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    // Amount is stored in USDC with 7 decimals
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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-white/[0.06] rounded-lg animate-pulse" />
          <div className="flex gap-3">
            <div className="h-10 w-28 bg-white/[0.06] rounded-lg animate-pulse" />
            <div className="h-10 w-32 bg-white/[0.06] rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 bg-[#0F1319] border border-white/[0.06] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-in flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1
          className="text-2xl font-bold text-[#EDEDED]"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          Circles
        </h1>
        <div className="flex gap-3">
          <Link
            href="/circles/join"
            className="px-4 py-2.5 border border-white/[0.12] text-[#EDEDED] text-sm font-semibold rounded-lg hover:bg-white/[0.04] transition-colors"
          >
            Join Circle
          </Link>
          <Link
            href="/circles/create"
            className="px-4 py-2.5 bg-[#D4A843] text-[#080B12] text-sm font-semibold rounded-lg hover:bg-[#D4A843]/90 transition-colors"
          >
            Create Circle
          </Link>
        </div>
      </div>

      {/* Tab Filter */}
      <div className="animate-in delay-1 flex gap-1 bg-[#0F1319] border border-white/[0.06] rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab("my")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "my"
              ? "bg-white/[0.08] text-[#EDEDED]"
              : "text-[#545963] hover:text-[#787E88]"
          }`}
        >
          My Circles
        </button>
        <button
          onClick={() => setActiveTab("discover")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "discover"
              ? "bg-white/[0.08] text-[#EDEDED]"
              : "text-[#545963] hover:text-[#787E88]"
          }`}
        >
          Discover
          {discoverable.length > 0 && (
            <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-[#D4A843]/15 text-[#D4A843]">
              {discoverable.length}
            </span>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-[#E04040]/10 border border-[#E04040]/20 rounded-xl p-4 text-[#E04040] text-sm">
          {error}
        </div>
      )}

      {/* My Circles Tab */}
      {activeTab === "my" && (
        <>
          {memberships.length === 0 ? (
            <div className="animate-in delay-2 bg-[#0F1319] border border-white/[0.06] rounded-2xl p-10 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-[#545963]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3
                className="text-lg font-semibold text-[#EDEDED] mb-2"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                No circles yet
              </h3>
              <p className="text-[#787E88] mb-6 max-w-md mx-auto text-sm">
                Join an existing circle with an invite code or create your own to start building credit with your community.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/circles/join"
                  className="px-5 py-2.5 border border-white/[0.12] text-[#EDEDED] text-sm font-semibold rounded-lg hover:bg-white/[0.04] transition-colors"
                >
                  Enter Invite Code
                </Link>
                <Link
                  href="/circles/create"
                  className="px-5 py-2.5 bg-[#D4A843] text-[#080B12] text-sm font-semibold rounded-lg hover:bg-[#D4A843]/90 transition-colors"
                >
                  Create a Circle
                </Link>
              </div>
            </div>
          ) : (
            <div className="animate-in delay-2 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {memberships.map((membership) => {
                const circle = membership.circles;
                return (
                  <Link key={circle.id} href={`/circles/${circle.id}`}>
                    <div className="bg-[#0F1319] border border-white/[0.06] rounded-2xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.15)] h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:border-white/[0.12] cursor-pointer">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <h3
                          className="text-[#EDEDED] font-semibold truncate pr-3"
                          style={{ fontFamily: "var(--font-display), sans-serif" }}
                        >
                          {circle.name}
                        </h3>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize shrink-0 ${statusBadge(circle.status)}`}>
                          {circle.status}
                        </span>
                      </div>

                      {/* Contribution */}
                      <p className="text-[#EDEDED] font-semibold" style={{ fontFamily: "var(--font-mono), monospace" }}>
                        {formatCurrency(circle.contribution_amount)}
                        <span className="text-[#545963] text-xs font-normal ml-1">/month</span>
                      </p>

                      {/* Members */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="text-[#787E88]">{circle.member_count} members</span>
                          {circle.status === "active" && circle.current_period && (
                            <span className="text-[#545963] text-xs">
                              Round {circle.current_period}/{circle.member_count}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Position */}
                      <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-sm">
                        <span className="text-[#787E88]">Position #{membership.payout_position}</span>
                        {membership.has_received_payout && (
                          <span className="text-xs font-medium text-[#2DD4A0]">Paid</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Discover Tab */}
      {activeTab === "discover" && (
        <>
          {discoverable.length === 0 ? (
            <div className="animate-in delay-2 bg-[#0F1319] border border-white/[0.06] rounded-2xl p-10 text-center">
              <p className="text-[#787E88] text-sm">No open circles to discover right now. Check back later.</p>
            </div>
          ) : (
            <div className="animate-in delay-2 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {discoverable.map((circle) => (
                <Link key={circle.id} href={`/circles/join/${circle.invite_code}`}>
                  <div className="bg-[#0F1319] border border-white/[0.06] rounded-2xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.15)] h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:border-white/[0.12] cursor-pointer">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <h3
                        className="text-[#EDEDED] font-semibold truncate pr-3"
                        style={{ fontFamily: "var(--font-display), sans-serif" }}
                      >
                        {circle.name}
                      </h3>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${statusBadge("forming")}`}>
                        Open
                      </span>
                    </div>

                    {/* Contribution */}
                    <p className="text-[#EDEDED] font-semibold" style={{ fontFamily: "var(--font-mono), monospace" }}>
                      {formatCurrency(circle.contribution_amount)}
                      <span className="text-[#545963] text-xs font-normal ml-1">/month</span>
                    </p>

                    {/* Members progress */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-[#787E88]">{circle.current_members}/{circle.member_count} members</span>
                      </div>
                      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#D4A843] rounded-full transition-all"
                          style={{ width: `${(circle.current_members / circle.member_count) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Organizer */}
                    <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-sm">
                      <span className="text-[#545963]">by {circle.organizer_name}</span>
                      <span className="text-[#D4A843] text-xs font-medium">
                        {circle.member_count - circle.current_members} spots left
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
