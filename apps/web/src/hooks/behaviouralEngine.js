import { useState, useRef, useCallback, useEffect } from 'react';
import { mean, std, variance, zNormalize } from '@vaultless/core';

// The phrase — must match exactly what's used in Enroll/Auth
const PHRASE = 'Secure my account';
const DEBUG_AUTH = import.meta.env.DEV && import.meta.env.VITE_AUTH_DEBUG === 'true';

export * from '@vaultless/core';

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

  const extractVector = useCallback((phrase) => {
    // Exclude backspace from timing analysis — only count real phrase keys
    const allEvts = rawEvents.current;
    let evts = allEvts.filter(e => e.key !== 'Backspace' && e.key !== 'Shift');
    if (evts.length < 5) return null;

    // If we know the target phrase, try to align events to the expected key sequence.
    // If alignment fails, fall back to using the first N keys (where N = phrase length)
    // so that we still return a usable vector rather than null.
    if (phrase) {
      const expected = phrase.split('');
      const matched = [];
      let idx = 0;
      for (const e of evts) {
        const key = e.key;
        if (idx < expected.length && key === expected[idx]) {
          matched.push(e);
          idx += 1;
        }
        if (idx >= expected.length) break;
      }

      if (matched.length === expected.length) {
        evts = matched;
      } else if (evts.length >= expected.length) {
        // Fallback: use first N events so we still get a vector even if the user made a small typo.
        evts = evts.slice(0, expected.length);
      }
      // if evts is shorter than phrase length, keep it (will early-return below if too short)
    }

    const holdTimes   = evts.map(e => e.holdTime);
    const flightTimes = evts.slice(1).map(e => e.flightTime).filter(f => f > 0 && f < 3000);

    const totalDuration = evts.length > 1
      ? evts[evts.length - 1].timestamp - evts[0].timestamp
      : 0;

    const errorCount = allEvts.filter(e => e.key === 'Backspace').length;

    return {
      // Scalar summaries
      avgHoldTime:    mean(holdTimes),
      stdHoldTime:    std(holdTimes),
      avgFlightTime:  mean(flightTimes),
      stdFlightTime:  std(flightTimes),
      totalDuration,
      rhythmVariance: variance(flightTimes),
      errorRate:      errorCount / allEvts.length,

      // Raw arrays — these are the actual fingerprint
      holdTimes,
      flightTimes,

      // Z-score normalized arrays — shape of pattern, independent of speed
      holdTimesZ:   zNormalize(holdTimes),
      flightTimesZ: zNormalize(flightTimes),
    };
  }, []);

  return { events, onKeyDown, onKeyUp, reset, extractVector };
}

