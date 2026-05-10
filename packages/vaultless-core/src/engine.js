const DEBUG_AUTH = false;

// ─── Vector builder (for on-chain hashing only) ───────────────────────────────
export function buildCombinedVector(keystroke, mouse) {
  const kFeatures = [
    norm(keystroke.avgHoldTime, 0, 500),
    norm(keystroke.stdHoldTime, 0, 200),
    norm(keystroke.avgFlightTime, 0, 800),
    norm(keystroke.stdFlightTime, 0, 400),
    norm(keystroke.totalDuration, 0, 15000),
    norm(Math.sqrt(keystroke.rhythmVariance || 0), 0, 100),
    norm(keystroke.errorRate, 0, 0.5),
    0, 0, 0,
    ...padOrTrim((keystroke.holdTimes || []).map(h => norm(h, 0, 500)), 20),
  ];
  const mFeatures = mouse ? [
    norm(mouse.avgVelocity, 0, 5),
    norm(mouse.velocityVariance, 0, 3),
    norm(mouse.avgAcceleration, 0, 2),
    norm(mouse.directionChanges, 0, 1),
    norm(mouse.avgClickHold, 0, 1000),
    norm(mouse.avgTouchPressure || 0, 0, 1),
    norm(mouse.stdTouchPressure || 0, 0, 0.5),
    norm(mouse.touchPointCount || 0, 0, 100),//Mouse movement tracker
    norm(mouse.avgAccelMag || 0, 0, 20),
    norm(mouse.stdAccelMag || 0, 0, 10),
    norm(mouse.avgGyroMag || 0, 0, 10),
    norm(mouse.stdGyroMag || 0, 0, 5),
    ...new Array(22).fill(0),
  ] : new Array(34).fill(0);
  return new Float32Array([...kFeatures, ...mFeatures]);
}

// ─── Discrete Vector builder (for Fuzzy Extractor Phase 1) ────────────────────
export function quantizeBiometrics(floatArray, bins = 16) {
  return Array.from(floatArray).map(val => {
    const clamped = Math.max(0, Math.min(1, val));
    return Math.floor(clamped * (bins - 1));
  });
}

export function buildDiscreteVector(keystroke, mouse, bins = 16) {
  const continuousVector = buildCombinedVector(keystroke, mouse);
  return quantizeBiometrics(continuousVector, bins);
}

