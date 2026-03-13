// Ghost session — loaded silently when duress is detected.
// Looks IDENTICAL to Dashboard. Attacker sees a normal session.
// Real account is locked on-chain.

import Dashboard from './Dashboard';
import { useEffect } from 'react';

export default function Ghost() {
  useEffect(() => {
    // Ghost loaded — don't let the URL change visibly
    // The blockchain already recorded DuressActivated
    console.log('[VAULTLESS] Ghost session loaded. Real account locked.');
  }, []);

  // Render the exact same dashboard — indistinguishable
  return <Dashboard isGhost={true} />;
}
