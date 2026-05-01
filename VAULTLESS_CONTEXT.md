# VAULTLESS V2 — Full Build Context
# For AI-assisted development (Cursor / Claude / Copilot)
# Drop this file at the root of the repo and reference it in every AI session.

---

## Project overview

VAULTLESS is a passwordless authentication system that uses Gesture DNA, the unique
micro-dynamics of how a person types, as the only credential. It is built as a
Chrome extension prototype demonstrating how behavioral biometrics can protect a
Solana wallet.

The protected resource is a simulated Solana wallet dashboard built inside the
extension. The only way in is typing the enrollment phrase in your natural rhythm.
Wrong person produces a wrong cryptographic key and access is denied.

This is presented as a new method of securing systems and authentication. The wallet
dashboard is the demo vehicle, not the end product. The technology can be applied
to any login system.

---

## Team roles — strict ownership, no overlap

### Chetan (You) — Crypto + Engine
Owns everything that is pure computation and cryptography.
No UI work. No Solana client calls. No React.

Files owned by Chetan:
  src/engine/behaviouralEngine.ts      keystroke and mouse capture + scoring
  src/crypto/fuzzyExtractor.ts         Gen() and Rep() fuzzy extractor
  src/crypto/aesVault.ts               AES-256-GCM encrypt and decrypt
  src/crypto/authFlow.ts               orchestrates full auth logic, returns result
  src/crypto/demoFlow.ts               same interface as authFlow but simulated
  src/crypto/demoProfile.ts            hardcoded pre-computed enrollment constants
  src/store/enrollmentStore.ts         chrome.storage read/write for enrollment data
  src/crypto/duressAlert.ts            EmailJS alert on duress trigger

### Vijeta — UI + Blockchain + Extension Shell
Owns everything visual, everything Solana-facing, and the extension plumbing.
No crypto math. No fuzzy extractor logic. Calls Chetan's functions as black boxes.

Files owned by Vijeta:
  manifest.json                        Chrome MV3 extension config
  src/background.ts                    service worker, ephemeral session state
  src/content_script.ts                badge injection on password fields
  src/solana/solana.ts                 Anchor program client, all web3.js calls
  src/popup/pages/Landing.tsx          connect Phantom or try demo
  src/popup/pages/Enroll.tsx           10-sample enrollment UI
  src/popup/pages/Auth.tsx             score ring, result states
  src/popup/pages/Dashboard.tsx        real wallet: balance, tokens, events
  src/popup/pages/Ghost.tsx            identical layout, hardcoded fake data
  src/popup/App.tsx                    routing between pages
  src/popup/main.tsx                   entry point
  src/popup/index.html                 popup HTML shell

Anchor program (Rust) — pre-written, just deploy:
  anchor/programs/vaultless-core/src/lib.rs    already complete, do not modify
  anchor/tests/vaultless.test.ts               already complete
  Vijeta runs: anchor build && anchor deploy --provider.cluster devnet
  Copy program ID into both .env files after deploy.

---

## Integration points (the only times both people touch the same thing)

Day 4 — Enroll integration:
  Chetan exports: KeystrokeDNA, averageSamples, buildCombinedVector, fuzzyGen,
  aesEncrypt, saveEnrollment from their respective files.
  Vijeta wires these into Enroll.tsx. She calls them as black box async functions.

Day 6 — Auth integration:
  Chetan exports: runAuth(vector, wallet) -> AuthResult from authFlow.ts.
  Vijeta calls runAuth() in Auth.tsx after capturing one sample.
  On result: she calls authenticateUser() or triggerDuress() from solana.ts.
  She passes AuthResult to the score ring as props.

Interface contract between Chetan and Vijeta:

  // Chetan exports this from authFlow.ts — Vijeta calls it
  export async function runAuth(
    vector: Float32Array,
    walletPubkey: Uint8Array   // wallet.publicKey.toBytes()
  ): Promise<AuthResult>

  export interface AuthResult {
    success: boolean
    classification: "authenticated" | "duress" | "rejected"
    score: number               // 0.0 to 1.0, for score ring
    nullifier: Uint8Array       // pass to authenticateUser() if authenticated
    key: Uint8Array             // 256-bit key R, only present if success=true
    error?: string
  }

  // Chetan exports this from demoFlow.ts — same interface, Vijeta calls same way
  export async function runDemoAuth(
    vector: Float32Array
  ): Promise<AuthResult>

  // Chetan exports this for enrollment — Vijeta calls after 10 samples
  export async function runEnroll(
    samples: Float32Array[]     // 10 samples collected by Enroll.tsx
  ): Promise<EnrollResult>

  export interface EnrollResult {
    success: boolean
    helperData: Uint8Array      // pass to registerUser() in solana.ts
    commitment: Uint8Array      // pass to registerUser() in solana.ts
    error?: string
  }

