import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { stellarClient } from "@/lib/stellar/client";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { sponsorTransaction, isSponsorshipEnabled } from "@/lib/stellar/sponsor";

/**
 * POST /api/stellar/submit
 * Submit a signed transaction to the Stellar network.
 * Automatically wraps in a fee-bump transaction if sponsorship is enabled.
 */
export async function POST(req: NextRequest) {
  // Rate limit: 10 transaction submissions per minute
  const rateLimited = applyRateLimit(req, "stellar:submit", 10, 60_000);
  if (rateLimited) return rateLimited;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { signedXdr, skipSponsorship } = body;

    if (!signedXdr) {
      return NextResponse.json(
        { error: "Missing signedXdr parameter" },
        { status: 400 }
      );
    }

    let xdrToSubmit = signedXdr;
    let sponsored = false;

    // Attempt fee sponsorship if enabled and not explicitly skipped
    if (isSponsorshipEnabled() && !skipSponsorship) {
      try {
        xdrToSubmit = await sponsorTransaction(signedXdr, session.user.id);
        sponsored = true;
      } catch (sponsorError: any) {
        console.warn(
          "[stellar/submit] Fee sponsorship failed, falling back to user-paid:",
          sponsorError.message
        );
        // Fall back to user-paid transaction
      }
    }

    // Submit the transaction to Stellar network
    const result = await stellarClient.submitTransaction(xdrToSubmit);

    // Extract hash and ledger from result (handles different response types)
    const txResult = result as any;

    return NextResponse.json({
      success: true,
      hash: txResult.hash || txResult.txHash || "",
      ledger: txResult.ledger || txResult.ledgerSeq || 0,
      sponsored,
    });
  } catch (error: any) {
    console.error("POST /api/stellar/submit error:", error);

    // Extract Stellar-specific error details if available
    const errorMessage = error?.response?.data?.extras?.result_codes
      ? JSON.stringify(error.response.data.extras.result_codes)
      : error.message || "Failed to submit transaction";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
