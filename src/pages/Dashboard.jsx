import { useNavigate } from 'react-router-dom';
import { useVaultless } from '../lib/VaultlessContext';

const FAKE_EMAILS = [
  { from: 'Google Security', subject: 'Your account was accessed from a new device', time: '2:14 PM', unread: true, preview: 'We noticed a sign-in to your account from...' },
  { from: 'GitHub', subject: 'Your pull request was merged', time: '1:47 PM', unread: true, preview: 'main ← feature/behavioural-auth · Merged by...' },
  { from: 'Ethereum Foundation', subject: 'EthDenver 2026 — Your proposal was accepted', time: '11:22 AM', unread: false, preview: 'Congratulations! We are pleased to inform...' },
  { from: 'Anthropic', subject: 'Claude API — Monthly Usage Summary', time: '9:05 AM', unread: false, preview: 'Here is your API usage summary for March...' },
  { from: 'LinkedIn', subject: '14 people viewed your profile', time: 'Yesterday', unread: false, preview: 'You\'re getting noticed! Here are some people...' },
  { from: 'Notion', subject: 'Weekly digest — 3 updates in your workspace', time: 'Yesterday', unread: false, preview: 'Here\'s what happened this week in your...' },
  { from: 'Stripe', subject: 'Payment received: $2,400.00', time: 'Mar 10', unread: false, preview: 'A payment of $2,400.00 has been deposited...' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { lastAuthScore, etherscanLinks, walletAddress, demoMode } = useVaultless();

  return (
    <div style={styles.root}>
      {/* Gmail sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.gmailLogo}>
          <span style={{ color: '#4285F4' }}>G</span>
          <span style={{ color: '#EA4335' }}>m</span>
          <span style={{ color: '#FBBC05' }}>a</span>
          <span style={{ color: '#4285F4' }}>i</span>
          <span style={{ color: '#34A853' }}>l</span>
        </div>
        <button style={styles.composeBtn}>✎ Compose</button>
        {['Inbox', 'Starred', 'Sent', 'Drafts', 'Spam', 'Trash'].map(label => (
          <div key={label} style={{ ...styles.navItem, ...(label === 'Inbox' ? styles.navItemActive : {}) }}>
            {label === 'Inbox' && <span style={styles.inboxCount}>7</span>}
            {label}
          </div>
        ))}
      </div>

      {/* Email list */}
      <div style={styles.emailList}>
        <div style={styles.emailListHeader}>
          <span style={styles.inboxTitle}>Inbox</span>
          <span style={styles.emailCount}>1–7 of 7</span>
        </div>
        {FAKE_EMAILS.map((email, i) => (
          <div key={i} style={{ ...styles.emailRow, background: email.unread ? '#fff' : '#f8f9fa', fontWeight: email.unread ? 600 : 400 }}>
            <div style={styles.emailFrom}>{email.from}</div>
            <div style={styles.emailBody}>
              <span style={styles.emailSubject}>{email.subject}</span>
              <span style={styles.emailPreview}> — {email.preview}</span>
            </div>
            <div style={styles.emailTime}>{email.time}</div>
          </div>
        ))}
      </div>

      {/* VAULTLESS Security Panel */}
      <div style={styles.securityPanel}>
        <div style={styles.panelHeader}>
          <span style={styles.panelLogo}>⬡</span>
          <span style={styles.panelTitle}>VAULTLESS</span>
        </div>

        <div style={styles.statusBadge}>
          <span style={styles.greenDot} />
          SESSION AUTHENTICATED
        </div>

        {lastAuthScore !== null && (
          <div style={styles.metric}>
            <div style={styles.metricLabel}>MATCH SCORE</div>
            <div style={styles.metricValue}>{(lastAuthScore * 100).toFixed(1)}%</div>
          </div>
        )}

        {walletAddress && (
          <div style={styles.metric}>
            <div style={styles.metricLabel}>WALLET</div>
            <div style={{ ...styles.metricValue, fontSize: 10, wordBreak: 'break-all' }}>
              {walletAddress.slice(0, 20)}...
            </div>
          </div>
        )}

        <div style={styles.metricLabel} >CHAIN EVENTS</div>
        <div style={styles.eventLog}>
          {etherscanLinks.length === 0 ? (
            <div style={styles.noEvents}>No events yet</div>
          ) : (
            etherscanLinks.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noreferrer" style={styles.eventLink}>
                <span style={styles.eventDot} />
                <span style={styles.eventLabel}>{link.label}</span>
                <span style={styles.eventTime}>{link.timestamp}</span>
              </a>
            ))
          )}
        </div>

        <div style={styles.panelFooter}>
          <button style={styles.logoutBtn} onClick={() => navigate('/gmail')}>
            Sign Out
          </button>
          {demoMode && (
            <button style={styles.duressTestBtn} onClick={() => navigate('/auth')}>
              Test Duress →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  root: { display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif', background: '#f6f8fc', overflow: 'hidden' },
  sidebar: { width: 240, background: '#f6f8fc', padding: '16px 8px', flexShrink: 0, borderRight: '1px solid #e0e0e0' },
  gmailLogo: { fontSize: 22, fontWeight: 500, padding: '8px 16px', marginBottom: 8, letterSpacing: -0.5 },
  composeBtn: { width: '80%', background: '#fff', border: '1px solid #dadce0', borderRadius: 16, padding: '12px 20px', margin: '8px 16px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 500, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  navItem: { padding: '8px 16px', borderRadius: '0 16px 16px 0', cursor: 'pointer', fontSize: 14, color: '#202124', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navItemActive: { background: '#fce8e6', fontWeight: 700, color: '#202124' },
  inboxCount: { background: '#d93025', color: '#fff', fontSize: 11, padding: '2px 6px', borderRadius: 10, marginLeft: 'auto', marginRight: 8 },
  emailList: { flex: 1, overflowY: 'auto', borderRight: '1px solid #e0e0e0' },
  emailListHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 8px', borderBottom: '1px solid #e0e0e0' },
  inboxTitle: { fontSize: 18, fontWeight: 400, color: '#202124' },
  emailCount: { fontSize: 13, color: '#5f6368' },
  emailRow: { display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', gap: 16, fontSize: 14 },
  emailFrom: { width: 180, flexShrink: 0, color: '#202124', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  emailBody: { flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  emailSubject: { color: '#202124' },
  emailPreview: { color: '#5f6368', fontWeight: 400 },
  emailTime: { color: '#5f6368', fontSize: 12, flexShrink: 0 },
  securityPanel: { width: 280, background: '#0d0d0d', padding: '24px 20px', color: '#fff', fontFamily: "'Courier New', monospace", display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flexShrink: 0 },
  panelHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  panelLogo: { color: '#00ff88', fontSize: 20 },
  panelTitle: { color: '#00ff88', fontWeight: 700, fontSize: 13, letterSpacing: 3 },
  statusBadge: { background: '#00ff8815', border: '1px solid #00ff8833', borderRadius: 4, padding: '8px 12px', color: '#00ff88', fontSize: 11, letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 8 },
  greenDot: { width: 6, height: 6, background: '#00ff88', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' },
  metric: { background: '#111', borderRadius: 6, padding: '12px 14px' },
  metricLabel: { color: '#444', fontSize: 10, letterSpacing: 2, marginBottom: 4 },
  metricValue: { color: '#00ff88', fontSize: 20, fontWeight: 700 },
  eventLog: { background: '#060606', border: '1px solid #111', borderRadius: 6, padding: '12px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' },
  noEvents: { color: '#333', fontSize: 12, textAlign: 'center', padding: 8 },
  eventLink: { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', fontSize: 11 },
  eventDot: { width: 5, height: 5, background: '#00ff88', borderRadius: '50%', flexShrink: 0 },
  eventLabel: { color: '#00ff88', flex: 1 },
  eventTime: { color: '#444', fontSize: 10 },
  panelFooter: { marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 },
  logoutBtn: { background: 'transparent', border: '1px solid #222', color: '#555', padding: '8px', fontSize: 11, cursor: 'pointer', borderRadius: 4, letterSpacing: 1, fontFamily: "'Courier New', monospace" },
  duressTestBtn: { background: '#ffaa0022', border: '1px solid #ffaa0044', color: '#ffaa00', padding: '8px', fontSize: 11, cursor: 'pointer', borderRadius: 4, letterSpacing: 1, fontFamily: "'Courier New', monospace" },
};
