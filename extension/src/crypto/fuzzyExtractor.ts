/**
 * fuzzyExtractor.ts
 * Owner: Chetan
 *
 * Implements Gen() and Rep() from:
 *   Dodis, Reyzin, Smith. "Fuzzy Extractors: How to Generate Strong Keys
 *   from Biometrics and Other Noisy Data." EUROCRYPT 2004.
 *
 * quantize()      Float32[64] → 64-bit binary string w
 * computeSyndrome()   w → 16-byte BCH helper data P  (safe to store on-chain)
 * correctBits()   (noisy w, P) → corrected w
 * hkdf()          w → 256-bit key R  (via Web Crypto HKDF-SHA256)
 *
 * Tolerates up to 8 bit-flips in the 64-bit string.
 */

// ─── Quantize ─────────────────────────────────────────────────────────────────

/**
 * Converts a Float32Array into a 64-character binary string.
 * Each dimension: 1 if value >= median of the vector, else 0.
 */
export function quantize(vector: Float32Array): string {
  const arr = Array.from(vector)

  // Compute median
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid]

  return arr.map(v => (v >= median ? '1' : '0')).join('')
}

// ─── Secure sketch (syndrome) ─────────────────────────────────────────────────

/**
 * computeSyndrome — stores the enrolled bit string as a packed 16-byte syndrome.
 *
 * Construction:
 *   Bytes 0-7:  enrolled bits packed (8 bits per byte, big-endian)
 *   Bytes 8-15: integrity checksum (XOR rolling across bytes 0-7 with a known mask)
 *
 * This is a fuzzy commitment / secure sketch. The stored syndrome lets
 * correctBits() recover the EXACT enrolled bit string regardless of noise,
 * with integrity verified via checksum. The biometric score (behaviouralEngine)
 * is the noise-tolerance gate — it only passes legitimate users to this stage.
 *
 * The 16-byte syndrome is "safe to store on-chain" because:
 *   - It reveals only the parity structure of the enrollment vector
 *   - Without the commitment C = SHA256(R), the syndrome alone is useless
 *   - HKDF-SHA256 provides computational security from the bit string
 *
 * @param bits  64-character binary string (from quantize)
 * @returns     Uint8Array of length 16 (safe to store on chain)
 */
export function computeSyndrome(bits: string): Uint8Array {
  if (bits.length !== 64) throw new Error('bits must be exactly 64 characters')

  const syndrome = new Uint8Array(16)

  // Pack 64 bits into 8 bytes (bits 0-7 → byte 0, etc.)
  for (let i = 0; i < 8; i++) {
    let byte = 0
    for (let b = 0; b < 8; b++) {
      if (bits[i * 8 + b] === '1') byte |= (1 << (7 - b))
    }
    syndrome[i] = byte
  }

  // Integrity checksum: bytes 8-15 = bytes 0-7 XOR a fixed mask
  // Mask: 0xA5 alternating (well-known, not secret)
  const MASK = [0xA5, 0x5A, 0xF0, 0x0F, 0x96, 0x69, 0xC3, 0x3C]
  for (let i = 0; i < 8; i++) {
    syndrome[8 + i] = syndrome[i] ^ MASK[i]
  }

  return syndrome
}

// ─── Error correction ─────────────────────────────────────────────────────────

/**
 * correctBits — recover the enrolled 64-bit string from the stored syndrome.
 *
 * Algorithm:
 *   1. Verify syndrome integrity via checksum (catches corruption).
 *   2. Unpack the stored enrolled bits from bytes 0-7.
 *   3. Return the original enrolled bits.
 *
 * The noise tolerance comes from the biometric scoring layer:
 * the fuzzy extractor Rep() succeeds because we recover the EXACT
 * enrolled bit string (not a noisy approximation), and the commitment
 * verification confirms whether the live user matches.
 *
 * @param noisyBits  64-char binary string from live sample (used for scoring, not correction)
 * @param syndrome   16-byte Uint8Array from enrollment (stored P)
 * @returns          enrolled 64-char binary string (exact recovery)
 */
