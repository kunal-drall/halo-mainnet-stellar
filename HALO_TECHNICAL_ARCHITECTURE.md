# Halo Protocol: Technical Architecture Document

**Version:** 1.0.0  
**Date:** January 2026  
**Author:** XXIX Labs (29Projects)  
**Classification:** Technical Specification

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Identity Layer Architecture](#3-identity-layer-architecture)
4. [Smart Contract Architecture (Soroban)](#4-smart-contract-architecture-soroban)
5. [Credit Scoring Algorithm](#5-credit-scoring-algorithm)
6. [SDK Architecture](#6-sdk-architecture)
7. [Backend Services](#7-backend-services)
8. [Database Schema](#8-database-schema)
9. [API Specifications](#9-api-specifications)
10. [Security Architecture](#10-security-architecture)
11. [Infrastructure & Deployment](#11-infrastructure--deployment)
12. [Integration Patterns](#12-integration-patterns)

---

## 1. Executive Summary

Halo Protocol is a decentralized infrastructure layer for group-based credit, starting with on-chain lending circles (ROSCAs - Rotating Savings and Credit Associations). Built natively on Stellar/Soroban, Halo transforms informal social trust into programmable, verifiable credit infrastructure.

### Core Value Propositions

- **Sybil-Resistant Identity**: One human = One identity = One wallet binding
- **Programmable Trust**: Smart contracts enforce group financial agreements
- **Portable Credit**: On-chain credit scores usable across protocols
- **Global Accessibility**: Stellar's anchor network enables fiat on/off ramps worldwide

### Technology Stack Overview

| Layer | Technology | Purpose |
|-------|------------|---------|
| Blockchain | Stellar (Soroban) | Smart contracts, settlements |
| Identity | Social OAuth + Decentralized KYC | User verification |
| Backend | Node.js/Rust | API services, orchestration |
| Database | PostgreSQL + Redis | State management, caching |
| Frontend | Next.js + React Native | Web & mobile applications |

---

## 2. System Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────┤
│   Web App       │   Mobile App    │   Partner SDK   │   Credit Card Portal  │
│   (Next.js)     │   (React Native)│   (TypeScript)  │   (Future)            │
└────────┬────────┴────────┬────────┴────────┬────────┴───────────┬───────────┘
         │                 │                 │                    │
         ▼                 ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY                                     │
│                         (Rate Limiting, Auth, Routing)                       │
└────────┬────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND SERVICES                                   │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────┤
│   Identity      │   Circle        │   Credit        │   Notification        │
│   Service       │   Service       │   Service       │   Service             │
├─────────────────┼─────────────────┼─────────────────┼───────────────────────┤
│   KYC           │   Governance    │   Analytics     │   Anchor              │
│   Service       │   Service       │   Service       │   Integration         │
└────────┬────────┴────────┬────────┴────────┬────────┴───────────┬───────────┘
         │                 │                 │                    │
         ▼                 ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                         │
├─────────────────────────────────┬───────────────────────────────────────────┤
│         PostgreSQL              │              Redis                         │
│    (Primary Database)           │         (Cache & Sessions)                 │
└─────────────────────────────────┴───────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        STELLAR BLOCKCHAIN LAYER                              │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────┤
│   Identity      │   Circle        │   Credit        │   Treasury            │
│   Contract      │   Contract      │   Contract      │   Contract            │
└─────────────────┴─────────────────┴─────────────────┴───────────────────────┘
```

### 2.2 Data Flow Architecture

```
User Registration Flow:
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Social  │───▶│  Profile │───▶│   KYC    │───▶│ Generate │───▶│  Wallet  │
│  Login   │    │  Entry   │    │  Verify  │    │ UniqueID │    │  Binding │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘

Circle Lifecycle Flow:
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Create  │───▶│  Invite  │───▶│  Active  │───▶│ Payouts  │───▶│ Complete │
│  Circle  │    │ Members  │    │  Phase   │    │  Phase   │    │  & Score │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

---

## 3. Identity Layer Architecture

### 3.1 Identity System Overview

The identity system ensures one-human-one-account through a multi-layered verification approach.

```
┌─────────────────────────────────────────────────────────────────┐
│                     IDENTITY STACK                               │
├─────────────────────────────────────────────────────────────────┤
│  Layer 4: Wallet Binding (Permanent, On-chain)                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Stellar Address ←→ Unique ID (Immutable Mapping)       │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3: Unique ID Generation (Deterministic Hash)             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Hash(KYC_Data + Biometric_Hash + Timestamp)            │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2: KYC Verification (Decentralized)                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Document Verification + Liveness Check + Deduplication │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  Layer 1: Social Authentication (Initial Entry)                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Google / Apple / Email OTP                             │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 User Registration Flow

```typescript
interface RegistrationFlow {
  // Step 1: Social Login
  socialAuth: {
    providers: ['google', 'apple', 'email'];
    data: {
      email: string;
      name: string;
      profileImage?: string;
      socialId: string;
    };
  };

  // Step 2: Profile Details
  profileEntry: {
    fullName: string;
    dateOfBirth: string;
    country: string;
    phoneNumber: string;
    preferredCurrency: string;
  };

  // Step 3: Decentralized KYC
  kycVerification: {
    provider: 'fractal' | 'polygon-id' | 'worldcoin';
    documentType: 'passport' | 'national_id' | 'drivers_license';
    documentHash: string;
    livenessProof: string;
    biometricHash: string;
  };

  // Step 4: Unique ID Generation
  uniqueIdGeneration: {
    algorithm: 'SHA256(KYC_HASH + BIOMETRIC_HASH + SALT)';
    uniqueId: string; // 32-byte hex string
    createdAt: timestamp;
  };

  // Step 5: Wallet Binding
  walletBinding: {
    stellarAddress: string;
    signatureProof: string;
    bindingTxHash: string;
    permanent: true;
  };
}
```

### 3.3 KYC Provider Integration

#### Option A: Fractal ID (Recommended for Production)

```typescript
interface FractalKYCConfig {
  endpoint: 'https://api.fractal.id/v2';
  verificationLevels: {
    basic: ['email', 'phone'];
    standard: ['document', 'selfie'];
    premium: ['liveness', 'aml_check'];
  };
  webhookUrl: 'https://api.usehalo.fun/kyc/webhook';
}

// KYC Verification Flow
async function verifyKYC(userId: string, level: string): Promise<KYCResult> {
  const session = await fractal.createSession({
    userId,
    level,
    redirectUrl: `https://usehalo.fun/kyc/complete`,
  });
  
  return {
    sessionId: session.id,
    verificationUrl: session.url,
    expiresAt: session.expiresAt,
  };
}
```

#### Option B: Polygon ID (Privacy-Preserving)

```typescript
interface PolygonIDConfig {
  issuerDID: 'did:polygonid:polygon:main:halo-protocol';
  claimTypes: {
    humanProof: 'HaloHumanVerification';
    kycProof: 'HaloKYCCredential';
  };
}

// Zero-Knowledge Proof Verification
async function verifyWithZKP(proof: ZKProof): Promise<boolean> {
  return await polygonId.verifyProof({
    proof,
    publicSignals: proof.publicSignals,
    verificationKey: HALO_VERIFICATION_KEY,
  });
}
```

### 3.4 Unique ID Generation Algorithm

```rust
// Soroban Contract: Identity Generation
use soroban_sdk::{contractimpl, Env, BytesN, Address};

pub struct UniqueIdGenerator;

#[contractimpl]
impl UniqueIdGenerator {
    /// Generate a unique, deterministic ID from KYC data
    pub fn generate_unique_id(
        env: Env,
        kyc_hash: BytesN<32>,
        biometric_hash: BytesN<32>,
        timestamp: u64,
    ) -> BytesN<32> {
        let mut combined = [0u8; 72];
        combined[0..32].copy_from_slice(&kyc_hash.to_array());
        combined[32..64].copy_from_slice(&biometric_hash.to_array());
        combined[64..72].copy_from_slice(&timestamp.to_be_bytes());
        
        env.crypto().sha256(&combined.into())
    }
    
    /// Bind wallet address to unique ID (ONE TIME ONLY)
    pub fn bind_wallet(
        env: Env,
        unique_id: BytesN<32>,
        wallet: Address,
        signature: BytesN<64>,
    ) -> Result<(), Error> {
        // Check if unique ID already has a wallet bound
        if env.storage().persistent().has(&unique_id) {
            return Err(Error::AlreadyBound);
        }
        
        // Check if wallet is already bound to another ID
        let reverse_key = DataKey::WalletToId(wallet.clone());
        if env.storage().persistent().has(&reverse_key) {
            return Err(Error::WalletAlreadyUsed);
        }
        
        // Verify signature proves wallet ownership
        wallet.require_auth();
        
        // Store bidirectional mapping
        env.storage().persistent().set(&unique_id, &wallet);
        env.storage().persistent().set(&reverse_key, &unique_id);
        
        // Emit binding event
        env.events().publish(
            (symbol_short!("bind"),),
            (unique_id.clone(), wallet.clone())
        );
        
        Ok(())
    }
}
```

### 3.5 Anti-Sybil Detection System

```typescript
interface AntiSybilSystem {
  // Backend checks before wallet binding
  preBindingChecks: {
    // Check if wallet has transaction history
    walletHistoryCheck: (address: string) => Promise<WalletHistory>;
    
    // Check if wallet interacted with known sybil addresses
    sybilGraphCheck: (address: string) => Promise<SybilRisk>;
    
    // Check if KYC data matches existing users
    deduplicationCheck: (kycHash: string) => Promise<DuplicateResult>;
    
    // Device fingerprint analysis
    deviceFingerprintCheck: (fingerprint: string) => Promise<DeviceRisk>;
  };
  
  // Continuous monitoring
  ongoingMonitoring: {
    // Detect unusual patterns
    behaviorAnalysis: (userId: string) => Promise<BehaviorScore>;
    
    // Cross-reference with other circles
    networkAnalysis: (userId: string) => Promise<NetworkScore>;
    
    // Flag suspicious activities
    fraudDetection: (activity: Activity) => Promise<FraudAlert>;
  };
}

// Sybil Detection Algorithm
async function calculateSybilRisk(user: User): Promise<SybilRiskScore> {
  const weights = {
    kycQuality: 0.30,
    walletAge: 0.15,
    transactionDiversity: 0.15,
    socialConnections: 0.20,
    deviceUniqueness: 0.10,
    behaviorConsistency: 0.10,
  };
  
  const scores = await Promise.all([
    evaluateKYCQuality(user.kycData),
    evaluateWalletAge(user.walletAddress),
    evaluateTransactionDiversity(user.walletAddress),
    evaluateSocialConnections(user.socialGraph),
    evaluateDeviceUniqueness(user.deviceFingerprint),
    evaluateBehaviorConsistency(user.activityHistory),
  ]);
  
  return calculateWeightedScore(scores, weights);
}
```

---

## 4. Smart Contract Architecture (Soroban)

### 4.1 Contract Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        HALO SMART CONTRACT SYSTEM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │    IDENTITY     │    │     CIRCLE      │    │     CREDIT      │         │
│  │    CONTRACT     │◄──►│    CONTRACT     │◄──►│    CONTRACT     │         │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘         │
│           │                      │                      │                   │
│           ▼                      ▼                      ▼                   │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │  - Unique IDs   │    │  - Circle State │    │  - Credit Scores│         │
│  │  - Wallet Binds │    │  - Contributions│    │  - Score Updates│         │
│  │  - KYC Proofs   │    │  - Payouts      │    │  - Score Queries│         │
│  │  - Verification │    │  - Governance   │    │  - Decay Logic  │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐                                 │
│  │    TREASURY     │    │   GOVERNANCE    │                                 │
│  │    CONTRACT     │◄──►│    CONTRACT     │                                 │
│  └────────┬────────┘    └────────┬────────┘                                 │
│           │                      │                                          │
│           ▼                      ▼                                          │
│  ┌─────────────────┐    ┌─────────────────┐                                 │
│  │  - Collateral   │    │  - Proposals    │                                 │
│  │  - Yield Gen    │    │  - Voting       │                                 │
│  │  - Fee Collect  │    │  - Execution    │                                 │
│  └─────────────────┘    └─────────────────┘                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Circle Contract (Core Logic)

```rust
// contracts/circle/src/lib.rs
#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, BytesN, Env, 
    Map, Symbol, Vec, log
};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Circle(BytesN<32>),           // Circle ID -> CircleState
    Member(BytesN<32>, Address),  // (Circle ID, Member) -> MemberState
    CircleCount,                   // Total circles created
    Admin,                         // Protocol admin
    CreditContract,               // Credit scoring contract address
    IdentityContract,             // Identity contract address
}

#[derive(Clone)]
#[contracttype]
pub struct CircleConfig {
    pub name: Symbol,
    pub contribution_amount: i128,      // Amount per contribution period
    pub contribution_token: Address,     // USDC or other token
    pub total_members: u32,              // Number of members
    pub payout_frequency: u64,           // Seconds between payouts
    pub payout_method: PayoutMethod,     // Rotation, Auction, or NeedBased
    pub collateral_required: bool,       // Whether collateral is needed
    pub collateral_percentage: u32,      // % of contribution as collateral
    pub late_fee_percentage: u32,        // % fee for late payments
    pub grace_period: u64,               // Seconds of grace before late fee
}

#[derive(Clone)]
#[contracttype]
pub enum PayoutMethod {
    Rotation,      // Sequential, predetermined order
    Auction,       // Members bid with discount for early payout
    NeedBased,     // Governance vote decides who gets payout
}

#[derive(Clone)]
#[contracttype]
pub struct CircleState {
    pub config: CircleConfig,
    pub creator: Address,
    pub members: Vec<Address>,
    pub current_round: u32,
    pub status: CircleStatus,
    pub created_at: u64,
    pub total_contributed: i128,
    pub total_paid_out: i128,
    pub payout_schedule: Vec<PayoutInfo>,
}

#[derive(Clone)]
#[contracttype]
pub enum CircleStatus {
    Forming,       // Accepting members
    Active,        // Contributions ongoing
    Paused,        // Temporarily paused
    Completed,     // All rounds completed
    Dissolved,     // Terminated early
}

#[derive(Clone)]
#[contracttype]
pub struct MemberState {
    pub unique_id: BytesN<32>,
    pub joined_at: u64,
    pub total_contributed: i128,
    pub contributions: Vec<ContributionRecord>,
    pub payout_position: u32,
    pub has_received_payout: bool,
    pub collateral_deposited: i128,
    pub reputation_at_join: u32,
}

#[derive(Clone)]
#[contracttype]
pub struct ContributionRecord {
    pub round: u32,
    pub amount: i128,
    pub timestamp: u64,
    pub on_time: bool,
    pub late_fee_paid: i128,
}

#[derive(Clone)]
#[contracttype]
pub struct PayoutInfo {
    pub round: u32,
    pub recipient: Address,
    pub amount: i128,
    pub timestamp: u64,
    pub bid_discount: u32,  // For auction method
}

#[contract]
pub struct HaloCircle;

#[contractimpl]
impl HaloCircle {
    /// Initialize the contract
    pub fn initialize(
        env: Env,
        admin: Address,
        credit_contract: Address,
        identity_contract: Address,
    ) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::CreditContract, &credit_contract);
        env.storage().instance().set(&DataKey::IdentityContract, &identity_contract);
        env.storage().instance().set(&DataKey::CircleCount, &0u64);
    }
    
    /// Create a new lending circle
    pub fn create_circle(
        env: Env,
        creator: Address,
        config: CircleConfig,
    ) -> BytesN<32> {
        creator.require_auth();
        
        // Verify creator has valid identity
        let identity_contract: Address = env.storage().instance().get(&DataKey::IdentityContract).unwrap();
        Self::verify_identity(&env, &identity_contract, &creator);
        
        // Generate circle ID
        let count: u64 = env.storage().instance().get(&DataKey::CircleCount).unwrap_or(0);
        let circle_id = Self::generate_circle_id(&env, &creator, count);
        
        // Initialize circle state
        let state = CircleState {
            config: config.clone(),
            creator: creator.clone(),
            members: Vec::new(&env),
            current_round: 0,
            status: CircleStatus::Forming,
            created_at: env.ledger().timestamp(),
            total_contributed: 0,
            total_paid_out: 0,
            payout_schedule: Vec::new(&env),
        };
        
        env.storage().persistent().set(&DataKey::Circle(circle_id.clone()), &state);
        env.storage().instance().set(&DataKey::CircleCount, &(count + 1));
        
        // Emit creation event
        env.events().publish(
            (Symbol::new(&env, "circle_created"),),
            (circle_id.clone(), creator, config.name)
        );
        
        circle_id
    }
    
    /// Join an existing circle
    pub fn join_circle(
        env: Env,
        circle_id: BytesN<32>,
        member: Address,
    ) -> Result<(), ContractError> {
        member.require_auth();
        
        let mut state: CircleState = env.storage().persistent()
            .get(&DataKey::Circle(circle_id.clone()))
            .ok_or(ContractError::CircleNotFound)?;
        
        // Validate circle is accepting members
        if state.status != CircleStatus::Forming {
            return Err(ContractError::CircleNotForming);
        }
        
        // Validate not already a member
        if state.members.contains(&member) {
            return Err(ContractError::AlreadyMember);
        }
        
        // Validate member count
        if state.members.len() >= state.config.total_members {
            return Err(ContractError::CircleFull);
        }
        
        // Verify identity
        let identity_contract: Address = env.storage().instance()
            .get(&DataKey::IdentityContract).unwrap();
        let unique_id = Self::get_unique_id(&env, &identity_contract, &member)?;
        
        // Get current credit score
        let credit_contract: Address = env.storage().instance()
            .get(&DataKey::CreditContract).unwrap();
        let reputation = Self::get_credit_score(&env, &credit_contract, &unique_id);
        
        // Handle collateral if required
        if state.config.collateral_required {
            let collateral_amount = (state.config.contribution_amount * 
                state.config.collateral_percentage as i128) / 100;
            Self::collect_collateral(&env, &member, &state.config.contribution_token, collateral_amount)?;
        }
        
        // Add member
        state.members.push_back(member.clone());
        
        // Create member state
        let member_state = MemberState {
            unique_id,
            joined_at: env.ledger().timestamp(),
            total_contributed: 0,
            contributions: Vec::new(&env),
            payout_position: state.members.len() as u32,
            has_received_payout: false,
            collateral_deposited: if state.config.collateral_required {
                (state.config.contribution_amount * state.config.collateral_percentage as i128) / 100
            } else {
                0
            },
            reputation_at_join: reputation,
        };
        
        env.storage().persistent().set(
            &DataKey::Member(circle_id.clone(), member.clone()),
            &member_state
        );
        
        // Check if circle is full and should activate
        if state.members.len() == state.config.total_members {
            state.status = CircleStatus::Active;
            state.current_round = 1;
            
            // Generate payout schedule if rotation method
            if let PayoutMethod::Rotation = state.config.payout_method {
                state.payout_schedule = Self::generate_rotation_schedule(&env, &state);
            }
        }
        
        env.storage().persistent().set(&DataKey::Circle(circle_id.clone()), &state);
        
        env.events().publish(
            (Symbol::new(&env, "member_joined"),),
            (circle_id, member)
        );
        
        Ok(())
    }
    
    /// Make a contribution to the circle
    pub fn contribute(
        env: Env,
        circle_id: BytesN<32>,
        member: Address,
        round: u32,
    ) -> Result<ContributionRecord, ContractError> {
        member.require_auth();
        
        let mut state: CircleState = env.storage().persistent()
            .get(&DataKey::Circle(circle_id.clone()))
            .ok_or(ContractError::CircleNotFound)?;
        
        // Validate circle is active
        if state.status != CircleStatus::Active {
            return Err(ContractError::CircleNotActive);
        }
        
        // Validate round
        if round != state.current_round {
            return Err(ContractError::InvalidRound);
        }
        
        // Get member state
        let mut member_state: MemberState = env.storage().persistent()
            .get(&DataKey::Member(circle_id.clone(), member.clone()))
            .ok_or(ContractError::NotMember)?;
        
        // Check if already contributed this round
        for contribution in member_state.contributions.iter() {
            if contribution.round == round {
                return Err(ContractError::AlreadyContributed);
            }
        }
        
        // Calculate if late
        let round_deadline = state.created_at + 
            (round as u64 * state.config.payout_frequency);
        let current_time = env.ledger().timestamp();
        let is_late = current_time > round_deadline + state.config.grace_period;
        
        // Calculate total amount (with late fee if applicable)
        let mut amount = state.config.contribution_amount;
        let mut late_fee = 0i128;
        
        if is_late {
            late_fee = (amount * state.config.late_fee_percentage as i128) / 100;
            amount += late_fee;
        }
        
        // Transfer tokens
        let token = token::Client::new(&env, &state.config.contribution_token);
        token.transfer(&member, &env.current_contract_address(), &amount);
        
        // Record contribution
        let record = ContributionRecord {
            round,
            amount: state.config.contribution_amount,
            timestamp: current_time,
            on_time: !is_late,
            late_fee_paid: late_fee,
        };
        
        member_state.contributions.push_back(record.clone());
        member_state.total_contributed += amount;
        state.total_contributed += amount;
        
        env.storage().persistent().set(
            &DataKey::Member(circle_id.clone(), member.clone()),
            &member_state
        );
        env.storage().persistent().set(&DataKey::Circle(circle_id.clone()), &state);
        
        // Update credit score
        let credit_contract: Address = env.storage().instance()
            .get(&DataKey::CreditContract).unwrap();
        Self::record_payment(&env, &credit_contract, &member_state.unique_id, !is_late);
        
        env.events().publish(
            (Symbol::new(&env, "contribution_made"),),
            (circle_id, member, round, amount, !is_late)
        );
        
        // Check if all contributions received for round
        Self::check_and_process_payout(&env, circle_id.clone(), &mut state)?;
        
        Ok(record)
    }
    
    /// Process payout for the current round
    pub fn process_payout(
        env: Env,
        circle_id: BytesN<32>,
    ) -> Result<PayoutInfo, ContractError> {
        let mut state: CircleState = env.storage().persistent()
            .get(&DataKey::Circle(circle_id.clone()))
            .ok_or(ContractError::CircleNotFound)?;
        
        // Validate all contributions received
        let contributions_this_round = Self::count_contributions_for_round(&env, &circle_id, &state, state.current_round);
        if contributions_this_round < state.config.total_members {
            return Err(ContractError::ContributionsIncomplete);
        }
        
        // Determine recipient based on payout method
        let (recipient, discount) = match &state.config.payout_method {
            PayoutMethod::Rotation => {
                let scheduled = state.payout_schedule.get(state.current_round as u32 - 1)
                    .ok_or(ContractError::NoScheduledPayout)?;
                (scheduled.recipient, 0u32)
            },
            PayoutMethod::Auction => Self::determine_auction_winner(&env, &circle_id, &state)?,
            PayoutMethod::NeedBased => Self::determine_need_based_recipient(&env, &circle_id, &state)?,
        };
        
        // Calculate payout amount
        let total_pool = state.config.contribution_amount * state.config.total_members as i128;
        let payout_amount = total_pool - ((total_pool * discount as i128) / 100);
        
        // Execute payout
        let token = token::Client::new(&env, &state.config.contribution_token);
        token.transfer(&env.current_contract_address(), &recipient, &payout_amount);
        
        // Record payout
        let payout_info = PayoutInfo {
            round: state.current_round,
            recipient: recipient.clone(),
            amount: payout_amount,
            timestamp: env.ledger().timestamp(),
            bid_discount: discount,
        };
        
        // Update member state
        let mut member_state: MemberState = env.storage().persistent()
            .get(&DataKey::Member(circle_id.clone(), recipient.clone()))
            .unwrap();
        member_state.has_received_payout = true;
        env.storage().persistent().set(
            &DataKey::Member(circle_id.clone(), recipient.clone()),
            &member_state
        );
        
        // Update circle state
        state.total_paid_out += payout_amount;
        state.current_round += 1;
        
        // Check if circle is complete
        if state.current_round > state.config.total_members {
            state.status = CircleStatus::Completed;
            Self::finalize_circle(&env, &circle_id, &state)?;
        }
        
        env.storage().persistent().set(&DataKey::Circle(circle_id.clone()), &state);
        
        env.events().publish(
            (Symbol::new(&env, "payout_processed"),),
            (circle_id, recipient, payout_amount, state.current_round - 1)
        );
        
        Ok(payout_info)
    }
    
    /// Get circle state
    pub fn get_circle(env: Env, circle_id: BytesN<32>) -> Option<CircleState> {
        env.storage().persistent().get(&DataKey::Circle(circle_id))
    }
    
    /// Get member state
    pub fn get_member(
        env: Env,
        circle_id: BytesN<32>,
        member: Address,
    ) -> Option<MemberState> {
        env.storage().persistent().get(&DataKey::Member(circle_id, member))
    }
    
    // ============ Internal Functions ============
    
    fn generate_circle_id(env: &Env, creator: &Address, count: u64) -> BytesN<32> {
        let mut data = [0u8; 64];
        // Combine creator address hash with count and timestamp
        let timestamp = env.ledger().timestamp();
        data[0..8].copy_from_slice(&count.to_be_bytes());
        data[8..16].copy_from_slice(&timestamp.to_be_bytes());
        env.crypto().sha256(&data.into())
    }
    
    fn verify_identity(env: &Env, identity_contract: &Address, user: &Address) {
        // Call identity contract to verify user has valid binding
        // Implementation would invoke identity contract
    }
    
    fn get_unique_id(
        env: &Env,
        identity_contract: &Address,
        user: &Address,
    ) -> Result<BytesN<32>, ContractError> {
        // Call identity contract to get unique ID for user
        // Implementation would invoke identity contract
        Ok(BytesN::from_array(env, &[0u8; 32])) // Placeholder
    }
    
    fn get_credit_score(env: &Env, credit_contract: &Address, unique_id: &BytesN<32>) -> u32 {
        // Call credit contract to get score
        // Implementation would invoke credit contract
        500 // Placeholder - base score
    }
    
    fn collect_collateral(
        env: &Env,
        member: &Address,
        token: &Address,
        amount: i128,
    ) -> Result<(), ContractError> {
        let token_client = token::Client::new(env, token);
        token_client.transfer(member, &env.current_contract_address(), &amount);
        Ok(())
    }
    
    fn generate_rotation_schedule(env: &Env, state: &CircleState) -> Vec<PayoutInfo> {
        let mut schedule = Vec::new(env);
        for (i, member) in state.members.iter().enumerate() {
            schedule.push_back(PayoutInfo {
                round: (i + 1) as u32,
                recipient: member,
                amount: 0, // Calculated at payout time
                timestamp: 0,
                bid_discount: 0,
            });
        }
        schedule
    }
    
    fn count_contributions_for_round(
        env: &Env,
        circle_id: &BytesN<32>,
        state: &CircleState,
        round: u32,
    ) -> u32 {
        let mut count = 0u32;
        for member in state.members.iter() {
            if let Some(member_state) = env.storage().persistent()
                .get::<_, MemberState>(&DataKey::Member(circle_id.clone(), member)) {
                for contribution in member_state.contributions.iter() {
                    if contribution.round == round {
                        count += 1;
                        break;
                    }
                }
            }
        }
        count
    }
    
    fn check_and_process_payout(
        env: &Env,
        circle_id: BytesN<32>,
        state: &mut CircleState,
    ) -> Result<(), ContractError> {
        let contributions = Self::count_contributions_for_round(env, &circle_id, state, state.current_round);
        if contributions == state.config.total_members {
            // All contributions received, payout can be processed
            // This could auto-trigger or require manual call
        }
        Ok(())
    }
    
    fn determine_auction_winner(
        env: &Env,
        circle_id: &BytesN<32>,
        state: &CircleState,
    ) -> Result<(Address, u32), ContractError> {
        // Implementation for auction-based payout determination
        // Would involve collecting bids and selecting winner
        Err(ContractError::NotImplemented)
    }
    
    fn determine_need_based_recipient(
        env: &Env,
        circle_id: &BytesN<32>,
        state: &CircleState,
    ) -> Result<(Address, u32), ContractError> {
        // Implementation for need-based governance voting
        Err(ContractError::NotImplemented)
    }
    
    fn record_payment(
        env: &Env,
        credit_contract: &Address,
        unique_id: &BytesN<32>,
        on_time: bool,
    ) {
        // Call credit contract to record payment
        // Implementation would invoke credit contract
    }
    
    fn finalize_circle(
        env: &Env,
        circle_id: &BytesN<32>,
        state: &CircleState,
    ) -> Result<(), ContractError> {
        // Return collateral to all members
        // Update credit scores for circle completion
        // Emit completion event
        Ok(())
    }
}

#[derive(Clone, Debug)]
#[contracttype]
pub enum ContractError {
    CircleNotFound,
    CircleNotForming,
    CircleNotActive,
    AlreadyMember,
    NotMember,
    CircleFull,
    InvalidRound,
    AlreadyContributed,
    ContributionsIncomplete,
    NoScheduledPayout,
    NotImplemented,
    Unauthorized,
    InsufficientFunds,
}
```

### 4.3 Credit Contract

```rust
// contracts/credit/src/lib.rs
#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, Symbol, Vec};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    CreditScore(BytesN<32>),    // Unique ID -> CreditData
    PaymentHistory(BytesN<32>), // Unique ID -> PaymentHistory
    Admin,
    AuthorizedContracts,        // Contracts allowed to update scores
}

#[derive(Clone)]
#[contracttype]
pub struct CreditData {
    pub unique_id: BytesN<32>,
    pub score: u32,                    // 300-850 scale
    pub total_payments: u32,
    pub on_time_payments: u32,
    pub late_payments: u32,
    pub circles_completed: u32,
    pub circles_defaulted: u32,
    pub total_volume: i128,            // Total value transacted
    pub last_updated: u64,
    pub first_activity: u64,
    pub score_version: u32,            // Algorithm version
}

#[derive(Clone)]
#[contracttype]
pub struct PaymentRecord {
    pub circle_id: BytesN<32>,
    pub round: u32,
    pub amount: i128,
    pub on_time: bool,
    pub timestamp: u64,
}

#[derive(Clone)]
#[contracttype]
pub struct CreditScoreFactors {
    pub payment_history_weight: u32,      // 40%
    pub circle_completion_weight: u32,    // 25%
    pub volume_weight: u32,               // 15%
    pub tenure_weight: u32,               // 10%
    pub peer_attestation_weight: u32,     // 10%
}

#[contract]
pub struct HaloCredit;

#[contractimpl]
impl HaloCredit {
    /// Initialize credit contract
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::AuthorizedContracts, &Vec::<Address>::new(&env));
    }
    
    /// Add authorized contract that can update scores
    pub fn authorize_contract(env: Env, contract: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        
        let mut authorized: Vec<Address> = env.storage().instance()
            .get(&DataKey::AuthorizedContracts)
            .unwrap_or(Vec::new(&env));
        
        if !authorized.contains(&contract) {
            authorized.push_back(contract);
            env.storage().instance().set(&DataKey::AuthorizedContracts, &authorized);
        }
    }
    
    /// Record a payment (called by circle contracts)
    pub fn record_payment(
        env: Env,
        caller: Address,
        unique_id: BytesN<32>,
        circle_id: BytesN<32>,
        round: u32,
        amount: i128,
        on_time: bool,
    ) {
        // Verify caller is authorized
        Self::verify_authorized(&env, &caller);
        
        // Get or create credit data
        let mut credit_data = Self::get_or_create_credit_data(&env, &unique_id);
        
        // Update payment stats
        credit_data.total_payments += 1;
        if on_time {
            credit_data.on_time_payments += 1;
        } else {
            credit_data.late_payments += 1;
        }
        credit_data.total_volume += amount;
        credit_data.last_updated = env.ledger().timestamp();
        
        // Recalculate score
        credit_data.score = Self::calculate_score(&env, &credit_data);
        
        env.storage().persistent().set(&DataKey::CreditScore(unique_id.clone()), &credit_data);
        
        // Store payment record
        let record = PaymentRecord {
            circle_id,
            round,
            amount,
            on_time,
            timestamp: env.ledger().timestamp(),
        };
        Self::append_payment_record(&env, &unique_id, record);
        
        env.events().publish(
            (Symbol::new(&env, "payment_recorded"),),
            (unique_id, on_time, credit_data.score)
        );
    }
    
    /// Record circle completion
    pub fn record_circle_completion(
        env: Env,
        caller: Address,
        unique_id: BytesN<32>,
        circle_id: BytesN<32>,
        completed_successfully: bool,
    ) {
        Self::verify_authorized(&env, &caller);
        
        let mut credit_data = Self::get_or_create_credit_data(&env, &unique_id);
        
        if completed_successfully {
            credit_data.circles_completed += 1;
        } else {
            credit_data.circles_defaulted += 1;
        }
        
        credit_data.score = Self::calculate_score(&env, &credit_data);
        credit_data.last_updated = env.ledger().timestamp();
        
        env.storage().persistent().set(&DataKey::CreditScore(unique_id.clone()), &credit_data);
        
        env.events().publish(
            (Symbol::new(&env, "circle_completed"),),
            (unique_id, completed_successfully, credit_data.score)
        );
    }
    
    /// Get credit score for a user (PUBLIC - SDK uses this)
    pub fn get_credit_score(env: Env, unique_id: BytesN<32>) -> Option<u32> {
        let credit_data: Option<CreditData> = env.storage().persistent()
            .get(&DataKey::CreditScore(unique_id));
        credit_data.map(|d| d.score)
    }
    
    /// Get full credit data (PUBLIC - SDK uses this)
    pub fn get_credit_data(env: Env, unique_id: BytesN<32>) -> Option<CreditData> {
        env.storage().persistent().get(&DataKey::CreditScore(unique_id))
    }
    
    /// Look up credit score by wallet address (SDK convenience method)
    pub fn get_score_by_wallet(
        env: Env,
        identity_contract: Address,
        wallet: Address,
    ) -> Option<u32> {
        // Would call identity contract to get unique_id for wallet
        // Then return credit score for that unique_id
        None // Placeholder
    }
    
    /// Apply score decay for inactive users
    pub fn apply_decay(env: Env, unique_id: BytesN<32>) {
        let mut credit_data: CreditData = match env.storage().persistent()
            .get(&DataKey::CreditScore(unique_id.clone())) {
            Some(data) => data,
            None => return,
        };
        
        let current_time = env.ledger().timestamp();
        let days_inactive = (current_time - credit_data.last_updated) / 86400;
        
        // Decay 1 point per week of inactivity after 30 days
        if days_inactive > 30 {
            let decay_weeks = (days_inactive - 30) / 7;
            let decay_points = decay_weeks as u32;
            
            // Don't decay below base score of 300
            if credit_data.score > 300 + decay_points {
                credit_data.score -= decay_points;
            } else {
                credit_data.score = 300;
            }
            
            env.storage().persistent().set(&DataKey::CreditScore(unique_id), &credit_data);
        }
    }
    
    // ============ Internal Functions ============
    
    fn verify_authorized(env: &Env, caller: &Address) {
        let authorized: Vec<Address> = env.storage().instance()
            .get(&DataKey::AuthorizedContracts)
            .unwrap_or(Vec::new(env));
        
        if !authorized.contains(caller) {
            panic!("Unauthorized caller");
        }
    }
    
    fn get_or_create_credit_data(env: &Env, unique_id: &BytesN<32>) -> CreditData {
        env.storage().persistent()
            .get(&DataKey::CreditScore(unique_id.clone()))
            .unwrap_or(CreditData {
                unique_id: unique_id.clone(),
                score: 500,  // Base score for new users
                total_payments: 0,
                on_time_payments: 0,
                late_payments: 0,
                circles_completed: 0,
                circles_defaulted: 0,
                total_volume: 0,
                last_updated: env.ledger().timestamp(),
                first_activity: env.ledger().timestamp(),
                score_version: 1,
            })
    }
    
    fn calculate_score(env: &Env, data: &CreditData) -> u32 {
        // Credit Score Algorithm (300-850 scale)
        // Based on FICO-like factors adapted for group lending
        
        let factors = CreditScoreFactors {
            payment_history_weight: 40,
            circle_completion_weight: 25,
            volume_weight: 15,
            tenure_weight: 10,
            peer_attestation_weight: 10,
        };
        
        // 1. Payment History (40% - max 220 points above base)
        let payment_score = if data.total_payments > 0 {
            let on_time_ratio = (data.on_time_payments * 100) / data.total_payments;
            // Scale: 100% on-time = 220 points, 0% = 0 points
            (on_time_ratio * 220) / 100
        } else {
            110 // Neutral for no history
        };
        
        // 2. Circle Completion (25% - max 137 points)
        let total_circles = data.circles_completed + data.circles_defaulted;
        let completion_score = if total_circles > 0 {
            let completion_ratio = (data.circles_completed * 100) / total_circles;
            (completion_ratio * 137) / 100
        } else {
            68 // Neutral
        };
        
        // 3. Volume (15% - max 83 points)
        // Logarithmic scale - higher volume = higher score but diminishing returns
        let volume_score = if data.total_volume > 0 {
            let volume_level = Self::log_scale_volume(data.total_volume);
            (volume_level * 83).min(83)
        } else {
            0
        };
        
        // 4. Tenure (10% - max 55 points)
        let current_time = env.ledger().timestamp();
        let tenure_days = (current_time - data.first_activity) / 86400;
        let tenure_score = if tenure_days > 365 {
            55 // Max after 1 year
        } else {
            ((tenure_days as u32) * 55) / 365
        };
        
        // 5. Peer Attestation (10% - max 55 points)
        // Placeholder - would incorporate peer vouching system
        let attestation_score = 27; // Neutral
        
        // Calculate final score (base 300)
        let total = 300 + payment_score + completion_score + volume_score + 
                   tenure_score + attestation_score;
        
        // Cap at 850
        total.min(850)
    }
    
    fn log_scale_volume(volume: i128) -> u32 {
        // Logarithmic scaling for volume
        // $100 = 20%, $1000 = 40%, $10000 = 60%, $100000 = 80%, $1000000+ = 100%
        if volume < 10000000 { // < $100 (assuming 6 decimals)
            20
        } else if volume < 100000000 { // < $1000
            40
        } else if volume < 1000000000 { // < $10000
            60
        } else if volume < 10000000000 { // < $100000
            80
        } else {
            100
        }
    }
    
    fn append_payment_record(env: &Env, unique_id: &BytesN<32>, record: PaymentRecord) {
        let key = DataKey::PaymentHistory(unique_id.clone());
        let mut history: Vec<PaymentRecord> = env.storage().persistent()
            .get(&key)
            .unwrap_or(Vec::new(env));
        
        history.push_back(record);
        
        // Keep only last 100 records to manage storage
        if history.len() > 100 {
            history = history.slice(history.len() - 100..);
        }
        
        env.storage().persistent().set(&key, &history);
    }
}
```

---

## 5. Credit Scoring Algorithm

### 5.1 Algorithm Design Philosophy

The Halo credit scoring system is designed to:

1. **Reward Consistency**: Regular, on-time payments build trust
2. **Penalize Defaults**: But allow recovery through good behavior
3. **Incentivize Engagement**: Active participation improves scores
4. **Prevent Gaming**: Difficult to artificially inflate scores
5. **Enable Portability**: Scores meaningful to external protocols

### 5.2 Score Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     HALO CREDIT SCORE BREAKDOWN                              │
│                         (300 - 850 Scale)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Base Score: 300 points                                                      │
│  Maximum Additional: 550 points                                              │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1. PAYMENT HISTORY (40% = 220 points max)                           │   │
│  │    ├─ On-time payment ratio                                         │   │
│  │    ├─ Recent payment behavior (last 6 months weighted 2x)           │   │
│  │    └─ Late payment severity (days late matters)                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 2. CIRCLE COMPLETION (25% = 137 points max)                         │   │
│  │    ├─ Circles completed without default                             │   │
│  │    ├─ Circle size factor (larger circles = harder)                  │   │
│  │    └─ Role in circle (creator bonus)                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 3. TRANSACTION VOLUME (15% = 83 points max)                         │   │
│  │    ├─ Total value transacted (logarithmic scale)                    │   │
│  │    ├─ Consistency of amounts                                        │   │
│  │    └─ Diversity of circle participation                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 4. ACCOUNT TENURE (10% = 55 points max)                             │   │
│  │    ├─ Time since first activity                                     │   │
│  │    ├─ Continuous activity (no long gaps)                            │   │
│  │    └─ Identity verification age                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 5. PEER ATTESTATION (10% = 55 points max)                           │   │
│  │    ├─ Vouches from high-score users                                 │   │
│  │    ├─ Successful co-participation history                           │   │
│  │    └─ Community standing                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Score Calculation Algorithm

```typescript
interface CreditScoreInput {
  paymentHistory: PaymentRecord[];
  circleHistory: CircleRecord[];
  accountCreatedAt: number;
  peerAttestations: Attestation[];
}

interface ScoreBreakdown {
  paymentHistoryScore: number;
  circleCompletionScore: number;
  volumeScore: number;
  tenureScore: number;
  attestationScore: number;
  totalScore: number;
}

function calculateCreditScore(input: CreditScoreInput): ScoreBreakdown {
  const BASE_SCORE = 300;
  
  // 1. Payment History (max 220 points)
  const paymentHistoryScore = calculatePaymentHistoryScore(input.paymentHistory);
  
  // 2. Circle Completion (max 137 points)
  const circleCompletionScore = calculateCircleCompletionScore(input.circleHistory);
  
  // 3. Volume (max 83 points)
  const volumeScore = calculateVolumeScore(input.paymentHistory);
  
  // 4. Tenure (max 55 points)
  const tenureScore = calculateTenureScore(input.accountCreatedAt);
  
  // 5. Peer Attestation (max 55 points)
  const attestationScore = calculateAttestationScore(input.peerAttestations);
  
  const totalScore = Math.min(
    850,
    BASE_SCORE + paymentHistoryScore + circleCompletionScore + 
    volumeScore + tenureScore + attestationScore
  );
  
  return {
    paymentHistoryScore,
    circleCompletionScore,
    volumeScore,
    tenureScore,
    attestationScore,
    totalScore,
  };
}

function calculatePaymentHistoryScore(payments: PaymentRecord[]): number {
  if (payments.length === 0) return 110; // Neutral for no history
  
  const MAX_SCORE = 220;
  const SIX_MONTHS_AGO = Date.now() - (180 * 24 * 60 * 60 * 1000);
  
  let recentOnTime = 0;
  let recentTotal = 0;
  let olderOnTime = 0;
  let olderTotal = 0;
  
  for (const payment of payments) {
    if (payment.timestamp > SIX_MONTHS_AGO) {
      recentTotal++;
      if (payment.onTime) recentOnTime++;
    } else {
      olderTotal++;
      if (payment.onTime) olderOnTime++;
    }
  }
  
  // Recent payments weighted 2x
  const recentRatio = recentTotal > 0 ? recentOnTime / recentTotal : 0.5;
  const olderRatio = olderTotal > 0 ? olderOnTime / olderTotal : 0.5;
  
  const weightedRatio = (recentRatio * 2 + olderRatio) / 3;
  
  return Math.round(weightedRatio * MAX_SCORE);
}

function calculateCircleCompletionScore(circles: CircleRecord[]): number {
  if (circles.length === 0) return 68; // Neutral
  
  const MAX_SCORE = 137;
  
  let weightedComplete = 0;
  let weightedTotal = 0;
  
  for (const circle of circles) {
    // Larger circles are harder, so worth more
    const sizeMultiplier = Math.log2(circle.memberCount);
    
    // Creator gets bonus
    const roleMultiplier = circle.wasCreator ? 1.2 : 1.0;
    
    const weight = sizeMultiplier * roleMultiplier;
    
    weightedTotal += weight;
    if (circle.completedSuccessfully) {
      weightedComplete += weight;
    }
  }
  
  const completionRatio = weightedComplete / weightedTotal;
  
  return Math.round(completionRatio * MAX_SCORE);
}

function calculateVolumeScore(payments: PaymentRecord[]): number {
  const MAX_SCORE = 83;
  
  const totalVolume = payments.reduce((sum, p) => sum + p.amount, 0);
  
  // Logarithmic scale (base 10)
  // $100 = 20%, $1000 = 40%, $10000 = 60%, $100000 = 80%, $1M+ = 100%
  const volumeLog = Math.log10(Math.max(totalVolume, 1));
  const volumeRatio = Math.min(volumeLog / 6, 1); // 6 = log10(1,000,000)
  
  return Math.round(volumeRatio * MAX_SCORE);
}

function calculateTenureScore(accountCreatedAt: number): number {
  const MAX_SCORE = 55;
  const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
  
  const tenure = Date.now() - accountCreatedAt;
  const tenureRatio = Math.min(tenure / ONE_YEAR_MS, 1);
  
  return Math.round(tenureRatio * MAX_SCORE);
}

function calculateAttestationScore(attestations: Attestation[]): number {
  const MAX_SCORE = 55;
  
  if (attestations.length === 0) return 27; // Neutral
  
  // Weight attestations by attester's own score
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const attestation of attestations) {
    const weight = attestation.attesterScore / 850; // Normalize by max score
    weightedSum += weight * (attestation.positive ? 1 : 0);
    totalWeight += weight;
  }
  
  const attestationRatio = weightedSum / totalWeight;
  
  return Math.round(attestationRatio * MAX_SCORE);
}
```

### 5.4 Score Decay Mechanism

```typescript
interface DecayConfig {
  gracePeriodDays: 30;        // No decay for first 30 days
  decayRatePerWeek: 1;        // Points lost per week after grace
  minimumScore: 300;          // Score floor
  activityResetDecay: true;   // Any activity resets decay timer
}

function applyScoreDecay(
  currentScore: number,
  lastActivityTimestamp: number,
  config: DecayConfig
): number {
  const daysSinceActivity = Math.floor(
    (Date.now() - lastActivityTimestamp) / (24 * 60 * 60 * 1000)
  );
  
  if (daysSinceActivity <= config.gracePeriodDays) {
    return currentScore;
  }
  
  const weeksInactive = Math.floor(
    (daysSinceActivity - config.gracePeriodDays) / 7
  );
  
  const decayPoints = weeksInactive * config.decayRatePerWeek;
  
  return Math.max(currentScore - decayPoints, config.minimumScore);
}
```

---

## 6. SDK Architecture

### 6.1 SDK Overview

The Halo SDK enables external protocols to query credit scores and verify user identities.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HALO SDK ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐               │
│  │    Partner    │    │    Partner    │    │    Partner    │               │
│  │   Protocol A  │    │   Protocol B  │    │   Protocol C  │               │
│  └───────┬───────┘    └───────┬───────┘    └───────┬───────┘               │
│          │                    │                    │                        │
│          └────────────────────┼────────────────────┘                        │
│                               │                                             │
│                               ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         HALO SDK                                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │   │
│  │  │   Credit    │  │  Identity   │  │   Circle    │  │   Utils    │ │   │
│  │  │   Module    │  │   Module    │  │   Module    │  │   Module   │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                               │                                             │
│                               ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    STELLAR / SOROBAN                                 │   │
│  │         (Identity Contract | Credit Contract | Circle Contract)      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 SDK Implementation

```typescript
// @halo-protocol/sdk

import { Contract, Networks, SorobanRpc } from '@stellar/stellar-sdk';

export interface HaloSDKConfig {
  network: 'mainnet' | 'testnet';
  rpcUrl?: string;
  identityContractId: string;
  creditContractId: string;
  circleContractId: string;
}

export interface CreditScore {
  score: number;
  breakdown: {
    paymentHistory: number;
    circleCompletion: number;
    volume: number;
    tenure: number;
    attestation: number;
  };
  lastUpdated: Date;
  totalPayments: number;
  circlesCompleted: number;
}

export interface UserIdentity {
  uniqueId: string;
  walletAddress: string;
  verificationLevel: 'basic' | 'standard' | 'premium';
  verifiedAt: Date;
  isActive: boolean;
}

export interface CircleInfo {
  id: string;
  name: string;
  status: 'forming' | 'active' | 'completed' | 'dissolved';
  memberCount: number;
  contributionAmount: string;
  currentRound: number;
  totalRounds: number;
}

export class HaloSDK {
  private config: HaloSDKConfig;
  private rpc: SorobanRpc.Server;
  private identityContract: Contract;
  private creditContract: Contract;
  private circleContract: Contract;

  constructor(config: HaloSDKConfig) {
    this.config = config;
    
    const rpcUrl = config.rpcUrl || (
      config.network === 'mainnet' 
        ? 'https://soroban-rpc.stellar.org'
        : 'https://soroban-testnet.stellar.org'
    );
    
    this.rpc = new SorobanRpc.Server(rpcUrl);
    
    this.identityContract = new Contract(config.identityContractId);
    this.creditContract = new Contract(config.creditContractId);
    this.circleContract = new Contract(config.circleContractId);
  }

  // ============ Identity Methods ============

  /**
   * Check if a wallet address is registered with Halo
   */
  async isRegistered(walletAddress: string): Promise<boolean> {
    try {
      const result = await this.rpc.simulateTransaction(
        this.identityContract.call('is_registered', walletAddress)
      );
      return this.parseResult<boolean>(result);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the unique ID for a wallet address
   */
  async getUniqueId(walletAddress: string): Promise<string | null> {
    try {
      const result = await this.rpc.simulateTransaction(
        this.identityContract.call('get_unique_id', walletAddress)
      );
      return this.parseResult<string>(result);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get full identity information for a wallet
   */
  async getIdentity(walletAddress: string): Promise<UserIdentity | null> {
    try {
      const result = await this.rpc.simulateTransaction(
        this.identityContract.call('get_identity', walletAddress)
      );
      return this.parseResult<UserIdentity>(result);
    } catch (error) {
      return null;
    }
  }

  // ============ Credit Methods ============

  /**
   * Get credit score for a wallet address
   * Returns null if wallet is not registered
   */
  async getCreditScore(walletAddress: string): Promise<number | null> {
    const uniqueId = await this.getUniqueId(walletAddress);
    if (!uniqueId) return null;

    try {
      const result = await this.rpc.simulateTransaction(
        this.creditContract.call('get_credit_score', uniqueId)
      );
      return this.parseResult<number>(result);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get detailed credit information
   */
  async getCreditData(walletAddress: string): Promise<CreditScore | null> {
    const uniqueId = await this.getUniqueId(walletAddress);
    if (!uniqueId) return null;

    try {
      const result = await this.rpc.simulateTransaction(
        this.creditContract.call('get_credit_data', uniqueId)
      );
      return this.parseResult<CreditScore>(result);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if user meets minimum credit requirement
   */
  async meetsMinimumScore(
    walletAddress: string,
    minimumScore: number
  ): Promise<boolean> {
    const score = await this.getCreditScore(walletAddress);
    return score !== null && score >= minimumScore;
  }

  /**
   * Get credit tier for a user
   */
  async getCreditTier(walletAddress: string): Promise<CreditTier | null> {
    const score = await this.getCreditScore(walletAddress);
    if (score === null) return null;

    if (score >= 750) return CreditTier.EXCELLENT;
    if (score >= 700) return CreditTier.GOOD;
    if (score >= 650) return CreditTier.FAIR;
    if (score >= 550) return CreditTier.POOR;
    return CreditTier.VERY_POOR;
  }

  // ============ Circle Methods ============

  /**
   * Get circles a user is participating in
   */
  async getUserCircles(walletAddress: string): Promise<CircleInfo[]> {
    try {
      const result = await this.rpc.simulateTransaction(
        this.circleContract.call('get_user_circles', walletAddress)
      );
      return this.parseResult<CircleInfo[]>(result) || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get circle details
   */
  async getCircle(circleId: string): Promise<CircleInfo | null> {
    try {
      const result = await this.rpc.simulateTransaction(
        this.circleContract.call('get_circle', circleId)
      );
      return this.parseResult<CircleInfo>(result);
    } catch (error) {
      return null;
    }
  }

  // ============ Utility Methods ============

  /**
   * Verify a signature from a Halo user
   */
  async verifySignature(
    walletAddress: string,
    message: string,
    signature: string
  ): Promise<boolean> {
    // Verify the signature is from the wallet
    // and wallet is registered with Halo
    const isRegistered = await this.isRegistered(walletAddress);
    if (!isRegistered) return false;

    // Verify cryptographic signature
    return this.verifyEd25519Signature(walletAddress, message, signature);
  }

  /**
   * Get risk assessment for a user
   */
  async getRiskAssessment(walletAddress: string): Promise<RiskAssessment> {
    const [identity, creditData] = await Promise.all([
      this.getIdentity(walletAddress),
      this.getCreditData(walletAddress),
    ]);

    if (!identity || !creditData) {
      return {
        riskLevel: 'unknown',
        isVerified: false,
        creditScore: null,
        recommendation: 'User not registered with Halo Protocol',
      };
    }

    const riskLevel = this.calculateRiskLevel(creditData.score);

    return {
      riskLevel,
      isVerified: true,
      creditScore: creditData.score,
      recommendation: this.getRiskRecommendation(riskLevel, creditData),
    };
  }

  // ============ Private Methods ============

  private parseResult<T>(result: any): T | null {
    // Parse Soroban result
    if (result && result.result) {
      return result.result as T;
    }
    return null;
  }

  private verifyEd25519Signature(
    publicKey: string,
    message: string,
    signature: string
  ): boolean {
    // Implementation using stellar-sdk
    return true; // Placeholder
  }

  private calculateRiskLevel(score: number): RiskLevel {
    if (score >= 750) return 'low';
    if (score >= 650) return 'medium';
    if (score >= 550) return 'high';
    return 'very-high';
  }

  private getRiskRecommendation(
    riskLevel: RiskLevel,
    creditData: CreditScore
  ): string {
    switch (riskLevel) {
      case 'low':
        return 'User has excellent credit history. Eligible for preferential terms.';
      case 'medium':
        return 'User has good standing. Standard terms recommended.';
      case 'high':
        return 'User has limited history. Consider requiring collateral.';
      case 'very-high':
        return 'User has poor history or is new. High collateral recommended.';
      default:
        return 'Unable to assess risk.';
    }
  }
}

export enum CreditTier {
  EXCELLENT = 'excellent',   // 750+
  GOOD = 'good',             // 700-749
  FAIR = 'fair',             // 650-699
  POOR = 'poor',             // 550-649
  VERY_POOR = 'very-poor',   // <550
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'very-high' | 'unknown';

export interface RiskAssessment {
  riskLevel: RiskLevel;
  isVerified: boolean;
  creditScore: number | null;
  recommendation: string;
}
```

### 6.3 SDK Usage Examples

```typescript
// Example: DeFi Protocol Integration

import { HaloSDK, CreditTier } from '@halo-protocol/sdk';

const halo = new HaloSDK({
  network: 'mainnet',
  identityContractId: 'CABC...XYZ',
  creditContractId: 'CDEF...123',
  circleContractId: 'CGHI...456',
});

// Example 1: Check if user can access premium lending rates
async function checkPremiumEligibility(walletAddress: string): Promise<boolean> {
  const tier = await halo.getCreditTier(walletAddress);
  return tier === CreditTier.EXCELLENT || tier === CreditTier.GOOD;
}

// Example 2: Determine collateral requirements
async function getCollateralRequirement(
  walletAddress: string,
  loanAmount: number
): Promise<number> {
  const score = await halo.getCreditScore(walletAddress);
  
  if (score === null) {
    return loanAmount * 1.5; // 150% collateral for unknown users
  }
  
  if (score >= 750) return loanAmount * 1.0;  // 100% collateral
  if (score >= 700) return loanAmount * 1.1;  // 110% collateral
  if (score >= 650) return loanAmount * 1.2;  // 120% collateral
  if (score >= 550) return loanAmount * 1.3;  // 130% collateral
  return loanAmount * 1.5;                     // 150% collateral
}

// Example 3: Risk-based interest rates
async function calculateInterestRate(
  walletAddress: string,
  baseRate: number
): Promise<number> {
  const assessment = await halo.getRiskAssessment(walletAddress);
  
  const riskPremiums = {
    'low': 0,
    'medium': 0.02,      // +2%
    'high': 0.05,        // +5%
    'very-high': 0.10,   // +10%
    'unknown': 0.15,     // +15%
  };
  
  return baseRate + riskPremiums[assessment.riskLevel];
}

// Example 4: Access control for exclusive features
async function canAccessExclusivePool(walletAddress: string): Promise<{
  allowed: boolean;
  reason: string;
}> {
  const creditData = await halo.getCreditData(walletAddress);
  
  if (!creditData) {
    return { 
      allowed: false, 
      reason: 'Not registered with Halo Protocol' 
    };
  }
  
  if (creditData.score < 700) {
    return { 
      allowed: false, 
      reason: `Credit score ${creditData.score} below minimum 700` 
    };
  }
  
  if (creditData.circlesCompleted < 3) {
    return { 
      allowed: false, 
      reason: 'Must complete at least 3 circles' 
    };
  }
  
  return { 
    allowed: true, 
    reason: 'Meets all requirements' 
  };
}
```

---

## 7. Backend Services

### 7.1 Service Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND SERVICES                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        API GATEWAY                                   │   │
│  │  (Kong / AWS API Gateway)                                           │   │
│  │  - Rate limiting                                                     │   │
│  │  - Authentication                                                    │   │
│  │  - Request routing                                                   │   │
│  │  - SSL termination                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                               │                                             │
│       ┌───────────────────────┼───────────────────────┐                    │
│       │                       │                       │                    │
│       ▼                       ▼                       ▼                    │
│  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐            │
│  │  Identity   │        │   Circle    │        │   Credit    │            │
│  │  Service    │        │   Service   │        │   Service   │            │
│  │             │        │             │        │             │            │
│  │ - Auth      │        │ - Create    │        │ - Score     │            │
│  │ - KYC       │        │ - Join      │        │ - History   │            │
│  │ - Profile   │        │ - Contrib   │        │ - Analytics │            │
│  │ - Binding   │        │ - Payouts   │        │ - SDK API   │            │
│  └──────┬──────┘        └──────┬──────┘        └──────┬──────┘            │
│         │                      │                      │                    │
│         └──────────────────────┼──────────────────────┘                    │
│                                │                                           │
│                                ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      SHARED SERVICES                                 │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │   │
│  │  │Blockchain │  │   Event   │  │   Queue   │  │  Webhook  │        │   │
│  │  │  Indexer  │  │   Bus     │  │  Worker   │  │  Handler  │        │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Identity Service

```typescript
// services/identity/src/index.ts

import { Router } from 'express';
import { prisma } from './db';
import { FractalKYC } from './providers/fractal';
import { StellarService } from './stellar';

const router = Router();

// ============ Authentication ============

router.post('/auth/social', async (req, res) => {
  const { provider, token } = req.body;
  
  try {
    // Verify social token
    const socialData = await verifySocialToken(provider, token);
    
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: socialData.email },
    });
    
    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: socialData.email,
          name: socialData.name,
          socialProvider: provider,
          socialId: socialData.id,
          status: 'SOCIAL_VERIFIED',
        },
      });
    }
    
    // Generate session token
    const sessionToken = generateSessionToken(user.id);
    
    res.json({
      success: true,
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
        kycCompleted: user.status === 'KYC_VERIFIED',
        walletBound: !!user.walletAddress,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============ Profile ============

router.post('/profile', authenticateUser, async (req, res) => {
  const userId = req.userId;
  const { fullName, dateOfBirth, country, phoneNumber, preferredCurrency } = req.body;
  
  try {
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: { fullName, dateOfBirth, country, phoneNumber, preferredCurrency },
      create: { userId, fullName, dateOfBirth, country, phoneNumber, preferredCurrency },
    });
    
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'PROFILE_COMPLETED' },
    });
    
    res.json({ success: true, profile });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============ KYC ============

router.post('/kyc/initiate', authenticateUser, async (req, res) => {
  const userId = req.userId;
  const { verificationLevel } = req.body;
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    
    if (user.status !== 'PROFILE_COMPLETED') {
      throw new Error('Profile must be completed before KYC');
    }
    
    // Create Fractal verification session
    const session = await FractalKYC.createSession({
      userId,
      level: verificationLevel,
      userData: {
        email: user.email,
        name: user.profile.fullName,
        country: user.profile.country,
      },
    });
    
    await prisma.kycSession.create({
      data: {
        userId,
        sessionId: session.id,
        provider: 'FRACTAL',
        level: verificationLevel,
        status: 'PENDING',
      },
    });
    
    res.json({
      success: true,
      verificationUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/kyc/webhook', async (req, res) => {
  const { sessionId, status, data } = req.body;
  
  try {
    // Verify webhook signature
    if (!FractalKYC.verifyWebhook(req)) {
      throw new Error('Invalid webhook signature');
    }
    
    const session = await prisma.kycSession.findUnique({
      where: { sessionId },
      include: { user: true },
    });
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    if (status === 'approved') {
      // Generate unique ID
      const uniqueId = generateUniqueId(
        data.documentHash,
        data.biometricHash,
        Date.now()
      );
      
      // Check for duplicates
      const existing = await prisma.user.findFirst({
        where: { uniqueId },
      });
      
      if (existing) {
        throw new Error('Identity already registered');
      }
      
      // Update user
      await prisma.user.update({
        where: { id: session.userId },
        data: {
          status: 'KYC_VERIFIED',
          uniqueId,
          kycData: {
            documentHash: data.documentHash,
            verificationLevel: session.level,
            verifiedAt: new Date(),
          },
        },
      });
      
      await prisma.kycSession.update({
        where: { sessionId },
        data: { status: 'APPROVED' },
      });
    } else {
      await prisma.kycSession.update({
        where: { sessionId },
        data: { status: 'REJECTED', rejectionReason: data.reason },
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============ Wallet Binding ============

router.post('/wallet/bind', authenticateUser, async (req, res) => {
  const userId = req.userId;
  const { walletAddress, signature } = req.body;
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (user.status !== 'KYC_VERIFIED') {
      throw new Error('KYC must be completed before wallet binding');
    }
    
    if (user.walletAddress) {
      throw new Error('Wallet already bound');
    }
    
    // Check if wallet is already bound to another user
    const existingBinding = await prisma.user.findFirst({
      where: { walletAddress },
    });
    
    if (existingBinding) {
      throw new Error('Wallet already bound to another user');
    }
    
    // Verify signature proves wallet ownership
    const message = `Bind wallet to Halo Protocol: ${user.uniqueId}`;
    const isValid = StellarService.verifySignature(walletAddress, message, signature);
    
    if (!isValid) {
      throw new Error('Invalid signature');
    }
    
    // Submit binding to blockchain
    const txHash = await StellarService.bindWallet(user.uniqueId, walletAddress, signature);
    
    // Update database
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'WALLET_BOUND',
        walletAddress,
        walletBindingTx: txHash,
      },
    });
    
    res.json({
      success: true,
      walletAddress,
      transactionHash: txHash,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
```

### 7.3 Circle Service

```typescript
// services/circle/src/index.ts

import { Router } from 'express';
import { prisma } from './db';
import { StellarService } from './stellar';
import { eventBus } from './events';

const router = Router();

// ============ Circle Management ============

router.post('/create', authenticateUser, async (req, res) => {
  const userId = req.userId;
  const { 
    name,
    contributionAmount,
    contributionToken,
    totalMembers,
    payoutFrequency,
    payoutMethod,
    collateralRequired,
    collateralPercentage,
  } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (user.status !== 'WALLET_BOUND') {
      throw new Error('Wallet must be bound to create circles');
    }
    
    // Create circle on blockchain
    const circleId = await StellarService.createCircle({
      creator: user.walletAddress,
      config: {
        name,
        contributionAmount,
        contributionToken,
        totalMembers,
        payoutFrequency,
        payoutMethod,
        collateralRequired,
        collateralPercentage,
      },
    });
    
    // Store in database for indexing
    const circle = await prisma.circle.create({
      data: {
        id: circleId,
        name,
        creatorId: userId,
        contributionAmount,
        contributionToken,
        totalMembers,
        payoutFrequency,
        payoutMethod,
        collateralRequired,
        collateralPercentage,
        status: 'FORMING',
      },
    });
    
    // Add creator as first member
    await prisma.circleMember.create({
      data: {
        circleId,
        userId,
        joinedAt: new Date(),
        payoutPosition: 1,
      },
    });
    
    // Emit event
    eventBus.emit('circle.created', { circleId, creatorId: userId });
    
    res.json({ success: true, circle });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:circleId/join', authenticateUser, async (req, res) => {
  const userId = req.userId;
  const { circleId } = req.params;
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    const circle = await prisma.circle.findUnique({
      where: { id: circleId },
      include: { members: true },
    });
    
    if (!circle) {
      throw new Error('Circle not found');
    }
    
    if (circle.status !== 'FORMING') {
      throw new Error('Circle is not accepting new members');
    }
    
    if (circle.members.length >= circle.totalMembers) {
      throw new Error('Circle is full');
    }
    
    // Check if already a member
    const existingMember = circle.members.find(m => m.userId === userId);
    if (existingMember) {
      throw new Error('Already a member of this circle');
    }
    
    // Join on blockchain
    await StellarService.joinCircle(circleId, user.walletAddress);
    
    // Update database
    const member = await prisma.circleMember.create({
      data: {
        circleId,
        userId,
        joinedAt: new Date(),
        payoutPosition: circle.members.length + 1,
      },
    });
    
    // Check if circle is now full
    if (circle.members.length + 1 >= circle.totalMembers) {
      await prisma.circle.update({
        where: { id: circleId },
        data: { status: 'ACTIVE', currentRound: 1 },
      });
      
      eventBus.emit('circle.activated', { circleId });
    }
    
    eventBus.emit('circle.memberJoined', { circleId, userId });
    
    res.json({ success: true, member });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:circleId/contribute', authenticateUser, async (req, res) => {
  const userId = req.userId;
  const { circleId } = req.params;
  const { round } = req.body;
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    const circle = await prisma.circle.findUnique({
      where: { id: circleId },
    });
    
    if (circle.status !== 'ACTIVE') {
      throw new Error('Circle is not active');
    }
    
    if (round !== circle.currentRound) {
      throw new Error('Invalid round');
    }
    
    // Submit contribution on blockchain
    const result = await StellarService.contribute(
      circleId,
      user.walletAddress,
      round
    );
    
    // Record in database
    const contribution = await prisma.contribution.create({
      data: {
        circleId,
        userId,
        round,
        amount: circle.contributionAmount,
        onTime: result.onTime,
        lateFee: result.lateFee,
        transactionHash: result.txHash,
      },
    });
    
    eventBus.emit('contribution.made', {
      circleId,
      userId,
      round,
      onTime: result.onTime,
    });
    
    res.json({ success: true, contribution });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============ Circle Queries ============

router.get('/:circleId', authenticateUser, async (req, res) => {
  const { circleId } = req.params;
  
  try {
    const circle = await prisma.circle.findUnique({
      where: { id: circleId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, walletAddress: true },
            },
          },
        },
        contributions: true,
        payouts: true,
      },
    });
    
    if (!circle) {
      throw new Error('Circle not found');
    }
    
    res.json({ success: true, circle });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/user/circles', authenticateUser, async (req, res) => {
  const userId = req.userId;
  
  try {
    const memberships = await prisma.circleMember.findMany({
      where: { userId },
      include: {
        circle: {
          include: {
            _count: { select: { members: true, contributions: true } },
          },
        },
      },
    });
    
    res.json({
      success: true,
      circles: memberships.map(m => ({
        ...m.circle,
        memberCount: m.circle._count.members,
        contributionCount: m.circle._count.contributions,
        myPosition: m.payoutPosition,
        hasReceivedPayout: m.hasReceivedPayout,
      })),
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
```

---

## 8. Database Schema

### 8.1 PostgreSQL Schema

```sql
-- Users and Identity
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    social_provider VARCHAR(50),
    social_id VARCHAR(255),
    unique_id VARCHAR(66) UNIQUE, -- 32-byte hex with 0x prefix
    wallet_address VARCHAR(56) UNIQUE, -- Stellar address
    wallet_binding_tx VARCHAR(64),
    status VARCHAR(50) NOT NULL DEFAULT 'SOCIAL_VERIFIED',
    kyc_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id),
    full_name VARCHAR(255),
    date_of_birth DATE,
    country VARCHAR(3),
    phone_number VARCHAR(20),
    preferred_currency VARCHAR(10) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE kyc_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    provider VARCHAR(50) NOT NULL,
    level VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Circles
CREATE TABLE circles (
    id VARCHAR(66) PRIMARY KEY, -- On-chain circle ID
    name VARCHAR(255) NOT NULL,
    creator_id UUID REFERENCES users(id),
    contribution_amount DECIMAL(20, 6) NOT NULL,
    contribution_token VARCHAR(56) NOT NULL, -- Token contract address
    total_members INTEGER NOT NULL,
    payout_frequency INTEGER NOT NULL, -- Seconds
    payout_method VARCHAR(50) NOT NULL,
    collateral_required BOOLEAN DEFAULT FALSE,
    collateral_percentage INTEGER DEFAULT 0,
    late_fee_percentage INTEGER DEFAULT 5,
    grace_period INTEGER DEFAULT 86400, -- 1 day default
    current_round INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'FORMING',
    total_contributed DECIMAL(20, 6) DEFAULT 0,
    total_paid_out DECIMAL(20, 6) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE circle_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id VARCHAR(66) REFERENCES circles(id),
    user_id UUID REFERENCES users(id),
    payout_position INTEGER NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_contributed DECIMAL(20, 6) DEFAULT 0,
    collateral_deposited DECIMAL(20, 6) DEFAULT 0,
    has_received_payout BOOLEAN DEFAULT FALSE,
    reputation_at_join INTEGER,
    UNIQUE(circle_id, user_id)
);

CREATE TABLE contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id VARCHAR(66) REFERENCES circles(id),
    user_id UUID REFERENCES users(id),
    round INTEGER NOT NULL,
    amount DECIMAL(20, 6) NOT NULL,
    on_time BOOLEAN NOT NULL,
    late_fee DECIMAL(20, 6) DEFAULT 0,
    transaction_hash VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(circle_id, user_id, round)
);

CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id VARCHAR(66) REFERENCES circles(id),
    user_id UUID REFERENCES users(id),
    round INTEGER NOT NULL,
    amount DECIMAL(20, 6) NOT NULL,
    bid_discount INTEGER DEFAULT 0,
    transaction_hash VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(circle_id, round)
);

-- Credit Scoring (Off-chain cache)
CREATE TABLE credit_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unique_id VARCHAR(66) UNIQUE NOT NULL,
    score INTEGER NOT NULL,
    payment_history_score INTEGER,
    circle_completion_score INTEGER,
    volume_score INTEGER,
    tenure_score INTEGER,
    attestation_score INTEGER,
    total_payments INTEGER DEFAULT 0,
    on_time_payments INTEGER DEFAULT 0,
    late_payments INTEGER DEFAULT 0,
    circles_completed INTEGER DEFAULT 0,
    circles_defaulted INTEGER DEFAULT 0,
    total_volume DECIMAL(20, 6) DEFAULT 0,
    first_activity TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unique_id VARCHAR(66) NOT NULL,
    circle_id VARCHAR(66) NOT NULL,
    round INTEGER NOT NULL,
    amount DECIMAL(20, 6) NOT NULL,
    on_time BOOLEAN NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Peer Attestations
CREATE TABLE attestations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attester_unique_id VARCHAR(66) NOT NULL,
    subject_unique_id VARCHAR(66) NOT NULL,
    positive BOOLEAN NOT NULL,
    circle_id VARCHAR(66), -- Optional: attestation from shared circle
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(attester_unique_id, subject_unique_id, circle_id)
);

-- Indexes
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_unique_id ON users(unique_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_circles_status ON circles(status);
CREATE INDEX idx_circles_creator ON circles(creator_id);
CREATE INDEX idx_circle_members_user ON circle_members(user_id);
CREATE INDEX idx_contributions_circle_round ON contributions(circle_id, round);
CREATE INDEX idx_credit_scores_unique_id ON credit_scores(unique_id);
CREATE INDEX idx_payment_records_unique_id ON payment_records(unique_id);
```

---

## 9. API Specifications

### 9.1 REST API Endpoints

```yaml
openapi: 3.0.0
info:
  title: Halo Protocol API
  version: 1.0.0
  description: API for Halo Protocol - Infrastructure for Group-Based Credit

servers:
  - url: https://api.usehalo.fun/v1
    description: Production
  - url: https://api.staging.usehalo.fun/v1
    description: Staging

paths:
  # ============ Authentication ============
  /auth/social:
    post:
      summary: Authenticate with social provider
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [provider, token]
              properties:
                provider:
                  type: string
                  enum: [google, apple, email]
                token:
                  type: string
      responses:
        200:
          description: Authentication successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'

  # ============ Identity ============
  /identity/profile:
    post:
      summary: Create or update user profile
      security:
        - bearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProfileInput'
      responses:
        200:
          description: Profile updated

  /identity/kyc/initiate:
    post:
      summary: Initiate KYC verification
      security:
        - bearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [verificationLevel]
              properties:
                verificationLevel:
                  type: string
                  enum: [basic, standard, premium]
      responses:
        200:
          description: KYC session created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/KYCSession'

  /identity/wallet/bind:
    post:
      summary: Bind wallet to identity
      security:
        - bearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [walletAddress, signature]
              properties:
                walletAddress:
                  type: string
                signature:
                  type: string
      responses:
        200:
          description: Wallet bound successfully

  # ============ Circles ============
  /circles:
    post:
      summary: Create a new circle
      security:
        - bearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CircleInput'
      responses:
        200:
          description: Circle created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Circle'

    get:
      summary: List available circles
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [forming, active, completed]
        - name: page
          in: query
          schema:
            type: integer
        - name: limit
          in: query
          schema:
            type: integer
      responses:
        200:
          description: List of circles
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Circle'

  /circles/{circleId}:
    get:
      summary: Get circle details
      parameters:
        - name: circleId
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          description: Circle details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CircleDetails'

  /circles/{circleId}/join:
    post:
      summary: Join a circle
      security:
        - bearerAuth: []
      parameters:
        - name: circleId
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          description: Joined successfully

  /circles/{circleId}/contribute:
    post:
      summary: Make a contribution
      security:
        - bearerAuth: []
      parameters:
        - name: circleId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [round]
              properties:
                round:
                  type: integer
      responses:
        200:
          description: Contribution recorded

  # ============ Credit ============
  /credit/score:
    get:
      summary: Get own credit score
      security:
        - bearerAuth: []
      responses:
        200:
          description: Credit score data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CreditScore'

  /credit/history:
    get:
      summary: Get payment history
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
        - name: limit
          in: query
          schema:
            type: integer
      responses:
        200:
          description: Payment history

  # ============ SDK (Public) ============
  /sdk/score/{walletAddress}:
    get:
      summary: Get credit score by wallet (SDK)
      parameters:
        - name: walletAddress
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          description: Credit score
          content:
            application/json:
              schema:
                type: object
                properties:
                  score:
                    type: integer
                  tier:
                    type: string

  /sdk/verify/{walletAddress}:
    get:
      summary: Verify wallet is registered
      parameters:
        - name: walletAddress
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          description: Verification result
          content:
            application/json:
              schema:
                type: object
                properties:
                  isRegistered:
                    type: boolean
                  verificationLevel:
                    type: string

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    AuthResponse:
      type: object
      properties:
        success:
          type: boolean
        token:
          type: string
        user:
          $ref: '#/components/schemas/User'

    User:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
        status:
          type: string
        kycCompleted:
          type: boolean
        walletBound:
          type: boolean

    ProfileInput:
      type: object
      required: [fullName, dateOfBirth, country, phoneNumber]
      properties:
        fullName:
          type: string
        dateOfBirth:
          type: string
          format: date
        country:
          type: string
        phoneNumber:
          type: string
        preferredCurrency:
          type: string

    CircleInput:
      type: object
      required: [name, contributionAmount, totalMembers, payoutFrequency, payoutMethod]
      properties:
        name:
          type: string
        contributionAmount:
          type: number
        contributionToken:
          type: string
        totalMembers:
          type: integer
        payoutFrequency:
          type: integer
        payoutMethod:
          type: string
          enum: [rotation, auction, need_based]
        collateralRequired:
          type: boolean
        collateralPercentage:
          type: integer

    Circle:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        status:
          type: string
        memberCount:
          type: integer
        totalMembers:
          type: integer
        contributionAmount:
          type: number
        currentRound:
          type: integer

    CreditScore:
      type: object
      properties:
        score:
          type: integer
        tier:
          type: string
        breakdown:
          type: object
          properties:
            paymentHistory:
              type: integer
            circleCompletion:
              type: integer
            volume:
              type: integer
            tenure:
              type: integer
            attestation:
              type: integer
        lastUpdated:
          type: string
          format: date-time
```

---

## 10. Security Architecture

### 10.1 Security Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SECURITY ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    NETWORK SECURITY                                  │   │
│  │  - TLS 1.3 for all connections                                       │   │
│  │  - WAF (Web Application Firewall)                                    │   │
│  │  - DDoS protection                                                   │   │
│  │  - IP allowlisting for admin endpoints                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    APPLICATION SECURITY                              │   │
│  │  - JWT with short expiry (15 min) + refresh tokens                  │   │
│  │  - Rate limiting per user and IP                                     │   │
│  │  - Input validation and sanitization                                 │   │
│  │  - CSRF protection                                                   │   │
│  │  - Secure headers (HSTS, CSP, X-Frame-Options)                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    DATA SECURITY                                     │   │
│  │  - AES-256 encryption at rest                                        │   │
│  │  - Field-level encryption for sensitive data (KYC)                  │   │
│  │  - Database access via parameterized queries only                   │   │
│  │  - PII minimization (hash KYC docs, don't store raw)                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    BLOCKCHAIN SECURITY                               │   │
│  │  - Multi-sig for protocol admin operations                          │   │
│  │  - Time-locked upgrades                                              │   │
│  │  - Audited smart contracts                                           │   │
│  │  - Rate limits on contract calls                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Smart Contract Security

```rust
// Security patterns for Soroban contracts

// 1. Access Control
pub fn admin_only(env: &Env) {
    let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
    admin.require_auth();
}

// 2. Reentrancy Guard (via careful state management)
pub fn contribute(env: Env, ...) {
    // Update state BEFORE external calls
    let mut state = get_state(&env);
    state.update_contribution(...);
    save_state(&env, &state);
    
    // External call (token transfer) AFTER state update
    token.transfer(...);
}

// 3. Integer Overflow Protection (Rust's default panic on overflow)
pub fn calculate_payout(contribution: i128, members: u32) -> i128 {
    contribution.checked_mul(members as i128)
        .expect("Overflow in payout calculation")
}

// 4. Input Validation
pub fn join_circle(env: Env, circle_id: BytesN<32>, member: Address) {
    // Validate circle exists
    let state = get_circle(&env, &circle_id)
        .expect("Circle not found");
    
    // Validate status
    assert!(state.status == CircleStatus::Forming, "Circle not accepting members");
    
    // Validate not already member
    assert!(!state.members.contains(&member), "Already a member");
    
    // Validate not full
    assert!(state.members.len() < state.config.total_members, "Circle full");
}

// 5. Time-based Checks
pub fn process_payout(env: Env, circle_id: BytesN<32>) {
    let state = get_circle(&env, &circle_id).unwrap();
    
    let round_end = state.created_at + 
        (state.current_round as u64 * state.config.payout_frequency);
    
    // Ensure enough time has passed
    assert!(
        env.ledger().timestamp() >= round_end,
        "Payout not yet available"
    );
}
```

---

## 11. Infrastructure & Deployment

### 11.1 Cloud Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INFRASTRUCTURE (AWS)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Region: ap-south-1 (Mumbai) - Primary                                       │
│  Region: us-east-1 (Virginia) - DR                                          │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      VPC (10.0.0.0/16)                               │   │
│  │                                                                       │   │
│  │  ┌─────────────────┐                    ┌─────────────────┐         │   │
│  │  │  Public Subnet  │                    │  Public Subnet  │         │   │
│  │  │   10.0.1.0/24   │                    │   10.0.2.0/24   │         │   │
│  │  │                 │                    │                 │         │   │
│  │  │  ┌───────────┐  │                    │  ┌───────────┐  │         │   │
│  │  │  │    ALB    │  │                    │  │    NAT    │  │         │   │
│  │  │  └───────────┘  │                    │  │  Gateway  │  │         │   │
│  │  └─────────────────┘                    │  └───────────┘  │         │   │
│  │                                         └─────────────────┘         │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │   │
│  │  │ Private Subnet  │  │ Private Subnet  │  │ Private Subnet  │     │   │
│  │  │  10.0.10.0/24   │  │  10.0.11.0/24   │  │  10.0.12.0/24   │     │   │
│  │  │                 │  │                 │  │                 │     │   │
│  │  │  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │     │   │
│  │  │  │    ECS    │  │  │  │    ECS    │  │  │  │    RDS    │  │     │   │
│  │  │  │  Services │  │  │  │  Workers  │  │  │  │ PostgreSQL│  │     │   │
│  │  │  └───────────┘  │  │  └───────────┘  │  │  └───────────┘  │     │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘     │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  External Services:                                                          │
│  - CloudFront (CDN)                                                         │
│  - Route53 (DNS)                                                            │
│  - S3 (Static assets, backups)                                              │
│  - ElastiCache (Redis)                                                      │
│  - SQS (Message queues)                                                     │
│  - CloudWatch (Monitoring)                                                  │
│  - KMS (Key management)                                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Deployment Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy Halo Protocol

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  AWS_REGION: ap-south-1
  ECR_REPOSITORY: halo-protocol

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run linter
        run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to ECS Staging
        run: |
          aws ecs update-service \
            --cluster halo-staging \
            --service halo-api \
            --force-new-deployment

  deploy-production:
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to ECS Production
        run: |
          aws ecs update-service \
            --cluster halo-production \
            --service halo-api \
            --force-new-deployment
```

---

## 12. Integration Patterns

### 12.1 Stellar Anchor Integration

For fiat on/off ramps, Halo integrates with Stellar anchors using SEP-24 (hosted deposits/withdrawals):

```typescript
// services/anchor/src/index.ts

import { Sep24 } from '@stellar/anchor-sdk';

export class AnchorIntegration {
  private sep24: Sep24;

  constructor(anchorDomain: string) {
    this.sep24 = new Sep24(anchorDomain);
  }

  async initiateDeposit(
    userId: string,
    amount: number,
    currency: string,
    walletAddress: string
  ): Promise<DepositSession> {
    // Get anchor info
    const info = await this.sep24.getInfo();
    
    // Check if currency is supported
    if (!info.deposit[currency]) {
      throw new Error(`Currency ${currency} not supported for deposit`);
    }
    
    // Initiate deposit
    const session = await this.sep24.initiateDeposit({
      asset_code: currency,
      amount: amount.toString(),
      account: walletAddress,
      // SEP-10 auth token would be included
    });
    
    return {
      id: session.id,
      url: session.url,
      expiresAt: session.expires_at,
    };
  }

  async initiateWithdrawal(
    userId: string,
    amount: number,
    currency: string,
    walletAddress: string,
    bankDetails: BankDetails
  ): Promise<WithdrawalSession> {
    const session = await this.sep24.initiateWithdraw({
      asset_code: currency,
      amount: amount.toString(),
      account: walletAddress,
      // Bank details passed through interactive flow
    });
    
    return {
      id: session.id,
      url: session.url,
      expiresAt: session.expires_at,
    };
  }
}
```

### 12.2 Event-Driven Architecture

```typescript
// services/events/src/index.ts

import { EventEmitter } from 'events';
import { SQS } from 'aws-sdk';

export const eventBus = new EventEmitter();

// Event types
export enum HaloEvent {
  USER_REGISTERED = 'user.registered',
  KYC_COMPLETED = 'kyc.completed',
  WALLET_BOUND = 'wallet.bound',
  CIRCLE_CREATED = 'circle.created',
  CIRCLE_ACTIVATED = 'circle.activated',
  MEMBER_JOINED = 'circle.memberJoined',
  CONTRIBUTION_MADE = 'contribution.made',
  PAYOUT_PROCESSED = 'payout.processed',
  CREDIT_UPDATED = 'credit.updated',
}

// Event handlers
eventBus.on(HaloEvent.CONTRIBUTION_MADE, async (data) => {
  // Update credit score
  await creditService.recordPayment(data);
  
  // Send notification
  await notificationService.sendContributionConfirmation(data);
  
  // Check if round is complete
  await circleService.checkRoundCompletion(data.circleId);
});

eventBus.on(HaloEvent.CIRCLE_ACTIVATED, async (data) => {
  // Send notifications to all members
  await notificationService.sendCircleActivationNotice(data.circleId);
  
  // Schedule first contribution reminder
  await schedulerService.scheduleContributionReminder(data.circleId);
});

// SQS integration for distributed processing
const sqs = new SQS();

export async function publishToQueue(event: HaloEvent, data: any) {
  await sqs.sendMessage({
    QueueUrl: process.env.SQS_QUEUE_URL,
    MessageBody: JSON.stringify({ event, data }),
    MessageGroupId: event,
  }).promise();
}
```

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| ROSCA | Rotating Savings and Credit Association |
| Unique ID | Deterministic identifier generated from KYC data |
| Circle | A group of users participating in a lending circle |
| Contribution | Regular payment made by circle members |
| Payout | Distribution of pooled funds to a member |
| Credit Score | 300-850 scale rating based on payment history |
| Soroban | Stellar's smart contract platform |
| Anchor | Regulated entity bridging fiat and Stellar |

---

## Appendix B: References

1. Stellar Development Foundation Documentation: https://developers.stellar.org
2. Soroban Smart Contracts: https://soroban.stellar.org
3. SEP Standards: https://github.com/stellar/stellar-protocol/tree/master/ecosystem
4. FICO Score Methodology: https://www.myfico.com/credit-education/whats-in-your-credit-score

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | Jan 2026 | XXIX Labs | Initial release |
