import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { createAdminClient } from "@/lib/supabase/admin";

// Type for membership data
interface MembershipData {
  id: string;
  user_id: string;
  circle_id: string;
  payout_position: number;
  status: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  [key: string]: any;
}

// Type for circle data
interface CircleData {
  id: string;
  status: string;
  current_period: number;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  [key: string]: any;
}

/**
 * GET /api/circles/[id]
 * Get circle details including members and contributions
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminClient();

    // Get circle with creator info
    const { data: circleData, error: circleError } = await supabase
      .from("circles")
      .select(
        `
        *,
        creator:users!circles_creator_id_fkey(id, name, email)
      `
      )
      .eq("id", id)
      .single();

    if (circleError || !circleData) {
      return NextResponse.json({ error: "Circle not found" }, { status: 404 });
    }

    const circle = circleData as CircleData;

    // Get memberships with user info
    const { data: membershipsData } = await supabase
      .from("memberships")
      .select(
        `
        *,
        user:users(id, name, email)
      `
      )
      .eq("circle_id", id)
      .order("payout_position", { ascending: true });

    const memberships = (membershipsData || []) as MembershipData[];

    // Check if current user is a member
    const isMember = memberships.some(
      (m) => m.user_id === session.user.id
    );

    // Get contributions for current period if circle is active
    let contributions = null;
    if (circle.status === "active") {
      const { data: contribData } = await supabase
        .from("contributions")
        .select("*")
        .eq("circle_id", id)
        .eq("period_number", circle.current_period);

      contributions = contribData;
    }

    // Get payouts history
    const { data: payouts } = await supabase
      .from("payouts")
      .select(
        `
        *,
        recipient:users(id, name, email)
      `
      )
      .eq("circle_id", id)
      .order("period_number", { ascending: true });

    return NextResponse.json({
      circle,
      memberships,
      contributions: contributions || [],
      payouts: payouts || [],
      isMember,
    });
  } catch (error) {
    console.error("GET /api/circles/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
