import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { createAdminClient } from "@/lib/supabase/admin";
import { identityContract } from "@/lib/stellar/contracts/identity";
import { z } from "zod";
import crypto from "crypto";

// Type for user data
interface UserData {
  id: string;
  email: string;
  wallet_address: string | null;
  wallet_bound_at: string | null;
  unique_id: string | null;
  kyc_status: string;
  kyc_provider_id?: string;
  [key: string]: any;
}

// Validation schema
const bindWalletSchema = z.object({
  walletAddress: z.string().min(56).max(56), // Stellar addresses are 56 chars
  signedTransaction: z.string().optional(), // XDR of signed tx for on-chain binding
});

/**
 * POST /api/onboarding/wallet/bind
 * Bind a wallet address to the user's account
 *
 * This endpoint:
 * 1. Validates the user has completed KYC
 * 2. Generates a unique ID from KYC data
 * 3. Records the wallet binding in the database
 * 4. Optionally processes on-chain binding if signed transaction is provided
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = bindWalletSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { walletAddress, signedTransaction } = validation.data;
    const supabase = createAdminClient();

    // Get user with KYC status - try by ID first, then by email as fallback
    let userData: any = null;
    if (session.user.id) {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();
      userData = data;
    }

    if (!userData && session.user.email) {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("email", session.user.email)
        .single();
      userData = data;
    }

    if (!userData) {
      return NextResponse.json({ error: "Account not found. Please sign out and sign in again." }, { status: 404 });
    }

    const user = userData as UserData;

    // Check if wallet is already bound
    if (user.wallet_address) {
      return NextResponse.json(
        { error: "Wallet already bound. Wallet binding is permanent." },
        { status: 400 }
      );
    }

    // Check KYC status
    // For testnet, allow binding without verified KYC
    const isTestnet = process.env.STELLAR_NETWORK === "testnet";
    if (!isTestnet && user.kyc_status !== "verified") {
      return NextResponse.json(
        { error: "KYC verification required before wallet binding" },
        { status: 403 }
      );
    }

    // Check if this wallet is already bound to another user
    const { data: existingBinding } = await supabase
      .from("users")
      .select("id")
      .eq("wallet_address", walletAddress)
      .single();

    if (existingBinding) {
      return NextResponse.json(
        { error: "This wallet is already bound to another account" },
        { status: 400 }
      );
    }

    // Generate unique ID from KYC data
    // In production, this would use actual KYC data hash
    const uniqueId = generateUniqueId(user);

    // Check if unique ID is already used (prevents sybil)
    const { data: existingUniqueId } = await supabase
      .from("users")
      .select("id")
      .eq("unique_id", uniqueId)
      .neq("id", session.user.id)
      .single();

    if (existingUniqueId) {
      return NextResponse.json(
        { error: "Identity already registered with another wallet" },
        { status: 400 }
      );
    }

    // Update user with wallet and unique ID
    const { error: updateError } = await (supabase.from("users") as any)
      .update({
        wallet_address: walletAddress,
        unique_id: uniqueId,
        wallet_bound_at: new Date().toISOString(),
        onboarding_completed: true,
      })
      .eq("id", session.user.id);

    if (updateError) {
      console.error("Failed to update user:", updateError);
      return NextResponse.json(
        { error: "Failed to bind wallet" },
        { status: 500 }
      );
    }

    // Initialize credit score for the user
    await (supabase.from("credit_scores") as any).insert({
      user_id: session.user.id,
      score: 300,
      tier: "building",
    });

    // Build on-chain identity binding transaction
    // The frontend must sign this with Freighter and submit it
    let transactionXdr: string | null = null;
    try {
      const uniqueIdBytes = Buffer.from(uniqueId, "hex");
      transactionXdr = await identityContract.buildBindWalletTransaction(
        uniqueIdBytes,
        walletAddress
      );
    } catch (txError) {
      console.error("[wallet-bind] Failed to build identity binding transaction:", txError);
      // Continue — DB binding succeeded, on-chain can be retried
    }

    return NextResponse.json({
      message: "Wallet bound successfully",
      walletAddress,
      uniqueId,
      transactionXdr, // Frontend must sign this to complete on-chain identity binding
    });
  } catch (error) {
    console.error("POST /api/onboarding/wallet/bind error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Generate a unique ID from user KYC data
 * This creates a deterministic hash that can be used for sybil resistance
 */
function generateUniqueId(user: any): string {
  // In production, this would use:
  // - KYC provider's unique identifier
  // - Biometric hash (if available)
  // - Other identifying information

  // For now, we use a hash of available data
  const dataToHash = [
    user.kyc_provider_id || "",
    user.email || "",
    // Add more KYC fields in production
  ].join("|");

  const hash = crypto.createHash("sha256").update(dataToHash).digest("hex");

  return hash;
}

/**
 * GET /api/onboarding/wallet/bind
 * Get binding status for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: userData } = await supabase
      .from("users")
      .select("wallet_address, wallet_bound_at, unique_id, kyc_status")
      .eq("id", session.user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userData as UserData;

    return NextResponse.json({
      isBound: !!user.wallet_address,
      walletAddress: user.wallet_address,
      boundAt: user.wallet_bound_at,
      kycStatus: user.kyc_status,
      canBind: user.kyc_status === "verified" && !user.wallet_address,
    });
  } catch (error) {
    console.error("GET /api/onboarding/wallet/bind error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
