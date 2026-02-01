# Product Requirements Document (PRD)
## Halo Protocol — Trust-Based Credit Infrastructure
Built on Stellar & Soroban

---

## 1. Overview

### 1.1 Product Name
**Halo**

### 1.2 Product Type
- App-first financial application
- Evolves into protocol-level credit infrastructure

### 1.3 One-Liner
Halo enables groups to save and lend together using programmable trust, creating on-chain credit profiles that power global financial products.

---

## 2. Problem Statement

### 2.1 User Problem
- Groups already save and lend together informally
- No system enforces fairness, transparency, or portability of trust
- Traditional banks ignore group credit
- DeFi requires over-collateralization and crypto-native behavior

### 2.2 Business Problem
- No native credit primitive exists for:
  - Group-based finance
  - Thin-file users
  - Cross-border communities

---

## 3. Product Vision

### 3.1 Short-Term Vision (MVP)
Deliver a simple, trustworthy way for groups to run lending circles using stablecoins, enforced by smart contracts.

### 3.2 Long-Term Vision
Become the **credit and trust layer** that enables:
- Crypto credit cards
- Neobanks
- Lending protocols
- Cross-border banking

---

## 4. Target Users

### 4.1 Primary Users (MVP)
- Friends & families
- Coworkers
- Community groups
- Early Web3 users in APAC / emerging markets

### 4.2 Secondary Users (Future)
- Wallets
- Fintechs
- Card issuers
- Lending protocols
- NGOs & DAOs

---

## 5. Key Principles

- App-first, protocol-second
- Stablecoins only
- Hide blockchain complexity
- Trust is earned through behavior
- No speculative incentives in MVP

---

## 6. MVP Scope (Phase 1)

### 6.1 Core Use Case
On-chain lending circles with automated enforcement and transparent payouts.

---

## 7. Functional Requirements (MVP)

### 7.1 User Onboarding
**Requirements**
- Users connect via wallet OR custodial account
- Abstract blockchain concepts (no gas talk)
- One account = one credit identity

**Out of Scope**
- Fiat onboarding
- KYC (unless required later)

---

### 7.2 Circle Creation

**Requirements**
- Creator defines:
  - Contribution amount (fixed)
  - Contribution frequency (weekly / monthly)
  - Number of participants
  - Start date
  - Payout method (rotation only for MVP)

**Rules**
- Circle configuration is immutable after creation
- Circle must be fully funded before payouts begin

---

### 7.3 Circle Participation

**Requirements**
- Invite-only participation
- Participants must accept rules explicitly
- Each participant commits funds per cycle

**Edge Cases**
- User joins but does not fund → join fails
- User drops mid-cycle → penalties applied

---

### 7.4 Contributions

**Requirements**
- Contributions are:
  - Stablecoin-only
  - Time-bound per cycle
  - Enforced by Soroban contracts

**Failure Handling**
- Late payment:
  - Grace window (configurable)
  - Reputation impact
- Missed payment:
  - Recorded default
  - Possible exclusion from future circles

---

### 7.5 Payouts

**Requirements**
- Automated execution
- Deterministic rotation order
- No admin override
- Transparent ledger trail

**Non-Requirements**
- Manual payouts
- Emergency withdrawals

---

### 7.6 Reputation Tracking (MVP)

**Requirements**
Track the following per address:
- Circles joined
- Circles completed
- On-time payments
- Late payments
- Missed payments
- Total amount contributed

**Output**
- Read-only reputation summary (v1)
- No visible numeric score in MVP UI

---

## 8. Non-Functional Requirements (MVP)

### 8.1 Security
- No custodial admin access
- Funds only move via contract logic
- Deterministic execution

### 8.2 Performance
- Support high-frequency, low-value transactions
- Finality within seconds

### 8.3 UX
- Mobile-first
- Clear progress indicators
- Human language (no crypto jargon)

---

## 9. Technical Architecture (MVP)

### 9.1 High-Level Components

- Frontend (Web / Mobile)
- Halo Backend API
- Soroban Smart Contracts
- Stellar Ledger

---

### 9.2 Smart Contract Modules

#### CircleFactory
- Deploys new Circle contracts
- Stores immutable configuration

#### CircleContract
- Handles deposits
- Enforces contribution timing
- Executes payouts
- Emits reputation events

#### ReputationRecorder
- Logs behavioral events
- Aggregates user activity

---

### 9.3 Data Storage Strategy

| Data Type | Storage |
|---------|--------|
| Funds | On-chain |
| Circle config | On-chain |
| Reputation signals | On-chain |
| UI metadata | Off-chain |

---

## 10. KPIs (MVP)

- Active circles
- Total stablecoin TVL
- Monthly contribution transactions
- Circle completion rate
- Repeat participation rate

---

## 11. Phase 2 — Protocolization (Future)

### 11.1 Credit Primitive

Introduce `HaloCreditProfile`:
- Trust score (0–100)
- Deterministic, non-transferable
- Derived from on-chain behavior

### 11.2 Public Read APIs
- getTrustScore(address)
- getCircleHistory(address)
- getDefaultEvents(address)

---

## 12. Phase 3 — Financial Products (Future)

### 12.1 Crypto Credit Cards
- Eligibility based on trust score
- Stablecoin settlement
- Partner-issued cards

### 12.2 Lending & Borrowing
- Group-backed loans
- Reputation-weighted limits
- Lower collateral requirements

### 12.3 Savings & Yield
- Conservative yield strategies
- Principal protection
- Group-based yield pools

---

## 13. Phase 4 — Ecosystem Infrastructure

### 13.1 Halo as Infra
- Trust oracle for wallets
- Credit layer for fintechs
- Reputation system for DeFi

### 13.2 Monetization
- Protocol access fees
- Card interchange
- SaaS integrations
- Analytics APIs

---

## 14. Out of Scope (Explicit)

- Governance token
- Speculative incentives
- NFTs
- Permissionless lending markets
- High-risk yield products

---

## 15. Risks & Mitigations

| Risk | Mitigation |
|----|----------|
| Low early trust | Invite-only circles |
| Gaming behavior | Time-weighted metrics |
| UX complexity | App-first design |
| Regulatory creep | Stablecoins + anchors |

---

## 16. Success Definition

Halo is successful when:
- Users trust it with real money
- Circles complete reliably
- Reputation becomes reusable
- Other apps want Halo data

---

## 17. Final Principle

> Halo does not lend money.
> Halo makes trust legible, enforceable, and composable.

---