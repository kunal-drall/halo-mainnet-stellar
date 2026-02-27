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
        className="inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-white transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Circles
      </Link>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white">Join a Circle</h1>
        <p className="text-neutral-400 text-sm">
          Enter the invite code shared by your circle organizer
        </p>
      </div>

      {/* Invite Code Form */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="inviteCode" className="block text-sm font-medium text-neutral-300 mb-2">
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
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 font-mono text-lg tracking-wider text-center focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-colors"
              autoFocus
              autoComplete="off"
            />
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!inviteCode.trim()}
            className="w-full px-6 py-3 rounded-xl bg-white text-black font-medium text-sm hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Look Up Circle
          </button>
        </form>
      </div>

      {/* Help text */}
      <p className="text-center text-xs text-neutral-500">
        Don&apos;t have an invite code?{" "}
        <Link href="/circles/create" className="text-white hover:underline">
          Create your own circle
        </Link>
      </p>
    </div>
  );
}
