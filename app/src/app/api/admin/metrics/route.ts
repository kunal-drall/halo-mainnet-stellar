import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "kunaldrall29@gmail.com").split(",");

function isAdmin(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email);
}

/**
 * GET /api/admin/metrics
 * Returns live platform metrics
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Run all queries in parallel
    const [
      usersResult,
      circlesResult,
      contributionsResult,
      payoutsResult,
      creditResult,
      dauResult,
      wauResult,
      mauResult,
      recentActivityResult,
      newUsersResult,
      circlesByStatusResult,
    ] = await Promise.all([
      // Total users
      supabase.from("users").select("*", { count: "exact", head: true }),
      // Total circles
      supabase.from("circles").select("*", { count: "exact", head: true }),
      // Total contributions
      (supabase.from("contributions") as any)
        .select("amount")
        .in("status", ["paid", "late"]),
      // Total payouts
      (supabase.from("payouts") as any).select("amount"),
      // Average credit score
      supabase.from("credit_scores").select("score"),
      // DAU (last 24h)
      (supabase.from("user_activity") as any)
        .select("user_id")
        .gte("created_at", new Date(Date.now() - 86400000).toISOString()),
      // WAU (last 7 days)
      (supabase.from("user_activity") as any)
        .select("user_id")
        .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
      // MAU (last 30 days)
      (supabase.from("user_activity") as any)
        .select("user_id")
        .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
      // Recent activity (last 20)
      (supabase.from("user_activity") as any)
        .select("id, user_id, activity_type, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      // New users today
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      // Circles by status
      supabase.from("circles").select("status"),
    ]);

    // Calculate unique active users
    const uniqueDAU = new Set((dauResult.data || []).map((r: any) => r.user_id)).size;
    const uniqueWAU = new Set((wauResult.data || []).map((r: any) => r.user_id)).size;
    const uniqueMAU = new Set((mauResult.data || []).map((r: any) => r.user_id)).size;

    // Calculate contribution totals
    const totalContributions = (contributionsResult.data || []).reduce(
      (sum: number, c: any) => sum + (c.amount || 0), 0
    );
    const totalPayouts = (payoutsResult.data || []).reduce(
      (sum: number, p: any) => sum + (p.amount || 0), 0
    );

    // Calculate average credit score
    const scores = (creditResult.data || []).map((s: any) => s.score);
    const avgCreditScore = scores.length > 0
      ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
      : 300;

    // Credit score distribution
    const scoreDistribution = [
      { tier: "Building (300-499)", count: 0, range: [300, 499] },
      { tier: "Fair (500-649)", count: 0, range: [500, 649] },
      { tier: "Good (650-749)", count: 0, range: [650, 749] },
      { tier: "Excellent (750-850)", count: 0, range: [750, 850] },
    ];
    scores.forEach((s: number) => {
      const bucket = scoreDistribution.find(
        (d) => s >= d.range[0] && s <= d.range[1]
      );
      if (bucket) bucket.count++;
    });

    // Circle status breakdown
    const circleStatuses: Record<string, number> = {};
    (circlesByStatusResult.data || []).forEach((c: any) => {
      circleStatuses[c.status] = (circleStatuses[c.status] || 0) + 1;
    });

    // Enrich recent activity with user names
    const userIds = [...new Set((recentActivityResult.data || []).map((a: any) => a.user_id))];
    const { data: activityUsers } = await supabase
      .from("users")
      .select("id, name, email")
      .in("id", userIds);
    const userMap = new Map((activityUsers || []).map((u: any) => [u.id, u]));

    const recentActivity = (recentActivityResult.data || []).map((a: any) => ({
      ...a,
      user: userMap.get(a.user_id) || { name: "Unknown", email: "" },
    }));

    return NextResponse.json({
      overview: {
        totalUsers: usersResult.count || 0,
        newUsersToday: newUsersResult.count || 0,
        dau: uniqueDAU,
        wau: uniqueWAU,
        mau: uniqueMAU,
        totalCircles: circlesResult.count || 0,
        circleStatuses,
        totalContributions,
        contributionCount: (contributionsResult.data || []).length,
        totalPayouts,
        payoutCount: (payoutsResult.data || []).length,
        avgCreditScore,
        totalTransactionVolume: totalContributions + totalPayouts,
      },
      scoreDistribution: scoreDistribution.map(({ tier, count }) => ({ tier, count })),
      recentActivity,
    });
  } catch (error) {
    console.error("GET /api/admin/metrics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/metrics
 * Take a daily snapshot of platform metrics
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Gather all metrics
    const [users, circles, contributions, payouts, creditScores, dau, wau, mau, newUsers] =
      await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("circles").select("status"),
        (supabase.from("contributions") as any).select("amount").in("status", ["paid", "late"]),
        (supabase.from("payouts") as any).select("amount"),
        supabase.from("credit_scores").select("score"),
        (supabase.from("user_activity") as any)
          .select("user_id")
          .gte("created_at", new Date(Date.now() - 86400000).toISOString()),
        (supabase.from("user_activity") as any)
          .select("user_id")
          .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
        (supabase.from("user_activity") as any)
          .select("user_id")
          .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
        supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      ]);

    const circleData = (circles.data || []) as any[];
    const scores = (creditScores.data || []).map((s: any) => s.score);
    const totalContribAmount = (contributions.data || []).reduce(
      (s: number, c: any) => s + (c.amount || 0), 0
    );
    const totalPayoutAmount = (payouts.data || []).reduce(
      (s: number, p: any) => s + (p.amount || 0), 0
    );

    const snapshot = {
      date: new Date().toISOString().split("T")[0],
      total_users: users.count || 0,
      active_users_daily: new Set((dau.data || []).map((r: any) => r.user_id)).size,
      active_users_weekly: new Set((wau.data || []).map((r: any) => r.user_id)).size,
      active_users_monthly: new Set((mau.data || []).map((r: any) => r.user_id)).size,
      total_circles: circleData.length,
      active_circles: circleData.filter((c) => c.status === "active").length,
      forming_circles: circleData.filter((c) => c.status === "forming").length,
      completed_circles: circleData.filter((c) => c.status === "completed").length,
      total_contributions: totalContribAmount,
      contribution_count: (contributions.data || []).length,
      total_payouts: totalPayoutAmount,
      payout_count: (payouts.data || []).length,
      avg_credit_score: scores.length > 0
        ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
        : 300,
      total_transaction_volume: totalContribAmount + totalPayoutAmount,
      new_users_today: newUsers.count || 0,
    };

    const { error } = await (supabase.from("platform_metrics") as any)
      .upsert(snapshot, { onConflict: "date" });

    if (error) {
      console.error("Failed to save metrics snapshot:", error);
      return NextResponse.json({ error: "Failed to save snapshot" }, { status: 500 });
    }

    return NextResponse.json({ message: "Snapshot saved", snapshot });
  } catch (error) {
    console.error("POST /api/admin/metrics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
