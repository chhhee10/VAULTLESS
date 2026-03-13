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

export async function getProvider() {
  if (!window.ethereum) throw new Error('MetaMask not found');
  const provider = new ethers.BrowserProvider(window.ethereum);
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
