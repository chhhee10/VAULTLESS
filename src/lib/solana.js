import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from '@solana/web3.js';

// ── Program ID (deployed on Devnet) ──
export const PROGRAM_ID = new PublicKey('32Ve1hyCBwPDg2Br2v16aV9hq5xAkquE5gYif9v4akb1');
export const NETWORK = clusterApiUrl('devnet');

// ── Anchor discriminators ──
// These are the first 8 bytes of sha256("global:<instruction_name>")
// Pre-computed for our 4 instructions:
function anchorDiscriminator(name) {
  // We use a simple hash approach compatible with the browser
  // Anchor uses: sha256("global:<snake_case_name>")[0..8]
  const DISCRIMINATORS = {
    'initialize_identity': [174,116,47,150,189,57,60,186],
    'update_identity':     [130,54,88,104,222,124,238,252],
    'trigger_duress':      [222,199,162,21,107,111,119,157],
    'authenticate':        [172,100,46,57,235,170,237,96],
  };
  return new Uint8Array(DISCRIMINATORS[name]);
}

// ── Borsh serialization helpers ──
function serializeString(str) {
  const encoded = new TextEncoder().encode(str);
  const buf = new Uint8Array(4 + encoded.length);
  const view = new DataView(buf.buffer);
  view.setUint32(0, encoded.length, true); // little-endian
  buf.set(encoded, 4);
  return buf;
}

function concatBytes(...arrays) {
  const totalLen = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// ── Phantom wallet provider ──
function getSolanaProvider() {
  if (typeof window === 'undefined') return null;
  if ('solana' in window) {
    const provider = window.solana;
    if (provider.isPhantom) return provider;
  }
  return window.solana;
}

export async function connectWallet() {
  const provider = getSolanaProvider();
  if (provider) {
    try {
      const resp = await provider.connect();
      return resp.publicKey;
    } catch (err) {
      throw new Error('User rejected the request.');
    }
  } else {
    throw new Error('Solana wallet (Phantom) not found. Please install the Phantom extension.');
  }
}

export async function connectPhantom() {
  const provider = getSolanaProvider();
  if (!provider) {
    throw new Error('Phantom wallet not found. Please install the Phantom extension from phantom.app and refresh.');
  }
  try {
    const resp = await provider.connect();
    return resp.publicKey.toString();
  } catch (err) {
    if (err.code === 4001) {
      throw new Error('Phantom connection was rejected. Please approve the connection request.');
    }
    throw new Error(err.message || 'Failed to connect Phantom wallet.');
  }
}

export async function getActiveWalletAddress() {
  const provider = getSolanaProvider();
  if (provider && provider.isConnected && provider.publicKey) {
    return provider.publicKey.toString();
  }
  return connectPhantom();
}

// ── Identity PDA ──
export function getIdentityPDA(userPublicKeyStr) {
  const userPubkey = new PublicKey(userPublicKeyStr);
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [new TextEncoder().encode('identity'), userPubkey.toBuffer()],
    PROGRAM_ID
  );
  return { pda, bump };
}

// ── Helper: send a transaction via Phantom ──
async function sendTransaction(instruction) {
  const provider = getSolanaProvider();
  if (!provider || !provider.publicKey) {
    throw new Error('Wallet not connected. Please connect Phantom first.');
  }

  const connection = new Connection(NETWORK, 'confirmed');
  const transaction = new Transaction().add(instruction);
  transaction.feePayer = provider.publicKey;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const signed = await provider.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction(signature, 'confirmed');
  return signature;
}

// ── Program Instructions ──

export async function registerIdentityOnChain(helperData) {
  const provider = getSolanaProvider();
  if (!provider || !provider.publicKey) {
    throw new Error('Wallet not connected. Please connect Phantom first.');
  }

  const ownerPubkey = provider.publicKey;
  const { pda } = getIdentityPDA(ownerPubkey.toString());

  // Try update first (in case already enrolled)
  try {
    const updateData = concatBytes(
      anchorDiscriminator('update_identity'),
      serializeString(helperData),
    );

    const updateIx = new TransactionInstruction({
      keys: [
        { pubkey: pda, isSigner: false, isWritable: true },
        { pubkey: ownerPubkey, isSigner: true, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: updateData,
    });

    const sig = await sendTransaction(updateIx);
    return { hash: sig };
  } catch (err) {
    // Account doesn't exist — initialize it
    const initData = concatBytes(
      anchorDiscriminator('initialize_identity'),
      serializeString(helperData),
    );

    const initIx = new TransactionInstruction({
      keys: [
        { pubkey: pda, isSigner: false, isWritable: true },
        { pubkey: ownerPubkey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: initData,
    });

    const sig = await sendTransaction(initIx);
    return { hash: sig };
  }
}

export async function authenticateOnChain() {
  const provider = getSolanaProvider();
  if (!provider || !provider.publicKey) {
    throw new Error('Wallet not connected.');
  }

  const ownerPubkey = provider.publicKey;
  const { pda } = getIdentityPDA(ownerPubkey.toString());

  const data = anchorDiscriminator('authenticate');

  const ix = new TransactionInstruction({
    keys: [
      { pubkey: pda, isSigner: false, isWritable: true },
      { pubkey: ownerPubkey, isSigner: true, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  });

  const sig = await sendTransaction(ix);
  return { hash: sig };
}

export async function triggerDuressOnChain() {
  const provider = getSolanaProvider();
  if (!provider || !provider.publicKey) {
    throw new Error('Wallet not connected.');
  }

  const ownerPubkey = provider.publicKey;
  const { pda } = getIdentityPDA(ownerPubkey.toString());

  const data = anchorDiscriminator('trigger_duress');

  const ix = new TransactionInstruction({
    keys: [
      { pubkey: pda, isSigner: false, isWritable: true },
      { pubkey: ownerPubkey, isSigner: true, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  });

  const sig = await sendTransaction(ix);
  return { hash: sig };
}

// ── Wallet Utilities ──

export function getWalletFromSecretKey(hexSecretKey) {
  let hex = hexSecretKey.startsWith('0x') ? hexSecretKey.slice(2) : hexSecretKey;
  if (hex.length !== 64) throw new Error('Invalid secret key length');
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

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = senderKeypair.publicKey;
  transaction.sign(senderKeypair);

  const signature = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(signature, 'confirmed');
  return signature;
}

// ── Demo mode stubs ──
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
