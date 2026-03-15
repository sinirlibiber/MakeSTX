# MakeSTX — Cyberpunk NFT Collection

10,000 unique cyberpunk NFTs on the Stacks blockchain. Free mint. Bitcoin-secured.

## Project Structure

```
MakeSTX/
├── contracts/
│   └── makestx-nft.clar       ← Clarity smart contract (SIP-009)
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── index.tsx       ← Homepage
│       │   ├── mint.tsx        ← Single mint
│       │   ├── explore.tsx     ← NFT gallery
│       │   ├── my-nfts.tsx     ← User's NFTs
│       │   ├── auto-mint.tsx   ← Auto-mint bot (browser)
│       │   └── multi-mint.tsx  ← Multi-wallet mint (browser)
│       ├── components/
│       │   ├── Navbar.tsx
│       │   └── NFTCard.tsx
│       └── hooks/
│           ├── useWallet.tsx
│           └── useContract.ts
├── auto-mint.js               ← Node.js multi-wallet mint script
└── Clarinet.toml
```

## Deploy Contract

1. Install [Clarinet](https://github.com/hirosystems/clarinet):
   ```bash
   brew install clarinet
   ```

2. Deploy to mainnet:
   ```bash
   clarinet deployments apply --mainnet
   ```

3. After deploy, update `CONTRACT_ADDRESS` in:
   - `frontend/.env.local`
   - `auto-mint.js` (CONFIG.contractAddress)

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your contract address
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_STACKS_NETWORK=mainnet
NEXT_PUBLIC_CONTRACT_ADDRESS=SP...your_address...
```

## Auto-Mint Script (Node.js)

```bash
npm install @stacks/transactions @stacks/wallet-sdk @stacks/network

# With seed phrase
MNEMONIC="word1 word2 ... word24" node auto-mint.js

# With private key
PRIVATE_KEY="0x..." STX_ADDRESS="SP..." node auto-mint.js
```

### How it works

1. Master wallet checks balance
2. Generates N new wallets (parallelWorkers)
3. Sends STX to each wallet
4. Waits 12s for confirmation
5. All wallets mint in parallel
6. Repeats until balance depleted

## Contract Features

- SIP-009 compliant
- Free mint (gas only ~0.002 STX)
- 10,000 max supply
- 5% on-chain royalties
- Mint pause/unpause (admin)
- Per-wallet mint tracking
- Built-in marketplace (list/unlist/buy)

## Tech Stack

- **Blockchain**: Stacks (Bitcoin L2)
- **Contract**: Clarity 2.0
- **Frontend**: Next.js 14 + TypeScript + Tailwind
- **Wallet**: Hiro Wallet / Xverse
