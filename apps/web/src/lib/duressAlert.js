// Setup: Create free account at emailjs.com
// Add your Service ID, Template ID, and Public Key to .env

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY';
const ALERT_EMAIL = import.meta.env.VITE_ALERT_EMAIL || 'alert@example.com';

export async function sendDuressAlert({ address, txHash, timestamp, recoveryEmail }) {
  try {
    const cfgError = validateEmailConfig(recoveryEmail);
    if (cfgError) {
      return { ok: false, error: cfgError };
    }

    // Dynamically load EmailJS and initialize with the public key
    const emailjs = await import('@emailjs/browser');
    emailjs.init(PUBLIC_KEY);

    const solanaLink = `https://explorer.solana.com/tx/${txHash}?cluster=devnet`;
    const toEmail = (recoveryEmail || '').trim() || ALERT_EMAIL;

    const templateParams = {
      to_email: toEmail,
      subject: '🚨 VAULTLESS DURESS ALERT',
      wallet_address: address,
      timestamp: new Date(timestamp).toLocaleString(),
      solana_link: solanaLink,
      message: `DURESS PROTOCOL ACTIVATED\n\nWallet: ${address}\nTime: ${new Date(timestamp).toLocaleString()}\nSolana Explorer: ${solanaLink}\n\nThe account has been locked. A ghost session was loaded for the attacker.`,
    };

    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams
    );

    console.log('[VAULTLESS] Duress alert sent successfully');
    return { ok: true };
  } catch (err) {
    console.error('[VAULTLESS] Failed to send duress alert:', err);
    return { ok: false, error: extractEmailError(err) };
  }
}

function validateEmailConfig(recoveryEmail) {
  if (isPlaceholder(SERVICE_ID) || isPlaceholder(TEMPLATE_ID) || isPlaceholder(PUBLIC_KEY)) {
    return 'Email alerts are not configured. Set VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, and VITE_EMAILJS_PUBLIC_KEY in .env and restart the dev server.';
  }
  const toEmail = (recoveryEmail || '').trim() || ALERT_EMAIL;
  if (!isValidEmail(toEmail)) {
    return 'Recovery/fallback email is invalid. Add a valid recovery email during enrollment or fix VITE_ALERT_EMAIL.';
  }
  return '';
}

function isPlaceholder(value) {
  if (!value) return true;
  const v = String(value).trim().toLowerCase();
  return v.includes('your_') || v.includes('your-') || v.includes('service_id') || v.includes('template_id') || v.includes('public_key');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function extractEmailError(err) {
  if (!err) return 'Unknown EmailJS error.';
  if (typeof err === 'string') return err;
  if (err.text) return err.text;
  if (err.message) return err.message;
  if (err.status) return `EmailJS returned status ${err.status}`;
  try {
    return JSON.stringify(err);
  } catch {
    return 'Unknown EmailJS error.';
  }
}
