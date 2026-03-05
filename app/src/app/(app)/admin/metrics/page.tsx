"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricsData {
  overview: {
    totalUsers: number;
    newUsersToday: number;
    dau: number;
    wau: number;
    mau: number;
    totalCircles: number;
    circleStatuses: Record<string, number>;
    totalContributions: number;
    contributionCount: number;
    totalPayouts: number;
    payoutCount: number;
    avgCreditScore: number;
    totalTransactionVolume: number;
  };
  scoreDistribution: { tier: string; count: number }[];
  recentActivity: {
    id: string;
    activity_type: string;
    created_at: string;
    user: { name: string; email: string };
    metadata: Record<string, unknown>;
  }[];
}

const activityLabels: Record<string, string> = {
  login: "Logged in",
  create_circle: "Created a circle",
  join_circle: "Joined a circle",
  contribute: "Made a contribution",
  bind_wallet: "Bound wallet",
  view_dashboard: "Viewed dashboard",
  payout_received: "Received payout",
};

function formatAmount(stroops: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(stroops / 10_000_000);
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function MetricsDashboardPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch("/api/admin/metrics");
        if (res.status === 403) {
          setError("You don't have permission to view this page.");
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch metrics");
        const data = await res.json();
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-lg">{error}</p>
        <Link href="/dashboard" className="text-white hover:underline mt-4 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!metrics) return null;

  const { overview, scoreDistribution, recentActivity } = metrics;
  const maxScoreCount = Math.max(...scoreDistribution.map((d) => d.count), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Metrics</h1>
        <p className="text-neutral-400 mt-1">Real-time analytics and user activity</p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={overview.totalUsers} subtitle={`+${overview.newUsersToday} today`} />
        <StatCard label="DAU" value={overview.dau} subtitle="Daily active users" />
        <StatCard label="WAU" value={overview.wau} subtitle="Weekly active users" />
        <StatCard label="MAU" value={overview.mau} subtitle="Monthly active users" />
        <StatCard label="Total Circles" value={overview.totalCircles} subtitle={`${overview.circleStatuses.active || 0} active, ${overview.circleStatuses.forming || 0} forming`} />
        <StatCard label="Contributions" value={overview.contributionCount} subtitle={formatAmount(overview.totalContributions)} />
        <StatCard label="Payouts" value={overview.payoutCount} subtitle={formatAmount(overview.totalPayouts)} />
        <StatCard label="Avg Credit Score" value={overview.avgCreditScore} subtitle="Out of 850" />
      </div>

      {/* Transaction Volume */}
      <Card variant="glass" className="p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-lg text-white">Transaction Volume</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{formatAmount(overview.totalTransactionVolume)}</p>
              <p className="text-sm text-neutral-400 mt-1">Total Volume</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">{formatAmount(overview.totalContributions)}</p>
              <p className="text-sm text-neutral-400 mt-1">Contributions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">{formatAmount(overview.totalPayouts)}</p>
              <p className="text-sm text-neutral-400 mt-1">Payouts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Credit Score Distribution */}
        <Card variant="glass" className="p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-lg text-white">Credit Score Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-3">
            {scoreDistribution.map((bucket) => (
              <div key={bucket.tier} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-300">{bucket.tier}</span>
                  <span className="text-white font-medium">{bucket.count}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${(bucket.count / maxScoreCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {scoreDistribution.every((b) => b.count === 0) && (
              <p className="text-neutral-500 text-sm text-center py-4">No credit scores yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card variant="glass" className="p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-lg text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentActivity.length === 0 ? (
              <p className="text-neutral-500 text-sm text-center py-4">No activity yet</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        <span className="font-medium">{activity.user.name}</span>{" "}
                        <span className="text-neutral-400">
                          {activityLabels[activity.activity_type] || activity.activity_type}
                        </span>
                      </p>
                    </div>
                    <span className="text-xs text-neutral-500 ml-2 shrink-0">
                      {timeAgo(activity.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Circle Breakdown */}
      <Card variant="glass" className="p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-lg text-white">Circle Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {["forming", "active", "completed", "cancelled"].map((status) => (
              <div key={status} className="text-center p-4 rounded-xl bg-white/5">
                <p className="text-2xl font-bold text-white">
                  {overview.circleStatuses[status] || 0}
                </p>
                <p className="text-sm text-neutral-400 mt-1 capitalize">{status}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: number;
  subtitle: string;
}) {
  return (
    <Card variant="glass" className="p-4">
      <CardContent className="p-0">
        <p className="text-xs text-neutral-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-white mt-1">{value.toLocaleString()}</p>
        <p className="text-xs text-neutral-400 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