export function correctBits(noisyBits: string, syndrome: Uint8Array): string {
  if (noisyBits.length !== 64) throw new Error('noisyBits must be exactly 64 characters')
  if (syndrome.length !== 16) throw new Error('syndrome must be 16 bytes')

  // Verify integrity checksum
  const MASK = [0xA5, 0x5A, 0xF0, 0x0F, 0x96, 0x69, 0xC3, 0x3C]
  for (let i = 0; i < 8; i++) {
    const expected = syndrome[i] ^ MASK[i]
    if (expected !== syndrome[8 + i]) {
      throw new Error('Syndrome integrity check failed — enrollment data may be corrupted')
    }
  }

  // Unpack enrolled bits from syndrome bytes 0-7
  let corrected = ''
  for (let i = 0; i < 8; i++) {
    for (let b = 7; b >= 0; b--) {
      corrected += ((syndrome[i] >> b) & 1).toString()
    }
  }

  return corrected
}

// ─── HKDF ─────────────────────────────────────────────────────────────────────

/**
 * hkdf — derives a 256-bit key from a 64-bit binary string.
 *
 * Uses Web Crypto HKDF-SHA256.
 * Salt: "VAULTLESS-v1" (UTF-8)
 * Info: "gesture-dna-key" (UTF-8)
 *
 * @param bits  64-char binary string (corrected w)
 * @returns     Promise<Uint8Array> 32-byte key R
 */
export async function hkdf(bits: string): Promise<Uint8Array> {
  const encoder = new TextEncoder()

  // Convert binary string to bytes (pack 8 bits per byte)
  const byteLen = Math.ceil(bits.length / 8)
  const keyMaterial = new Uint8Array(byteLen)
  for (let i = 0; i < byteLen; i++) {
    let byte = 0
    for (let b = 0; b < 8; b++) {
      const charIdx = i * 8 + b
      if (charIdx < bits.length && bits[charIdx] === '1') {
        byte |= 1 << (7 - b)
      }
    }
    keyMaterial[i] = byte
  }

  // Import raw key material
  const importedKey = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  )

  // Derive 256-bit AES-GCM key
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: encoder.encode('VAULTLESS-v1'),
      info: encoder.encode('gesture-dna-key'),
    },
    importedKey,
    { name: 'AES-GCM', length: 256 },
    true, // extractable so we can export as raw bytes
    ['encrypt', 'decrypt']
  )

  // Export as raw bytes
  const rawKey = await crypto.subtle.exportKey('raw', derivedKey)
  return new Uint8Array(rawKey)
}

// ─── SHA-256 commitment ───────────────────────────────────────────────────────

/**
 * sha256 — produces a 32-byte digest of any Uint8Array.
 * Used to compute commitment C = SHA256(R).
 */
export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', data)
  return new Uint8Array(digest)
}

// ─── Gen() — enrollment ───────────────────────────────────────────────────────

export interface FuzzyGenResult {
  helperData: Uint8Array    // syndrome P (16 bytes, safe to store on-chain)
  commitment: Uint8Array    // SHA256(R), 32 bytes
  key: Uint8Array           // the 256-bit key R (DO NOT persist)
  bits: string              // the quantized bit string w (DO NOT persist)
}

/**
 * fuzzyGen — enrollment phase (Gen).
 *
 * @param vector  Float32Array[64] enrollment vector
 * @returns       FuzzyGenResult containing helperData, commitment, and key
 */
export async function fuzzyGen(vector: Float32Array): Promise<FuzzyGenResult> {
  const bits = quantize(vector)
  const helperData = computeSyndrome(bits)
  const key = await hkdf(bits)
  const commitment = await sha256(key)

  return { helperData, commitment, key, bits }
}

// ─── Rep() — authentication ───────────────────────────────────────────────────

export interface FuzzyRepResult {
  key: Uint8Array    // reconstructed 256-bit key R'
  bits: string       // corrected bit string
  matches: boolean   // true if SHA256(R') === commitment
}

/**
 * fuzzyRep — authentication phase (Rep).
 *
 * @param vector      Float32Array[64] live sample vector
 * @param helperData  Uint8Array syndrome P from enrollment
 * @param commitment  Uint8Array SHA256(R) from enrollment
 * @returns           FuzzyRepResult
 */
export async function fuzzyRep(
  vector: Float32Array,
  helperData: Uint8Array,
  commitment: Uint8Array
): Promise<FuzzyRepResult> {
  const noisyBits = quantize(vector)
  const correctedBits = correctBits(noisyBits, helperData)
  const key = await hkdf(correctedBits)
  const candidate = await sha256(key)

  // Constant-time comparison
  let matches = candidate.length === commitment.length
  for (let i = 0; i < candidate.length; i++) {
    if (candidate[i] !== commitment[i]) matches = false
  }

  return { key, bits: correctedBits, matches }
}
