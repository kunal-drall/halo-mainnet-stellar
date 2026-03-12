"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { signTransaction, getAddress } from "@stellar/freighter-api";

interface Member {
  id: string;
  user_id: string;
  payout_position: number;
  has_received_payout: boolean;
  status: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Contribution {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
}

interface Payout {
  id: string;
  recipient_id: string;
  period: number;
  amount: number;
  status: string;
  created_at: string;
  recipient: {
    id: string;
    name: string;
    email: string;
  };
}

interface Circle {
  id: string;
  name: string;
  description: string | null;
  contribution_amount: number;
  total_members: number;
  current_members: number;
  status: "forming" | "active" | "completed";
  current_period: number | null;
  current_period_end: string | null;
  grace_period_hours: number;
  invite_code: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

interface CircleData {
  circle: Circle;
  memberships: Member[];
  contributions: Contribution[];
  payouts: Payout[];
  isMember: boolean;
}

export default function CircleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<CircleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contributing, setContributing] = useState(false);

  const circleId = params.id as string;

  useEffect(() => {
    fetchCircleData();
  }, [circleId]);

  const fetchCircleData = async () => {
    try {
      const response = await fetch(`/api/circles/${circleId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Circle not found");
        }
        throw new Error("Failed to fetch circle");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 10_000_000);
  };

  const handleContribute = async () => {
    setContributing(true);
    setError(null);
    try {
      // Step 1: Get the user's wallet address from Freighter
      let walletAddress: string;
      try {
        const addressResult = await getAddress();
        walletAddress = addressResult.address;
      } catch {
        throw new Error("Please connect your Freighter wallet to contribute");
      }

      // Step 2: Build the on-chain contribute transaction via the contract wrapper
      let transactionHash = "";
      try {
        const buildResponse = await fetch(`/api/circles/${circleId}/contribute/build`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress }),
        });

        if (buildResponse.ok) {
          const { transactionXdr } = await buildResponse.json();
          if (transactionXdr) {
            // Sign with Freighter
            const signResult = await signTransaction(transactionXdr, {
              networkPassphrase: "Test SDF Network ; September 2015",
            });

            if (signResult.signedTxXdr) {
              // Submit to Stellar
              const submitResponse = await fetch("/api/stellar/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ signedXdr: signResult.signedTxXdr }),
              });

              if (submitResponse.ok) {
                const submitData = await submitResponse.json();
                transactionHash = submitData.hash || "";
              }
            }
          }
        }
      } catch (signError) {
        // Transaction signing skipped or failed - still record in DB for testnet
        console.log("On-chain contribution skipped:", signError);
      }

      // Step 3: Record the contribution in the database
      const response = await fetch(`/api/circles/${circleId}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionHash: transactionHash || `testnet_${Date.now()}`,
          amount: data?.circle.contribution_amount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Contribution failed");
      }

      // Refresh data
      await fetchCircleData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Contribution failed");
    } finally {
      setContributing(false);
    }
  };

