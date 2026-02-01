#!/bin/bash
# Halo Protocol - Development Environment Setup
# =============================================
#
# This script installs all required tools for Halo Protocol development:
# - Rust and Cargo
# - WASM target for compilation
# - Stellar CLI (soroban)
#
# Usage: ./scripts/setup.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  Halo Protocol Development Setup${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Check if Rust is installed
install_rust() {
    if command -v rustc &> /dev/null; then
        echo -e "${GREEN}Rust is already installed: $(rustc --version)${NC}"
    else
        echo -e "${YELLOW}Installing Rust...${NC}"
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source "$HOME/.cargo/env"
        echo -e "${GREEN}Rust installed: $(rustc --version)${NC}"
    fi
}

# Add WASM target
add_wasm_target() {
    echo -e "${YELLOW}Adding WASM target...${NC}"
    rustup target add wasm32-unknown-unknown
    echo -e "${GREEN}WASM target added.${NC}"
}

# Install Stellar CLI
install_stellar_cli() {
    if command -v stellar &> /dev/null; then
        echo -e "${GREEN}Stellar CLI is already installed: $(stellar --version)${NC}"
    else
        echo -e "${YELLOW}Installing Stellar CLI...${NC}"
        cargo install --locked stellar-cli
        echo -e "${GREEN}Stellar CLI installed: $(stellar --version)${NC}"
    fi
}

# Verify installation
verify_installation() {
    echo ""
    echo -e "${BLUE}======================================${NC}"
    echo -e "${BLUE}  Verifying Installation${NC}"
    echo -e "${BLUE}======================================${NC}"
    echo ""

    echo -e "Rust: ${GREEN}$(rustc --version 2>/dev/null || echo 'NOT INSTALLED')${NC}"
    echo -e "Cargo: ${GREEN}$(cargo --version 2>/dev/null || echo 'NOT INSTALLED')${NC}"
    echo -e "WASM Target: ${GREEN}$(rustup target list --installed | grep wasm32 || echo 'NOT INSTALLED')${NC}"
    echo -e "Stellar CLI: ${GREEN}$(stellar --version 2>/dev/null || echo 'NOT INSTALLED')${NC}"
}

# Main
main() {
    install_rust
    echo ""
    add_wasm_target
    echo ""
    install_stellar_cli
    verify_installation

    echo ""
    echo -e "${GREEN}======================================${NC}"
    echo -e "${GREEN}  Setup Complete!${NC}"
    echo -e "${GREEN}======================================${NC}"
    echo ""
    echo -e "Next steps:"
    echo -e "  1. Run ${YELLOW}source ~/.cargo/env${NC} (if this is a fresh install)"
    echo -e "  2. Build contracts: ${YELLOW}cd contracts && make build${NC}"
    echo -e "  3. Run tests: ${YELLOW}cd contracts && make test${NC}"
    echo ""
}

main
