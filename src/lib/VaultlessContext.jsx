import { createContext, useContext, useState } from 'react';

const VaultlessContext = createContext(null);

export function VaultlessProvider({ children }) {
  const [enrollmentVector, setEnrollmentVector] = useState(null);
  const [enrollmentKeystroke, setEnrollmentKeystroke] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isDuressMode, setIsDuressMode] = useState(false);
  const [lastAuthScore, setLastAuthScore] = useState(null);
  const [etherscanLinks, setEtherscanLinks] = useState([]);
  const [demoMode, setDemoMode] = useState(
    import.meta.env.VITE_DEMO_MODE === 'true'
  );

  const addEtherscanLink = (label, txHash) => {
    setEtherscanLinks(prev => [...prev, {
      label,
      url: `https://sepolia.etherscan.io/tx/${txHash}`,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  return (
    <VaultlessContext.Provider value={{
      enrollmentVector, setEnrollmentVector,
      enrollmentKeystroke, setEnrollmentKeystroke,
      walletAddress, setWalletAddress,
      isEnrolled, setIsEnrolled,
      isDuressMode, setIsDuressMode,
      lastAuthScore, setLastAuthScore,
      etherscanLinks, addEtherscanLink,
      demoMode, setDemoMode,
    }}>
      {children}
    </VaultlessContext.Provider>
  );
}

export const useVaultless = () => useContext(VaultlessContext);
