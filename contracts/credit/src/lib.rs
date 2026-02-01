//! Halo Protocol Credit Contract
//!
//! This contract manages on-chain credit scores for Halo Protocol users.
//! Scores range from 300-850 and are calculated based on:
//! - Payment History (40%) - On-time vs late payments
//! - Circle Completion (25%) - Successfully completed circles
//! - Volume (15%) - Total transaction volume (logarithmic scale)
//! - Tenure (10%) - Time since first activity
//! - Peer Attestation (10%) - Reserved for future vouching system
//!
//! Key Features:
//! - Authorized contracts (Circle) can record payments
//! - Public query functions for SDK integration
//! - Score decay for inactive users
//! - Full payment history tracking

#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, BytesN, Env,
    Symbol, Vec,
};

/// Storage keys for the contract
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    /// Admin address
    Admin,
    /// List of contracts authorized to update scores
    AuthorizedContracts,
    /// Credit data for a unique ID
    CreditScore(BytesN<32>),
    /// Payment history for a unique ID
    PaymentHistory(BytesN<32>),
    /// Total number of users with credit scores
    UserCount,
}

/// Contract errors
#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum CreditError {
    /// Contract has already been initialized
    AlreadyInitialized = 1,
    /// Contract has not been initialized
    NotInitialized = 2,
    /// Caller is not authorized
    Unauthorized = 3,
    /// User not found
    UserNotFound = 4,
    /// Contract already authorized
    ContractAlreadyAuthorized = 5,
    /// Invalid score value
    InvalidScore = 6,
}

/// Credit data stored for each user
#[derive(Clone)]
#[contracttype]
pub struct CreditData {
    /// The user's unique ID
    pub unique_id: BytesN<32>,
    /// Credit score (300-850)
    pub score: u32,
    /// Total number of payments made
    pub total_payments: u32,
    /// Number of on-time payments
    pub on_time_payments: u32,
    /// Number of late payments
    pub late_payments: u32,
    /// Number of missed payments
    pub missed_payments: u32,
    /// Number of circles completed successfully
    pub circles_completed: u32,
    /// Number of circles defaulted/failed
    pub circles_defaulted: u32,
    /// Total volume transacted (in token units)
    pub total_volume: i128,
    /// Timestamp of last activity
    pub last_updated: u64,
    /// Timestamp of first activity
    pub first_activity: u64,
    /// Score algorithm version
    pub score_version: u32,
}

/// Individual payment record
#[derive(Clone)]
#[contracttype]
pub struct PaymentRecord {
    /// Circle ID where payment was made
    pub circle_id: BytesN<32>,
    /// Round number in the circle
    pub round: u32,
    /// Payment amount
    pub amount: i128,
    /// Whether payment was on time
    pub on_time: bool,
    /// Timestamp of payment
    pub timestamp: u64,
}

/// Score tier based on credit score
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[contracttype]
pub enum ScoreTier {
    /// 300-449: Building credit
    Building,
    /// 450-599: Fair
    Fair,
    /// 600-749: Good
    Good,
    /// 750-850: Excellent
    Excellent,
}

/// Score breakdown by component
#[derive(Clone)]
#[contracttype]
pub struct ScoreBreakdown {
    /// Payment history component (max 220)
    pub payment_history: u32,
    /// Circle completion component (max 137)
    pub circle_completion: u32,
    /// Volume component (max 83)
    pub volume: u32,
    /// Tenure component (max 55)
    pub tenure: u32,
    /// Attestation component (max 55)
    pub attestation: u32,
    /// Total score
    pub total: u32,
}

#[contract]
pub struct HaloCredit;

#[contractimpl]
impl HaloCredit {
    // ============ Constants ============

    /// Base score for new users
    const BASE_SCORE: u32 = 300;
    /// Maximum possible score
    const MAX_SCORE: u32 = 850;
    /// Current score algorithm version
    const SCORE_VERSION: u32 = 1;

    /// Weight for payment history (40% = 220 points max)
    const PAYMENT_HISTORY_MAX: u32 = 220;
    /// Weight for circle completion (25% = 137 points max)
    const CIRCLE_COMPLETION_MAX: u32 = 137;
    /// Weight for volume (15% = 83 points max)
    const VOLUME_MAX: u32 = 83;
    /// Weight for tenure (10% = 55 points max)
    const TENURE_MAX: u32 = 55;
    /// Weight for attestation (10% = 55 points max)
    const ATTESTATION_MAX: u32 = 55;