// ─── Mouse DNA Hook ───────────────────────────────────────────────────────────
export function useMouseDNA() {
  const [active, setActive] = useState(false);
  const [motionSupported, setMotionSupported] = useState(false);
  const motionSupportedRef = useRef(false);
  const points = useRef([]);
  const lastPoint = useRef(null);
  const mouseDownTime = useRef(null);
  const clickHolds = useRef([]);

  // Mobile / device motion capture
  const motionData = useRef({ acc: [], gyro: [] });
  const motionHandlerRef = useRef(null);
  const orientationHandlerRef = useRef(null);
  const lastMotionTime = useRef(0);
  const lastOrientationTime = useRef(0);
  const lastMotionGyroAt = useRef(0);
  const prevOrientationSample = useRef(null);
  const filteredGyro = useRef(null);
  const filteredAcc = useRef(null);
  const diagnosticsRef = useRef({
    platform: 'unknown',
    browser: 'unknown',
    hasDeviceMotion: false,
    hasDeviceOrientation: false,
    isSecureContext: false,
    motionPermission: 'unknown',
    orientationPermission: 'unknown',
    motionEvents: 0,
    orientationEvents: 0,
    touchEvents: 0,
    lastMotionEventAt: null,
    lastOrientationEventAt: null,
    lastTouchEventAt: null,
    captureStartedAt: null,
  });

  const detectPlatformInfo = useCallback(() => {
    if (typeof navigator === 'undefined') {
      return { platform: 'unknown', browser: 'unknown' };
    }
    const ua = navigator.userAgent || '';
    const touchMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    const isIOS = /iPad|iPhone|iPod/i.test(ua) || touchMac;
    const isAndroid = /Android/i.test(ua);
    const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|Edg|OPR/i.test(ua);
    const isChrome = /Chrome|CriOS/i.test(ua) && !/Edg|OPR/i.test(ua);

    return {
      platform: isIOS ? 'ios' : isAndroid ? 'android' : 'desktop',
      browser: isSafari ? 'safari' : isChrome ? 'chrome' : 'other',
    };
  }, []);

  const addPoint = useCallback((x, y, pressure = 0, isTouch = false) => {
    const now = performance.now();
    const point = { x, y, t: now, pressure, isTouch };
    if (lastPoint.current) {
      const dx = point.x - lastPoint.current.x;
      const dy = point.y - lastPoint.current.y;
      const dt = point.t - lastPoint.current.t;

      // Ignore ultra-dense events that mostly add noise and cost CPU
      if (dt < 5) {
        lastPoint.current = point;
        return;
      }

      const dist = Math.sqrt(dx * dx + dy * dy);
      let velocity = dt > 0 ? dist / dt : 0;
      // Clamp extreme spikes to reduce outlier impact
      if (velocity > 5) velocity = 5;
      const angle = Math.atan2(dy, dx);
      points.current.push({ velocity, angle, dt, pressure, isTouch });
      // Keep a bounded history so long sessions don't explode in size
      if (points.current.length > 512) {
        points.current.shift();
      }
    }
    lastPoint.current = point;
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!active) return;
    addPoint(e.clientX, e.clientY, 0, false);
  }, [active, addPoint]);

  const onTouchMove = useCallback((e) => {
    if (!active) return;
    const touch = e.touches && e.touches[0];
    if (!touch) return;
    const pressure = typeof touch.force === 'number' ? touch.force : 0;
    diagnosticsRef.current.touchEvents += 1;
    diagnosticsRef.current.lastTouchEventAt = Date.now();
    addPoint(touch.clientX, touch.clientY, pressure, true);
  }, [active, addPoint]);

  const onMouseDown = useCallback(() => {
    mouseDownTime.current = performance.now();
  }, []);

  const onTouchStart = useCallback((e) => {
    mouseDownTime.current = performance.now();
    const touch = e.touches && e.touches[0];
    if (!touch) return;
    const pressure = typeof touch.force === 'number' ? touch.force : 0;
    diagnosticsRef.current.touchEvents += 1;
    diagnosticsRef.current.lastTouchEventAt = Date.now();
    // Capture first touch point as part of mobile movement signature
    addPoint(touch.clientX, touch.clientY, pressure, true);
  }, [addPoint]);

  const onMouseUp = useCallback(() => {
    if (mouseDownTime.current) {
      clickHolds.current.push(performance.now() - mouseDownTime.current);
      mouseDownTime.current = null;
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (mouseDownTime.current) {
      clickHolds.current.push(performance.now() - mouseDownTime.current);
      mouseDownTime.current = null;
    }
  }, []);

  const cleanupMotionListeners = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (motionHandlerRef.current) {
      window.removeEventListener('devicemotion', motionHandlerRef.current);
      motionHandlerRef.current = null;
    }
    if (orientationHandlerRef.current) {
      window.removeEventListener('deviceorientation', orientationHandlerRef.current);
      orientationHandlerRef.current = null;
    }
  }, []);

  const updateMotionSupported = useCallback((supported) => {
    if (motionSupportedRef.current === supported) return;
    motionSupportedRef.current = supported;
    setMotionSupported(supported);
  }, []);

  const registerMotionListener = useCallback(() => {
    if (typeof window === 'undefined' || !window.DeviceMotionEvent || motionHandlerRef.current) return;
    diagnosticsRef.current.motionPermission = 'granted';

    const nextMotionHandler = (e) => {
      const now = performance.now();
      // Sample motion data at ~20Hz (every 50ms) to reduce noise and improve consistency
      if (now - lastMotionTime.current < 50) return;
      lastMotionTime.current = now;
      diagnosticsRef.current.motionEvents += 1;
      diagnosticsRef.current.lastMotionEventAt = Date.now();

      const acc = e.accelerationIncludingGravity || e.acceleration;
      if (acc) {
        // Clamp and low-pass acceleration to stabilize cross-device jitter
        const accRaw = {
          x: clampFinite(acc.x || 0, -80, 80),
          y: clampFinite(acc.y || 0, -80, 80),
          z: clampFinite(acc.z || 0, -80, 80),
        };
        const prev = filteredAcc.current || accRaw;
        const smooth = 0.3;
        const accFiltered = {
          x: prev.x + (accRaw.x - prev.x) * smooth,
          y: prev.y + (accRaw.y - prev.y) * smooth,
          z: prev.z + (accRaw.z - prev.z) * smooth,
        };
        filteredAcc.current = accFiltered;
        motionData.current.acc.push({
          x: accFiltered.x,
          y: accFiltered.y,
          z: accFiltered.z,
          t: now,
        });
        if (motionData.current.acc.length > 512) motionData.current.acc.shift();
        updateMotionSupported(true);
      }
      const rot = e.rotationRate;
      if (rot) {
        // rotationRate is already rate-like (deg/s). Smooth + clamp for consistency.
        const rotRaw = {
          alpha: clampFinite(rot.alpha || 0, -2000, 2000),
          beta: clampFinite(rot.beta || 0, -2000, 2000),
          gamma: clampFinite(rot.gamma || 0, -2000, 2000),
        };
        const prev = filteredGyro.current || rotRaw;
        const smooth = 0.35;
        const rotFiltered = {
          alpha: prev.alpha + (rotRaw.alpha - prev.alpha) * smooth,
          beta: prev.beta + (rotRaw.beta - prev.beta) * smooth,
          gamma: prev.gamma + (rotRaw.gamma - prev.gamma) * smooth,
        };
        filteredGyro.current = rotFiltered;
        lastMotionGyroAt.current = now;
        motionData.current.gyro.push({
          alpha: rotFiltered.alpha,
          beta: rotFiltered.beta,
          gamma: rotFiltered.gamma,
          t: now,
        });
        if (motionData.current.gyro.length > 512) motionData.current.gyro.shift();
        updateMotionSupported(true);
      }
    };

    window.addEventListener('devicemotion', nextMotionHandler);
    motionHandlerRef.current = nextMotionHandler;
  }, [updateMotionSupported]);

  const registerOrientationListener = useCallback(() => {
    if (typeof window === 'undefined' || !window.DeviceOrientationEvent || orientationHandlerRef.current) return;
    diagnosticsRef.current.orientationPermission = 'granted';

    const nextOrientationHandler = (e) => {
      const now = performance.now();
      // Sample orientation data at ~20Hz independently from devicemotion sampling
      if (now - lastOrientationTime.current < 50) return;
      lastOrientationTime.current = now;
      diagnosticsRef.current.orientationEvents += 1;
      diagnosticsRef.current.lastOrientationEventAt = Date.now();

      // If devicemotion is already feeding real rotationRate, don't mix in orientation units.
      if (now - lastMotionGyroAt.current < 500) {
        return;
      }

      // Fallback path: convert orientation deltas (deg) into rate-like values (deg/s).
      const sample = {
        alpha: e.alpha || 0,
        beta: e.beta || 0,
        gamma: e.gamma || 0,
        t: now,
      };
      const prev = prevOrientationSample.current;
      prevOrientationSample.current = sample;
      if (!prev) return;

      const dt = sample.t - prev.t;
      if (dt <= 0 || dt > 500) return;

      const rateRaw = {
        alpha: clampFinite(wrapAngleDeg(sample.alpha - prev.alpha) * 1000 / dt, -1000, 1000),
        beta: clampFinite(wrapAngleDeg(sample.beta - prev.beta) * 1000 / dt, -1000, 1000),
        gamma: clampFinite(wrapAngleDeg(sample.gamma - prev.gamma) * 1000 / dt, -1000, 1000),
      };
      const prevFiltered = filteredGyro.current || rateRaw;
      const smooth = 0.35;
      const rateFiltered = {
        alpha: prevFiltered.alpha + (rateRaw.alpha - prevFiltered.alpha) * smooth,
        beta: prevFiltered.beta + (rateRaw.beta - prevFiltered.beta) * smooth,
        gamma: prevFiltered.gamma + (rateRaw.gamma - prevFiltered.gamma) * smooth,
      };
      filteredGyro.current = rateFiltered;
      motionData.current.gyro.push({
        alpha: rateFiltered.alpha,
        beta: rateFiltered.beta,
        gamma: rateFiltered.gamma,
        t: now,
      });
      if (motionData.current.gyro.length > 512) motionData.current.gyro.shift();
      updateMotionSupported(true);
    };

    window.addEventListener('deviceorientation', nextOrientationHandler);
    orientationHandlerRef.current = nextOrientationHandler;
  }, [updateMotionSupported]);

  const startCapture = useCallback(() => {
    const platformInfo = detectPlatformInfo();
    const prevMotionGranted = diagnosticsRef.current.motionPermission === 'granted';
    const prevOrientationGranted = diagnosticsRef.current.orientationPermission === 'granted';

    points.current = [];
    lastPoint.current = null;
    clickHolds.current = [];
    motionData.current = { acc: [], gyro: [] };
    lastMotionTime.current = 0;
    lastOrientationTime.current = 0;
    lastMotionGyroAt.current = 0;
    prevOrientationSample.current = null;
    filteredGyro.current = null;
    filteredAcc.current = null;
    updateMotionSupported(false);
    diagnosticsRef.current = {
      platform: platformInfo.platform,
      browser: platformInfo.browser,
      hasDeviceMotion: typeof window !== 'undefined' && !!window.DeviceMotionEvent,
      hasDeviceOrientation: typeof window !== 'undefined' && !!window.DeviceOrientationEvent,
      isSecureContext: typeof window !== 'undefined' ? window.isSecureContext : false,
      motionPermission: 'unknown',
      orientationPermission: 'unknown',
      motionEvents: 0,
      orientationEvents: 0,
      touchEvents: 0,
      lastMotionEventAt: null,
      lastOrientationEventAt: null,
      lastTouchEventAt: null,
      captureStartedAt: Date.now(),
    };

    // Remove stale listeners before re-registering (important across retries/samples)
    cleanupMotionListeners();

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      diagnosticsRef.current.motionPermission = 'insecure-context';
      diagnosticsRef.current.orientationPermission = 'insecure-context';
      setActive(true);
      return;
    }

    // Safari/iOS requires a tap gesture for requestPermission().
    // Do not auto-request here; UI should call requestSensorAccess() from a button.
    if (typeof window === 'undefined' || !window.DeviceMotionEvent) {
      diagnosticsRef.current.motionPermission = 'unsupported';
    } else if (prevMotionGranted) {
      diagnosticsRef.current.motionPermission = 'granted';
      registerMotionListener();
    } else if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      diagnosticsRef.current.motionPermission = 'requires-user-gesture';
    } else {
      registerMotionListener();
    }

    if (typeof window === 'undefined' || !window.DeviceOrientationEvent) {
      diagnosticsRef.current.orientationPermission = 'unsupported';
    } else if (prevOrientationGranted) {
      diagnosticsRef.current.orientationPermission = 'granted';
      registerOrientationListener();
    } else if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      diagnosticsRef.current.orientationPermission = 'requires-user-gesture';
    } else {
      registerOrientationListener();
    }

    setActive(true);
  }, [cleanupMotionListeners, detectPlatformInfo, registerMotionListener, registerOrientationListener, updateMotionSupported]);

  const requestSensorAccess = useCallback(async () => {
    if (typeof window === 'undefined') return false;
    if (!window.isSecureContext) {
      diagnosticsRef.current.motionPermission = 'insecure-context';
      diagnosticsRef.current.orientationPermission = 'insecure-context';
      return false;
    }

    let grantedAny = false;

    if (window.DeviceMotionEvent) {
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        diagnosticsRef.current.motionPermission = 'pending';
        try {
          const state = await DeviceMotionEvent.requestPermission();
          if (state === 'granted') {
            diagnosticsRef.current.motionPermission = 'granted';
            registerMotionListener();
            grantedAny = true;
          } else {
            diagnosticsRef.current.motionPermission = 'denied';
          }
        } catch {
          diagnosticsRef.current.motionPermission = 'error';
        }
      } else {
        diagnosticsRef.current.motionPermission = 'granted';
        registerMotionListener();
        grantedAny = true;
      }
    } else {
      diagnosticsRef.current.motionPermission = 'unsupported';
    }

    if (window.DeviceOrientationEvent) {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        diagnosticsRef.current.orientationPermission = 'pending';
        try {
          const state = await DeviceOrientationEvent.requestPermission();
          if (state === 'granted') {
            diagnosticsRef.current.orientationPermission = 'granted';
            registerOrientationListener();
            grantedAny = true;
          } else {
            diagnosticsRef.current.orientationPermission = 'denied';
          }
        } catch {
          diagnosticsRef.current.orientationPermission = 'error';
        }
      } else {
        diagnosticsRef.current.orientationPermission = 'granted';
        registerOrientationListener();
        grantedAny = true;
      }
    } else {
      diagnosticsRef.current.orientationPermission = 'unsupported';
    }

    return grantedAny;
  }, [registerMotionListener, registerOrientationListener]);

  const reset = useCallback(() => {
    points.current = [];
    lastPoint.current = null;
    clickHolds.current = [];
    motionData.current = { acc: [], gyro: [] };
    lastMotionTime.current = 0;
    lastOrientationTime.current = 0;
    lastMotionGyroAt.current = 0;
    prevOrientationSample.current = null;
    filteredGyro.current = null;
    filteredAcc.current = null;

    cleanupMotionListeners();

    updateMotionSupported(false);
    setActive(false);
  }, [cleanupMotionListeners, updateMotionSupported]);

  const extractVector = useCallback(() => {
    const pts = points.current;
    if (pts.length < 5) return null;
    const velocities = pts.map(p => p.velocity);
    const dts = pts.map(p => p.dt);
    const angles = pts.map(p => p.angle);

    const angleDiffs = [];
    let dirChanges = 0;
    for (let i = 1; i < angles.length; i++) {
      let diff = angles[i] - angles[i - 1];
      // Wrap into [-π, π] so left vs right turns are measured correctly
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      angleDiffs.push(diff);
      if (Math.abs(diff) > 0.5) dirChanges++;
    }
    const directionChangeRate = dirChanges / Math.max(angleDiffs.length, 1);

    const absAngleDiffs = angleDiffs.map(a => Math.abs(a));

    // Touch-specific metrics
    const touchPoints = pts.filter(p => p.isTouch);
    const touchPressures = touchPoints.map(p => p.pressure || 0);
    const avgTouchPressure = mean(touchPressures);
    const stdTouchPressure = std(touchPressures);

    // Device motion metrics (gyroscope / accelerometer)
    const accMags = motionData.current.acc.map(a => Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z));
    const gyroMags = motionData.current.gyro.map(g => Math.sqrt(g.alpha * g.alpha + g.beta * g.beta + g.gamma * g.gamma));
    // Robust stats reduce spikes and improve score stability across repeated attempts.
    const { mean: avgAccelMag, std: stdAccelMag } = robustMeanStd(accMags, 0.1);
    const { mean: avgGyroMag, std: stdGyroMag } = robustMeanStd(gyroMags, 0.1);

    return {
      // Scalar summaries
      avgVelocity:       mean(velocities),
      // Kept name for backwards compatibility; now truly a std-based measure
      velocityVariance:  std(velocities),
      avgAcceleration:   meanAcceleration(velocities),
      directionChanges:  directionChangeRate,
      avgAngleChange:    mean(absAngleDiffs),
      angleChangeStd:    std(absAngleDiffs),
      avgClickHold:      mean(clickHolds.current),

      // Touch and motion
      avgTouchPressure,
      stdTouchPressure,
      pointCount: pts.length,
      touchPointCount: touchPoints.length,
      avgAccelMag,
      stdAccelMag,
      avgGyroMag,
      stdGyroMag,
      capturePlatform: diagnosticsRef.current.platform || 'unknown',

      // Raw arrays – richer Gesture DNA for future use
      velocities,
      angleDiffs,
      dts,

      // Normalized patterns – shape of movement independent of speed
      velocitiesZ:  zNormalize(velocities),
      angleDiffsZ:  zNormalize(angleDiffs),
    };
  }, []);

  // Cleanup when the component using this hook unmounts
  useEffect(() => {
    return () => reset();
  }, [reset]);

  const getMotionData = useCallback(() => motionData.current, []);
  const getPoints = useCallback(() => points.current, []);
  const getDiagnostics = useCallback(() => diagnosticsRef.current, []);

  useEffect(() => {
    const handleRNSensorData = (e) => {
      if (!active) return;
      const { type, data } = e.detail;
      const now = performance.now();
      
      if (type === 'accelerometer') {
        if (now - lastMotionTime.current < 50) return;
        lastMotionTime.current = now;
        
        // Expo accelerometer is in Gs (1G = 9.81 m/s^2)
        const accRaw = {
          x: clampFinite(data.x * 9.81 || 0, -80, 80),
          y: clampFinite(data.y * 9.81 || 0, -80, 80),
          z: clampFinite(data.z * 9.81 || 0, -80, 80),
        };
        const prev = filteredAcc.current || accRaw;
        const smooth = 0.3;
        const accFiltered = {
          x: prev.x + (accRaw.x - prev.x) * smooth,
          y: prev.y + (accRaw.y - prev.y) * smooth,
          z: prev.z + (accRaw.z - prev.z) * smooth,
        };
        filteredAcc.current = accFiltered;
        motionData.current.acc.push({ x: accFiltered.x, y: accFiltered.y, z: accFiltered.z, t: now });
        if (motionData.current.acc.length > 512) motionData.current.acc.shift();
        updateMotionSupported(true);
      } else if (type === 'gyroscope') {
        if (now - lastMotionGyroAt.current < 50) return;
        lastMotionGyroAt.current = now;
        
        // Expo gyroscope is in rad/s, we need deg/s
        const rotRaw = {
          alpha: clampFinite(data.x * 180 / Math.PI || 0, -2000, 2000),
          beta: clampFinite(data.y * 180 / Math.PI || 0, -2000, 2000),
          gamma: clampFinite(data.z * 180 / Math.PI || 0, -2000, 2000),
        };
        const prev = filteredGyro.current || rotRaw;
        const smooth = 0.35;
        const rotFiltered = {
          alpha: prev.alpha + (rotRaw.alpha - prev.alpha) * smooth,
          beta: prev.beta + (rotRaw.beta - prev.beta) * smooth,
          gamma: prev.gamma + (rotRaw.gamma - prev.gamma) * smooth,
        };
        filteredGyro.current = rotFiltered;
        motionData.current.gyro.push({ alpha: rotFiltered.alpha, beta: rotFiltered.beta, gamma: rotFiltered.gamma, t: now });
        if (motionData.current.gyro.length > 512) motionData.current.gyro.shift();
        updateMotionSupported(true);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('RN_SENSOR_DATA', handleRNSensorData);
      return () => window.removeEventListener('RN_SENSOR_DATA', handleRNSensorData);
    }
  }, [active, updateMotionSupported]);

  return { onMouseMove, onMouseDown, onMouseUp, onTouchMove, onTouchStart, onTouchEnd, startCapture, requestSensorAccess, reset, extractVector, getMotionData, getPoints, getDiagnostics, motionSupported };
}

