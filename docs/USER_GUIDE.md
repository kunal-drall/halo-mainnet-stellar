# Halo Protocol — User Guide

## Getting Started

### 1. Sign Up
1. Visit [app.tryhalo.fun](https://app.tryhalo.fun)
2. Click **Sign in with Google**
3. Authorize with your Google account
4. You'll be redirected to the onboarding flow

### 2. Connect Your Wallet
1. Install the [Freighter Wallet](https://freighter.app) browser extension
2. Create or import a Stellar testnet wallet
3. On the wallet binding page, click **Connect Wallet**
4. Approve the connection in Freighter
5. Sign the identity binding transaction (this links your identity to your wallet on-chain)

### 3. Fund Your Wallet
For testnet, fund your wallet with test XLM:
1. Copy your wallet address from the app
2. Visit [Stellar Friendbot](https://friendbot.stellar.org?addr=YOUR_ADDRESS)
3. Your wallet will receive 10,000 test XLM

You'll also need test HUSD tokens for circle contributions. Contact the Halo team for test tokens.

---

## Creating a Circle

1. Navigate to **Circles** in the sidebar
2. Click **Create Circle**
3. Fill in the details:
   - **Circle Name**: A descriptive name (3-30 characters)
   - **Contribution Amount**: How much each member contributes per period ($10-$500)
   - **Number of Members**: Total members (3-10)
   - **Start Date**: When the circle begins (must be 3+ days in the future)
4. Click **Review & Create**
5. Sign the on-chain transaction in Freighter
6. Share the invite code with friends!

### Circle Rules
- You can be in up to 3 active circles at a time
- You need at least 1x the contribution amount as collateral in your wallet
- The circle starts automatically when all members have joined

---

## Joining a Circle

### By Invite Code
1. Go to **Circles > Join Circle**
2. Enter the invite code (e.g., `JOIN2026`)
3. Review the circle details (contribution amount, members, organizer)
4. Click **Join Circle**
5. Sign the on-chain transaction in Freighter

### From Discover Section
1. Go to **Circles**
2. Scroll to the **Discover Circles** section
3. Click on any open circle to view details
4. Click **Join Circle** to join

---

## Making Contributions

When a circle is active, you'll need to contribute each period:

1. Go to your circle page
2. Click **Contribute** for the current period
3. Sign the token transfer transaction in Freighter
4. Your contribution is recorded on-chain

### Timing
- **On-time**: Contribute before the period end date
- **Late**: Contribute after the period ends but within the grace period
- **Late with fee**: Contribute after the grace period (a percentage fee is applied)
- **Missed**: Failing to contribute affects your credit score

---

## Receiving Payouts

Each period, one member receives the pooled contributions:
- Members receive payouts in order of their payout position
- Payout amount = contribution amount × number of members
- Payouts are processed automatically when all members contribute
- The payout is transferred directly to your Stellar wallet

---

## Credit Score

Your Halo Credit Score (300-850) reflects your reliability in circles:

### Score Components
- **Payment History** (40%): On-time payment percentage
- **Circle Completion** (25%): Successfully completed circles
- **Volume** (15%): Total contribution volume
- **Tenure** (10%): How long you've been active
- **Attestation** (10%): Reserved for peer vouching (coming soon)

### Tiers
| Tier | Score Range |
|------|------------|
| Building | 300-499 |
| Fair | 500-649 |
| Good | 650-749 |
| Excellent | 750-850 |

### Improving Your Score
- Make contributions on time
- Complete full circle cycles
- Participate in multiple circles
- Stay active on the platform

---

## Gas-Free Transactions

Halo Protocol sponsors transaction fees for users! When you sign a transaction:
- The fee is paid by Halo's sponsor account
- You don't need to hold XLM for gas
- Up to 10 sponsored transactions per day

---

## FAQ

**Q: What happens if someone doesn't contribute?**
A: Their credit score is penalized. The circle continues, and they forfeit their contribution for that round.

**Q: Can I leave a circle?**
A: Once a circle is active, you cannot leave. You must complete all rounds.

**Q: Is my money safe?**
A: All funds are held in the smart contract on the Stellar blockchain. No single party controls the funds.

**Q: What if I lose access to my wallet?**
A: Your wallet is permanently linked to your identity. If you lose access, contact support for recovery options.

**Q: How is my identity protected?**
A: Your identity is represented by a hash (not personal data) stored on-chain. Only you can link your identity to your wallet.
