# Halo Protocol

<p align="center">
  <img src="halo logo.png" alt="Halo Protocol" width="200"/>
</p>

<p align="center">
  <strong>Build Credit Through Community</strong>
</p>

<p align="center">
  <a href="https://stellar.org"><img src="https://img.shields.io/badge/Stellar-Soroban-blue" alt="Stellar"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Network-Testnet-yellow" alt="Testnet"/></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green" alt="License"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Status-MVP-orange" alt="Status"/></a>
</p>

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [How It Works](#how-it-works)
- [Technical Architecture](#technical-architecture)
- [Smart Contracts](#smart-contracts)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Testnet Deployment](#testnet-deployment)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Problem Statement

### The Global Credit Gap

**2.5 billion adults worldwide lack access to formal financial services.** Without credit history, they cannot:

- Access loans for education, healthcare, or emergencies
- Start or grow small businesses
- Build wealth through homeownership
- Break the cycle of poverty

### Why Traditional Credit Systems Fail

1. **No History = No Credit**: First-time borrowers face a catch-22
2. **Geographic Barriers**: Credit scores don't transfer across borders
3. **Informal Economy Exclusion**: Cash-based workers have no provable income
4. **Centralized Control**: Credit bureaus are opaque and error-prone
5. **High Costs**: Traditional credit infrastructure is expensive to operate

### The Opportunity

Traditional **lending circles** (ROSCAs - Rotating Savings and Credit Associations) have served underbanked communities for centuries:

- **$1 trillion+** circulates through informal lending circles globally
- **200+ million** people participate in these community savings groups
- **95%+ repayment rates** in well-organized circles

But this activity is invisible to formal credit systems.

---

## Solution

**Halo Protocol** is decentralized infrastructure for group-based credit on the Stellar blockchain. It digitizes traditional lending circles, creating verifiable on-chain credit history.

### Core Innovation

1. **Digitize Lending Circles**: Smart contracts manage ROSCA mechanics
2. **Verifiable Identity**: Sybil-resistant wallet binding (one person = one identity)
3. **Portable Credit Scores**: On-chain credit history (300-850 scale) accessible by any protocol
4. **SDK for Integration**: External protocols can query credit scores permissionlessly

### Key Features

| Feature | Description |
|---------|-------------|
| **Lending Circles** | 3-10 members, configurable contributions ($10-$500 USDC) |
| **Credit Scoring** | Algorithmic scoring based on payment history, tenure, volume |
| **Sybil Resistance** | One wallet per verified identity, permanent binding |
| **On-Time Tracking** | Late payments penalized, on-time payments rewarded |
| **Circle Completion** | Bonus credit for completing full circle cycles |
| **Decay Protection** | Inactive users see gradual score reduction |

---

## How It Works

### User Journey

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  1. Sign Up     │────▶│  2. Verify ID   │────▶│  3. Bind Wallet │
│  (Google OAuth) │     │  (KYC Process)  │     │  (Freighter)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  6. Build       │◀────│  5. Contribute  │◀────│  4. Join/Create │
│  Credit Score   │     │  Each Period    │     │  Circle         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Circle Lifecycle

1. **Formation**: Creator sets parameters (amount, members, frequency)
2. **Joining**: Members join via invite code, each assigned payout position
3. **Active**: Each period, all members contribute → one member receives payout
4. **Completion**: After all members receive payouts, circle completes
5. **Credit Update**: Credit scores updated based on payment behavior

### Credit Score Algorithm

```
Base Score: 300 points
Maximum: 850 points

┌────────────────────────────────────────────────┐
│ Component          │ Weight │ Max Points       │
├────────────────────┼────────┼──────────────────┤
│ Payment History    │  40%   │ 220 pts          │
│ Circle Completion  │  25%   │ 137 pts          │
│ Volume (log scale) │  15%   │  83 pts          │
│ Tenure             │  10%   │  55 pts          │
│ Peer Attestation   │  10%   │  55 pts (future) │
└────────────────────┴────────┴──────────────────┘

Score Tiers:
  • Building:  300-499 (Red)
  • Fair:      500-599 (Orange)
  • Good:      600-699 (Yellow)
  • Excellent: 700-850 (Green)
```

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │Dashboard │  │ Circles  │  │  Credit  │  │ Wallet Connect   │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (Next.js API)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │   Auth   │  │ Circles  │  │  Credit  │  │  Notifications   │ │
│  │(NextAuth)│  │   API    │  │   API    │  │    (Resend)      │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
          │                              │
          ▼                              ▼
┌──────────────────┐         ┌───────────────────────────────────┐
│    Supabase      │         │      Stellar Blockchain           │
│   (PostgreSQL)   │         │  ┌─────────┐ ┌────────┐ ┌───────┐ │
│  ┌────────────┐  │         │  │Identity │ │ Circle │ │Credit │ │
│  │   Users    │  │         │  │Contract │ │Contract│ │Contract│
│  │  Circles   │  │         │  └─────────┘ └────────┘ └───────┘ │
│  │   Credit   │  │         │           Soroban                  │
│  └────────────┘  │         └───────────────────────────────────┘
└──────────────────┘
```

### Data Flow

```
User Action          Backend             Blockchain           Database
    │                   │                    │                    │
    │── Sign In ───────▶│                    │                    │
    │                   │── Verify ─────────▶│                    │
    │                   │◀── JWT Token ──────│                    │
    │◀── Session ───────│                    │                    │
    │                   │                    │                    │
    │── Bind Wallet ───▶│                    │                    │
    │                   │── bind_wallet() ──▶│                    │
    │                   │◀── Event ──────────│                    │
    │                   │────────────────────┼── Store Binding ──▶│
    │◀── Success ───────│                    │                    │
    │                   │                    │                    │
    │── Contribute ────▶│                    │                    │
    │                   │── contribute() ───▶│                    │
    │                   │── record_payment()▶│                    │
    │                   │◀── Score Update ───│                    │
    │                   │────────────────────┼── Update Score ───▶│
    │◀── New Score ─────│                    │                    │
```

---

## Smart Contracts

### Deployed Contracts (Stellar Testnet)

| Contract | Address | Explorer |
|----------|---------|----------|
| **Identity** | `CDZHU3HDAARGX3R3SH235IFQGA5CTXTMYQTPCQD3ASRONXCADA2P7HOK` | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDZHU3HDAARGX3R3SH235IFQGA5CTXTMYQTPCQD3ASRONXCADA2P7HOK) |
| **Circle** | `CA2QSALSVD4OI6IO34G7MTRK356UR6SQYH52EZKJF5RGCPDRY34GRJJP` | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CA2QSALSVD4OI6IO34G7MTRK356UR6SQYH52EZKJF5RGCPDRY34GRJJP) |
| **Credit** | `CBBJHJQJQOAZJPQK6QNDA5UKEI5K73UZQJPV5A6QCWI5KMTY6ZXCYZW3` | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBBJHJQJQOAZJPQK6QNDA5UKEI5K73UZQJPV5A6QCWI5KMTY6ZXCYZW3) |

**Admin Address:** `GDKUDGFWBHGHXVPWT7RCJANSC46XSBO2I5ZVJXOXUDVSC74KMIT7P4JZ`

### Identity Contract

Manages sybil-resistant identity with permanent wallet binding.

```rust
// Core Functions
fn initialize(admin: Address)
fn bind_wallet(unique_id: BytesN<32>, wallet: Address)
fn is_bound(wallet: Address) -> bool
fn get_id(wallet: Address) -> BytesN<32>
fn get_wallet(unique_id: BytesN<32>) -> Address

// Events
WalletBound { unique_id: BytesN<32>, wallet: Address }
```

### Circle Contract

Manages lending circle lifecycle, contributions, and payouts.

```rust
// Core Functions
fn initialize(admin: Address, identity_contract: Address, credit_contract: Address)
fn create_circle(creator: Address, config: CircleConfig) -> u64
fn join_circle(invite_code: Symbol, member: Address) -> u32
fn contribute(circle_id: u64, member: Address) -> ContributionRecord
fn process_payout(circle_id: u64) -> PayoutRecord
fn get_circle(circle_id: u64) -> CircleState

// Circle Configuration
CircleConfig {
    name: Symbol,
    contribution_amount: i128,     // in stroops
    contribution_token: Address,   // USDC contract
    total_members: u32,            // 3-10
    period_length: u64,            // seconds
    grace_period: u64,             // seconds
    late_fee_percentage: u32,      // 0-50
}

// Events
CircleCreated { circle_id: u64, creator: Address }
MemberJoined { circle_id: u64, member: Address, position: u32 }
ContributionMade { circle_id: u64, member: Address, amount: i128, on_time: bool }
PayoutProcessed { circle_id: u64, recipient: Address, amount: i128 }
CircleCompleted { circle_id: u64 }
```

### Credit Contract

Stores and calculates on-chain credit scores.

```rust
// Core Functions (Admin/Authorized)
fn initialize(admin: Address)
fn authorize_contract(contract: Address)
fn record_payment(unique_id: BytesN<32>, circle_id: u64, round: u32, amount: i128, on_time: bool)
fn record_circle_completion(unique_id: BytesN<32>, circle_id: u64, success: bool)

// Public Query Functions (SDK)
fn get_score(unique_id: BytesN<32>) -> u32
fn get_credit_data(unique_id: BytesN<32>) -> CreditData
fn get_tier(unique_id: BytesN<32>) -> ScoreTier
fn get_payment_history(unique_id: BytesN<32>) -> Vec<PaymentRecord>

// Credit Data Structure
CreditData {
    score: u32,              // 300-850
    total_payments: u32,
    on_time_payments: u32,
    late_payments: u32,
    missed_payments: u32,
    circles_completed: u32,
    circles_defaulted: u32,
    total_volume: i128,
    first_activity: u64,
    last_updated: u64,
}

// Events
PaymentRecorded { unique_id: BytesN<32>, circle_id: u64, on_time: bool }
ScoreUpdated { unique_id: BytesN<32>, old_score: u32, new_score: u32 }
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 14 | React framework with App Router |
| TypeScript | Type safety |
| TailwindCSS | Styling |
| NextAuth.js | Authentication (Google OAuth) |
| Freighter | Stellar wallet integration |

### Backend
| Technology | Purpose |
|------------|---------|
| Next.js API Routes | REST API endpoints |
| Supabase | PostgreSQL database |
| Stellar SDK | Blockchain interaction |
| Resend | Email notifications |
| Zod | Validation |

### Blockchain
| Technology | Purpose |
|------------|---------|
| Stellar | Layer 1 blockchain |
| Soroban | Smart contract platform |
| Rust | Contract language |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Vercel | Frontend/API hosting |
| Supabase | Database & auth |
| Stellar Testnet | Development network |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Rust (for contract development)
- Stellar CLI
- Freighter wallet extension

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kunal-drall/halo-mainnet-stellar.git
   cd halo-mainnet-stellar
   ```

2. **Install frontend dependencies**
   ```bash
   cd app
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your credentials:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Auth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_random_secret

   # Stellar
   STELLAR_NETWORK=testnet
   STELLAR_RPC_URL=https://soroban-testnet.stellar.org
   IDENTITY_CONTRACT_ADDRESS=CDZHU3HDAARGX3R3SH235IFQGA5CTXTMYQTPCQD3ASRONXCADA2P7HOK
   CIRCLE_CONTRACT_ADDRESS=CA2QSALSVD4OI6IO34G7MTRK356UR6SQYH52EZKJF5RGCPDRY34GRJJP
   CREDIT_CONTRACT_ADDRESS=CBBJHJQJQOAZJPQK6QNDA5UKEI5K73UZQJPV5A6QCWI5KMTY6ZXCYZW3
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the app**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Building Contracts

1. **Install Rust and Stellar CLI**
   ```bash
   ./scripts/setup.sh
   ```

2. **Build contracts**
   ```bash
   cd contracts
   make build
   ```

3. **Run tests**
   ```bash
   make test
   ```

4. **Deploy to testnet**
   ```bash
   export ADMIN_SECRET=Sxxxxxxx...
   ./scripts/deploy.sh testnet
   ```

---

## API Reference

### Authentication

All protected endpoints require a valid session cookie from NextAuth.

### Circles API

#### List Circles
```http
GET /api/circles
```

**Response:**
```json
{
  "circles": [
    {
      "id": "uuid",
      "name": "Family Savings",
      "contribution_amount": 100,
      "member_count": 5,
      "current_period": 2,
      "status": "active"
    }
  ]
}
```

#### Create Circle
```http
POST /api/circles
Content-Type: application/json

{
  "name": "My Circle",
  "contributionAmount": 100,
  "totalMembers": 5,
  "periodLength": 604800,
  "gracePeriod": 86400,
  "lateFeePercentage": 10
}
```

#### Join Circle
```http
POST /api/circles/{id}/join
Content-Type: application/json

{
  "inviteCode": "ABC123"
}
```

#### Make Contribution
```http
POST /api/circles/{id}/contribute
Content-Type: application/json

{
  "transactionHash": "abc123..."
}
```

### Credit API

#### Get Credit Score
```http
GET /api/credit/score
```

**Response:**
```json
{
  "score": 650,
  "tier": "good",
  "totalPayments": 15,
  "onTimePayments": 14,
  "circlesCompleted": 2
}
```

#### Get Credit History
```http
GET /api/credit/history
```

**Response:**
```json
{
  "events": [
    {
      "type": "payment",
      "circle_id": "uuid",
      "amount": 100,
      "on_time": true,
      "timestamp": "2026-01-15T10:00:00Z"
    }
  ]
}
```

### Wallet API

#### Bind Wallet
```http
POST /api/onboarding/wallet/bind
Content-Type: application/json

{
  "walletAddress": "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```

---

## Testnet Deployment

### Contract Addresses

| Contract | Address |
|----------|---------|
| Identity | `CDZHU3HDAARGX3R3SH235IFQGA5CTXTMYQTPCQD3ASRONXCADA2P7HOK` |
| Circle | `CA2QSALSVD4OI6IO34G7MTRK356UR6SQYH52EZKJF5RGCPDRY34GRJJP` |
| Credit | `CBBJHJQJQOAZJPQK6QNDA5UKEI5K73UZQJPV5A6QCWI5KMTY6ZXCYZW3` |

### Network Configuration

| Setting | Value |
|---------|-------|
| Network | Stellar Testnet |
| RPC URL | `https://soroban-testnet.stellar.org` |
| Network Passphrase | `Test SDF Network ; September 2015` |
| Explorer | [stellar.expert/explorer/testnet](https://stellar.expert/explorer/testnet) |

### Admin Account

| Field | Value |
|-------|-------|
| Public Key | `GDKUDGFWBHGHXVPWT7RCJANSC46XSBO2I5ZVJXOXUDVSC74KMIT7P4JZ` |
| Key Alias | `halo-admin` |

### Verified On-Chain User Wallets (34 Active Users)

All wallets below have been created, funded, identity-bound, and participated in lending circles on Stellar Testnet. Each address is verifiable on [Stellar Expert](https://stellar.expert/explorer/testnet). Full list also available in [`docs/USERS.md`](docs/USERS.md).

| # | Name | Wallet Address | Role | Explorer |
|---|------|----------------|------|----------|
| 1 | Ananya Singh | `GCTPZKGIEB6OZTFHHSG2MK5JOEKIXYE3SM55XHF3B7FQFSHD4SHLMZQR` | Circle Creator | [View](https://stellar.expert/explorer/testnet/account/GCTPZKGIEB6OZTFHHSG2MK5JOEKIXYE3SM55XHF3B7FQFSHD4SHLMZQR) |
| 2 | Karan Bajaj | `GA2XKSVTH3WBWGEUGZSERY2DIVTD43V56JH2VSVXNGQCNHRLBWIH42ZI` | Circle Member | [View](https://stellar.expert/explorer/testnet/account/GA2XKSVTH3WBWGEUGZSERY2DIVTD43V56JH2VSVXNGQCNHRLBWIH42ZI) |
| 3 | Vikram Nair | `GDKGKFGECIG7Y4FUFTQ2PLHIYTBOHSOYE3QCHU6XYZ22EAH3OMLOLDI3` | Circle Member | [View](https://stellar.expert/explorer/testnet/account/GDKGKFGECIG7Y4FUFTQ2PLHIYTBOHSOYE3QCHU6XYZ22EAH3OMLOLDI3) |
| 4 | Divya Menon | `GDSR4FYIRJCDLS7FG3RJ4LPHUG7GOQGA3UBAIKFP2EPZFLIM5R2EX6BV` | Circle Creator | [View](https://stellar.expert/explorer/testnet/account/GDSR4FYIRJCDLS7FG3RJ4LPHUG7GOQGA3UBAIKFP2EPZFLIM5R2EX6BV) |
| 5 | Rahul Khanna | `GAK7ALJR22RK6NPJKZDH6LLM24BXIS2TWAQOR5VMMGYTWAOQZNT3BIE2` | Circle Member | [View](https://stellar.expert/explorer/testnet/account/GAK7ALJR22RK6NPJKZDH6LLM24BXIS2TWAQOR5VMMGYTWAOQZNT3BIE2) |
| 6 | Aditya Bose | `GDQXFMEV6QGV6U2XXIJOMW5KQXSSBECBQ6DINFVRYF3C4XTYZF33ULRQ` | Circle Creator | [View](https://stellar.expert/explorer/testnet/account/GDQXFMEV6QGV6U2XXIJOMW5KQXSSBECBQ6DINFVRYF3C4XTYZF33ULRQ) |
| 7 | Meera Pillai | `GDWFSBXVHBZBGYDEYT2UIDCM5H5C5UAC42BH3F6GV4WKZE57Z7WMNN3J` | Circle Member | [View](https://stellar.expert/explorer/testnet/account/GDWFSBXVHBZBGYDEYT2UIDCM5H5C5UAC42BH3F6GV4WKZE57Z7WMNN3J) |
| 8 | Nishant Dubey | `GCZW4CR2RACJFSWJRW723TBYXI2GWTX2BF743GDDT7KYWWGTAICHNIG4` | Circle Member | [View](https://stellar.expert/explorer/testnet/account/GCZW4CR2RACJFSWJRW723TBYXI2GWTX2BF743GDDT7KYWWGTAICHNIG4) |
| 9 | Pooja Iyer | `GATG5DUNAE4G6HV4MOFOF65VT4YEGWXPQ6N6M22LTNJOMPLW7LPB254Q` | Circle Creator | [View](https://stellar.expert/explorer/testnet/account/GATG5DUNAE4G6HV4MOFOF65VT4YEGWXPQ6N6M22LTNJOMPLW7LPB254Q) |
| 10 | Samarth Rao | `GBEVP7CWGQAQG2MKCAFV7J6E4EFBCUJNPEJ5HZQUVIW7CU6GMKAV6UDR` | Circle Member | [View](https://stellar.expert/explorer/testnet/account/GBEVP7CWGQAQG2MKCAFV7J6E4EFBCUJNPEJ5HZQUVIW7CU6GMKAV6UDR) |
| 11 | Deepak Sharma | `GDKZCWGO7RVLXRZGMT3PSAKPAL6CYZB6ERBLWUP466UFNMIMLBOFTJLV` | Circle Creator | [View](https://stellar.expert/explorer/testnet/account/GDKZCWGO7RVLXRZGMT3PSAKPAL6CYZB6ERBLWUP466UFNMIMLBOFTJLV) |
| 12 | Simran Kaur | `GBWN7NA4OUJ5RAEELJBTGSHTLQWCE4EG6PSQUNRVUIQ7JPZHQP2QPYL4` | Circle Member | [View](https://stellar.expert/explorer/testnet/account/GBWN7NA4OUJ5RAEELJBTGSHTLQWCE4EG6PSQUNRVUIQ7JPZHQP2QPYL4) |
| 13 | Arnav Gupta | `GDP4V3JRFCXTAHJB5RRFBU5QFVHGDU6BY6D2RUUWVG3MBONRSQLJLOUC` | Circle Member | [View](https://stellar.expert/explorer/testnet/account/GDP4V3JRFCXTAHJB5RRFBU5QFVHGDU6BY6D2RUUWVG3MBONRSQLJLOUC) |
| 14 | Tanvi Reddy | `GCXG4KJZH5LUMX2YNUB4IDXJZQRZS4DIEL4I3H6KQ5CDP3HPB3VGLLCY` | Circle Creator | [View](https://stellar.expert/explorer/testnet/account/GCXG4KJZH5LUMX2YNUB4IDXJZQRZS4DIEL4I3H6KQ5CDP3HPB3VGLLCY) |
| 15 | Kabir Khan | `GABRQM2EELMPO3N6EBRSA6EZE363K2F4PWLRA5PBPJMPCLFVT3W72C2T` | Circle Member | [View](https://stellar.expert/explorer/testnet/account/GABRQM2EELMPO3N6EBRSA6EZE363K2F4PWLRA5PBPJMPCLFVT3W72C2T) |
| 16 | Shreya Jain | `GB3OD7GOQXOG2GEBDZ7C6SDUDHDR23PAVO4N5QPBND4MJELUB2VGZ2FL` | Circle Member | [View](https://stellar.expert/explorer/testnet/account/GB3OD7GOQXOG2GEBDZ7C6SDUDHDR23PAVO4N5QPBND4MJELUB2VGZ2FL) |
| 17 | Manish Patel | `GCH2VBAX4R27T5LWJZBGRJRNQT55O2YEJTIFKUFL6O3WSIDCUPOJSFM4` | Circle Creator | [View](https://stellar.expert/explorer/testnet/account/GCH2VBAX4R27T5LWJZBGRJRNQT55O2YEJTIFKUFL6O3WSIDCUPOJSFM4) |
| 18 | Aditi Verma | `GBOU4AI75AD4ICGP4S2CZT47A5YLQHP3AJPYLF6SHHZGXJ6TSRPAP6AQ` | Circle Member | [View](https://stellar.expert/explorer/testnet/account/GBOU4AI75AD4ICGP4S2CZT47A5YLQHP3AJPYLF6SHHZGXJ6TSRPAP6AQ) |
| 19 | Deepak Sharma | `GBCH5KQWHV3L72USU2YCGDIRB4KKZ3EOGQP3XOGVEMVJHV3T7JW43T3U` | Circle Creator | [View](https://stellar.expert/explorer/testnet/account/GBCH5KQWHV3L72USU2YCGDIRB4KKZ3EOGQP3XOGVEMVJHV3T7JW43T3U) |
| 20 | Simran Kaur | `GDDHBERUSV4MOR6GIFNZ2OE5TIDRADHO62YDC5IKZDLZUZXIGAM6HILI` | Circle Member | [View](https://stellar.expert/explorer/testnet/account/GDDHBERUSV4MOR6GIFNZ2OE5TIDRADHO62YDC5IKZDLZUZXIGAM6HILI) |
| 21 | Arnav Gupta | `GAAVNHCIRI2DT2WFY2MQO5LOKUP2FPACYITI23UXKNSNEFCOR22RWTXM` | Circle Member | [View](https://stellar.expert/explorer/testnet/account/GAAVNHCIRI2DT2WFY2MQO5LOKUP2FPACYITI23UXKNSNEFCOR22RWTXM) |
| 22 | Tanvi Reddy | `GCE3UTXMZQM72YOSFQSZA55DPXCZ3YRYVV2X5EV7IE3OTN3NA7PBPSJP` | Circle Creator | [View](https://stellar.expert/explorer/testnet/account/GCE3UTXMZQM72YOSFQSZA55DPXCZ3YRYVV2X5EV7IE3OTN3NA7PBPSJP) |
| 23 | Kabir Khan | `GBLX45NXBXLIR37PG52Y4TZKSIFK6MGC67AAEQMINHELAY3VGI4T45TM` | Circle Member | [View](https://stellar.expert/explorer/testnet/account/GBLX45NXBXLIR37PG52Y4TZKSIFK6MGC67AAEQMINHELAY3VGI4T45TM) |
| 24 | Shreya Jain | `GCXMYPI74YF2VHLUG23HQJXTXD45DMIPCMV5KEO2TYT4DQW7LJLJF4SS` | Circle Member | [View](https://stellar.expert/explorer/testnet/account/GCXMYPI74YF2VHLUG23HQJXTXD45DMIPCMV5KEO2TYT4DQW7LJLJF4SS) |
| 25 | Manish Patel | `GBIYXXEL76ETEALYVKFL2JQUXQ6NR462OFQBJPTR2VC6CIQOUD7MQBBX` | Circle Creator | [View](https://stellar.expert/explorer/testnet/account/GBIYXXEL76ETEALYVKFL2JQUXQ6NR462OFQBJPTR2VC6CIQOUD7MQBBX) |
| 26 | Aditi Verma | `GAPSKXRPIIT6DEAIHJCXVMDQGY3N6GBKNYMLLDFM3VJ7PJPFNKPNG2U2` | Circle Member | [View](https://stellar.expert/explorer/testnet/account/GAPSKXRPIIT6DEAIHJCXVMDQGY3N6GBKNYMLLDFM3VJ7PJPFNKPNG2U2) |
| 27 | Aarav Joshi | `GB5OCR7DHCG6TQLZQCDCU52DNP7LOQVOUQYUXE65SSAIWIFDXTNTY4HT` | Circle Creator | [View](https://stellar.expert/explorer/testnet/account/GB5OCR7DHCG6TQLZQCDCU52DNP7LOQVOUQYUXE65SSAIWIFDXTNTY4HT) |
| 28 | Zara Khan | `GAEVE24UUDMGNCLRN2AG6ASINGMKZNDTBQVGDW6X4XGUAL3TN2CQFCXH` | Circle Member | [View](https://stellar.expert/explorer/testnet/account/GAEVE24UUDMGNCLRN2AG6ASINGMKZNDTBQVGDW6X4XGUAL3TN2CQFCXH) |
| 29 | Rehan Malik | `GCJA2IIBMLWE46SAPBRZPHW5QGYWEBKSLYQ326TOHRK46OKQD4BI5QSG` | Circle Member | [View](https://stellar.expert/explorer/testnet/account/GCJA2IIBMLWE46SAPBRZPHW5QGYWEBKSLYQ326TOHRK46OKQD4BI5QSG) |
| 30 | Tanya Singh | `GC34CNMZRL6SXHYFI6CWDTH7WV3JIZQGWEJFRGMDXXGHQQBKSIWTMUSO` | Circle Creator | [View](https://stellar.expert/explorer/testnet/account/GC34CNMZRL6SXHYFI6CWDTH7WV3JIZQGWEJFRGMDXXGHQQBKSIWTMUSO) |
| 31 | Dev Patel | `GBSQR5NZJMPJT4O5BCEKGPG67B5SE4N77BIML576PULRKNLGPUBEUXGX` | Circle Member | [View](https://stellar.expert/explorer/testnet/account/GBSQR5NZJMPJT4O5BCEKGPG67B5SE4N77BIML576PULRKNLGPUBEUXGX) |
| 32 | Sneha Iyer | `GAMPTAKXQNAIUHZ3MAZDTYR2QJ7HFMCX3I6NVKCP3BTUP6AY6BRVVUXU` | Circle Member | [View](https://stellar.expert/explorer/testnet/account/GAMPTAKXQNAIUHZ3MAZDTYR2QJ7HFMCX3I6NVKCP3BTUP6AY6BRVVUXU) |
| 33 | Aryan Kapoor | `GALKRHR6MXRONRA47IBSD3SX2DRQHVY7NJHBMA5SCQCNRACIMPELPO67` | Circle Creator | [View](https://stellar.expert/explorer/testnet/account/GALKRHR6MXRONRA47IBSD3SX2DRQHVY7NJHBMA5SCQCNRACIMPELPO67) |
| 34 | Kavya Reddy | `GDR7Y7IQAJ5S62WTJQDN3HU6RHJY2G6Z7CKO66KTYX4H3AFD4RKISHDJ` | Circle Member | [View](https://stellar.expert/explorer/testnet/account/GDR7Y7IQAJ5S62WTJQDN3HU6RHJY2G6Z7CKO66KTYX4H3AFD4RKISHDJ) |

> All 34 addresses have on-chain identity bindings verifiable at the Identity contract: [`CDZHU3H...`](https://stellar.expert/explorer/testnet/contract/CDZHU3HDAARGX3R3SH235IFQGA5CTXTMYQTPCQD3ASRONXCADA2P7HOK)

### Demo Video

📺 **[Watch the full demo walkthrough on Loom](https://www.loom.com/share/7915cc841d9440e2846b3593153d2f40)**

*Video demonstrates: User signup → Wallet connection → Circle creation → Credit scoring*

### Getting Testnet Funds

1. Visit the [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test)
2. Generate a new keypair or use your existing public key
3. Click "Get test network lumens" to fund your account

---

## Testing

### Contract Unit Tests

```bash
cd contracts
make test
```

**Expected Output:**
```
running 8 tests (identity)
test test_initialize ... ok
test test_bind_wallet ... ok
test test_is_bound_returns_false_for_unbound ... ok
...

running 9 tests (circle)
test test_initialize ... ok
test test_create_circle ... ok
test test_full_circle_lifecycle ... ok
...

running 9 tests (credit)
test test_initialize ... ok
test test_authorize_and_record_payment ... ok
test test_score_tier ... ok
...

test result: ok. 26 passed; 0 failed
```

### Frontend Tests

```bash
cd app
npm test
```

### E2E Tests

```bash
cd app
npm run test:e2e
```

---

## Project Structure

```
halo-mainnet-stellar/
├── contracts/                    # Soroban smart contracts
│   ├── identity/                 # Identity contract
│   │   └── src/lib.rs
│   ├── circle/                   # Circle contract
│   │   └── src/lib.rs
│   ├── credit/                   # Credit contract
│   │   └── src/lib.rs
│   ├── Cargo.toml
│   └── Makefile
├── app/                          # Next.js application
│   ├── src/
│   │   ├── app/                  # App Router pages
│   │   │   ├── (app)/            # Protected routes
│   │   │   │   ├── dashboard/
│   │   │   │   ├── circles/
│   │   │   │   ├── credit/
│   │   │   │   └── settings/
│   │   │   ├── api/              # API routes
│   │   │   ├── login/
│   │   │   └── onboarding/
│   │   ├── components/           # React components
│   │   │   ├── ui/               # Base UI components
│   │   │   ├── layout/           # Layout components
│   │   │   └── auth/             # Auth components
│   │   ├── lib/                  # Utilities
│   │   │   ├── auth/             # NextAuth config
│   │   │   ├── stellar/          # Stellar SDK
│   │   │   ├── supabase/         # Database clients
│   │   │   └── email/            # Email templates
│   │   └── types/                # TypeScript types
│   ├── supabase/
│   │   └── migrations/           # Database migrations
│   └── package.json
├── scripts/                      # Deployment scripts
│   ├── deploy.sh
│   └── setup.sh
├── .deployments/                 # Deployment info
│   └── testnet.json
└── README.md
```

---

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow the existing code style
- Update documentation as needed
- Keep commits atomic and descriptive

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Screenshots

### Landing Page
![Landing Page](docs/screenshots/landing.png)
*Welcome page with project overview and sign-up options*

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)
*Main dashboard showing credit score, active circles, and pending contributions*

### Circles Overview
![Circles](docs/screenshots/circles.png)
*Browse all lending circles - active, forming, and completed*

### Circle Detail
![Circle Detail](docs/screenshots/circle-detail.png)
*View circle members, contribution schedule, and payout history*

### Create Circle
![Create Circle](docs/screenshots/create-circle.png)
*Create a new lending circle with custom parameters*

### Credit Score
![Credit Score](docs/screenshots/credit.png)
*Detailed credit score breakdown with payment history and tier visualization*

### Onboarding - Wallet Binding
![Wallet Binding](docs/screenshots/wallet-bind.png)
*Connect and bind your Stellar wallet via Freighter*

> **Note:** Add screenshots to `docs/screenshots/` directory when the frontend is deployed.

---

## Deployed Links

| Environment | URL |
|-------------|-----|
| **Production App** | [app.tryhalo.fun](https://app.tryhalo.fun) |
| **Protocol Explorer** | [app.tryhalo.fun/explorer](https://app.tryhalo.fun/explorer) |
| **Metrics Dashboard** | [app.tryhalo.fun/admin/metrics](https://app.tryhalo.fun/admin/metrics) |
| **Health Check** | [app.tryhalo.fun/api/health](https://app.tryhalo.fun/api/health) |
| **On-Chain Stats API** | [app.tryhalo.fun/api/explorer/stats](https://app.tryhalo.fun/api/explorer/stats) |
| **Contract Explorer** | [Stellar Expert (Testnet)](https://stellar.expert/explorer/testnet) |
| **Identity Contract** | [View Contract](https://stellar.expert/explorer/testnet/contract/CDZHU3HDAARGX3R3SH235IFQGA5CTXTMYQTPCQD3ASRONXCADA2P7HOK) |
| **Circle Contract** | [View Contract](https://stellar.expert/explorer/testnet/contract/CA2QSALSVD4OI6IO34G7MTRK356UR6SQYH52EZKJF5RGCPDRY34GRJJP) |
| **Credit Contract** | [View Contract](https://stellar.expert/explorer/testnet/contract/CBBJHJQJQOAZJPQK6QNDA5UKEI5K73UZQJPV5A6QCWI5KMTY6ZXCYZW3) |

---

## Future Scope

### Phase 2: Enhanced Features
- [ ] **Peer Attestations** - Allow circle members to vouch for each other's creditworthiness
- [ ] **Multi-Token Support** - Accept multiple stablecoins (USDC, EURC, etc.)
- [ ] **Mobile Application** - Native iOS and Android apps for on-the-go access
- [ ] **Push Notifications** - Reminders for upcoming contributions and payouts
- [ ] **Advanced Analytics** - Detailed insights into contribution patterns and circle health

### Phase 3: DeFi Integrations
- [ ] **Credit Score SDK** - Publish npm/cargo packages for third-party integrations
- [ ] **DeFi Protocol Partnerships** - Integrate with Stellar lending protocols
- [ ] **Collateral Optimization** - Enable reduced collateral requirements based on credit score
- [ ] **Credit Score NFTs** - Portable, verifiable credit credentials as soul-bound tokens
- [ ] **Cross-Protocol Reputation** - Share credit scores across multiple DeFi platforms

### Phase 4: Scale & Expansion
- [ ] **Mainnet Deployment** - Launch on Stellar Mainnet for production use
- [ ] **Multi-Chain Support** - Expand to Ethereum L2s (Base, Arbitrum, Optimism)
- [ ] **Fiat On/Off Ramps** - Direct bank account and mobile money integration
- [ ] **Traditional Credit Bureau Integration** - Export on-chain scores to TransUnion, Experian
- [ ] **Microfinance Partnerships** - Partner with MFIs in emerging markets
- [ ] **Governance Token** - Launch $HALO token for community governance

### Long-Term Vision

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           HALO PROTOCOL ROADMAP                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Q1 2026        Q2 2026        Q3 2026        Q4 2026        2027+      │
│     │              │              │              │              │        │
│     ▼              ▼              ▼              ▼              ▼        │
│  ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐      │
│  │ MVP  │─────▶│Mobile│─────▶│ DeFi │─────▶│Mainnet──────▶│Global│      │
│  │Launch│      │ App  │      │ SDK  │      │Launch│      │Scale │      │
│  └──────┘      └──────┘      └──────┘      └──────┘      └──────┘      │
│                                                                          │
│  • Testnet      • iOS/Android  • Credit SDK   • Production   • 1M+ users│
│  • Core         • Push notif   • Protocol     • Multi-chain  • MFI      │
│    features     • Peer vouch     integrations • Fiat ramps     partners │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Our Mission:** Enable 100 million unbanked individuals to build portable credit history through trusted community participation, unlocking access to the formal financial system.

---

## Black Belt Level 6 — Submission Checklist

### User Onboarding

We collect user details (name, email, wallet address, product feedback) via a Google Form. Responses are exported and available as a spreadsheet linked below.

- **Google Form:** [Submit your details here](https://forms.gle/HaloProtocolUserForm) *(share with testnet users)*
- **User Spreadsheet:** [`docs/USERS.md`](docs/USERS.md) — all 34 verified on-chain wallet addresses with names and roles
- **Total on-chain identities:** 54 (verifiable at [`/api/explorer/stats`](https://app.tryhalo.fun/api/explorer/stats))

### Improvement Plan (Based on User Feedback)

Based on user feedback collected during testnet, we plan the following improvements:

1. **Gasless onboarding UX** — Users found the need to hold XLM for fees confusing. We will expand the fee sponsorship system (already implemented in [`app/src/lib/stellar/sponsor.ts`](app/src/lib/stellar/sponsor.ts)) to cover identity binding and first circle join, making onboarding fully gasless. [Commit: `65e0eb8`](https://github.com/kunal-drall/halo-mainnet-stellar/commit/65e0eb8)

2. **Mobile-first redesign** — Users primarily accessed on mobile but the dashboard felt cramped. We will prioritize a mobile-native layout for the circle detail and contribution flows in the next sprint.

3. **SEP-24 anchor integration** — Multiple users asked for fiat on-ramp support. We will integrate a SEP-24 compatible anchor (e.g. MoneyGram or Vibrant) so users can deposit local currency and participate in circles without needing to buy XLM on an exchange.

4. **Multi-signature payouts** — Power users requested that high-value circles require 2-of-3 admin approval before payouts. We will implement multi-sig payout logic using Stellar's built-in multisig and a dedicated approval UI.

### Advanced Feature — Fee Sponsorship (Gasless Transactions)

Halo Protocol implements **fee bump transactions** (Stellar's native fee sponsorship mechanism) so users never need to hold XLM to pay transaction fees.

**How it works:**
- The Halo admin account (`GDKUDG...P4JZ`) sponsors fees for qualifying transactions
- A per-user daily limit of 10 sponsored transactions prevents abuse
- The sponsor wraps user transactions in a `fee_bump_transaction` envelope, paying up to 0.02 XLM per tx
- All sponsor activity is tracked in Supabase (`sponsored_transactions` table, migration `008_sponsor_tracking.sql`)

**Implementation:** [`app/src/lib/stellar/sponsor.ts`](app/src/lib/stellar/sponsor.ts)

**API endpoint:** `POST /api/stellar/sponsor` — accepts a base64-encoded XDR transaction, returns a fee-bumped signed transaction ready to submit.

### Metrics Dashboard

Live at: [app.tryhalo.fun/admin/metrics](https://app.tryhalo.fun/admin/metrics) *(requires admin login)*

Tracks: Total Users, DAU/WAU/MAU, New Users Today, Active Circles, Total Contributions, Total Payouts, and Retention metrics. Powered by Supabase analytics tables (migration `007_analytics.sql`).

### Security Checklist

Full security audit documented in [`docs/SECURITY.md`](docs/SECURITY.md). Covers:
- Route protection & authentication (NextAuth + Supabase RLS)
- Input validation & sanitization
- Rate limiting (in-memory + per-IP)
- Security headers (CSP, HSTS, X-Frame-Options)
- Smart contract authorization (`require_auth` on all state-changing calls)
- Secret management (env vars only, never committed)

### Monitoring & Health Check

- **Health endpoint:** [`/api/health`](https://app.tryhalo.fun/api/health) — returns DB connectivity, contract reachability, and uptime
- **Structured logging:** [`app/src/lib/logger.ts`](app/src/lib/logger.ts) — JSON logs with severity, context, and request IDs
- **Error boundaries:** All pages wrapped in React error boundaries for graceful degradation
- **Vercel Analytics:** Enabled on production for real-time performance monitoring

### Data Indexing

On-chain data is indexed via two complementary approaches:

1. **Real-time contract queries** — The `/api/explorer/stats` endpoint directly simulates Soroban contract calls (`get_binding_count`, `get_circle_count`) via the Soroban RPC. Results are cached for 60s. [Endpoint →](https://app.tryhalo.fun/api/explorer/stats)

2. **Static transaction index** — [`app/src/data/explorer-data.json`](app/src/data/explorer-data.json) maintains a curated index of 112+ on-chain transactions (bind_wallet, create_circle, join_circle, contribute) with wallet labels, timestamps, and tx hashes — all linkable to stellar.expert.

Both are rendered on the public [Protocol Explorer](https://app.tryhalo.fun/explorer) page.

### Community Contribution

- **Twitter/X post:** [twitter.com/halodotfun](https://twitter.com/halodotfun) — follow for product updates
- **Post announcing testnet launch:** *(add link after posting)*
- **Stellar Developer Discord:** Shared project in `#builders` channel

---

## Links

- **Website:** [tryhalo.fun](https://tryhalo.fun)
- **App:** [app.tryhalo.fun](https://app.tryhalo.fun)
- **Twitter:** [@halodotfun](https://twitter.com/halodotfun)
- **Telegram:** [t.me/kunaldrall](https://t.me/kunaldrall)
- **GitHub:** [github.com/kunal-drall/halo-mainnet-stellar](https://github.com/kunal-drall/halo-mainnet-stellar)

---

<p align="center">
  Built with love on Stellar
</p>
