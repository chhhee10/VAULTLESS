import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVaultless } from '../lib/VaultlessContext';
import { getWalletBalance, requestAirdrop, sendSol, getWalletFromSecretKey } from '../lib/solana';
import { useKeystrokeDNA, useMouseDNA, buildCombinedVector, quantizeBiometrics } from '../hooks/behaviouralEngine';
import { authenticate as authenticateFuzzyExtractor } from '../hooks/fuzzyExtractor';

const PHRASE = 'Secure my account';

export default function Dashboard() {
  const navigate = useNavigate();
  const { secretKey, setSecretKey, helperData, walletAddress, solanaLinks, demoMode, sessionActive, clearEnrollment } = useVaultless();
  
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
  
  // Stub wallet used in demo mode so we never call getWalletFromSecretKey with a non-hex stub key
  const DEMO_WALLET_ADDRESS = 'DEMO1111111111111111111111111111111111111111';

  useEffect(() => {
    // Session guard: If we haven't just authenticated, go back to portal
    if (!sessionActive) {
      navigate('/gmail');
      return;
    }

    // In demo mode, use a stub wallet
    if (demoMode) {
      if (!secretKey) {
        navigate('/gmail');
        return;
      }
      setBioWallet({ publicKey: { toString: () => DEMO_WALLET_ADDRESS } });
      setBalance(0);
      return;
    }
    // Live mode
    if (walletAddress) {
      setBioWallet({ publicKey: { toString: () => walletAddress } });
      refreshBalance(walletAddress);
      return;
    }
    navigate('/gmail');
  }, [secretKey, demoMode, walletAddress, sessionActive]);

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
    if (demoMode) { setTxStatus('Airdrop not available in demo mode.'); setTimeout(() => setTxStatus(''), 2500); return; }
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
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={s.resetBtn} onClick={() => { clearEnrollment(); navigate('/'); }}>Reset Identity</button>
          <button style={s.reEnrollBtn} onClick={() => navigate('/enroll')}>Re-enroll Identity ↺</button>
          <button style={s.logoutBtn} onClick={() => { setSecretKey(null); navigate('/gmail'); }}>Sign Out</button>
        </div>
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

          <div style={s.reEnrollCard}>
            <div style={s.reEnrollTitle}>⬡ BEHAVIOURAL DNA</div>
            <p style={s.reEnrollDesc}>Your typing pattern is your key. If your rhythm has drifted or you want to update your identity on-chain, re-enroll to generate a new cryptographic profile.</p>
            <button style={s.reEnrollCta} onClick={() => navigate('/enroll')}>Re-enroll Identity ↺</button>
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
  root: { minHeight: '100vh', background: '#050508', color: '#fff', fontFamily: "'Inter', system-ui, sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  logo: { fontSize: 15, fontWeight: 800, letterSpacing: '0.2em', background: 'linear-gradient(90deg, #00FF4D, #00b8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  logoutBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', padding: '8px 18px', borderRadius: 100, cursor: 'pointer', fontSize: 11, letterSpacing: '0.1em', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', fontWeight: 700 },
  resetBtn: { background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.25)', color: '#ff3b3b', padding: '8px 18px', borderRadius: 100, cursor: 'pointer', fontSize: 11, letterSpacing: '0.1em', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', fontWeight: 700 },
  reEnrollBtn: { background: 'transparent', border: '1px solid rgba(0,255,77,0.25)', color: '#00FF4D', padding: '8px 18px', borderRadius: 100, cursor: 'pointer', fontSize: 11, letterSpacing: '0.1em', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', fontWeight: 700 },
  reEnrollCard: { background: 'rgba(0,255,77,0.04)', border: '1px solid rgba(0,255,77,0.1)', borderRadius: 16, padding: '20px 24px' },
  reEnrollTitle: { color: '#00FF4D', fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', marginBottom: 10, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase' },
  reEnrollDesc: { color: 'rgba(255,255,255,0.35)', fontSize: 13, lineHeight: 1.7, margin: '0 0 16px' },
  reEnrollCta: { background: 'transparent', border: '1px solid rgba(0,255,77,0.25)', color: '#00FF4D', padding: '9px 20px', borderRadius: 100, cursor: 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase' },
  container: { display: 'flex', flexWrap: 'wrap', gap: 24, padding: '32px 40px', maxWidth: 1200, margin: '0 auto' },
  leftCol: { flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: 20 },
  rightCol: { flex: '1 1 300px' },

  walletCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32, position: 'relative', overflow: 'hidden', backdropFilter: 'blur(20px)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', marginBottom: 24, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase' },
  networkBadge: { background: 'rgba(0,255,77,0.1)', color: '#00FF4D', padding: '4px 10px', borderRadius: 100, fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '0.1em' },
  balance: { fontSize: 48, fontWeight: 700, marginBottom: 8, color: '#fff', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em' },
  address: { fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: "'JetBrains Mono', monospace", wordBreak: 'break-all', marginBottom: 32 },
  actionRow: { display: 'flex', gap: 12 },
  actionBtn: { flex: 1, background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', padding: '14px', borderRadius: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: 13 },

  sendCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32, backdropFilter: 'blur(20px)' },
  sendTitle: { fontSize: 14, fontWeight: 700, marginBottom: 20, color: '#fff', letterSpacing: '0.05em', fontFamily: "'Syne', sans-serif" },
  input: { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 16px', color: '#fff', fontSize: 14, marginBottom: 12, outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif', transition: 'border-color 0.2s'" },
  sendBtn: { width: '100%', background: '#00FF4D', color: '#000', border: 'none', padding: '15px', borderRadius: 100, fontSize: 11, fontWeight: 800, cursor: 'pointer', marginTop: 8, letterSpacing: '0.15em', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', boxShadow: '0 8px 32px rgba(0,255,77,0.25)' },
  status: { marginTop: 16, fontSize: 12, color: '#00FF4D', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" },

  activityCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32, minHeight: 400, backdropFilter: 'blur(20px)' },
  emptyActivity: { color: 'rgba(255,255,255,0.2)', fontSize: 13, textAlign: 'center', marginTop: 60, fontFamily: "'JetBrains Mono', monospace" },
  eventLink: { display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', textDecoration: 'none', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.2s', marginBottom: 8, background: 'rgba(255,255,255,0.02)' },
  eventIcon: { width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,255,77,0.08)', color: '#00FF4D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, border: '1px solid rgba(0,255,77,0.15)' },
  eventBody: { flex: 1 },
  eventLabel: { color: '#fff', fontSize: 14, fontWeight: 500, marginBottom: 3 },
  eventTime: { color: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 40, width: '100%', maxWidth: 480, textAlign: 'center', backdropFilter: 'blur(20px)' },
  modalTitle: { fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 12, fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em' },
  modalDesc: { fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 24 },
  phrase: { fontSize: 20, color: '#00FF4D', fontFamily: "'JetBrains Mono', monospace", marginBottom: 32, background: 'rgba(0,255,77,0.06)', padding: '16px', borderRadius: 10, border: '1px solid rgba(0,255,77,0.15)' },
  modalInput: { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,255,77,0.2)', borderRadius: 10, padding: '16px', color: '#00FF4D', fontSize: 18, textAlign: 'center', outline: 'none', marginBottom: 24, boxSizing: 'border-box', fontFamily: "'JetBrains Mono', monospace" },
  cancelBtn: { background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: 13, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' },
};

