# VAULTLESS — Shared Team Context
# Update this file immediately whenever anything changes.
# Paste the latest version of this into every new Claude conversation.

CONTRACT_ADDRESS : 0x[Teammate A fills after Remix deploy]
NETWORK          : Ethereum Sepolia Testnet (chainId: 11155111)
RPC              : https://eth-sepolia.g.alchemy.com/v2/${VITE_ALCHEMY_KEY}
ETHERSCAN        : https://sepolia.etherscan.io

ENROLLMENT_PHRASE: "Secure my account"

THRESHOLDS:
  Authenticated  : score > 0.85
  Duress zone    : score 0.55 – 0.85
  Rejected       : score < 0.55
  Stress trigger : liveRhythmVariance > enrollmentRhythmVariance × 2

VECTOR           : Float32Array[64]
  [0–19]    hold times per key (weighted 3x in similarity)
  [20–39]   flight times per key (weighted 2x in similarity)
  [40–45]   avgHold, stdHold, avgFlight, stdFlight, totalDuration, rhythmVariance
  [46–50]   avgVelocity, velocityVariance, avgAcceleration, directionChanges, clickHoldDuration
  [51–63]   zero-padded

DEMO_MODE        : true  ← change to false after contract deployed

STATUS:
  [ ] Contract deployed on Sepolia
  [ ] Enroll flow working end-to-end
  [ ] Auth flow working end-to-end
  [ ] Duress flow working end-to-end
  [ ] Vercel URL live

LAST UPDATED: [name] at [time]

---

## TUNING GUIDE

If scores are too similar between two people:
- Increase hold time weight from 3x to 4x in cosineSimilarity() (behaviouralEngine.js line ~110)
- Add more mouse dynamics weight (increase multipliers on vec[46-50])
- Lower duress threshold to 0.75 temporarily in Auth.jsx

If enrollment keeps failing:
- Check MetaMask is on Sepolia network (chainId: 11155111)
- Check VITE_CONTRACT_ADDRESS is set correctly in .env
- Check wallet has Sepolia ETH from sepoliafaucet.com

If duress triggers too easily:
- Raise THRESHOLDS.DURESS_LOW from 0.55 to 0.65 in Auth.jsx
- The stress variance multiplier (×2) can be raised to ×3 in behaviouralEngine.js stressDetector()

## KEY FILES

src/hooks/behaviouralEngine.js   — DNA engine, cosine similarity, stress detection
src/lib/ethereum.js              — All contract calls, demo stubs
src/lib/VaultlessContext.jsx     — Global state, localStorage persistence
src/lib/duressAlert.js           — EmailJS duress alert
src/pages/Enroll.jsx             — 3-sample enrollment flow
src/pages/Auth.jsx               — Live scoring, ring animation, duress routing
src/pages/Dashboard.jsx          — Gmail inbox + VAULTLESS panel
src/pages/Ghost.jsx              — Identical ghost session (imports Dashboard)
src/contracts/VaultlessCore.sol  — Deploy this on Remix to Sepolia
