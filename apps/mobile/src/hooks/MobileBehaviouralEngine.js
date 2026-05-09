import { useState, useRef } from 'react';
import { Accelerometer, Gyroscope } from 'expo-sensors';

// Math Helpers
function mean(arr) { if (!arr || arr.length === 0) return 0; return arr.reduce((a, b) => a + b, 0) / arr.length; }
function std(arr) {
  if (!arr || arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((acc, val) => acc + Math.pow(val - m, 2), 0) / arr.length;
  return Math.sqrt(variance);
}
function zNormalize(arr) {
  if (!arr || arr.length === 0) return [];
  const m = mean(arr);
  const s = std(arr) || 1;
  return arr.map(x => (x - m) / s);
}
function pearsonCorrelation(x, y) {
  if (!x || !y || x.length !== y.length || x.length === 0) return 0;
  const mx = mean(x), my = mean(y);
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < x.length; i++) {
    const dx = x[i] - mx, dy = y[i] - my;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  return denX > 0 && denY > 0 ? num / Math.sqrt(denX * denY) : 0;
}

export function useMobileDNA() {
  const [active, setActive] = useState(false);
  const lastKeyPressTime = useRef(null);
  const flightTimes = useRef([]);
  
  const accData = useRef([]);
  const gyroData = useRef([]);
  
  const accSubscription = useRef(null);
  const gyroSubscription = useRef(null);

  const [liveGyro, setLiveGyro] = useState(0);

  const startCapture = () => {
    flightTimes.current = [];
    accData.current = [];
    gyroData.current = [];
    lastKeyPressTime.current = null;
    setActive(true);

    Accelerometer.setUpdateInterval(50); // 20Hz
    accSubscription.current = Accelerometer.addListener(data => {
      accData.current.push(data);
    });

    Gyroscope.setUpdateInterval(50);
    gyroSubscription.current = Gyroscope.addListener(data => {
      gyroData.current.push(data);
      setLiveGyro(Math.sqrt(data.x*data.x + data.y*data.y + data.z*data.z));
    });
  };

  const stopCapture = () => {
    setActive(false);
    if (accSubscription.current) accSubscription.current.remove();
    if (gyroSubscription.current) gyroSubscription.current.remove();
    setLiveGyro(0);
  };

  const onKeyPress = (e) => {
    if (!active) return;
    const now = Date.now();
    // Ignore Backspace keys or other meta keys for rhythm
    if (e.nativeEvent.key === 'Backspace') return;
    if (lastKeyPressTime.current) {
      flightTimes.current.push(now - lastKeyPressTime.current);
    }
    lastKeyPressTime.current = now;
  };

  const extractVector = () => {
    stopCapture();
    const fTimes = [...flightTimes.current];
    const aData = [...accData.current];
    const gData = [...gyroData.current];

    if (fTimes.length < 5) return null;

    const accMags = aData.map(d => Math.sqrt(d.x*d.x + d.y*d.y + d.z*d.z));
    const gyroMags = gData.map(d => Math.sqrt(d.x*d.x + d.y*d.y + d.z*d.z));

    return {
      flightTimes: fTimes,
      flightTimesZ: zNormalize(fTimes),
      avgFlight: mean(fTimes),
      
      avgAccMag: mean(accMags),
      stdAccMag: std(accMags),
      
      avgGyroMag: mean(gyroMags),
      stdGyroMag: std(gyroMags)
    };
  };

  return { startCapture, stopCapture, onKeyPress, extractVector, liveGyro };
}

export function compareMobileDNA(live, enrolled) {
  if (!live || !enrolled) return 0;
  
  const flightPatternScore = pearsonCorrelation(live.flightTimesZ, enrolled.flightTimesZ);
  const flightNorm = (flightPatternScore + 1) / 2;

  const ratioSimilarity = (v1, v2) => {
    if (v1 === 0 && v2 === 0) return 1;
    if (v1 === 0 || v2 === 0) return 0;
    return Math.min(v1, v2) / Math.max(v1, v2);
  };

  const accScore = ratioSimilarity(live.stdAccMag, enrolled.stdAccMag);
  const gyroScore = ratioSimilarity(live.stdGyroMag, enrolled.stdGyroMag);

  // 60% Typing Rhythm | 40% Phone Motion Signature
  const finalScore = (flightNorm * 0.6) + (accScore * 0.2) + (gyroScore * 0.2);
  return finalScore;
}
