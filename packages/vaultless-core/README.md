# @vaultless/core

The mathematical and cryptographic engine powering the Vaultless Behavioral Biometrics platform.

## Overview
`@vaultless/core` is a zero-dependency, pure JavaScript/TypeScript SDK designed to abstract the complex data science and cryptography behind hardware-based behavioral biometrics. 

It calculates user intent and identity by analyzing micro-inertia (Gyroscope/Accelerometer) and keystroke dynamics, allowing developers to add military-grade physical biometric security to any web, mobile, or desktop application.

## Installation
```bash
npm install @vaultless/core
```

## Features
1. **Z-Score & Pearson Correlation Engine**: Normalizes hardware data across different devices and calculates high-dimensional pattern similarities.
2. **Fuzzy Extractor**: Converts noisy biometric data (which changes slightly every time) into stable, reproducible cryptographic keys.
3. **Cross-Platform**: Operates completely independently of the DOM or React Native. Bring your own data array (Keyboard, Mouse, Gyroscope), and the engine will score it.

## Quickstart

### 1. Scoring a Biometric Match
Compare a live session against an enrolled biometric baseline.

```javascript
import { cosineSimilarity } from '@vaultless/core';

const matchScore = cosineSimilarity(
  null, null, 
  liveSessionData, // Captured from user input
  enrolledBaseline // Retrieved from DB
);

if (matchScore > 0.70) {
  console.log("User Authenticated: Biometric DNA Verified.");
} else if (matchScore > 0.60 && isStressDetected) {
  console.log("Duress Protocol Triggered.");
} else {
  console.log("Access Denied: Imposter Detected.");
}
```

### 2. Fuzzy Extraction (Generating Cryptographic Keys)
Convert noisy biometric data into a stable cryptographic seed.

```javascript
import { enroll, authenticate } from '@vaultless/core';

// During Setup:
// Generates a secure cryptographic key and a public helper string
const { key, helperString } = await enroll(biometricVector);

// During Login:
// Reconstructs the exact same key using the helper string and a fresh, noisy scan
const recoveredKey = await authenticate(liveNoisyVector, helperString);
```

## Why We Built This
The Vaultless SDK was designed to transform Behavioral Biometrics from an obscure academic concept into an accessible infrastructure layer for Web3 protocols, wallets, and decentralized exchanges.