    // ============ Admin Functions ============

    /// Initialize the contract with an admin address.
    pub fn initialize(env: Env, admin: Address) -> Result<(), CreditError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(CreditError::AlreadyInitialized);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::AuthorizedContracts, &Vec::<Address>::new(&env));
        env.storage().instance().set(&DataKey::UserCount, &0u64);

        env.storage()
            .instance()
            .extend_ttl(100 * 24 * 60 * 60, 100 * 24 * 60 * 60);

        env.events()
            .publish((Symbol::new(&env, "initialized"),), admin);

        Ok(())
    }

    /// Add a contract to the authorized list (can update scores).
    pub fn authorize_contract(env: Env, contract: Address) -> Result<(), CreditError> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(CreditError::NotInitialized)?;

        admin.require_auth();

        let mut authorized: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::AuthorizedContracts)
            .unwrap_or(Vec::new(&env));

        if authorized.contains(&contract) {
            return Err(CreditError::ContractAlreadyAuthorized);
        }

        authorized.push_back(contract.clone());
        env.storage()
            .instance()
            .set(&DataKey::AuthorizedContracts, &authorized);

        env.events()
            .publish((Symbol::new(&env, "contract_authorized"),), contract);

        Ok(())
    }

    /// Remove a contract from the authorized list.
    pub fn revoke_contract(env: Env, contract: Address) -> Result<(), CreditError> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(CreditError::NotInitialized)?;

        admin.require_auth();

        let authorized: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::AuthorizedContracts)
            .unwrap_or(Vec::new(&env));

        let mut new_authorized = Vec::new(&env);
        for addr in authorized.iter() {
            if addr != contract {
                new_authorized.push_back(addr);
            }
        }

        env.storage()
            .instance()
            .set(&DataKey::AuthorizedContracts, &new_authorized);

        env.events()
            .publish((Symbol::new(&env, "contract_revoked"),), contract);

        Ok(())
    }

    // ============ Score Update Functions (Authorized Only) ============

    /// Record a payment. Called by Circle contract.
    pub fn record_payment(
        env: Env,
        caller: Address,
        unique_id: BytesN<32>,
        circle_id: BytesN<32>,
        round: u32,
        amount: i128,
        on_time: bool,
    ) -> Result<u32, CreditError> {
        Self::verify_authorized(&env, &caller)?;

        let mut credit_data = Self::get_or_create_credit_data(&env, &unique_id);
        let current_time = env.ledger().timestamp();

        // Update payment stats
        credit_data.total_payments += 1;
        if on_time {
            credit_data.on_time_payments += 1;
        } else {
            credit_data.late_payments += 1;
        }
        credit_data.total_volume += amount;
        credit_data.last_updated = current_time;

        // Recalculate score
        credit_data.score = Self::calculate_score(&env, &credit_data);

        // Store updated credit data
        env.storage()
            .persistent()
            .set(&DataKey::CreditScore(unique_id.clone()), &credit_data);

        // Store payment record
        let record = PaymentRecord {
            circle_id,
            round,
            amount,
            on_time,
            timestamp: current_time,
        };
        Self::append_payment_record(&env, &unique_id, record);

        // Extend TTL
        env.storage().persistent().extend_ttl(
            &DataKey::CreditScore(unique_id.clone()),
            100 * 24 * 60 * 60,
            100 * 24 * 60 * 60,
        );

        env.events().publish(
            (Symbol::new(&env, "payment_recorded"), symbol_short!("pay")),
            (unique_id, on_time, credit_data.score),
        );

        Ok(credit_data.score)
    }

    /// Record a missed payment. Called by Circle contract.
    pub fn record_missed_payment(
        env: Env,
        caller: Address,
        unique_id: BytesN<32>,
        circle_id: BytesN<32>,
        round: u32,
    ) -> Result<u32, CreditError> {
        Self::verify_authorized(&env, &caller)?;

        let mut credit_data = Self::get_or_create_credit_data(&env, &unique_id);
        let current_time = env.ledger().timestamp();

        // Update stats
        credit_data.total_payments += 1;
        credit_data.missed_payments += 1;
        credit_data.last_updated = current_time;

        // Recalculate score
        credit_data.score = Self::calculate_score(&env, &credit_data);

        env.storage()
            .persistent()
            .set(&DataKey::CreditScore(unique_id.clone()), &credit_data);

        env.events().publish(
            (Symbol::new(&env, "payment_missed"), symbol_short!("miss")),
            (unique_id.clone(), circle_id, round, credit_data.score),
        );

        Ok(credit_data.score)
    }

    /// Record circle completion. Called by Circle contract.
    pub fn record_circle_completion(
        env: Env,
        caller: Address,
        unique_id: BytesN<32>,
        circle_id: BytesN<32>,
        completed_successfully: bool,
    ) -> Result<u32, CreditError> {
        Self::verify_authorized(&env, &caller)?;

        let mut credit_data = Self::get_or_create_credit_data(&env, &unique_id);
        let current_time = env.ledger().timestamp();

        if completed_successfully {
            credit_data.circles_completed += 1;
        } else {
            credit_data.circles_defaulted += 1;
        }

        credit_data.last_updated = current_time;
        credit_data.score = Self::calculate_score(&env, &credit_data);

        env.storage()
            .persistent()
            .set(&DataKey::CreditScore(unique_id.clone()), &credit_data);

        env.events().publish(
            (Symbol::new(&env, "circle_completed"),),
            (unique_id, circle_id, completed_successfully, credit_data.score),
        );

        Ok(credit_data.score)
    }

    // ============ Public Query Functions (SDK) ============

    /// Get the credit score for a user. PUBLIC - used by SDK.
    pub fn get_score(env: Env, unique_id: BytesN<32>) -> Option<u32> {
        let credit_data: Option<CreditData> = env
            .storage()
            .persistent()
            .get(&DataKey::CreditScore(unique_id));
        credit_data.map(|d| d.score)
    }

    /// Get full credit data for a user. PUBLIC - used by SDK.
    pub fn get_credit_data(env: Env, unique_id: BytesN<32>) -> Option<CreditData> {
        env.storage()
            .persistent()
            .get(&DataKey::CreditScore(unique_id))
    }

    /// Get the score tier for a user. PUBLIC - used by SDK.
    pub fn get_tier(env: Env, unique_id: BytesN<32>) -> Option<ScoreTier> {
        let credit_data: Option<CreditData> = env
            .storage()
            .persistent()
            .get(&DataKey::CreditScore(unique_id));

        credit_data.map(|d| Self::score_to_tier(d.score))
    }

    /// Get detailed score breakdown. PUBLIC - used by SDK.
    pub fn get_score_breakdown(env: Env, unique_id: BytesN<32>) -> Option<ScoreBreakdown> {
        let credit_data: Option<CreditData> = env
            .storage()
            .persistent()
            .get(&DataKey::CreditScore(unique_id));

        credit_data.map(|d| Self::calculate_breakdown(&env, &d))
    }

    /// Get payment history for a user. PUBLIC - used by SDK.
    pub fn get_payment_history(env: Env, unique_id: BytesN<32>) -> Vec<PaymentRecord> {
        env.storage()
            .persistent()
            .get(&DataKey::PaymentHistory(unique_id))
            .unwrap_or(Vec::new(&env))
    }

    /// Get on-time payment rate (0-100). PUBLIC - used by SDK.
    pub fn get_on_time_rate(env: Env, unique_id: BytesN<32>) -> Option<u32> {
        let credit_data: Option<CreditData> = env
            .storage()
            .persistent()
            .get(&DataKey::CreditScore(unique_id));

        credit_data.map(|d| {
            if d.total_payments == 0 {
                100 // No payments means 100% (no late payments)
            } else {
                (d.on_time_payments * 100) / d.total_payments
            }
        })
    }

    /// Get total number of users with credit scores.
    pub fn get_user_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::UserCount)
            .unwrap_or(0)
    }

    /// Get admin address.
    pub fn get_admin(env: Env) -> Result<Address, CreditError> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(CreditError::NotInitialized)
    }

    /// Get list of authorized contracts.
    pub fn get_authorized_contracts(env: Env) -> Vec<Address> {
        env.storage()
            .instance()
            .get(&DataKey::AuthorizedContracts)
            .unwrap_or(Vec::new(&env))
    }

    // ============ Score Decay ============

    /// Apply score decay for inactive users. Can be called by anyone.
    pub fn apply_decay(env: Env, unique_id: BytesN<32>) -> Result<u32, CreditError> {
        let mut credit_data: CreditData = env
            .storage()
            .persistent()
            .get(&DataKey::CreditScore(unique_id.clone()))
            .ok_or(CreditError::UserNotFound)?;

        let current_time = env.ledger().timestamp();
        let days_inactive = (current_time - credit_data.last_updated) / 86400;

        // Decay 1 point per week of inactivity after 30 days grace period
        if days_inactive > 30 {
            let decay_weeks = (days_inactive - 30) / 7;
            let decay_points = decay_weeks as u32;

            // Don't decay below base score
            if credit_data.score > Self::BASE_SCORE + decay_points {
                credit_data.score -= decay_points;
            } else {
                credit_data.score = Self::BASE_SCORE;
            }

            env.storage()
                .persistent()
                .set(&DataKey::CreditScore(unique_id.clone()), &credit_data);

            env.events().publish(
                (Symbol::new(&env, "score_decayed"),),
                (unique_id, decay_points, credit_data.score),
            );
        }

        Ok(credit_data.score)
    }

    // ============ Internal Functions ============

    fn verify_authorized(env: &Env, caller: &Address) -> Result<(), CreditError> {
        let authorized: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::AuthorizedContracts)
            .ok_or(CreditError::NotInitialized)?;

        if !authorized.contains(caller) {
            return Err(CreditError::Unauthorized);
        }

        Ok(())
    }

    fn get_or_create_credit_data(env: &Env, unique_id: &BytesN<32>) -> CreditData {
        let key = DataKey::CreditScore(unique_id.clone());

        if let Some(data) = env.storage().persistent().get::<_, CreditData>(&key) {
            return data;
        }

        // Create new credit data
        let current_time = env.ledger().timestamp();
        let new_data = CreditData {
            unique_id: unique_id.clone(),
            score: Self::BASE_SCORE,
            total_payments: 0,
            on_time_payments: 0,
            late_payments: 0,
            missed_payments: 0,
            circles_completed: 0,
            circles_defaulted: 0,
            total_volume: 0,
            last_updated: current_time,
            first_activity: current_time,
            score_version: Self::SCORE_VERSION,
        };

        // Increment user count
        let count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::UserCount)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::UserCount, &(count + 1));

        new_data
    }

    fn calculate_score(env: &Env, data: &CreditData) -> u32 {
        let breakdown = Self::calculate_breakdown(env, data);
        breakdown.total
    }

    fn calculate_breakdown(env: &Env, data: &CreditData) -> ScoreBreakdown {
        // 1. Payment History (40% = max 220 points)
        let payment_score = if data.total_payments > 0 {
            // Include missed payments in calculation
            let total = data.total_payments;
            let on_time_ratio = (data.on_time_payments * 100) / total;

            // Missed payments have severe penalty
            let missed_penalty = if data.missed_payments > 0 {
                (data.missed_payments * 30).min(100) // -30 points per missed, max -100
            } else {
                0
            };

            let base_payment_score = (on_time_ratio * Self::PAYMENT_HISTORY_MAX) / 100;
            if base_payment_score > missed_penalty {
                base_payment_score - missed_penalty
            } else {
                0
            }
        } else {
            Self::PAYMENT_HISTORY_MAX / 2 // Neutral for no history
        };

        // 2. Circle Completion (25% = max 137 points)
        let total_circles = data.circles_completed + data.circles_defaulted;
        let completion_score = if total_circles > 0 {
            let completion_ratio = (data.circles_completed * 100) / total_circles;
            (completion_ratio * Self::CIRCLE_COMPLETION_MAX) / 100
        } else {
            Self::CIRCLE_COMPLETION_MAX / 2 // Neutral
        };

        // 3. Volume (15% = max 83 points) - Logarithmic scale
        let volume_score = Self::calculate_volume_score(data.total_volume);

        // 4. Tenure (10% = max 55 points)
        let current_time = env.ledger().timestamp();
        let tenure_days = (current_time - data.first_activity) / 86400;
        let tenure_score = if tenure_days > 365 {
            Self::TENURE_MAX
        } else {
            ((tenure_days as u32) * Self::TENURE_MAX) / 365
        };

        // 5. Attestation (10% = max 55 points) - Neutral for now
        let attestation_score = Self::ATTESTATION_MAX / 2;

        // Calculate total (base 300)
        let total = (Self::BASE_SCORE
            + payment_score
            + completion_score
            + volume_score
            + tenure_score
            + attestation_score)
            .min(Self::MAX_SCORE);

        ScoreBreakdown {
            payment_history: payment_score,
            circle_completion: completion_score,
            volume: volume_score,
            tenure: tenure_score,
            attestation: attestation_score,
            total,
        }
    }

    fn calculate_volume_score(volume: i128) -> u32 {
        // Logarithmic scale for volume (assuming 6 decimal places for USDC)
        // $100 = 20%, $1000 = 40%, $10000 = 60%, $100000 = 80%, $1M+ = 100%
        let percentage = if volume < 100_000_000 {
            // < $100
            20
        } else if volume < 1_000_000_000 {
            // < $1000
            40
        } else if volume < 10_000_000_000 {
            // < $10000
            60
        } else if volume < 100_000_000_000 {
            // < $100000
            80
        } else {
            100
        };

        (percentage * Self::VOLUME_MAX) / 100
    }

    fn score_to_tier(score: u32) -> ScoreTier {
        if score < 450 {
            ScoreTier::Building
        } else if score < 600 {
            ScoreTier::Fair
        } else if score < 750 {
            ScoreTier::Good
        } else {
            ScoreTier::Excellent
        }
    }

    fn append_payment_record(env: &Env, unique_id: &BytesN<32>, record: PaymentRecord) {
        let key = DataKey::PaymentHistory(unique_id.clone());
        let mut history: Vec<PaymentRecord> = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or(Vec::new(env));

        history.push_back(record);

        // Keep only last 100 records to manage storage
        if history.len() > 100 {
            let start = history.len() - 100;
            history = history.slice(start as u32..);
        }

        env.storage().persistent().set(&key, &history);

        // Extend TTL
        env.storage()
            .persistent()
            .extend_ttl(&key, 100 * 24 * 60 * 60, 100 * 24 * 60 * 60);
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::Env;

    fn create_unique_id(env: &Env, seed: u8) -> BytesN<32> {
        let mut bytes = [0u8; 32];
        bytes[0] = seed;
        BytesN::from_array(env, &bytes)
    }

    fn create_circle_id(env: &Env, seed: u8) -> BytesN<32> {
        let mut bytes = [0u8; 32];
        bytes[0] = seed;
        bytes[1] = 0xCC; // Mark as circle ID
        BytesN::from_array(env, &bytes)
    }

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, HaloCredit);
        let client = HaloCreditClient::new(&env, &contract_id);

        let admin = Address::generate(&env);

        client.initialize(&admin);

        assert_eq!(client.get_admin(), admin);
        assert_eq!(client.get_user_count(), 0);
    }

    #[test]
    fn test_authorize_and_record_payment() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, HaloCredit);
        let client = HaloCreditClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let circle_contract = Address::generate(&env);
        let unique_id = create_unique_id(&env, 1);
        let circle_id = create_circle_id(&env, 1);

        client.initialize(&admin);
        client.authorize_contract(&circle_contract);

        // Record on-time payment
        let score = client.record_payment(&circle_contract, &unique_id, &circle_id, &1, &100_000_000, &true);

        assert!(score >= 300);
        assert!(client.get_score(&unique_id).is_some());
        assert_eq!(client.get_user_count(), 1);

        let credit_data = client.get_credit_data(&unique_id).unwrap();
        assert_eq!(credit_data.total_payments, 1);
        assert_eq!(credit_data.on_time_payments, 1);
    }

    #[test]
    fn test_late_payment_affects_score() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, HaloCredit);
        let client = HaloCreditClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let circle_contract = Address::generate(&env);
        let unique_id = create_unique_id(&env, 1);
        let circle_id = create_circle_id(&env, 1);

        client.initialize(&admin);
        client.authorize_contract(&circle_contract);

        // Record late payment
        let score_after_late = client.record_payment(&circle_contract, &unique_id, &circle_id, &1, &100_000_000, &false);

        // Record on-time payment for comparison
        let unique_id_2 = create_unique_id(&env, 2);
        let score_after_ontime = client.record_payment(&circle_contract, &unique_id_2, &circle_id, &1, &100_000_000, &true);

        // On-time should have better score than late
        assert!(score_after_ontime > score_after_late);
    }

    #[test]
    fn test_circle_completion_bonus() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, HaloCredit);
        let client = HaloCreditClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let circle_contract = Address::generate(&env);
        let unique_id = create_unique_id(&env, 1);
        let circle_id = create_circle_id(&env, 1);

        client.initialize(&admin);
        client.authorize_contract(&circle_contract);

        // Record initial payment
        let initial_score = client.record_payment(&circle_contract, &unique_id, &circle_id, &1, &100_000_000, &true);

        // Record circle completion
        let final_score = client.record_circle_completion(&circle_contract, &unique_id, &circle_id, &true);

        // Score should improve after circle completion
        assert!(final_score >= initial_score);

        let credit_data = client.get_credit_data(&unique_id).unwrap();
        assert_eq!(credit_data.circles_completed, 1);
    }

    #[test]
    fn test_score_tier() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, HaloCredit);
        let client = HaloCreditClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let circle_contract = Address::generate(&env);
        let unique_id = create_unique_id(&env, 1);
        let circle_id = create_circle_id(&env, 1);

        client.initialize(&admin);
        client.authorize_contract(&circle_contract);

        // New user should be in Building tier
        client.record_payment(&circle_contract, &unique_id, &circle_id, &1, &100_000_000, &true);

        let tier = client.get_tier(&unique_id).unwrap();
        // New users start around 300-500, so they're in Building or Fair
        assert!(tier == ScoreTier::Building || tier == ScoreTier::Fair || tier == ScoreTier::Good);
    }

    #[test]
    fn test_on_time_rate() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, HaloCredit);
        let client = HaloCreditClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let circle_contract = Address::generate(&env);
        let unique_id = create_unique_id(&env, 1);
        let circle_id = create_circle_id(&env, 1);

        client.initialize(&admin);
        client.authorize_contract(&circle_contract);

        // 3 on-time, 1 late = 75% on-time rate
        client.record_payment(&circle_contract, &unique_id, &circle_id, &1, &100_000_000, &true);
        client.record_payment(&circle_contract, &unique_id, &circle_id, &2, &100_000_000, &true);
        client.record_payment(&circle_contract, &unique_id, &circle_id, &3, &100_000_000, &true);
        client.record_payment(&circle_contract, &unique_id, &circle_id, &4, &100_000_000, &false);

        let rate = client.get_on_time_rate(&unique_id).unwrap();
        assert_eq!(rate, 75);
    }

    #[test]
    #[should_panic(expected = "Error(Contract, #3)")]
    fn test_unauthorized_cannot_record() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, HaloCredit);
        let client = HaloCreditClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let unauthorized = Address::generate(&env);
        let unique_id = create_unique_id(&env, 1);
        let circle_id = create_circle_id(&env, 1);

        client.initialize(&admin);

        // Try to record without authorization - should fail
        client.record_payment(&unauthorized, &unique_id, &circle_id, &1, &100_000_000, &true);
    }

    #[test]
    fn test_payment_history() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, HaloCredit);
        let client = HaloCreditClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let circle_contract = Address::generate(&env);
        let unique_id = create_unique_id(&env, 1);
        let circle_id = create_circle_id(&env, 1);

        client.initialize(&admin);
        client.authorize_contract(&circle_contract);

        // Record multiple payments
        for round in 1..=5 {
            client.record_payment(&circle_contract, &unique_id, &circle_id, &round, &100_000_000, &true);
        }

        let history = client.get_payment_history(&unique_id);
        assert_eq!(history.len(), 5);
    }
}
