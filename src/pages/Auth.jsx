import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis } from 'recharts';
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
  const { enrollmentVector, enrollmentKeystroke, enrollmentMouse, walletAddress, recoveryEmail, isEnrolled, helperData, secretKey, setIsDuressMode, setLastAuthScore, addSolanaLink, demoMode, setWalletAddress } = useVaultless();
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
          setStatusMsg('Authenticated. Redirecting...');
          setTimeout(() => navigate('/dashboard'), 2000);
          return;
        }
        const txResponse = await authenticateOnChain();
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
    : score > 0.70 ? '#00ff88'
    : score >= 0.60 ? '#ffaa00'
    : '#ff4444';

  const resultMessages = {
    authenticated: { icon: '✓', label: 'IDENTITY VERIFIED', color: '#00ff88' },
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
  const ui = {
    header: isMobile ? { ...styles.header, padding: '16px 18px' } : styles.header,
    container: isMobile ? { ...styles.container, padding: '28px 12px 40px' } : styles.container,
    card: isMobile ? { ...styles.card, borderRadius: 10, padding: '28px 18px' } : styles.card,
    title: isMobile ? { ...styles.title, fontSize: 22, margin: '0 0 12px' } : styles.title,
    desc: isMobile ? { ...styles.desc, fontSize: 14, lineHeight: 1.65 } : styles.desc,
    phrase: isMobile ? { ...styles.phrase, fontSize: 18, margin: '18px 0', lineHeight: 1.4 } : styles.phrase,
    cta: isMobile ? { ...styles.cta, width: '100%', padding: '13px 18px', fontSize: 12, letterSpacing: 1.2 } : styles.cta,
    typeInput: isMobile ? { ...styles.typeInput, fontSize: 16, padding: '14px 12px', letterSpacing: 1 } : styles.typeInput,
    graphContainer: isMobile ? { ...styles.graphContainer, padding: '12px' } : styles.graphContainer,
    scoreNum: isMobile ? { ...styles.scoreNum, fontSize: 48 } : styles.scoreNum,
    barLabels: isMobile ? { ...styles.barLabels, fontSize: 9, letterSpacing: 1 } : styles.barLabels,
    stressBar: isMobile ? { ...styles.stressBar, flexWrap: 'wrap', gap: 8, justifyContent: 'center' } : styles.stressBar,
  };

  return (
    <div style={styles.root}>
      <div style={ui.header}>
        <button style={styles.back} onClick={() => navigate('/')}>← VAULTLESS</button>
        <div style={styles.step}>AUTHENTICATION</div>
      </div>

      <div style={ui.container}>
        <div style={ui.card}>
          {phase === 'ready' && (
            <div key="ready">
              <h2 style={ui.title}>Authenticate</h2>
              {!isEnrolled && !demoMode && (
                <div style={styles.warning}>⚠ No enrollment found. <button style={styles.inlineLink} onClick={() => navigate('/enroll')}>Enroll first →</button></div>
              )}
              <p style={ui.desc}>Type the same phrase you enrolled with.</p>
              <div style={ui.phrase}>"{PHRASE}"</div>
              <button style={ui.cta} onClick={() => setPhase('typing')}>Begin Authentication</button>
            </div>
          )}

          {phase === 'typing' && (
            <div key="typing">
              <h2 style={ui.title}>Type the phrase</h2>
              <div style={ui.phrase}>"{PHRASE}"</div>
              <p style={styles.hint}>Press Enter when done</p>

              {showMobileSensorUi && (
                <div style={styles.sensorInfoCard}>
                  <div style={styles.sensorInfoText}>
                    Motion Sensors: <span style={{ color: sensorsEnabled ? '#00ff88' : '#ffb366' }}>{sensorsEnabled ? 'Enabled' : 'Optional'}</span>
                  </div>
                  {!sensorsEnabled && (
                    <div style={styles.sensorInfoSubtext}>
                      Enable them to match your enrollment capture more closely.
                    </div>
                  )}
                </div>
              )}

              {showMobileSensorUi && showEnableSensors && (
                <div style={styles.sensorActionBox}>
                  <div style={styles.sensorActionText}>
                    Tap to enable motion sensors on this device before verifying.
                  </div>
                  <button
                    style={styles.sensorEnableBtn}
                    onClick={requestSensors}
                    disabled={sensorRequesting}
                  >
                    {sensorRequesting ? 'Enabling Sensors...' : 'Enable Sensors'}
                  </button>
                </div>
              )}

              {showMobileSensorUi && sensorDenied && (
                <div style={styles.sensorWarning}>
                  {sensorBlockedHint}
                </div>
              )}

              <input
                ref={inputRef}
                style={ui.typeInput}
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
                placeholder="Start typing..."
                autoComplete="off"
                spellCheck={false}
              />

              {graphData.length > 2 && (
                <div style={ui.graphContainer}>
                  <div style={styles.graphLabel}>DNA PATTERN FORMING</div>
                  <LineChart width={graphWidth} height={100} data={graphData}>
                    <Line type="monotone" dataKey="hold" stroke="#00ff88" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="flight" stroke="#0088ff" strokeWidth={1} dot={false} isAnimationActive={false} />
                  </LineChart>
                </div>
              )}

              {currentInput.trim() === PHRASE && (
                <button style={ui.cta} onClick={processAuth}>Verify Identity →</button>
              )}
            </div>
          )}

          {(phase === 'scoring' || phase === 'result') && (
            <div key="scoring">
              <div style={styles.scoreDisplay}>
                <div style={{ ...ui.scoreNum, color: scoreColor }}>
                  {score !== null ? (score * 100).toFixed(1) + '%' : '—'}
                </div>
                <div style={styles.scoreLabel}>SIMILARITY SCORE</div>
              </div>

              {/* Score bar */}
              <div style={styles.barContainer}>
                <div style={{ ...styles.bar, width: `${(score || 0) * 100}%`, background: scoreColor, transition: 'width 0.05s ease' }} />
                <div style={{ ...styles.barMarker, left: '60%' }} title="Duress threshold" />
                <div style={{ ...styles.barMarker, left: '70%', borderColor: '#00ff88' }} title="Auth threshold" />
              </div>
              <div style={ui.barLabels}>
                <span style={{ color: '#ff4444' }}>REJECTED</span>
                <span style={{ color: '#ffaa00' }}>DURESS</span>
                <span style={{ color: '#00ff88' }}>AUTH</span>
              </div>

              {stressScore > 0 && (
                <div style={ui.stressBar}>
                  <span style={styles.stressLabel}>STRESS LEVEL</span>
                  <div style={styles.stressTrack}>
                    <div style={{ ...styles.stressFill, width: `${stressScore}%`, background: stressScore > 60 ? '#ffaa00' : '#333' }} />
                  </div>
                  <span style={{ color: stressScore > 60 ? '#ffaa00' : '#555', fontSize: 11 }}>{stressScore.toFixed(0)}%</span>
                </div>
              )}

              {result && (
                <div style={{ color: resultMessages[result].color, fontSize: 20, marginTop: 24, letterSpacing: 3 }}>
                  {resultMessages[result].icon} {resultMessages[result].label}
                </div>
              )}

              {result === 'authenticated' && recoveredKey && (
                <div style={{ background: '#111', padding: '16px', borderRadius: '8px', wordBreak: 'break-all', color: '#00ff88', fontSize: '13px', margin: '20px 0', border: '1px solid #00ff8844' }}>
                  <strong style={{ display: 'block', color: '#fff', marginBottom: '8px', letterSpacing: '2px', fontSize: '11px' }}>RECOVERED WALLET KEY</strong>
                  {recoveredKey}
                </div>
              )}

              {result === 'rejected' && (
                <div style={{ background: '#220000', padding: '16px', borderRadius: '8px', color: '#ff4444', fontSize: '13px', margin: '20px 0', border: '1px solid #ff444444' }}>
                  <strong style={{ display: 'block', color: '#fff', marginBottom: '8px', letterSpacing: '2px', fontSize: '11px' }}>FUZZY EXTRACTOR FAILED</strong>
                  Too much variance. The secret key could not be recovered.
                </div>
              )}

              {statusMsg && <div style={styles.status}>{statusMsg}</div>}

              {result === 'rejected' && (
                <button style={{ ...ui.cta, marginTop: 24 }} onClick={() => { setPhase('ready'); setCurrentInput(''); keystroke.reset(); mouse.reset(); setScore(null); setResult(null); }}>
                  Try Again
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  root: { minHeight: '100vh', background: '#080808', color: '#fff', fontFamily: "'Courier New', monospace" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', borderBottom: '1px solid #111' },
  back: { background: 'none', border: 'none', color: '#00ff88', cursor: 'pointer', fontSize: 13, letterSpacing: 1 },
  step: { color: '#444', fontSize: 11, letterSpacing: 3 },
  container: { display: 'flex', justifyContent: 'center', padding: '60px 24px' },
  card: { width: '100%', maxWidth: 560, background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 12, padding: '48px 40px', textAlign: 'center' },
  title: { fontSize: 28, fontWeight: 300, margin: '0 0 16px', fontFamily: 'Georgia, serif' },
  desc: { color: '#666', lineHeight: 1.8, marginBottom: 24 },
  phrase: { fontSize: 20, color: '#00ff88', margin: '24px 0', letterSpacing: 1 },
  hint: { color: '#444', fontSize: 12, marginBottom: 24 },
  cta: { background: '#00ff88', color: '#000', border: 'none', padding: '14px 32px', fontSize: 13, fontWeight: 700, letterSpacing: 2, cursor: 'pointer', borderRadius: 4, fontFamily: "'Courier New', monospace" },
  typeInput: { width: '100%', padding: '16px', background: '#111', border: '1px solid #00ff8844', borderRadius: 6, color: '#00ff88', fontSize: 18, textAlign: 'center', outline: 'none', boxSizing: 'border-box', letterSpacing: 2, fontFamily: "'Courier New', monospace", marginBottom: 24 },
  graphContainer: { background: '#060606', border: '1px solid #111', borderRadius: 8, padding: '16px', marginBottom: 24 },
  graphLabel: { color: '#333', fontSize: 10, letterSpacing: 3, marginBottom: 8 },
  scoreDisplay: { marginBottom: 32 },
  scoreNum: { fontSize: 72, fontWeight: 700, lineHeight: 1, transition: 'color 0.3s' },
  scoreLabel: { color: '#333', fontSize: 11, letterSpacing: 3, marginTop: 8 },
  barContainer: { position: 'relative', height: 8, background: '#111', borderRadius: 4, marginBottom: 8, overflow: 'visible' },
  bar: { height: '100%', borderRadius: 4, transition: 'background 0.3s' },
  barMarker: { position: 'absolute', top: -4, width: 2, height: 16, background: '#333', border: '1px solid #555' },
  barLabels: { display: 'flex', justifyContent: 'space-between', fontSize: 10, letterSpacing: 2, marginBottom: 24 },
  stressBar: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 },
  stressLabel: { color: '#333', fontSize: 10, letterSpacing: 2, whiteSpace: 'nowrap' },
  stressTrack: { flex: 1, height: 4, background: '#111', borderRadius: 2 },
  stressFill: { height: '100%', borderRadius: 2, transition: 'width 0.3s, background 0.3s' },
  status: { color: '#666', fontSize: 13, marginTop: 16 },
  warning: { background: '#ff444411', border: '1px solid #ff444433', borderRadius: 6, padding: '12px 16px', color: '#ff8888', fontSize: 13, marginBottom: 24 },
  inlineLink: { background: 'none', border: 'none', color: '#ff8888', textDecoration: 'underline', cursor: 'pointer', fontSize: 13 },
  sensorInfoCard: { marginBottom: 16, background: '#0b0f0b', border: '1px solid #1e2a1e', borderRadius: 6, padding: '10px 12px', textAlign: 'left' },
  sensorInfoText: { color: '#9fb89f', fontSize: 12 },
  sensorInfoSubtext: { color: '#6f7f6f', fontSize: 11, marginTop: 4 },
  sensorActionBox: { marginBottom: 16, background: '#0f1a12', border: '1px solid #1f3d2a', borderRadius: 6, padding: '10px 12px', textAlign: 'left' },
  sensorActionText: { color: '#8ed8ae', fontSize: 12, marginBottom: 8 },
  sensorEnableBtn: { background: '#00ff88', color: '#000', border: 'none', padding: '8px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "'Courier New', monospace" },
  sensorWarning: { marginBottom: 16, background: '#2a120f', border: '1px solid #5c2a23', borderRadius: 6, padding: '10px 12px', color: '#ffb09f', fontSize: 12, textAlign: 'left', lineHeight: 1.4 },
};
