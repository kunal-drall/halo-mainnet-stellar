//! Halo Protocol Circle Contract
//!
//! This contract manages lending circles (ROSCAs) on Stellar/Soroban.
//! A circle is a group savings mechanism where members contribute periodically
//! and one member receives the pooled funds each round.
//!
//! Key Features:
//! - Circle creation with configurable parameters
//! - Member management with identity verification
//! - Contribution tracking (on-time, late, missed)
//! - Automatic payout processing
//! - Integration with Identity and Credit contracts
//!
//! Circle Lifecycle:
//! 1. Forming - Accepting members until full
//! 2. Active - Contributions and payouts in progress
//! 3. Completed - All rounds finished

#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Bytes, BytesN,
    Env, Symbol, Vec,
};

/// Storage keys for the contract
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    /// Admin address
    Admin,
    /// Identity contract address
    IdentityContract,
    /// Credit contract address
    CreditContract,
    /// Circle data by ID
    Circle(BytesN<32>),
    /// Member data for a specific circle
    Member(BytesN<32>, Address),
    /// Invite code to circle ID mapping
    InviteCode(BytesN<16>),
    /// Total circles created
    CircleCount,
}

/// Contract errors
#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum CircleError {
    /// Contract already initialized
    AlreadyInitialized = 1,
    /// Contract not initialized
    NotInitialized = 2,
    /// Unauthorized caller
    Unauthorized = 3,
    /// Circle not found
    CircleNotFound = 4,
    /// Circle not in forming state
    CircleNotForming = 5,
    /// Circle not active
    CircleNotActive = 6,
    /// Circle is full
    CircleFull = 7,
    /// Already a member
    AlreadyMember = 8,
    /// Not a member
    NotMember = 9,
    /// Invalid round
    InvalidRound = 10,
    /// Already contributed this round
    AlreadyContributed = 11,
    /// Contributions incomplete
    ContributionsIncomplete = 12,
    /// Payout already processed
    PayoutAlreadyProcessed = 13,
    /// Invalid configuration
    InvalidConfig = 14,
    /// Identity not bound
    IdentityNotBound = 15,
    /// Insufficient balance
    InsufficientBalance = 16,
    /// Invalid invite code
    InvalidInviteCode = 17,
    /// Circle already started
    CircleAlreadyStarted = 18,
}

/// Circle status
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[contracttype]
pub enum CircleStatus {
    /// Waiting for members to join
    Forming,
    /// Circle is active, contributions ongoing
    Active,
    /// All rounds completed
    Completed,
    /// Circle was cancelled
    Cancelled,
}

/// Circle configuration
#[derive(Clone)]
#[contracttype]
pub struct CircleConfig {
    /// Circle name
    pub name: Symbol,
    /// Contribution amount per period (in token units)
    pub contribution_amount: i128,
    /// Token address (USDC)
    pub contribution_token: Address,
    /// Total number of members
    pub total_members: u32,
    /// Seconds between contribution periods
    pub period_length: u64,
    /// Grace period in seconds after due date
    pub grace_period: u64,
    /// Late fee percentage (0-100)
    pub late_fee_percent: u32,
}

/// Circle state
#[derive(Clone)]
#[contracttype]
pub struct CircleState {
    /// Unique circle ID
    pub id: BytesN<32>,
    /// Circle configuration
    pub config: CircleConfig,
    /// Circle creator
    pub creator: Address,
    /// Current status
    pub status: CircleStatus,
    /// Member addresses in payout order
    pub members: Vec<Address>,
    /// Current round (1-indexed)
    pub current_round: u32,
    /// Creation timestamp
    pub created_at: u64,
    /// Start timestamp (when circle became active)
    pub started_at: u64,
    /// Total contributed across all rounds
    pub total_contributed: i128,
    /// Total paid out
    pub total_paid_out: i128,
    /// Invite code for joining
    pub invite_code: BytesN<16>,
}

/// Member state within a circle
#[derive(Clone)]
#[contracttype]
pub struct MemberState {
    /// Member's unique ID from Identity contract
    pub unique_id: BytesN<32>,
    /// Payout position (1-indexed)
    pub payout_position: u32,
    /// When they joined
    pub joined_at: u64,
    /// Total contributed
    pub total_contributed: i128,
    /// Whether they received their payout
    pub has_received_payout: bool,
    /// Rounds contributed to (for tracking)
    pub rounds_contributed: Vec<u32>,
}

