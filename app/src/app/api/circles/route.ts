import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { createAdminClient } from "@/lib/supabase/admin";
import { circleContract, CircleConfig } from "@/lib/stellar/contracts/circle";
import { identityContract } from "@/lib/stellar/contracts/identity";
import { queryTokenBalance, USDC_CONTRACT_ADDRESS } from "@/lib/stellar/client";
import { z } from "zod";

// Type for user data
interface UserData {
  id: string;
  wallet_address: string | null;
  unique_id: string | null;
  [key: string]: any;
}

// Validation schema for creating a circle
const createCircleSchema = z.object({
  name: z.string().min(3).max(30),
  contributionAmount: z.number().min(10).max(500), // USD
  memberCount: z.number().int().min(3).max(10),
  startDate: z.string().datetime(),
});

/**
 * GET /api/circles
 * List circles the user is a member of
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Get user's circles via memberships
    const { data, error } = await supabase
      .from("memberships")
      .select(`
        payout_position,
        has_received_payout,
        joined_at,
        circles (
          id,
          name,
          contribution_amount,
          member_count,
          status,
          current_period,
          start_date,
          invite_code,
          organizer_id,
          created_at
        )
      `)
      .eq("user_id", session.user.id)
      .order("joined_at", { ascending: false });

    if (error) {
      console.error("Error fetching circles:", error);
      return NextResponse.json({ error: "Failed to fetch circles" }, { status: 500 });
    }

    return NextResponse.json({ circles: data });
  } catch (error) {
    console.error("GET /api/circles error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/circles
 * Create a new circle
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = createCircleSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const input = validationResult.data;
    const supabase = createAdminClient();

    // Get user with wallet (check from database, not stale session)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, wallet_address, unique_id, onboarding_completed")
      .eq("id", session.user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userData as UserData;

    // Check wallet is bound (required for circle creation)
    if (!user.wallet_address) {
      return NextResponse.json({ error: "Please connect your wallet first" }, { status: 400 });
    }

    // Check user doesn't have too many active circles
    const { count } = await supabase
      .from("memberships")
      .select("*, circles!inner(*)", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .in("circles.status", ["forming", "active"]);

    if (count && count >= 3) {
      return NextResponse.json(
        { error: "Maximum 3 active circles allowed" },
        { status: 400 }
      );
    }

    // Validate start date is at least 3 days in future
    const startDate = new Date(input.startDate);
    const minStartDate = new Date();
    minStartDate.setDate(minStartDate.getDate() + 3);

    if (startDate < minStartDate) {
      return NextResponse.json(
        { error: "Start date must be at least 3 days from today" },
        { status: 400 }
      );
    }

    // Check token balance — user needs at least 1x contribution as collateral
    const contributionToken = process.env.USDC_CONTRACT_ADDRESS || USDC_CONTRACT_ADDRESS;
    const requiredAmount = BigInt(input.contributionAmount * 10_000_000); // 7 decimals
    try {
      const balance = await queryTokenBalance(contributionToken, user.wallet_address);
      if (balance < requiredAmount) {
        const balanceFormatted = (Number(balance) / 10_000_000).toFixed(2);
        return NextResponse.json(
          {
            error: `Insufficient token balance. You need at least $${input.contributionAmount} as collateral but only have $${balanceFormatted}. Please fund your wallet first.`,
          },
          { status: 400 }
        );
      }
    } catch (balanceError) {
      console.error("[circles] Balance check failed:", balanceError);
      // Allow creation to proceed if balance check fails (RPC issue)
    }

    // Check if user's identity is bound on-chain (required for circle creation)
    let identityTransactionXdr: string | null = null;
    try {
      const isBound = await identityContract.isBound(user.wallet_address);
      if (!isBound) {
        // Identity not bound on-chain — build binding transaction
        if (!user.unique_id) {
          return NextResponse.json(
            { error: "Identity not set up. Please reconnect your wallet." },
            { status: 400 }
          );
        }
        const uniqueIdBytes = Buffer.from(user.unique_id, "hex");
        identityTransactionXdr = await identityContract.buildBindWalletTransaction(
          uniqueIdBytes,
          user.wallet_address
        );
      }
    } catch (identityError) {
      console.error("[circles] Identity check failed:", identityError);
      // Continue — will fail at contract level if identity is truly not bound
    }

    // If identity needs binding, return that transaction first
    if (identityTransactionXdr) {
      return NextResponse.json(
        {
          error: "Identity not bound on-chain. Please sign the identity binding transaction first.",
          requiresIdentityBinding: true,
          identityTransactionXdr,
        },
        { status: 428 } // Precondition Required
      );
    }

    // Build on-chain transaction first — this must succeed
    const contractConfig: CircleConfig = {
      name: input.name,
      contributionAmount: requiredAmount,
      totalMembers: input.memberCount,
      periodLength: BigInt(30 * 24 * 60 * 60),
      gracePeriod: BigInt(7 * 24 * 60 * 60),
      lateFeePercent: 5,
    };

    let transactionXdr: string;
    try {
      transactionXdr = await circleContract.buildCreateCircleTransaction(
        user.wallet_address,
        contractConfig
      );
    } catch (txError) {
      console.error("[circles] Failed to build on-chain transaction:", txError);
      return NextResponse.json(
        { error: "Failed to prepare on-chain transaction. Please try again." },
        { status: 500 }
      );
    }

    // Generate invite code
    const inviteCode = generateInviteCode();

    // Create circle record in database
    const { data: circleData, error: circleError } = await (supabase.from("circles") as any)
      .insert({
        name: input.name,
        contribution_amount: Number(requiredAmount),
        member_count: input.memberCount,
        start_date: input.startDate.split("T")[0],
        invite_code: inviteCode,
        organizer_id: session.user.id,
        contract_circle_id: "pending_signature", // Updated after on-chain tx is confirmed
        contribution_token: contributionToken,
      })
      .select()
      .single();

    if (circleError || !circleData) {
      console.error("Error creating circle:", circleError);
      return NextResponse.json({ error: "Failed to create circle" }, { status: 500 });
    }

    const circle = circleData as { id: string; [key: string]: any };

    // Add organizer as first member
    const { error: membershipError } = await (supabase.from("memberships") as any).insert({
      circle_id: circle.id,
      user_id: session.user.id,
      payout_position: 1, // Organizer gets first payout
    });

    if (membershipError) {
      console.error("Error adding organizer as member:", membershipError);
    }

    return NextResponse.json(
      {
        circle,
        inviteCode,
        inviteLink: `${process.env.NEXT_PUBLIC_APP_URL || ""}/circles/join/${inviteCode}`,
        transactionXdr, // Must be signed by the user's wallet
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/circles error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Generate a random invite code
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing chars
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
