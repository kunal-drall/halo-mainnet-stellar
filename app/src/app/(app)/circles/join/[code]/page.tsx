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
      const res = await fetch(`/api/circles/${lookupResult.circle.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code }),
      });

      const data = await res.json();

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

            Object.assign(data, retryData);
          } else {
            setError("Identity binding cancelled. This is required to join a circle.");
            return;
          }
        } catch {
          setError("Failed to bind identity. Please try again.");
          return;
        }
      } else if (!res.ok) {
        setError(data.error || "Failed to join circle");
        return;
      }

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
        }
      }

      setJoined(true);

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
          <div className="w-16 h-16 rounded-2xl bg-[#161B24] animate-pulse mx-auto" />
          <div className="h-6 w-48 bg-[#161B24] animate-pulse mx-auto rounded" />
          <div className="h-4 w-64 bg-[#161B24] animate-pulse mx-auto rounded" />
        </div>
        <div className="card-base p-6 space-y-4">
          <div className="h-4 w-full bg-[#161B24] animate-pulse rounded" />
          <div className="h-4 w-3/4 bg-[#161B24] animate-pulse rounded" />
          <div className="h-4 w-1/2 bg-[#161B24] animate-pulse rounded" />
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
          <h1 className="text-xl font-[family-name:var(--font-display)] text-[#EDEDED]">
            Invalid Invite Code
          </h1>
          <p className="text-[#787E88] mt-2">{error}</p>
        </div>
        <Link href="/circles" className="btn btn-accent inline-flex">
          Browse Circles
        </Link>
      </div>
    );
  }

  // Success state
  if (joined) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#2DD4A0]/15 border border-[#2DD4A0]/20 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-[#2DD4A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-[family-name:var(--font-display)] text-[#EDEDED]">
            Successfully Joined!
          </h1>
          <p className="text-[#787E88] mt-2">
            You&apos;ve joined <span className="text-[#EDEDED]">{lookupResult?.circle.name}</span>. Redirecting...
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
        <h1 className="text-xl font-[family-name:var(--font-display)] text-[#EDEDED]">
          Join Circle
        </h1>
        <p className="text-[#787E88] text-sm">
          You&apos;ve been invited to join a lending circle
        </p>
      </div>

      {/* Circle Preview Card */}
      <div className="card-base overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-[family-name:var(--font-display)] text-[#EDEDED]">
              {circle.name}
            </h2>
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
              circle.status === "forming"
                ? "bg-[#D4A843]/15 text-[#D4A843] border border-[#D4A843]/20"
                : circle.status === "active"
                ? "bg-[#2DD4A0]/15 text-[#2DD4A0] border border-[#2DD4A0]/20"
                : "bg-[#545963]/15 text-[#545963] border border-[#545963]/20"
            }`}>
              {circle.status.charAt(0).toUpperCase() + circle.status.slice(1)}
            </span>
          </div>

          {circle.description && (
            <p className="text-sm text-[#787E88]">{circle.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="card-raised p-3">
              <p className="text-xs text-[#545963]">Contribution</p>
              <p className="text-lg font-semibold text-[#EDEDED]">
                ${circle.contribution_amount}
              </p>
              <p className="text-xs text-[#545963]">{circle.contribution_frequency}</p>
            </div>
            <div className="card-raised p-3">
              <p className="text-xs text-[#545963]">Members</p>
              <p className="text-lg font-semibold text-[#EDEDED]">
                {circle.current_members}/{circle.total_members}
              </p>
              <p className="text-xs text-[#545963]">
                {lookupResult?.spotsRemaining} spots left
              </p>
            </div>
          </div>

          {circle.creator && (
            <div className="flex items-center gap-2 text-sm text-[#787E88]">
              <span>Created by</span>
              <span className="text-[#EDEDED] font-medium">{circle.creator.name}</span>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="border-t border-white/[0.06] p-4">
          {error && (
            <p className="text-red-400 text-xs mb-3">{error}</p>
          )}

          {lookupResult?.isAlreadyMember ? (
            <div className="space-y-3">
              <p className="text-sm text-[#787E88] text-center">
                You&apos;re already a member of this circle
              </p>
              <Link
                href={`/circles/${circle.id}`}
                className="btn btn-accent w-full block text-center"
              >
                View Circle
              </Link>
            </div>
          ) : lookupResult?.canJoin ? (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="btn btn-accent w-full"
            >
              {joining ? "Joining..." : "Join Circle"}
            </button>
          ) : (
            <div className="text-center">
              <p className="text-sm text-[#787E88]">
                {circle.status !== "forming"
                  ? "This circle is no longer accepting members"
                  : "This circle is full"}
              </p>
              <Link
                href="/circles"
                className="inline-flex items-center gap-2 mt-3 text-sm text-[#D4A843] hover:underline"
              >
                Browse other circles
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Invite Code Reference */}
      <div className="text-center">
        <p className="text-xs text-[#545963]">
          Invite Code: <span className="font-mono text-[#787E88]">{code?.toString().toUpperCase()}</span>
        </p>
      </div>
    </div>
  );
}
