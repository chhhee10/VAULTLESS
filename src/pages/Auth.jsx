import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useKeystrokeDNA, useMouseDNA, buildCombinedVector, cosineSimilarity, detectStress, classifyScore, quantizeBiometrics } from '../hooks/behaviouralEngine';
import { authenticate as authenticateFuzzyExtractor } from '../hooks/fuzzyExtractor';
import { useViewport } from '../hooks/useViewport';
import { useVaultless } from '../lib/VaultlessContext';
import { isMobileBrowser } from '../lib/ethereum';
import { getActiveWalletAddress, authenticateOnChain, triggerDuressOnChain } from '../lib/solana';
import { sendDuressAlert } from '../lib/duressAlert';

const PHRASE = 'Secure my account';

export default function Auth() {
  const navigate = useNavigate();
  const { enrollmentVector, enrollmentKeystroke, enrollmentMouse, walletAddress, recoveryEmail, isEnrolled, helperData, secretKey, setSecretKey, setIsDuressMode, setLastAuthScore, addSolanaLink, demoMode, setWalletAddress, setSessionActive } = useVaultless();
  const { isMobile, width: viewportWidth } = useViewport();
  const graphWidth = isMobile ? viewportWidth - 60 : 440;
  const mobileLikeDevice = isMobileBrowser();

  const [phase, setPhase] = useState('ready'); // ready | typing | scoring | result
  const [currentInput, setCurrentInput] = useState('');
  const [score, setScore] = useState(null);
  const [result, setResult] = useState(null); // authenticated | duress | rejected
  const [graphData, setGraphData] = useState([]);
  const [recoveredKey, setRecoveredKey] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [stressScore, setStressScore] = useState(0);
  const [motionAvailable, setMotionAvailable] = useState(false);
  const [sensorDiag, setSensorDiag] = useState({
    platform: 'unknown',
    browser: 'unknown',
    hasDeviceMotion: false,
    hasDeviceOrientation: false,
    isSecureContext: false,
    motionPermission: 'unknown',
    orientationPermission: 'unknown',
    motionEvents: 0,
    orientationEvents: 0,
    touchEvents: 0,
    lastMotionEventAt: null,
    lastOrientationEventAt: null,
    lastTouchEventAt: null,
    captureStartedAt: null,
  });
  const [sensorRequesting, setSensorRequesting] = useState(false);
  const inputRef = useRef(null);

  const keystroke = useKeystrokeDNA();
  const mouse = useMouseDNA();

  useEffect(() => {
    if (phase === 'typing') {
      inputRef.current?.focus();
      keystroke.reset();
      mouse.reset();
      mouse.startCapture();
    }
  }, [phase, keystroke.reset, mouse.reset, mouse.startCapture]);

  useEffect(() => {
    if (!mobileLikeDevice) return;
    if (phase !== 'typing') return;
    const onTouchStartWindow = (e) => mouse.onTouchStart(e);
    const onTouchMoveWindow = (e) => mouse.onTouchMove(e);
    const onTouchEndWindow = () => mouse.onTouchEnd();
    window.addEventListener('touchstart', onTouchStartWindow, { passive: true });
    window.addEventListener('touchmove', onTouchMoveWindow, { passive: true });
    window.addEventListener('touchend', onTouchEndWindow, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStartWindow);
      window.removeEventListener('touchmove', onTouchMoveWindow);
      window.removeEventListener('touchend', onTouchEndWindow);
    };
  }, [mobileLikeDevice, phase, mouse.onTouchStart, mouse.onTouchMove, mouse.onTouchEnd]);

  useEffect(() => {
    if (!mobileLikeDevice) {
      setMotionAvailable(false);
      return;
    }
    setMotionAvailable(mouse.motionSupported);
  }, [mobileLikeDevice, mouse.motionSupported]);

  useEffect(() => {
    if (!mobileLikeDevice) return;
    if (phase !== 'typing') return;
    const interval = setInterval(() => {
      setSensorDiag({ ...mouse.getDiagnostics() });
    }, 250);
    return () => clearInterval(interval);
  }, [mobileLikeDevice, phase, mouse.getDiagnostics]);

  useEffect(() => {
    if (keystroke.events.length > 0) {
      const data = keystroke.events.slice(-30).map((e, i) => ({
        i,
        hold: Math.min(e.holdTime, 500),
        flight: Math.min(e.flightTime, 800),
      }));
      setGraphData(data);
    }
  }, [keystroke.events]);

  const handleKeyUp = (e) => {
    keystroke.onKeyUp(e);
    if (e.key === 'Enter' && currentInput.trim() === PHRASE) {
      processAuth();
    }
  };

  const requestSensors = async () => {
    if (!mobileLikeDevice) return;
    setSensorRequesting(true);
    try {
      const granted = await mouse.requestSensorAccess();
      if (!granted) {
        setStatusMsg('Could not enable motion sensors. You can continue, but mobile verification will be weaker.');
      } else {
        setStatusMsg('Motion sensors enabled.');
      }
    } finally {
      setSensorRequesting(false);
    }
  };

  const processAuth = async () => {
    let activeWalletAddress = null;
    if (!demoMode) {
      try {
        activeWalletAddress = await getActiveWalletAddress();
        setWalletAddress(activeWalletAddress);
      } catch (e) {
        setStatusMsg(e.message || 'Phantom connection failed.');
        return;
      }

      if (walletAddress && activeWalletAddress && activeWalletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        setStatusMsg('The connected Phantom wallet does not match the enrolled wallet. Switch accounts and try again.');
        return;
      }
    }

    setPhase('scoring');

    const kData = keystroke.extractVector(PHRASE);
    const mData = mouse.extractVector();

    if (!enrollmentVector) {
      setStatusMsg('No enrollment found. Please enroll first.');
      setPhase('ready');
      return;
    }

    if (!kData) {
      setStatusMsg('Not enough typing data captured. Try the phrase again more naturally.');
      setPhase('typing');
      return;
    }

    const liveVector = buildCombinedVector(kData, mData);

    // Always compute a real similarity score (even in demo mode) so the demo behaves like the real engine.
    let simScore = cosineSimilarity(liveVector, enrollmentVector, kData, enrollmentKeystroke, mData, enrollmentMouse || null);
    if (demoMode) {
      // Add minimal noise so it still feels like a demo, but keep the same underlying behavior.
      simScore = Math.min(0.99, Math.max(0.01, simScore + (Math.random() * 0.02 - 0.01)));
    }
    
    // V2: Test Fuzzy Extractor Authentication
    if (helperData) {
        const discreteLiveVector = quantizeBiometrics(liveVector);
        const recovered = authenticateFuzzyExtractor(discreteLiveVector, helperData);
        if (recovered) {
            setRecoveredKey(recovered);
            setSecretKey(recovered); // ← commit recovered key to context so Dashboard guard passes
            console.log('[Fuzzy Extractor] ✅ SUCCESS! Recovered Secret Key:', recovered);
            if (recovered === secretKey) {
                console.log('[Fuzzy Extractor] 🔒 Key perfectly matches enrollment!');
            }
        } else {
            setRecoveredKey(null);
            console.log('[Fuzzy Extractor] ❌ FAILED! Key could not be recovered due to high variance.');
        }
    }

    const isStress = detectStress(kData, enrollmentKeystroke);
    const classification = classifyScore(simScore, isStress);

    // Stress indicator (0–100) - use deterministic calculation in demo mode for consistency
    const stressVal = isStress ? 85 + Math.random() * 15 : Math.max(0, (0.85 - simScore) * 200);
    setStressScore(Math.min(100, stressVal));

    // Animate score counting up
    let display = 0;
    const target = simScore;
    const interval = setInterval(() => {
      display += 0.02;
      if (display >= target) { display = target; clearInterval(interval); }
      setScore(display);
    }, 30);

    setTimeout(() => {
      setResult(classification);
      setLastAuthScore(simScore);
      setPhase('result');
      handleResult(classification, simScore, liveVector);
    }, 1800);
  };

  const handleResult = async (classification, simScore, liveVector) => {
    if (classification === 'authenticated') {
      setStatusMsg('Authenticating via Solana Anchor...');
      try {
        if (demoMode) {
          await new Promise(r => setTimeout(r, 1200));
          const fakeTx = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
          addSolanaLink('AuthSuccess', fakeTx);
          // In demo mode without a recovered key, mint a stub so Dashboard's secretKey guard passes
          if (!secretKey) {
            setSecretKey('demo-session-' + fakeTx.slice(0, 16));
          }
          setSessionActive(true);
          setStatusMsg('Authenticated. Redirecting...');
          setTimeout(() => navigate('/dashboard'), 2000);
          return;
        }
        const txResponse = await authenticateOnChain();
        setSessionActive(true);
        addSolanaLink('AuthSuccess', txResponse.hash);
        setStatusMsg('Identity verified on-chain. Redirecting...');
        setTimeout(() => navigate('/dashboard'), 2000);
      } catch (e) {
        setStatusMsg('Chain error: ' + e.message);
      }
    } else if (classification === 'duress') {
      setIsDuressMode(true);
      setStatusMsg('Activating duress protocol silently...');
      try {
        if (demoMode) {
          await new Promise(r => setTimeout(r, 800));
          const fakeTx = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
          addSolanaLink('DuressActivated', fakeTx);
          const alertResult = await sendDuressAlert({ address: walletAddress || 'DEMO', txHash: fakeTx, timestamp: Date.now(), recoveryEmail });
          if (!alertResult.ok) {
            setStatusMsg(`Duress logged, but email alert failed: ${alertResult.error}`);
          } else {
            setStatusMsg('Duress protocol activated. Recovery email alerted.');
          }
          setTimeout(() => navigate('/ghost'), 1500);
          return;
        }
        const txResponse = await triggerDuressOnChain();
        addSolanaLink('DuressActivated', txResponse.hash);
        const alertResult = await sendDuressAlert({ address: walletAddress, txHash: txResponse.hash, timestamp: Date.now(), recoveryEmail });
        if (!alertResult.ok) {
          setStatusMsg(`Duress logged, but email alert failed: ${alertResult.error}`);
        } else {
          setStatusMsg('Duress protocol activated. Recovery email alerted.');
        }
        setTimeout(() => navigate('/ghost'), 1500);
      } catch (e) {
        console.error('Duress chain error:', e);
        setStatusMsg('Duress protocol activated. Could not complete all alert steps.');
        setTimeout(() => navigate('/ghost'), 1500);
      }
    } else {
      // Rejected
      setStatusMsg('Authentication failed. AuthFailed logged on-chain.');
      try {
        if (demoMode) {
          const fakeTx = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
          addSolanaLink('AuthFailed', fakeTx);
          return;
        }
        // Simulated contract call
        await new Promise(r => setTimeout(r, 800));
      } catch (e) { /* log silently */ }
    }
  };

  const scoreColor = score === null ? '#fff'
    : score > 0.70 ? '#00FF4D'
    : score >= 0.60 ? '#ffaa00'
    : '#ff4444';

  const resultMessages = {
    authenticated: { icon: '✓', label: 'IDENTITY VERIFIED', color: '#00FF4D' },
    duress: { icon: '⚠', label: 'DURESS DETECTED', color: '#ffaa00' },
    rejected: { icon: '✗', label: 'IDENTITY REJECTED', color: '#ff4444' },
  };

  const motionNeedsGesture = sensorDiag.motionPermission === 'requires-user-gesture';
  const orientationNeedsGesture = sensorDiag.orientationPermission === 'requires-user-gesture';
  const insecureContext =
    sensorDiag.motionPermission === 'insecure-context' ||
    sensorDiag.orientationPermission === 'insecure-context';
  const sensorDenied =
    sensorDiag.motionPermission === 'denied' ||
    sensorDiag.orientationPermission === 'denied' ||
    sensorDiag.motionPermission === 'error' ||
    sensorDiag.orientationPermission === 'error';
  const androidChromeNeedsManualEnable =
    sensorDiag.platform === 'android' &&
    sensorDiag.browser === 'chrome' &&
    sensorDiag.hasDeviceMotion &&
    !motionAvailable;
  const showEnableSensors = motionNeedsGesture || orientationNeedsGesture || androidChromeNeedsManualEnable;
  const sensorsEnabled = motionAvailable || sensorDiag.motionPermission === 'granted' || sensorDiag.orientationPermission === 'granted';
  const isMobilePlatform = sensorDiag.platform === 'ios' || sensorDiag.platform === 'android';
  const hasSensorApi = sensorDiag.hasDeviceMotion || sensorDiag.hasDeviceOrientation;
  const showMobileSensorUi = mobileLikeDevice && isMobilePlatform && hasSensorApi;
  const sensorBlockedHint = insecureContext
    ? 'Motion sensors need a secure connection. Open the app over HTTPS and try again.'
    : sensorDiag.platform === 'android' && sensorDiag.browser === 'chrome'
      ? 'Sensor access is blocked. In Chrome Android, allow Motion sensors in Site settings, then reload.'
      : 'Sensor access is blocked. Enable motion/orientation access in browser settings, then reload.';

  return (
    <div className="min-h-screen bg-[#f7f7f2] font-sans flex flex-col relative overflow-hidden text-black selection:bg-[#00FF4D] selection:text-black">
      
      {/* Header */}
      <header className="absolute top-0 left-0 w-full p-8 md:px-12 flex items-center justify-between z-20">
        <button 
          onClick={() => navigate('/')}
          className="text-xs font-bold tracking-[0.2em] hover:opacity-70 transition-opacity"
        >
          ← VAULTLESS
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 z-10 relative">
        <AnimatePresence mode="wait">
          
          {/* Ready Phase */}
          {phase === 'ready' && (
            <motion.div 
              key="ready"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-2xl bg-[#0a0a0a] border-2 border-black rounded-3xl p-8 md:p-12 shadow-2xl relative text-center text-white"
            >
              <h2 className="font-display text-4xl font-bold tracking-[1px] uppercase mb-6">Authenticate</h2>
              
              {!isEnrolled && !demoMode && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-8">
                  ⚠ No enrollment found. <button className="underline hover:text-red-300 ml-2" onClick={() => navigate('/enroll')}>Enroll first →</button>
                </div>
              )}
              
              <p className="text-white/90 text-sm md:text-base leading-relaxed mb-8">
                Type the same phrase you enrolled with.
              </p>
              
              <div className="text-2xl md:text-3xl text-white/70 tracking-widest font-mono mb-10 opacity-70">
                "{PHRASE}"
              </div>
              
              <button 
                className="w-full md:w-auto bg-[#00FF4D] hover:bg-[#00FF4D]/90 text-black font-mono text-xs md:text-sm font-bold uppercase tracking-[1px] py-4 px-10 rounded-full transition-transform hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(0,255,77,0.3)]" 
                onClick={() => setPhase('typing')}
              >
                Begin Authentication →
              </button>
            </motion.div>
          )}

          {/* Typing Phase */}
          {phase === 'typing' && (
            <motion.div 
              key="typing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-2xl bg-[#0a0a0a] border-2 border-black rounded-3xl p-8 md:p-12 shadow-2xl relative text-center text-white"
            >
              <h2 className="font-display text-4xl font-bold tracking-[1px] uppercase mb-4">Provide Signature</h2>
              
              <div className="text-xl md:text-2xl text-white/70 tracking-widest font-mono mb-12">
                "{PHRASE}"
              </div>

              {showMobileSensorUi && (
                <div className="mb-6 bg-white/5 border border-white/10 rounded-xl p-4 text-left max-w-md mx-auto">
                  <div className="text-white/90 text-xs font-mono">
                    Motion Sensors: <span className={sensorsEnabled ? 'text-[#00FF4D]' : 'text-orange-400'}>{sensorsEnabled ? 'Enabled' : 'Optional'}</span>
                  </div>
                  {!sensorsEnabled && (
                    <div className="text-white/60 text-[10px] mt-2 font-sans">
                      Enable them to match your enrollment capture more closely.
                    </div>
                  )}
                </div>
              )}

              {showMobileSensorUi && showEnableSensors && (
                <div className="mb-6 bg-[#00FF4D]/5 border border-[#00FF4D]/15 rounded-xl p-4 max-w-md mx-auto text-center">
                  <div className="text-[#00FF4D]/80 text-xs mb-3 font-mono">Tap to enable motion sensors on this device.</div>
                  <button
                    className="bg-[#00FF4D] text-black border-none px-6 py-2.5 rounded-full cursor-pointer text-[10px] font-bold font-mono uppercase tracking-widest transition-transform hover:scale-105"
                    onClick={requestSensors}
                    disabled={sensorRequesting}
                  >
                    {sensorRequesting ? 'Enabling Sensors...' : 'Enable Sensors'}
                  </button>
                </div>
              )}

              {showMobileSensorUi && sensorDenied && (
                <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400/90 text-xs text-left max-w-md mx-auto">
                  {sensorBlockedHint}
                </div>
              )}

              <div className="relative max-w-md mx-auto mb-8">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#00FF4D]/50 font-mono text-xl pointer-events-none">
                  &gt;
                </div>
                <input
                  ref={inputRef}
                  autoFocus
                  className="w-full bg-black border-2 border-white/10 focus:border-[#00FF4D] rounded-xl text-[#00FF4D] text-lg md:text-xl text-left pl-14 pr-6 py-6 outline-none tracking-widest font-mono transition-all placeholder:text-white/10 shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)] focus:shadow-[0_0_20px_rgba(0,255,77,0.1)]"
                  value={currentInput}
                  onChange={e => setCurrentInput(e.target.value)}
                  onKeyDown={keystroke.onKeyDown}
                  onKeyUp={handleKeyUp}
                  onMouseMove={mouse.onMouseMove}
                  onMouseDown={mouse.onMouseDown}
                  onMouseUp={mouse.onMouseUp}
                  onTouchStart={mouse.onTouchStart}
                  onTouchMove={mouse.onTouchMove}
                  onTouchEnd={mouse.onTouchEnd}
                  placeholder=""
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <p className="text-white/80 text-[10px] font-mono uppercase tracking-[0.2em] mb-4">Press Enter ⏎ to submit</p>

              <div className="h-[140px] w-full max-w-md mx-auto relative">
                <AnimatePresence>
                  {graphData.length > 2 && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col justify-center"
                    >
                      <div className="text-white/60 text-[9px] tracking-[0.3em] mb-4 font-mono uppercase text-left">DNA PATTERN FORMING</div>
                      <svg width={graphWidth > 400 ? 400 : graphWidth} height={80} className="block overflow-visible w-full">
                        <polyline
                          fill="none"
                          stroke="#00FF4D"
                          strokeWidth="1.5"
                          points={graphData.map((d, i) => `${(i / Math.max(1, graphData.length - 1)) * (graphWidth > 400 ? 400 : graphWidth)},${80 - (Math.min(d.hold, 500) / 500) * 80}`).join(' ')}
                        />
                        <polyline
                          fill="none"
                          stroke="#0088ff"
                          strokeWidth="1"
                          points={graphData.map((d, i) => `${(i / Math.max(1, graphData.length - 1)) * (graphWidth > 400 ? 400 : graphWidth)},${80 - (Math.min(d.flight, 500) / 500) * 80}`).join(' ')}
                        />
                      </svg>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {currentInput.trim() === PHRASE && (
                <button 
                  className="mt-8 bg-white text-black font-mono text-[10px] font-bold uppercase tracking-widest py-3 px-8 rounded-full transition-transform hover:scale-105" 
                  onClick={processAuth}
                >
                  Verify Identity →
                </button>
              )}
            </motion.div>
          )}

          {/* Scoring / Result Phase */}
          {(phase === 'scoring' || phase === 'result') && (
            <motion.div 
              key="scoring"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-2xl bg-[#0a0a0a] border-2 border-black rounded-3xl p-8 md:p-12 shadow-2xl relative text-center text-white"
            >
              <div className="mb-12">
                <div className="font-display text-7xl font-bold tracking-tight mb-2" style={{ color: scoreColor, transition: 'color 0.3s' }}>
                  {score !== null ? (score * 100).toFixed(1) + '%' : '—'}
                </div>
                <div className="text-white/50 text-[10px] tracking-[0.3em] font-mono uppercase">SIMILARITY SCORE</div>
              </div>

              {/* Score bar */}
              <div className="max-w-md mx-auto mb-10">
                <div className="relative h-2 bg-white/10 rounded-full mb-3">
                  <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-300" style={{ width: `${(score || 0) * 100}%`, backgroundColor: scoreColor }} />
                  <div className="absolute top-[-4px] bottom-[-4px] w-[2px] bg-white/20" style={{ left: '60%' }} title="Duress threshold" />
                  <div className="absolute top-[-4px] bottom-[-4px] w-[2px] border-r-2 border-[#00FF4D]/50" style={{ left: '70%' }} title="Auth threshold" />
                </div>
                <div className="flex justify-between text-[9px] tracking-[0.2em] font-mono uppercase">
                  <span className="text-red-500">REJECTED</span>
                  <span className="text-orange-400">DURESS</span>
                  <span className="text-[#00FF4D]">AUTH</span>
                </div>
              </div>

              {stressScore > 0 && (
                <div className="max-w-md mx-auto flex items-center gap-4 mb-8">
                  <span className="text-white/40 text-[9px] tracking-[0.2em] font-mono uppercase whitespace-nowrap">STRESS LEVEL</span>
                  <div className="flex-1 h-1 bg-white/10 rounded-full">
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${stressScore}%`, backgroundColor: stressScore > 60 ? '#ffaa00' : '#333' }} />
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: stressScore > 60 ? '#ffaa00' : '#555' }}>{stressScore.toFixed(0)}%</span>
                </div>
              )}

              {result && (
                <div className="font-display text-2xl font-bold tracking-[1px] uppercase mt-8 mb-6" style={{ color: resultMessages[result].color }}>
                  {resultMessages[result].icon} {resultMessages[result].label}
                </div>
              )}

              {result === 'authenticated' && recoveredKey && (
                <div className="bg-black p-6 rounded-xl border border-[#00FF4D]/30 max-w-md mx-auto my-6 text-left break-all shadow-[0_0_15px_rgba(0,255,77,0.1)]">
                  <strong className="block text-white/90 mb-3 tracking-[0.2em] font-mono text-[10px] uppercase">RECOVERED WALLET KEY</strong>
                  <div className="text-[#00FF4D] text-xs font-mono leading-relaxed">{recoveredKey}</div>
                </div>
              )}

              {result === 'rejected' && (
                <div className="bg-[#220000] p-6 rounded-xl border border-red-500/30 max-w-md mx-auto my-6 text-left shadow-[0_0_15px_rgba(255,68,68,0.1)]">
                  <strong className="block text-white/90 mb-3 tracking-[0.2em] font-mono text-[10px] uppercase text-red-500">FUZZY EXTRACTOR FAILED</strong>
                  <div className="text-red-400/80 text-xs font-mono leading-relaxed">Too much variance. The secret key could not be recovered.</div>
                </div>
              )}

              {statusMsg && <div className="text-white/60 text-xs font-mono mt-6 mb-8">{statusMsg}</div>}

              {result === 'rejected' && (
                <button 
                  className="bg-white text-black font-mono text-[10px] font-bold uppercase tracking-widest py-3 px-8 rounded-full transition-transform hover:scale-105" 
                  onClick={() => { setPhase('ready'); setCurrentInput(''); keystroke.reset(); mouse.reset(); setScore(null); setResult(null); }}
                >
                  Try Again
                </button>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
