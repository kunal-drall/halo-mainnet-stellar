/**
 * Environment variable validation.
 * Call validateEnv() at app startup to catch misconfigurations early.
 */

interface EnvVar {
  name: string;
  required: boolean;
  defaultValue?: string;
}

const ENV_VARS: EnvVar[] = [
  { name: "NEXTAUTH_URL", required: true },
  { name: "NEXTAUTH_SECRET", required: true },
  { name: "GOOGLE_CLIENT_ID", required: true },
  { name: "GOOGLE_CLIENT_SECRET", required: true },
  { name: "NEXT_PUBLIC_SUPABASE_URL", required: true },
  { name: "SUPABASE_SERVICE_ROLE_KEY", required: true },
  { name: "CIRCLE_CONTRACT_ADDRESS", required: false },
  { name: "SOROBAN_RPC_URL", required: false, defaultValue: "https://soroban-testnet.stellar.org" },
  { name: "SPONSOR_SECRET_KEY", required: false },
  { name: "ADMIN_EMAILS", required: false, defaultValue: "kunaldrall29@gmail.com" },
];

export function validateEnv(): { valid: boolean; missing: string[]; warnings: string[] } {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const v of ENV_VARS) {
    const value = process.env[v.name];
    if (!value) {
      if (v.required) {
        missing.push(v.name);
      } else if (!v.defaultValue) {
        warnings.push(`${v.name} not set (optional)`);
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Get a required env var or throw.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
