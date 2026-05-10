import { useState, useRef } from 'react';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import { mean, std, zNormalize, pearsonCorrelation, cosineSimilarity, TRUST_POLICIES, classifyScore, detectStress } from '@vaultless/core';

export { cosineSimilarity as compareMobileDNA, TRUST_POLICIES, classifyScore, detectStress };

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


