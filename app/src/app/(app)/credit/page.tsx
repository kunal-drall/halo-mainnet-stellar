"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface CreditScore {
  score: number;
  tier: string;
  stats: {
    totalPayments: number;
    onTimePayments: number;
    latePayments: number;
    missedPayments: number;
    circlesCompleted: number;
  } | null;
  lastSyncedAt?: string;
  cached?: boolean;
  message?: string;
}

interface CreditEvent {
  id: string;
  event_type: string;
  points_change: number;
  score_after: number;
  description: string;
  created_at: string;
  circle?: {
    id: string;
    name: string;
  };
}

export default function CreditPage() {
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [events, setEvents] = useState<CreditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCreditData();
  }, []);

  const fetchCreditData = async () => {
    try {
      const [scoreRes, historyRes] = await Promise.all([
        fetch("/api/credit/score"),
        fetch("/api/credit/history?limit=10"),
      ]);

      if (!scoreRes.ok || !historyRes.ok) {
        throw new Error("Failed to fetch credit data");
      }

      const scoreData = await scoreRes.json();
      const historyData = await historyRes.json();

      setCreditScore(scoreData);
      setEvents(historyData.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "excellent":
        return "#2DD4A0";
      case "good":
        return "#D4A843";
      case "fair":
        return "#E08A40";
      default:
        return "#E04040";
    }
  };

  const getTierTextClass = (tier: string) => {
    switch (tier) {
      case "excellent":
        return "text-[#2DD4A0]";
      case "good":
        return "text-[#D4A843]";
      case "fair":
        return "text-[#E08A40]";
      default:
        return "text-[#E04040]";
    }
  };

  const getTierLabel = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "payment":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "circle_completed":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "late_payment":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Credit Score Gauge Component
  const CreditGauge = ({ score, tier }: { score: number; tier: string }) => {
    const percentage = ((score - 300) / (850 - 300)) * 100;
    const circumference = 2 * Math.PI * 90;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const color = getTierColor(tier);

    return (
      <div className="relative w-[200px] h-[200px] mx-auto">
        {/* Subtle glow behind gauge */}
        <div
          className="absolute inset-0 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: color }}
        />
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="10"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-6xl font-bold" style={{ color }}>
            {score}
          </span>
          <span
            className={`text-xs font-semibold uppercase tracking-[0.2em] mt-1 ${getTierTextClass(tier)}`}
          >
            {getTierLabel(tier)}
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[340px] rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const onTimeRate = creditScore?.stats
    ? creditScore.stats.totalPayments > 0
      ? Math.round((creditScore.stats.onTimePayments / creditScore.stats.totalPayments) * 100)
      : 0
    : 0;

  const scoreBreakdown = [
    { name: "Payment History", weight: 40, maxPts: 220, description: "On-time payment track record" },
    { name: "Circle Completion", weight: 25, maxPts: 137, description: "Successfully completed circles" },
    { name: "Volume", weight: 15, maxPts: 83, description: "Total contribution volume (log scale)" },
    { name: "Tenure", weight: 10, maxPts: 55, description: "Time active on the platform" },
    { name: "Peer Attestation", weight: 10, maxPts: 55, description: "Vouches from circle members (coming soon)" },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#EDEDED]">
        Credit Score
      </h1>

      {error && (
        <div className="bg-[#E04040]/10 border border-[#E04040]/20 rounded-2xl p-4 text-[#E04040] text-sm">
          {error}
        </div>
      )}

      {/* Score Display Card */}
      <div className="bg-[#0F1319] border border-white/[0.06] rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.15)] p-8">
        {creditScore ? (
          <>
            <CreditGauge score={creditScore.score} tier={creditScore.tier} />

            {creditScore.message && (
              <p className="text-center text-[#787E88] mt-6 text-sm">
                {creditScore.message}
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-[#787E88]">
            Unable to load credit score
          </div>
        )}
      </div>

      {/* Score Stats Row */}
      {creditScore?.stats && (
        <div className="bg-[#0F1319] border border-white/[0.06] rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.15)] p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
            {[
              { label: "Total Payments", value: creditScore.stats.totalPayments.toString() },
              { label: "On-Time Rate", value: `${onTimeRate}%` },
              { label: "Circles Completed", value: creditScore.stats.circlesCompleted.toString() },
              { label: "Member Since", value: creditScore.lastSyncedAt ? new Date(creditScore.lastSyncedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "--" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`flex flex-col items-center py-3 ${
                  i < 3 ? "md:border-r md:border-white/[0.06]" : ""
                } ${i < 2 ? "border-b md:border-b-0 border-white/[0.06]" : ""}`}
              >
                <span className="font-mono text-2xl font-bold text-[#EDEDED]">
                  {stat.value}
                </span>
                <span className="text-[#545963] text-xs mt-1">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score Breakdown */}
      <div className="bg-[#0F1319] border border-white/[0.06] rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.15)] p-6 md:p-8">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#EDEDED] mb-1">
          Score Breakdown
        </h2>
        <p className="text-[#545963] text-sm mb-6">
          Your score is calculated from 5 weighted components
        </p>

        <div className="space-y-5">
          {scoreBreakdown.map((component) => {
            const earnedPts = creditScore?.stats
              ? Math.round(
                  component.name === "Payment History"
                    ? (creditScore.stats.onTimePayments / Math.max(creditScore.stats.totalPayments, 1)) * component.maxPts
                    : component.name === "Circle Completion"
                    ? Math.min(creditScore.stats.circlesCompleted * 45, component.maxPts)
                    : 0
                )
              : 0;
            const progress = (earnedPts / component.maxPts) * 100;

            return (
              <div key={component.name}>
                <div className="flex items-baseline justify-between mb-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-[#EDEDED]">{component.name}</span>
                    <span className="text-xs text-[#545963]">{component.weight}%</span>
                  </div>
                  <span className="text-sm font-mono text-[#787E88]">
                    {earnedPts}/{component.maxPts}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#161B24] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#D4A843] transition-all duration-700"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-[#545963] mt-1">{component.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tier Benefits */}
      <div className="bg-[#0F1319] border border-white/[0.06] rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.15)] p-6 md:p-8">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#EDEDED] mb-6">
          Credit Tiers
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {[
            { tier: "Building", range: "300 - 499", color: "#E04040", benefits: "Basic circle access, full collateral required" },
            { tier: "Fair", range: "500 - 599", color: "#E08A40", benefits: "Reduced collateral requirements, larger circles" },
            { tier: "Good", range: "600 - 699", color: "#D4A843", benefits: "Lending access, priority payout scheduling" },
            { tier: "Excellent", range: "700 - 850", color: "#2DD4A0", benefits: "Premium benefits, lowest collateral, governance" },
          ].map((t) => {
            const isCurrentTier = creditScore?.tier === t.tier.toLowerCase();
            return (
              <div
                key={t.tier}
                className={`rounded-xl border p-4 transition-colors ${
                  isCurrentTier
                    ? "border-[#D4A843]/40 bg-[#D4A843]/5"
                    : "border-white/[0.06] bg-[#161B24]/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                  <span className="text-sm font-semibold text-[#EDEDED]">{t.tier}</span>
                  {isCurrentTier && (
                    <span className="text-[10px] uppercase tracking-wider text-[#D4A843] font-semibold ml-auto">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono text-[#787E88] mb-2">{t.range}</p>
                <p className="text-xs text-[#545963] leading-relaxed">{t.benefits}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#0F1319] border border-white/[0.06] rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.15)] p-6 md:p-8">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#EDEDED] mb-6">
          Recent Activity
        </h2>

        {events.length > 0 ? (
          <div className="space-y-0">
            {events.map((event, index) => (
              <div
                key={event.id}
                className="flex items-center gap-4 py-4 border-b border-white/[0.06] last:border-0 first:pt-0 last:pb-0"
              >
                {/* Icon */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    event.points_change >= 0
                      ? "bg-[#2DD4A0]/10 text-[#2DD4A0]"
                      : "bg-[#E04040]/10 text-[#E04040]"
                  }`}
                >
                  {getEventIcon(event.event_type)}
                </div>

                {/* Description */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#EDEDED] truncate">
                    {event.description}
                  </p>
                  <p className="text-xs text-[#545963] mt-0.5">
                    {event.circle?.name && (
                      <span className="text-[#787E88] mr-2">{event.circle.name}</span>
                    )}
                    {formatRelativeTime(event.created_at)}
                  </p>
                </div>

                {/* Points change */}
                <div className="text-right shrink-0">
                  <span
                    className={`text-sm font-mono font-semibold ${
                      event.points_change >= 0 ? "text-[#2DD4A0]" : "text-[#E04040]"
                    }`}
                  >
                    {event.points_change >= 0 ? "+" : ""}
                    {event.points_change}
                  </span>
                  <p className="text-[#545963] text-xs font-mono mt-0.5">
                    {event.score_after}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-full bg-[#161B24] flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[#545963]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[#787E88] text-sm">No activity yet</p>
            <p className="text-[#545963] text-xs mt-1">
              Your credit history will appear here as you make payments
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