---

## How authentication works — full technical flow

### Enrollment (one time per device)
1. Vijeta's Enroll.tsx captures 10 typing samples using KeystrokeDNA and MouseDNA
2. On 10th sample: calls Chetan's runEnroll(samples)
3. Inside runEnroll():
   - averageSamples() produces stable Float32[64] vector
   - quantize() converts to 64-bit binary string w
   - computeSyndrome(w) produces BCH helper data P (safe to store publicly)
   - HKDF-SHA256(w) produces 256-bit key R (never stored)
   - SHA256(R) produces commitment C
   - AES-256-GCM encrypts "Wallet unlocked. Welcome." with R -> ciphertext
   - saveEnrollment(sketch P, commitment C, ciphertext) to chrome.storage.local
4. runEnroll() returns {helperData, commitment}
5. Vijeta calls registerUser(wallet, helperData, commitment) from solana.ts
6. registerUser() sends tx to Solana devnet -> Identity PDA created
7. Vijeta shows Explorer link in popup

### Authentication (every session)
1. Vijeta's Auth.tsx captures one typing sample using KeystrokeDNA and MouseDNA
2. Calls Chetan's runAuth(vector, wallet.publicKey.toBytes())
3. Inside runAuth():
   - loadEnrollment() fetches sketch P, commitment C, ciphertext from chrome.storage
   - fuzzyRep(vector, P) -> error-corrected bit string -> HKDF -> reconstructed key R'
   - verifyKey(R', C): SHA256(R') == C? If no -> rejected
   - aesDecrypt(R', ciphertext): if throws -> rejected
   - generateNullifier(C, pubkeyBytes, Date.now()) -> nullifier
   - scoreAuth() produces score 0.0 to 1.0 and classification
   - detectStress(): live variance > enrolled variance * 2.5 -> isStress
4. runAuth() returns AuthResult to Vijeta
5. Vijeta animates score ring to result.score
6. On authenticated: calls authenticateUser(wallet, nullifier) from solana.ts
   On duress: calls triggerDuress(wallet) then sendDuressEmail()
   On rejected: calls recordAuthFailed(wallet)
7. On authenticated: Dashboard.tsx renders with real wallet data
   On duress: Ghost.tsx renders with fake wallet data
   On rejected: rejection screen shown

### New device flow
1. User opens extension on new device, connects Phantom (same pubkey)
2. Enroll.tsx detects no local enrollment data (chrome.storage empty)
3. fetchIdentity(pubkey) from solana.ts checks if Identity PDA exists on chain
4. If PDA exists: fetch secure_sketch field from it
5. saveEnrollment(sketch, commitment, null) locally — no ciphertext yet
6. Run Auth flow — fuzzyRep() works because sketch is on chain
7. On success: re-encrypt secret with reconstructed key, save ciphertext locally

---

## Float32Array[64] vector layout

Index 0-19:    hold times per key, normalised 0-1, padded to 20 values
Index 20-39:   flight times per key, normalised 0-1, padded to 20 values
Index 40-49:   z-score hold times, first 10 values
Index 50-59:   z-score flight times, first 10 values
Index 60:      total typing duration normalised (divided by 30000)
Index 61:      rhythm variance normalised (divided by 10000)
Index 62:      gyroscope magnitude average (0 on desktop)
Index 63:      accelerometer magnitude average (0 on desktop)

---

## Scoring weights (inside behaviouralEngine.ts, owned by Chetan)

Hold shape    Pearson correlation on holdTimesZ        weight 0.40
Hold mag      ratio similarity on raw holdTimes         weight 0.25
Flight shape  Pearson correlation on flightTimesZ       weight 0.25
Duration      min/max of total typing duration          weight 0.10
Mouse blend   if mouse data enrolled: score * 0.85 + mouseScore * 0.15

Classification:
  score >= 0.70                           authenticated
  score 0.60 to 0.70 AND stress=true      duress
  score < 0.60 OR (0.60-0.70, no stress)  rejected

Stress detection: live.variance > enrolled.variance * 2.5

---

## Solana program — VaultlessCore (pre-written Anchor/Rust)

Program already written in anchor/programs/vaultless-core/src/lib.rs.
Vijeta deploys it. Neither person modifies lib.rs.

### Account structures

Identity PDA   seeds [b"identity", user_pubkey]   space 210 bytes
  owner:          Pubkey        the wallet that enrolled
  secure_sketch:  [u8; 128]     BCH syndrome, safe to store publicly on chain
  commitment:     [u8; 32]      SHA256(key R), used for verification
  enrolled_at:    i64           unix timestamp
  is_duress:      bool          set true by trigger_duress, blocks future auth
  exists:         bool          registration guard

NullifierAccount PDA   seeds [b"nullifier", nullifier_bytes]   space 48 bytes
  owner:      Pubkey
  burned_at:  i64
  Account existence = nullifier used. Replay attack blocked by init failing.

DuressLog PDA   seeds [b"duress", user_pubkey]   space 49 bytes
  owner:          Pubkey
  triggered_at:   i64
  ghost_session:  bool

### Instructions (Vijeta calls these via solana.ts)

register(secure_sketch: Vec<u8>, commitment: [u8;32])
  Inits Identity PDA. Fails if already registered. Emits Registered.

authenticate(nullifier: [u8;32])
  Requires Identity exists and is_duress=false.
  Inits Nullifier PDA (init fails if exists = replay blocked).
  Emits AuthSuccess.

trigger_duress()
  Inits DuressLog PDA. Sets is_duress=true on Identity. Emits DuressActivated.

auth_failed()
  Emits AuthFailed. No state change.

refine(new_sketch: Vec<u8>, new_commitment: [u8;32])
  Updates sketch + commitment. Resets is_duress=false. Emits Refined.

### Errors
AlreadyRegistered   register called twice
NotRegistered       auth before enroll
AccountInDuress     authenticate blocked because is_duress=true
SketchTooLarge      sketch over 128 bytes

### Events emitted (visible on Solana Explorer)
Registered       { user: Pubkey, timestamp: i64 }
AuthSuccess      { user: Pubkey, nullifier: [u8;32], timestamp: i64 }
AuthFailed       { user: Pubkey, timestamp: i64 }
DuressActivated  { user: Pubkey, timestamp: i64 }
Refined          { user: Pubkey, timestamp: i64 }

---

## Solana client (src/solana/solana.ts) — owned by Vijeta

All functions return { sig: string, explorerUrl: string }

registerUser(wallet: anchor.Wallet, secureSketch: Uint8Array, commitment: Uint8Array)
authenticateUser(wallet: anchor.Wallet, nullifier: Uint8Array)
triggerDuress(wallet: anchor.Wallet)
recordAuthFailed(wallet: anchor.Wallet)
refineEnrollment(wallet: anchor.Wallet, newSketch: Uint8Array, newCommitment: Uint8Array)
fetchIdentity(userPubkey: PublicKey): Promise<Identity | null>
getIdentityPda(userPubkey: PublicKey): PublicKey
getNullifierPda(nullifier: Uint8Array): PublicKey
getDuressLogPda(userPubkey: PublicKey): PublicKey
explorerUrl(sig: string): string   returns Solana Explorer URL for devnet

Uses @coral-xyz/anchor and @solana/web3.js. Loads IDL from target/idl/vaultless_core.json.
Program ID comes from VITE_PROGRAM_ID environment variable.

---

## Chrome extension architecture (Manifest V3) — owned by Vijeta

manifest.json:
  manifest_version: 3
  permissions: storage, activeTab, tabs
  host_permissions: <all_urls>
  background: service_worker background.js
  content_scripts: content_script.js runs on all URLs at document_idle
  action: default_popup popup/index.html

background.ts — module-level variables (memory only, never persisted):
  sessionKey: Uint8Array | null     key R, cleared on browser close
  sessionWallet: string | null
  isDuress: boolean

Message types handled by background.ts:
  OPEN_AUTH      content_script -> background: badge clicked, open popup
  SET_SESSION    popup -> background: store key R after successful Rep()
  GET_SESSION    popup -> background: is session active?
  CLEAR_SESSION  popup -> background: logout, clear key from memory
  NOTIFY_TABS    background -> all tabs: AUTH_SUCCESS or AUTH_REJECTED

content_script.ts:
  MutationObserver watches for input[type=password] on any page.
  Injects VAULTLESS teal badge button next to each password field.
  On badge click: sendMessage OPEN_AUTH to background.
  Listens for AUTH_SUCCESS -> turns badge green with checkmark.
  Listens for AUTH_REJECTED -> turns badge red with X.

Key R lifecycle (critical security requirement):
  Generated inside popup by fuzzyRep() in Chetan's authFlow.ts.
  Passed to background via SET_SESSION as plain number array.
  Stored only as module-level Uint8Array in background service worker.
  NEVER written to chrome.storage, localStorage, IndexedDB, cookies, or disk.
  Cleared automatically when browser closes or extension is disabled.

---

## Two-mode system

### Realtime Mode
  User connects Phantom wallet.
  Real enrollment stored on Solana devnet Identity PDA.
  Real Anchor transactions on every auth event.
  Real Solana Explorer links shown in popup.
  Real wallet data in Dashboard: live SOL balance, SPL tokens, event timeline.

### Demo Mode
  No Phantom required. Anyone can try it instantly.
  Pre-seeded enrollment from demoProfile.ts constants.
  Biometric scoring still runs for real on actual user input.
  Solana txs are simulated: fake 88-char base58 signatures, fake Explorer URLs.
  1.5 second artificial delay to simulate tx confirmation.
  Dashboard shows hardcoded wallet data.

Demo wallet hardcoded data:
  Balance: 4.20 SOL
  Tokens: USDC 100.00, RAY 12.5, BONK 1000000
  Events: 3 VAULTLESS events with fake hashes and real timestamps

demoProfile.ts (owned by Chetan):
  DEMO_HELPER_DATA: Uint8Array    pre-computed BCH syndrome
  DEMO_COMMITMENT: number[]       pre-computed SHA256(key R)
  DEMO_CIPHERTEXT: string         pre-computed AES-GCM encrypted secret
  These are derived from a hardcoded Float32[64] enrollment vector.
  Chetan computes these once by running fuzzyGen() with a fixed input.

---

## Wallet dashboard — inside the extension popup

Dashboard.tsx shows (Realtime Mode):
  SOL balance via connection.getBalance(pubkey)
  SPL token list via connection.getTokenAccountsByOwner()
  VAULTLESS event timeline: filter getSignaturesForAddress() for program ID,
    label each tx as Enrolled, Authenticated, or Duress Activated
  Solana Explorer deep link per event
  Wallet address (truncated) with copy button
  Logout button that sends CLEAR_SESSION to background

Ghost.tsx (Duress Mode):
  Pixel-identical layout to Dashboard.tsx
  All data hardcoded:
    Balance: 2.40 SOL
    Tokens: USDC 50.00, RAY 6.25
    Txs: 5 fake entries with realistic timestamps and base58 hashes
  JWT or session flag ghost=true triggers this route

---

## Duress protocol — complete flow

1. scoreAuth() returns score 0.60-0.70 AND detectStress() returns true
2. Chetan's authFlow.ts returns classification: "duress"
3. Vijeta's Auth.tsx receives result — shows identical "Access Granted" UI
   (attacker watching sees nothing unusual)
4. Vijeta calls triggerDuress(wallet) from solana.ts
   -> DuressLog PDA created on chain with timestamp (immutable proof)
   -> is_duress=true set on Identity PDA (blocks future real auths)
5. Chetan's sendDuressEmail() fires via EmailJS
   -> email to recovery address contains: wallet pubkey, timestamp, Explorer link
6. Ghost.tsx renders fake wallet dashboard
7. Real wallet untouched

---

## Fuzzy extractor — technical detail (Chetan's code)

Based on: Dodis, Reyzin, Smith. "Fuzzy Extractors: How to Generate Strong Keys
from Biometrics and Other Noisy Data." EUROCRYPT 2004.

quantize(vector: Float32Array) -> string
  For each of 64 dimensions: 1 if value >= median of vector, else 0.
  Output: 64-character binary string. This is w.

computeSyndrome(bits: string) -> Uint8Array
  XOR-based BCH parity across 8-bit blocks (positional + interleaved).
  Output: 16-byte helper data P. Safe to store on chain.
  Tolerates up to 8 bit-flips in the 64-bit string.

correctBits(noisyBits: string, syndrome: Uint8Array) -> string
  Computes expected syndrome from noisy bits.
  XORs with stored syndrome to find error positions.
  Flips error bits to recover original w.

hkdf(bits: string) -> Promise<Uint8Array>
  Web Crypto API HKDF-SHA256.
  Salt: "VAULTLESS-v1", Info: "gesture-dna-key".
  Output: 256-bit key R.

Why noise tolerance works:
  Z-score normalisation in behaviouralEngine removes absolute speed.
  Quantization to bits produces a consistent 64-bit string for same person.
  Natural session-to-session variation causes ~5-10 bit flips out of 64.
  BCH correction handles up to 8 flips -> same w -> same R every time.
  Different person's rhythm produces ~25-35 bit flips -> outside tolerance -> wrong R.

---

## AES vault — technical detail (Chetan's code)

aesEncrypt(key: Uint8Array, plaintext: string) -> Promise<string>
  Generates random 12-byte IV.
  Web Crypto AES-GCM encrypt.
  Returns base64(iv + ciphertext).
  Stored in chrome.storage.local under key "vaultless_secret_{pubkey}".

aesDecrypt(key: Uint8Array, encoded: string) -> Promise<string>
  Decodes base64, splits IV and ciphertext.
  Web Crypto AES-GCM decrypt.
  Throws DOMException if key is wrong.
  This throw is the cryptographic auth gate — wrong person = exception = blocked.

---

## Environment variables

Extension (extension/.env):
  VITE_PROGRAM_ID              deployed Anchor program ID (fill after anchor deploy)
  VITE_DEMO_MODE               false
  VITE_EMAILJS_SERVICE_ID      from emailjs.com dashboard
  VITE_EMAILJS_TEMPLATE_ID     from emailjs.com dashboard
  VITE_EMAILJS_PUBLIC_KEY      from emailjs.com dashboard
  VITE_ALERT_EMAIL             fallback recovery email address
  VITE_SOLANA_NETWORK          devnet

---

## Complete folder structure

VAULTLESS/
  anchor/
    Anchor.toml
    Cargo.toml
    programs/
      vaultless-core/
        src/
          lib.rs                     ALREADY WRITTEN — do not modify
    tests/
      vaultless.test.ts              ALREADY WRITTEN — run to verify deploy

  extension/
    manifest.json                    Vijeta
    vite.config.ts                   Vijeta
    .env
    public/
      icons/
        icon16.png
        icon48.png
        icon128.png
    src/
      background.ts                  Vijeta
      content_script.ts              Vijeta

      engine/
        behaviouralEngine.ts         CHETAN — Day 1

      crypto/
        fuzzyExtractor.ts            CHETAN — Day 2
        aesVault.ts                  CHETAN — Day 3
        authFlow.ts                  CHETAN — Day 5
        demoFlow.ts                  CHETAN — Day 7
        demoProfile.ts               CHETAN — Day 7
        duressAlert.ts               CHETAN — Day 5

      store/
        enrollmentStore.ts           CHETAN — Day 3

      solana/
        solana.ts                    VIJETA — Day 2

      popup/
        index.html                   Vijeta
        main.tsx                     Vijeta
        App.tsx                      Vijeta
        pages/
          Landing.tsx                VIJETA — Day 1
          Enroll.tsx                 VIJETA — Day 3
          Auth.tsx                   VIJETA — Day 5
          Dashboard.tsx              VIJETA — Day 6
          Ghost.tsx                  VIJETA — Day 6

---

## 10-day sprint plan

Day 1
  Chetan:  behaviouralEngine.ts complete with unit tests
  Vijeta:  Extension scaffold, Landing.tsx shell, Phantom connect

Day 2
  Chetan:  fuzzyExtractor.ts complete with noise tolerance test
  Vijeta:  solana.ts all 5 functions, Phantom connect working in popup

Day 3
  Chetan:  aesVault.ts, enrollmentStore.ts, demoProfile.ts
  Vijeta:  Enroll.tsx UI complete (no logic yet, awaiting Day 4 sync)

Day 4 — SYNC
  Both:    Wire behaviouralEngine + fuzzyExtractor into Enroll.tsx.
           Vijeta calls runEnroll() then registerUser().
           Goal: 10 samples -> chain tx -> Explorer link in popup.
           Prerequisite: anchor deploy must be done before this day.

Day 5
  Chetan:  authFlow.ts (full auth orchestration), duressAlert.ts
  Vijeta:  Auth.tsx UI with score ring and all result states

Day 6 — SYNC
  Both:    Wire authFlow into Auth.tsx. Build Dashboard + Ghost.
           Vijeta calls runAuth() then authenticateUser() or triggerDuress().
           Goal: type phrase -> score -> chain tx -> wallet dashboard opens.

Day 7
  Chetan:  demoFlow.ts, demoProfile.ts constants, demo mode logic
  Vijeta:  Demo mode UI toggle on Landing, content_script.ts, background.ts

Day 8
  Chetan:  Engine hardening: test with multiple typing styles, tune BCH tolerance,
           test stress detection, test new-device flow
  Vijeta:  UI polish: loading states, error messages, tx pending spinner,
           wrong network handling, popup dimensions, dark navy theme

Day 9 — SYNC
  Both:    Full end-to-end test on fresh Chrome profile and fresh devnet wallet.
           Run all flows: enroll, auth (pass), auth (reject), duress.
           Record demo video: 3 acts under 3 minutes.
           Fix anything broken.

Day 10
  Chetan:  Technical writeup (Devfolio long description), GitHub README
  Vijeta:  Devfolio submission form, extension zip for download, final clean run

---

## Demo script (3 acts, target under 3 minutes)

Act 1 — Enrollment (45 seconds)
  Open extension. Click Connect Phantom. Wallet address shows in header.
  Type "Secure my account" 10 times. Progress bar fills per sample.
  Enrollment completes. Solana Explorer opens showing Registered event.
  Say: "The BCH syndrome is now stored on Solana. The key that unlocks
  this wallet exists nowhere. It lives for milliseconds only when I type."

Act 2 — Authentication (45 seconds)
  Type phrase once. Score ring animates to ~0.87. Authenticated.
  Anchor tx fires. Explorer shows AuthSuccess and burned nullifier PDA.
  Wallet dashboard opens: live devnet SOL balance, event timeline.
  Say: "Typing rhythm reconstructed the key. Same person, same key.
  The wallet opens. The nullifier is burned. This exact auth cannot be replayed."

Act 3 — Duress (60 seconds)
  Type phrase with stress: fast, erratic, uneven.
  Score ring lands in duress band. "Access Granted" shown (identical to real auth).
  trigger_duress fires. DuressLog PDA visible on Explorer.
  Ghost wallet opens: identical to real dashboard, fake balance.
  Phone receives EmailJS alert email with Explorer link, live on screen.
  Say: "The attacker sees a normal session. The real wallet is flagged
  on Solana. The owner has been alerted. Rubber hose cryptanalysis meets its match."

---

## Visual design

Background:     #0d1117 (dark navy)
Accent:         #00ff9d (electric teal)
Danger:         #ff4444 (red for rejected)
Warning:        #f59e0b (amber for duress)
Font:           monospace for addresses and hashes, sans-serif for UI copy
Popup size:     380px wide, 580px tall maximum
Score ring:     SVG circle, teal stroke, animates 0 to final score over 1.5 seconds
Status badges:  teal Authenticated, amber Duress, red Rejected
Tx links:       always truncated hash + external link icon -> Solana Explorer devnet

---

## Academic references for writeup

1. Dodis, Reyzin, Smith. Fuzzy Extractors: How to Generate Strong Keys from
   Biometrics. EUROCRYPT 2004. Core math for Gen() and Rep().
2. Acien et al. TypeNet: Scaling Up Keystroke Dynamics Authentication.
   IEEE TIFS 2022. EER < 2% across 140k users validates keystroke biometrics.
3. Xu et al. GyroAuth: Continuous Authentication using Gyroscope.
   USENIX Security 2023. 98.3% accuracy validates mobile gyro integration.
4. W3C DID Working Group. Decentralized Identifiers v1.0. 2022.
   DID framing for on-chain identity anchoring.
5. Verizon DBIR 2023. 80% of breaches involve compromised credentials.

---

## Submission checklist

Anchor:
  [ ] anchor build succeeds with no errors
  [ ] anchor deploy to devnet, program ID copied to both .env files
  [ ] All 5 anchor tests pass: register, double-register-fail, auth,
      replay-attack-fail, duress, duress-blocks-auth

Extension:
  [ ] Loads in Chrome with no console errors
  [ ] Demo mode works end to end without Phantom installed
  [ ] Realtime enroll: 10 samples -> chain tx -> Explorer link shown
  [ ] Realtime auth correct: gesture -> fuzzy -> chain tx -> dashboard opens
  [ ] Realtime auth wrong: rejected -> chain event logged
  [ ] Duress: stress typing -> ghost wallet -> email received within 5 seconds
  [ ] Ghost wallet visually identical to real wallet
  [ ] Content script badge injects on password fields
  [ ] Badge turns green on auth success

Submission:
  [ ] Demo video recorded and uploaded (YouTube unlisted, under 3 minutes)
  [ ] Devfolio: category Identity & Privacy, description filled, video linked
  [ ] GitHub README: architecture, setup instructions, env vars, Explorer links
  [ ] Extension packaged as .zip for download link in README
