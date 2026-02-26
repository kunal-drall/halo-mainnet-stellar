import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const allOk = !Object.values(checks).some(
    (v) => v === "MISSING" || v.startsWith("error") || v.startsWith("exception")
  );

  return NextResponse.json(
    { status: allOk ? "healthy" : "unhealthy", checks },
    { status: allOk ? 200 : 500 }
  );
}
