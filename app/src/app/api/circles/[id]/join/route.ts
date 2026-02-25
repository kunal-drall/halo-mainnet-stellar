import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { createAdminClient } from "@/lib/supabase/admin";
import { circleContract } from "@/lib/stellar/contracts/circle";

// Type for user data from Supabase
interface UserData {
  id: string;
  unique_id: string | null;
  wallet_address: string | null;
  kyc_status: string;
  [key: string]: any;
}

// Type for circle data from Supabase
interface CircleData {
  id: string;
  status: string;
  member_count: number;
  contribution_frequency?: string;
  [key: string]: any;
}

/**
 * POST /api/circles/[id]/join
 * Join a circle that is in "forming" status
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
    const supabase = createAdminClient();

    // Get user with wallet info
    const { data: userData } = await supabase
      .from("users")
      .select("id, unique_id, wallet_address, kyc_status")
      .eq("id", session.user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userData as UserData;

    // Check KYC status
    if (user.kyc_status !== "verified") {
      return NextResponse.json(
        { error: "KYC verification required to join circles" },
        { status: 403 }
      );
    }

    // Check wallet is bound
    if (!user.wallet_address || !user.unique_id) {
      return NextResponse.json(
        { error: "Wallet binding required to join circles" },
        { status: 403 }
      );
    }

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

    // Check circle is still forming
    if (circle.status !== "forming") {
      return NextResponse.json(
        { error: "Circle is no longer accepting members" },
        { status: 400 }
      );
    }

    // Check if already a member
    const { data: existingMembership } = await supabase
      .from("memberships")
      .select("id")
      .eq("circle_id", circleId)
      .eq("user_id", session.user.id)
      .single();

    if (existingMembership) {
      return NextResponse.json(
        { error: "Already a member of this circle" },
        { status: 400 }
      );
    }

    // Get current member count
    const { count: memberCount } = await supabase
      .from("memberships")
      .select("*", { count: "exact", head: true })
      .eq("circle_id", circleId);

    if ((memberCount || 0) >= circle.member_count) {
      return NextResponse.json({ error: "Circle is full" }, { status: 400 });
    }

    // Determine payout position (next available)
    const payoutPosition = (memberCount || 0) + 1;

    // Create membership in database
    const { data: membership, error: membershipError } = await (supabase.from("memberships") as any)
      .insert({
        circle_id: circleId,
        user_id: session.user.id,
        payout_position: payoutPosition,
        status: "active",
      })
      .select()
      .single();

    if (membershipError) {
      console.error("Failed to create membership:", membershipError);
      return NextResponse.json(
        { error: "Failed to join circle" },
        { status: 500 }
      );
    }

    // Update circle member count
    await (supabase.from("circles") as any)
      .update({ current_members: (memberCount || 0) + 1 })
      .eq("id", circleId);

    // Check if circle is now full and should become active
    if ((memberCount || 0) + 1 >= circle.member_count) {
      // Calculate first period start and end dates
      const startDate = new Date();
      const endDate = new Date();

      // Period length based on frequency
      const periodDays = {
        weekly: 7,
        biweekly: 14,
        monthly: 30,
      }[circle.contribution_frequency as string] || 30;

      endDate.setDate(endDate.getDate() + periodDays);

      await (supabase.from("circles") as any)
        .update({
          status: "active",
          current_period: 1,
          current_period_start: startDate.toISOString(),
          current_period_end: endDate.toISOString(),
        })
        .eq("id", circleId);
    }

    // TODO: Call on-chain join_circle when wallet signing is implemented
    // This would be done via a separate endpoint that handles wallet signing

    return NextResponse.json({
      message: "Successfully joined circle",
      membership,
      payoutPosition,
    });
  } catch (error) {
    console.error("POST /api/circles/[id]/join error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
