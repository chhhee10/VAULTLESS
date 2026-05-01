/**
 * demoFlow.ts
 * Owner: Chetan
 *
 * Same interface as authFlow.ts but operates in demo mode.
 * No Phantom required. Pre-seeded enrollment from demoProfile.ts.
 * Biometric scoring still runs for real on actual user input.
 * Solana txs are simulated (fake signatures + 1.5s delay).
 *
 * runDemoAuth(vector) → AuthResult  (same type as real auth)
 * runDemoEnroll()     → void (loads demo constants into enrollment store)
 */

import { buildVector, scoreAuth, KeystrokeDNA, averageSamples } from '../engine/behaviouralEngine'
import { quantize, computeSyndrome, correctBits, hkdf, sha256 } from './fuzzyExtractor'
import { aesDecrypt } from './aesVault'
import { saveEnrollment } from '../store/enrollmentStore'
import { sendDuressEmail } from './duressAlert'
import { DEMO_HELPER_DATA, DEMO_COMMITMENT, DEMO_CIPHERTEXT, DEMO_ENROLLMENT_VECTOR } from './demoProfile'
import type { AuthResult, EnrollResult } from './authFlow'

// ─── Fake Solana signature generator ─────────────────────────────────────────

const BASE58_CHARS = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function fakeSig(): string {
  let sig = ''
  for (let i = 0; i < 88; i++) {
    sig += BASE58_CHARS[Math.floor(Math.random() * BASE58_CHARS.length)]
  }
  return sig
}

function fakeExplorerUrl(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`
}

/**
 * Simulate a 1.5-second Solana transaction.
 * Returns a fake signature + Explorer URL.
 */
export async function simulateTx(): Promise<{ sig: string; explorerUrl: string }> {
  await new Promise(resolve => setTimeout(resolve, 1500))
  const sig = fakeSig()
  return { sig, explorerUrl: fakeExplorerUrl(sig) }
}

// ─── runDemoEnroll ────────────────────────────────────────────────────────────

/**
 * runDemoEnroll — seeds chrome.storage.local with demo constants.
 *
 * Called when the user enters demo mode. Sets up the enrollment store
 * so runDemoAuth() can use fuzzyRep() against the demo profile.
 *
 * Note: We compute a real ciphertext from the demo key so AES decryption
 * works correctly during scoring.
 */
export async function runDemoEnroll(): Promise<void> {
  const helperData = DEMO_HELPER_DATA
  const commitment = new Uint8Array(DEMO_COMMITMENT)

  // Derive demo key from the known enrollment vector
  const bits = quantize(DEMO_ENROLLMENT_VECTOR)
  const key  = await hkdf(bits)

  // Import ciphertext (either pre-computed or generate fresh)
  let ciphertext: string = DEMO_CIPHERTEXT
  if (ciphertext === 'PLACEHOLDER_REPLACE_WITH_GENERATED_CIPHERTEXT') {
    // Generate dynamically on first demo run
    const { aesEncrypt } = await import('./aesVault')
    ciphertext = await aesEncrypt(key, 'Wallet unlocked. Welcome.')
  }

  await saveEnrollment(helperData, commitment, ciphertext, 'demo')
}

// ─── runDemoAuth ──────────────────────────────────────────────────────────────

/**
 * runDemoAuth — demo authentication.
 *
 * Same interface as runAuth() from authFlow.ts.
 * Vijeta calls it identically — no code changes needed on her side.
 *
 * @param vector  Float32Array[64] live typing vector from Enroll.tsx/Auth.tsx
 * @returns       AuthResult (same type as real auth)
 */
export async function runDemoAuth(vector: Float32Array): Promise<AuthResult> {
  const emptyResult: AuthResult = {
    success: false,
    classification: 'rejected',
    score: 0,
    nullifier: new Uint8Array(32),
    key: new Uint8Array(32),
  }

  try {
    // 1. Derive enrolled DNA from demo profile
    const enrolledDNA = buildVector(synthesiseEventsFromVector(DEMO_ENROLLMENT_VECTOR))

    // 2. Build live DNA from incoming vector
    const liveDNA = buildVector(synthesiseEventsFromVector(vector))

    // 3. fuzzyRep against demo constants
    const helperData = DEMO_HELPER_DATA
    const commitment = new Uint8Array(DEMO_COMMITMENT)

    const noisyBits    = quantize(vector)
    const correctedBits = correctBits(noisyBits, helperData)
    const repKey       = await hkdf(correctedBits)
    const repCommit    = await sha256(repKey)

    // Constant-time comparison
    let matches = repCommit.length === commitment.length
    for (let i = 0; i < repCommit.length; i++) {
      if (repCommit[i] !== commitment[i]) matches = false
    }

    // 4. Score biometrics
    const scoreResult = scoreAuth(enrolledDNA, liveDNA, liveDNA.mouseScore)

    // 5. Generate fake nullifier
    const nullifier = new Uint8Array(32)
    crypto.getRandomValues(nullifier)

    // 6. Classification
    if (!matches && scoreResult.score < 0.60) {
      return {
        ...emptyResult,
        score: scoreResult.score,
        classification: 'rejected',
        error: 'Biometric mismatch',
      }
    }

    if (scoreResult.classification === 'duress') {
      // Silent duress alert (will fail if EmailJS not configured — OK)
      sendDuressEmail({
        walletPubkey: 'DEMO_WALLET',
        timestamp: Date.now(),
        explorerUrl: fakeExplorerUrl(fakeSig()),
      }).catch(() => {})

      return {
        success: true,
        classification: 'duress',
        score: scoreResult.score,
        nullifier,
        key: repKey,
      }
    }

    if (scoreResult.classification === 'authenticated' || matches) {
      return {
        success: true,
        classification: 'authenticated',
        score: Math.max(scoreResult.score, 0.75), // demo always shows reasonable score
        nullifier,
        key: repKey,
      }
    }

    return {
      ...emptyResult,
      score: scoreResult.score,
      classification: 'rejected',
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    return { ...emptyResult, error }
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function synthesiseEventsFromVector(vector: Float32Array) {
  const MAX_HOLD   = 500
  const MAX_FLIGHT = 800
  const events = []
  let cursor = performance.now()

  for (let i = 0; i < 20; i++) {
    const hold   = vector[i]        * MAX_HOLD
    const flight = i < 19 ? vector[20 + i] * MAX_FLIGHT : 0
    const downAt = cursor
    const upAt   = downAt + hold
    events.push({ key: `k${i}`, downAt, upAt })
    cursor = upAt + flight
  }
  return events
}
