"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
    try {
      // In production, this would trigger a wallet transaction
      const response = await fetch(`/api/circles/${circleId}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionHash: "demo_transaction_hash",
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

  const hasContributedThisPeriod = (userId: string) => {
    return data?.contributions.some(
      (c) => c.user_id === userId && c.status !== "pending"
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/circles")}>
          Back to Circles
        </Button>
        <Card variant="glass" className="p-8 text-center">
          <div className="text-red-400 mb-4">{error || "Circle not found"}</div>
          <Button onClick={() => router.push("/circles")}>
            Return to Circles
          </Button>
        </Card>
      </div>
    );
  }

  const { circle, memberships, contributions, payouts, isMember } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/circles")}
              className="p-0 h-auto"
            >
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{circle.name}</h1>
            <Badge variant={getStatusVariant(circle.status)}>
              {circle.status}
            </Badge>
          </div>
          {circle.description && (
            <p className="text-neutral-400 mt-1">{circle.description}</p>
          )}
        </div>

        {isMember && circle.status === "active" && (
          <Button
            onClick={handleContribute}
            disabled={contributing}
            className="min-w-[160px]"
          >
            {contributing ? "Processing..." : "Make Contribution"}
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Circle Info */}
          <Card variant="glass" className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg text-white">
                Circle Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="text-neutral-500 text-sm">Contribution</div>
                  <div className="text-white font-medium text-lg">
                    {formatCurrency(circle.contribution_amount)}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500 text-sm">Members</div>
                  <div className="text-white font-medium text-lg">
                    {circle.current_members} / {circle.total_members}
                  </div>
                </div>
                {circle.status === "active" && (
                  <>
                    <div>
                      <div className="text-neutral-500 text-sm">
                        Current Period
                      </div>
                      <div className="text-white font-medium text-lg">
                        {circle.current_period} / {circle.total_members}
                      </div>
                    </div>
                    <div>
                      <div className="text-neutral-500 text-sm">
                        Period Ends
                      </div>
                      <div className="text-white font-medium text-lg">
                        {circle.current_period_end
                          ? new Date(
                              circle.current_period_end
                            ).toLocaleDateString()
                          : "-"}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {circle.status === "forming" && (
                <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div>
                      <p className="text-yellow-400 font-medium">
                        Waiting for members
                      </p>
                      <p className="text-yellow-400/70 text-sm mt-1">
                        This circle needs{" "}
                        {circle.total_members - circle.current_members} more
                        member(s) to start. Share the invite code below.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Members List */}
          <Card variant="glass" className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg text-white">Members</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-3">
                {memberships.map((member) => {
                  const contributed = hasContributedThisPeriod(member.user_id);
                  const isCurrentRecipient =
                    circle.status === "active" &&
                    member.payout_position === circle.current_period;

                  return (
                    <div
                      key={member.id}
                      className={`flex items-center gap-4 p-3 rounded-lg ${
                        isCurrentRecipient
                          ? "bg-green-500/10 border border-green-500/20"
                          : "bg-white/5"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-medium">
                        {member.payout_position}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {member.user.name}
                        </p>
                        <p className="text-neutral-500 text-sm truncate">
                          Position #{member.payout_position}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.has_received_payout && (
                          <Badge variant="success">Paid</Badge>
                        )}
                        {isCurrentRecipient && !member.has_received_payout && (
                          <Badge variant="active">Receiving</Badge>
                        )}
                        {circle.status === "active" && (
                          <div
                            className={`w-3 h-3 rounded-full ${
                              contributed ? "bg-green-400" : "bg-neutral-600"
                            }`}
                            title={
                              contributed
                                ? "Contributed this period"
                                : "Pending contribution"
                            }
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Payout History */}
          {payouts.length > 0 && (
            <Card variant="glass" className="p-6">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg text-white">
                  Payout History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-3">
                  {payouts.map((payout) => (
                    <div
                      key={payout.id}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                    >
                      <div>
                        <p className="text-white font-medium">
                          Period {payout.period}
                        </p>
                        <p className="text-neutral-500 text-sm">
                          {payout.recipient.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium font-mono">
                          {formatCurrency(payout.amount)}
                        </p>
                        <Badge
                          variant={
                            payout.status === "completed" ? "success" : "default"
                          }
                        >
                          {payout.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Invite Code */}
          {circle.status === "forming" && (
            <Card variant="glass" className="p-6">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg text-white">
                  Invite Code
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <p className="text-2xl font-mono font-bold text-white tracking-wider">
                    {circle.invite_code}
                  </p>
                </div>
                <p className="text-neutral-500 text-sm mt-3 text-center">
                  Share this code with friends to join your circle
                </p>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => {
                    navigator.clipboard.writeText(circle.invite_code);
                  }}
                >
                  Copy Code
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Circle Creator */}
          <Card variant="glass" className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg text-white">Created By</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">{circle.creator.name}</p>
                  <p className="text-neutral-500 text-sm">Organizer</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pool Info */}
          <Card variant="glass" className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg text-white">Pool Size</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-3xl font-bold text-white font-mono">
                {formatCurrency(
                  circle.contribution_amount * circle.total_members
                )}
              </p>
              <p className="text-neutral-500 text-sm mt-1">
                Total payout per period
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
