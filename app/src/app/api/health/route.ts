import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rpc } from "@stellar/stellar-sdk";

export async function GET() {
  const checks: Record<string, string> = {};

  // Check env vars are present (not their values)
  checks.NEXTAUTH_URL = process.env.NEXTAUTH_URL ? "set" : "MISSING";
  checks.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET ? "set" : "MISSING";
  checks.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ? "set" : "MISSING";
  checks.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
    ? "set"
    : "MISSING";
  checks.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? "set"
    : "MISSING";
  checks.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? "set"
    : "MISSING";
  checks.CIRCLE_CONTRACT_ADDRESS = process.env.CIRCLE_CONTRACT_ADDRESS
    ? "set"
    : "MISSING (using default)";
  checks.SOROBAN_RPC_URL = process.env.SOROBAN_RPC_URL
    ? "set"
    : "MISSING (using default)";

  // Test Supabase connection
  try {
    const supabase = createAdminClient();
    const { count, error } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (error) {
      checks.supabase = `error: ${error.message}`;
    } else {
      checks.supabase = `connected (${count} users)`;
    }
  } catch (err) {
    checks.supabase = `exception: ${err instanceof Error ? err.message : String(err)}`;
  }

  // Test Soroban RPC connection
  try {
    const rpcUrl = process.env.SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
    const server = new rpc.Server(rpcUrl);
    const health = await server.getHealth();
    checks.soroban = `connected (ledger: ${health.latestLedger})`;
  } catch (err) {
    checks.soroban = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  const allOk = !Object.values(checks).some(
    (v) => v.startsWith("error") || v.startsWith("exception") || v === "MISSING"
  );

  return NextResponse.json(
    { status: allOk ? "healthy" : "unhealthy", checks },
    { status: allOk ? 200 : 500 }
  );
}
