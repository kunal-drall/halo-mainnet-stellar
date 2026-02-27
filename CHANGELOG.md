# Halo Protocol - Changelog & Issue Resolution

## 2026-02-27: Circle Contract Redeployment & Identity Binding Fix

### Issues Encountered

#### 1. "Transaction failed" — Circle Creation Trapped On-Chain
**Error:** `Transaction failed: ec700e3c...` / `78a5d431...`
**Result XDR:** `invokeHostFunctionTrapped` (UnreachableCodeReached)

**Root Cause:** The deployed circle contract (Feb 25) had a bug in `generate_circle_id()` — it used `env.ledger().timestamp()` and `env.ledger().sequence()` which are **non-deterministic** between simulation and on-chain execution. This caused the storage footprint estimated during simulation to differ from what was needed during actual execution, resulting in a Wasm trap.

The fix (already in the codebase but not redeployed) changed `generate_circle_id()` to use only deterministic inputs (`count` from contract storage).

**Resolution:** Rebuilt and redeployed the circle contract with the fixed code.

#### 2. "Insufficient token balance" — Wrong Token Address
**Error:** `Insufficient token balance. You need at least $50 as collateral but only have $0.00`

**Root Cause:** The `USDC_CONTRACT_ADDRESS` environment variable on Vercel was pointing to a non-existent USDC token contract instead of the HUSD test token.

**Resolution:** Updated `USDC_CONTRACT_ADDRESS` to the HUSD token address on Vercel.

#### 3. "Failed to fetch" — ScMap Key Ordering
**Error:** API returned 500 when building circle creation transaction.

**Root Cause:** Soroban requires `ScMap` keys to be sorted alphabetically. The `buildCreateCircleTransaction` function had keys in a non-alphabetical order, causing `ScMap was not sorted by key for conversion to host object`.

**Resolution:** Reordered ScMap keys alphabetically in `circle.ts`.

#### 4. Identity Not Bound On-Chain
**Error:** `create_circle` contract function calls `verify_identity()` which requires `is_bound()` to return `true`. Users who bound their wallet in the database before the identity binding code was added had no on-chain identity.

**Root Cause:** The wallet binding flow only saved to Supabase, never called the identity contract's `bind_wallet` function.

**Resolution:**
- Added identity binding transaction to the wallet onboarding flow
- Added identity check (with 428 response) before circle creation/joining
- Frontend auto-handles identity binding before retrying circle operations

#### 5. OAuth "Access Denied" on Login
**Error:** `AccessDenied` error when signing in with Google OAuth.

**Root Cause:** Supabase `.single()` threw an error when the user didn't exist yet (zero rows). The `signIn` callback returned `false`, causing NextAuth to show "Access Denied".

**Resolution:** Changed `.single()` to `.maybeSingle()` in the auth callback. Also added race condition handling (error code 23505).

---

### Contract Addresses

| Contract | Previous Address | New Address |
|----------|-----------------|-------------|
| **Identity** | `CDZHU3HDAARGX3R3SH235IFQGA5CTXTMYQTPCQD3ASRONXCADA2P7HOK` | *(unchanged)* |
| **Credit** | `CBBJHJQJQOAZJPQK6QNDA5UKEI5K73UZQJPV5A6QCWI5KMTY6ZXCYZW3` | *(unchanged)* |
| **Circle** | `CAZR2RDDZ2AJ6LUYFKOYAPI3PFW4KSQQBJ7REQLHQPYSMD6KZJEE5V4U` | `CA2QSALSVD4OI6IO34G7MTRK356UR6SQYH52EZKJF5RGCPDRY34GRJJP` |
| **HUSD Token** | `CAFARMM7LIR4NP5HTNTHKX2ZMMNJ552JILO6FTORWRYCVO4WPMCYDXYL` | *(unchanged)* |
| **Admin** | `GDKUDGFWBHGHXVPWT7RCJANSC46XSBO2I5ZVJXOXUDVSC74KMIT7P4JZ` | *(unchanged)* |

### Environment Variables to Update on Vercel

```
CIRCLE_CONTRACT_ADDRESS=CA2QSALSVD4OI6IO34G7MTRK356UR6SQYH52EZKJF5RGCPDRY34GRJJP
```

### Key Files Modified

- `app/src/lib/stellar/client.ts` — Updated circle contract address
- `app/src/lib/stellar/contracts/circle.ts` — Fixed ScMap key ordering
- `app/src/lib/stellar/contracts/identity.ts` — Identity contract wrapper
- `app/src/app/api/circles/route.ts` — Added identity check, balance check, mandatory on-chain tx
- `app/src/app/api/circles/[id]/join/route.ts` — Added identity check, balance check
- `app/src/app/api/onboarding/wallet/bind/route.ts` — Added identity binding transaction
- `app/src/app/(app)/circles/create/page.tsx` — Handles identity binding + circle creation signing
- `app/src/app/(app)/circles/join/[code]/page.tsx` — Handles identity binding + join signing
- `app/src/app/onboarding/wallet/page.tsx` — Signs identity binding during wallet connect
- `app/src/lib/auth/options.ts` — Fixed maybeSingle for OAuth
- `app/src/app/api/health/route.ts` — Health check endpoint
