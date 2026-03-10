import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import {
  isSponsorshipEnabled,
  getSponsorPublicKey,
  getRemainingSponsored,
} from "@/lib/stellar/sponsor";

/**
 * GET /api/stellar/sponsor/status
 * Returns fee sponsorship status for the current user.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const enabled = isSponsorshipEnabled();
    const sponsorKey = getSponsorPublicKey();
    const userId = (session.user as any).id;
    const remaining = userId ? getRemainingSponsored(userId) : 0;

    return NextResponse.json({
      enabled,
      sponsorPublicKey: sponsorKey,
      remainingToday: enabled ? remaining : 0,
      dailyLimit: 10,
    });
  } catch (error) {
    console.error("Sponsor status error:", error);
    return NextResponse.json(
      { error: "Failed to check sponsorship status" },
      { status: 500 }
    );
  }
}
