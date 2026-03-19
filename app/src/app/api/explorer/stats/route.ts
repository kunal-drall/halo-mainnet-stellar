import { NextResponse } from "next/server";
import { simulateContractCall, CONTRACT_ADDRESSES } from "@/lib/stellar/client";
import { scValToNative } from "@stellar/stellar-sdk";

function toNum(result: any): number {
  if (!result) return 0;
  try {
    return Number(scValToNative(result));
  } catch {
    return 0;
  }
}

export async function GET() {
  try {
    const [bindingResult, circleResult, creditResult] = await Promise.all([
      simulateContractCall(CONTRACT_ADDRESSES.identity, "get_binding_count", []),
      simulateContractCall(CONTRACT_ADDRESSES.circle, "get_circle_count", []),
      simulateContractCall(CONTRACT_ADDRESSES.credit, "get_user_count", []),
    ]);

    return NextResponse.json(
      {
        binding_count: toNum(bindingResult),
        circle_count: toNum(circleResult),
        credit_user_count: toNum(creditResult),
        contracts: {
          identity: CONTRACT_ADDRESSES.identity,
          circle: CONTRACT_ADDRESSES.circle,
          credit: CONTRACT_ADDRESSES.credit,
        },
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
