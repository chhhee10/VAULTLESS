/**
 * enrollmentStore.ts
 * Owner: Chetan
 *
 * chrome.storage.local read/write for enrollment data.
 * Stores: helperData (syndrome P), commitment (SHA256(R)), ciphertext.
 * Never stores the key R itself.
 */

const STORAGE_KEY = 'vaultless_enrollment'

export interface EnrollmentData {
  helperData: number[]    // Uint8Array serialised as plain array for JSON
  commitment: number[]    // SHA256(R) serialised as plain array
  ciphertext: string | null  // base64 AES-GCM blob, null on new-device import
  enrolledAt: number      // Date.now()
  pubkeyHex: string       // wallet public key hex (or 'demo')
}

// ─── Save ─────────────────────────────────────────────────────────────────────

/**
 * saveEnrollment — persists enrollment data to chrome.storage.local.
 */
export async function saveEnrollment(
  helperData: Uint8Array,
  commitment: Uint8Array,
  ciphertext: string | null,
  pubkeyHex: string = 'demo'
): Promise<void> {
  const data: EnrollmentData = {
    helperData: Array.from(helperData),
    commitment: Array.from(commitment),
    ciphertext,
    enrolledAt: Date.now(),
    pubkeyHex,
  }
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else {
        resolve()
      }
    })
  })
}

// ─── Load ─────────────────────────────────────────────────────────────────────

/**
 * loadEnrollment — fetches enrollment data from chrome.storage.local.
 * Returns null if not enrolled on this device.
 */
export async function loadEnrollment(): Promise<EnrollmentData | null> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      const data = result[STORAGE_KEY] as EnrollmentData | undefined
      resolve(data ?? null)
    })
  })
}

// ─── Clear ────────────────────────────────────────────────────────────────────

/**
 * clearEnrollment — removes enrollment data from chrome.storage.local.
 * Use during re-enrollment or reset.
 */
export async function clearEnrollment(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove([STORAGE_KEY], () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else {
        resolve()
      }
    })
  })
}

// ─── Typed accessors ─────────────────────────────────────────────────────────

/**
 * getHelperData — returns syndrome P as Uint8Array or null if not enrolled.
 */
export async function getHelperData(): Promise<Uint8Array | null> {
  const data = await loadEnrollment()
  if (!data) return null
  return new Uint8Array(data.helperData)
}

/**
 * getCommitment — returns commitment C as Uint8Array or null if not enrolled.
 */
export async function getCommitment(): Promise<Uint8Array | null> {
  const data = await loadEnrollment()
  if (!data) return null
  return new Uint8Array(data.commitment)
}

/**
 * getCiphertext — returns base64 ciphertext or null.
 */
export async function getCiphertext(): Promise<string | null> {
  const data = await loadEnrollment()
  if (!data) return null
  return data.ciphertext
}

/**
 * isEnrolled — returns true if local enrollment data exists.
 */
export async function isEnrolled(): Promise<boolean> {
  const data = await loadEnrollment()
  return data !== null
}
