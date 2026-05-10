import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useKeystrokeDNA, useMouseDNA, buildCombinedVector, quantizeBiometrics } from '../hooks/behaviouralEngine';
import { enroll as enrollFuzzyExtractor } from '@vaultless/core';
import { useViewport } from '../hooks/useViewport';
import { useVaultless } from '../lib/VaultlessContext';
import { isMobileBrowser } from '../lib/ethereum';
import { getActiveWalletAddress, registerIdentityOnChain } from '../lib/solana';
import BinaryGlitchBackground from '../components/BinaryGlitchBackground';

const PHRASE = 'Secure my account';
const REQUIRED_SAMPLES = 3;

export default function Enroll() {
  const navigate = useNavigate();
  const { setEnrollmentVector, setEnrollmentKeystroke, setEnrollmentMouse, setWalletAddress, setRecoveryEmail, setIsEnrolled, setHelperData, secretKey, setSecretKey, addSolanaLink, demoMode } = useVaultless();
  const showSensorDebug = import.meta.env.VITE_SHOW_SENSOR_DEBUG === 'true';
  const { isMobile, width: viewportWidth } = useViewport();
  const graphWidth = isMobile ? viewportWidth - 60 : 440;
  const mobileLikeDevice = isMobileBrowser();

  const [phase, setPhase] = useState('intro'); // intro | capturing | processing | done | error
  const [sampleCount, setSampleCount] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [samples, setSamples] = useState([]);
  const [graphData, setGraphData] = useState([]);
  const [gyroGraphData, setGyroGraphData] = useState([]);
  const [touchGraphData, setTouchGraphData] = useState([]);
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
  const [txHash, setTxHash] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [walletAddr, setWalletAddr] = useState(null);
  const [backupEmail, setBackupEmail] = useState('');
  const inputRef = useRef(null);

  const keystroke = useKeystrokeDNA();
  const mouse = useMouseDNA();

  useEffect(() => {
    if (phase === 'capturing') {
      inputRef.current?.focus();
      mouse.startCapture();
    }
  }, [phase, sampleCount, mouse.startCapture]);

  useEffect(() => {
    if (phase !== 'capturing') return;
    
    // Desktop mouse events
    const onMouseMove = (e) => mouse.onMouseMove(e);
    const onMouseDown = (e) => mouse.onMouseDown(e);
    const onMouseUp = (e) => mouse.onMouseUp(e);
    // Mobile touch events
    const onTouchStart = (e) => mouse.onTouchStart(e);
    const onTouchMove = (e) => mouse.onTouchMove(e);
    const onTouchEnd = () => mouse.onTouchEnd();

    if (!mobileLikeDevice) {
      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('mousedown', onMouseDown, { passive: true });
      window.addEventListener('mouseup', onMouseUp, { passive: true });
    } else {
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('touchend', onTouchEnd, { passive: true });
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [mobileLikeDevice, phase, mouse]);

  useEffect(() => {
    if (!mobileLikeDevice) {
      setMotionAvailable(false);
      return;
    }
    setMotionAvailable(mouse.motionSupported);
  }, [mobileLikeDevice, mouse.motionSupported]);

  useEffect(() => {
    if (!mobileLikeDevice) return;
    if (phase !== 'capturing') return;
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

  useEffect(() => {
    const interval = setInterval(() => {
      const motion = mouse.getMotionData();
      if (motion.gyro.length > 0) {
        const data = motion.gyro.slice(-30).map((g, i) => ({
          i,
          alpha: Math.abs(g.alpha),
          beta: Math.abs(g.beta),
          gamma: Math.abs(g.gamma),
          mag: Math.sqrt(g.alpha * g.alpha + g.beta * g.beta + g.gamma * g.gamma),
        }));
        setGyroGraphData(data);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [mouse.getMotionData]);

  useEffect(() => {
    const interval = setInterval(() => {
      const pts = mouse.getPoints();
      const touchPts = pts.filter(p => p.isTouch).slice(-30);
      if (touchPts.length > 0) {
        const data = touchPts.map((p, i) => ({
          i,
          pressure: p.pressure || 0,
          velocity: p.velocity || 0,
        }));
        setTouchGraphData(data);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [mouse.getPoints]);



  const connectWallet = async () => {
    const email = backupEmail.trim();
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmailValid) {
      setStatusMsg('Please enter a valid recovery email before enrollment.');
      return;
    }

    try {
      setRecoveryEmail(email);
      if (demoMode) {
        setWalletAddr('DEMO1111111111111111111111111111111111111111');
        setWalletAddress('DEMO1111111111111111111111111111111111111111');
        setPhase('capturing');
        return;
      }
      const addr = await getActiveWalletAddress();
      setWalletAddr(addr);
      setWalletAddress(addr);
      setPhase('capturing');
    } catch (e) {
      setStatusMsg(e.message || 'Phantom connection failed. Make sure Phantom is installed and unlocked.');
    }
  };

  const handleTyping = (e) => {
    setCurrentInput(e.target.value);
  };

  const requestSensors = async () => {
    setSensorRequesting(true);
    try {
      const granted = await mouse.requestSensorAccess();
      if (!granted) {
        setStatusMsg('Could not enable motion sensors. You can continue, but mobile protection will be reduced.');
      } else {
        setStatusMsg('Motion sensors enabled.');
      }
    } finally {
      setSensorRequesting(false);
    }
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
  const sensorActivityLive = (sensorDiag.motionEvents || 0) > 0 || (sensorDiag.orientationEvents || 0) > 0;
  const isMobilePlatform = sensorDiag.platform === 'ios' || sensorDiag.platform === 'android';
  const hasSensorApi = sensorDiag.hasDeviceMotion || sensorDiag.hasDeviceOrientation;
  const showMobileSensorUi = mobileLikeDevice && isMobilePlatform && hasSensorApi;
  const sensorHealthText = !sensorDiag.isSecureContext
    ? 'Secure connection required'
    : sensorsEnabled
      ? 'Connected'
      : 'Limited';

  const sensorBlockedHint = insecureContext
    ? 'Motion sensors need a secure connection. Open the app over HTTPS and try again.'
    : sensorDiag.platform === 'android' && sensorDiag.browser === 'chrome'
      ? 'Sensor access is blocked. In Chrome Android, allow Motion sensors in Site settings, then reload.'
      : 'Sensor access is blocked. Enable motion/orientation access in browser settings, then reload.';

  const handleKeyUp = (e) => {
    keystroke.onKeyUp(e);
    if (e.key === 'Enter' && currentInput.trim() === PHRASE) {
      captureComplete();
    }
  };

  const captureComplete = () => {
    const kData = keystroke.extractVector(PHRASE);
    const mData = mouse.extractVector();

    if (!kData) {
      setStatusMsg('Not enough data captured. Try typing more naturally.');
      return;
    }

    const vector = buildCombinedVector(kData, mData);
    const newSamples = [...samples, { vector, keystroke: kData, mouse: mData }];
    setSamples(newSamples);

    const newCount = sampleCount + 1;
    setSampleCount(newCount);

    if (newCount < REQUIRED_SAMPLES) {
      setCurrentInput('');
      keystroke.reset();
      mouse.reset();
      mouse.startCapture();
      setStatusMsg(`Sample ${newCount}/${REQUIRED_SAMPLES} captured. Type again.`);
      inputRef.current?.focus();
    } else {
      commitToChain(newSamples);
    }
  };

  const avgVector = (sampleList) => {
    const len = sampleList[0].vector.length;
    const avg = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      avg[i] = sampleList.reduce((sum, s) => sum + s.vector[i], 0) / sampleList.length;
    }
    return avg;
  };

  const averageKeystroke = (samples) => {
    const scalar = (key) => samples.reduce((sum, s) => sum + (s[key] || 0), 0) / samples.length;
    const avgArr = (key) => {
      const maxLen = Math.max(...samples.map(s => (s[key] || []).length));
      return Array.from({ length: maxLen }, (_, i) => {
        const vals = samples.map(s => (s[key] || [])[i]).filter(v => v !== undefined);
        return vals.reduce((a, b) => a + b, 0) / vals.length;
      });
    };
    
    const zNormalize = (arr) => {
      if (!arr || arr.length < 2) return arr || [];
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      const variance = arr.reduce((acc, v) => acc + (v - mean) ** 2, 0) / arr.length;
      const std = Math.sqrt(variance);
      if (std === 0) return arr.map(() => 0);
      return arr.map(v => (v - mean) / std);
    };
    
    const holdTimes = avgArr('holdTimes');
    const flightTimes = avgArr('flightTimes');
    
    return {
      avgHoldTime:    scalar('avgHoldTime'),
      stdHoldTime:    scalar('stdHoldTime'),
      avgFlightTime:  scalar('avgFlightTime'),
      stdFlightTime:  scalar('stdFlightTime'),
      totalDuration:  scalar('totalDuration'),
      rhythmVariance: scalar('rhythmVariance'),
      errorRate:      scalar('errorRate'),
      holdTimes:      holdTimes,
      flightTimes:    flightTimes,
      holdTimesZ:     zNormalize(holdTimes),
      flightTimesZ:   zNormalize(flightTimes),
    };
  };

  const averageMouse = (samples) => {
    if (!samples.length) return null;
    const scalar = (key) => samples.reduce((sum, s) => sum + (s?.[key] ?? 0), 0) / samples.length;
    const avgArr = (key) => {
      const maxLen = Math.max(...samples.map(s => (s?.[key] || []).length));
      if (maxLen === 0) return [];
      return Array.from({ length: maxLen }, (_, i) => {
        const vals = samples
          .map(s => (s?.[key] || [])[i])
          .filter(v => v !== undefined);
        if (!vals.length) return 0;
        return vals.reduce((a, b) => a + b, 0) / vals.length;
      });
    };

    const velocities   = avgArr('velocities');
    const angleDiffs   = avgArr('angleDiffs');
    const dts          = avgArr('dts');

    const zNormalize = (arr) => {
      if (!arr || arr.length < 2) return arr || [];
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      const variance = arr.reduce((acc, v) => acc + (v - mean) ** 2, 0) / arr.length;
      const std = Math.sqrt(variance);
      if (std === 0) return arr.map(() => 0);
      return arr.map(v => (v - mean) / std);
    };

    return {
      avgVelocity:       scalar('avgVelocity'),
      velocityVariance:  scalar('velocityVariance'),
      avgAcceleration:   scalar('avgAcceleration'),
      directionChanges:  scalar('directionChanges'),
      avgAngleChange:    scalar('avgAngleChange'),
      angleChangeStd:    scalar('angleChangeStd'),
      avgClickHold:      scalar('avgClickHold'),
      avgTouchPressure:  scalar('avgTouchPressure'),
      stdTouchPressure:  scalar('stdTouchPressure'),
      pointCount:        scalar('pointCount'),
      touchPointCount:   scalar('touchPointCount'),
      avgAccelMag:       scalar('avgAccelMag'),
      stdAccelMag:       scalar('stdAccelMag'),
      avgGyroMag:        scalar('avgGyroMag'),
      stdGyroMag:        scalar('stdGyroMag'),
      capturePlatform:   samples[0]?.capturePlatform || 'unknown',
      velocities,
      angleDiffs,
      dts,
      velocitiesZ: zNormalize(velocities),
      angleDiffsZ: zNormalize(angleDiffs),
    };
  };

  const commitToChain = async (sampleList) => {
    setPhase('processing');
    setStatusMsg('Averaging 3 samples into Behavioural DNA...');

    const finalVector   = avgVector(sampleList);
    const avgKeystroke  = averageKeystroke(sampleList.map(s => s.keystroke));
    const avgMouse      = averageMouse(sampleList.map(s => s.mouse).filter(Boolean));

    const discreteVector = quantizeBiometrics(finalVector);
    const { secretKey, helperData } = enrollFuzzyExtractor(discreteVector);

    setEnrollmentVector(finalVector);
    setEnrollmentKeystroke(avgKeystroke);
    setEnrollmentMouse(avgMouse || null);
    setHelperData(helperData);
    setSecretKey(secretKey);

    try {
      if (demoMode) {
        setStatusMsg('Pushing Helper Data to Solana (demo mode)...');
        await new Promise(r => setTimeout(r, 2000));
        const fakeTx = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        setTxHash(fakeTx);
        addSolanaLink('Registered', fakeTx);
        setIsEnrolled(true);
        setPhase('done');
        return;
      }

      setStatusMsg('Requesting Phantom signature...');
      const txResponse = await registerIdentityOnChain(helperData);
      setStatusMsg('Transaction confirmed!');
      setTxHash(txResponse.hash);
      addSolanaLink('Registered', txResponse.hash);
      setIsEnrolled(true);
      setPhase('done');
    } catch (e) {
      setStatusMsg('Error: ' + e.message);
      setPhase('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f2] font-sans flex flex-col relative overflow-hidden text-black selection:bg-[#00FF4D] selection:text-black">
      <BinaryGlitchBackground />
      
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
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-6 md:p-12 z-10 relative">
        <AnimatePresence mode="wait">
          
          {/* Intro Phase */}
          {phase === 'intro' && (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-2xl bg-[#0a0a0a] border-2 border-black rounded-3xl p-5 md:p-12 shadow-2xl relative text-center text-white"
            >
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-[1px] uppercase mb-6">Enroll Your Identity</h2>
              <p className="text-white/90 text-sm md:text-base leading-relaxed mb-8">
                You'll type <strong className="text-[#00FF4D]">"{PHRASE}"</strong> three times.<br />
                Your keystroke rhythm becomes your cryptographic identity.
              </p>
              <ul className="text-left text-white/80 text-xs md:text-sm leading-loose mb-8 list-disc pl-6 space-y-2 max-w-md mx-auto">
                <li>Type naturally — don't try to be consistent</li>
                <li>Your behavioural DNA is captured, never stored</li>
                <li>The Fuzzy Extractor outputs the wallet key and pushes Helper Data to Solana</li>
              </ul>
              
              <div className="max-w-md mx-auto">
                <input
                  className="w-full p-4 mb-6 bg-white/5 border border-white/20 rounded-xl text-white text-sm outline-none font-sans focus:border-[#00FF4D] transition-colors"
                  type="email"
                  value={backupEmail}
                  onChange={(e) => setBackupEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && connectWallet()}
                  placeholder="Recovery email for duress alerts"
                  autoComplete="email"
                />
                <button 
                  className="w-full bg-[#00FF4D] hover:bg-[#00FF4D]/90 text-black font-mono text-xs md:text-sm font-bold uppercase tracking-widest py-4 rounded-full transition-transform hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(0,255,77,0.3)]" 
                  onClick={connectWallet}
                >
                  {demoMode ? 'Start Enrollment (Demo)' : 'Connect Phantom & Begin'}
                </button>
              </div>
              
              {!demoMode && isMobileBrowser() && (
                <div className="text-white/60 text-xs mt-6 max-w-sm mx-auto leading-relaxed">
                  On iPad or iPhone, this will open the Phantom in-app browser if Safari cannot inject the wallet.
                </div>
              )}
              {statusMsg && <div className="text-white/80 text-xs font-mono mt-6">{statusMsg}</div>}
            </motion.div>
          )}

          {/* Capturing Phase */}
          {phase === 'capturing' && (
            <motion.div 
              key="capturing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-2xl bg-[#0a0a0a] border-2 border-black rounded-3xl p-5 md:p-12 shadow-2xl relative text-center text-white"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`sample-${sampleCount}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex justify-center mb-8">
                    <div className="bg-white/5 border border-white/10 text-white/50 text-[10px] font-mono font-bold px-4 py-1.5 rounded-full uppercase tracking-[0.2em]">
                      Capture {sampleCount + 1} / {REQUIRED_SAMPLES}
                    </div>
                  </div>
                  
                  <h2 className="font-display text-3xl md:text-4xl font-bold tracking-[1px] uppercase mb-4">Replicate Signature</h2>
                  
                  <div className="text-xl md:text-2xl text-white/70 tracking-widest font-mono mb-12">
                    "{PHRASE}"
                  </div>

                  <div className="relative max-w-md mx-auto mb-8">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#00FF4D]/50 font-mono text-xl pointer-events-none">
                      &gt;
                    </div>
                    <input
                      ref={inputRef}
                      autoFocus
                      className="w-full bg-black border-2 border-white/10 focus:border-[#00FF4D] rounded-xl text-[#00FF4D] text-lg md:text-xl text-left pl-14 pr-6 py-6 outline-none tracking-widest font-mono transition-all placeholder:text-white/10 shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)] focus:shadow-[0_0_20px_rgba(0,255,77,0.1)]"
                      value={currentInput}
                      onChange={handleTyping}
                      onKeyDown={keystroke.onKeyDown}
                      onKeyUp={handleKeyUp}
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
                          <div className="text-white/60 text-[9px] tracking-[0.3em] mb-4 font-mono uppercase text-left">KEYSTROKE EKG — LIVE</div>
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

                  {statusMsg && <div className="text-white/80 text-xs font-mono mt-6">{statusMsg}</div>}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}

          {/* Processing Phase */}
          {phase === 'processing' && (
            <motion.div 
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-2xl bg-[#0a0a0a] border-2 border-black rounded-3xl p-6 md:p-12 shadow-2xl relative text-center text-white"
            >
              <div className="text-5xl text-[#00FF4D] animate-spin mb-8 inline-block">⬡</div>
              <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-4">Pushing to Solana</h2>
              <p className="text-white/80 text-sm font-mono mb-4">{statusMsg}</p>
              {walletAddr && <div className="text-white/60 text-xs font-mono break-all max-w-md mx-auto bg-white/5 p-4 rounded-xl">{walletAddr}</div>}
            </motion.div>
          )}

          {/* Done Phase */}
          {phase === 'done' && (
            <motion.div 
              key="done"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-2xl bg-[#0a0a0a] border-2 border-black rounded-3xl p-5 md:p-12 shadow-2xl relative text-center text-white"
            >
              <div className="text-6xl text-[#00FF4D] mb-6">✓</div>
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-[1px] uppercase mb-4">Identity Enrolled</h2>
              <p className="text-white/90 text-sm md:text-base leading-relaxed mb-8 max-w-md mx-auto">
                Your Behavioural DNA was successfully converted to a Wallet Key via the Fuzzy Extractor.
              </p>
              
              {secretKey && (
                <div className="bg-black p-6 rounded-xl border border-[#00FF4D]/30 max-w-md mx-auto mb-8 text-left break-all shadow-[0_0_15px_rgba(0,255,77,0.1)]">
                  <strong className="block text-white/90 mb-3 tracking-[0.2em] font-mono text-[10px] uppercase">GENERATED SECRET KEY</strong>
                  <div className="text-[#00FF4D] text-xs font-mono leading-relaxed">{secretKey}</div>
                </div>
              )}
              
              <div className="flex flex-col items-center gap-6 mt-2">
                {txHash && (
                  <a
                    className="text-[#00FF4D] text-xs font-mono hover:underline tracking-[1px]"
                    href={`https://explorer.solana.com/tx/${txHash}?cluster=devnet`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View on Solana Explorer ↗
                  </a>
                )}
                
                <button 
                  autoFocus
                  className="w-full md:w-auto bg-[#00FF4D] hover:bg-[#00FF4D]/90 text-black font-mono text-xs md:text-sm font-bold uppercase tracking-[1px] py-4 px-10 rounded-full transition-transform hover:scale-[1.02] shadow-[0_0_20px_rgba(0,255,77,0.3)] outline-none" 
                  onClick={() => navigate('/auth')}
                >
                  Authenticate Now →
                </button>
              </div>
            </motion.div>
          )}

          {/* Error Phase */}
          {phase === 'error' && (
            <motion.div 
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl bg-[#0a0a0a] border-2 border-black rounded-3xl p-5 md:p-12 shadow-2xl relative text-center text-white"
            >
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-[1px] uppercase mb-4 text-red-500">Something went wrong</h2>
              <p className="text-white/80 text-sm font-mono mb-8 max-w-md mx-auto">{statusMsg}</p>
              <button 
                className="bg-white text-black font-mono text-xs font-bold uppercase tracking-widest py-3 px-8 rounded-full transition-transform hover:scale-105" 
                onClick={() => { setPhase('intro'); setSampleCount(0); setSamples([]); }}
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
