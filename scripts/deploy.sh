#!/bin/bash
# Halo Protocol - Contract Deployment Script
# ==========================================
#
# Usage: ./scripts/deploy.sh [network]
#   network: testnet (default) or mainnet
#
# Required environment variables:
#   ADMIN_SECRET - Secret key for admin account
#
# Optional environment variables:
#   SOROBAN_RPC_URL - RPC URL (defaults based on network)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NETWORK="${1:-testnet}"
CONTRACTS_DIR="$(dirname "$0")/../contracts"
OUTPUT_DIR="$(dirname "$0")/../.deployments"

# Set RPC URL based on network
if [ "$NETWORK" == "mainnet" ]; then
    SOROBAN_RPC_URL="${SOROBAN_RPC_URL:-https://soroban.stellar.org}"
    NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
else
    SOROBAN_RPC_URL="${SOROBAN_RPC_URL:-https://soroban-testnet.stellar.org}"
    NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
fi

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  Halo Protocol Contract Deployment${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo -e "Network: ${GREEN}$NETWORK${NC}"
echo -e "RPC URL: ${GREEN}$SOROBAN_RPC_URL${NC}"
echo ""

# Check for required tools
check_requirements() {
    echo -e "${YELLOW}Checking requirements...${NC}"

    if ! command -v stellar &> /dev/null; then
        echo -e "${RED}Error: stellar CLI not found. Please install it first.${NC}"
        echo "Visit: https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup"
        exit 1
    fi

    if [ -z "$ADMIN_SECRET" ]; then
        echo -e "${RED}Error: ADMIN_SECRET environment variable not set.${NC}"
        echo "Please set it with: export ADMIN_SECRET=S..."
        exit 1
    fi

    echo -e "${GREEN}All requirements met.${NC}"
    echo ""
}

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Get admin public key from secret
get_admin_address() {
    # First, try to add the key to stellar keys store with a name
    local key_name="halo-admin"
    
    # Remove existing key if present (ignore errors)
    stellar keys rm "$key_name" 2>/dev/null || true
    
    # Check if ADMIN_SECRET is a mnemonic (contains spaces) or a secret key (starts with S)
    if [[ "$ADMIN_SECRET" == S* ]] && [[ ! "$ADMIN_SECRET" == *" "* ]]; then
        # It's a secret key
        echo "$ADMIN_SECRET" | stellar keys add "$key_name" --secret-key 2>/dev/null
    else
        # It's a mnemonic phrase - generate key from it
        stellar keys generate "$key_name" --fund --network "$NETWORK" 2>/dev/null || \
        stellar keys generate "$key_name" --network "$NETWORK" 2>/dev/null || true
    fi
    
    # Get the address
    ADMIN_ADDRESS=$(stellar keys address "$key_name" 2>/dev/null || echo "")

    if [ -z "$ADMIN_ADDRESS" ]; then
        echo -e "${RED}Error: Could not derive admin address from secret.${NC}"
        echo -e "${YELLOW}Please provide a valid Stellar secret key (starts with 'S')${NC}"
        echo -e "${YELLOW}Example: export ADMIN_SECRET=SXXXX...${NC}"
        echo ""
        echo -e "${YELLOW}To generate a new key:${NC}"
        echo "  stellar keys generate my-key --network testnet"
        echo "  stellar keys show my-key"
        exit 1
    fi

    # Update ADMIN_SECRET to use the key name for subsequent commands
    ADMIN_KEY_NAME="$key_name"

    echo -e "Admin Address: ${GREEN}$ADMIN_ADDRESS${NC}"
    echo ""
}

# Build contracts if not already built
build_contracts() {
    echo -e "${YELLOW}Building contracts...${NC}"
    cd "$CONTRACTS_DIR"

    stellar contract build

    # Optimize WASM files (stellar contract build uses wasm32v1-none target)
    for wasm in target/wasm32v1-none/release/*.wasm; do
        if [ -f "$wasm" ]; then
            stellar contract optimize --wasm "$wasm" 2>/dev/null || true
        fi
    done

    cd - > /dev/null
    echo -e "${GREEN}Build complete.${NC}"
    echo ""
}

# Deploy a single contract
deploy_contract() {
    local name=$1
    local wasm_file=$2

    echo -e "${YELLOW}Deploying $name contract...${NC}" >&2

    local output
    output=$(stellar contract deploy \
        --wasm "$wasm_file" \
        --source "$ADMIN_KEY_NAME" \
        --network "$NETWORK" \
        --rpc-url "$SOROBAN_RPC_URL" \
        --network-passphrase "$NETWORK_PASSPHRASE" \
        2>&1)

    local exit_code=$?
    
    # Extract the contract ID (line starting with C and 56 chars)
    local contract_id
    contract_id=$(echo "$output" | grep -oE '^C[A-Z0-9]{55}$' | head -1)
    
    if [ $exit_code -eq 0 ] && [ -n "$contract_id" ]; then
        echo -e "${GREEN}$name deployed: $contract_id${NC}" >&2
        echo "$contract_id"
    else
        echo -e "${RED}Failed to deploy $name${NC}" >&2
        echo -e "${RED}Output: $output${NC}" >&2
        exit 1
    fi
}

# Initialize Identity contract
initialize_identity() {
    local contract_id=$1

    echo -e "${YELLOW}Initializing Identity contract...${NC}"

    stellar contract invoke \
        --id "$contract_id" \
        --source "$ADMIN_KEY_NAME" \
        --network "$NETWORK" \
        --rpc-url "$SOROBAN_RPC_URL" \
        --network-passphrase "$NETWORK_PASSPHRASE" \
        -- \
        initialize \
        --admin "$ADMIN_ADDRESS"

    echo -e "${GREEN}Identity contract initialized.${NC}"
}

# Initialize Credit contract
initialize_credit() {
    local contract_id=$1

    echo -e "${YELLOW}Initializing Credit contract...${NC}"

    stellar contract invoke \
        --id "$contract_id" \
        --source "$ADMIN_KEY_NAME" \
        --network "$NETWORK" \
        --rpc-url "$SOROBAN_RPC_URL" \
        --network-passphrase "$NETWORK_PASSPHRASE" \
        -- \
        initialize \
        --admin "$ADMIN_ADDRESS"

    echo -e "${GREEN}Credit contract initialized.${NC}"
}

# Initialize Circle contract
initialize_circle() {
    local contract_id=$1
    local identity_id=$2
    local credit_id=$3

    echo -e "${YELLOW}Initializing Circle contract...${NC}"

    stellar contract invoke \
        --id "$contract_id" \
        --source "$ADMIN_KEY_NAME" \
        --network "$NETWORK" \
        --rpc-url "$SOROBAN_RPC_URL" \
        --network-passphrase "$NETWORK_PASSPHRASE" \
        -- \
        initialize \
        --admin "$ADMIN_ADDRESS" \
        --identity_contract "$identity_id" \
        --credit_contract "$credit_id"

    echo -e "${GREEN}Circle contract initialized.${NC}"
}

# Authorize Circle contract in Credit contract
authorize_circle_in_credit() {
    local credit_id=$1
    local circle_id=$2

    echo -e "${YELLOW}Authorizing Circle contract in Credit contract...${NC}"

    stellar contract invoke \
        --id "$credit_id" \
        --source "$ADMIN_KEY_NAME" \
        --network "$NETWORK" \
        --rpc-url "$SOROBAN_RPC_URL" \
        --network-passphrase "$NETWORK_PASSPHRASE" \
        -- \
        authorize_contract \
        --contract "$circle_id"

    echo -e "${GREEN}Circle contract authorized.${NC}"
}

# Save deployment info
save_deployment() {
    local identity_id=$1
    local credit_id=$2
    local circle_id=$3

    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local output_file="$OUTPUT_DIR/$NETWORK.json"

    cat > "$output_file" << EOF
{
  "network": "$NETWORK",
  "rpcUrl": "$SOROBAN_RPC_URL",
  "deployedAt": "$timestamp",
  "admin": "$ADMIN_ADDRESS",
  "contracts": {
    "identity": "$identity_id",
    "credit": "$credit_id",
    "circle": "$circle_id"
  }
}
EOF

    echo -e "${GREEN}Deployment info saved to: $output_file${NC}"
}

# Main deployment flow
main() {
    check_requirements
    get_admin_address
    build_contracts

    echo -e "${BLUE}======================================${NC}"
    echo -e "${BLUE}  Deploying Contracts${NC}"
    echo -e "${BLUE}======================================${NC}"
    echo ""

    # Deploy Identity Contract
    IDENTITY_ID=$(deploy_contract "Identity" "$CONTRACTS_DIR/target/wasm32v1-none/release/halo_identity.wasm")
    echo ""

    # Deploy Credit Contract
    CREDIT_ID=$(deploy_contract "Credit" "$CONTRACTS_DIR/target/wasm32v1-none/release/halo_credit.wasm")
    echo ""

    # Deploy Circle Contract
    CIRCLE_ID=$(deploy_contract "Circle" "$CONTRACTS_DIR/target/wasm32v1-none/release/halo_circle.wasm")
    echo ""

    echo -e "${BLUE}======================================${NC}"
    echo -e "${BLUE}  Initializing Contracts${NC}"
    echo -e "${BLUE}======================================${NC}"
    echo ""

    # Initialize contracts
    initialize_identity "$IDENTITY_ID"
    echo ""

    initialize_credit "$CREDIT_ID"
    echo ""

    initialize_circle "$CIRCLE_ID" "$IDENTITY_ID" "$CREDIT_ID"
    echo ""

    # Authorize Circle in Credit
    authorize_circle_in_credit "$CREDIT_ID" "$CIRCLE_ID"
    echo ""

    # Save deployment info
    save_deployment "$IDENTITY_ID" "$CREDIT_ID" "$CIRCLE_ID"

    echo ""
    echo -e "${BLUE}======================================${NC}"
    echo -e "${GREEN}  Deployment Complete!${NC}"
    echo -e "${BLUE}======================================${NC}"
    echo ""
    echo -e "Identity Contract: ${GREEN}$IDENTITY_ID${NC}"
    echo -e "Credit Contract:   ${GREEN}$CREDIT_ID${NC}"
    echo -e "Circle Contract:   ${GREEN}$CIRCLE_ID${NC}"
    echo ""
    echo -e "Admin Address:     ${GREEN}$ADMIN_ADDRESS${NC}"
    echo ""
}

main