// ─── Main similarity function ─────────────────────────────────────────────────
// Takes the rich keystroke objects — not just the flat vectors.
// Returns 0.0–1.0 where 1.0 = identical pattern.
export function cosineSimilarity(
  _liveVec, _enrollVec,          // kept for API compat, not used
  liveK, enrollK,                // keystroke objects — the real input
  liveM, enrollM                 // mouse objects — now actively used when available
) {
  // Fallback to scalar-only comparison if arrays missing (shouldn't happen after fix)
  if (!liveK || !enrollK) {
    console.warn('[VAULTLESS] Missing keystroke objects — falling back to scalar comparison');
    return 0.3; // force fail so it's obvious something is wrong
  }

  const liveHZ   = liveK.holdTimesZ   || zNormalize(liveK.holdTimes   || []);
  const enrollHZ = enrollK.holdTimesZ || zNormalize(enrollK.holdTimes  || []);
  const liveFZ   = liveK.flightTimesZ || zNormalize(liveK.flightTimes  || []);
  const enrollFZ = enrollK.flightTimesZ || zNormalize(enrollK.flightTimes || []);

  // --- Score 1: Z-score pattern match on hold times (WHO you are — key identity) ---
  // Two different people will have different shaped hold-time profiles even at same speed
  const holdPatternScore = pearsonCorrelation(liveHZ, enrollHZ);

  // --- Score 2: Z-score pattern match on flight times (RHYTHM between keys) ---
  const flightPatternScore = pearsonCorrelation(liveFZ, enrollFZ);

  // --- Score 3: Hold time ratio consistency (speed-normalized key-by-key match) ---
  // Checks if each individual key hold time is proportionally similar
  const holdRatioScore = ratioSimilarity(liveK.holdTimes || [], enrollK.holdTimes || []);

  // --- Score 4: Total duration ratio (overall speed similarity) ---
  const durScore = safeDivRatio(liveK.totalDuration, enrollK.totalDuration);

  // Convert correlations from [-1, 1] to [0, 1]
  const hpNorm  = (holdPatternScore   + 1) / 2;
  const fpNorm  = (flightPatternScore + 1) / 2;

  // Keystroke-only base score
  let keyScore = (
    hpNorm        * 0.40 +  // shape of hold pattern
    fpNorm        * 0.30 +  // shape of flight/rhythm pattern
    holdRatioScore * 0.20 + // per-key hold ratio consistency
    durScore      * 0.10    // overall speed match
  );

  // Mouse / gesture component — only if we have enrollment data for it
  let mouseScore = null;
  let mobileConfidence = 1;
  if (hasReliablePointerSample(liveM) && hasReliablePointerSample(enrollM)) {
    const liveVelZ   = liveM.velocitiesZ   || zNormalize(liveM.velocities   || []);
    const enrollVelZ = enrollM.velocitiesZ || zNormalize(enrollM.velocities || []);
    const liveAngZ   = liveM.angleDiffsZ   || zNormalize(liveM.angleDiffs   || []);
    const enrollAngZ = enrollM.angleDiffsZ || zNormalize(enrollM.angleDiffs || []);

    const velPattern   = pearsonCorrelation(liveVelZ, enrollVelZ);
    const anglePattern = pearsonCorrelation(liveAngZ, enrollAngZ);

    const clickRatio   = ratioSimilarity(
      [liveM.avgClickHold || 0],
      [enrollM.avgClickHold || 0]
    );

    const velNorm   = (velPattern + 1) / 2;
    const angleNorm = (anglePattern + 1) / 2;

    mouseScore = (
      velNorm     * 0.45 + // speed profile
      angleNorm   * 0.35 + // turning / direction habits
      clickRatio  * 0.20   // click-down behaviour
    );
    // Add mobile/touch-specific features if both enrollment and live data have them.
    const liveIsMobile = isMobileBehaviorSample(liveM);
    const enrollIsMobile = isMobileBehaviorSample(enrollM);
    const matchedMobileCapture = liveIsMobile && enrollIsMobile;
    const hasTouchData = matchedMobileCapture && (liveM.touchPointCount || 0) > 5 && (enrollM.touchPointCount || 0) > 5;
    const hasMotionData = matchedMobileCapture && (liveM.avgGyroMag || 0) > 0 && (enrollM.avgGyroMag || 0) > 0;

    if (hasTouchData || hasMotionData) {
      const touchPressureScore = ratioSimilarity(
        [liveM.avgTouchPressure || 0],
        [enrollM.avgTouchPressure || 0]
      );
      const gyroScore = ratioSimilarity(
        [liveM.stdGyroMag || 0],
        [enrollM.stdGyroMag || 0]
      );

      const extraScore = (touchPressureScore * 0.5) + (gyroScore * 0.5);
      mouseScore = mouseScore * 0.90 + extraScore * 0.10;
    }

    // On mobile, weak gesture captures can create false positives if we trust
    // keystrokes too much. Penalize sparse touch/motion coverage instead of
    // fully rejecting so genuine users can still pass with solid captures.
    const enrollTouchPoints = enrollM.touchPointCount || 0;
    const liveTouchPoints = liveM.touchPointCount || 0;
    const hasMobileEnrollment = matchedMobileCapture && (enrollTouchPoints > 5 || (enrollM.avgGyroMag || 0) > 0);

    if (hasMobileEnrollment) {
      const touchCoverage = clamp01(safeDiv(liveTouchPoints, Math.max(enrollTouchPoints, 12)));
      const touchFloor = liveTouchPoints >= 10 ? 1 : liveTouchPoints / 10;
      const gyroCoverage = (enrollM.avgGyroMag || 0) > 0
        ? clamp01(safeDiv(liveM.stdGyroMag || 0, Math.max(enrollM.stdGyroMag || 0, 0.05)))
        : 1;
      const pressureCoverage = enrollTouchPoints > 5
        ? ratioSimilarity(
            [liveM.stdTouchPressure || 0],
            [Math.max(enrollM.stdTouchPressure || 0, 0.02)]
          )
        : 1;

      mobileConfidence = (
        touchCoverage * 0.45 +
        touchFloor * 0.25 +
        gyroCoverage * 0.20 +
        pressureCoverage * 0.10
      );

      // Keep some forgiveness for noisy mobile hardware, but make thin captures
      // materially harder to classify as authenticated.
      mobileConfidence = 0.65 + mobileConfidence * 0.35;
    }
  }

  // Mix in mouse/gesture (including mobile touch + motion) behavior when available.
  // Keystrokes remain the dominant signal, keeping scoring stable for existing enrollments.
  let score = mouseScore != null
    ? keyScore * 0.85 + mouseScore * 0.15
    : keyScore;

  if (mouseScore != null) {
    score *= mobileConfidence;
  }

  if (DEBUG_AUTH) {
    console.log('[VAULTLESS AUTH DEBUG]');
    console.log('  Hold pattern (Pearson):', holdPatternScore.toFixed(3), '→ normalized:', hpNorm.toFixed(3));
    console.log('  Flight pattern (Pearson):', flightPatternScore.toFixed(3), '→ normalized:', fpNorm.toFixed(3));
    console.log('  Hold ratio score:', holdRatioScore.toFixed(3));
    console.log('  Duration score:', durScore.toFixed(3));
    if (mouseScore != null) {
      console.log('  Mouse score:', mouseScore.toFixed(3));
      console.log('  Mobile confidence:', mobileConfidence.toFixed(3));
    }
    console.log('  FINAL SCORE:', score.toFixed(3), '→ CLASSIFICATION:', classifyScore(score));
    console.log('  Live holdTimes:', liveK.holdTimes?.slice(0, 5).map(n => n.toFixed(0)));
    console.log('  Enroll holdTimes:', enrollK.holdTimes?.slice(0, 5).map(n => n.toFixed(0)));
    console.log('  Live flightTimes:', liveK.flightTimes?.slice(0, 5).map(n => n.toFixed(0)));
    console.log('  Enroll flightTimes:', enrollK.flightTimes?.slice(0, 5).map(n => n.toFixed(0)));
  }

  return Math.max(0, Math.min(1, score));
}

