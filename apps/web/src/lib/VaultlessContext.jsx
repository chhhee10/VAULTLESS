import { createContext, useContext, useState, useEffect } from 'react';

const VaultlessContext = createContext(null);
const DEMO_MODE_STORAGE_KEY = 'vaultless_demo_mode';

// Float32Array can't be JSON.stringify'd directly — convert to/from plain array
function serializeVector(v) {
  return v ? Array.from(v) : null;
}
function deserializeVector(v) {
  return v ? new Float32Array(v) : null;
}

function loadFromStorage(demoMode) {
  try {
    const key = demoMode ? 'vaultless_enrollment_demo' : 'vaultless_enrollment_real';
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return {
      enrollmentVector:    deserializeVector(data.enrollmentVector),
      enrollmentKeystroke: data.enrollmentKeystroke || null,
      enrollmentMouse:     data.enrollmentMouse || null,
      walletAddress:       data.walletAddress || null,
      recoveryEmail:       data.recoveryEmail || '',
      isEnrolled:          data.isEnrolled || false,
      helperData:          data.helperData || null,
      secretKey:           data.secretKey || null,
    };
  } catch {
    return null;
  }
}

function saveToStorage(data, demoMode) {
  try {
    const key = demoMode ? 'vaultless_enrollment_demo' : 'vaultless_enrollment_real';
    localStorage.setItem(key, JSON.stringify({
      enrollmentVector:    serializeVector(data.enrollmentVector),
      enrollmentKeystroke: data.enrollmentKeystroke,
      enrollmentMouse:     data.enrollmentMouse,
      walletAddress:       data.walletAddress,
      recoveryEmail:       data.recoveryEmail || '',
      isEnrolled:          data.isEnrolled,
      helperData:          data.helperData,
      secretKey:           data.secretKey,
    }));
  } catch (e) {
    console.error('[VAULTLESS] Failed to persist enrollment:', e);
  }
}

function loadDemoMode() {
  try {
    const saved = localStorage.getItem(DEMO_MODE_STORAGE_KEY);
    if (saved === 'true') return true;
    if (saved === 'false') return false;
  } catch {
    // ignore storage failures
  }

  const envDemo = import.meta.env.VITE_DEMO_MODE;
  return envDemo === undefined ? true : envDemo === 'true';
}

function saveDemoMode(value) {
  try {
    localStorage.setItem(DEMO_MODE_STORAGE_KEY, String(Boolean(value)));
  } catch {
    // ignore storage failures
  }
}

