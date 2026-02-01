"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Circle {
  id: string;
  name: string;
  contribution_amount: number;
  member_count: number;
  status: "forming" | "active" | "completed";
  current_period: number | null;
  start_date: string | null;
  invite_code: string;
  created_at: string;
}

interface Membership {
  payout_position: number;
  has_received_payout: boolean;
  joined_at: string;
  circles: Circle;
}

export default function CirclesPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCircles();
  }, []);

  const fetchCircles = async () => {
    try {
      const response = await fetch("/api/circles");
      if (!response.ok) {
        throw new Error("Failed to fetch circles");
      }
      const data = await response.json();
      setMemberships(data.circles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    // Amount is stored in USDC with 7 decimals
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 10_000_000);
  };

  const getStatusVariant = (status: Circle["status"]) => {
    switch (status) {
      case "forming":
        return "forming";
      case "active":
        return "active";
      case "completed":
        return "completed";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Circles</h1>
          <p className="text-neutral-400 mt-1">
            Manage your lending circles and track contributions
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/circles/join">
            <Button variant="outline">Join Circle</Button>
          </Link>
          <Link href="/circles/create">
            <Button>Create Circle</Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Circles Grid */}
      {memberships.length === 0 ? (
        <Card variant="glass" className="p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            No circles yet
          </h3>
          <p className="text-neutral-400 mb-6 max-w-md mx-auto">
            Join an existing circle with an invite code or create your own to
            start building credit with your community.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/circles/join">
              <Button variant="outline">Enter Invite Code</Button>
            </Link>
            <Link href="/circles/create">
              <Button>Create a Circle</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {memberships.map((membership) => {
            const circle = membership.circles;
            return (
              <Link key={circle.id} href={`/circles/${circle.id}`}>
                <Card
                  variant="glass"
                  className="p-5 h-full hover:border-white/20 transition-colors cursor-pointer"
                >
                  <CardHeader className="p-0 mb-4">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg text-white">
                        {circle.name}
                      </CardTitle>
                      <Badge variant={getStatusVariant(circle.status)}>
                        {circle.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-neutral-500">Contribution</div>
                        <div className="text-white font-medium">
                          {formatCurrency(circle.contribution_amount)}
                        </div>
                      </div>
                      <div>
                        <div className="text-neutral-500">Members</div>
                        <div className="text-white font-medium">
                          {circle.member_count}
                        </div>
                      </div>
                    </div>

                    {circle.status === "active" && circle.current_period && (
                      <div className="pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-neutral-500">
                            Current Period
                          </span>
                          <span className="text-white">
                            {circle.current_period} / {circle.member_count}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t border-white/10">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-500">Your Position</span>
                        <span className="text-white font-medium">
                          #{membership.payout_position}
                          {membership.has_received_payout && (
                            <span className="ml-2 text-green-400">
                              (Paid)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
