import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { createAdminClient } from "@/lib/supabase/admin";

// Type for credit score data
interface CreditScoreData {
  score: number;
  tier: string;
  [key: string]: any;
}

/**
 * GET /api/credit/history
 * Get the current user's credit event history
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const eventType = searchParams.get("type"); // filter by event type

    // Build query
    let query = supabase
      .from("credit_events")
      .select(
        `
        id,
        event_type,
        points_change,
        score_after,
        description,
        created_at,
        circle:circles(id, name)
      `,
        { count: "exact" }
      )
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply event type filter if provided
    if (eventType) {
      query = query.eq("event_type", eventType);
    }

    const { data: events, error, count } = await query;

    if (error) {
      console.error("Error fetching credit history:", error);
      return NextResponse.json(
        { error: "Failed to fetch credit history" },
        { status: 500 }
      );
    }

    // Get current credit score for context
    const { data: creditScoreData } = await supabase
      .from("credit_scores")
      .select("score, tier")
      .eq("user_id", session.user.id)
      .single();

    const creditScore = creditScoreData as CreditScoreData | null;

    return NextResponse.json({
      events: events || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
      currentScore: creditScore?.score || 300,
      currentTier: creditScore?.tier || "building",
    });
  } catch (error) {
    console.error("GET /api/credit/history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