export function VaultlessProvider({ children }) {
  const initialDemoMode = loadDemoMode();
  const saved = loadFromStorage(initialDemoMode);

  const [enrollmentVector,    setEnrollmentVectorRaw]    = useState(saved?.enrollmentVector    || null);
  const [enrollmentKeystroke, setEnrollmentKeystrokeRaw] = useState(saved?.enrollmentKeystroke || null);
  const [enrollmentMouse,     setEnrollmentMouseRaw]     = useState(saved?.enrollmentMouse     || null);
  const [walletAddress,       setWalletAddressRaw]       = useState(saved?.walletAddress       || null);
  const [recoveryEmail,       setRecoveryEmailRaw]       = useState(saved?.recoveryEmail       || '');
  const [isEnrolled,          setIsEnrolledRaw]          = useState(saved?.isEnrolled          || false);
  const [helperData,          setHelperDataRaw]          = useState(saved?.helperData          || null);
  const [secretKey,           setSecretKeyRaw]           = useState(saved?.secretKey           || null);

  const [demoMode, setDemoModeRaw] = useState(initialDemoMode);

  const [isDuressMode,  setIsDuressMode]  = useState(false);
  const [lastAuthScore, setLastAuthScore] = useState(() => {
    try {
      const saved = localStorage.getItem(`vaultless_debug_score_${initialDemoMode ? 'demo' : 'real'}`);
      return saved ? parseFloat(saved) : null;
    } catch { return null; }
  });
  const [lastLiveVector, setLastLiveVector] = useState(() => {
    try {
      const saved = localStorage.getItem(`vaultless_debug_vector_${initialDemoMode ? 'demo' : 'real'}`);
      return saved ? new Float32Array(JSON.parse(saved)) : null;
    } catch { return null; }
  });
  const [lastLiveKeystroke, setLastLiveKeystroke] = useState(() => {
    try {
      const saved = localStorage.getItem(`vaultless_debug_keystroke_${initialDemoMode ? 'demo' : 'real'}`);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [lastLiveMouse, setLastLiveMouse] = useState(() => {
    try {
      const saved = localStorage.getItem(`vaultless_debug_mouse_${initialDemoMode ? 'demo' : 'real'}`);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [sessionActive, setSessionActive] = useState(false);
  const [etherscanLinks, setEtherscanLinks] = useState([]);

  // Cross-tab synchronization
  useEffect(() => {
    const handleStorage = (e) => {
      const pfx = demoMode ? 'demo' : 'real';
      if (e.key === `vaultless_debug_vector_${pfx}` && e.newValue) {
        setLastLiveVector(new Float32Array(JSON.parse(e.newValue)));
      }
      if (e.key === `vaultless_debug_keystroke_${pfx}` && e.newValue) {
        setLastLiveKeystroke(JSON.parse(e.newValue));
      }
      if (e.key === `vaultless_debug_mouse_${pfx}` && e.newValue) {
        setLastLiveMouse(JSON.parse(e.newValue));
      }
      if (e.key === `vaultless_debug_score_${pfx}` && e.newValue) {
        setLastAuthScore(parseFloat(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [demoMode]);

  // Wrap setters to also persist whenever enrollment data changes
  const setEnrollmentVector = (v) => {
    setEnrollmentVectorRaw(v);
  };
  const setEnrollmentKeystroke = (v) => {
    setEnrollmentKeystrokeRaw(v);
  };
  const setEnrollmentMouse = (v) => {
    setEnrollmentMouseRaw(v);
  };
  const setWalletAddress = (v) => {
    setWalletAddressRaw(v);
  };
  const setRecoveryEmail = (v) => {
    setRecoveryEmailRaw(v);
  };
  const setIsEnrolled = (v) => {
    setIsEnrolledRaw(v);
  };
  const setHelperData = (v) => setHelperDataRaw(v);
  const setSecretKey = (v) => setSecretKeyRaw(v);
  const setDemoMode = (value) => {
    setDemoModeRaw(value);
    saveDemoMode(value);
    
    // Switch state to the other mode's data
    const other = loadFromStorage(value);
    setEnrollmentVectorRaw(other?.enrollmentVector || null);
    setEnrollmentKeystrokeRaw(other?.enrollmentKeystroke || null);
    setEnrollmentMouseRaw(other?.enrollmentMouse || null);
    setWalletAddressRaw(other?.walletAddress || null);
    setRecoveryEmailRaw(other?.recoveryEmail || '');
    setIsEnrolledRaw(other?.isEnrolled || false);
    setHelperDataRaw(other?.helperData || null);
    setSecretKeyRaw(other?.secretKey || null);

    // Switch debug data too
    try {
      const pfx = value ? 'demo' : 'real';
      const dScore = localStorage.getItem(`vaultless_debug_score_${pfx}`);
      const dVec = localStorage.getItem(`vaultless_debug_vector_${pfx}`);
      const dKey = localStorage.getItem(`vaultless_debug_keystroke_${pfx}`);
      const dMou = localStorage.getItem(`vaultless_debug_mouse_${pfx}`);
      setLastAuthScore(dScore ? parseFloat(dScore) : null);
      setLastLiveVector(dVec ? new Float32Array(JSON.parse(dVec)) : null);
      setLastLiveKeystroke(dKey ? JSON.parse(dKey) : null);
      setLastLiveMouse(dMou ? JSON.parse(dMou) : null);
    } catch {
      setLastAuthScore(null); setLastLiveVector(null); setLastLiveKeystroke(null); setLastLiveMouse(null);
    }
  };

  const setDebugData = (vector, keystroke, mouse, score) => {
    setLastLiveVector(vector);
    setLastLiveKeystroke(keystroke);
    setLastLiveMouse(mouse);
    setLastAuthScore(score);
    try {
      const pfx = demoMode ? 'demo' : 'real';
      localStorage.setItem(`vaultless_debug_vector_${pfx}`, JSON.stringify(Array.from(vector)));
      localStorage.setItem(`vaultless_debug_keystroke_${pfx}`, JSON.stringify(keystroke));
      localStorage.setItem(`vaultless_debug_mouse_${pfx}`, JSON.stringify(mouse));
      localStorage.setItem(`vaultless_debug_score_${pfx}`, String(score));
    } catch (e) { console.error(e); }
  };

  // Persist to localStorage whenever any enrollment field changes
  useEffect(() => {
    if (isEnrolled && enrollmentVector && enrollmentKeystroke) {
      saveToStorage({ enrollmentVector, enrollmentKeystroke, enrollmentMouse, walletAddress, recoveryEmail, isEnrolled, helperData, secretKey }, demoMode);
      console.log(`[VAULTLESS] Enrollment persisted to ${demoMode ? 'DEMO' : 'REAL'} storage`);
    }
  }, [enrollmentVector, enrollmentKeystroke, enrollmentMouse, walletAddress, recoveryEmail, isEnrolled, helperData, secretKey, demoMode]);

  const addSolanaLink = (label, txHash) => {
    setEtherscanLinks(prev => [...prev, {
      label,
      url: `https://explorer.solana.com/tx/${txHash}?cluster=devnet`,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const clearEnrollment = () => {
    const key = demoMode ? 'vaultless_enrollment_demo' : 'vaultless_enrollment_real';
    localStorage.removeItem(key);
    setEnrollmentVectorRaw(null);
    setEnrollmentKeystrokeRaw(null);
    setEnrollmentMouseRaw(null);
    setWalletAddressRaw(null);
    setRecoveryEmailRaw('');
    setIsEnrolledRaw(false);
  };

  return (
    <VaultlessContext.Provider value={{
      enrollmentVector,    setEnrollmentVector,
      enrollmentKeystroke, setEnrollmentKeystroke,
      enrollmentMouse,     setEnrollmentMouse,
      walletAddress,       setWalletAddress,
      recoveryEmail,       setRecoveryEmail,
      isEnrolled,          setIsEnrolled,
      helperData,          setHelperData,
      secretKey,           setSecretKey,
      isDuressMode,        setIsDuressMode,
      sessionActive,       setSessionActive,
      lastAuthScore,
      lastLiveVector,
      lastLiveKeystroke,
      lastLiveMouse,
      setDebugData,
      solanaLinks: etherscanLinks, addSolanaLink,
      demoMode,            setDemoMode,
      clearEnrollment,
      isRealEnrolled: loadFromStorage(false)?.isEnrolled || false,
      isDemoEnrolled: loadFromStorage(true)?.isEnrolled || false,
    }}>
      {children}
    </VaultlessContext.Provider>
  );
}

export const useVaultless = () => useContext(VaultlessContext);
