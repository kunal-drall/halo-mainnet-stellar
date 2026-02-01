import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { createAdminClient } from "@/lib/supabase/admin";
import { creditContract } from "@/lib/stellar/contracts/credit";

// Type for credit score data
interface CreditScoreData {
  score: number;
  tier: string;
  total_payments: number;
  on_time_payments: number;
  late_payments: number;
  missed_payments: number;
  circles_completed: number;
  last_synced_at: string;
  [key: string]: any;
}

// Type for user data
interface UserData {
  unique_id: string | null;
  [key: string]: any;
}

/**
 * GET /api/credit/score
 * Get the current user's credit score
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Get cached score from database first
    const { data: localScoreData } = await supabase
      .from("credit_scores")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    const localScore = localScoreData as CreditScoreData | null;

    if (localScore) {
      // Check if cache is fresh (< 5 minutes)
      const lastSynced = new Date(localScore.last_synced_at);
      const now = new Date();
      const minutesSinceSync = (now.getTime() - lastSynced.getTime()) / 60000;

      if (minutesSinceSync < 5) {
        return NextResponse.json({
          score: localScore.score,
          tier: localScore.tier,
          stats: {
            totalPayments: localScore.total_payments,
            onTimePayments: localScore.on_time_payments,
            latePayments: localScore.late_payments,
            missedPayments: localScore.missed_payments,
            circlesCompleted: localScore.circles_completed,
          },
          lastSyncedAt: localScore.last_synced_at,
          cached: true,
        });
      }
    }

    // Get user's unique_id for chain lookup
    const { data: userData } = await supabase
      .from("users")
      .select("unique_id")
      .eq("id", session.user.id)
      .single();

    const user = userData as UserData | null;

    if (!user?.unique_id) {
      // User hasn't completed KYC yet, return default score
      return NextResponse.json({
        score: 300,
        tier: "building",
        stats: null,
        message: "Complete KYC to start building credit",
      });
    }

    // Try to sync from chain
    try {
      const uniqueIdBuffer = Buffer.from(user.unique_id, "hex");
      const chainScore = await creditContract.getScore(uniqueIdBuffer);

      if (chainScore !== null) {
        const tier = creditContract.scoreTier(chainScore);

        // Update local cache
        await (supabase.from("credit_scores") as any).upsert({
          user_id: session.user.id,
          score: chainScore,
          tier,
          last_synced_at: new Date().toISOString(),
        });

        return NextResponse.json({
          score: chainScore,
          tier,
          stats: null, // Would need to fetch full data
          lastSyncedAt: new Date().toISOString(),
          cached: false,
        });
      }
    } catch (chainError) {
      console.error("Error fetching from chain:", chainError);
      // Fall through to return cached data or default
    }

    // Return cached data if available, otherwise default
    if (localScore) {
      return NextResponse.json({
        score: localScore.score,
        tier: localScore.tier,
        stats: {
          totalPayments: localScore.total_payments,
          onTimePayments: localScore.on_time_payments,
          latePayments: localScore.late_payments,
          missedPayments: localScore.missed_payments,
          circlesCompleted: localScore.circles_completed,
        },
        lastSyncedAt: localScore.last_synced_at,
        cached: true,
        stale: true,
      });
    }

    // No data available
    return NextResponse.json({
      score: 300,
      tier: "building",
      stats: null,
    });
  } catch (error) {
    console.error("GET /api/credit/score error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
