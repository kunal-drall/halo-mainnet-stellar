# Halo Protocol — Security Checklist

## Authentication & Authorization

### Authentication Flow
- **Provider**: Google OAuth 2.0 via NextAuth.js
- **Session Strategy**: JWT with 30-day expiry
- **Token Storage**: HTTP-only secure cookies (managed by NextAuth)
- **Session Refresh**: Automatic via NextAuth JWT callback

### Route Protection
- **Middleware**: All `/dashboard`, `/circles`, `/credit`, `/settings`, `/onboarding` routes require authentication
- **API Routes**: All `/api/circles/*`, `/api/credit/*`, `/api/onboarding/*`, `/api/user/*` return 401 for unauthenticated requests
- **Public Routes**: `/`, `/login`, `/api/auth/*`, `/api/health`

### Row-Level Security (RLS)
All database tables have RLS enabled:
- `users`: Users can only read/update their own profile
- `circles`: Readable by members, updatable by organizer
- `memberships`: Readable by circle members
- `contributions`: Readable by circle members, updatable by the contributor
- `payouts`: Readable by circle members
- `credit_scores`: Users can only view their own score
- `credit_events`: Users can only view their own events
- `user_activity`: Users can view their own activity (insert by service role only)

## Input Validation

### API-Level Validation
- **Zod Schemas** on all POST endpoints:
  - Circle creation: name (3-30 chars), contribution (10-500 USD), members (3-10), start date (3+ days future)
  - Wallet binding: wallet address format (56-char Stellar G... address), unique ID validation
- **Invite codes**: Uppercase alphanumeric, lookup via exact match
- **Transaction XDR**: Validated by Stellar SDK during submission

### Database Constraints
- `CHECK` constraints on: kyc_status, circle status, contribution status, credit score range (300-850)
- `UNIQUE` constraints on: email, wallet_address, unique_id, google_id, invite_code
- `FOREIGN KEY` constraints on all relational fields

## Anti-Sybil Protection

### Identity Binding
- Each user generates a unique 32-byte ID (SHA-256 hash of KYC data)
- Identity is permanently bound to a Stellar wallet address on-chain via the Identity contract
- **One wallet per identity, one identity per wallet** — enforced at the smart contract level
- Identity binding is required before circle operations (create, join, contribute)

### On-Chain Enforcement
- Circle contract verifies identity binding before allowing `create_circle`, `join_circle`, and `contribute`
- Credit contract records payments per unique_id, not per wallet address

## Rate Limiting

### Implementation
- In-memory sliding window rate limiter
- Applied to all mutation endpoints:
  - `/api/circles` POST: 5 requests/min
  - `/api/circles/[id]/join` POST: 5 requests/min
  - `/api/circles/[id]/contribute` POST: 10 requests/min
  - `/api/stellar/submit` POST: 10 requests/min
- Returns HTTP 429 with `Retry-After` header
- Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## HTTP Security Headers

### Content Security Policy (CSP)
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https: blob:;
connect-src 'self' https://*.supabase.co https://soroban-testnet.stellar.org https://accounts.google.com;
frame-ancestors 'none';
```

### Additional Headers
- `X-Frame-Options: DENY` — prevents clickjacking
- `X-Content-Type-Options: nosniff` — prevents MIME sniffing
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## Wallet Security

### Key Management
- **No private keys stored server-side** — all transaction signing happens in the user's Freighter wallet
- Server builds unsigned transaction XDR, sends to frontend for signing
- Signed XDR submitted back to server for broadcast
- Admin and sponsor keys stored in environment variables (never committed to code)

### Transaction Flow
1. Server builds transaction with proper parameters
2. Frontend receives unsigned XDR
3. User signs via Freighter browser extension
4. Signed XDR submitted to `/api/stellar/submit`
5. Server broadcasts to Stellar network

## Smart Contract Security

### Access Controls
- `initialize()`: Can only be called once per contract
- `create_circle()`: Requires identity binding + wallet authorization
- `join_circle()`: Requires identity binding + wallet authorization
- `contribute()`: Requires circle membership + wallet authorization
- `process_payout()`: Open (anyone can trigger when conditions met)
- Admin operations: Require admin wallet signature

### Cross-Contract Authorization
- Circle contract is authorized in Credit contract via `authorize_contract()`
- Only authorized contracts can record payments and update credit scores
- Authorization can be revoked by admin

## Monitoring

### Health Check
- Endpoint: `/api/health` — verifies all system dependencies
- Checks: Environment variables, Supabase connectivity, Soroban RPC, fee sponsorship status, metrics freshness

### Structured Logging
- JSON-structured logs for all API operations
- Error context includes stack traces and request metadata
- Activity tracking via `user_activity` table for audit trail

### Error Boundary
- React Error Boundary catches and reports client-side errors
- Fallback UI prevents blank screens on errors

## Known Limitations

1. **Rate limiting is in-memory**: Resets on serverless function cold starts. For production, migrate to Redis-backed rate limiting.
2. **KYC is placeholder**: Fractal KYC integration is stubbed but not active. Currently uses email-based verification.
3. **Single-sig only**: No multi-signature wallet support at the contract level.
4. **Testnet only**: All contracts deployed on Stellar Testnet. Mainnet deployment requires additional security audit.
5. **No CSRF tokens**: Relies on NextAuth's built-in CSRF protection via secure cookies.

## Compliance

- **Data Privacy**: User data stored in Supabase with RLS. No data shared with third parties.
- **Financial Compliance**: Circle operations use test tokens (HUSD) on testnet. Production deployment will require compliance review.
- **Open Source**: Full source code available for audit on GitHub.
