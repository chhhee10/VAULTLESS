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

function loadFromStorage() {
  try {
    const raw = localStorage.getItem('vaultless_enrollment');
    if (!raw) return null;
    const data = JSON.parse(raw);
    return {
      enrollmentVector:    deserializeVector(data.enrollmentVector),
      enrollmentKeystroke: data.enrollmentKeystroke || null,
      enrollmentMouse:     data.enrollmentMouse || null,
      walletAddress:       data.walletAddress || null,
      recoveryEmail:       data.recoveryEmail || '',
      isEnrolled:          data.isEnrolled || false,
    };
  } catch {
    return null;
  }
}

function saveToStorage({ enrollmentVector, enrollmentKeystroke, enrollmentMouse, walletAddress, recoveryEmail, isEnrolled }) {
  try {
    localStorage.setItem('vaultless_enrollment', JSON.stringify({
      enrollmentVector:    serializeVector(enrollmentVector),
      enrollmentKeystroke: enrollmentKeystroke,
      enrollmentMouse:     enrollmentMouse,
      walletAddress:       walletAddress,
      recoveryEmail:       recoveryEmail || '',
      isEnrolled:          isEnrolled,
    }));
  } catch (e) {
    console.error('[VAULTLESS] Failed to persist enrollment:', e);
  }
}

function loadDemoMode() {
  try {
    const provider = window?.ethereum;
    const hasMetaMask = Boolean(
      provider?.isMetaMask ||
      provider?.providers?.some((item) => item?.isMetaMask)
    );

    if (hasMetaMask) return false;
  } catch {
    // ignore provider detection failures
  }

  try {
    const saved = localStorage.getItem(DEMO_MODE_STORAGE_KEY);
    if (saved === 'true') return true;
    if (saved === 'false') return false;
  } catch {
    // ignore storage failures
  }

  return import.meta.env.VITE_DEMO_MODE === 'true';
}

function saveDemoMode(value) {
  try {
    localStorage.setItem(DEMO_MODE_STORAGE_KEY, String(Boolean(value)));
  } catch {
    // ignore storage failures
  }
}

export function VaultlessProvider({ children }) {
  const saved = loadFromStorage();

  const [enrollmentVector,    setEnrollmentVectorRaw]    = useState(saved?.enrollmentVector    || null);
  const [enrollmentKeystroke, setEnrollmentKeystrokeRaw] = useState(saved?.enrollmentKeystroke || null);
  const [enrollmentMouse,     setEnrollmentMouseRaw]     = useState(saved?.enrollmentMouse     || null);
  const [walletAddress,       setWalletAddressRaw]       = useState(saved?.walletAddress       || null);
  const [recoveryEmail,       setRecoveryEmailRaw]       = useState(saved?.recoveryEmail       || '');
  const [isEnrolled,          setIsEnrolledRaw]          = useState(saved?.isEnrolled          || false);

  const [isDuressMode,  setIsDuressMode]  = useState(false);
  const [lastAuthScore, setLastAuthScore] = useState(null);
  const [etherscanLinks, setEtherscanLinks] = useState([]);
  const [demoMode, setDemoModeRaw] = useState(loadDemoMode);

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
  const setDemoMode = (value) => {
    setDemoModeRaw(value);
    saveDemoMode(value);
  };

  // Persist to localStorage whenever any enrollment field changes
  useEffect(() => {
    if (isEnrolled && enrollmentVector && enrollmentKeystroke) {
      saveToStorage({ enrollmentVector, enrollmentKeystroke, enrollmentMouse, walletAddress, recoveryEmail, isEnrolled });
      console.log('[VAULTLESS] Enrollment persisted to localStorage');
      console.log('[VAULTLESS] Stored holdTimes:', enrollmentKeystroke.holdTimes?.length, 'flightTimes:', enrollmentKeystroke.flightTimes?.length);
    }
  }, [enrollmentVector, enrollmentKeystroke, enrollmentMouse, walletAddress, recoveryEmail, isEnrolled]);

  useEffect(() => {
    const provider = window?.ethereum;
    const hasMetaMask = Boolean(
      provider?.isMetaMask ||
      provider?.providers?.some((item) => item?.isMetaMask)
    );

    if (hasMetaMask && demoMode) {
      setDemoMode(false);
    }
  }, [demoMode]);

  const addEtherscanLink = (label, txHash) => {
    setEtherscanLinks(prev => [...prev, {
      label,
      url: `https://sepolia.etherscan.io/tx/${txHash}`,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const clearEnrollment = () => {
    localStorage.removeItem('vaultless_enrollment');
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
      isDuressMode,        setIsDuressMode,
      lastAuthScore,       setLastAuthScore,
      etherscanLinks,      addEtherscanLink,
      demoMode,            setDemoMode,
      clearEnrollment,
    }}>
      {children}
    </VaultlessContext.Provider>
  );
}

export const useVaultless = () => useContext(VaultlessContext);
