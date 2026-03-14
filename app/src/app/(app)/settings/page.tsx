"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
  walletAddress: string | null;
  walletBoundAt: string | null;
  uniqueId: string | null;
  kycStatus: "pending" | "processing" | "verified" | "rejected";
  createdAt: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const getKycStatusConfig = (status: string) => {
    switch (status) {
      case "verified":
        return { label: "Verified", dotColor: "bg-[#2DD4A0]", bgColor: "bg-[#2DD4A0]/10", textColor: "text-[#2DD4A0]" };
      case "processing":
        return { label: "Processing", dotColor: "bg-[#D4A843]", bgColor: "bg-[#D4A843]/10", textColor: "text-[#D4A843]" };
      case "rejected":
        return { label: "Rejected", dotColor: "bg-[#E04040]", bgColor: "bg-[#E04040]/10", textColor: "text-[#E04040]" };
      default:
        return { label: "Not Started", dotColor: "bg-[#545963]", bgColor: "bg-white/5", textColor: "text-[#787E88]" };
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  const kycConfig = getKycStatusConfig(profile?.kycStatus || "pending");

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#EDEDED]">
        Settings
      </h1>

      {/* Profile Section */}
      <div className="bg-[#0F1319] border border-white/[0.06] rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.15)] p-6 md:p-8">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-[#D4A843]/20 flex items-center justify-center overflow-hidden shrink-0">
            {profile?.profileImage ? (
              <img
                src={profile.profileImage}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-[#D4A843] font-[family-name:var(--font-display)]">
                {profile?.name?.[0]?.toUpperCase() || "U"}
              </span>
            )}
          </div>

          {/* Name & Email */}
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-[#EDEDED] truncate">
              {profile?.name || "User"}
            </h2>
            <p className="text-sm text-[#787E88] truncate">{profile?.email}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <svg className="w-3.5 h-3.5 text-[#545963]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="text-xs text-[#545963]">Connected with Google</span>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Section */}
      <div className="bg-[#0F1319] border border-white/[0.06] rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.15)] p-6 md:p-8">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-[#EDEDED]">
            Wallet
          </h3>
          {profile?.walletAddress && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#2DD4A0]" />
              <span className="text-xs text-[#2DD4A0]">Bound</span>
            </div>
          )}
        </div>

        {profile?.walletAddress ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono text-[#EDEDED] bg-[#161B24] px-4 py-3 rounded-xl border border-white/[0.06] truncate">
                {truncateAddress(profile.walletAddress)}
              </code>
              <button
                onClick={() => copyToClipboard(profile.walletAddress!)}
                className="shrink-0 w-10 h-10 rounded-xl bg-[#161B24] border border-white/[0.06] flex items-center justify-center text-[#787E88] hover:text-[#EDEDED] transition-colors"
              >
                {copied ? (
                  <svg className="w-4 h-4 text-[#2DD4A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-[#545963]">Bound on</span>
              <span className="text-[#787E88]">
                {profile.walletBoundAt
                  ? new Date(profile.walletBoundAt).toLocaleDateString()
                  : "--"}
              </span>
            </div>

            {profile.uniqueId && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#545963]">Unique ID</span>
                <code className="text-[#787E88] font-mono text-xs">
                  {profile.uniqueId.slice(0, 8)}...
                </code>
              </div>
            )}

            <p className="text-[#545963] text-xs leading-relaxed pt-2 border-t border-white/[0.06]">
              Wallet binding is permanent and cannot be changed. This ensures one identity per wallet for credit scoring.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#E08A40]/5 border border-[#E08A40]/10">
              <svg className="w-5 h-5 text-[#E08A40] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm text-[#E08A40]">
                No wallet connected. Connect your Freighter wallet to participate in lending circles.
              </p>
            </div>
            <Button
              onClick={() => router.push("/onboarding/wallet")}
              className="w-full bg-[#D4A843] hover:bg-[#D4A843]/90 text-[#080B12] font-semibold rounded-xl h-11"
            >
              Connect Wallet
            </Button>
          </div>
        )}
      </div>

      {/* KYC Section */}
      <div className="bg-[#0F1319] border border-white/[0.06] rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.15)] p-6 md:p-8">
        <div className="flex items-center justify-between">
          <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-[#EDEDED]">
            KYC Verification
          </h3>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${kycConfig.bgColor}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${kycConfig.dotColor}`} />
            <span className={`text-xs font-medium ${kycConfig.textColor}`}>
              {kycConfig.label}
            </span>
          </div>
        </div>

        {profile?.kycStatus !== "verified" && profile?.kycStatus !== "processing" && (
          <div className="mt-5">
            <p className="text-sm text-[#545963] mb-4">
              Complete identity verification to unlock full platform features and higher circle limits.
            </p>
            <Button
              onClick={() => router.push("/onboarding/kyc")}
              variant="outline"
              className="border-white/[0.06] text-[#EDEDED] hover:bg-white/5 rounded-xl"
            >
              Start Verification
            </Button>
          </div>
        )}

        {profile?.kycStatus === "processing" && (
          <p className="text-sm text-[#787E88] mt-4">
            Your identity verification is being processed. This usually takes a few minutes.
          </p>
        )}

        {profile?.kycStatus === "verified" && (
          <p className="text-sm text-[#545963] mt-4">
            Your identity has been verified. You have full access to all platform features.
          </p>
        )}
      </div>

      {/* Account Section */}
      <div className="bg-[#0F1319] border border-white/[0.06] rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.15)] p-6 md:p-8">
        <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-[#EDEDED] mb-5">
          Account
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#545963]">Member since</span>
            <span className="text-[#787E88]">
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "--"}
            </span>
          </div>

          <div className="pt-4 border-t border-white/[0.06]">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm text-[#787E88] hover:text-[#E04040] transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
