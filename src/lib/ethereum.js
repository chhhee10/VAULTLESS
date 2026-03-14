import { ethers } from 'ethers';

// ── Paste your deployed contract address here after deploying on Sepolia ──
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

export const CONTRACT_ABI = [
  "function register(bytes32 commitmentHash) external",
  "function authenticate(bytes32 nullifier) external",
  "function authFailed() external",
  "function triggerDuress() external",
  "function refine(bytes32 newHash) external",
  "function getIdentity(address user) external view returns (bytes32, uint256, bool, bool)",
  "function isNullifierUsed(bytes32 nullifier) external view returns (bool)",
  "event Registered(address indexed user, uint256 timestamp)",
  "event AuthSuccess(address indexed user, bytes32 nullifier, uint256 timestamp)",
  "event AuthFailed(address indexed user, uint256 timestamp)",
  "event DuressActivated(address indexed user, uint256 timestamp)",
];

function getInjectedEthereum() {
  if (typeof window === 'undefined') return null;

  const { ethereum } = window;
  if (!ethereum) return null;

  if (Array.isArray(ethereum.providers) && ethereum.providers.length > 0) {
    return ethereum.providers.find((provider) => provider?.isMetaMask) || ethereum.providers[0];
  }

  return ethereum;
}

export function isMobileBrowser() {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export function canOpenMetaMaskDeepLink() {
  if (typeof window === 'undefined') return false;

  const { protocol, hostname } = window.location;
  if (protocol !== 'https:') return false;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return false;

  return true;
}

export function getMetaMaskDeepLink() {
  if (typeof window === 'undefined') return null;

  const currentUrl = window.location.href.replace(/^https?:\/\//, '');
  return `https://metamask.app.link/dapp/${currentUrl}`;
}

export function openMetaMaskDeepLink() {
  const deepLink = getMetaMaskDeepLink();

  if (!deepLink || !canOpenMetaMaskDeepLink()) {
    throw new Error('MetaMask mobile can only open this app from a deployed HTTPS URL.');
  }

  window.location.href = deepLink;
}

export async function getProvider(options = {}) {
  const { autoRedirectMobile = true } = options;
  const injectedEthereum = getInjectedEthereum();

  if (!injectedEthereum) {
    if (autoRedirectMobile && isMobileBrowser() && canOpenMetaMaskDeepLink()) {
      openMetaMaskDeepLink();
      throw new Error('Opening MetaMask. If nothing happens, open this site from the MetaMask in-app browser.');
    }

    if (isMobileBrowser()) {
      throw new Error('MetaMask was not detected. Open this site inside the MetaMask in-app browser.');
    }

    throw new Error('MetaMask not found');
  }

  const provider = new ethers.BrowserProvider(injectedEthereum);
  await provider.send('eth_requestAccounts', []);
  return provider;
}

export async function getSigner() {
  const provider = await getProvider();
  return provider.getSigner();
}

export async function getContract(signerOrProvider) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
}

export function vectorToHash(vector) {
  // Convert Float32Array to bytes32 commitment hash
  const arr = Array.from(vector).slice(0, 32);
  while (arr.length < 32) arr.push(0);
  const hex = arr.map(v => {
    const byte = Math.round(v * 255) & 0xff;
    return byte.toString(16).padStart(2, '0');
  }).join('');
  return '0x' + hex;
}

export function generateNullifier(vector, address) {
  // Unique per auth session — combines vector hash + address + timestamp
  const vectorHash = vectorToHash(vector);
  const packed = ethers.solidityPackedKeccak256(
    ['bytes32', 'address', 'uint256'],
    [vectorHash, address, Math.floor(Date.now() / 1000)]
  );
  return packed;
}

// ── Demo mode stubs (used when VITE_DEMO_MODE=true) ──────────────────────────
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export async function demoRegister() {
  return new Promise(resolve => setTimeout(() => resolve({ hash: '0xdemo_tx_register' }), 1500));
}

export async function demoAuthenticate() {
  return new Promise(resolve => setTimeout(() => resolve({ hash: '0xdemo_tx_auth' }), 1000));
}

export async function demoDuress() {
  return new Promise(resolve => setTimeout(() => resolve({ hash: '0xdemo_tx_duress' }), 800));
}
