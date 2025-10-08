# 🌟 NFT-Powered Anti-Corruption Campaign Funding

Welcome to a revolutionary Web3 platform that combats corruption through transparent, blockchain-based funding! This project uses NFTs to raise funds for anti-corruption initiatives, ensuring donations are traceable, campaigns are verifiable, and supporters have a voice in fund allocation. Built on the Stacks blockchain with Clarity smart contracts, it solves real-world problems like opaque charitable giving, corruption in aid distribution, and lack of accountability in activism.

## ✨ Features

💰 Mint NFTs to donate and fund campaigns transparently  
🗳️ NFT holders vote on fund releases and campaign priorities  
🔒 Anonymous whistleblower submissions with reward mechanisms  
📊 Immutable tracking of fund usage and impact reports  
✅ Campaign verification to prevent fraud  
🚫 Anti-sybil measures for fair voting  
🌍 Global accessibility for supporters and activists  
🔄 Automated payouts to verified campaigns based on milestones  

## 🛠 How It Works

This platform involves 8 interconnected Clarity smart contracts to handle various aspects securely and efficiently. Here's a high-level overview:

### Core Smart Contracts
1. **NFT-Minter.clar**: Handles minting of unique NFTs representing support levels (e.g., bronze, silver, gold tiers). Each mint transfers STX (Stacks tokens) to the funding pool.
2. **Campaign-Registry.clar**: Allows activists to register anti-corruption campaigns with details like goals, milestones, and verification proofs. Prevents duplicates and stores metadata.
3. **Funding-Pool.clar**: A treasury contract that collects donations from NFT mints and holds funds in escrow until voted releases.
4. **Governance-Voting.clar**: Enables NFT holders to propose and vote on fund distributions, campaign approvals, or platform upgrades using quadratic voting for fairness.
5. **Whistleblower-Submission.clar**: Supports anonymous tip submissions hashed on-chain; integrates with zero-knowledge proofs for privacy.
6. **Reward-Distribution.clar**: Automates bounty payouts to whistleblowers upon verification, drawing from a dedicated reward pool.
7. **Verification-Oracle.clar**: Interfaces with off-chain oracles or multi-sig verifiers to confirm campaign progress and whistleblower claims before releasing funds.
8. **Anti-Sybil-Token.clar**: Issues soulbound tokens or uses proof-of-humanity to prevent multiple accounts from gaming votes or rewards.

### For Supporters (Donors)
- Choose a campaign and mint an NFT via `NFT-Minter.clar` by calling `mint-nft` with your donation amount, campaign ID, and tier.
- Your funds go directly to `Funding-Pool.clar`—no middlemen!
- Use your NFT to participate in votes through `Governance-Voting.clar` by calling `cast-vote` on proposals like "Release 50% funds to Campaign X upon milestone."

Boom! You've funded change and earned governance rights.

### For Activists (Campaign Organizers)
- Register your campaign using `Campaign-Registry.clar` with `register-campaign`, providing a title, description, goals, and initial proof (e.g., hashed documents).
- Submit progress updates to `Verification-Oracle.clar` for verification.
- Once verified, funds are auto-released via `Funding-Pool.clar`'s `release-funds` function after community votes.

Transparency at every step—track everything on-chain!

### For Whistleblowers
- Anonymously submit tips hashed via `Whistleblower-Submission.clar` using `submit-tip`.
- If verified by oracles in `Verification-Oracle.clar`, claim rewards from `Reward-Distribution.clar` with `claim-reward`.

Safe, secure, and incentivized reporting.

### For Verifiers/Community
- Query any contract for details, e.g., `get-campaign-info` in `Campaign-Registry.clar` or `get-vote-results` in `Governance-Voting.clar`.
- Use `verify-claim` in `Verification-Oracle.clar` to confirm facts without revealing identities.

This setup ensures corruption can't hide—everything is auditable on the blockchain. Get started by deploying these contracts on Stacks and building a frontend dApp for easy interaction!