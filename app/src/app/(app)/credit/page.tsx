"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        return "var(--score-excellent)";
      case "good":
        return "var(--score-good)";
      case "fair":
        return "var(--score-fair)";
      default:
        return "var(--score-building)";
    }
  };

  const getTierLabel = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "payment":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "circle_completed":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "late_payment":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  // Credit Score Gauge Component
  const CreditGauge = ({
    score,
    tier,
  }: {
    score: number;
    tier: string;
  }) => {
    const percentage = ((score - 300) / (850 - 300)) * 100;
    const circumference = 2 * Math.PI * 90;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const color = getTierColor(tier);

    return (
      <div className="relative w-56 h-56 mx-auto">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold text-white font-mono">
            {score}
          </span>
          <span className="text-sm text-neutral-400 mt-1">
            {getTierLabel(tier)}
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Credit Score</h1>
        <p className="text-neutral-400 mt-1">
          Track your on-chain credit score and payment history
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Score Card */}
        <Card variant="glass" className="p-6">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-lg text-white">Your Score</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {creditScore ? (
              <>
                <CreditGauge
                  score={creditScore.score}
                  tier={creditScore.tier}
                />

                {creditScore.message && (
                  <p className="text-center text-neutral-400 mt-4 text-sm">
                    {creditScore.message}
                  </p>
                )}

                {/* Score Range */}
                <div className="flex justify-between text-xs text-neutral-500 mt-6 px-4">
                  <span>300</span>
                  <span>500</span>
                  <span>650</span>
                  <span>750</span>
                  <span>850</span>
                </div>
                <div className="h-2 rounded-full mt-2 mx-4 overflow-hidden flex">
                  <div className="flex-1 bg-[var(--score-building)]" />
                  <div className="flex-1 bg-[var(--score-fair)]" />
                  <div className="flex-1 bg-[var(--score-good)]" />
                  <div className="flex-1 bg-[var(--score-excellent)]" />
                </div>
                <div className="flex justify-between text-xs text-neutral-500 mt-1 px-4">
                  <span>Building</span>
                  <span>Fair</span>
                  <span>Good</span>
                  <span>Excellent</span>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-neutral-400">
                Unable to load credit score
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card variant="glass" className="p-6">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-lg text-white">
              Payment Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {creditScore?.stats ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-neutral-400">Total Payments</span>
                  <span className="text-white font-medium font-mono">
                    {creditScore.stats.totalPayments}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-neutral-400">On-Time Payments</span>
                  <span className="text-green-400 font-medium font-mono">
                    {creditScore.stats.onTimePayments}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-neutral-400">Late Payments</span>
                  <span className="text-yellow-400 font-medium font-mono">
                    {creditScore.stats.latePayments}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-neutral-400">Missed Payments</span>
                  <span className="text-red-400 font-medium font-mono">
                    {creditScore.stats.missedPayments}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-neutral-400">Circles Completed</span>
                  <span className="text-white font-medium font-mono">
                    {creditScore.stats.circlesCompleted}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-400">
                <p>No payment history yet</p>
                <p className="text-sm mt-2">
                  Join a circle to start building your credit history
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card variant="glass" className="p-6">
        <CardHeader className="p-0 mb-6">
          <CardTitle className="text-lg text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      event.points_change >= 0
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {getEventIcon(event.event_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">
                      {event.description}
                    </p>
                    <p className="text-neutral-500 text-xs">
                      {event.circle?.name && (
                        <span className="mr-2">{event.circle.name}</span>
                      )}
                      {new Date(event.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={event.points_change >= 0 ? "success" : "error"}
                    >
                      {event.points_change >= 0 ? "+" : ""}
                      {event.points_change}
                    </Badge>
                    <p className="text-neutral-500 text-xs mt-1 font-mono">
                      {event.score_after}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-400">
              <p>No activity yet</p>
              <p className="text-sm mt-2">
                Your credit history will appear here as you make payments
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
