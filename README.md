# VAULTLESS — Prototype

Behavioural DNA Authentication with Ethereum-Rooted Identity & Anti-Coercion Protocol.

## Quick Start (Tonight)

```bash
# 1. Clone / copy this folder
cd vaultless

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env — set VITE_DEMO_MODE=true to run without Ethereum

# 4. Run dev server
npm run dev
```

Open http://localhost:5173

## Flows to Test

| URL | What It Does |
|-----|-------------|
| `/` | Landing page — particle animation, demo toggle |
| `/gmail` | Gmail lookalike — "Sign in with VAULTLESS" button |
| `/enroll` | Type "Secure my account" 3x — live EKG graph |
| `/auth` | Authenticate — see similarity score live |
| `/dashboard` | Fake Gmail inbox + VAULTLESS security panel |
| `/ghost` | Ghost session (loads on duress) |

## Demo Mode vs Live Mode

**Demo Mode** (`VITE_DEMO_MODE=true`): No MetaMask required. Simulates all Ethereum transactions with fake tx hashes. Similarity score is randomized to ~89-97%.

**Live Mode** (`VITE_DEMO_MODE=false`): Requires MetaMask on Sepolia testnet. You must deploy `VaultlessCore.sol` first and paste the address in `.env`.

## Deploying the Smart Contract

1. Open https://remix.ethereum.org
2. Create new file → paste contents of `src/contracts/VaultlessCore.sol`
3. Compile (Solidity 0.8.20)
4. Deploy to Injected Provider — Metamask (Sepolia)
5. Copy deployed address → paste in `.env` as `VITE_CONTRACT_ADDRESS`

## Testing Duress

In Auth page, type the phrase **very slowly and hesitantly** (add long pauses between keys). The stress detector watches for rhythm variance > 2x baseline. It will:
- Load `/ghost` silently
- Fire DuressActivated on-chain
- Send EmailJS alert (if configured)

## Project Structure

```
src/
  hooks/
    behaviouralEngine.js   ← All the DNA math
  lib/
    ethereum.js            ← Contract calls + demo stubs
    VaultlessContext.jsx   ← Global state
    duressAlert.js         ← EmailJS integration
  pages/
    Landing.jsx            ← /
    Gmail.jsx              ← /gmail
    Enroll.jsx             ← /enroll
    Auth.jsx               ← /auth
    Dashboard.jsx          ← /dashboard
    Ghost.jsx              ← /ghost
  contracts/
    VaultlessCore.sol      ← Deploy this on Remix
```

## Deploy to Vercel

```bash
npm run build
# Then drag the dist/ folder to vercel.com/new
# Or: npx vercel --prod
```

Add your `.env` variables in Vercel project settings.