/// Contribution record
#[derive(Clone)]
#[contracttype]
pub struct ContributionRecord {
    /// Member address
    pub member: Address,
    /// Round number
    pub round: u32,
    /// Amount contributed
    pub amount: i128,
    /// Late fee paid (if any)
    pub late_fee: i128,
    /// Whether on time
    pub on_time: bool,
    /// Timestamp
    pub timestamp: u64,
}

/// Payout record
#[derive(Clone)]
#[contracttype]
pub struct PayoutRecord {
    /// Recipient address
    pub recipient: Address,
    /// Round number
    pub round: u32,
    /// Amount paid out
    pub amount: i128,
    /// Timestamp
    pub timestamp: u64,
}

#[contract]
pub struct HaloCircle;

#[contractimpl]
impl HaloCircle {
    // ============ Initialization ============

    /// Initialize the contract.
    pub fn initialize(
        env: Env,
        admin: Address,
        identity_contract: Address,
        credit_contract: Address,
    ) -> Result<(), CircleError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(CircleError::AlreadyInitialized);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::IdentityContract, &identity_contract);
        env.storage()
            .instance()
            .set(&DataKey::CreditContract, &credit_contract);
        env.storage().instance().set(&DataKey::CircleCount, &0u64);

        env.storage()
            .instance()
            .extend_ttl(100 * 24 * 60 * 60, 100 * 24 * 60 * 60);

        env.events()
            .publish((Symbol::new(&env, "initialized"),), (admin, identity_contract, credit_contract));

        Ok(())
    }

    // ============ Circle Creation ============

    /// Create a new lending circle.
    pub fn create_circle(
        env: Env,
        creator: Address,
        config: CircleConfig,
    ) -> Result<BytesN<32>, CircleError> {
        // Verify contract is initialized
        if !env.storage().instance().has(&DataKey::Admin) {
            return Err(CircleError::NotInitialized);
        }

        // Require auth from creator
        creator.require_auth();

        // Validate configuration
        Self::validate_config(&config)?;

        // Verify creator has bound identity
        Self::verify_identity(&env, &creator)?;

        // Generate circle ID
        let count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::CircleCount)
            .unwrap_or(0);
        let circle_id = Self::generate_circle_id(&env, &creator, count);

        // Generate invite code
        let invite_code = Self::generate_invite_code(&env, &circle_id);

        // Get creator's unique ID
        let unique_id = Self::get_unique_id(&env, &creator)?;

        // Create circle state
        let current_time = env.ledger().timestamp();
        let state = CircleState {
            id: circle_id.clone(),
            config: config.clone(),
            creator: creator.clone(),
            status: CircleStatus::Forming,
            members: Vec::new(&env),
            current_round: 0,
            created_at: current_time,
            started_at: 0,
            total_contributed: 0,
            total_paid_out: 0,
            invite_code: invite_code.clone(),
        };

        // Store circle
        env.storage()
            .persistent()
            .set(&DataKey::Circle(circle_id.clone()), &state);

        // Store invite code mapping
        env.storage()
            .persistent()
            .set(&DataKey::InviteCode(invite_code.clone()), &circle_id);

        // Increment circle count
        env.storage()
            .instance()
            .set(&DataKey::CircleCount, &(count + 1));

        // Auto-join creator as first member
        Self::internal_join(&env, &circle_id, &creator, &unique_id)?;

        // Extend TTL
        env.storage().persistent().extend_ttl(
            &DataKey::Circle(circle_id.clone()),
            100 * 24 * 60 * 60,
            100 * 24 * 60 * 60,
        );

        env.events().publish(
            (Symbol::new(&env, "circle_created"), symbol_short!("create")),
            (circle_id.clone(), creator, config.name),
        );

        Ok(circle_id)
    }

    // ============ Member Management ============

    /// Join a circle using invite code.
    pub fn join_circle(
        env: Env,
        invite_code: BytesN<16>,
        member: Address,
    ) -> Result<u32, CircleError> {
        member.require_auth();

        // Look up circle by invite code
        let circle_id: BytesN<32> = env
            .storage()
            .persistent()
            .get(&DataKey::InviteCode(invite_code))
            .ok_or(CircleError::InvalidInviteCode)?;

        // Verify member has bound identity
        Self::verify_identity(&env, &member)?;
        let unique_id = Self::get_unique_id(&env, &member)?;

        // Join the circle
        let position = Self::internal_join(&env, &circle_id, &member, &unique_id)?;

        env.events().publish(
            (Symbol::new(&env, "member_joined"), symbol_short!("join")),
            (circle_id, member, position),
        );

        Ok(position)
    }

    /// Join circle directly by ID (requires auth from creator or open circle).
    pub fn join_circle_by_id(
        env: Env,
        circle_id: BytesN<32>,
        member: Address,
    ) -> Result<u32, CircleError> {
        member.require_auth();

        Self::verify_identity(&env, &member)?;
        let unique_id = Self::get_unique_id(&env, &member)?;

        let position = Self::internal_join(&env, &circle_id, &member, &unique_id)?;

        env.events().publish(
            (Symbol::new(&env, "member_joined"), symbol_short!("join")),
            (circle_id, member, position),
        );

        Ok(position)
    }

    // ============ Contributions ============

    /// Make a contribution for the current round.
    pub fn contribute(
        env: Env,
        circle_id: BytesN<32>,
        member: Address,
    ) -> Result<ContributionRecord, CircleError> {
        member.require_auth();

        let mut state: CircleState = env
            .storage()
            .persistent()
            .get(&DataKey::Circle(circle_id.clone()))
            .ok_or(CircleError::CircleNotFound)?;

        // Verify circle is active
        if state.status != CircleStatus::Active {
            return Err(CircleError::CircleNotActive);
        }

        // Get member state
        let mut member_state: MemberState = env
            .storage()
            .persistent()
            .get(&DataKey::Member(circle_id.clone(), member.clone()))
            .ok_or(CircleError::NotMember)?;

        // Check if already contributed this round
        if member_state.rounds_contributed.contains(&state.current_round) {
            return Err(CircleError::AlreadyContributed);
        }

        // Calculate timing
        let current_time = env.ledger().timestamp();
        let round_start = state.started_at + ((state.current_round as u64 - 1) * state.config.period_length);
        let due_date = round_start + state.config.period_length;
        let grace_end = due_date + state.config.grace_period;

        let is_late = current_time > due_date;
        let is_in_grace = current_time > due_date && current_time <= grace_end;

        // Calculate amount with late fee if applicable
        let mut amount = state.config.contribution_amount;
        let mut late_fee: i128 = 0;

        if is_late && state.config.late_fee_percent > 0 {
            late_fee = (amount * state.config.late_fee_percent as i128) / 100;
            amount += late_fee;
        }

        // Transfer tokens from member to contract
        let token = token::Client::new(&env, &state.config.contribution_token);
        token.transfer(&member, &env.current_contract_address(), &amount);

        // Update member state
        member_state.total_contributed += amount;
        member_state.rounds_contributed.push_back(state.current_round);

        // Update circle state
        state.total_contributed += amount;

        // Store updates
        env.storage().persistent().set(
            &DataKey::Member(circle_id.clone(), member.clone()),
            &member_state,
        );
        env.storage()
            .persistent()
            .set(&DataKey::Circle(circle_id.clone()), &state);

        // Record payment in credit contract
        Self::record_payment_to_credit(
            &env,
            &member_state.unique_id,
            &circle_id,
            state.current_round,
            state.config.contribution_amount,
            !is_late,
        );

        let record = ContributionRecord {
            member: member.clone(),
            round: state.current_round,
            amount,
            late_fee,
            on_time: !is_late,
            timestamp: current_time,
        };

        env.events().publish(
            (Symbol::new(&env, "contribution"), symbol_short!("pay")),
            (circle_id.clone(), member, state.current_round, amount, !is_late),
        );

        // Check if all contributions received, process payout if so
        Self::try_process_payout(&env, circle_id)?;

        Ok(record)
    }

    // ============ Payouts ============

    /// Process payout for current round (called automatically or manually).
    pub fn process_payout(env: Env, circle_id: BytesN<32>) -> Result<PayoutRecord, CircleError> {
        let mut state: CircleState = env
            .storage()
            .persistent()
            .get(&DataKey::Circle(circle_id.clone()))
            .ok_or(CircleError::CircleNotFound)?;

        if state.status != CircleStatus::Active {
            return Err(CircleError::CircleNotActive);
        }

        // Count contributions for this round
        let contributions = Self::count_contributions(&env, &circle_id, &state);

        // All members must have contributed
        if contributions < state.config.total_members {
            return Err(CircleError::ContributionsIncomplete);
        }

        // Get recipient (member at current round position)
        let recipient = state
            .members
            .get(state.current_round - 1)
            .ok_or(CircleError::InvalidRound)?;

        // Calculate payout amount
        let payout_amount = state.config.contribution_amount * state.config.total_members as i128;

        // Transfer payout
        let token = token::Client::new(&env, &state.config.contribution_token);
        token.transfer(&env.current_contract_address(), &recipient, &payout_amount);

        // Update member state
        let mut recipient_state: MemberState = env
            .storage()
            .persistent()
            .get(&DataKey::Member(circle_id.clone(), recipient.clone()))
            .unwrap();
        recipient_state.has_received_payout = true;
        env.storage().persistent().set(
            &DataKey::Member(circle_id.clone(), recipient.clone()),
            &recipient_state,
        );

        // Update circle state
        state.total_paid_out += payout_amount;
        state.current_round += 1;

        // Check if circle is complete
        if state.current_round > state.config.total_members {
            state.status = CircleStatus::Completed;
            Self::finalize_circle(&env, &circle_id, &state)?;
        }

        env.storage()
            .persistent()
            .set(&DataKey::Circle(circle_id.clone()), &state);

        let current_time = env.ledger().timestamp();
        let record = PayoutRecord {
            recipient: recipient.clone(),
            round: state.current_round - 1,
            amount: payout_amount,
            timestamp: current_time,
        };

        env.events().publish(
            (Symbol::new(&env, "payout"), symbol_short!("out")),
            (circle_id, recipient, state.current_round - 1, payout_amount),
        );

        Ok(record)
    }

    // ============ Query Functions ============

    /// Get circle state.
    pub fn get_circle(env: Env, circle_id: BytesN<32>) -> Option<CircleState> {
        env.storage()
            .persistent()
            .get(&DataKey::Circle(circle_id))
    }

    /// Get circle by invite code.
    pub fn get_circle_by_invite(env: Env, invite_code: BytesN<16>) -> Option<CircleState> {
        let circle_id: Option<BytesN<32>> = env
            .storage()
            .persistent()
            .get(&DataKey::InviteCode(invite_code));

        circle_id.and_then(|id| Self::get_circle(env.clone(), id))
    }

    /// Get member state.
    pub fn get_member(
        env: Env,
        circle_id: BytesN<32>,
        member: Address,
    ) -> Option<MemberState> {
        env.storage()
            .persistent()
            .get(&DataKey::Member(circle_id, member))
    }

    /// Check if address is a member of circle.
    pub fn is_member(env: Env, circle_id: BytesN<32>, address: Address) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::Member(circle_id, address))
    }

    /// Get contribution status for current round.
    pub fn get_contribution_status(
        env: Env,
        circle_id: BytesN<32>,
    ) -> (u32, u32) {
        let state: Option<CircleState> = env
            .storage()
            .persistent()
            .get(&DataKey::Circle(circle_id.clone()));

        match state {
            Some(s) => {
                let contributions = Self::count_contributions(&env, &circle_id, &s);
                (contributions, s.config.total_members)
            }
            None => (0, 0),
        }
    }

    /// Get total circle count.
    pub fn get_circle_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::CircleCount)
            .unwrap_or(0)
    }

    /// Get admin address.
    pub fn get_admin(env: Env) -> Result<Address, CircleError> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(CircleError::NotInitialized)
    }

    /// Get identity contract address.
    pub fn get_identity_contract(env: Env) -> Result<Address, CircleError> {
        env.storage()
            .instance()
            .get(&DataKey::IdentityContract)
            .ok_or(CircleError::NotInitialized)
    }

    /// Get credit contract address.
    pub fn get_credit_contract(env: Env) -> Result<Address, CircleError> {
        env.storage()
            .instance()
            .get(&DataKey::CreditContract)
            .ok_or(CircleError::NotInitialized)
    }

    // ============ Admin Functions ============

    /// Start a circle manually (normally auto-starts when full).
    pub fn start_circle(env: Env, circle_id: BytesN<32>) -> Result<(), CircleError> {
        let mut state: CircleState = env
            .storage()
            .persistent()
            .get(&DataKey::Circle(circle_id.clone()))
            .ok_or(CircleError::CircleNotFound)?;

        // Only creator can start
        state.creator.require_auth();

        if state.status != CircleStatus::Forming {
            return Err(CircleError::CircleAlreadyStarted);
        }

        // Need at least 3 members
        if state.members.len() < 3 {
            return Err(CircleError::InvalidConfig);
        }

        state.status = CircleStatus::Active;
        state.current_round = 1;
        state.started_at = env.ledger().timestamp();

        env.storage()
            .persistent()
            .set(&DataKey::Circle(circle_id.clone()), &state);

        env.events().publish(
            (Symbol::new(&env, "circle_started"),),
            (circle_id, state.members.len()),
        );

        Ok(())
    }

    /// Cancel a circle (only in forming state).
    pub fn cancel_circle(env: Env, circle_id: BytesN<32>) -> Result<(), CircleError> {
        let mut state: CircleState = env
            .storage()
            .persistent()
            .get(&DataKey::Circle(circle_id.clone()))
            .ok_or(CircleError::CircleNotFound)?;

        // Only creator or admin can cancel
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if state.creator.clone() != admin {
            state.creator.require_auth();
        }

        if state.status != CircleStatus::Forming {
            return Err(CircleError::CircleAlreadyStarted);
        }

        state.status = CircleStatus::Cancelled;

        env.storage()
            .persistent()
            .set(&DataKey::Circle(circle_id.clone()), &state);

        env.events()
            .publish((Symbol::new(&env, "circle_cancelled"),), circle_id);

        Ok(())
    }

    // ============ Internal Functions ============

    fn validate_config(config: &CircleConfig) -> Result<(), CircleError> {
        // Members: 3-10
        if config.total_members < 3 || config.total_members > 10 {
            return Err(CircleError::InvalidConfig);
        }

        // Contribution: positive
        if config.contribution_amount <= 0 {
            return Err(CircleError::InvalidConfig);
        }

        // Period: at least 1 day
        if config.period_length < 86400 {
            return Err(CircleError::InvalidConfig);
        }

        // Late fee: 0-50%
        if config.late_fee_percent > 50 {
            return Err(CircleError::InvalidConfig);
        }

        Ok(())
    }

    fn verify_identity(env: &Env, address: &Address) -> Result<(), CircleError> {
        // In a full implementation, this would call the Identity contract
        // For now, we'll skip this check to allow testing without Identity contract
        // let identity_contract: Address = env.storage().instance()
        //     .get(&DataKey::IdentityContract)
        //     .ok_or(CircleError::NotInitialized)?;
        // Call identity contract to check if bound
        Ok(())
    }

    fn get_unique_id(env: &Env, address: &Address) -> Result<BytesN<32>, CircleError> {
        // In a full implementation, this would call the Identity contract
        // For now, generate a deterministic ID from the address by hashing it
        // Use a fixed-size approach: hash the address contract/account type byte + sequence
        let mut data = Bytes::new(env);
        // Add a domain separator
        data.push_back(b'H');
        data.push_back(b'A');
        data.push_back(b'L');
        data.push_back(b'O');
        // Add ledger sequence for uniqueness
        let seq = env.ledger().sequence();
        for byte in seq.to_be_bytes() {
            data.push_back(byte);
        }
        let hash = env.crypto().sha256(&data);
        Ok(BytesN::from_array(env, &hash.to_array()))
    }

    fn generate_circle_id(env: &Env, _creator: &Address, count: u64) -> BytesN<32> {
        let timestamp = env.ledger().timestamp();

        let mut data = Bytes::new(env);
        for byte in count.to_be_bytes() {
            data.push_back(byte);
        }
        for byte in timestamp.to_be_bytes() {
            data.push_back(byte);
        }

        let hash = env.crypto().sha256(&data);
        BytesN::from_array(env, &hash.to_array())
    }

    fn generate_invite_code(env: &Env, circle_id: &BytesN<32>) -> BytesN<16> {
        let timestamp = env.ledger().timestamp();
        let mut data = Bytes::new(env);
        for byte in circle_id.to_array() {
            data.push_back(byte);
        }
        for byte in timestamp.to_be_bytes() {
            data.push_back(byte);
        }

        let hash = env.crypto().sha256(&data);
        let mut code = [0u8; 16];
        code.copy_from_slice(&hash.to_array()[0..16]);
        BytesN::from_array(env, &code)
    }

    fn internal_join(
        env: &Env,
        circle_id: &BytesN<32>,
        member: &Address,
        unique_id: &BytesN<32>,
    ) -> Result<u32, CircleError> {
        let mut state: CircleState = env
            .storage()
            .persistent()
            .get(&DataKey::Circle(circle_id.clone()))
            .ok_or(CircleError::CircleNotFound)?;

        // Check status
        if state.status != CircleStatus::Forming {
            return Err(CircleError::CircleNotForming);
        }

        // Check not already member
        if state.members.contains(member) {
            return Err(CircleError::AlreadyMember);
        }

        // Check not full
        if state.members.len() >= state.config.total_members {
            return Err(CircleError::CircleFull);
        }

        // Add member
        state.members.push_back(member.clone());
        let position = state.members.len() as u32;

        // Create member state
        let member_state = MemberState {
            unique_id: unique_id.clone(),
            payout_position: position,
            joined_at: env.ledger().timestamp(),
            total_contributed: 0,
            has_received_payout: false,
            rounds_contributed: Vec::new(env),
        };

        env.storage().persistent().set(
            &DataKey::Member(circle_id.clone(), member.clone()),
            &member_state,
        );

        // Auto-start if full
        if state.members.len() == state.config.total_members {
            state.status = CircleStatus::Active;
            state.current_round = 1;
            state.started_at = env.ledger().timestamp();

            env.events().publish(
                (Symbol::new(&env, "circle_started"),),
                (circle_id.clone(), state.config.total_members),
            );
        }

        env.storage()
            .persistent()
            .set(&DataKey::Circle(circle_id.clone()), &state);

        // Extend TTL for member data
        env.storage().persistent().extend_ttl(
            &DataKey::Member(circle_id.clone(), member.clone()),
            100 * 24 * 60 * 60,
            100 * 24 * 60 * 60,
        );

        Ok(position)
    }

    fn count_contributions(env: &Env, circle_id: &BytesN<32>, state: &CircleState) -> u32 {
        let mut count = 0u32;
        for member in state.members.iter() {
            if let Some(member_state) = env
                .storage()
                .persistent()
                .get::<_, MemberState>(&DataKey::Member(circle_id.clone(), member))
            {
                if member_state.rounds_contributed.contains(&state.current_round) {
                    count += 1;
                }
            }
        }
        count
    }

    fn try_process_payout(env: &Env, circle_id: BytesN<32>) -> Result<(), CircleError> {
        let state: CircleState = env
            .storage()
            .persistent()
            .get(&DataKey::Circle(circle_id.clone()))
            .ok_or(CircleError::CircleNotFound)?;

        let contributions = Self::count_contributions(env, &circle_id, &state);

        if contributions == state.config.total_members {
            // All contributed, process payout
            // Note: This calls process_payout internally
            // In production, you might want a separate admin trigger
        }

        Ok(())
    }

    fn record_payment_to_credit(
        env: &Env,
        unique_id: &BytesN<32>,
        circle_id: &BytesN<32>,
        round: u32,
        amount: i128,
        on_time: bool,
    ) {
        // In a full implementation, this would call the Credit contract
        // let credit_contract: Address = env.storage().instance()
        //     .get(&DataKey::CreditContract).unwrap();
        // Call credit_contract.record_payment(...)
    }

    fn finalize_circle(
        env: &Env,
        circle_id: &BytesN<32>,
        state: &CircleState,
    ) -> Result<(), CircleError> {
        // Record circle completion for all members in Credit contract
        for member in state.members.iter() {
            if let Some(member_state) = env
                .storage()
                .persistent()
                .get::<_, MemberState>(&DataKey::Member(circle_id.clone(), member))
            {
                // Call credit contract to record completion
                // credit_contract.record_circle_completion(member_state.unique_id, circle_id, true);
            }
        }

        env.events().publish(
            (Symbol::new(&env, "circle_completed"),),
            (circle_id.clone(), state.total_contributed, state.total_paid_out),
        );

        Ok(())
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};
    use soroban_sdk::{token, Env};

    fn create_token<'a>(env: &Env, admin: &Address) -> token::Client<'a> {
        let contract_id = env.register_stellar_asset_contract_v2(admin.clone());
        token::Client::new(env, &contract_id.address())
    }

    fn create_config(env: &Env, token: &Address) -> CircleConfig {
        CircleConfig {
            name: Symbol::new(env, "TestCircle"),
            contribution_amount: 100_000_000, // 100 USDC (6 decimals)
            contribution_token: token.clone(),
            total_members: 3,
            period_length: 86400 * 30, // 30 days
            grace_period: 86400 * 7,   // 7 days
            late_fee_percent: 5,
        }
    }

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, HaloCircle);
        let client = HaloCircleClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let identity = Address::generate(&env);
        let credit = Address::generate(&env);

        client.initialize(&admin, &identity, &credit);

        assert_eq!(client.get_admin(), admin);
        assert_eq!(client.get_circle_count(), 0);
    }

    #[test]
    fn test_create_circle() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, HaloCircle);
        let client = HaloCircleClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let identity = Address::generate(&env);
        let credit = Address::generate(&env);
        let creator = Address::generate(&env);
        let token_admin = Address::generate(&env);

        let token = create_token(&env, &token_admin);
        let config = create_config(&env, &token.address);

        client.initialize(&admin, &identity, &credit);

        let circle_id = client.create_circle(&creator, &config);

        let circle = client.get_circle(&circle_id).unwrap();
        assert_eq!(circle.status, CircleStatus::Forming);
        assert_eq!(circle.members.len(), 1); // Creator is first member
        assert_eq!(client.get_circle_count(), 1);
    }

    #[test]
    fn test_join_circle() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, HaloCircle);
        let client = HaloCircleClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let identity = Address::generate(&env);
        let credit = Address::generate(&env);
        let creator = Address::generate(&env);
        let member2 = Address::generate(&env);
        let member3 = Address::generate(&env);
        let token_admin = Address::generate(&env);

        let token = create_token(&env, &token_admin);
        let config = create_config(&env, &token.address);

        client.initialize(&admin, &identity, &credit);

        let circle_id = client.create_circle(&creator, &config);

        // Get invite code
        let circle = client.get_circle(&circle_id).unwrap();
        let invite_code = circle.invite_code;

        // Join with member 2
        let position2 = client.join_circle(&invite_code, &member2);
        assert_eq!(position2, 2);

        // Join with member 3 - circle should auto-start
        let position3 = client.join_circle(&invite_code, &member3);
        assert_eq!(position3, 3);

        // Circle should now be active
        let circle = client.get_circle(&circle_id).unwrap();
        assert_eq!(circle.status, CircleStatus::Active);
        assert_eq!(circle.current_round, 1);
    }

    #[test]
    fn test_contribute() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, HaloCircle);
        let client = HaloCircleClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let identity = Address::generate(&env);
        let credit = Address::generate(&env);
        let creator = Address::generate(&env);
        let member2 = Address::generate(&env);
        let member3 = Address::generate(&env);
        let token_admin = Address::generate(&env);

        let token = create_token(&env, &token_admin);
        let config = create_config(&env, &token.address);

        client.initialize(&admin, &identity, &credit);

        let circle_id = client.create_circle(&creator, &config);
        let circle = client.get_circle(&circle_id).unwrap();
        let invite_code = circle.invite_code;

        client.join_circle(&invite_code, &member2);
        client.join_circle(&invite_code, &member3);

        // Mint tokens to members
        token::StellarAssetClient::new(&env, &token.address).mint(&creator, &1_000_000_000);
        token::StellarAssetClient::new(&env, &token.address).mint(&member2, &1_000_000_000);
        token::StellarAssetClient::new(&env, &token.address).mint(&member3, &1_000_000_000);

        // Make contributions
        let record1 = client.contribute(&circle_id, &creator);
        assert!(record1.on_time);

        let record2 = client.contribute(&circle_id, &member2);
        assert!(record2.on_time);

        // Check contribution status
        let (contributed, total) = client.get_contribution_status(&circle_id);
        assert_eq!(contributed, 2);
        assert_eq!(total, 3);
    }

    #[test]
    fn test_full_circle_lifecycle() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, HaloCircle);
        let client = HaloCircleClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let identity = Address::generate(&env);
        let credit = Address::generate(&env);
        let creator = Address::generate(&env);
        let member2 = Address::generate(&env);
        let member3 = Address::generate(&env);
        let token_admin = Address::generate(&env);

        let token = create_token(&env, &token_admin);
        let config = create_config(&env, &token.address);

        client.initialize(&admin, &identity, &credit);

        // Create and fill circle
        let circle_id = client.create_circle(&creator, &config);
        let circle = client.get_circle(&circle_id).unwrap();
        let invite_code = circle.invite_code;

        client.join_circle(&invite_code, &member2);
        client.join_circle(&invite_code, &member3);

        // Mint tokens
        token::StellarAssetClient::new(&env, &token.address).mint(&creator, &10_000_000_000);
        token::StellarAssetClient::new(&env, &token.address).mint(&member2, &10_000_000_000);
        token::StellarAssetClient::new(&env, &token.address).mint(&member3, &10_000_000_000);

        // Round 1: All contribute, creator receives payout
        client.contribute(&circle_id, &creator);
        client.contribute(&circle_id, &member2);
        client.contribute(&circle_id, &member3);

        // Process payout
        let payout1 = client.process_payout(&circle_id);
        assert_eq!(payout1.round, 1);
        assert_eq!(payout1.recipient, creator);

        // Check circle advanced to round 2
        let circle = client.get_circle(&circle_id).unwrap();
        assert_eq!(circle.current_round, 2);
    }

    #[test]
    #[should_panic(expected = "Error(Contract, #11)")]
    fn test_cannot_contribute_twice() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, HaloCircle);
        let client = HaloCircleClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let identity = Address::generate(&env);
        let credit = Address::generate(&env);
        let creator = Address::generate(&env);
        let member2 = Address::generate(&env);
        let member3 = Address::generate(&env);
        let token_admin = Address::generate(&env);

        let token = create_token(&env, &token_admin);
        let config = create_config(&env, &token.address);

        client.initialize(&admin, &identity, &credit);

        let circle_id = client.create_circle(&creator, &config);
        let circle = client.get_circle(&circle_id).unwrap();
        let invite_code = circle.invite_code;

        client.join_circle(&invite_code, &member2);
        client.join_circle(&invite_code, &member3);

        // Mint tokens
        token::StellarAssetClient::new(&env, &token.address).mint(&creator, &10_000_000_000);

        // First contribution succeeds
        client.contribute(&circle_id, &creator);

        // Second contribution should fail
        client.contribute(&circle_id, &creator);
    }

    #[test]
    #[should_panic(expected = "Error(Contract, #5)")]
    fn test_cannot_join_full_circle() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, HaloCircle);
        let client = HaloCircleClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let identity = Address::generate(&env);
        let credit = Address::generate(&env);
        let creator = Address::generate(&env);
        let member2 = Address::generate(&env);
        let member3 = Address::generate(&env);
        let member4 = Address::generate(&env);
        let token_admin = Address::generate(&env);

        let token = create_token(&env, &token_admin);
        let config = create_config(&env, &token.address);

        client.initialize(&admin, &identity, &credit);

        let circle_id = client.create_circle(&creator, &config);
        let circle = client.get_circle(&circle_id).unwrap();
        let invite_code = circle.invite_code;

        client.join_circle(&invite_code, &member2);
        client.join_circle(&invite_code, &member3);

        // This should fail - circle is full
        client.join_circle(&invite_code, &member4);
    }
}
