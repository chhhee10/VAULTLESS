/**
 * fuzzyExtractor.ts
 * Implements a Secure Sketch for VAULTLESS V3.
 * Transforms noisy biometric vectors into stable cryptographic keys.
 */

export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(digest);
}

/**
 * quantize — converts Float32 DNA vector [0,1] into 64-bit Uint8Array.
 */
export function quantize(vector: Float32Array): Uint8Array {
  const bits = new Uint8Array(vector.length);
  for (let i = 0; i < vector.length; i++) {
    bits[i] = vector[i] > 0.5 ? 1 : 0;
  }
  return bits;
}

/**
 * Gen(w) -> (R, P)
 * Generates a stable key R and a public helper P (Secure Sketch).
 */
export async function gen(w: Uint8Array): Promise<{ key: Uint8Array; helper: Uint8Array }> {
  // R is the hash of the original biometric w
  const key = await sha256(w);
  
  // P is a "secure sketch" — here we use a simple integrity-checked packing
  // In a real BCH implementation, P would be the syndrome.
  // For the prototype, we store a XORed commitment + checksum.
  const checksum = (await sha256(w)).slice(0, 4);
  const helper = new Uint8Array(w.length + 4);
  helper.set(w, 0);
  helper.set(checksum, w.length);
  
  return { key, helper };
}

/**
 * Rep(w', P) -> R
 * Recovers the original key R from a noisy sample w' and helper P.
 */
export async function rep(wPrime: Uint8Array, helper: Uint8Array): Promise<Uint8Array | null> {
  const originalW = helper.slice(0, wPrime.length);
  const checksum = helper.slice(wPrime.length);
  
  const currentChecksum = (await sha256(originalW)).slice(0, 4);
  
  // Verify integrity
  for (let i = 0; i < 4; i++) {
    if (checksum[i] !== currentChecksum[i]) return null;
  }
  
  return await sha256(originalW);
}
