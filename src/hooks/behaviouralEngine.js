import { useState, useRef, useCallback } from 'react';

// ─── Keystroke DNA Hook ───────────────────────────────────────────────────────
export function useKeystrokeDNA() {
  const [events, setEvents] = useState([]);
  const keyDownTimes = useRef({});
  const lastKeyUpTime = useRef(null);
  const rawEvents = useRef([]);

  const onKeyDown = useCallback((e) => {
    keyDownTimes.current[e.key] = performance.now();
  }, []);

  const onKeyUp = useCallback((e) => {
    const now = performance.now();
    const holdTime = keyDownTimes.current[e.key]
      ? now - keyDownTimes.current[e.key]
      : 0;
    const flightTime = lastKeyUpTime.current
      ? keyDownTimes.current[e.key] - lastKeyUpTime.current
      : 0;

    const event = {
      key: e.key,
      holdTime,
      flightTime: Math.max(0, flightTime),
      timestamp: now,
    };

    rawEvents.current.push(event);
    lastKeyUpTime.current = now;
    setEvents([...rawEvents.current]);
  }, []);

  const reset = useCallback(() => {
    rawEvents.current = [];
    keyDownTimes.current = {};
    lastKeyUpTime.current = null;
    setEvents([]);
  }, []);

  const extractVector = useCallback(() => {
    const evts = rawEvents.current;
    if (evts.length < 3) return null;

    const holdTimes = evts.map(e => e.holdTime);
    const flightTimes = evts.filter(e => e.flightTime > 0).map(e => e.flightTime);
    const totalDuration = evts.length > 1
      ? evts[evts.length - 1].timestamp - evts[0].timestamp
      : 0;
    const errorRate = evts.filter(e => e.key === 'Backspace').length / evts.length;

    return {
      avgHoldTime: mean(holdTimes),
      stdHoldTime: std(holdTimes),
      avgFlightTime: mean(flightTimes),
      stdFlightTime: std(flightTimes),
      totalDuration,
      rhythmVariance: std(flightTimes),
      errorRate,
      holdTimes: holdTimes.slice(0, 20), // per-key signature
    };
  }, []);

  return { events, onKeyDown, onKeyUp, reset, extractVector };
}

// ─── Mouse DNA Hook ───────────────────────────────────────────────────────────
export function useMouseDNA() {
  const [active, setActive] = useState(false);
  const points = useRef([]);
  const lastPoint = useRef(null);
  const mouseDownTime = useRef(null);
  const clickHolds = useRef([]);

  const onMouseMove = useCallback((e) => {
    if (!active) return;
    const now = performance.now();
    const point = { x: e.clientX, y: e.clientY, t: now };
    if (lastPoint.current) {
      const dx = point.x - lastPoint.current.x;
      const dy = point.y - lastPoint.current.y;
      const dt = point.t - lastPoint.current.t;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const velocity = dt > 0 ? dist / dt : 0;
      const angle = Math.atan2(dy, dx);
      points.current.push({ velocity, angle, dt });
    }
    lastPoint.current = point;
  }, [active]);

  const onMouseDown = useCallback(() => {
    mouseDownTime.current = performance.now();
  }, []);

  const onMouseUp = useCallback(() => {
    if (mouseDownTime.current) {
      clickHolds.current.push(performance.now() - mouseDownTime.current);
      mouseDownTime.current = null;
    }
  }, []);

  const startCapture = useCallback(() => {
    points.current = [];
    lastPoint.current = null;
    clickHolds.current = [];
    setActive(true);
  }, []);

  const stopCapture = useCallback(() => setActive(false), []);

  const reset = useCallback(() => {
    points.current = [];
    lastPoint.current = null;
    clickHolds.current = [];
    setActive(false);
  }, []);

  const extractVector = useCallback(() => {
    const pts = points.current;
    if (pts.length < 5) return null;

    const velocities = pts.map(p => p.velocity);
    const angles = pts.map(p => p.angle);

    // direction changes
    let dirChanges = 0;
    for (let i = 1; i < angles.length; i++) {
      if (Math.abs(angles[i] - angles[i - 1]) > 0.5) dirChanges++;
    }

    return {
      avgVelocity: mean(velocities),
      velocityVariance: std(velocities),
      avgAcceleration: meanAcceleration(velocities),
      directionChanges: dirChanges / Math.max(pts.length, 1),
      avgClickHold: mean(clickHolds.current),
    };
  }, []);

  return { onMouseMove, onMouseDown, onMouseUp, startCapture, stopCapture, reset, extractVector };
}

// ─── Combined Vector & Similarity ────────────────────────────────────────────
export function buildCombinedVector(keystroke, mouse) {
  // Keystroke features (10 base + 20 per-key = 30 dims)
  const kFeatures = [
    norm(keystroke.avgHoldTime, 0, 500),
    norm(keystroke.stdHoldTime, 0, 200),
    norm(keystroke.avgFlightTime, 0, 800),
    norm(keystroke.stdFlightTime, 0, 400),
    norm(keystroke.totalDuration, 0, 15000),
    norm(keystroke.rhythmVariance, 0, 400),
    norm(keystroke.errorRate, 0, 0.5),
    0, 0, 0, // padding
    ...padOrTrim(keystroke.holdTimes.map(h => norm(h, 0, 500)), 20),
  ];

  // Mouse features (5 dims, padded to 34)
  const mFeatures = mouse ? [
    norm(mouse.avgVelocity, 0, 5),
    norm(mouse.velocityVariance, 0, 3),
    norm(mouse.avgAcceleration, 0, 2),
    norm(mouse.directionChanges, 0, 1),
    norm(mouse.avgClickHold, 0, 1000),
    ...new Array(29).fill(0),
  ] : new Array(34).fill(0);

  return new Float32Array([...kFeatures, ...mFeatures]); // 64 dims
}

export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function detectStress(liveKeystroke, enrollmentKeystroke) {
  if (!liveKeystroke || !enrollmentKeystroke) return false;
  const baseVariance = enrollmentKeystroke.rhythmVariance || 1;
  const liveVariance = liveKeystroke.rhythmVariance || 0;
  return liveVariance > baseVariance * 2;
}

export function classifyScore(score, isStress) {
  if (score > 0.85 && !isStress) return 'authenticated';
  if (score >= 0.55 || isStress) return 'duress';
  return 'rejected';
}

// ─── Math Utilities ───────────────────────────────────────────────────────────
function mean(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr) {
  if (!arr || arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((acc, v) => acc + (v - m) ** 2, 0) / arr.length);
}

function meanAcceleration(velocities) {
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

function padOrTrim(arr, len) {
  if (arr.length >= len) return arr.slice(0, len);
  return [...arr, ...new Array(len - arr.length).fill(0)];
}
