import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useVaultless } from '../lib/VaultlessContext';
import { getWalletBalance, sendSolWithPhantom } from '../lib/solana';
import { useKeystrokeDNA, useMouseDNA, buildCombinedVector, cosineSimilarity, classifyScore, detectStress } from '../hooks/behaviouralEngine';
import BinaryGlitchBackground from '../components/BinaryGlitchBackground';

const PHRASE = 'Secure my account';

export default function Dashboard() {
  const navigate = useNavigate();
  const { secretKey, setSecretKey, helperData, walletAddress, solanaLinks, demoMode, sessionActive, clearEnrollment, enrollmentVector, enrollmentKeystroke, enrollmentMouse } = useVaultless();
  
  const [bioWallet, setBioWallet] = useState(null);
  const [balance, setBalance] = useState(0);

  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [txStatus, setTxStatus] = useState('');
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  
  const keystroke = useKeystrokeDNA();
  const mouse = useMouseDNA();
  
  const DEMO_WALLET_ADDRESS = 'DEMO1111111111111111111111111111111111111111';

  useEffect(() => {
    if (!sessionActive) {
      navigate('/gmail');
      return;
    }
    if (demoMode) {
      if (!secretKey) {
        navigate('/gmail');
        return;
      }
      setBioWallet({ publicKey: { toString: () => DEMO_WALLET_ADDRESS } });
      setBalance(0);
      return;
    }
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
    const expectedPubKey = bioWallet.publicKey.toString(); 
    
    let simScore = cosineSimilarity(liveVector, enrollmentVector, kData, enrollmentKeystroke, mData, enrollmentMouse || null);
    if (demoMode) {
      simScore = Math.min(0.99, Math.max(0.01, simScore + (Math.random() * 0.02 - 0.01)));
    }

    const isStress = detectStress(kData, enrollmentKeystroke);
    const classification = classifyScore(simScore, isStress);
    
    if (classification === 'authenticated') {
      setTxStatus('Identity verified! Prompting Phantom wallet...');
      try {
        const sig = await sendSolWithPhantom(recipient, parseFloat(amount));
        setTxStatus(`Sent successfully! TX: ${sig.slice(0, 8)}...`);
        setRecipient('');
        setAmount('');
        refreshBalance(expectedPubKey);
      } catch(err) {
        setTxStatus('Transaction failed: ' + err.message);
      }
    } else if (classification === 'duress') {
      setTxStatus('Security breach detected (Duress). Transaction aborted.');
    } else {
      setTxStatus('Authentication rejected: DNA mismatch.');
    }
  };

  if (!bioWallet) {
    return (
      <div className="min-h-screen bg-[#f7f7f2] flex items-center justify-center">
        <div className="text-black text-xs font-mono uppercase tracking-[0.2em] animate-pulse font-bold">Initializing Biometric Core...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f2] font-sans flex flex-col relative overflow-hidden text-black selection:bg-[#00FF4D] selection:text-black pb-24">
      <BinaryGlitchBackground />
      
      {/* Header */}
      <header className="p-6 md:p-8 md:px-12 flex flex-row items-start md:items-center justify-between z-10 relative gap-4 md:gap-0">
        <button 
          onClick={() => navigate('/')}
          className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase hover:opacity-70 transition-opacity mt-2 md:mt-0 whitespace-nowrap"
        >
          ← VAULTLESS
        </button>
        <div className="grid grid-cols-2 md:flex justify-end items-center gap-2 md:gap-4 w-auto">
          <button 
            className="w-full md:w-auto text-[9px] md:text-[10px] font-mono font-bold uppercase tracking-[0.1em] px-2 py-2 md:px-5 md:py-2.5 rounded-full border-2 border-black hover:bg-black hover:text-white transition-colors whitespace-nowrap"
            onClick={() => { clearEnrollment(); navigate('/'); }}
          >
            Reset Identity
          </button>
          <button 
            className="w-full md:w-auto text-[9px] md:text-[10px] font-mono font-bold uppercase tracking-[0.1em] px-2 py-2 md:px-5 md:py-2.5 rounded-full border-2 border-[#00FF4D] bg-[#00FF4D] text-black hover:bg-[#00FF4D]/80 transition-colors shadow-[0_0_10px_rgba(0,255,77,0.2)] md:shadow-[4px_4px_0_0_#000] whitespace-nowrap"
            onClick={() => navigate('/enroll')}
          >
            Re-enroll ↺
          </button>
          <button 
            className="w-full md:w-auto col-span-2 md:col-span-1 text-[9px] md:text-[10px] font-mono font-bold uppercase tracking-[0.1em] px-2 py-2 md:px-5 md:py-2.5 rounded-full border-2 border-black text-black hover:bg-black hover:text-white transition-colors whitespace-nowrap"
            onClick={() => { setSecretKey(null); navigate('/gmail'); }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="relative z-10 max-w-6xl mx-auto w-full px-8 md:px-12 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Wallet Hero Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-[#0a0a0a] border-2 border-black rounded-3xl p-5 md:p-12 text-white shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-8">
                <span className="text-white/60 text-[10px] font-mono tracking-[0.3em] uppercase">Biometric Wallet</span>
                <span className="bg-[#00FF4D] text-black px-3 py-1.5 rounded-full text-[9px] font-mono font-bold tracking-[0.2em] uppercase">Devnet</span>
              </div>
              
              <div className="font-display text-4xl md:text-7xl font-bold tracking-[1px] uppercase mb-4">
                {balance.toFixed(4)} <span className="text-[#00FF4D]">SOL</span>
              </div>
              
              <div className="text-white/50 text-[10px] md:text-xs font-mono break-all mb-10 bg-white/5 inline-block p-3 rounded-xl border border-white/10">
                {bioWallet.publicKey.toString()}
              </div>
              

            </motion.div>

            {/* Send Crypto Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-[#0a0a0a] border-2 border-black rounded-3xl p-5 md:p-10 text-white shadow-2xl"
            >
              <h3 className="font-display text-2xl md:text-3xl font-bold tracking-[1px] uppercase mb-8">Send Crypto</h3>
              
              <div className="space-y-4 mb-8">
                <input 
                  className="w-full bg-white/5 border border-white/10 focus:border-[#00FF4D] rounded-xl px-6 py-5 text-white font-mono text-sm outline-none transition-colors placeholder:text-white/30"
                  placeholder="Recipient Address" 
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                />
                <input 
                  className="w-full bg-white/5 border border-white/10 focus:border-[#00FF4D] rounded-xl px-6 py-5 text-white font-mono text-sm outline-none transition-colors placeholder:text-white/30"
                  placeholder="Amount (SOL)" 
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
              
              <button 
                className="w-full bg-[#00FF4D] hover:bg-[#00FF4D]/90 text-black font-mono text-xs font-bold uppercase tracking-[1px] py-5 rounded-full transition-transform hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(0,255,77,0.3)]"
                onClick={startSend}
              >
                Sign & Send →
              </button>
              
              {txStatus && (
                <div className="mt-6 text-[#00FF4D] text-[10px] font-mono tracking-[0.1em] text-center uppercase bg-[#00FF4D]/10 border border-[#00FF4D]/20 py-3 rounded-xl">
                  {txStatus}
                </div>
              )}
            </motion.div>
            
          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Re-enroll Callout */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-[#0a0a0a] border-2 border-black rounded-3xl p-5 md:p-8 text-white shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#0088ff]/10 blur-[50px] rounded-full pointer-events-none" />
              <div className="text-[#0088ff] text-[10px] font-mono tracking-[0.2em] uppercase font-bold mb-4 relative z-10">⬡ DNA Drift Detection</div>
              <p className="text-white/70 text-sm leading-relaxed mb-6 font-sans relative z-10">
                Your typing pattern is your key. If your keyboard rhythm has naturally drifted over time, re-enroll to generate an updated cryptographic profile.
              </p>
              <button 
                className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-4 rounded-full font-mono text-[10px] uppercase tracking-[0.1em] font-bold transition-all relative z-10"
                onClick={() => navigate('/enroll')}
              >
                Re-calibrate Profile
              </button>
            </motion.div>

            {/* Activity Feed */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-[#0a0a0a] border-2 border-black rounded-3xl p-5 md:p-8 min-h-[400px] text-white shadow-2xl"
            >
              <h3 className="font-display text-xl md:text-2xl font-bold tracking-[1px] uppercase mb-8">On-Chain Activity</h3>
              
              {solanaLinks.length === 0 ? (
                <div className="text-white/40 text-[10px] font-mono text-center mt-20 uppercase tracking-[0.2em]">No activity yet.</div>
              ) : (
                <div className="space-y-4">
                  {solanaLinks.map((link, i) => (
                    <a 
                      key={i} 
                      href={link.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="block bg-white/5 border border-white/10 hover:border-[#00FF4D]/50 hover:bg-white/10 rounded-xl p-4 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#00FF4D]/10 text-[#00FF4D] flex items-center justify-center font-mono text-xs border border-[#00FF4D]/20 group-hover:scale-110 transition-transform">
                          ⬡
                        </div>
                        <div>
                          <div className="text-white/90 text-sm font-sans font-bold mb-1">{link.label}</div>
                          <div className="text-white/50 text-[10px] font-mono tracking-[0.1em]">{link.timestamp}</div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </motion.div>

          </div>
        </div>
      </main>

      {/* Send Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#f7f7f2]/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-[#0a0a0a] border-2 border-black rounded-3xl p-5 md:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.4)] text-center relative overflow-hidden text-white"
            >
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-[1px] uppercase mb-4 relative z-10">Sign Transaction</h2>
              <p className="text-white/70 text-sm mb-8 font-sans relative z-10 leading-relaxed">
                Type the phrase below to reconstruct your secret key on the fly and sign this transfer.
              </p>
              
              <div className="text-2xl md:text-3xl text-white/70 tracking-widest font-mono mb-10 opacity-70 relative z-10">
                "{PHRASE}"
              </div>
              
              <div className="relative mb-8 max-w-sm mx-auto z-10">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#00FF4D]/50 font-mono text-xl pointer-events-none">
                  &gt;
                </div>
                <input
                  autoFocus
                  className="w-full bg-black border-2 border-white/10 focus:border-[#00FF4D] rounded-xl text-[#00FF4D] text-lg text-left pl-14 pr-6 py-5 outline-none tracking-widest font-mono transition-all placeholder:text-white/10 shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)] focus:shadow-[0_0_20px_rgba(0,255,77,0.1)]"
                  value={currentInput}
                  onChange={e => setCurrentInput(e.target.value)}
                  onKeyDown={keystroke.onKeyDown}
                  onKeyUp={handleKeyUp}
                  placeholder=""
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              
              <p className="text-white/80 text-[10px] font-mono uppercase tracking-[0.2em] mb-6">Press Enter ⏎ to submit</p>

              <button 
                className="text-white/50 hover:text-white text-[10px] font-mono uppercase tracking-[0.2em] transition-colors relative z-10"
                onClick={() => setShowAuthModal(false)}
              >
                Cancel Transaction
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
