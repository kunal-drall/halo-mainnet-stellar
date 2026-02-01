import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { stellarClient } from "@/lib/stellar/client";

/**
 * POST /api/stellar/submit
 * Submit a signed transaction to the Stellar network
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { signedXdr } = body;

    if (!signedXdr) {
      return NextResponse.json(
        { error: "Missing signedXdr parameter" },
        { status: 400 }
      );
    }

    // Submit the transaction to Stellar network
    const result = await stellarClient.submitTransaction(signedXdr);

    // Extract hash and ledger from result (handles different response types)
    const txResult = result as any;

    return NextResponse.json({
      success: true,
      hash: txResult.hash || txResult.txHash || "",
      ledger: txResult.ledger || txResult.ledgerSeq || 0,
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
