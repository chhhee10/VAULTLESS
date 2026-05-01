import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVaultless } from '../lib/VaultlessContext';
import { getWalletBalance, requestAirdrop, sendSol, getWalletFromSecretKey } from '../lib/solana';
import { useKeystrokeDNA, useMouseDNA, buildCombinedVector, quantizeBiometrics } from '../hooks/behaviouralEngine';
import { authenticate as authenticateFuzzyExtractor } from '../hooks/fuzzyExtractor';

const PHRASE = 'Secure my account';

export default function Dashboard() {
  const navigate = useNavigate();
  const { secretKey, helperData, solanaLinks, clearEnrollment } = useVaultless();
  
  const [bioWallet, setBioWallet] = useState(null);
  const [balance, setBalance] = useState(0);
  const [isAirdropping, setIsAirdropping] = useState(false);
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [txStatus, setTxStatus] = useState('');
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  
  const keystroke = useKeystrokeDNA();
  const mouse = useMouseDNA();
  
  useEffect(() => {
    if (!secretKey) {
      navigate('/');
      return;
    }
    try {
      const kp = getWalletFromSecretKey(secretKey);
      setBioWallet(kp);
      refreshBalance(kp.publicKey.toString());
    } catch(e) {
      console.error(e);
    }
  }, [secretKey]);

  const refreshBalance = async (pubkey) => {
    try {
      const bal = await getWalletBalance(pubkey);
      setBalance(bal);
    } catch(e) {
      console.error(e);
    }
  };

  const handleAirdrop = async () => {
    if (!bioWallet) return;
    setIsAirdropping(true);
    setTxStatus('Requesting Devnet SOL...');
    try {
      await requestAirdrop(bioWallet.publicKey.toString());
      setTxStatus('Airdrop successful!');
      refreshBalance(bioWallet.publicKey.toString());
      setTimeout(() => setTxStatus(''), 3000);
    } catch(e) {
      setTxStatus('Airdrop failed. Devnet might be rate-limited.');
      setTimeout(() => setTxStatus(''), 4000);
    }
    setIsAirdropping(false);
  };

  const startSend = () => {
    if (!recipient || !amount || isNaN(amount)) {
      setTxStatus('Invalid recipient or amount');
      return;
    }
    setTxStatus('');
    setCurrentInput('');
    keystroke.reset();
    mouse.reset();
    mouse.startCapture();
    setShowAuthModal(true);
  };

  const handleKeyUp = async (e) => {
    keystroke.onKeyUp(e);
    if (e.key === 'Enter' && currentInput.trim() === PHRASE) {
      await processSend();
    }
  };

  const processSend = async () => {
    setShowAuthModal(false);
    setTxStatus('Verifying behavioral DNA...');
    
    const kData = keystroke.extractVector(PHRASE);
    const mData = mouse.extractVector();
    if (!kData) {
      setTxStatus('Authentication failed: insufficient data.');
      return;
    }
    
    const liveVector = buildCombinedVector(kData, mData);
    const liveDiscrete = quantizeBiometrics(liveVector);
    const expectedPubKey = bioWallet.publicKey.toString(); // We mock the expected pubkey for the fuzzy extractor
    
    const recoveredKey = authenticateFuzzyExtractor(liveDiscrete, helperData, expectedPubKey);
    
    if (recoveredKey) {
      // Signature is valid because the key matches!
      setTxStatus('Identity verified! Signing transaction...');
      try {
        const kp = getWalletFromSecretKey(recoveredKey);
        const sig = await sendSol(kp, recipient, parseFloat(amount));
        setTxStatus(`Sent successfully! TX: ${sig.slice(0, 8)}...`);
        setRecipient('');
        setAmount('');
        refreshBalance(kp.publicKey.toString());
      } catch(err) {
        setTxStatus('Transaction failed: ' + err.message);
      }
    } else {
      setTxStatus('Authentication rejected: DNA mismatch.');
    }
  };

  if (!bioWallet) return <div style={s.root}><h2 style={{color:'#fff', textAlign:'center', marginTop:100}}>Loading Wallet...</h2></div>;

  return (
    <div style={s.root}>
      <div style={s.header}>
        <div style={s.logo}>VAULTLESS</div>
        <button style={s.logoutBtn} onClick={() => { clearEnrollment(); navigate('/'); }}>Sign Out</button>
      </div>

      <div style={s.container}>
        {/* Left Col: Wallet Card & Send Form */}
        <div style={s.leftCol}>
          <div style={s.walletCard}>
            <div style={s.cardHeader}>
              <span>BIOMETRIC WALLET</span>
              <span style={s.networkBadge}>Devnet</span>
            </div>
            <div style={s.balance}>{balance.toFixed(4)} SOL</div>
            <div style={s.address}>{bioWallet.publicKey.toString()}</div>
            
            <div style={s.actionRow}>
              <button style={s.actionBtn} onClick={handleAirdrop} disabled={isAirdropping}>
                {isAirdropping ? 'Airdropping...' : 'Request Airdrop ↓'}
              </button>
            </div>
          </div>

          <div style={s.sendCard}>
            <h3 style={s.sendTitle}>Send Crypto</h3>
            <input 
              style={s.input} 
              placeholder="Recipient Address" 
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
            />
            <input 
              style={s.input} 
              placeholder="Amount (SOL)" 
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            <button style={s.sendBtn} onClick={startSend}>
              Sign & Send
            </button>
            {txStatus && <div style={s.status}>{txStatus}</div>}
          </div>
        </div>

        {/* Right Col: Activity */}
        <div style={s.rightCol}>
          <div style={s.activityCard}>
            <h3 style={s.sendTitle}>Security & Activity</h3>
            {solanaLinks.length === 0 ? (
              <div style={s.emptyActivity}>No on-chain activity yet.</div>
            ) : (
              solanaLinks.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noreferrer" style={s.eventLink}>
                  <div style={s.eventIcon}>⬡</div>
                  <div style={s.eventBody}>
                    <div style={s.eventLabel}>{link.label}</div>
                    <div style={s.eventTime}>{link.timestamp}</div>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <h2 style={s.modalTitle}>Biometric Signature Required</h2>
            <p style={s.modalDesc}>Type the phrase below to reconstruct your secret key and sign this transaction.</p>
            <div style={s.phrase}>"{PHRASE}"</div>
            <input
              autoFocus
              style={s.modalInput}
              value={currentInput}
              onChange={e => setCurrentInput(e.target.value)}
              onKeyDown={keystroke.onKeyDown}
              onKeyUp={handleKeyUp}
              placeholder="Type phrase here..."
              autoComplete="off"
              spellCheck="false"
            />
            <button style={s.cancelBtn} onClick={() => setShowAuthModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  root: { minHeight: '100vh', background: '#0a0b0e', color: '#fff', fontFamily: 'Inter, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 40px', borderBottom: '1px solid #1a1b23' },
  logo: { fontSize: 24, fontWeight: 800, letterSpacing: 4, background: 'linear-gradient(90deg, #00ff88, #00b8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  logoutBtn: { background: 'transparent', border: '1px solid #333', color: '#888', padding: '8px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13 },
  container: { display: 'flex', flexWrap: 'wrap', gap: 32, padding: '40px', maxWidth: 1200, margin: '0 auto' },
  leftCol: { flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: 24 },
  rightCol: { flex: '1 1 300px' },
  
  walletCard: { background: 'linear-gradient(145deg, #161821, #0f1016)', border: '1px solid #2a2c38', borderRadius: 24, padding: 32, position: 'relative', overflow: 'hidden' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#8892b0', fontSize: 12, fontWeight: 600, letterSpacing: 1.5, marginBottom: 24 },
  networkBadge: { background: '#00ff8822', color: '#00ff88', padding: '4px 10px', borderRadius: 12, fontSize: 10 },
  balance: { fontSize: 48, fontWeight: 700, marginBottom: 8, color: '#fff' },
  address: { fontSize: 13, color: '#666', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: 32 },
  actionRow: { display: 'flex', gap: 12 },
  actionBtn: { flex: 1, background: '#2a2d3d', color: '#fff', border: 'none', padding: '14px', borderRadius: 16, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' },
  
  sendCard: { background: '#12141c', border: '1px solid #1f2230', borderRadius: 24, padding: 32 },
  sendTitle: { fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#e2e8f0' },
  input: { width: '100%', background: '#0a0b0e', border: '1px solid #2a2c38', borderRadius: 12, padding: '16px', color: '#fff', fontSize: 15, marginBottom: 16, outline: 'none', boxSizing: 'border-box' },
  sendBtn: { width: '100%', background: 'linear-gradient(90deg, #00ff88, #00b8ff)', color: '#000', border: 'none', padding: '16px', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
  status: { marginTop: 16, fontSize: 14, color: '#00ff88', textAlign: 'center' },
  
  activityCard: { background: '#12141c', border: '1px solid #1f2230', borderRadius: 24, padding: 32, minHeight: 400 },
  emptyActivity: { color: '#666', fontSize: 14, textAlign: 'center', marginTop: 60 },
  eventLink: { display: 'flex', alignItems: 'center', gap: 16, padding: '16px', textDecoration: 'none', borderRadius: 16, border: '1px solid transparent', transition: 'all 0.2s', marginBottom: 8, background: '#161821' },
  eventIcon: { width: 40, height: 40, borderRadius: '50%', background: '#00ff8811', color: '#00ff88', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 },
  eventBody: { flex: 1 },
  eventLabel: { color: '#e2e8f0', fontSize: 15, fontWeight: 500, marginBottom: 4 },
  eventTime: { color: '#64748b', fontSize: 12 },
  
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: '#12141c', border: '1px solid #2a2c38', borderRadius: 24, padding: 40, width: '100%', maxWidth: 480, textAlign: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 12 },
  modalDesc: { fontSize: 14, color: '#8892b0', lineHeight: 1.5, marginBottom: 24 },
  phrase: { fontSize: 24, color: '#00ff88', fontFamily: 'monospace', marginBottom: 32 },
  modalInput: { width: '100%', background: '#0a0b0e', border: '1px solid #00ff8844', borderRadius: 12, padding: '16px', color: '#00ff88', fontSize: 18, textAlign: 'center', outline: 'none', marginBottom: 24, boxSizing: 'border-box' },
  cancelBtn: { background: 'transparent', border: 'none', color: '#64748b', fontSize: 14, cursor: 'pointer' },
};
