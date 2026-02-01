import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { createAdminClient } from "@/lib/supabase/admin";

// Type for circle data
interface CircleData {
  id: string;
  name: string;
  description: string | null;
  contribution_amount: number;
  contribution_frequency: string;
  total_members: number;
  current_members: number;
  status: string;
  invite_code: string;
  creator?: {
    id: string;
    name: string;
  };
  [key: string]: any;
}

/**
 * GET /api/circles/by-invite/[code]
 * Look up a circle by its invite code
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await params;
    const supabase = createAdminClient();

    // Find circle by invite code
    const { data: circleData, error } = await supabase
      .from("circles")
      .select(
        `
        id,
        name,
        description,
        contribution_amount,
        contribution_frequency,
        total_members,
        current_members,
        status,
        invite_code,
        creator:users!circles_creator_id_fkey(id, name)
      `
      )
      .eq("invite_code", code.toUpperCase())
      .single();

    if (error || !circleData) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 404 }
      );
    }

    const circle = circleData as CircleData;

    // Check if user is already a member
    const { data: membership } = await supabase
      .from("memberships")
      .select("id")
      .eq("circle_id", circle.id)
      .eq("user_id", session.user.id)
      .single();

    return NextResponse.json({
      circle,
      isAlreadyMember: !!membership,
      canJoin: circle.status === "forming" && !membership,
      spotsRemaining: circle.total_members - circle.current_members,
    });
  } catch (error) {
    console.error("GET /api/circles/by-invite/[code] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
