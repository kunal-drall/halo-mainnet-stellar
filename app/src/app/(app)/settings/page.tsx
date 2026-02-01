"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  const getKycBadgeVariant = (status: string) => {
    switch (status) {
      case "verified":
        return "success";
      case "processing":
        return "active";
      case "rejected":
        return "destructive";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-neutral-400 mt-1">Manage your account and wallet</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card variant="glass" className="p-6">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-lg text-white">Profile</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                {profile?.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {profile?.name?.[0]?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">
                  {profile?.name || "User"}
                </h3>
                <p className="text-neutral-400 text-sm">{profile?.email}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 text-sm">Member Since</span>
                <span className="text-white text-sm">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString()
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 text-sm">KYC Status</span>
                <Badge variant={getKycBadgeVariant(profile?.kycStatus || "pending")}>
                  {profile?.kycStatus || "pending"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Card */}
        <Card variant="glass" className="p-6">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-lg text-white">Wallet</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-6">
            {profile?.walletAddress ? (
              <>
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <svg
                      className="w-5 h-5 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    <span className="text-green-400 font-medium">
                      Wallet Connected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono text-white bg-white/5 px-3 py-2 rounded">
                      {truncateAddress(profile.walletAddress)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(profile.walletAddress!)}
                      className="shrink-0"
                    >
                      {copied ? (
                        <svg
                          className="w-4 h-4 text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
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
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Bound At</span>
                    <span className="text-white">
                      {profile.walletBoundAt
                        ? new Date(profile.walletBoundAt).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Unique ID</span>
                    <code className="text-white font-mono text-xs">
                      {profile.uniqueId
                        ? `${profile.uniqueId.slice(0, 8)}...`
                        : "-"}
                    </code>
                  </div>
                </div>

                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-yellow-400 text-xs">
                    Wallet binding is permanent and cannot be changed. This
                    ensures one identity per wallet for credit scoring.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-center">
                  <svg
                    className="w-12 h-12 text-neutral-500 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  <p className="text-neutral-400 text-sm mb-4">
                    No wallet connected yet. Connect your Freighter wallet to
                    participate in lending circles.
                  </p>
                  <Button
                    onClick={() => router.push("/onboarding/wallet")}
                    className="w-full"
                  >
                    Connect Wallet
                  </Button>
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-blue-400 text-xs">
                    You need to connect a wallet to create or join lending
                    circles and start building your credit score.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card variant="glass" className="p-6 border-red-500/20">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-lg text-red-400">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <p className="text-neutral-400 text-sm mb-4">
            These actions are irreversible. Please proceed with caution.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" disabled>
              Export Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-400 border-red-500/30 hover:bg-red-500/10"
              disabled
            >
              Delete Account
            </Button>
          </div>
          <p className="text-neutral-500 text-xs mt-3">
            Account deletion is not available during beta.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
