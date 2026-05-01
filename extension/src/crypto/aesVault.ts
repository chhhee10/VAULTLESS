/**
 * aesVault.ts
 * Owner: Chetan
 *
 * AES-256-GCM encrypt and decrypt using the Web Crypto API.
 * The key is the 256-bit R derived from the fuzzy extractor.
 *
 * aesEncrypt: generates random 12-byte IV, returns base64(iv + ciphertext)
 * aesDecrypt: decodes base64, splits IV, decrypts — throws DOMException on
 *             wrong key (this throw IS the cryptographic auth gate).
 *
 * Storage key pattern: "vaultless_secret_{pubkeyHex}"
 */

const IV_LENGTH = 12 // bytes for AES-GCM

// ─── Import key from raw bytes ────────────────────────────────────────────────

async function importKey(keyBytes: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// ─── Base64 helpers ───────────────────────────────────────────────────────────

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// ─── Encrypt ─────────────────────────────────────────────────────────────────

/**
 * aesEncrypt — encrypts plaintext string with AES-256-GCM.
 *
 * @param key        256-bit key R as Uint8Array
 * @param plaintext  string to encrypt (e.g. "Wallet unlocked. Welcome.")
 * @returns          base64(iv + ciphertext)
 */
export async function aesEncrypt(key: Uint8Array, plaintext: string): Promise<string> {
  const cryptoKey = await importKey(key)
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encoder = new TextEncoder()
  const encoded = encoder.encode(plaintext)

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encoded
  )

  // Concatenate IV + ciphertext
  const combined = new Uint8Array(IV_LENGTH + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), IV_LENGTH)

  return toBase64(combined)
}

// ─── Decrypt ─────────────────────────────────────────────────────────────────

/**
 * aesDecrypt — decrypts a base64-encoded AES-256-GCM blob.
 *
 * Throws DOMException (OperationError) if the key is wrong or data is
 * corrupted. This exception is the cryptographic authentication gate —
 * the caller MUST treat any thrown exception as auth failure.
 *
 * @param key      256-bit key R as Uint8Array
 * @param encoded  base64 string from aesEncrypt
 * @returns        decrypted plaintext string
 */
export async function aesDecrypt(key: Uint8Array, encoded: string): Promise<string> {
  const cryptoKey = await importKey(key)
  const combined = fromBase64(encoded)

  if (combined.length <= IV_LENGTH) {
    throw new Error('Invalid ciphertext: too short')
  }

  const iv = combined.slice(0, IV_LENGTH)
  const ciphertext = combined.slice(IV_LENGTH)

  // If key is wrong → crypto.subtle.decrypt throws DOMException
  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    ciphertext
  )

  const decoder = new TextDecoder()
  return decoder.decode(plainBuffer)
}

// ─── Storage key helper ───────────────────────────────────────────────────────

/**
 * Returns the chrome.storage.local key for a wallet's encrypted secret.
 * @param pubkeyHex  hex string of the wallet public key (or 'demo')
 */
export function vaultStorageKey(pubkeyHex: string): string {
  return `vaultless_secret_${pubkeyHex}`
}
