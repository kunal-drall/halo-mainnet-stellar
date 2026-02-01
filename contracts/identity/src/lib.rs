//! Halo Protocol Identity Contract
//!
//! This contract provides sybil-resistant identity management with permanent wallet binding.
//! Each unique ID (derived from KYC data) can only be bound to one wallet address, and
//! each wallet can only be bound to one unique ID. This binding is permanent and cannot
//! be changed.
//!
//! Key Features:
//! - One-time permanent wallet binding
//! - Bidirectional lookup (ID -> Wallet, Wallet -> ID)
//! - Anti-sybil: prevents duplicate identities
//! - Events for all binding operations

#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, BytesN, Env,
    Symbol,
};

/// Storage keys for the contract
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    /// Admin address with privileged access
    Admin,
    /// Mapping from unique ID to wallet address
    IdToWallet(BytesN<32>),
    /// Mapping from wallet address to unique ID
    WalletToId(Address),
    /// Total number of bindings created
    BindingCount,
}

/// Contract errors
#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum IdentityError {
    /// Contract has already been initialized
    AlreadyInitialized = 1,
    /// Contract has not been initialized
    NotInitialized = 2,
    /// Caller is not authorized to perform this action
    Unauthorized = 3,
    /// The unique ID is already bound to a wallet
    IdAlreadyBound = 4,
    /// The wallet is already bound to a unique ID
    WalletAlreadyBound = 5,
    /// The wallet is not bound to any identity
    WalletNotBound = 6,
    /// The unique ID is not bound to any wallet
    IdNotBound = 7,
    /// Invalid unique ID format
    InvalidId = 8,
}

#[contract]
pub struct HaloIdentity;

