import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { SvgXml, Svg, Defs, RadialGradient, Stop, Rect, Pattern, Line } from 'react-native-svg';
import { useMobileDNA, compareMobileDNA } from './src/hooks/MobileBehaviouralEngine';

const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="edgeHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
      <stop offset="40%" stop-color="#ffffff" stop-opacity="0.1" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>
  </defs>
  <polygon points="92,50 71,86.373 29,86.373 8,50 29,13.627 71,13.627" fill="none" stroke="#00FF4D" stroke-width="14" stroke-linejoin="miter" />
  <polygon points="92,50 71,86.373 29,86.373 8,50 29,13.627 71,13.627" fill="none" stroke="url(#edgeHighlight)" stroke-width="6" stroke-linejoin="miter" />
</svg>
`;

function CyberBackground() {
  return (
    <View style={[StyleSheet.absoluteFill]} pointerEvents="none">
      <Svg height="100%" width="100%">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
            <Stop offset="0%" stopColor="#00FF4D" stopOpacity="0.05" />
            <Stop offset="100%" stopColor="#030303" stopOpacity="1" />
          </RadialGradient>
          <Pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <Line x1="40" y1="0" x2="40" y2="40" stroke="#ffffff" strokeOpacity="0.02" strokeWidth="1" />
            <Line x1="0" y1="40" x2="40" y2="40" stroke="#ffffff" strokeOpacity="0.02" strokeWidth="1" />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grid)" />
      </Svg>
    </View>
  );
}

function LiveGyroGraph({ currentVal }) {
  const [history, setHistory] = useState(new Array(20).fill(0));
  
  useEffect(() => {
    setHistory(prev => [...prev.slice(1), currentVal]);
  }, [currentVal]);

  return (
    <View style={styles.liveGraphContainer}>
      {history.map((val, i) => (
        <View key={i} style={[styles.liveBar, { height: Math.max(2, val * 15), opacity: (i+1)/20 }]} />
      ))}
    </View>
  );
}

function DNAVisualizer({ vector }) {
  if (!vector) return null;
  const bars = vector.flightTimesZ ? vector.flightTimesZ.slice(0, 16) : [];
  return (
    <View style={styles.visContainer}>
      <Text style={styles.visTitle}>GESTURE DNA CONSTRUCTED</Text>
      <View style={styles.chartRow}>
        {bars.map((v, i) => {
          const height = Math.min(60, Math.max(10, (v + 2) * 15));
          return <View key={i} style={[styles.bar, { height }]} />
        })}
      </View>
      <View style={styles.statsRow}>
        <Text style={styles.statText}>RHYTHM: {vector.avgFlight.toFixed(1)}ms</Text>
        <Text style={styles.statText}>INERTIA: {vector.stdAccMag.toFixed(3)}G</Text>
      </View>
    </View>
  );
}

function HardwareStatus() {
  return (
    <View style={{ marginTop: 60, width: '100%', padding: 20, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
      <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 15 }}>SYSTEM DIAGNOSTICS</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'monospace' }}>SECURE ENCLAVE</Text>
        <Text style={{ color: '#00FF4D', fontSize: 10, fontFamily: 'monospace' }}>[ CONNECTED ]</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'monospace' }}>ACCELEROMETER</Text>
        <Text style={{ color: '#00FF4D', fontSize: 10, fontFamily: 'monospace' }}>[ CALIBRATED ]</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'monospace' }}>GYROSCOPE</Text>
        <Text style={{ color: '#00FF4D', fontSize: 10, fontFamily: 'monospace' }}>[ 20Hz ACTIVE ]</Text>
      </View>
    </View>
  );
}

function FakeDashboard({ onLogout }) {
  return (
    <View style={styles.dashboard}>
      <CyberBackground />
      <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 40 }}>
        <SvgXml xml={iconSvg} width="40" height="40" />
        <TouchableOpacity onPress={onLogout} style={{backgroundColor: 'rgba(255, 77, 77, 0.05)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255, 77, 77, 0.3)'}}>
          <Text style={{ color: '#ff4d4d', fontFamily: 'monospace', fontSize: 10, fontWeight: 'bold' }}>LOCK VAULT</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
        <Text style={styles.balanceAmount}>$1,204,550.00</Text>
        <Text style={{color: 'rgba(255,255,255,0.4)', marginTop: 10, fontFamily: 'monospace', fontSize: 10}}>32Ve1hyCBwPDg2Br2v16aV9hq5xAkquE5gYif9v4akb1</Text>
      </View>

      <View style={{ width: '100%', marginTop: 30 }}>
         <Text style={styles.balanceLabel}>SEND CRYPTO</Text>
         <TextInput style={[styles.input, { marginBottom: 15, padding: 15 }]} placeholder="Recipient Address" placeholderTextColor="rgba(255,255,255,0.2)" />
         <TextInput style={[styles.input, { marginBottom: 20, padding: 15 }]} placeholder="Amount (SOL)" placeholderTextColor="rgba(255,255,255,0.2)" keyboardType="numeric" />
         <TouchableOpacity style={[styles.btn, { marginBottom: 30 }]}>
            <Text style={styles.btnText}>INITIATE TRANSFER</Text>
         </TouchableOpacity>
      </View>

      <View style={{ width: '100%' }}>
        <Text style={styles.balanceLabel}>SECURITY LOGS</Text>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.01)', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
           <Text style={{ color: 'rgba(0,255,77,0.7)', fontSize: 9, fontFamily: 'monospace', marginBottom: 8 }}>{new Date().toLocaleTimeString()} - Biometric DNA Verified</Text>
           <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'monospace', marginBottom: 8 }}>{new Date().toLocaleTimeString()} - Session token generated</Text>
           <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'monospace' }}>{new Date().toLocaleTimeString()} - Device hardware matched</Text>
        </View>
      </View>
    </View>
  );
}

export default function App() {
  const [phase, setPhase] = useState('welcome'); 
  const [inputText, setInputText] = useState('');
  
  const [enrollStep, setEnrollStep] = useState(0);
  const [enrollments, setEnrollments] = useState([]);
  const [enrolledDNA, setEnrolledDNA] = useState(null);
  
  const [lastVector, setLastVector] = useState(null);
  const [score, setScore] = useState(null);

  const dna = useMobileDNA();

  const handleStart = () => {
    setInputText('');
    setScore(null);
    setLastVector(null);
    if (enrolledDNA) {
      setPhase('auth');
    } else {
      setPhase('enroll');
      setEnrollStep(1);
      setEnrollments([]);
    }
    dna.startCapture();
  };

  const handleTextChange = (text) => {
    setInputText(text);
    if (text === 'Secure my account') {
      const liveVector = dna.extractVector();
      setLastVector(liveVector);
      
      if (phase === 'enroll') {
        if (liveVector) {
          const newEnrollments = [...enrollments, liveVector];
          if (newEnrollments.length >= 3) {
            setEnrolledDNA(newEnrollments[1]); 
            setPhase('result');
            setScore('Enrollment Complete!');
          } else {
            setEnrollments(newEnrollments);
            setEnrollStep(newEnrollments.length + 1);
            setInputText('');
            dna.startCapture();
          }
        } else {
          setScore('Failed: Not enough data. Try again.');
          setInputText('');
          dna.startCapture();
        }
      } else if (phase === 'auth') {
        if (liveVector && enrolledDNA) {
          const matchScore = compareMobileDNA(liveVector, enrolledDNA);
          setScore(`Match Score: ${(matchScore * 100).toFixed(1)}%`);
          
          if (matchScore > 0.65) {
            setTimeout(() => setPhase('dashboard'), 2000);
          } else {
            setPhase('result');
          }
        }
      }
    }
  };

  if (phase === 'dashboard') {
    return <FakeDashboard onLogout={() => setPhase('welcome')} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <CyberBackground />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
        
        {phase === 'welcome' && (
          <>
            <SvgXml xml={iconSvg} width="80" height="80" style={{marginBottom: 20}} />
            <Text style={styles.header}>VAULTLESS</Text>
            <View style={styles.content}>
              <Text style={styles.subtext}>Your password is how you move.</Text>
              <TouchableOpacity style={styles.btn} onPress={handleStart}>
                <Text style={styles.btnText}>{enrolledDNA ? 'AUTHENTICATE' : 'ENROLL PROFILE'}</Text>
              </TouchableOpacity>
              {enrolledDNA && (
                <TouchableOpacity style={{marginTop: 30}} onPress={() => setEnrolledDNA(null)}>
                  <Text style={{color: '#ff4d4d', fontFamily: 'monospace', fontSize: 10, letterSpacing: 2}}>RESET IDENTITY</Text>
                </TouchableOpacity>
              )}
            </View>
            <HardwareStatus />
          </>
        )}

        {(phase === 'enroll' || phase === 'auth') && (
          <View style={styles.content}>
            <SvgXml xml={iconSvg} width="40" height="40" style={{marginBottom: 20, opacity: 0.5}} />
            <Text style={styles.prompt}>
              {phase === 'enroll' ? `Capture ${enrollStep} of 3` : 'Verify Identity'}
            </Text>
            <Text style={styles.phrase}>Secure my account</Text>
            
            <View style={{width: '100%', position: 'relative'}}>
              <Text style={{position: 'absolute', left: 10, top: 22, color: 'rgba(255,255,255,0.1)', fontFamily: 'monospace'}}>❯</Text>
              <TextInput 
                style={styles.input}
                value={inputText}
                onChangeText={handleTextChange}
                onKeyPress={dna.onKeyPress}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
            </View>

            <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 20, width: '100%', paddingHorizontal: 10, justifyContent: 'space-between'}}>
               <Text style={styles.trackingInfo}>Live Gyroscope Sensor</Text>
               <LiveGyroGraph currentVal={dna.liveGyro} />
            </View>
            
            {lastVector && <DNAVisualizer vector={lastVector} />}
          </View>
        )}

        {phase === 'result' && (
          <View style={styles.content}>
            <SvgXml xml={iconSvg} width="60" height="60" style={{marginBottom: 20}} />
            <Text style={styles.resultText}>{score}</Text>
            {score && score.includes('Match Score') && parseFloat(score.split(':')[1]) <= 65 && (
              <Text style={{color: '#ff4d4d', fontFamily: 'monospace', marginTop: 10}}>AUTHENTICATION FAILED</Text>
            )}
            {lastVector && <DNAVisualizer vector={lastVector} />}
            <TouchableOpacity style={styles.btnOutline} onPress={() => setPhase('welcome')}>
              <Text style={styles.btnTextOutline}>BACK</Text>
            </TouchableOpacity>
          </View>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030303' },
  inner: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  header: { color: '#ffffff', fontSize: 22, fontWeight: '500', letterSpacing: 6, marginBottom: 40, fontFamily: 'monospace' },
  content: { width: '100%', alignItems: 'center' },
  subtext: { color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: 2, marginBottom: 40, fontFamily: 'monospace', textAlign: 'center' },
  
  btn: { backgroundColor: 'rgba(0,255,77,0.03)', borderWidth: 1, borderColor: 'rgba(0,255,77,0.3)', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 8, width: '100%', alignItems: 'center' },
  btnText: { color: '#00FF4D', fontWeight: '500', letterSpacing: 3, fontSize: 11, fontFamily: 'monospace' },
  
  btnOutline: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 8, marginTop: 40, width: '100%', alignItems: 'center' },
  btnTextOutline: { color: '#ffffff', opacity: 0.6, fontWeight: '500', letterSpacing: 3, fontSize: 11, fontFamily: 'monospace' },
  
  prompt: { color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: 3, marginBottom: 15, fontFamily: 'monospace', textTransform: 'uppercase' },
  phrase: { color: '#ffffff', fontSize: 22, fontWeight: '400', marginBottom: 40, letterSpacing: 1 },
  input: { width: '100%', backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderRadius: 8, color: '#ffffff', fontSize: 16, padding: 20, fontFamily: 'monospace', textAlign: 'center' },
  trackingInfo: { color: 'rgba(255, 255, 255, 0.3)', fontSize: 9, fontFamily: 'monospace', letterSpacing: 1, textTransform: 'uppercase' },
  resultText: { color: '#ffffff', fontSize: 14, fontFamily: 'monospace', fontWeight: '500', letterSpacing: 2, textAlign: 'center', opacity: 0.9 },
  
  liveGraphContainer: { flexDirection: 'row', alignItems: 'flex-end', height: 20, width: 80, gap: 2, paddingBottom: 2 },
  liveBar: { width: 3, backgroundColor: 'rgba(0,255,77,0.8)', borderRadius: 1 },

  visContainer: { marginTop: 40, width: '100%', alignItems: 'center', padding: 20, backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  visTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'monospace', letterSpacing: 3, marginBottom: 20 },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', height: 50, gap: 4, marginBottom: 20 },
  bar: { width: 8, backgroundColor: 'rgba(0,255,77,0.4)', borderRadius: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 15 },
  statText: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'monospace', letterSpacing: 1 },

  dashboard: { flex: 1, backgroundColor: '#030303', padding: 24, alignItems: 'center' },
  dashTitle: { color: '#ffffff', fontSize: 18, fontWeight: '500', letterSpacing: 6, marginTop: 20, marginBottom: 40, fontFamily: 'monospace' },
  balanceCard: { width: '100%', padding: 30, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  balanceLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 3, marginBottom: 10, fontFamily: 'monospace', width: '100%', textAlign: 'left' },
  balanceAmount: { color: '#ffffff', fontSize: 36, fontWeight: '300', fontFamily: 'monospace', letterSpacing: 1, marginTop: 10 }
});
