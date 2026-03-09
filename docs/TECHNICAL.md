# Halo Protocol — Technical Documentation

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  Next.js 16 (React 19) + Tailwind CSS                       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Pages: Dashboard, Circles, Credit, Metrics, Settings    │ │
│  │ Auth: NextAuth.js (Google OAuth + JWT)                  │ │
│  │ Wallet: Freighter API (Transaction Signing)             │ │
│  └─────────────────────────────────────────────────────────┘ │
└────────────────────┬─────────────────────────────────────────┘
                     │ API Routes
┌────────────────────┴─────────────────────────────────────────┐
│                      Backend (API)                            │
│  Next.js API Routes + Supabase Admin Client                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ /api/circles - Circle CRUD + discovery                  │ │
│  │ /api/circles/[id]/join - Join circle                    │ │
│  │ /api/circles/[id]/contribute - Record contribution      │ │
│  │ /api/credit/score - Credit score sync                   │ │
│  │ /api/stellar/submit - Transaction submission + sponsor  │ │
│  │ /api/admin/metrics - Platform analytics                 │ │
│  │ /api/health - System health check                       │ │
│  └─────────────────────────────────────────────────────────┘ │
└────────┬──────────────────────────────────────┬──────────────┘
         │                                      │
┌────────┴────────────┐            ┌────────────┴──────────────┐
│    Supabase          │            │   Stellar / Soroban       │
│  PostgreSQL + RLS    │            │   Testnet (Protocol 25)   │
│  ┌────────────────┐  │            │  ┌──────────────────────┐ │
│  │ users          │  │            │  │ Identity Contract    │ │
│  │ circles        │  │            │  │ Credit Contract      │ │
│  │ memberships    │  │            │  │ Circle Contract      │ │
│  │ contributions  │  │            │  │ HUSD Token (SAC)     │ │
│  │ payouts        │  │            │  └──────────────────────┘ │
│  │ credit_scores  │  │            │                           │
│  │ credit_events  │  │            │  Soroban SDK v25.1.1      │
│  │ user_activity  │  │            │  Stellar SDK 14.5.0       │
│  │ platform_metrics│ │            │                           │
│  └────────────────┘  │            └───────────────────────────┘
└──────────────────────┘
```

## Smart Contracts

### Identity Contract
**Purpose**: Sybil-resistant identity management with permanent wallet binding.

| Method | Access | Description |
|--------|--------|-------------|
| `initialize(admin)` | Once | Set admin address |
| `bind_wallet(unique_id, wallet)` | User | Permanently bind ID to wallet |
| `is_bound(wallet)` | Public | Check if wallet has identity |
| `get_id(wallet)` | Public | Get unique ID for wallet |
| `get_wallet(unique_id)` | Public | Get wallet for ID |

### Credit Contract
**Purpose**: On-chain credit scoring based on payment behavior.

| Method | Access | Description |
|--------|--------|-------------|
| `initialize(admin)` | Once | Set admin address |
| `authorize_contract(contract)` | Admin | Allow contract to update scores |
| `record_payment(unique_id, ...)` | Authorized | Record on-time/late payment |
| `record_missed_payment(unique_id, ...)` | Authorized | Record missed payment |
| `get_score(unique_id)` | Public | Get score (300-850) |
| `get_credit_data(unique_id)` | Public | Get full credit data |
| `get_tier(unique_id)` | Public | Get tier (Building/Fair/Good/Excellent) |

**Score Calculation (300-850)**:
- Payment History: 40% (max 220 pts)
- Circle Completion: 25% (max 137 pts)
- Volume: 15% (max 83 pts)
- Tenure: 10% (max 55 pts)
- Attestation: 10% (max 55 pts, reserved)

### Circle Contract
**Purpose**: ROSCA (Rotating Savings and Credit Association) management.

| Method | Access | Description |
|--------|--------|-------------|
| `create_circle(creator, config)` | User | Create circle with config |
| `join_circle(invite_code, member)` | User | Join via invite code |
| `contribute(circle_id, member)` | Member | Contribute to current round |
| `process_payout(circle_id)` | Anyone | Process payout when all contributed |
| `start_circle(circle_id)` | Creator | Manually start (min 3 members) |

**Circle Lifecycle**: Forming → Active → Completed

## Database Schema

### Core Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User accounts | email, wallet_address, unique_id, kyc_status |
| `circles` | Circle metadata | name, status, contribution_amount, invite_code |
| `memberships` | Circle memberships | user_id, circle_id, payout_position |
| `contributions` | Payment records | circle_id, user_id, period, amount, status |
| `payouts` | Payout history | circle_id, recipient_id, amount |
| `credit_scores` | Cached scores | user_id, score, tier |
| `credit_events` | Score change log | user_id, event_type, points_change |

### Analytics Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `user_activity` | Action tracking | user_id, activity_type, metadata |
| `platform_metrics` | Daily snapshots | date, DAU, WAU, MAU, totals |
| `sponsor_transactions` | Fee sponsorship log | user_id, fee_paid, action_type |

## API Reference

### Authentication
All protected endpoints require a valid NextAuth session cookie.

### Circles
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/circles` | GET | List user's circles + discoverable |
| `/api/circles` | POST | Create new circle |
| `/api/circles/[id]` | GET | Get circle details |
| `/api/circles/[id]/join` | POST | Join a forming circle |
| `/api/circles/[id]/contribute` | POST | Record contribution |
| `/api/circles/by-invite/[code]` | GET | Lookup by invite code |

### Credit
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/credit/score` | GET | Get user's credit score |
| `/api/credit/history` | GET | Get credit event history |

### Stellar
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stellar/submit` | POST | Submit signed transaction (auto-sponsored) |

### Admin
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/metrics` | GET | Get live platform metrics |
| `/api/admin/metrics` | POST | Take daily metrics snapshot |

### System
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | System health check |

## Fee Sponsorship

Halo implements gasless transactions using Stellar's fee-bump mechanism:

1. User signs a transaction with their wallet
2. Server wraps it in a `FeeBumpTransaction` signed by the sponsor account
3. Sponsor pays the network fee (up to 0.02 XLM per transaction)
4. Daily limit: 10 sponsored transactions per user

**Configuration**: Set `SPONSOR_SECRET_KEY` environment variable with a funded Stellar account secret key.

## Data Indexing

User activity is tracked via the `user_activity` table:
- Every login, circle creation, join, and contribution is recorded
- Platform metrics are aggregated from live database queries
- Daily snapshots stored in `platform_metrics` for historical trends
- Credit scores synced from on-chain with 5-minute cache TTL

## Security

See [SECURITY.md](./SECURITY.md) for the complete security checklist.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXTAUTH_URL` | Yes | App URL for OAuth callbacks |
| `NEXTAUTH_SECRET` | Yes | JWT signing secret |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `SOROBAN_RPC_URL` | No | Soroban RPC endpoint (default: testnet) |
| `STELLAR_NETWORK_PASSPHRASE` | No | Network passphrase |
| `IDENTITY_CONTRACT_ADDRESS` | No | Identity contract ID |
| `CREDIT_CONTRACT_ADDRESS` | No | Credit contract ID |
| `CIRCLE_CONTRACT_ADDRESS` | No | Circle contract ID |
| `USDC_CONTRACT_ADDRESS` | No | Token contract ID |
| `SPONSOR_SECRET_KEY` | No | Fee sponsor secret key |
| `ADMIN_EMAILS` | No | Comma-separated admin emails |
