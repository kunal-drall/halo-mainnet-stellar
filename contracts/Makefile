# Halo Protocol Smart Contracts - Makefile
# ==========================================

# Configuration
NETWORK ?= testnet
SOROBAN_RPC_URL ?= https://soroban-testnet.stellar.org

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

.PHONY: all build test clean deploy fmt check

# Default target
all: build

# Build all contracts
build:
	@echo "$(GREEN)Building all contracts...$(NC)"
	stellar contract build
	@echo "$(GREEN)Optimizing WASM files...$(NC)"
	@for wasm in target/wasm32-unknown-unknown/release/*.wasm; do \
		if [ -f "$$wasm" ]; then \
			stellar contract optimize --wasm "$$wasm"; \
		fi \
	done
	@echo "$(GREEN)Build complete!$(NC)"

# Build individual contracts
build-identity:
	@echo "$(GREEN)Building Identity contract...$(NC)"
	cd identity && stellar contract build

build-credit:
	@echo "$(GREEN)Building Credit contract...$(NC)"
	cd credit && stellar contract build

build-circle:
	@echo "$(GREEN)Building Circle contract...$(NC)"
	cd circle && stellar contract build

# Run tests
test:
	@echo "$(GREEN)Running tests for all contracts...$(NC)"
	cargo test

test-identity:
	@echo "$(GREEN)Running Identity contract tests...$(NC)"
	cd identity && cargo test

test-credit:
	@echo "$(GREEN)Running Credit contract tests...$(NC)"
	cd credit && cargo test

test-circle:
	@echo "$(GREEN)Running Circle contract tests...$(NC)"
	cd circle && cargo test

# Format code
fmt:
	@echo "$(GREEN)Formatting code...$(NC)"
	cargo fmt --all

# Check code
check:
	@echo "$(GREEN)Checking code...$(NC)"
	cargo check --all-targets
	cargo clippy --all-targets

# Clean build artifacts
clean:
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	cargo clean
	rm -rf target/

# Deploy to testnet (requires ADMIN_SECRET env var)
deploy: build
	@echo "$(GREEN)Deploying contracts to $(NETWORK)...$(NC)"
	./scripts/deploy.sh $(NETWORK)

# Generate contract bindings
bindings:
	@echo "$(GREEN)Generating TypeScript bindings...$(NC)"
	stellar contract bindings typescript \
		--wasm target/wasm32-unknown-unknown/release/halo_identity.wasm \
		--output-dir ../app/src/lib/contracts/identity \
		--contract-id placeholder
	stellar contract bindings typescript \
		--wasm target/wasm32-unknown-unknown/release/halo_credit.wasm \
		--output-dir ../app/src/lib/contracts/credit \
		--contract-id placeholder
	stellar contract bindings typescript \
		--wasm target/wasm32-unknown-unknown/release/halo_circle.wasm \
		--output-dir ../app/src/lib/contracts/circle \
		--contract-id placeholder

# Show help
help:
	@echo "Halo Protocol Smart Contracts"
	@echo "=============================="
	@echo ""
	@echo "Available targets:"
	@echo "  build          - Build all contracts"
	@echo "  build-identity - Build Identity contract only"
	@echo "  build-credit   - Build Credit contract only"
	@echo "  build-circle   - Build Circle contract only"
	@echo "  test           - Run all tests"
	@echo "  test-identity  - Run Identity contract tests"
	@echo "  test-credit    - Run Credit contract tests"
	@echo "  test-circle    - Run Circle contract tests"
	@echo "  fmt            - Format all code"
	@echo "  check          - Run cargo check and clippy"
	@echo "  clean          - Clean build artifacts"
	@echo "  deploy         - Deploy to testnet (requires ADMIN_SECRET)"
	@echo "  bindings       - Generate TypeScript bindings"
	@echo ""
	@echo "Environment variables:"
	@echo "  NETWORK        - Target network (default: testnet)"
	@echo "  ADMIN_SECRET   - Admin account secret key (for deployment)"
