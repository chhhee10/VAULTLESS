import { Connection, PublicKey, clusterApiUrl, Keypair, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';

// ── Paste your deployed Solana Program ID here ──
export const PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');

// We use the Devnet for the Hackathon
export const NETWORK = clusterApiUrl('devnet');

// The IDL defines the interface of our Solana program.
// In a real Anchor project, you import this from the generated target/idl folder.
const IDL = {
  "version": "0.1.0",
  "name": "vaultless",
  "instructions": [
    {
      "name": "initializeIdentity",
      "accounts": [
        { "name": "identity", "isMut": true, "isSigner": false },
        { "name": "user", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "helperData", "type": "string" }
      ]
    },
    {
      "name": "triggerDuress",
      "accounts": [
        { "name": "identity", "isMut": true, "isSigner": false },
        { "name": "user", "isMut": false, "isSigner": true }
      ],
      "args": []
    },
    {
      "name": "authenticate",
      "accounts": [
        { "name": "identity", "isMut": true, "isSigner": false },
        { "name": "user", "isMut": false, "isSigner": true }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "Identity",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "owner", "type": "publicKey" },
          { "name": "helperData", "type": "string" },
          { "name": "enrolledAt", "type": "i64" },
          { "name": "lastAuthAt", "type": "i64" },
          { "name": "isLocked", "type": "bool" }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "DuressEvent",
      "fields": [
        { "name": "owner", "type": "publicKey", "index": false },
        { "name": "timestamp", "type": "i64", "index": false }
      ]
    }
  ]
};

function getSolanaProvider() {
  if (typeof window === 'undefined') return null;
  
  if ("solana" in window) {
    const provider = window.solana;
    if (provider.isPhantom) {
      return provider;
    }
  }
  
  // You might want to handle Solflare or generic wallets here
  return window.solana; 
}

export async function connectWallet() {
  const provider = getSolanaProvider();

  if (provider) {
    try {
      const resp = await provider.connect();
      return resp.publicKey;
    } catch (err) {
      throw new Error("User rejected the request.");
    }
  } else {
    throw new Error("Solana wallet (Phantom) not found. Please install the Phantom extension.");
  }
}

export async function getActiveWalletAddress() {
  const provider = getSolanaProvider();
  if (provider && provider.isConnected) {
    return provider.publicKey.toString();
  }
  return null;
}

export async function getAnchorProgram() {
  const provider = getSolanaProvider();
  if (!provider) throw new Error("No wallet provider found");

  const connection = new Connection(NETWORK, 'processed');
  const anchorProvider = new AnchorProvider(connection, provider, {
    preflightCommitment: 'processed',
  });

  return new Program(IDL, PROGRAM_ID, anchorProvider);
}

// ── Identity PDAs ───────────────────────────────────────────────────────────
export async function getIdentityPDA(userPublicKey) {
  const [pda, bump] = await PublicKey.findProgramAddress(
    [new TextEncoder().encode("identity"), userPublicKey.toBuffer()],
    PROGRAM_ID
  );
  return { pda, bump };
}

export async function fetchHelperData(userPublicKeyStr) {
  try {
    const program = await getAnchorProgram();
    const userPubkey = new PublicKey(userPublicKeyStr);
    const { pda } = await getIdentityPDA(userPubkey);
    
    const account = await program.account.identity.fetch(pda);
    return account.helperData;
  } catch (err) {
    console.error("Failed to fetch helper data. User might not be enrolled.", err);
    return null;
  }
}

// ── Actual Program Transactions ─────────────────────────────────────────────

export async function registerIdentityOnChain(helperData) {
  const program = await getAnchorProgram();
  const provider = getSolanaProvider();
  const userPubkey = new PublicKey(provider.publicKey.toString());
  const { pda } = await getIdentityPDA(userPubkey);
  
  try {
    // Attempt to update first in case they are already enrolled
    const tx = await program.methods.updateIdentity(helperData)
      .accounts({
        identity: pda,
        user: userPubkey,
      })
      .rpc();
    return { hash: tx };
  } catch (err) {
    // If account doesn't exist, initialize it
    const tx = await program.methods.initializeIdentity(helperData)
      .accounts({
        identity: pda,
        user: userPubkey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
    return { hash: tx };
  }
}

export async function authenticateOnChain() {
  const program = await getAnchorProgram();
  const provider = getSolanaProvider();
  const userPubkey = new PublicKey(provider.publicKey.toString());
  const { pda } = await getIdentityPDA(userPubkey);
  
  const tx = await program.methods.authenticate()
    .accounts({
      identity: pda,
      user: userPubkey,
    })
    .rpc();
  return { hash: tx };
}

export async function triggerDuressOnChain() {
  const program = await getAnchorProgram();
  const provider = getSolanaProvider();
  const userPubkey = new PublicKey(provider.publicKey.toString());
  const { pda } = await getIdentityPDA(userPubkey);
  
  const tx = await program.methods.triggerDuress()
    .accounts({
      identity: pda,
      user: userPubkey,
    })
    .rpc();
  return { hash: tx };
}

// ── Wallet Utilities ────────────────────────────────────────────────────────

export function getWalletFromSecretKey(hexSecretKey) {
  let hex = hexSecretKey.startsWith('0x') ? hexSecretKey.slice(2) : hexSecretKey;
  if (hex.length !== 64) throw new Error("Invalid secret key length");
  const seed = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    seed[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return Keypair.fromSeed(seed);
}

export async function getWalletBalance(publicKeyStr) {
  const connection = new Connection(NETWORK, 'confirmed');
  const pubkey = new PublicKey(publicKeyStr);
  const balance = await connection.getBalance(pubkey);
  return balance / LAMPORTS_PER_SOL;
}

export async function requestAirdrop(publicKeyStr) {
  const connection = new Connection(NETWORK, 'confirmed');
  const pubkey = new PublicKey(publicKeyStr);
  const signature = await connection.requestAirdrop(pubkey, LAMPORTS_PER_SOL);
  await connection.confirmTransaction(signature, 'confirmed');
  return signature;
}

export async function sendSol(senderKeypair, recipientAddressStr, amountSol) {
  const connection = new Connection(NETWORK, 'confirmed');
  const recipient = new PublicKey(recipientAddressStr);
  
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: senderKeypair.publicKey,
      toPubkey: recipient,
      lamports: amountSol * LAMPORTS_PER_SOL,
    })
  );
  
  const signature = await web3.sendAndConfirmTransaction(
    connection,
    transaction,
    [senderKeypair]
  );
  return signature;
}

// ── Demo mode stubs (used when VITE_DEMO_MODE=true) ──────────────────────────
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export async function demoRegister() {
  return new Promise(resolve => setTimeout(() => resolve({ hash: '1234demo_tx_register' }), 1500));
}

export async function demoAuthenticate() {
  return new Promise(resolve => setTimeout(() => resolve({ hash: '1234demo_tx_auth' }), 1000));
}

export async function demoDuress() {
  return new Promise(resolve => setTimeout(() => resolve({ hash: '1234demo_tx_duress' }), 800));
}