export function detectStress(liveK, enrollK) {
  if (!liveK || !enrollK) return false;
  const baseVariance = enrollK.rhythmVariance || 1;
  const liveVariance = liveK.rhythmVariance   || 0;
  return liveVariance > baseVariance * 2.5;
}

export const TRUST_POLICIES = {
  NORMAL: {
    label: 'Normal',
    authThreshold: 0.70,
    duressMin: 0.60,
    description: 'Balanced security and convenience.'
  },
  HIGH_RISK: {
    label: 'High-Risk',
    authThreshold: 0.82,
    duressMin: 0.72,
    description: 'Tightened thresholds for sensitive environments.'
  },
  TRAVEL: {
    label: 'Travel',
    authThreshold: 0.88,
    duressMin: 0.80,
    description: 'Maximum security. Requires near-perfect biometric match.'
  }
};

export function classifyScore(score, isStress = false, policyKey = 'NORMAL') {
  const policy = TRUST_POLICIES[policyKey] || TRUST_POLICIES.NORMAL;
  
  // Match the visual thresholds and keep duress narrow:
  // - >= authThreshold           → authenticated
  // - duressMin – authThreshold with stress true → duress
  // - everything else            → rejected
  if (score >= policy.authThreshold) return 'authenticated';
  if (score >= policy.duressMin && score < policy.authThreshold && isStress) return 'duress';
  return 'rejected';
}

