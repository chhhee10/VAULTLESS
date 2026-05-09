import { cosineSimilarity, zNormalize } from './index.js';

console.log('🧪 Testing @vaultless/core SDK Engine...');

// Dummy data representing two very similar typing patterns (Genuine User)
const userBaseline = {
  holdTimes: [100, 110, 105, 95, 120],
  flightTimes: [200, 210, 195, 205],
  totalDuration: 1500,
  holdTimesZ: zNormalize([100, 110, 105, 95, 120]),
  flightTimesZ: zNormalize([200, 210, 195, 205])
};

const liveSession = {
  holdTimes: [105, 115, 100, 98, 125],
  flightTimes: [205, 205, 190, 210],
  totalDuration: 1520,
  holdTimesZ: zNormalize([105, 115, 100, 98, 125]),
  flightTimesZ: zNormalize([205, 205, 190, 210])
};

// Dummy data representing chaotic typing (Hacker/Imposter)
const imposterSession = {
  holdTimes: [60, 200, 50, 300, 80],
  flightTimes: [100, 500, 50, 400],
  totalDuration: 2500,
  holdTimesZ: zNormalize([60, 200, 50, 300, 80]),
  flightTimesZ: zNormalize([100, 500, 50, 400])
};

console.log('\n[ Phase 1: Authentication Engine ]');
const matchScore = cosineSimilarity(null, null, liveSession, userBaseline, null, null);
console.log(`✅ Genuine User Match Score: ${(matchScore * 100).toFixed(2)}%`);

const imposterScore = cosineSimilarity(null, null, imposterSession, userBaseline, null, null);
console.log(`❌ Imposter Match Score: ${(imposterScore * 100).toFixed(2)}%`);

if (matchScore > 0.70 && imposterScore < 0.60) {
    console.log('\n🟢 SDK DIAGNOSTICS: PASSED');
    console.log('The Vaultless mathematical engine is successfully operating independently of React/DOM environments.');
} else {
    console.log('\n🔴 SDK DIAGNOSTICS: FAILED');
}
