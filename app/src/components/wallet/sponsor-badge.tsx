"use client";

import { useSponsorStatus } from "@/hooks/useSponsorStatus";

/**
 * Small badge shown near wallet/transaction areas to indicate
 * whether the current transaction will be fee-sponsored.
 */
export function SponsorBadge() {
  const { status, loading } = useSponsorStatus();

  if (loading || !status?.enabled) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <span className="text-xs text-emerald-400 font-medium">
        Gas-free ({status.remainingToday}/{status.dailyLimit} left today)
      </span>
    </div>
  );
}

/**
 * Inline text showing sponsorship status.
 */
export function SponsorStatusText() {
  const { status, loading } = useSponsorStatus();

  if (loading) return <span className="text-xs text-neutral-500">Checking fees...</span>;

  if (!status?.enabled) {
    return <span className="text-xs text-neutral-500">Standard network fees apply</span>;
  }

  if (status.remainingToday === 0) {
    return (
      <span className="text-xs text-amber-400">
        Daily free transactions used — standard fees apply
      </span>
    );
  }

  return (
    <span className="text-xs text-emerald-400">
      Transaction fees sponsored — {status.remainingToday} free transactions remaining today
    </span>
  );
}
