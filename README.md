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
| **Identity** | `CBRQ7VYKMCNVBT5OGEQLDCNXUWE4OUWAP4BBIZ4MUHLVUD42JDQ5DWGY` | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBRQ7VYKMCNVBT5OGEQLDCNXUWE4OUWAP4BBIZ4MUHLVUD42JDQ5DWGY) |
| **Circle** | `CDNSZTY4IIJ7Y45FDVRHTTUKLIXNM7P53ZWX3FQ7GHKJ23LSLF4TTJ33` | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDNSZTY4IIJ7Y45FDVRHTTUKLIXNM7P53ZWX3FQ7GHKJ23LSLF4TTJ33) |
| **Credit** | `CCVZS2N5RBE5O6EBKQ2UW6M3EPGYU4VPTLDV3PMZEUX3PCHI4K42N6GH` | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CCVZS2N5RBE5O6EBKQ2UW6M3EPGYU4VPTLDV3PMZEUX3PCHI4K42N6GH) |

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
   IDENTITY_CONTRACT_ADDRESS=CBRQ7VYKMCNVBT5OGEQLDCNXUWE4OUWAP4BBIZ4MUHLVUD42JDQ5DWGY
   CIRCLE_CONTRACT_ADDRESS=CDNSZTY4IIJ7Y45FDVRHTTUKLIXNM7P53ZWX3FQ7GHKJ23LSLF4TTJ33
   CREDIT_CONTRACT_ADDRESS=CCVZS2N5RBE5O6EBKQ2UW6M3EPGYU4VPTLDV3PMZEUX3PCHI4K42N6GH
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
| Identity | `CBRQ7VYKMCNVBT5OGEQLDCNXUWE4OUWAP4BBIZ4MUHLVUD42JDQ5DWGY` |
| Circle | `CDNSZTY4IIJ7Y45FDVRHTTUKLIXNM7P53ZWX3FQ7GHKJ23LSLF4TTJ33` |
| Credit | `CCVZS2N5RBE5O6EBKQ2UW6M3EPGYU4VPTLDV3PMZEUX3PCHI4K42N6GH` |

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

### Test User Wallets (SCF Verification)

These wallets have been created and funded on Stellar Testnet for testing the Halo Protocol:

| User | Wallet Address | Explorer |
|------|----------------|----------|
| Test User 1 | `GC3RA35EVMM5XAUKWDFFZK5PCX63D5PGIJ7T3VO2S5SIBNXRLKIU2LU2` | [View](https://stellar.expert/explorer/testnet/account/GC3RA35EVMM5XAUKWDFFZK5PCX63D5PGIJ7T3VO2S5SIBNXRLKIU2LU2) |
| Test User 2 | `GBEAR66DQUXKVM26SYTPEJEDJQ3GWEOZVPGHXUENMH5C3CXYHSB7A5VJ` | [View](https://stellar.expert/explorer/testnet/account/GBEAR66DQUXKVM26SYTPEJEDJQ3GWEOZVPGHXUENMH5C3CXYHSB7A5VJ) |
| Test User 3 | `GCISCF7WIKWAOIFL35OXZDG5PIWBES6HWDQN6BRYNAVSKHHZ7QO7VX64` | [View](https://stellar.expert/explorer/testnet/account/GCISCF7WIKWAOIFL35OXZDG5PIWBES6HWDQN6BRYNAVSKHHZ7QO7VX64) |
| Test User 4 | `GAHVBABYJNDFBYE6HQBQLC34TGPBQNTNMIML32WAS7H2Y4VOQH3VSRBK` | [View](https://stellar.expert/explorer/testnet/account/GAHVBABYJNDFBYE6HQBQLC34TGPBQNTNMIML32WAS7H2Y4VOQH3VSRBK) |
| Test User 5 | `GA75N4SUB43SEM434U5LZZX5TF7OSCJRMZONRFF5OQ3TO7F3ZWK4FWH6` | [View](https://stellar.expert/explorer/testnet/account/GA75N4SUB43SEM434U5LZZX5TF7OSCJRMZONRFF5OQ3TO7F3ZWK4FWH6) |

### Demo Video

📺 **[Watch the full demo walkthrough on Loom](https://www.loom.com/share/YOUR_VIDEO_ID)**

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
| **Production App** | [usehalo.fun](https://usehalo.fun) |
| **Contract Explorer** | [Stellar Expert (Testnet)](https://stellar.expert/explorer/testnet) |
| **Identity Contract** | [View Contract](https://stellar.expert/explorer/testnet/contract/CBRQ7VYKMCNVBT5OGEQLDCNXUWE4OUWAP4BBIZ4MUHLVUD42JDQ5DWGY) |
| **Circle Contract** | [View Contract](https://stellar.expert/explorer/testnet/contract/CDNSZTY4IIJ7Y45FDVRHTTUKLIXNM7P53ZWX3FQ7GHKJ23LSLF4TTJ33) |
| **Credit Contract** | [View Contract](https://stellar.expert/explorer/testnet/contract/CCVZS2N5RBE5O6EBKQ2UW6M3EPGYU4VPTLDV3PMZEUX3PCHI4K42N6GH) |

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

## Links

- **Website:** [usehalo.fun](https://tryhalo.fun)
- **Twitter:** [@halodotfun](https://twitter.com/halodotfun)
- **Telegram:** [t.me/kunaldrall](https://t.me/kunaldrall)
- **GitHub:** [github.com/kunal-drall/halo](https://github.com/kunal-drall/halo-mainnet-stellar)

---

<p align="center">
  Built with love on Stellar
</p>
