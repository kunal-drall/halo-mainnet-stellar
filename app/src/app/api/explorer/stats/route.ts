import { NextResponse } from "next/server";
import { simulateContractCall, CONTRACT_ADDRESSES, scValToU64 } from "@/lib/stellar/client";

export async function GET() {
  try {
    const [bindingResult, circleResult, creditResult] = await Promise.all([
      simulateContractCall(CONTRACT_ADDRESSES.identity, "get_binding_count", []),
      simulateContractCall(CONTRACT_ADDRESSES.circle, "get_circle_count", []),
      simulateContractCall(CONTRACT_ADDRESSES.credit, "get_user_count", []),
    ]);

    const binding_count = bindingResult ? Number(scValToU64(bindingResult)) : 0;
    const circle_count = circleResult ? Number(scValToU64(circleResult)) : 0;
    const credit_user_count = creditResult ? Number(scValToU64(creditResult)) : 0;

    return NextResponse.json(
      {
        binding_count,
        circle_count,
        credit_user_count,
        fetched_at: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch explorer stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch on-chain stats" },
      { status: 500 }
    );
  }
}