#[contractimpl]
impl HaloIdentity {
    /// Initialize the contract with an admin address.
    ///
    /// # Arguments
    /// * `env` - The contract environment
    /// * `admin` - The address that will have admin privileges
    ///
    /// # Errors
    /// Returns `AlreadyInitialized` if the contract has already been initialized
    pub fn initialize(env: Env, admin: Address) -> Result<(), IdentityError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(IdentityError::AlreadyInitialized);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::BindingCount, &0u64);

        // Extend instance TTL
        env.storage()
            .instance()
            .extend_ttl(100 * 24 * 60 * 60, 100 * 24 * 60 * 60);

        env.events().publish(
            (Symbol::new(&env, "initialized"),),
            admin,
        );

        Ok(())
    }

    /// Bind a wallet address to a unique ID. This is a one-time, permanent operation.
    ///
    /// # Arguments
    /// * `env` - The contract environment
    /// * `unique_id` - The 32-byte unique identifier derived from KYC data
    /// * `wallet` - The wallet address to bind
    ///
    /// # Errors
    /// * `NotInitialized` - Contract not initialized
    /// * `IdAlreadyBound` - The unique ID is already bound to another wallet
    /// * `WalletAlreadyBound` - The wallet is already bound to another ID
    ///
    /// # Authorization
    /// Requires authorization from the wallet being bound
    pub fn bind_wallet(
        env: Env,
        unique_id: BytesN<32>,
        wallet: Address,
    ) -> Result<(), IdentityError> {
        // Verify contract is initialized
        if !env.storage().instance().has(&DataKey::Admin) {
            return Err(IdentityError::NotInitialized);
        }

        // Require authorization from the wallet
        wallet.require_auth();

        // Check if unique ID is already bound
        let id_key = DataKey::IdToWallet(unique_id.clone());
        if env.storage().persistent().has(&id_key) {
            return Err(IdentityError::IdAlreadyBound);
        }

        // Check if wallet is already bound
        let wallet_key = DataKey::WalletToId(wallet.clone());
        if env.storage().persistent().has(&wallet_key) {
            return Err(IdentityError::WalletAlreadyBound);
        }

        // Store bidirectional mapping
        env.storage().persistent().set(&id_key, &wallet);
        env.storage().persistent().set(&wallet_key, &unique_id);

        // Extend TTL for persistent storage (100 days, archival after 100 days)
        env.storage()
            .persistent()
            .extend_ttl(&id_key, 100 * 24 * 60 * 60, 100 * 24 * 60 * 60);
        env.storage()
            .persistent()
            .extend_ttl(&wallet_key, 100 * 24 * 60 * 60, 100 * 24 * 60 * 60);

        // Increment binding count
        let count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::BindingCount)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::BindingCount, &(count + 1));

        // Emit binding event
        env.events().publish(
            (Symbol::new(&env, "wallet_bound"), symbol_short!("bind")),
            (unique_id.clone(), wallet.clone()),
        );

        Ok(())
    }

    /// Check if a wallet address is bound to an identity.
    ///
    /// # Arguments
    /// * `env` - The contract environment
    /// * `wallet` - The wallet address to check
    ///
    /// # Returns
    /// `true` if the wallet is bound, `false` otherwise
    pub fn is_bound(env: Env, wallet: Address) -> bool {
        let wallet_key = DataKey::WalletToId(wallet);
        env.storage().persistent().has(&wallet_key)
    }

    /// Get the unique ID bound to a wallet address.
    ///
    /// # Arguments
    /// * `env` - The contract environment
    /// * `wallet` - The wallet address to look up
    ///
    /// # Returns
    /// The unique ID if found, or an error if the wallet is not bound
    pub fn get_id(env: Env, wallet: Address) -> Result<BytesN<32>, IdentityError> {
        let wallet_key = DataKey::WalletToId(wallet);
        env.storage()
            .persistent()
            .get(&wallet_key)
            .ok_or(IdentityError::WalletNotBound)
    }

    /// Get the wallet address bound to a unique ID.
    ///
    /// # Arguments
    /// * `env` - The contract environment
    /// * `unique_id` - The unique ID to look up
    ///
    /// # Returns
    /// The wallet address if found, or an error if the ID is not bound
    pub fn get_wallet(env: Env, unique_id: BytesN<32>) -> Result<Address, IdentityError> {
        let id_key = DataKey::IdToWallet(unique_id);
        env.storage()
            .persistent()
            .get(&id_key)
            .ok_or(IdentityError::IdNotBound)
    }

    /// Get the total number of wallet bindings.
    ///
    /// # Arguments
    /// * `env` - The contract environment
    ///
    /// # Returns
    /// The total number of wallet bindings created
    pub fn get_binding_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::BindingCount)
            .unwrap_or(0)
    }

    /// Get the admin address.
    ///
    /// # Arguments
    /// * `env` - The contract environment
    ///
    /// # Returns
    /// The admin address if set, or an error if not initialized
    pub fn get_admin(env: Env) -> Result<Address, IdentityError> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(IdentityError::NotInitialized)
    }

    /// Update the admin address. Only callable by current admin.
    ///
    /// # Arguments
    /// * `env` - The contract environment
    /// * `new_admin` - The new admin address
    ///
    /// # Errors
    /// * `NotInitialized` - Contract not initialized
    /// * `Unauthorized` - Caller is not the current admin
    pub fn set_admin(env: Env, new_admin: Address) -> Result<(), IdentityError> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(IdentityError::NotInitialized)?;

        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &new_admin);

        env.events().publish(
            (Symbol::new(&env, "admin_changed"),),
            (admin, new_admin),
        );

        Ok(())
    }

    /// Extend the TTL of a binding to prevent archival.
    /// Anyone can call this to keep bindings active.
    ///
    /// # Arguments
    /// * `env` - The contract environment
    /// * `wallet` - The wallet address whose binding to extend
    pub fn extend_binding_ttl(env: Env, wallet: Address) -> Result<(), IdentityError> {
        let wallet_key = DataKey::WalletToId(wallet.clone());

        let unique_id: BytesN<32> = env
            .storage()
            .persistent()
            .get(&wallet_key)
            .ok_or(IdentityError::WalletNotBound)?;

        let id_key = DataKey::IdToWallet(unique_id);

        // Extend TTL for both mappings
        env.storage()
            .persistent()
            .extend_ttl(&id_key, 100 * 24 * 60 * 60, 100 * 24 * 60 * 60);
        env.storage()
            .persistent()
            .extend_ttl(&wallet_key, 100 * 24 * 60 * 60, 100 * 24 * 60 * 60);

        Ok(())
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

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, HaloIdentity);
        let client = HaloIdentityClient::new(&env, &contract_id);

        let admin = Address::generate(&env);

        client.initialize(&admin);

        assert_eq!(client.get_admin(), admin);
        assert_eq!(client.get_binding_count(), 0);
    }

    #[test]
    #[should_panic(expected = "Error(Contract, #1)")]
    fn test_initialize_twice_fails() {
        let env = Env::default();
        let contract_id = env.register_contract(None, HaloIdentity);
        let client = HaloIdentityClient::new(&env, &contract_id);

        let admin = Address::generate(&env);

        client.initialize(&admin);
        client.initialize(&admin); // Should panic
    }

    #[test]
    fn test_bind_wallet() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, HaloIdentity);
        let client = HaloIdentityClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let wallet = Address::generate(&env);
        let unique_id = create_unique_id(&env, 1);

        client.initialize(&admin);
        client.bind_wallet(&unique_id, &wallet);

        assert!(client.is_bound(&wallet));
        assert_eq!(client.get_id(&wallet), unique_id);
        assert_eq!(client.get_wallet(&unique_id), wallet);
        assert_eq!(client.get_binding_count(), 1);
    }

    #[test]
    #[should_panic(expected = "Error(Contract, #4)")]
    fn test_bind_same_id_twice_fails() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, HaloIdentity);
        let client = HaloIdentityClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let wallet1 = Address::generate(&env);
        let wallet2 = Address::generate(&env);
        let unique_id = create_unique_id(&env, 1);

        client.initialize(&admin);
        client.bind_wallet(&unique_id, &wallet1);
        client.bind_wallet(&unique_id, &wallet2); // Should panic
    }

    #[test]
    #[should_panic(expected = "Error(Contract, #5)")]
    fn test_bind_same_wallet_twice_fails() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, HaloIdentity);
        let client = HaloIdentityClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let wallet = Address::generate(&env);
        let unique_id1 = create_unique_id(&env, 1);
        let unique_id2 = create_unique_id(&env, 2);

        client.initialize(&admin);
        client.bind_wallet(&unique_id1, &wallet);
        client.bind_wallet(&unique_id2, &wallet); // Should panic
    }

    #[test]
    fn test_is_bound_returns_false_for_unbound() {
        let env = Env::default();
        let contract_id = env.register_contract(None, HaloIdentity);
        let client = HaloIdentityClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let wallet = Address::generate(&env);

        client.initialize(&admin);

        assert!(!client.is_bound(&wallet));
    }

    #[test]
    fn test_multiple_bindings() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, HaloIdentity);
        let client = HaloIdentityClient::new(&env, &contract_id);

        let admin = Address::generate(&env);

        client.initialize(&admin);

        for i in 0..5 {
            let wallet = Address::generate(&env);
            let unique_id = create_unique_id(&env, i);
            client.bind_wallet(&unique_id, &wallet);
        }

        assert_eq!(client.get_binding_count(), 5);
    }

    #[test]
    fn test_set_admin() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, HaloIdentity);
        let client = HaloIdentityClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let new_admin = Address::generate(&env);

        client.initialize(&admin);
        assert_eq!(client.get_admin(), admin);

        client.set_admin(&new_admin);
        assert_eq!(client.get_admin(), new_admin);
    }
}
