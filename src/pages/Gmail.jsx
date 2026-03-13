import { useNavigate } from 'react-router-dom';
import { useVaultless } from '../lib/VaultlessContext';

export default function Gmail() {
  const navigate = useNavigate();
  const { isEnrolled } = useVaultless();

  return (
    <div style={styles.root}>
      {/* Gmail-like header */}
      <div style={styles.header}>
        <span style={styles.logo}>
          <span style={{ color: '#4285F4' }}>G</span>
          <span style={{ color: '#EA4335' }}>m</span>
          <span style={{ color: '#FBBC05' }}>a</span>
          <span style={{ color: '#4285F4' }}>i</span>
          <span style={{ color: '#34A853' }}>l</span>
        </span>
      </div>

      <div style={styles.card}>
        <div style={styles.googleLogo}>
          <svg width="48" height="48" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
            <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.32-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
            <path fill="#FBBC05" d="M11.68 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.68-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.34-5.7z"/>
            <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.34 5.7c1.74-5.2 6.59-9.07 12.32-9.07z"/>
          </svg>
        </div>

        <h2 style={styles.title}>Sign in</h2>
        <p style={styles.subtitle}>to continue to Gmail</p>

        <input
          style={styles.emailInput}
          placeholder="Email or phone"
          defaultValue="user@gmail.com"
          readOnly
        />

        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or sign in with</span>
          <div style={styles.dividerLine} />
        </div>

        <button style={styles.vaultlessBtn} onClick={() => navigate(isEnrolled ? '/auth' : '/enroll')}>
          <span style={styles.vaultlessIcon}>⬡</span>
          Sign in with VAULTLESS
        </button>

        <p style={styles.vaultlessTagline}>
          Passwordless · Unstealable · Anti-Coercion
        </p>

        <div style={styles.footer}>
          <a href="#" style={styles.link}>Help</a>
          <a href="#" style={styles.link}>Privacy</a>
          <a href="#" style={styles.link}>Terms</a>
        </div>
      </div>
    </div>
  );
}

const styles = {
  root: {
    minHeight: '100vh',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: "'Google Sans', Roboto, Arial, sans-serif",
  },
  header: {
    width: '100%',
    padding: '16px 24px',
    borderBottom: '1px solid #e0e0e0',
  },
  logo: { fontSize: 22, fontWeight: 500, letterSpacing: -0.5 },
  card: {
    marginTop: 80,
    width: '100%',
    maxWidth: 448,
    border: '1px solid #dadce0',
    borderRadius: 8,
    padding: '48px 40px',
    textAlign: 'center',
  },
  googleLogo: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 400, color: '#202124', margin: '0 0 8px' },
  subtitle: { fontSize: 16, color: '#5f6368', margin: '0 0 32px' },
  emailInput: {
    width: '100%', padding: '13px 15px', border: '1px solid #dadce0',
    borderRadius: 4, fontSize: 16, color: '#202124', outline: 'none',
    boxSizing: 'border-box', marginBottom: 24, background: '#f8f9fa',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
  },
  dividerLine: { flex: 1, height: 1, background: '#e0e0e0' },
  dividerText: { color: '#5f6368', fontSize: 12, whiteSpace: 'nowrap' },
  vaultlessBtn: {
    width: '100%',
    padding: '12px',
    background: '#000',
    color: '#00ff88',
    border: 'none',
    borderRadius: 4,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    letterSpacing: 0.5,
    marginBottom: 12,
    fontFamily: "'Courier New', monospace",
    transition: 'opacity 0.2s',
  },
  vaultlessIcon: { fontSize: 18 },
  vaultlessTagline: { color: '#5f6368', fontSize: 12, margin: '0 0 32px' },
  footer: {
    borderTop: '1px solid #e0e0e0',
    paddingTop: 16,
    display: 'flex',
    justifyContent: 'center',
    gap: 24,
  },
  link: { color: '#5f6368', fontSize: 12, textDecoration: 'none' },
};