  const hasContributedThisPeriod = (userId: string) => {
    return data?.contributions.some(
      (c) => c.user_id === userId && c.status !== "pending"
    );
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-6 w-16 bg-white/[0.06] rounded animate-pulse" />
        <div className="h-8 w-48 bg-white/[0.06] rounded-lg animate-pulse" />
        <div className="flex gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 flex-1 bg-white/[0.06] rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-[#0F1319] border border-white/[0.06] rounded-2xl animate-pulse" />
        <div className="h-48 bg-[#0F1319] border border-white/[0.06] rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => router.push("/circles")}
          className="flex items-center gap-1 text-sm text-[#787E88] hover:text-[#EDEDED] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Circles
        </button>
        <div className="bg-[#0F1319] border border-white/[0.06] rounded-2xl p-10 text-center">
          <p className="text-[#E04040] mb-4">{error}</p>
          <button
            onClick={() => router.push("/circles")}
            className="px-5 py-2.5 bg-[#D4A843] text-[#080B12] text-sm font-semibold rounded-lg hover:bg-[#D4A843]/90 transition-colors"
          >
            Return to Circles
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { circle, memberships, contributions, payouts, isMember } = data;

  const contributedCount = memberships.filter((m) => hasContributedThisPeriod(m.user_id)).length;

  const daysRemaining = circle.current_period_end
    ? Math.max(0, Math.ceil((new Date(circle.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/circles")}
        className="animate-in flex items-center gap-1 text-sm text-[#787E88] hover:text-[#EDEDED] transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Circles
      </button>

      {/* Header */}
      <div className="animate-in delay-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1
            className="text-2xl font-bold text-[#EDEDED]"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            {circle.name}
          </h1>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${statusBadge(circle.status)}`}>
            {circle.status}
          </span>
        </div>
        {circle.description && (
          <p className="text-[#787E88] text-sm">{circle.description}</p>
        )}
      </div>

      {/* Circle Info Bar */}
      <div className="animate-in delay-2 flex flex-wrap gap-0 bg-[#0F1319] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="flex-1 min-w-[120px] p-4 sm:p-5">
          <p className="text-[10px] uppercase tracking-widest text-[#545963] mb-1">Contribution</p>
          <p className="text-lg font-semibold text-[#EDEDED]" style={{ fontFamily: "var(--font-mono), monospace" }}>
            {formatCurrency(circle.contribution_amount)}
          </p>
        </div>
        <div className="w-px bg-white/[0.06] self-stretch hidden sm:block" />
        <div className="flex-1 min-w-[120px] p-4 sm:p-5">
          <p className="text-[10px] uppercase tracking-widest text-[#545963] mb-1">Members</p>
          <p className="text-lg font-semibold text-[#EDEDED]" style={{ fontFamily: "var(--font-mono), monospace" }}>
            {circle.current_members}/{circle.total_members}
          </p>
        </div>
        {circle.status === "active" && (
          <>
            <div className="w-px bg-white/[0.06] self-stretch hidden sm:block" />
            <div className="flex-1 min-w-[120px] p-4 sm:p-5">
              <p className="text-[10px] uppercase tracking-widest text-[#545963] mb-1">Current Round</p>
              <p className="text-lg font-semibold text-[#EDEDED]" style={{ fontFamily: "var(--font-mono), monospace" }}>
                {circle.current_period}/{circle.total_members}
              </p>
            </div>
            <div className="w-px bg-white/[0.06] self-stretch hidden sm:block" />
            <div className="flex-1 min-w-[120px] p-4 sm:p-5">
              <p className="text-[10px] uppercase tracking-widest text-[#545963] mb-1">Period Ends</p>
              <p className="text-lg font-semibold text-[#EDEDED]" style={{ fontFamily: "var(--font-mono), monospace" }}>
                {daysRemaining !== null ? `${daysRemaining}d` : "-"}
              </p>
            </div>
          </>
        )}
        <div className="w-px bg-white/[0.06] self-stretch hidden sm:block" />
        <div className="flex-1 min-w-[120px] p-4 sm:p-5">
          <p className="text-[10px] uppercase tracking-widest text-[#545963] mb-1">Pool Size</p>
          <p className="text-lg font-semibold text-[#EDEDED]" style={{ fontFamily: "var(--font-mono), monospace" }}>
            {formatCurrency(circle.contribution_amount * circle.total_members)}
          </p>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-[#E04040]/10 border border-[#E04040]/20 rounded-xl p-4 text-[#E04040] text-sm">
          {error}
        </div>
      )}

      {/* Forming state notice */}
      {circle.status === "forming" && (
        <div className="animate-in delay-3 bg-[#D4A843]/10 border border-[#D4A843]/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[#D4A843] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-[#D4A843] font-medium text-sm">Waiting for members</p>
              <p className="text-[#D4A843]/70 text-xs mt-0.5">
                This circle needs {circle.total_members - circle.current_members} more member(s) to start.
              </p>
            </div>
          </div>

          {/* Invite code inline */}
          <div className="mt-4 flex items-center gap-3 bg-[#080B12]/50 rounded-lg p-3">
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-widest text-[#545963] mb-1">Invite Code</p>
              <p className="text-lg font-bold text-[#EDEDED] tracking-wider" style={{ fontFamily: "var(--font-mono), monospace" }}>
                {circle.invite_code}
              </p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(circle.invite_code)}
              className="px-3 py-2 border border-white/[0.12] text-[#EDEDED] text-xs font-medium rounded-lg hover:bg-white/[0.04] transition-colors"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Contribution Section */}
      {isMember && circle.status === "active" && (
        <div className="animate-in delay-3 bg-[#0F1319] border border-white/[0.06] rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.15)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[#EDEDED] font-semibold" style={{ fontFamily: "var(--font-display), sans-serif" }}>
                Round {circle.current_period} Contribution
              </p>
              <p className="text-[#787E88] text-sm mt-0.5">
                {contributedCount}/{memberships.length} members contributed
                {daysRemaining !== null && (
                  <span className="text-[#545963]"> &middot; {daysRemaining} days remaining</span>
                )}
              </p>
              {/* Progress bar */}
              <div className="mt-3 h-1.5 w-full max-w-xs bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2DD4A0] rounded-full transition-all"
                  style={{ width: `${memberships.length > 0 ? (contributedCount / memberships.length) * 100 : 0}%` }}
                />
              </div>
            </div>
            <button
              onClick={handleContribute}
              disabled={contributing}
              className="shrink-0 px-6 py-3 bg-[#D4A843] text-[#080B12] font-semibold rounded-xl hover:bg-[#D4A843]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {contributing ? "Processing..." : `Contribute ${formatCurrency(circle.contribution_amount)}`}
            </button>
          </div>
        </div>
      )}

      {/* Members Section */}
      <div className="animate-in delay-4 space-y-3">
        <h2
          className="text-lg font-semibold text-[#EDEDED]"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          Members
        </h2>
        <div className="bg-[#0F1319] border border-white/[0.06] rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.15)]">
          {memberships.map((member, idx) => {
            const contributed = hasContributedThisPeriod(member.user_id);
            const isCurrentRecipient =
              circle.status === "active" &&
              member.payout_position === circle.current_period;

            return (
              <div
                key={member.id}
                className={`flex items-center gap-4 px-5 py-3.5 ${
                  idx < memberships.length - 1 ? "border-b border-white/[0.06]" : ""
                } ${isCurrentRecipient ? "bg-[#D4A843]/[0.04]" : ""}`}
              >
                {/* Position */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                  isCurrentRecipient
                    ? "bg-[#D4A843]/15 text-[#D4A843]"
                    : "bg-white/[0.06] text-[#545963]"
                }`}>
                  {member.payout_position}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-[#EDEDED] text-sm font-medium truncate">
                    {member.user.name}
                    {isCurrentRecipient && (
                      <span className="ml-2 text-[#D4A843] text-xs font-normal">Payout recipient</span>
                    )}
                  </p>
                  <p className="text-[#545963] text-xs truncate">{member.user.email}</p>
                </div>

                {/* Status indicators */}
                <div className="flex items-center gap-2 shrink-0">
                  {member.has_received_payout && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#2DD4A0]/10 text-[#2DD4A0] border border-[#2DD4A0]/20">
                      Paid
                    </span>
                  )}
                  {circle.status === "active" && (
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${contributed ? "bg-[#2DD4A0]" : "bg-[#545963]"}`}
                      title={contributed ? "Contributed this period" : "Pending contribution"}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payout History */}
      {payouts.length > 0 && (
        <div className="animate-in delay-5 space-y-3">
          <h2
            className="text-lg font-semibold text-[#EDEDED]"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            Payout History
          </h2>
          <div className="bg-[#0F1319] border border-white/[0.06] rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.15)]">
            {payouts.map((payout, idx) => (
              <div
                key={payout.id}
                className={`flex items-center justify-between px-5 py-3.5 ${
                  idx < payouts.length - 1 ? "border-b border-white/[0.06]" : ""
                }`}
              >
                <div>
                  <p className="text-[#EDEDED] text-sm font-medium">
                    Round {payout.period}
                  </p>
                  <p className="text-[#545963] text-xs mt-0.5">{payout.recipient.name}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <p className="text-[#EDEDED] font-semibold" style={{ fontFamily: "var(--font-mono), monospace" }}>
                    {formatCurrency(payout.amount)}
                  </p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${
                    payout.status === "completed"
                      ? "bg-[#2DD4A0]/10 text-[#2DD4A0] border-[#2DD4A0]/20"
                      : "bg-white/5 text-[#787E88] border-white/10"
                  }`}>
                    {payout.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Created By */}
      <div className="animate-in delay-6 flex items-center gap-3 text-sm text-[#545963]">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span>Created by {circle.creator.name}</span>
      </div>
    </div>
  );
}
