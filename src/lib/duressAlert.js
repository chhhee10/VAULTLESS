// Setup: Create free account at emailjs.com
// Add your Service ID, Template ID, and Public Key to .env

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY';
const ALERT_EMAIL = import.meta.env.VITE_ALERT_EMAIL || 'alert@example.com';

export async function sendDuressAlert({ address, txHash, timestamp }) {
  try {
    // Dynamically load EmailJS to avoid bundle bloat
    const emailjs = await import('@emailjs/browser');

    const etherscanLink = `https://sepolia.etherscan.io/tx/${txHash}`;

    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: ALERT_EMAIL,
        subject: '🚨 VAULTLESS DURESS ALERT',
        wallet_address: address,
        timestamp: new Date(timestamp).toLocaleString(),
        etherscan_link: etherscanLink,
        message: `DURESS PROTOCOL ACTIVATED\n\nWallet: ${address}\nTime: ${new Date(timestamp).toLocaleString()}\nEtherscan: ${etherscanLink}\n\nThe account has been locked. A ghost session was loaded for the attacker.`,
      },
      PUBLIC_KEY
    );

    console.log('[VAULTLESS] Duress alert sent successfully');
    return true;
  } catch (err) {
    console.error('[VAULTLESS] Failed to send duress alert:', err);
    return false;
  }
}
