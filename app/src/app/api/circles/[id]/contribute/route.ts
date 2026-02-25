import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { createAdminClient } from "@/lib/supabase/admin";

// Type for circle data from Supabase
interface CircleData {
  id: string;
  status: string;
  current_period: number;
  current_period_end: string;
  grace_period_hours?: number;
  contribution_amount: number;
  late_fee_percentage?: number;
  member_count: number;
  contribution_frequency?: string;
  [key: string]: any;
}

interface MembershipData {
  id: string;
  user_id: string;
  total_contributed?: number;
  contributions_made?: number;
  [key: string]: any;
}

interface RecipientData {
  id: string;
  user_id: string;
  payout_position: number;
  has_received_payout: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    wallet_address: string;
  };
  [key: string]: any;
}

/**
 * POST /api/circles/[id]/contribute
 * Record a contribution for the current period
 *
 * Note: Actual token transfer happens on-chain via wallet signing.
 * This endpoint records the contribution in the database after
 * the on-chain transaction is confirmed.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: circleId } = await params;
    const body = await req.json();
    const { transactionHash, amount } = body;

    const supabase = createAdminClient();

    // Get circle
    const { data: circleData, error: circleError } = await supabase
      .from("circles")
      .select("*")
      .eq("id", circleId)
      .single();

    if (circleError || !circleData) {
      return NextResponse.json({ error: "Circle not found" }, { status: 404 });
    }

    const circle = circleData as CircleData;

    // Check circle is active
    if (circle.status !== "active") {
      return NextResponse.json(
        { error: "Circle is not active" },
        { status: 400 }
      );
    }

    // Check user is a member
    const { data: membershipData, error: membershipError } = await supabase
      .from("memberships")
      .select("*")
      .eq("circle_id", circleId)
      .eq("user_id", session.user.id)
      .single();

    if (membershipError || !membershipData) {
      return NextResponse.json(
        { error: "Not a member of this circle" },
        { status: 403 }
      );
    }

    const membership = membershipData as MembershipData;

    // Check if already contributed this period
    const { data: existingContribution } = await supabase
      .from("contributions")
      .select("id")
      .eq("circle_id", circleId)
      .eq("user_id", session.user.id)
      .eq("period", circle.current_period)
      .single();

    if (existingContribution) {
      return NextResponse.json(
        { error: "Already contributed for this period" },
        { status: 400 }
      );
    }

    // Determine if payment is on time or late
    const now = new Date();
    const periodEnd = circle.current_period_end ? new Date(circle.current_period_end) : null;
    let isLate = false;
    let lateFee = 0;

    if (periodEnd) {
      const gracePeriodEnd = new Date(periodEnd);
      gracePeriodEnd.setHours(gracePeriodEnd.getHours() + (circle.grace_period_hours || 24));

      if (now > periodEnd) {
        isLate = true;
        if (now > gracePeriodEnd) {
          // Past grace period - late with fee
          lateFee = Math.floor(
            (circle.contribution_amount * (circle.late_fee_percentage || 5)) / 100
          );
        }
      }
    }

    const contributionStatus = isLate ? "late" : "paid";

    // Create contribution record
    const { data: contribution, error: contributionError } = await supabase
      .from("contributions")
      .insert({
        circle_id: circleId,
        user_id: session.user.id,
        membership_id: membership.id,
        period: circle.current_period,
        amount: amount || circle.contribution_amount,
        late_fee: lateFee,
        due_date: circle.current_period_end || new Date().toISOString(),
        status: contributionStatus,
        on_time: !isLate,
        transaction_hash: transactionHash,
        paid_at: now.toISOString(),
      } as any)
      .select()
      .single();

    if (contributionError) {
      console.error("Failed to create contribution:", contributionError);
      return NextResponse.json(
        { error: "Failed to record contribution" },
        { status: 500 }
      );
    }

    // Check if all members have contributed for this period
    const { count: contributionCount } = await supabase
      .from("contributions")
      .select("*", { count: "exact", head: true })
      .eq("circle_id", circleId)
      .eq("period", circle.current_period)
      .in("status", ["paid", "late"]);

    // If all members contributed, process payout
    if ((contributionCount || 0) >= circle.member_count) {
      await processPayout(supabase, circle);
    }

    return NextResponse.json({
      message: "Contribution recorded successfully",
      contribution,
      isLate,
      lateFee,
    });
  } catch (error) {
    console.error("POST /api/circles/[id]/contribute error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Process payout when all contributions are received
 */
async function processPayout(supabase: ReturnType<typeof createAdminClient>, circle: any) {
  // Find the member who should receive payout this period
  const { data: recipientData } = await supabase
    .from("memberships")
    .select("*, user:users(id, name, email, wallet_address)")
    .eq("circle_id", circle.id)
    .eq("payout_position", circle.current_period)
    .single();

  if (!recipientData) {
    console.error("No recipient found for payout");
    return;
  }

  const recipient = recipientData as RecipientData;

  // Calculate payout amount (all contributions minus any protocol fee)
  const payoutAmount = circle.contribution_amount * circle.member_count;

  // Create payout record
  await (supabase.from("payouts") as any).insert({
    circle_id: circle.id,
    recipient_id: recipient.user_id,
    period: circle.current_period,
    amount: payoutAmount,
    status: "pending", // Will be "completed" after on-chain tx
  });

  // Update membership to mark payout received
  await (supabase.from("memberships") as any)
    .update({
      has_received_payout: true,
      payout_received_at: new Date().toISOString(),
    })
    .eq("id", recipient.id);

  // Advance to next period or complete circle
  if (circle.current_period >= circle.member_count) {
    // Circle is complete
    await (supabase.from("circles") as any)
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", circle.id);

    // Update all memberships to completed
    await (supabase.from("memberships") as any)
      .update({ status: "completed" })
      .eq("circle_id", circle.id);
  } else {
    // Advance to next period
    const nextPeriod = circle.current_period + 1;
    const periodDays = {
      weekly: 7,
      biweekly: 14,
      monthly: 30,
    }[circle.contribution_frequency as string] || 30;

    const nextPeriodStart = new Date();
    const nextPeriodEnd = new Date();
    nextPeriodEnd.setDate(nextPeriodEnd.getDate() + periodDays);

    await (supabase.from("circles") as any)
      .update({
        current_period: nextPeriod,
        current_period_start: nextPeriodStart.toISOString(),
        current_period_end: nextPeriodEnd.toISOString(),
      })
      .eq("id", circle.id);
  }

  // TODO: Trigger on-chain payout via Circle contract
  // TODO: Send email notification to recipient
}
