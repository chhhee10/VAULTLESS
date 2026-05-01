/**
 * duressAlert.ts
 * Owner: Chetan
 *
 * Sends a silent duress email via EmailJS when duress is detected.
 * Fires without any visible UI change so an attacker sees nothing unusual.
 *
 * Environment variables (from extension/.env):
 *   VITE_EMAILJS_SERVICE_ID
 *   VITE_EMAILJS_TEMPLATE_ID
 *   VITE_EMAILJS_PUBLIC_KEY
 *   VITE_ALERT_EMAIL
 */

import emailjs from '@emailjs/browser'

let initialised = false

function ensureInit() {
  if (initialised) return
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
  if (!publicKey) {
    console.warn('[VAULTLESS] EmailJS public key not configured — duress alerts disabled')
    return
  }
  emailjs.init({ publicKey })
  initialised = true
}

export interface DuressAlertPayload {
  walletPubkey: string      // wallet address
  timestamp: number         // Date.now()
  explorerUrl?: string      // Solana Explorer link for DuressLog tx
}

/**
 * sendDuressEmail — sends a silent alert to the recovery email address.
 *
 * The attacker sees nothing. The owner receives an email containing:
 *   - Wallet public key
 *   - Timestamp
 *   - Explorer link to the on-chain DuressLog
 *
 * Fails silently to never interrupt the ghost wallet flow.
 */
export async function sendDuressEmail(payload: DuressAlertPayload): Promise<void> {
  try {
    ensureInit()

    const serviceId  = import.meta.env.VITE_EMAILJS_SERVICE_ID
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
    const alertEmail = import.meta.env.VITE_ALERT_EMAIL

    if (!serviceId || !templateId || !alertEmail) {
      console.warn('[VAULTLESS] EmailJS not fully configured — skipping duress email')
      return
    }

    const templateParams = {
      to_email:    alertEmail,
      wallet:      payload.walletPubkey,
      timestamp:   new Date(payload.timestamp).toISOString(),
      explorer_url: payload.explorerUrl ?? 'N/A',
      message:     `⚠️ DURESS DETECTED on wallet ${payload.walletPubkey} at ${new Date(payload.timestamp).toLocaleString()}. Ghost session active. Real wallet is flagged on Solana.`,
    }

    await emailjs.send(serviceId, templateId, templateParams)
    console.log('[VAULTLESS] Duress alert sent')
  } catch (err) {
    // Fail silently — never interrupt the ghost session
    console.error('[VAULTLESS] Duress email failed (silent):', err)
  }
}
