# Halo Protocol: Product Requirements Document

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Author:** XXIX Labs  
**Status:** Draft for POC Development

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Personas](#2-user-personas)
3. [User Journey Maps](#3-user-journey-maps)
4. [Feature Specifications](#4-feature-specifications)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Data Models](#7-data-models)
8. [API Specifications](#8-api-specifications)
9. [UI/UX Requirements](#9-uiux-requirements)
10. [Security Requirements](#10-security-requirements)
11. [Success Metrics](#11-success-metrics)
12. [Release Plan](#12-release-plan)

---

## 1. Product Overview

### 1.1 Problem Statement

**For individuals without credit history:**
- 1.4 billion adults globally are unbanked
- Traditional credit scores exclude those without formal financial history
- Informal savings groups (ROSCAs/chit funds) serve 200M+ people but provide no credit trail
- DeFi lending requires over-collateralization, excluding the underbanked

**For DeFi protocols:**
- No reliable way to assess borrower reputation on-chain
- Over-collateralization (150%+) limits capital efficiency
- Sybil attacks enable users to exploit protocols with multiple identities

### 1.2 Solution

Halo Protocol digitizes traditional lending circles (ROSCAs) on blockchain, creating:

1. **Verifiable Identity** - One person = one account, permanently linked
2. **Transparent Circles** - Smart contract-enforced savings groups
3. **Portable Credit Score** - On-chain reputation from payment history
4. **Open Infrastructure** - SDK for any protocol to query credit scores

### 1.3 Value Proposition

| Stakeholder | Value |
|-------------|-------|
| **Individual Users** | Build credit through community savings; access financial services |
| **Circle Organizers** | Automated enforcement; no manual collection |
| **DeFi Protocols** | Credit data for risk assessment; reduced collateral requirements |
| **Financial Institutions** | Alternative credit data for underbanked populations |

### 1.4 Product Principles

1. **Trust is Earned** - Credit scores reflect real behavior, not promises
2. **Privacy by Design** - Minimal data collection; user controls what's shared
3. **Simplicity First** - Complex blockchain mechanics hidden from users
4. **Community Centric** - Designed around how ROSCAs actually work
5. **Interoperable** - Credit scores usable across the ecosystem

---

## 2. User Personas

### 2.1 Primary Persona: Circle Participant

**Name:** Priya (28, Mumbai)  
**Role:** Software developer at a startup  
**Income:** ₹8 LPA (~$9,500 USD)  
**Financial Situation:** 
- No credit card (rejected due to thin file)
- Saves irregularly
- Participates in office chit fund

**Goals:**
- Build credit history to get a credit card
- Save consistently for a laptop upgrade
- Formalize her chit fund participation

**Pain Points:**
- Can't prove her payment reliability to banks
- Office chit fund relies on trust and WhatsApp
- Previous chit fund organizer absconded with money

**Tech Comfort:** High - uses UPI, has crypto wallet

---

### 2.2 Secondary Persona: Circle Organizer

**Name:** Ramesh (45, Bangalore)  
**Role:** Small business owner  
**Financial Situation:**
- Runs monthly chit fund with 10 employees
- Manually tracks contributions in spreadsheet
- Handles disputes personally

**Goals:**
- Reduce administrative burden
- Protect himself from accusations of mismanagement
- Help employees build credit

**Pain Points:**
- Chasing late payments is awkward with employees
- No formal record keeping for tax purposes
- High trust burden as organizer

**Tech Comfort:** Medium - uses smartphones, unfamiliar with crypto

---

### 2.3 Tertiary Persona: Protocol Developer

**Name:** Alex (32, Remote)  
**Role:** DeFi protocol developer  
**Building:** Under-collateralized lending protocol on Stellar

**Goals:**
- Access reliable credit data for borrowers
- Reduce collateral requirements for good actors
- Prevent sybil attacks

**Pain Points:**
- No on-chain credit data exists
- Building own reputation system is expensive
- Can't verify real-world identity

**Tech Comfort:** Very high - blockchain native

---

## 3. User Journey Maps

### 3.1 New User Registration Journey

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           NEW USER REGISTRATION JOURNEY                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  AWARENESS          CONSIDERATION         REGISTRATION         ACTIVATION           │
│  ─────────          ─────────────         ────────────         ──────────           │
│                                                                                      │
│  ┌─────────┐       ┌─────────────┐       ┌────────────┐       ┌──────────┐          │
│  │ Hears   │       │ Visits      │       │ Signs up   │       │ Completes│          │
│  │ about   │──────▶│ landing     │──────▶│ with       │──────▶│ KYC      │          │
│  │ Halo    │       │ page        │       │ Google     │       │          │          │
│  └─────────┘       └─────────────┘       └────────────┘       └──────────┘          │
│       │                  │                     │                    │               │
│       ▼                  ▼                     ▼                    ▼               │
│  "My friend         "This looks          "That was           "Aadhaar             │
│   built credit"      trustworthy"         easy"               verified!"           │
│                                                                                      │
│                                                                                      │
│                     ┌────────────┐       ┌────────────┐       ┌──────────┐          │
│                     │ Binds      │       │ Joins      │       │ Makes    │          │
│                ────▶│ wallet     │──────▶│ first      │──────▶│ first    │          │
│                     │            │       │ circle     │       │ payment  │          │
│                     └────────────┘       └────────────┘       └──────────┘          │
│                           │                    │                    │               │
│                           ▼                    ▼                    ▼               │
│                     "One-time            "Found my            "Credit score        │
│                      setup done"          office group"        is 310!"            │
│                                                                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  EMOTIONAL ARC:  Curious → Interested → Reassured → Excited → Accomplished         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  TIME:           ~2 min      ~5 min         ~1 min        ~3 min        ~2 min      │
│  TOTAL: ~13 minutes from landing to first contribution                              │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Circle Lifecycle Journey

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              CIRCLE LIFECYCLE JOURNEY                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  PHASE 1: FORMATION (Week 0)                                                        │
│  ───────────────────────────                                                        │
│                                                                                      │
│  Organizer                           Members                                         │
│  ─────────                           ───────                                         │
│  ┌─────────────┐                     ┌─────────────┐                                │
│  │ Create      │                     │ Receive     │                                │
│  │ circle with │────────────────────▶│ invite      │                                │
│  │ parameters  │                     │ link        │                                │
│  └─────────────┘                     └─────────────┘                                │
│        │                                   │                                         │
│        ▼                                   ▼                                         │
│  Sets: amount,                       ┌─────────────┐                                │
│  frequency,                          │ Review      │                                │
│  member count,                       │ terms &     │                                │
│  start date                          │ join        │                                │
│                                      └─────────────┘                                │
│                                            │                                         │
│                                            ▼                                         │
│                                      Identity verified                               │
│                                      automatically                                   │
│                                                                                      │
│  ════════════════════════════════════════════════════════════════════════════════   │
│                                                                                      │
│  PHASE 2: CONTRIBUTION PERIOD (Weeks 1-N)                                           │
│  ────────────────────────────────────────                                           │
│                                                                                      │
│  Each Period:                                                                        │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │ Reminder    │     │ Members     │     │ Smart       │     │ Payout to   │        │
│  │ sent 3 days │────▶│ contribute  │────▶│ contract    │────▶│ recipient   │        │
│  │ before due  │     │ USDC        │     │ verifies    │     │             │        │
│  └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘        │
│                            │                   │                    │               │
│                            ▼                   ▼                    ▼               │
│                      On-time: +credit    All payments        Recipient             │
│                      Late: -credit       received?           selected by           │
│                      Missed: --credit    Grace period        rotation order        │
│                                          if not                                     │
│                                                                                      │
│  ════════════════════════════════════════════════════════════════════════════════   │
│                                                                                      │
│  PHASE 3: COMPLETION (Week N+1)                                                     │
│  ──────────────────────────────                                                     │
│                                                                                      │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                            │
│  │ Final       │     │ Circle      │     │ Credit      │                            │
│  │ payout      │────▶│ marked      │────▶│ scores      │                            │
│  │ distributed │     │ complete    │     │ updated     │                            │
│  └─────────────┘     └─────────────┘     └─────────────┘                            │
│                                                │                                     │
│                                                ▼                                     │
│                                          Completion bonus                            │
│                                          added to all                                │
│                                          members' scores                             │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Payment Flow (Detailed)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              CONTRIBUTION PAYMENT FLOW                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  USER ACTION                 SYSTEM                          BLOCKCHAIN             │
│  ───────────                 ──────                          ──────────             │
│                                                                                      │
│  ┌─────────────┐                                                                    │
│  │ Open app,   │                                                                    │
│  │ see pending │                                                                    │
│  │ contribution│                                                                    │
│  └──────┬──────┘                                                                    │
│         │                                                                            │
│         ▼                                                                            │
│  ┌─────────────┐       ┌─────────────┐                                              │
│  │ Click "Pay  │──────▶│ Validate    │                                              │
│  │ Now"        │       │ user has    │                                              │
│  └─────────────┘       │ sufficient  │                                              │
│                        │ USDC        │                                              │
│                        └──────┬──────┘                                              │
│                               │                                                      │
│                               ▼                                                      │
│                        ┌─────────────┐                                              │
│                        │ Show        │                                              │
│                        │ confirmation│                                              │
│                        │ modal       │                                              │
│                        └──────┬──────┘                                              │
│                               │                                                      │
│  ┌─────────────┐              │                                                      │
│  │ Review &    │◀─────────────┘                                                      │
│  │ approve in  │                                                                    │
│  │ wallet      │                                                                    │
│  └──────┬──────┘                                                                    │
│         │                                                                            │
│         ▼                                                                            │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐                        │
│  │ Sign        │──────▶│ Submit      │──────▶│ Execute     │                        │
│  │ transaction │       │ transaction │       │ contribute()│                        │
│  └─────────────┘       └─────────────┘       └──────┬──────┘                        │
│                                                     │                                │
│                                                     ▼                                │
│                                              ┌─────────────┐                        │
│                                              │ Contract    │                        │
│                                              │ validates:  │                        │
│                                              │ - Amount    │                        │
│                                              │ - Member    │                        │
│                                              │ - Period    │                        │
│                                              │ - Not paid  │                        │
│                                              └──────┬──────┘                        │
│                                                     │                                │
│                        ┌─────────────┐              │                                │
│                        │ Index event │◀─────────────┘                                │
│                        │ & update DB │                                              │
│                        └──────┬──────┘                                              │
│                               │                                                      │
│                               ▼                                                      │
│                        ┌─────────────┐       ┌─────────────┐                        │
│                        │ Calculate   │──────▶│ Update      │                        │
│                        │ on-time vs  │       │ credit      │                        │
│                        │ late        │       │ contract    │                        │
│                        └─────────────┘       └─────────────┘                        │
│                               │                                                      │
│                               ▼                                                      │
│  ┌─────────────┐       ┌─────────────┐                                              │
│  │ See success │◀──────│ Send push   │                                              │
│  │ screen with │       │ notification│                                              │
│  │ new score   │       │ & update UI │                                              │
│  └─────────────┘       └─────────────┘                                              │
│                                                                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  TIMING:                                                                             │
│  • UI interaction: ~10 seconds                                                       │
│  • Wallet approval: ~5 seconds                                                       │
│  • Blockchain confirmation: ~5 seconds (Stellar)                                    │
│  • Total: ~20 seconds                                                                │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Feature Specifications

### 4.1 Feature: User Registration & Identity

#### F1.1: Social Login

**Description:** Users can sign up using existing social accounts.

**User Story:**  
*As a new user, I want to sign up with my Google account so that I don't need to remember another password.*

**Acceptance Criteria:**
- [ ] User can click "Continue with Google" on landing page
- [ ] OAuth flow completes in under 5 seconds
- [ ] User is redirected to KYC step after successful auth
- [ ] Email is pre-filled from Google account
- [ ] User can also sign up with email/password as alternative
- [ ] Existing users are recognized and logged in directly

**Technical Notes:**
- Use Google OAuth 2.0
- Store minimal profile data (email, name)
- Generate internal user ID (UUID v4)
- Set JWT token with 15-minute expiry + refresh token

---

#### F1.2: KYC Verification

**Description:** Users verify their identity through a third-party KYC provider.

**User Story:**  
*As a new user, I want to verify my identity once so that I can participate in circles and build a trusted reputation.*

**Acceptance Criteria:**
- [ ] User sees clear explanation of why KYC is needed
- [ ] User can start KYC flow with one click
- [ ] Fractal ID widget loads within 3 seconds
- [ ] User can complete verification using:
  - Government ID (Aadhaar, Passport, Driver's License)
  - Selfie for liveness check
- [ ] Verification completes within 2 minutes for most users
- [ ] User receives confirmation when KYC is approved
- [ ] Failed verification shows clear reason and retry option
- [ ] KYC status is persisted and never requested again

**KYC Data Collected:**
| Field | Purpose | Stored? |
|-------|---------|---------|
| Full Name | Display, verification | Yes (encrypted) |
| Date of Birth | Age verification, uniqueness | Hashed only |
| ID Number | Uniqueness check | Hashed only |
| Country | Compliance, geo-restrictions | Yes |
| Selfie | Liveness verification | No (discarded after verification) |

**Technical Notes:**
- Integrate Fractal ID SDK
- Webhook receives verification result
- Generate unique_id = SHA256(country + dob + id_hash + salt)
- Check unique_id doesn't already exist (anti-sybil)
- Store KYC status but not raw documents

---

#### F1.3: Wallet Binding

**Description:** Users permanently link their verified identity to a Stellar wallet.

**User Story:**  
*As a verified user, I want to connect my wallet so that my credit score is tied to my blockchain address.*

**Acceptance Criteria:**
- [ ] User sees list of supported wallets (Freighter, Albedo, xBull)
- [ ] User can connect wallet with one click
- [ ] Wallet address is displayed for confirmation
- [ ] User signs a message to prove ownership
- [ ] Binding is recorded on-chain (Identity contract)
- [ ] User is warned that binding is permanent and cannot be changed
- [ ] User must explicitly confirm understanding before binding
- [ ] After binding, user can proceed to join circles

**Binding Message Format:**
```
I am binding this wallet to my Halo Protocol identity.

User ID: {unique_id}
Wallet: {stellar_address}
Timestamp: {iso_timestamp}

This action is permanent and cannot be undone.
```

**Technical Notes:**
- Call identity contract `bind_wallet(unique_id, wallet_address, signature)`
- Contract verifies signature matches wallet
- Contract ensures wallet not already bound
- Contract ensures unique_id not already bound
- Emit `WalletBound` event

---

### 4.2 Feature: Circle Management

#### F2.1: Create Circle

**Description:** Organizers can create new lending circles with custom parameters.

**User Story:**  
*As an organizer, I want to create a circle with specific rules so that my group can save together with clear expectations.*

**Acceptance Criteria:**
- [ ] User navigates to "Create Circle" from dashboard
- [ ] Circle creation wizard with 4 steps:
  1. Basic Info (name, description)
  2. Parameters (amount, frequency, duration)
  3. Settings (visibility, join approval)
  4. Review & Create
- [ ] Form validates input in real-time
- [ ] Preview shows example payout schedule
- [ ] User pays gas fee to create circle on-chain
- [ ] Circle appears on dashboard immediately after creation
- [ ] Organizer receives shareable invite link

**Circle Parameters:**

| Parameter | Type | Constraints | Default |
|-----------|------|-------------|---------|
| name | string | 3-50 chars | Required |
| description | string | 0-500 chars | Empty |
| contribution_amount | number | $10 - $1,000 USDC | Required |
| frequency | enum | weekly, biweekly, monthly | monthly |
| member_count | number | 3-10 members | Required |
| start_date | date | Today + 1 day minimum | Required |
| visibility | enum | public, private | private |
| join_approval | boolean | true/false | true |

**Payout Schedule Calculation:**
```
Duration = member_count × frequency
Payout per round = contribution_amount × member_count
Total saved by each member = contribution_amount × member_count

Example (5 members, $100/month):
- Duration: 5 months
- Each member contributes: $100/month × 5 months = $500
- Each member receives: $500 (once, on their turn)
```

---

#### F2.2: Join Circle

**Description:** Users can discover and join circles.

**User Story:**  
*As a user, I want to join a circle so that I can start saving with a group and build my credit.*

**Acceptance Criteria:**
- [ ] User can find circles via:
  - Direct invite link (private circles)
  - Public circle directory (public circles)
  - Search by name or organizer
- [ ] Circle details page shows:
  - Circle name and description
  - Contribution amount and frequency
  - Current members / max members
  - Start date and duration
  - Organizer's credit score
  - Payout schedule
- [ ] User clicks "Request to Join" (if approval required) or "Join" (if open)
- [ ] System verifies user has valid identity
- [ ] System checks user isn't already in circle
- [ ] If approval required, organizer receives notification
- [ ] If approved (or open), membership is recorded on-chain
- [ ] User sees circle in "My Circles" on dashboard

**Join Restrictions:**
- Must have completed KYC and wallet binding
- Cannot join if circle has already started
- Cannot join if circle is full
- Cannot join same circle twice
- No limit on total circles (POC)

---

#### F2.3: Circle Dashboard

**Description:** Members can view circle status and upcoming obligations.

**User Story:**  
*As a circle member, I want to see my circle's status so that I know when to pay and when I'll receive my payout.*

**Acceptance Criteria:**
- [ ] Circle dashboard shows:
  - Circle name and status (forming, active, completed)
  - Progress indicator (current round / total rounds)
  - My contribution status (paid / pending / overdue)
  - All members with payment status for current round
  - Upcoming payout recipient
  - Payout schedule with dates
  - My position in rotation
- [ ] Payment status indicators:
  - ✓ Green checkmark = paid on time
  - ⏰ Yellow clock = pending (before due date)
  - ⚠️ Orange warning = late (in grace period)
  - ✗ Red X = missed (past grace period)
- [ ] "Pay Now" button prominent when payment pending
- [ ] Countdown timer shows time until due date

---

#### F2.4: Make Contribution

**Description:** Members contribute USDC to the circle each period.

**User Story:**  
*As a circle member, I want to make my contribution easily so that I stay in good standing and build my credit.*

**Acceptance Criteria:**
- [ ] User sees pending contribution on dashboard
- [ ] "Pay Now" button initiates payment flow
- [ ] System shows:
  - Amount due (in USDC)
  - Due date
  - Current wallet balance
  - Warning if insufficient balance
- [ ] User confirms payment in wallet
- [ ] Transaction is submitted to blockchain
- [ ] Loading state while transaction confirms
- [ ] Success screen shows:
  - Transaction confirmed
  - New credit score (if changed)
  - Next payment date
- [ ] Circle dashboard updates in real-time

**Payment Timing Logic:**
| Timing | Credit Impact |
|--------|---------------|
| 3+ days early | +3 bonus points |
| On time (by due date) | +2 points |
| 1-3 days late | +0 points |
| 4-7 days late (grace) | -5 points |
| 8+ days late | -15 points, flagged |
| Missed entirely | -30 points, potential removal |

---

#### F2.5: Receive Payout

**Description:** Recipients automatically receive the pooled contributions.

**User Story:**  
*As a circle member, I want to receive my payout automatically when it's my turn so that I don't have to request it.*

**Acceptance Criteria:**
- [ ] Payout is triggered automatically when:
  - All members have contributed for the period, OR
  - Grace period has ended
- [ ] Smart contract transfers total contributions to recipient
- [ ] Recipient receives push notification
- [ ] Transaction is recorded on-chain
- [ ] Circle advances to next period
- [ ] If contributions are incomplete:
  - Recipient receives partial payout (contributors only)
  - Non-contributors are flagged
  - System records default for credit impact

**Payout Calculation:**
```
payout_amount = contribution_amount × number_of_contributors
(Not number of members - if someone defaults, payout is reduced)
```

---

### 4.3 Feature: Credit Score

#### F3.1: Credit Score Display

**Description:** Users can view their credit score and breakdown.

**User Story:**  
*As a user, I want to see my credit score and understand how it's calculated so that I know how to improve it.*

**Acceptance Criteria:**
- [ ] Credit score prominently displayed on dashboard
- [ ] Score shown as number (300-850) with visual gauge
- [ ] Score tier label (Poor, Fair, Good, Very Good, Excellent)
- [ ] Breakdown shows each factor:
  - Payment History (40%)
  - Circle Completion (25%)
  - Volume (15%)
  - Tenure (10%)
  - Peer Attestations (10%)
- [ ] Each factor shows current points / max points
- [ ] Trend indicator (up/down/stable vs. last month)
- [ ] Tips for improving score

**Score Tiers:**
| Score Range | Tier | Visual Color |
|-------------|------|--------------|
| 300-499 | Poor | Red |
| 500-599 | Fair | Orange |
| 600-699 | Good | Yellow |
| 700-799 | Very Good | Light Green |
| 800-850 | Excellent | Green |

---

#### F3.2: Credit History

**Description:** Users can view their complete credit history.

**User Story:**  
*As a user, I want to see my payment history so that I can verify my credit score is accurate.*

**Acceptance Criteria:**
- [ ] History tab shows all credit events chronologically
- [ ] Each event displays:
  - Date
  - Circle name
  - Event type (contribution, completion, attestation)
  - Points impact (+/-)
  - Running score
- [ ] Filter by circle
- [ ] Filter by date range
- [ ] Export as PDF (for sharing with lenders)

---

#### F3.3: Credit Score Query (SDK)

**Description:** External protocols can query user credit scores.

**User Story:**  
*As a protocol developer, I want to query a user's credit score so that I can make lending decisions.*

**Acceptance Criteria:**
- [ ] SDK function: `getScore(wallet_address)`
- [ ] Returns: score, tier, last_updated
- [ ] SDK function: `getScoreDetails(wallet_address)`
- [ ] Returns: full breakdown with all factors
- [ ] SDK function: `verifyIdentity(wallet_address)`
- [ ] Returns: boolean (has verified identity)
- [ ] All queries read from on-chain contract
- [ ] No API key required (public data)
- [ ] Rate limiting: 100 queries/minute per IP

**SDK Response Format:**
```typescript
interface CreditScoreResponse {
  wallet: string;
  score: number;           // 300-850
  tier: 'poor' | 'fair' | 'good' | 'very_good' | 'excellent';
  lastUpdated: string;     // ISO timestamp
  factors: {
    paymentHistory: { points: number; maxPoints: number };
    circleCompletion: { points: number; maxPoints: number };
    volume: { points: number; maxPoints: number };
    tenure: { points: number; maxPoints: number };
    attestations: { points: number; maxPoints: number };
  };
  circlesCompleted: number;
  circlesActive: number;
  totalContributed: number; // USDC
  onTimeRate: number;       // 0-100%
}
```

---

### 4.4 Feature: Notifications

#### F4.1: Payment Reminders

**Description:** Users receive reminders about upcoming and overdue payments.

**User Story:**  
*As a circle member, I want to receive reminders so that I don't miss payments.*

**Notification Schedule:**
| Timing | Channel | Message |
|--------|---------|---------|
| 3 days before | Email + Push | "Reminder: $100 due in 3 days for [Circle]" |
| 1 day before | Push | "Tomorrow: $100 contribution due" |
| Due date | Push | "Today: Pay your $100 contribution" |
| 1 day late | Email + Push | "Overdue: Your payment is 1 day late" |
| 3 days late | Email + Push | "Warning: Pay within 4 days to avoid credit penalty" |

**Acceptance Criteria:**
- [ ] Notifications sent according to schedule
- [ ] User can customize notification preferences
- [ ] User can opt out of reminders (not recommended)
- [ ] Push notifications work on mobile and desktop
- [ ] Email includes direct link to pay

---

#### F4.2: Circle Updates

**Description:** Users receive updates about circle activity.

**User Story:**  
*As a circle member, I want to know when things happen in my circle.*

**Notification Events:**
| Event | Recipients | Message |
|-------|------------|---------|
| Member joined | All members | "[Name] joined the circle" |
| Circle started | All members | "[Circle] has started! First payment due [date]" |
| Payment received | Organizer | "[Name] paid their contribution" |
| All paid | All members | "All members paid! Payout processing..." |
| Payout sent | Recipient | "You received $500 from [Circle]!" |
| Circle completed | All members | "Congratulations! [Circle] is complete!" |

---

## 5. Functional Requirements

### 5.1 User Management

| ID | Requirement | Priority |
|----|-------------|----------|
| UM-01 | System shall support Google OAuth for registration | Must |
| UM-02 | System shall support email/password registration | Should |
| UM-03 | System shall integrate with Fractal ID for KYC | Must |
| UM-04 | System shall generate unique ID from KYC data | Must |
| UM-05 | System shall prevent duplicate unique IDs | Must |
| UM-06 | System shall support wallet binding (Freighter, Albedo, xBull) | Must |
| UM-07 | System shall enforce one-time wallet binding | Must |
| UM-08 | System shall maintain user session for 7 days | Should |
| UM-09 | System shall allow users to update profile (name, avatar) | Could |
| UM-10 | System shall allow users to delete account | Should |

### 5.2 Circle Management

| ID | Requirement | Priority |
|----|-------------|----------|
| CM-01 | System shall allow users to create circles | Must |
| CM-02 | System shall enforce circle parameter constraints | Must |
| CM-03 | System shall generate unique invite links | Must |
| CM-04 | System shall support public and private circles | Should |
| CM-05 | System shall support join approval workflow | Should |
| CM-06 | System shall prevent joining started circles | Must |
| CM-07 | System shall prevent joining full circles | Must |
| CM-08 | System shall track circle state (forming, active, completed) | Must |
| CM-09 | System shall calculate payout schedule | Must |
| CM-10 | System shall allow organizer to remove members (before start) | Should |

### 5.3 Payments

| ID | Requirement | Priority |
|----|-------------|----------|
| PM-01 | System shall accept USDC contributions | Must |
| PM-02 | System shall validate contribution amount | Must |
| PM-03 | System shall track payment timing (early, on-time, late) | Must |
| PM-04 | System shall enforce grace period (7 days) | Must |
| PM-05 | System shall process payouts automatically | Must |
| PM-06 | System shall handle partial payouts (if defaults) | Must |
| PM-07 | System shall emit events for all payment activities | Must |
| PM-08 | System shall support contribution amount range $10-$1000 | Must |
| PM-09 | System shall display transaction history | Should |
| PM-10 | System shall retry failed transactions | Should |

### 5.4 Credit Scoring

| ID | Requirement | Priority |
|----|-------------|----------|
| CS-01 | System shall calculate credit score (300-850) | Must |
| CS-02 | System shall weight payment history at 40% | Must |
| CS-03 | System shall weight circle completion at 25% | Must |
| CS-04 | System shall weight volume at 15% | Must |
| CS-05 | System shall weight tenure at 10% | Must |
| CS-06 | System shall weight attestations at 10% | Must |
| CS-07 | System shall store scores on-chain | Must |
| CS-08 | System shall update scores after each payment | Must |
| CS-09 | System shall apply score decay (inactivity) | Should |
| CS-10 | System shall provide score query SDK | Must |

### 5.5 Notifications

| ID | Requirement | Priority |
|----|-------------|----------|
| NF-01 | System shall send email notifications | Must |
| NF-02 | System shall send push notifications | Should |
| NF-03 | System shall send payment reminders | Must |
| NF-04 | System shall notify on circle events | Should |
| NF-05 | System shall allow notification preferences | Should |
| NF-06 | System shall support notification templates | Should |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| PF-01 | Page load time | < 2 seconds (90th percentile) |
| PF-02 | API response time | < 200ms (95th percentile) |
| PF-03 | Transaction confirmation | < 10 seconds (Stellar) |
| PF-04 | Concurrent users | 1,000 (POC) |
| PF-05 | Database query time | < 50ms (95th percentile) |

### 6.2 Availability

| ID | Requirement | Target |
|----|-------------|--------|
| AV-01 | System uptime | 99.5% (POC), 99.9% (production) |
| AV-02 | Planned maintenance window | < 4 hours/month |
| AV-03 | Recovery time objective (RTO) | < 4 hours |
| AV-04 | Recovery point objective (RPO) | < 1 hour |

### 6.3 Security

| ID | Requirement | Target |
|----|-------------|--------|
| SC-01 | All traffic over HTTPS | TLS 1.3 |
| SC-02 | Authentication tokens | JWT, 15-min expiry |
| SC-03 | Password hashing | bcrypt, 12 rounds |
| SC-04 | PII encryption at rest | AES-256 |
| SC-05 | API rate limiting | 100 req/min per user |
| SC-06 | Smart contract audit | External audit before mainnet |

### 6.4 Scalability

| ID | Requirement | Target |
|----|-------------|--------|
| SL-01 | Horizontal scaling | Stateless services |
| SL-02 | Database connections | Connection pooling |
| SL-03 | Cache layer | Redis for sessions, queries |
| SL-04 | CDN | Static assets via CloudFront |

### 6.5 Compliance

| ID | Requirement | Target |
|----|-------------|--------|
| CP-01 | Data residency | User choice (POC: single region) |
| CP-02 | GDPR compliance | Right to deletion supported |
| CP-03 | KYC/AML | Via Fractal ID (compliant provider) |
| CP-04 | Geo-restrictions | Configurable (OFAC list) |

---

## 7. Data Models

### 7.1 User

```typescript
interface User {
  id: string;                    // UUID v4
  email: string;                 // From OAuth or registration
  name: string;                  // Display name
  avatar_url?: string;           // Profile image
  auth_provider: 'google' | 'email';
  
  // KYC
  kyc_status: 'pending' | 'verified' | 'rejected';
  kyc_provider: 'fractal';
  kyc_completed_at?: Date;
  unique_id?: string;            // SHA256 hash from KYC
  country?: string;              // From KYC
  
  // Wallet
  wallet_address?: string;       // Stellar address
  wallet_bound_at?: Date;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
  
  // Settings
  notification_preferences: {
    email_reminders: boolean;
    push_reminders: boolean;
    circle_updates: boolean;
  };
}
```

### 7.2 Circle

```typescript
interface Circle {
  id: string;                    // UUID v4
  contract_id: string;           // Stellar contract address
  
  // Basic Info
  name: string;
  description?: string;
  
  // Parameters
  contribution_amount: number;   // In USDC (6 decimals)
  frequency: 'weekly' | 'biweekly' | 'monthly';
  member_count: number;          // Target members
  
  // Dates
  start_date: Date;
  end_date: Date;                // Calculated
  
  // Settings
  visibility: 'public' | 'private';
  join_approval: boolean;
  
  // State
  status: 'forming' | 'active' | 'completed' | 'cancelled';
  current_period: number;        // 1-indexed
  
  // Relations
  organizer_id: string;          // User ID
  
  // Metadata
  created_at: Date;
  updated_at: Date;
  invite_code: string;           // For private circles
}
```

### 7.3 Circle Membership

```typescript
interface CircleMembership {
  id: string;
  circle_id: string;
  user_id: string;
  
  // Position
  payout_position: number;       // 1-indexed, order of payout
  
  // Status
  status: 'pending' | 'approved' | 'active' | 'removed';
  joined_at: Date;
  approved_at?: Date;
  approved_by?: string;          // User ID (organizer)
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}
```

### 7.4 Contribution

```typescript
interface Contribution {
  id: string;
  circle_id: string;
  user_id: string;
  period: number;                // Which round (1-indexed)
  
  // Payment
  amount: number;                // USDC
  transaction_hash?: string;     // Stellar tx hash
  
  // Timing
  due_date: Date;
  paid_at?: Date;
  status: 'pending' | 'paid' | 'late' | 'missed';
  
  // Credit Impact
  days_early_or_late: number;    // Negative = early, positive = late
  credit_points: number;         // Points earned/lost
  
  // Metadata
  created_at: Date;
  updated_at: Date;
}
```

### 7.5 Payout

```typescript
interface Payout {
  id: string;
  circle_id: string;
  recipient_id: string;          // User ID
  period: number;
  
  // Amount
  expected_amount: number;       // Full payout if all pay
  actual_amount: number;         // May be less if defaults
  
  // Transaction
  transaction_hash?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  
  // Metadata
  scheduled_date: Date;
  processed_at?: Date;
  created_at: Date;
  updated_at: Date;
}
```

### 7.6 Credit Score

```typescript
interface CreditScore {
  id: string;
  user_id: string;
  
  // Score
  score: number;                 // 300-850
  tier: 'poor' | 'fair' | 'good' | 'very_good' | 'excellent';
  
  // Factor Breakdown
  payment_history_points: number;
  circle_completion_points: number;
  volume_points: number;
  tenure_points: number;
  attestation_points: number;
  
  // Stats
  total_contributions: number;
  on_time_contributions: number;
  late_contributions: number;
  missed_contributions: number;
  circles_completed: number;
  circles_active: number;
  total_volume_usdc: number;
  
  // Metadata
  first_activity_at?: Date;
  last_activity_at?: Date;
  last_calculated_at: Date;
  created_at: Date;
  updated_at: Date;
}
```

### 7.7 Credit Event

```typescript
interface CreditEvent {
  id: string;
  user_id: string;
  
  // Event
  type: 'contribution' | 'completion' | 'attestation' | 'decay';
  circle_id?: string;
  
  // Impact
  points_change: number;         // Can be negative
  score_before: number;
  score_after: number;
  
  // Details
  details: {
    contribution_id?: string;
    payout_id?: string;
    reason?: string;
  };
  
  // Metadata
  created_at: Date;
}
```

---

## 8. API Specifications

### 8.1 Authentication

#### POST /auth/google

**Description:** Authenticate with Google OAuth

**Request:**
```json
{
  "id_token": "google_oauth_token"
}
```

**Response (200):**
```json
{
  "access_token": "jwt_access_token",
  "refresh_token": "jwt_refresh_token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "kyc_status": "pending",
    "wallet_address": null
  }
}
```

#### POST /auth/refresh

**Description:** Refresh access token

**Request:**
```json
{
  "refresh_token": "jwt_refresh_token"
}
```

**Response (200):**
```json
{
  "access_token": "new_jwt_access_token"
}
```

---

### 8.2 Identity

#### POST /identity/kyc/start

**Description:** Initiate KYC verification session

**Response (200):**
```json
{
  "session_url": "https://fractal.id/verify/abc123",
  "session_id": "fractal_session_id"
}
```

#### GET /identity/kyc/status

**Description:** Get current KYC status

**Response (200):**
```json
{
  "status": "verified",
  "completed_at": "2026-01-15T10:30:00Z",
  "country": "IN"
}
```

#### POST /identity/wallet/bind

**Description:** Bind wallet to identity

**Request:**
```json
{
  "wallet_address": "GXYZ...",
  "signature": "base64_signature",
  "message": "signed_message"
}
```

**Response (200):**
```json
{
  "success": true,
  "transaction_hash": "abc123...",
  "bound_at": "2026-01-15T10:35:00Z"
}
```

---

### 8.3 Circles

#### GET /circles

**Description:** List circles (user's circles or public)

**Query Parameters:**
- `filter`: `my` | `public` | `available`
- `status`: `forming` | `active` | `completed`
- `page`: number
- `limit`: number

**Response (200):**
```json
{
  "circles": [
    {
      "id": "uuid",
      "name": "Office Savings",
      "contribution_amount": 100,
      "frequency": "monthly",
      "member_count": 5,
      "current_members": 3,
      "status": "forming",
      "start_date": "2026-02-01",
      "organizer": {
        "id": "uuid",
        "name": "John Doe",
        "credit_score": 720
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25
  }
}
```

#### POST /circles

**Description:** Create a new circle

**Request:**
```json
{
  "name": "Office Savings",
  "description": "Monthly savings group",
  "contribution_amount": 100,
  "frequency": "monthly",
  "member_count": 5,
  "start_date": "2026-02-01",
  "visibility": "private",
  "join_approval": true
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "contract_id": "CXYZ...",
  "invite_code": "ABC123",
  "invite_link": "https://halo.protocol/join/ABC123",
  "transaction_hash": "xyz123..."
}
```

#### GET /circles/:id

**Description:** Get circle details

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Office Savings",
  "description": "Monthly savings group",
  "contribution_amount": 100,
  "frequency": "monthly",
  "member_count": 5,
  "start_date": "2026-02-01",
  "end_date": "2026-06-01",
  "status": "active",
  "current_period": 2,
  "visibility": "private",
  "organizer": {
    "id": "uuid",
    "name": "John Doe",
    "credit_score": 720
  },
  "members": [
    {
      "id": "uuid",
      "name": "John Doe",
      "payout_position": 1,
      "credit_score": 720
    }
  ],
  "payout_schedule": [
    {
      "period": 1,
      "recipient_id": "uuid",
      "recipient_name": "John Doe",
      "date": "2026-02-01",
      "status": "completed"
    }
  ],
  "my_membership": {
    "payout_position": 3,
    "status": "active"
  }
}
```

#### POST /circles/:id/join

**Description:** Request to join a circle

**Request:**
```json
{
  "invite_code": "ABC123"  // Required for private circles
}
```

**Response (200):**
```json
{
  "membership_id": "uuid",
  "status": "pending",  // or "approved" if no approval required
  "message": "Join request submitted"
}
```

---

### 8.4 Contributions

#### GET /circles/:id/contributions

**Description:** Get contributions for a circle

**Response (200):**
```json
{
  "period": 2,
  "due_date": "2026-03-01",
  "contributions": [
    {
      "user_id": "uuid",
      "user_name": "John Doe",
      "amount": 100,
      "status": "paid",
      "paid_at": "2026-02-28T10:00:00Z"
    },
    {
      "user_id": "uuid",
      "user_name": "Jane Doe",
      "amount": 100,
      "status": "pending",
      "paid_at": null
    }
  ],
  "total_collected": 100,
  "total_expected": 500
}
```

#### POST /circles/:id/contribute

**Description:** Make a contribution

**Request:**
```json
{
  "amount": 100
}
```

**Response (200):**
```json
{
  "contribution_id": "uuid",
  "transaction_hash": "xyz123...",
  "status": "paid",
  "paid_at": "2026-02-28T10:00:00Z",
  "credit_impact": {
    "points_earned": 3,
    "new_score": 325,
    "reason": "Early payment bonus"
  }
}
```

---

### 8.5 Credit Score

#### GET /credit/score

**Description:** Get my credit score

**Response (200):**
```json
{
  "score": 720,
  "tier": "very_good",
  "last_updated": "2026-01-30T15:00:00Z",
  "factors": {
    "payment_history": {
      "points": 180,
      "max_points": 220,
      "percentage": 82
    },
    "circle_completion": {
      "points": 100,
      "max_points": 137,
      "percentage": 73
    },
    "volume": {
      "points": 60,
      "max_points": 83,
      "percentage": 72
    },
    "tenure": {
      "points": 40,
      "max_points": 55,
      "percentage": 73
    },
    "attestations": {
      "points": 40,
      "max_points": 55,
      "percentage": 73
    }
  },
  "stats": {
    "total_contributions": 24,
    "on_time_rate": 95.8,
    "circles_completed": 3,
    "circles_active": 1,
    "total_volume_usdc": 2400,
    "member_since": "2025-06-15"
  },
  "trend": {
    "change_30d": 15,
    "direction": "up"
  }
}
```

#### GET /credit/history

**Description:** Get credit history events

**Query Parameters:**
- `circle_id`: Filter by circle
- `from`: Start date
- `to`: End date
- `page`: number
- `limit`: number

**Response (200):**
```json
{
  "events": [
    {
      "id": "uuid",
      "type": "contribution",
      "circle_name": "Office Savings",
      "points_change": 3,
      "score_after": 720,
      "reason": "Early payment",
      "created_at": "2026-01-30T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

#### GET /credit/score/:wallet_address (Public SDK Endpoint)

**Description:** Query credit score by wallet (for external protocols)

**Response (200):**
```json
{
  "wallet": "GXYZ...",
  "score": 720,
  "tier": "very_good",
  "last_updated": "2026-01-30T15:00:00Z",
  "verified_identity": true,
  "stats": {
    "circles_completed": 3,
    "on_time_rate": 95.8,
    "total_volume_usdc": 2400
  }
}
```

---

## 9. UI/UX Requirements

### 9.1 Screen Inventory

| Screen | Priority | Description |
|--------|----------|-------------|
| Landing Page | Must | Marketing page with waitlist |
| Login | Must | Social + email login options |
| Registration | Must | Social + email signup |
| KYC Flow | Must | Fractal ID integration |
| Wallet Connect | Must | Wallet selection and binding |
| Dashboard | Must | Overview of circles and score |
| Circle List | Must | My circles + browse public |
| Circle Detail | Must | Circle info, members, payments |
| Create Circle | Must | Multi-step creation wizard |
| Join Circle | Must | Preview and join flow |
| Contribute | Must | Payment confirmation |
| Credit Score | Must | Score display and breakdown |
| Credit History | Should | Timeline of credit events |
| Profile | Should | User settings |
| Notifications | Should | Notification center |

### 9.2 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                [👤] [🔔]    │
│  ├── Logo                                                                           │
│  ├── Navigation: Dashboard | Circles | Credit Score                                 │
│  └── User Menu, Notifications                                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌───────────────────────────────────────┐  ┌───────────────────────────────────┐   │
│  │         CREDIT SCORE CARD             │  │         QUICK ACTIONS              │   │
│  │  ┌─────────────────────────────────┐  │  │                                    │   │
│  │  │            720                  │  │  │  [+ Create Circle]                │   │
│  │  │         Very Good               │  │  │  [🔍 Browse Circles]               │   │
│  │  │          ▲ +15                  │  │  │  [📊 View History]                 │   │
│  │  └─────────────────────────────────┘  │  │                                    │   │
│  │  [View Details →]                     │  └───────────────────────────────────┘   │
│  └───────────────────────────────────────┘                                          │
│                                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │  PENDING ACTIONS                                                    [!] 2     │   │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│   │
│  │  │  💰 Office Savings - $100 due in 3 days              [Pay Now]           ││   │
│  │  └──────────────────────────────────────────────────────────────────────────┘│   │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐│   │
│  │  │  👋 Family Fund - Join request pending                [View]             ││   │
│  │  └──────────────────────────────────────────────────────────────────────────┘│   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │  MY CIRCLES                                                   [View All →]    │   │
│  │                                                                               │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐           │   │
│  │  │ Office Savings   │  │ Family Fund      │  │ Friends Pool     │           │   │
│  │  │ ███████░░░ 70%   │  │ ██░░░░░░░░ 20%   │  │ Forming (3/5)    │           │   │
│  │  │ Period 4 of 5    │  │ Period 1 of 5    │  │ Starts Feb 1     │           │   │
│  │  │ Next: $100 due   │  │ $200/month       │  │ $50/weekly       │           │   │
│  │  │ in 3 days        │  │                  │  │                  │           │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘           │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 9.3 Mobile Considerations

- **Responsive Design:** All screens must work on 320px-768px widths
- **Touch Targets:** Minimum 44x44px for all interactive elements
- **Bottom Navigation:** Primary nav moves to bottom on mobile
- **Swipe Gestures:** Support pull-to-refresh on lists
- **Offline Handling:** Show cached data with stale indicator

### 9.4 Accessibility Requirements

| Requirement | Standard |
|-------------|----------|
| Color contrast | WCAG 2.1 AA (4.5:1 for text) |
| Keyboard navigation | Full support |
| Screen reader | ARIA labels on all elements |
| Focus indicators | Visible focus states |
| Text scaling | Support up to 200% zoom |
| Motion | Respect prefers-reduced-motion |

---

## 10. Security Requirements

### 10.1 Authentication Security

| Requirement | Implementation |
|-------------|----------------|
| Password policy | Min 8 chars, 1 upper, 1 number, 1 special |
| Token security | JWT with 15-min expiry, secure refresh |
| Session management | HttpOnly, Secure, SameSite cookies |
| Rate limiting | 5 failed attempts → 15 min lockout |
| 2FA | Optional TOTP (Phase 2) |

### 10.2 Data Security

| Requirement | Implementation |
|-------------|----------------|
| Encryption in transit | TLS 1.3 |
| Encryption at rest | AES-256 for PII |
| Database access | Parameterized queries only |
| API security | Input validation, output encoding |
| File uploads | Disabled in POC |

### 10.3 Smart Contract Security

| Requirement | Implementation |
|-------------|----------------|
| Access control | Role-based (organizer, member, admin) |
| Reentrancy protection | Check-effects-interactions pattern |
| Integer safety | Overflow checks (Rust default) |
| Upgradability | Immutable contracts (POC) |
| Admin functions | Multi-sig for parameter changes |

### 10.4 Operational Security

| Requirement | Implementation |
|-------------|----------------|
| Logging | All API calls logged (no PII) |
| Monitoring | Real-time alerts for anomalies |
| Incident response | Documented runbook |
| Backup | Daily automated backups |
| Secret management | AWS Secrets Manager |

---

## 11. Success Metrics

### 11.1 Key Performance Indicators (KPIs)

**User Acquisition**
| Metric | Target (30 days) | Target (90 days) |
|--------|------------------|------------------|
| Registered users | 500 | 2,000 |
| KYC completed | 300 (60%) | 1,400 (70%) |
| Wallets bound | 250 (83% of KYC) | 1,200 (86% of KYC) |

**Circle Engagement**
| Metric | Target (30 days) | Target (90 days) |
|--------|------------------|------------------|
| Circles created | 20 | 100 |
| Active circles | 15 | 80 |
| Avg members/circle | 4 | 5 |

**Financial**
| Metric | Target (30 days) | Target (90 days) |
|--------|------------------|------------------|
| Total Value Locked | $50,000 | $500,000 |
| Transaction volume | $100,000 | $1,000,000 |
| Default rate | <3% | <2% |

**Credit System**
| Metric | Target (30 days) | Target (90 days) |
|--------|------------------|------------------|
| Users with score >500 | 100 | 500 |
| SDK queries | 1,000 | 10,000 |
| SDK integrations | 1 | 3 |

### 11.2 Product Health Metrics

| Metric | Target |
|--------|--------|
| Daily Active Users (DAU) | 20% of registered |
| Monthly Active Users (MAU) | 60% of registered |
| On-time payment rate | >90% |
| Circle completion rate | >80% |
| NPS score | >50 |

### 11.3 Technical Health Metrics

| Metric | Target |
|--------|--------|
| API uptime | 99.5% |
| API latency (p95) | <200ms |
| Error rate | <1% |
| Transaction success rate | >99% |
| Page load time | <2s |

---

## 12. Release Plan

### 12.1 POC Milestones

| Milestone | Week | Deliverables |
|-----------|------|--------------|
| M1: Foundation | 2 | Infrastructure, auth, basic UI shell |
| M2: Identity | 4 | KYC flow, wallet binding, identity contract |
| M3: Circles | 6 | Circle CRUD, smart contracts, join flow |
| M4: Payments | 8 | Contributions, payouts, notifications |
| M5: Credit | 9 | Score calculation, display, SDK |
| M6: Polish | 10 | UI polish, bug fixes, performance |
| M7: Testing | 11 | Integration tests, load tests, security review |
| M8: Launch | 12 | Mainnet deployment, monitoring, launch |

### 12.2 Launch Checklist

**Pre-Launch (Week 11)**
- [ ] All critical bugs resolved
- [ ] Security audit findings addressed
- [ ] Load testing passed (1000 concurrent users)
- [ ] Documentation complete
- [ ] Support team trained
- [ ] Monitoring dashboards ready
- [ ] Rollback plan documented

**Launch Day (Week 12)**
- [ ] Testnet final verification
- [ ] Mainnet contract deployment
- [ ] DNS cutover
- [ ] SSL certificate verified
- [ ] Health checks passing
- [ ] On-call team assigned
- [ ] Communication channels ready

**Post-Launch (Week 12+)**
- [ ] Monitor error rates hourly
- [ ] Track user feedback
- [ ] Daily standup for first week
- [ ] Hotfix process ready
- [ ] User support active

### 12.3 Future Roadmap (Post-POC)

**Phase 2 (Q2 2026)**
- Mobile app (iOS, Android)
- Additional payout methods (auction, need-based)
- Collateral system
- Multi-token support (beyond USDC)

**Phase 3 (Q3 2026)**
- Fiat on/off ramps (Stellar anchors)
- Peer attestation system
- Credit card partnership
- Geographic expansion

**Phase 4 (Q4 2026)**
- Cross-chain deployment
- Institutional SDK
- Credit bureau integration
- White-label solution

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| ROSCA | Rotating Savings and Credit Association - traditional group savings |
| Chit Fund | Indian term for ROSCA |
| Circle | A lending circle in Halo Protocol |
| Contribution | A payment made by a member to the circle |
| Payout | The distribution of pooled contributions to a recipient |
| Period | One contribution/payout cycle in a circle |
| Unique ID | Hash-based identifier ensuring one account per person |
| Credit Score | Reputation score (300-850) based on payment behavior |
| SDK | Software Development Kit for external protocol integration |
| TVL | Total Value Locked in the protocol |

---

## Appendix B: Open Questions

| # | Question | Decision Needed By | Owner |
|---|----------|-------------------|-------|
| 1 | Should we support circles with variable contribution amounts? | Week 3 | Product |
| 2 | What happens if organizer abandons a circle? | Week 4 | Product |
| 3 | Should credit score be visible to other circle members? | Week 5 | Product |
| 4 | Emergency withdrawal mechanism needed? | Week 5 | Legal |
| 5 | Insurance fund for defaults? | Week 6 | Finance |

---

## Appendix C: Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1.0 | Jan 2026 | XXIX Labs | Initial draft |
| 1.0.0 | Jan 2026 | XXIX Labs | Finalized for POC development |

---

**Document Approval**

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Tech Lead | | | |
| Design Lead | | | |
| Engineering Manager | | | |