// ─── Statistical helpers ──────────────────────────────────────────────────────

// Pearson correlation: measures similarity of shape/pattern, ignores scale
// Returns -1 (opposite) to +1 (identical pattern)
export function pearsonCorrelation(a, b) {
  const len = Math.min(a.length, b.length);
  if (len < 3) return 0;
  const as = a.slice(0, len);
  const bs = b.slice(0, len);
  const ma = mean(as), mb = mean(bs);
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < len; i++) {
    const ai = as[i] - ma;
    const bi = bs[i] - mb;
    num += ai * bi;
    da  += ai * ai;
    db  += bi * bi;
  }
  if (da === 0 || db === 0) return 0;
  return num / Math.sqrt(da * db);
}

export function zNormalize(arr) {
  if (!arr || arr.length < 2) return arr || [];
  const m = mean(arr);
  const s = std(arr);
  if (s === 0) return arr.map(() => 0);
  return arr.map(v => (v - m) / s);
}

// Ratio similarity: how close is each pair of values relative to each other
// [100, 200, 150] vs [110, 210, 160] → high (same proportions)
// [100, 200, 150] vs [200, 100, 150] → low (different per-key profile)
export function ratioSimilarity(a, b) {
  const len = Math.min(a.length, b.length, 16);
  if (len === 0) return 0.5;
  let total = 0;
  for (let i = 0; i < len; i++) {
    const ai = Math.max(a[i], 1);
    const bi = Math.max(b[i], 1);
    total += Math.min(ai, bi) / Math.max(ai, bi);
  }
  return total / len;
}

export function safeDivRatio(a, b) {
  if (!a || !b || a === 0 || b === 0) return 0.5;
  return Math.min(a, b) / Math.max(a, b);
}

export function safeDiv(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return 0;
  return a / b;
}

export function mean(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function variance(arr) {
  if (!arr || arr.length < 2) return 0;
  const m = mean(arr);
  return arr.reduce((acc, v) => acc + (v - m) ** 2, 0) / arr.length;
}

export function std(arr) {
  return Math.sqrt(variance(arr));
}

export function meanAcceleration(velocities) {
  if (velocities.length < 2) return 0;
  const accels = [];
  for (let i = 1; i < velocities.length; i++) {
    accels.push(Math.abs(velocities[i] - velocities[i - 1]));
  }
  return mean(accels);
}

function norm(val, min, max) {
  if (max === min) return 0;
  return Math.min(1, Math.max(0, (val - min) / (max - min)));
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function hasReliablePointerSample(sample) {
  if (!sample) return false;
  const pointCount = sample.pointCount || sample.velocities?.length || 0;
  return pointCount >= 8;
}

function isMobileBehaviorSample(sample) {
  if (!sample) return false;
  if (sample.capturePlatform === 'ios' || sample.capturePlatform === 'android') return true;
  return (sample.touchPointCount || 0) > 5 || (sample.avgGyroMag || 0) > 0 || (sample.avgAccelMag || 0) > 0;
}

function padOrTrim(arr, len) {
  if (arr.length >= len) return arr.slice(0, len);
  return [...arr, ...new Array(len - arr.length).fill(0)];
}

export function clampFinite(value, min, max) {
  if (!Number.isFinite(value)) return 0;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function wrapAngleDeg(diff) {
  let d = diff;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

export function robustMeanStd(arr, trimRatio = 0.1) {
  if (!arr || arr.length === 0) return { mean: 0, std: 0 };
  if (arr.length < 5) return { mean: mean(arr), std: std(arr) };

  const sorted = [...arr].sort((a, b) => a - b);
  const trim = Math.floor(sorted.length * trimRatio);
  const core = sorted.slice(trim, sorted.length - trim);
  const safe = core.length ? core : sorted;
  return { mean: mean(safe), std: std(safe) };
}
