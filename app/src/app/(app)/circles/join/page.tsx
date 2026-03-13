"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function JoinCircleIndexPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = inviteCode.trim().toUpperCase();
    if (!code) {
      setError("Please enter an invite code");
      return;
    }
    router.push(`/circles/join/${code}`);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link
        href="/circles"
        className="inline-flex items-center gap-1 text-sm text-[#787E88] hover:text-[#EDEDED] transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Circles
      </Link>

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-[family-name:var(--font-display)] text-[#EDEDED]">
          Join a Circle
        </h1>
        <p className="text-[#787E88] text-sm">
          Enter the invite code shared by your circle organizer
        </p>
      </div>

      {/* Invite Code Form */}
      <div className="card-base p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="inviteCode" className="block text-sm text-[#787E88] mb-2">
              Invite Code
            </label>
            <input
              id="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="e.g. JOIN2026"
              className="input font-mono text-lg tracking-wider text-center !py-3.5"
              autoFocus
              autoComplete="off"
            />
            {error && (
              <p className="mt-2 text-xs text-red-400">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!inviteCode.trim()}
            className="btn btn-accent w-full"
          >
            Look Up Circle
          </button>
        </form>
      </div>

      {/* Help text */}
      <p className="text-center text-xs text-[#545963]">
        Don&apos;t have an invite code?{" "}
        <Link href="/circles" className="text-[#D4A843] hover:underline">
          Browse open circles
        </Link>
      </p>
    </div>
  );
}
