"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { signTransaction } from "@stellar/freighter-api";

interface CirclePreview {
  id: string;
  name: string;
  description: string | null;
  contribution_amount: number;
  contribution_frequency: string;
  total_members: number;
  current_members: number;
  status: string;
  invite_code: string;
  creator?: {
    id: string;
    name: string;
  };
}

interface LookupResult {
  circle: CirclePreview;
  isAlreadyMember: boolean;
  canJoin: boolean;
  spotsRemaining: number;
}

export default function JoinCirclePage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    async function lookupCircle() {
      try {
        const res = await fetch(`/api/circles/by-invite/${code}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Invalid invite code");
          return;
        }
        const data = await res.json();
        setLookupResult(data);
      } catch {
        setError("Failed to look up circle");
      } finally {
        setLoading(false);
      }
    }

    if (code) {
      lookupCircle();
    }
  }, [code]);

  const handleJoin = async () => {
    if (!lookupResult?.circle) return;
    setJoining(true);
    setError(null);

    try {
      // Step 1: Call join API to create membership and get on-chain transaction
      const res = await fetch(`/api/circles/${lookupResult.circle.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code }),
      });

      const data = await res.json();

      // Handle identity binding requirement (status 428)
      if (res.status === 428 && data.requiresIdentityBinding && data.identityTransactionXdr) {
        try {
          const identitySignResult = await signTransaction(data.identityTransactionXdr, {
            networkPassphrase: "Test SDF Network ; September 2015",
          });

          if (identitySignResult.signedTxXdr) {
            const identitySubmitRes = await fetch("/api/stellar/submit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ signedXdr: identitySignResult.signedTxXdr }),
            });

            if (!identitySubmitRes.ok) {
              setError("Failed to bind identity on-chain. Please try again.");
              return;
            }

            // Retry join after identity binding
            const retryRes = await fetch(`/api/circles/${lookupResult.circle.id}/join`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ inviteCode: code }),
            });

            const retryData = await retryRes.json();
            if (!retryRes.ok) {
              setError(retryData.error || "Failed to join circle after identity binding");
              return;
            }

            // Use retry data for the rest of the flow
            Object.assign(data, retryData);
          } else {
            setError("Identity binding cancelled. This is required to join a circle.");
            return;
          }
        } catch (identityError) {
          setError("Failed to bind identity. Please try again.");
          return;
        }
      } else if (!res.ok) {
        setError(data.error || "Failed to join circle");
        return;
      }

      // Step 2: If we got an on-chain transaction, sign and submit it
      if (data.transactionXdr) {
        try {
          const signResult = await signTransaction(data.transactionXdr, {
            networkPassphrase: "Test SDF Network ; September 2015",
          });

          if (signResult.signedTxXdr) {
            const submitRes = await fetch("/api/stellar/submit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ signedXdr: signResult.signedTxXdr }),
            });

            if (!submitRes.ok) {
              console.error("On-chain join submission failed, but DB join succeeded");
            }
          }
        } catch (signError) {
          console.error("On-chain join signing failed:", signError);
          // DB join already succeeded, proceed
        }
      }

      setJoined(true);

      // Redirect to circle page after a short delay
      setTimeout(() => {
        router.push(`/circles/${lookupResult.circle.id}`);
      }, 2000);
    } catch {
      setError("Failed to join circle");
    } finally {
      setJoining(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 animate-pulse mx-auto" />
          <div className="h-6 w-48 bg-white/5 animate-pulse mx-auto rounded" />
          <div className="h-4 w-64 bg-white/5 animate-pulse mx-auto rounded" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="h-4 w-full bg-white/5 animate-pulse rounded" />
          <div className="h-4 w-3/4 bg-white/5 animate-pulse rounded" />
          <div className="h-4 w-1/2 bg-white/5 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !lookupResult) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Invalid Invite Code</h1>
          <p className="text-neutral-400 mt-2">{error}</p>
        </div>
        <Link
          href="/circles"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-medium text-sm hover:bg-neutral-200 transition-colors"
        >
          Browse Circles
        </Link>
      </div>
    );
  }

  // Success state
  if (joined) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Successfully Joined!</h1>
          <p className="text-neutral-400 mt-2">
            You&apos;ve joined <span className="text-white">{lookupResult?.circle.name}</span>. Redirecting...
          </p>
        </div>
      </div>
    );
  }

  const circle = lookupResult?.circle;
  if (!circle) return null;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white">Join Circle</h1>
        <p className="text-neutral-400 text-sm">
          You&apos;ve been invited to join a lending circle
        </p>
      </div>

      {/* Circle Preview */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">{circle.name}</h2>
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
              circle.status === "forming"
                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                : circle.status === "active"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-neutral-500/10 text-neutral-400 border border-neutral-500/20"
            }`}>
              {circle.status.charAt(0).toUpperCase() + circle.status.slice(1)}
            </span>
          </div>

          {circle.description && (
            <p className="text-sm text-neutral-400">{circle.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-xs text-neutral-500">Contribution</p>
              <p className="text-lg font-semibold text-white">
                ${circle.contribution_amount}
              </p>
              <p className="text-xs text-neutral-500">{circle.contribution_frequency}</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-xs text-neutral-500">Members</p>
              <p className="text-lg font-semibold text-white">
                {circle.current_members}/{circle.total_members}
              </p>
              <p className="text-xs text-neutral-500">
                {lookupResult?.spotsRemaining} spots left
              </p>
            </div>
          </div>

          {circle.creator && (
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <span>Created by</span>
              <span className="text-white font-medium">{circle.creator.name}</span>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="border-t border-white/10 p-4">
          {error && (
            <p className="text-red-400 text-sm mb-3">{error}</p>
          )}

          {lookupResult?.isAlreadyMember ? (
            <div className="space-y-3">
              <p className="text-sm text-neutral-400 text-center">
                You&apos;re already a member of this circle
              </p>
              <Link
                href={`/circles/${circle.id}`}
                className="block w-full text-center px-6 py-3 rounded-xl bg-white text-black font-medium text-sm hover:bg-neutral-200 transition-colors"
              >
                View Circle
              </Link>
            </div>
          ) : lookupResult?.canJoin ? (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full px-6 py-3 rounded-xl bg-white text-black font-medium text-sm hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joining ? "Joining..." : "Join Circle"}
            </button>
          ) : (
            <div className="text-center">
              <p className="text-sm text-neutral-400">
                {circle.status !== "forming"
                  ? "This circle is no longer accepting members"
                  : "This circle is full"}
              </p>
              <Link
                href="/circles"
                className="inline-flex items-center gap-2 mt-3 text-sm text-white hover:underline"
              >
                Browse other circles
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Invite Code Reference */}
      <div className="text-center">
        <p className="text-xs text-neutral-500">
          Invite Code: <span className="font-mono text-neutral-400">{code?.toString().toUpperCase()}</span>
        </p>
      </div>
    </div>
  );
}
