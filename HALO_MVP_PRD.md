# Halo Protocol: MVP Product Requirements Document

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Author:** XXIX Labs  
**Target Launch:** 8 Weeks  
**Status:** Ready for Development

---

## Executive Summary

### What We're Building

A web app where users can:
1. Sign up and verify their identity (once)
2. Create or join a savings circle with friends
3. Make monthly USDC contributions
4. Receive payouts on their turn
5. Build a credit score from payment history

### What We're NOT Building (Yet)

- Mobile app
- Multiple payout methods (auction, bidding)
- Collateral/deposits
- Fiat on/off ramps
- Peer attestations
- Public circle discovery
- Multi-token support

### MVP Success Criteria

| Metric | Target |
|--------|--------|
| Completed signups (KYC + wallet) | 100 users |
| Circles created | 10 |
| At least one circle completes | 1 |
| Zero critical bugs | 0 |
| User can explain product in 1 sentence | Yes |

---

## Table of Contents

1. [Core User Flow](#1-core-user-flow)
2. [MVP Features](#2-mvp-features)
3. [Screen-by-Screen Specifications](#3-screen-by-screen-specifications)
4. [Data Models](#4-data-models)
5. [API Endpoints](#5-api-endpoints)
6. [Smart Contract Functions](#6-smart-contract-functions)
7. [Technical Constraints](#7-technical-constraints)
8. [Out of Scope](#8-out-of-scope)
9. [Launch Checklist](#9-launch-checklist)

---

## 1. Core User Flow

### 1.1 The Happy Path

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MVP USER JOURNEY                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ONBOARDING (One-time, ~10 minutes)                                         │
│  ══════════════════════════════════                                         │
│                                                                              │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐                  │
│  │ Landing │───▶│ Sign Up │───▶│ Verify  │───▶│ Connect │                  │
│  │ Page    │    │ (Google)│    │ ID(KYC) │    │ Wallet  │                  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘                  │
│       │              │              │              │                        │
│       ▼              ▼              ▼              ▼                        │
│   "Join the     "One click"    "Scan ID,      "Connect                     │
│    waitlist"                    selfie"        Freighter"                   │
│                                                     │                        │
│                                                     ▼                        │
│                                              ┌───────────┐                  │
│                                              │ Dashboard │                  │
│                                              │ (Empty)   │                  │
│                                              └───────────┘                  │
│                                                                              │
│  ════════════════════════════════════════════════════════════════════════   │
│                                                                              │
│  CIRCLE CREATION (Organizer)                                                │
│  ═══════════════════════════                                                │
│                                                                              │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐                           │
│  │ Click     │───▶│ Set       │───▶│ Get       │                           │
│  │ "Create"  │    │ Parameters│    │ Invite    │                           │
│  └───────────┘    └───────────┘    │ Link      │                           │
│                         │          └───────────┘                           │
│                         ▼                │                                  │
│                   Name: "Office Fund"    ▼                                  │
│                   Amount: $100/month   Share with                           │
│                   Members: 5           friends on                           │
│                   Start: Feb 1         WhatsApp                             │
│                                                                              │
│  ════════════════════════════════════════════════════════════════════════   │
│                                                                              │
│  JOINING (Member)                                                           │
│  ════════════════                                                           │
│                                                                              │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐                           │
│  │ Click     │───▶│ Review    │───▶│ Confirm   │                           │
│  │ Invite    │    │ Terms     │    │ Join      │                           │
│  │ Link      │    │           │    │           │                           │
│  └───────────┘    └───────────┘    └───────────┘                           │
│                         │                │                                  │
│                         ▼                ▼                                  │
│                   See: amount,      Added to                                │
│                   members,          circle,                                 │
│                   schedule          assigned                                │
│                                     position                                │
│                                                                              │
│  ════════════════════════════════════════════════════════════════════════   │
│                                                                              │
│  MONTHLY CYCLE (All Members)                                                │
│  ═══════════════════════════                                                │
│                                                                              │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐         │
│  │ Get       │───▶│ Open App  │───▶│ Click     │───▶│ Approve   │         │
│  │ Reminder  │    │ See "Pay" │    │ "Pay Now" │    │ in Wallet │         │
│  │ (Email)   │    │           │    │           │    │           │         │
│  └───────────┘    └───────────┘    └───────────┘    └───────────┘         │
│                                                           │                 │
│                                                           ▼                 │
│                                                    ┌───────────┐           │
│                                                    │ Done!     │           │
│                                                    │ Score +2  │           │
│                                                    └───────────┘           │
│                                                                              │
│  When all pay ──▶ Payout sent to this month's recipient automatically      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Interactions (Simplified)

| Action | Clicks | Time |
|--------|--------|------|
| Sign up | 1 (Google OAuth) | 5 sec |
| Complete KYC | 3-4 | 2-3 min |
| Connect wallet | 2 | 30 sec |
| Create circle | 4 (form steps) | 2 min |
| Join circle | 2 | 30 sec |
| Make payment | 2 | 20 sec |

---

## 2. MVP Features

### 2.1 Feature Priority Matrix

| Feature | Must Have | Nice to Have | Not in MVP |
|---------|:---------:|:------------:|:----------:|
| Google sign-up | ✅ | | |
| Email sign-up | | ✅ | |
| KYC (Fractal) | ✅ | | |
| Wallet connect (Freighter) | ✅ | | |
| Other wallets (Albedo, xBull) | | ✅ | |
| Create circle | ✅ | | |
| Private invite link | ✅ | | |
| Public circle discovery | | | ❌ |
| Join circle | ✅ | | |
| View circle status | ✅ | | |
| Make contribution | ✅ | | |
| Automatic payout | ✅ | | |
| Basic credit score | ✅ | | |
| Score breakdown UI | | ✅ | |
| Email reminders | ✅ | | |
| Push notifications | | | ❌ |
| Mobile app | | | ❌ |

### 2.2 MVP Feature Specifications

---

#### FEATURE 1: User Onboarding

**Goal:** Get user from landing page to wallet-bound in under 10 minutes.

**Flow:**
```
Landing → Google OAuth → KYC → Wallet Connect → Dashboard
```

**Requirements:**

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| ONB-1 | Google OAuth login | User clicks "Continue with Google", OAuth completes, user is logged in |
| ONB-2 | KYC via Fractal | User completes ID + selfie verification in Fractal widget |
| ONB-3 | Unique ID generation | System generates unique_id from KYC data, prevents duplicates |
| ONB-4 | Wallet connection | User connects Freighter wallet with one click |
| ONB-5 | Wallet binding | User signs message, binding is recorded on-chain |
| ONB-6 | Binding is permanent | System shows warning, user confirms, cannot change later |

**Error States:**
- KYC fails → Show reason, allow retry
- Wallet already bound → "This wallet is already linked to another account"
- User already has account → Redirect to login

---

#### FEATURE 2: Create Circle

**Goal:** Organizer creates a circle and gets an invite link in under 2 minutes.

**Flow:**
```
Dashboard → Create Circle → Set Parameters → Confirm → Get Link
```

**Circle Parameters (MVP):**

| Parameter | Type | Constraints | Required |
|-----------|------|-------------|----------|
| name | string | 3-30 characters | Yes |
| contribution_amount | number | $10 - $500 USDC | Yes |
| member_count | select | 3, 4, 5, 6, 7, 8, 9, 10 | Yes |
| start_date | date | Today + 3 days minimum | Yes |

**Fixed Parameters (MVP):**
- Frequency: Monthly (fixed)
- Payout method: Rotation (fixed, organizer is position 1)
- Visibility: Private only (invite link required)
- Currency: USDC only

**Requirements:**

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| CIR-1 | Create circle form | Single page form with all parameters |
| CIR-2 | Preview schedule | Show payout dates before confirming |
| CIR-3 | On-chain creation | Circle created on Stellar, tx hash shown |
| CIR-4 | Generate invite link | Unique link like `halo.app/join/ABC123` |
| CIR-5 | Copy link button | One-click copy to clipboard |
| CIR-6 | Share via WhatsApp | "Share" button opens WhatsApp with link |

**Validations:**
- User must have completed onboarding
- User cannot create circle if already in 3 active circles (MVP limit)

---

#### FEATURE 3: Join Circle

**Goal:** Member joins circle via invite link in under 1 minute.

**Flow:**
```
Click Invite Link → Review Circle → Confirm Join → Added to Circle
```

**Requirements:**

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| JOIN-1 | Invite link works | Link opens circle preview page |
| JOIN-2 | Show circle details | Display: name, amount, members, start date, schedule |
| JOIN-3 | Show who's already joined | List of current members (names only) |
| JOIN-4 | Join button | "Join This Circle" button |
| JOIN-5 | On-chain join | Membership recorded on contract |
| JOIN-6 | Position assigned | User gets next available payout position |
| JOIN-7 | Redirect to circle | After join, show circle dashboard |

**Validations:**
- User must have completed onboarding
- Circle must not be full
- Circle must not have started
- User cannot join same circle twice
- User cannot join if already in 3 active circles

**Error States:**
- Circle full → "This circle is full"
- Already started → "This circle has already started"
- Not logged in → Redirect to login, then back to invite

---

#### FEATURE 4: Circle Dashboard

**Goal:** Member sees clear status of their circle and what action is needed.

**Information Displayed:**

```
┌─────────────────────────────────────────────────────────────────┐
│  OFFICE SAVINGS FUND                              [Active]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Progress: ████████░░ Period 4 of 5                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  💰 YOUR CONTRIBUTION                                    │    │
│  │                                                          │    │
│  │  Amount: $100 USDC                                       │    │
│  │  Due: February 28, 2026 (in 5 days)                     │    │
│  │  Status: ⏳ Pending                                      │    │
│  │                                                          │    │
│  │  [══════════ PAY NOW ══════════]                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  This Month's Payout                                            │
│  ───────────────────                                            │
│  Recipient: Sarah M. (Position #4)                              │
│  Amount: $500 USDC (when all pay)                               │
│                                                                  │
│  Payment Status                                                  │
│  ──────────────                                                 │
│  ✅ John D. (Organizer) - Paid Feb 23                           │
│  ✅ Mike R. - Paid Feb 24                                       │
│  ✅ Sarah M. - Paid Feb 25                                      │
│  ⏳ You - Pending                                                │
│  ⏳ Lisa K. - Pending                                            │
│                                                                  │
│  ───────────────────────────────────────────────────────────    │
│                                                                  │
│  Payout Schedule                                    [Expand ▼]   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Requirements:**

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| DASH-1 | Show circle status | Name, progress, current period |
| DASH-2 | Show my payment status | Amount, due date, paid/pending |
| DASH-3 | Show "Pay Now" button | Prominent when payment pending |
| DASH-4 | Show all members' status | List with paid/pending indicators |
| DASH-5 | Show this month's recipient | Who gets payout this round |
| DASH-6 | Show payout schedule | Expandable list of all rounds |
| DASH-7 | Show my position | "You receive payout in Round 3" |

**States:**
- `forming` - Waiting for members, show member count
- `active` - Show payment status, "Pay Now" if needed
- `completed` - Show completion message, final stats

---

#### FEATURE 5: Make Contribution

**Goal:** Member pays their contribution in under 30 seconds.

**Flow:**
```
Click "Pay Now" → Confirm Amount → Approve in Wallet → Success
```

**Requirements:**

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| PAY-1 | Show confirmation modal | Display amount, circle name, period |
| PAY-2 | Check wallet balance | Warn if insufficient USDC |
| PAY-3 | Submit transaction | Call contribute() on smart contract |
| PAY-4 | Show loading state | "Processing payment..." with spinner |
| PAY-5 | Show success | "Payment successful! +2 credit points" |
| PAY-6 | Update UI immediately | Payment status changes to "Paid" |
| PAY-7 | Handle failure | Show error, allow retry |

**Transaction Details:**
- Amount: Exact contribution amount (e.g., 100 USDC)
- Recipient: Circle contract address
- Memo: Circle ID + Period number

---

#### FEATURE 6: Automatic Payout

**Goal:** When all members pay, recipient automatically receives funds.

**Trigger:** Last contribution for the period is received.

**Requirements:**

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| POUT-1 | Detect all paid | Backend monitors contract events |
| POUT-2 | Trigger payout | Call process_payout() on contract |
| POUT-3 | Transfer funds | Contract sends total to recipient |
| POUT-4 | Notify recipient | Email: "You received $500 from [Circle]!" |
| POUT-5 | Advance period | Circle moves to next period |
| POUT-6 | Handle partial | If grace period ends with missing payments, payout available contributions only |

**Timing:**
- Payout triggered immediately when last payment received
- OR at end of grace period (7 days after due date)

---

#### FEATURE 7: Credit Score

**Goal:** User sees their credit score and understands it's based on payment behavior.

**MVP Scoring (Simplified):**

```
Starting Score: 300
Maximum Score: 850

Points Earned:
├─ Each on-time payment: +10 points
├─ Each late payment (1-7 days): +2 points  
├─ Each missed payment: -20 points
└─ Circle completed: +50 bonus points

Score = 300 + sum(payment_points) + sum(completion_bonuses)
Capped at 850
```

**Requirements:**

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| CRED-1 | Display score on dashboard | Large number (e.g., "420") prominently shown |
| CRED-2 | Show score tier | "Fair" / "Good" / "Very Good" / "Excellent" |
| CRED-3 | Update after payment | Score changes reflected immediately |
| CRED-4 | Store on-chain | Score stored in Credit contract |
| CRED-5 | Basic history | List of score changes with reasons |

**Score Tiers (MVP):**
| Range | Tier | Color |
|-------|------|-------|
| 300-449 | Building | Gray |
| 450-599 | Fair | Orange |
| 600-749 | Good | Yellow |
| 750-850 | Excellent | Green |

---

#### FEATURE 8: Email Notifications

**Goal:** Users never miss a payment due to forgetfulness.

**Email Templates:**

| Trigger | Subject | Timing |
|---------|---------|--------|
| Circle started | "[Circle] has started!" | When circle becomes active |
| Payment reminder | "Reminder: $100 due in 3 days" | 3 days before due |
| Payment due today | "Today: Pay your contribution" | On due date |
| Payment overdue | "Overdue: Please pay ASAP" | 1 day after due |
| Payout received | "You received $500!" | When payout sent |
| Circle completed | "Congratulations! Circle complete" | When circle ends |

**Requirements:**

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| EMAIL-1 | Send payment reminders | Emails sent 3 days before, on due date |
| EMAIL-2 | Send payout notification | Email when user receives payout |
| EMAIL-3 | Include action link | "Pay Now" button links to app |
| EMAIL-4 | Transactional delivery | Use SendGrid/Resend for reliability |

---

## 3. Screen-by-Screen Specifications

### 3.1 Screen Inventory (MVP)

| # | Screen | URL | Priority |
|---|--------|-----|----------|
| 1 | Landing Page | `/` | Must |
| 2 | Login | `/login` | Must |
| 3 | KYC Flow | `/onboarding/kyc` | Must |
| 4 | Wallet Connect | `/onboarding/wallet` | Must |
| 5 | Dashboard | `/dashboard` | Must |
| 6 | Create Circle | `/circles/create` | Must |
| 7 | Circle Detail | `/circles/[id]` | Must |
| 8 | Join Circle | `/join/[code]` | Must |
| 9 | Credit Score | `/credit` | Must |
| 10 | Profile/Settings | `/settings` | Should |

---

### 3.2 Screen: Landing Page

**URL:** `/`

**Purpose:** Convert visitors to signups

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]                                    [Login] [Get Started]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│              Build Credit With Your Community                    │
│                                                                  │
│    Join trusted savings circles. Make payments on time.         │
│    Build a credit score that travels with you.                  │
│                                                                  │
│              [Get Started - It's Free]                          │
│                                                                  │
│                    ┌─────────────────┐                          │
│                    │  Circle Visual  │                          │
│                    │  (Animation)    │                          │
│                    └─────────────────┘                          │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  HOW IT WORKS                                                    │
│                                                                  │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐                 │
│  │ 1. Join │      │ 2. Save │      │ 3. Build│                 │
│  │ Circle  │ ───▶ │ Together│ ───▶ │ Credit  │                 │
│  └─────────┘      └─────────┘      └─────────┘                 │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TRUSTED BY                                                      │
│  [Stellar Logo]  [Soonami Logo]                                 │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  Footer: About | Terms | Privacy | Contact                      │
└─────────────────────────────────────────────────────────────────┘
```

**Interactions:**
- "Get Started" → `/login`
- "Login" → `/login`

---

### 3.3 Screen: Dashboard

**URL:** `/dashboard`

**Purpose:** Show user's circles and credit score at a glance

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]          Dashboard                        [👤 Profile]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐ │
│  │     CREDIT SCORE         │  │     QUICK ACTIONS            │ │
│  │                          │  │                              │ │
│  │         420              │  │  [+ Create Circle]           │ │
│  │        ─────             │  │                              │ │
│  │         Fair             │  │  [📋 Join with Code]         │ │
│  │                          │  │                              │ │
│  │    [View Details →]      │  │                              │ │
│  └──────────────────────────┘  └──────────────────────────────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ⚡ ACTION REQUIRED                                       │   │
│  │                                                           │   │
│  │  Office Savings - $100 due in 3 days    [Pay Now]        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  MY CIRCLES                                                      │
│  ──────────                                                     │
│                                                                  │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │ Office Savings     │  │ Family Fund        │                │
│  │ ████████░░ 80%     │  │ Forming (3/5)      │                │
│  │ $100/month         │  │ $200/month         │                │
│  │ [View →]           │  │ [View →]           │                │
│  └────────────────────┘  └────────────────────┘                │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  No more circles                                          │   │
│  │  [+ Create a Circle] or [Join with Invite Link]          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**States:**
- **Empty:** No circles → Show "Create your first circle" CTA
- **Has circles:** Show circle cards
- **Action needed:** Show prominent alert for pending payments

---

### 3.4 Screen: Create Circle

**URL:** `/circles/create`

**Purpose:** Create a new circle with simple form

**Layout (Single Page Form):**
```
┌─────────────────────────────────────────────────────────────────┐
│  [← Back]              Create Circle                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Circle Name                                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Office Savings Fund                                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Monthly Contribution                                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ $ [100]                                           USDC   │    │
│  └─────────────────────────────────────────────────────────┘    │
│  Min $10 · Max $500                                             │
│                                                                  │
│  Number of Members                                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ [3] [4] [5] [6] [7] [8] [9] [10]                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│  Including you                                                   │
│                                                                  │
│  Start Date                                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ February 15, 2026                              [📅]      │    │
│  └─────────────────────────────────────────────────────────┘    │
│  Must be at least 3 days from today                             │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  PREVIEW                                                         │
│                                                                  │
│  Duration: 5 months (Feb - Jun 2026)                            │
│  Each member contributes: $100/month × 5 = $500 total           │
│  Each member receives: $500 (once, on their turn)               │
│                                                                  │
│  Payout Schedule:                                                │
│  • Round 1 (Feb): You (Organizer)                               │
│  • Round 2 (Mar): Member #2                                     │
│  • Round 3 (Apr): Member #3                                     │
│  • Round 4 (May): Member #4                                     │
│  • Round 5 (Jun): Member #5                                     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │            [Create Circle & Get Invite Link]             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**After Creation:**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                    ✅ Circle Created!                            │
│                                                                  │
│  Share this link with your group:                               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ https://halo.app/join/ABC123XYZ              [📋 Copy]  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  [Share on WhatsApp]  [Share on Telegram]                       │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Members joined: 1 of 5                                         │
│  You're in! Waiting for 4 more members.                         │
│                                                                  │
│            [Go to Circle Dashboard]                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3.5 Screen: Join Circle

**URL:** `/join/[code]`

**Purpose:** Let invited users join a circle

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]                                              [Login]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│              You're Invited to Join                             │
│                                                                  │
│              ┌─────────────────────────┐                        │
│              │   OFFICE SAVINGS FUND   │                        │
│              └─────────────────────────┘                        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │  Organized by: John D.                                   │    │
│  │                                                          │    │
│  │  Contribution: $100 USDC / month                        │    │
│  │  Members: 5 people                                       │    │
│  │  Duration: 5 months                                      │    │
│  │  Starts: February 15, 2026                              │    │
│  │                                                          │    │
│  │  ────────────────────────────────────────────────────   │    │
│  │                                                          │    │
│  │  Already Joined (2 of 5):                               │    │
│  │  • John D. (Organizer)                                  │    │
│  │  • Sarah M.                                              │    │
│  │                                                          │    │
│  │  ────────────────────────────────────────────────────   │    │
│  │                                                          │    │
│  │  Your commitment:                                        │    │
│  │  • Pay $100 USDC every month for 5 months               │    │
│  │  • Receive $500 USDC on your payout turn                │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              [Join This Circle]                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  By joining, you agree to the circle terms.                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**If not logged in:** Show same page but button says "Sign Up to Join" → redirects to login, then back.

**If circle is full:**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│              This Circle is Full                                │
│                                                                  │
│  All 5 spots have been filled.                                  │
│                                                                  │
│  [Create Your Own Circle]  [Go to Dashboard]                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3.6 Screen: Circle Detail

**URL:** `/circles/[id]`

**Purpose:** View circle status, make payments, see schedule

**(See Section 2.2 Feature 4 for detailed layout)**

---

### 3.7 Screen: Credit Score

**URL:** `/credit`

**Purpose:** View credit score and history

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  [← Dashboard]           Credit Score                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │                        420                               │    │
│  │                       ─────                              │    │
│  │                        Fair                              │    │
│  │                                                          │    │
│  │     300 ════════════●════════════════════════════ 850   │    │
│  │         Building    Fair    Good       Excellent         │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  HOW TO IMPROVE                                                  │
│  ─────────────                                                  │
│  ✓ Make payments on time (+10 points each)                      │
│  ✓ Complete full circles (+50 bonus points)                     │
│  ✗ Avoid late payments (reduced points)                         │
│  ✗ Never miss payments (-20 points)                             │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  SCORE HISTORY                                                   │
│                                                                  │
│  Feb 25  │ +10  │ On-time payment (Office Savings)    │ 420    │
│  Feb 1   │ +10  │ On-time payment (Office Savings)    │ 410    │
│  Jan 15  │ +50  │ Circle completed (Friends Pool)     │ 400    │
│  Jan 5   │ +10  │ On-time payment (Friends Pool)      │ 350    │
│  Dec 5   │ +10  │ On-time payment (Friends Pool)      │ 340    │
│  Nov 5   │ +10  │ On-time payment (Friends Pool)      │ 330    │
│  Oct 5   │ +10  │ On-time payment (Friends Pool)      │ 320    │
│  Sep 5   │ +10  │ On-time payment (Friends Pool)      │ 310    │
│  Sep 1   │ +10  │ First payment (Friends Pool)        │ 300    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Data Models

### 4.1 User (MVP)

```typescript
interface User {
  id: string;              // UUID
  email: string;           // From Google OAuth
  name: string;            // Display name
  
  // KYC
  kyc_status: 'pending' | 'verified' | 'rejected';
  unique_id?: string;      // SHA256 hash (anti-sybil)
  
  // Wallet
  wallet_address?: string; // Stellar public key
  wallet_bound_at?: Date;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}
```

### 4.2 Circle (MVP)

```typescript
interface Circle {
  id: string;              // UUID
  contract_id: string;     // Stellar contract address
  
  name: string;
  contribution_amount: number;  // In USDC (6 decimals)
  member_count: number;    // Target members (3-10)
  start_date: Date;
  
  // Calculated
  end_date: Date;          // start_date + (member_count months)
  
  // State
  status: 'forming' | 'active' | 'completed';
  current_period: number;  // 1-indexed
  
  // Relations
  organizer_id: string;    // User ID
  invite_code: string;     // For joining (e.g., "ABC123XYZ")
  
  created_at: Date;
  updated_at: Date;
}
```

### 4.3 Membership (MVP)

```typescript
interface Membership {
  id: string;
  circle_id: string;
  user_id: string;
  
  payout_position: number; // 1-indexed (1 = first payout)
  
  joined_at: Date;
}
```

### 4.4 Contribution (MVP)

```typescript
interface Contribution {
  id: string;
  circle_id: string;
  user_id: string;
  period: number;          // Which round
  
  amount: number;          // USDC
  due_date: Date;
  paid_at?: Date;
  
  status: 'pending' | 'paid' | 'late' | 'missed';
  transaction_hash?: string;
  
  // Credit impact
  points_earned: number;
  
  created_at: Date;
}
```

### 4.5 Payout (MVP)

```typescript
interface Payout {
  id: string;
  circle_id: string;
  recipient_id: string;    // User who receives payout
  period: number;
  
  amount: number;          // Total USDC sent
  transaction_hash?: string;
  
  status: 'pending' | 'completed';
  processed_at?: Date;
  
  created_at: Date;
}
```

### 4.6 CreditScore (MVP)

```typescript
interface CreditScore {
  id: string;
  user_id: string;
  
  score: number;           // 300-850
  
  // Stats
  total_payments: number;
  on_time_payments: number;
  late_payments: number;
  missed_payments: number;
  circles_completed: number;
  
  updated_at: Date;
}
```

### 4.7 CreditEvent (MVP)

```typescript
interface CreditEvent {
  id: string;
  user_id: string;
  
  type: 'payment_ontime' | 'payment_late' | 'payment_missed' | 'circle_completed';
  points_change: number;   // Can be negative
  score_after: number;
  
  circle_id?: string;
  description: string;     // "On-time payment (Office Savings)"
  
  created_at: Date;
}
```

---

## 5. API Endpoints

### 5.1 Authentication

```
POST /api/auth/google
  Request:  { id_token: string }
  Response: { access_token, user }

POST /api/auth/refresh
  Request:  { refresh_token: string }
  Response: { access_token }

POST /api/auth/logout
  Response: { success: true }
```

### 5.2 Onboarding

```
POST /api/onboarding/kyc/start
  Response: { session_url, session_id }

GET /api/onboarding/kyc/status
  Response: { status: 'pending' | 'verified' | 'rejected' }

POST /api/onboarding/wallet/bind
  Request:  { wallet_address, signature, message }
  Response: { success, transaction_hash }
```

### 5.3 Circles

```
GET /api/circles
  Response: { circles: Circle[] }

POST /api/circles
  Request:  { name, contribution_amount, member_count, start_date }
  Response: { circle, invite_code, invite_link }

GET /api/circles/:id
  Response: { circle, members, contributions, payouts, my_membership }

POST /api/circles/:id/join
  Request:  { invite_code }
  Response: { membership }

GET /api/join/:code
  Response: { circle, members, can_join, reason? }
```

### 5.4 Contributions

```
GET /api/circles/:id/contributions
  Response: { period, due_date, contributions: Contribution[] }

POST /api/circles/:id/contribute
  Request:  { amount }
  Response: { contribution, transaction_hash, credit_impact }
```

### 5.5 Credit

```
GET /api/credit/score
  Response: { score, tier, stats }

GET /api/credit/history
  Response: { events: CreditEvent[] }

GET /api/credit/score/:wallet (Public - no auth)
  Response: { wallet, score, tier, verified }
```

---

## 6. Smart Contract Functions

### 6.1 Identity Contract

```rust
// Bind wallet to unique ID (one-time)
pub fn bind_wallet(
    unique_id: BytesN<32>,
    wallet: Address,
    signature: BytesN<64>
) -> Result<(), Error>

// Check if wallet is bound
pub fn is_bound(wallet: Address) -> bool

// Get unique ID for wallet
pub fn get_id(wallet: Address) -> Option<BytesN<32>>

// Get wallet for unique ID
pub fn get_wallet(unique_id: BytesN<32>) -> Option<Address>
```

### 6.2 Circle Contract

```rust
// Create new circle
pub fn create(
    organizer: Address,
    contribution_amount: i128,
    member_count: u32,
    start_date: u64
) -> Result<CircleId, Error>

// Join circle
pub fn join(
    circle_id: CircleId,
    member: Address
) -> Result<u32, Error>  // Returns payout position

// Make contribution
pub fn contribute(
    circle_id: CircleId,
    member: Address,
    amount: i128
) -> Result<(), Error>

// Process payout (called by backend when all paid or grace period ends)
pub fn process_payout(
    circle_id: CircleId
) -> Result<i128, Error>  // Returns amount paid out

// Get circle state
pub fn get_circle(circle_id: CircleId) -> CircleState

// Get member's contribution status for current period
pub fn get_contribution_status(
    circle_id: CircleId,
    member: Address
) -> ContributionStatus
```

### 6.3 Credit Contract

```rust
// Record payment (called by Circle contract)
pub fn record_payment(
    wallet: Address,
    on_time: bool,
    circle_id: CircleId
) -> Result<i32, Error>  // Returns new score

// Record circle completion (called by Circle contract)
pub fn record_completion(
    wallet: Address,
    circle_id: CircleId
) -> Result<i32, Error>  // Returns new score

// Get credit score
pub fn get_score(wallet: Address) -> i32

// Get score with stats (for SDK)
pub fn get_score_details(wallet: Address) -> ScoreDetails
```

---

## 7. Technical Constraints

### 7.1 MVP Limits

| Constraint | Limit | Reason |
|------------|-------|--------|
| Circles per user | 3 active | Reduce complexity |
| Members per circle | 3-10 | ROSCA standard range |
| Contribution amount | $10-$500 | Manageable risk |
| Frequency | Monthly only | Simplify scheduling |
| Currency | USDC only | Single token |
| Payout method | Rotation only | Simplest to implement |

### 7.2 Technical Stack (MVP)

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) |
| Styling | TailwindCSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL (Supabase) |
| Blockchain | Stellar (Soroban) |
| Wallet | Freighter |
| Auth | NextAuth.js + Google |
| KYC | Fractal ID |
| Email | Resend |
| Hosting | Vercel |

### 7.3 Performance Targets

| Metric | Target |
|--------|--------|
| Page load | < 2 seconds |
| API response | < 500ms |
| Transaction confirm | < 10 seconds |

---

## 8. Out of Scope

### 8.1 Explicitly NOT Building in MVP

| Feature | Why Not |
|---------|---------|
| Mobile app | Web-first, faster to ship |
| Email login | Google simpler, more secure |
| Public circles | Private invite simplifies trust |
| Multiple wallets | Freighter has best Stellar support |
| Auction payouts | Adds complexity |
| Collateral | Trust-based for MVP |
| Fiat payments | Crypto-only for MVP |
| Multi-language | English only |
| Push notifications | Email sufficient for MVP |
| Admin dashboard | Manual ops acceptable |

### 8.2 Known Limitations

| Limitation | Workaround |
|------------|------------|
| No dispute resolution | Trust-based circles only |
| No member removal (after start) | Choose members carefully |
| No schedule changes | Fixed once started |
| No partial contributions | Must pay full amount |
| Score not exportable | On-chain query available |

---

## 9. Launch Checklist

### 9.1 Development Complete

- [ ] User can sign up with Google
- [ ] User can complete KYC
- [ ] User can connect wallet
- [ ] User can create circle
- [ ] User can share invite link
- [ ] User can join via invite link
- [ ] User can see circle status
- [ ] User can make contribution
- [ ] Payout is sent automatically
- [ ] Credit score updates
- [ ] Email reminders work

### 9.2 Testing Complete

- [ ] Happy path works end-to-end
- [ ] Error states handled gracefully
- [ ] Mobile responsive
- [ ] Works on Chrome, Safari, Firefox
- [ ] Load tested (100 concurrent users)

### 9.3 Security

- [ ] Smart contracts reviewed
- [ ] No secrets in frontend
- [ ] Rate limiting enabled
- [ ] Input validation on all forms

### 9.4 Operations

- [ ] Monitoring set up (Sentry)
- [ ] Database backups configured
- [ ] Domain configured
- [ ] SSL certificate valid

### 9.5 Launch

- [ ] Testnet deployment verified
- [ ] Mainnet contracts deployed
- [ ] Production environment ready
- [ ] Team on standby for issues

---

## Appendix: Example User Session

### New User Complete Flow

```
1. User clicks invite link from friend: halo.app/join/ABC123
2. Sees circle preview: "Office Savings Fund - $100/month, 5 members"
3. Clicks "Sign Up to Join"
4. Redirected to Google OAuth → logs in
5. Redirected to KYC: "Verify your identity"
6. Completes Fractal ID (scans Aadhaar + selfie) - 2 minutes
7. KYC approved → "Connect your wallet"
8. Clicks "Connect Freighter" → approves in extension
9. Signs binding message → wallet linked
10. Redirected back to circle join page
11. Clicks "Join This Circle" → membership confirmed
12. Sees circle dashboard: "Waiting for 2 more members..."

[3 days later - circle starts]

13. Receives email: "Office Savings Fund has started!"
14. Opens app, sees: "Pay $100 - due Feb 28"
15. Clicks "Pay Now" → confirms amount
16. Approves transaction in Freighter
17. Success: "Payment confirmed! +10 credit points"
18. Credit score: 310

[When all members pay]

19. Receives email: "John D. received this month's payout!"
20. Circle advances to Period 2

[5 months later - user's turn]

21. Receives email: "You received $500!"
22. Checks wallet: +500 USDC
23. Circle completes
24. Credit score: 420 (+50 completion bonus)
```

---

**Document Control**

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Jan 2026 | Initial MVP specification |
