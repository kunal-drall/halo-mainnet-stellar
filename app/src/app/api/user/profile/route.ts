import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { createAdminClient } from "@/lib/supabase/admin";

interface UserData {
  id: string;
  name: string;
  email: string;
  profile_image: string | null;
  wallet_address: string | null;
  wallet_bound_at: string | null;
  unique_id: string | null;
  kyc_status: string;
  created_at: string;
  [key: string]: any;
}

/**
 * GET /api/user/profile
 * Get the current user's profile information
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: userData, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (error || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userData as UserData;

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      profileImage: user.profile_image,
      walletAddress: user.wallet_address,
      walletBoundAt: user.wallet_bound_at,
      uniqueId: user.unique_id,
      kycStatus: user.kyc_status,
      createdAt: user.created_at,
    });
  } catch (error) {
    console.error("GET /api/user/profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
