/**
 * generateDemoProfile.ts
 * Run once with: npx tsx scripts/generateDemoProfile.ts
 *
 * Computes real DEMO_COMMITMENT, DEMO_CIPHERTEXT, DEMO_HELPER_DATA
 * from DEMO_ENROLLMENT_VECTOR and prints them ready to paste into demoProfile.ts.
 */

// Node.js script — uses Web Crypto via globalThis (Node 18+)
import { quantize, computeSyndrome, hkdf, sha256 } from '../src/crypto/fuzzyExtractor'
import { aesEncrypt } from '../src/crypto/aesVault'
import { DEMO_ENROLLMENT_VECTOR } from '../src/crypto/demoProfile'

async function main() {
  console.log('Generating demo profile constants...\n')

  const bits       = quantize(DEMO_ENROLLMENT_VECTOR)
  const helperData = computeSyndrome(bits)
  const key        = await hkdf(bits)
  const commitment = await sha256(key)
  const ciphertext = await aesEncrypt(key, 'Wallet unlocked. Welcome.')

  console.log('// DEMO_HELPER_DATA')
  console.log(`export const DEMO_HELPER_DATA: Uint8Array = new Uint8Array([${Array.from(helperData).join(', ')}])`)
  console.log()

  console.log('// DEMO_COMMITMENT')
  const hexCommit = Array.from(commitment).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')
  console.log(`export const DEMO_COMMITMENT: number[] = [${hexCommit}]`)
  console.log()

  console.log('// DEMO_CIPHERTEXT')
  console.log(`export const DEMO_CIPHERTEXT: string = '${ciphertext}'`)
  console.log()

  console.log('// bits (debug)')
  console.log('Quantized bits:', bits)
}

main().catch(console.error)
