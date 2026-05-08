import { useNavigate } from 'react-router-dom';
import { useVaultless } from '../lib/VaultlessContext';

export default function WalletAccess() {
  const navigate = useNavigate();
  const { isEnrolled, demoMode } = useVaultless();

  return (
    <div style={s.root}>
      {/* Ambient glow */}
      <div style={s.glow} />

      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate('/')}>← VAULTLESS</button>
      </div>

      <div style={s.container}>
        <div style={s.card}>

          {/* Icon */}
          <div style={s.iconWrap}>
            <span style={s.icon}>⬡</span>
          </div>

          <h1 style={s.title}>Access Your Wallet</h1>
          <p style={s.subtitle}>
            {demoMode
              ? 'Demo mode — your biometric session will not touch the chain.'
              : 'Authenticate with your behavioural signature to unlock your wallet.'}
          </p>

          {demoMode && (
            <div style={s.demoBadge}>DEMO MODE</div>
          )}

          <div style={s.divider} />

          <div style={s.actions}>
            {isEnrolled ? (
              <>
                <button
                  id="authenticate-btn"
                  style={s.primaryBtn}
                  onClick={() => navigate('/auth')}
                >
                  Authenticate →
                </button>
                <p style={s.hint}>Already enrolled — type your phrase to unlock.</p>
              </>
            ) : (
              <>
                <button
                  id="enroll-btn"
                  style={s.primaryBtn}
                  onClick={() => navigate('/enroll')}
                >
                  Enroll Identity →
                </button>
                <p style={s.hint}>First time? Set up your biometric signature.</p>
              </>
            )}
          </div>

          <div style={s.securityRow}>
            <span style={s.chip}>⬡ Zero-Knowledge</span>
            <span style={s.chip}>⬡ On-Chain</span>
            <span style={s.chip}>⬡ Anti-Coercion</span>
          </div>

        </div>

        {/* Bottom note */}
        <p style={s.footnote}>
          Your key is derived from how you type — not stored anywhere.
        </p>
      </div>
    </div>
  );
}

const s = {
  root: {
    minHeight: '100vh',
    background: '#050508',
    color: '#fff',
    fontFamily: "'Inter', system-ui, sans-serif",
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'fixed',
    top: '35%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 700,
    height: 700,
    background: 'radial-gradient(circle, rgba(0,255,77,0.07) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  header: {
    padding: '20px 40px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#00FF4D',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.15em',
    fontFamily: "'JetBrains Mono', monospace",
    textTransform: 'uppercase',
  },
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
    gap: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: '44px 40px 36px',
    textAlign: 'center',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: 'rgba(0,255,77,0.08)',
    border: '1px solid rgba(0,255,77,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  icon: {
    fontSize: 28,
    color: '#00FF4D',
  },
  title: {
    fontSize: 26,
    fontWeight: 300,
    margin: '0 0 10px',
    letterSpacing: '-0.03em',
    fontFamily: "'Syne', sans-serif",
    color: '#fff',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    margin: '0 0 20px',
    lineHeight: 1.6,
  },
  demoBadge: {
    display: 'inline-block',
    background: 'rgba(0,255,77,0.1)',
    border: '1px solid rgba(0,255,77,0.25)',
    color: '#00FF4D',
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: '0.2em',
    padding: '5px 14px',
    borderRadius: 100,
    fontFamily: "'JetBrains Mono', monospace",
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    background: 'rgba(255,255,255,0.06)',
    margin: '24px 0',
  },
  actions: {
    marginBottom: 28,
  },
  primaryBtn: {
    width: '100%',
    padding: '15px',
    background: '#00FF4D',
    color: '#000',
    border: 'none',
    borderRadius: 100,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.15em',
    cursor: 'pointer',
    fontFamily: "'JetBrains Mono', monospace",
    textTransform: 'uppercase',
    boxShadow: '0 8px 32px rgba(0,255,77,0.25)',
    marginBottom: 12,
    transition: 'all 0.2s',
  },
  hint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    margin: 0,
    fontFamily: "'JetBrains Mono', monospace",
  },
  securityRow: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: 20,
  },
  chip: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.3)',
    padding: '5px 12px',
    borderRadius: 100,
    fontSize: 10,
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: '0.05em',
  },
  footnote: {
    color: 'rgba(255,255,255,0.18)',
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: '0.05em',
    textAlign: 'center',
  },
};