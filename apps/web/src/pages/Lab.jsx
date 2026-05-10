import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useVaultless } from '../lib/VaultlessContext';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { 
  pearsonCorrelation, 
  zNormalize, 
  ratioSimilarity, 
  safeDivRatio, 
  TRUST_POLICIES 
} from '@vaultless/core';
import BinaryGlitchBackground from '../components/BinaryGlitchBackground';

export default function Lab() {
  const navigate = useNavigate();
  const { 
    enrollmentVector, 
    enrollmentKeystroke, 
    enrollmentMouse,
    lastLiveVector,
    lastLiveKeystroke,
    lastLiveMouse,
    lastAuthScore 
  } = useVaultless();

  const [activeTab, setActiveTab] = useState('overview'); // overview | timing | comparison

  // Calculate detailed breakdown
  const stats = useMemo(() => {
    if (!enrollmentKeystroke || !lastLiveKeystroke) return null;

    const liveK = lastLiveKeystroke;
    const enrollK = enrollmentKeystroke;

    const liveHZ   = liveK.holdTimesZ   || zNormalize(liveK.holdTimes   || []);
    const enrollHZ = enrollK.holdTimesZ || zNormalize(enrollK.holdTimes  || []);
    const liveFZ   = liveK.flightTimesZ || zNormalize(liveK.flightTimes  || []);
    const enrollFZ = enrollK.flightTimesZ || zNormalize(enrollK.flightTimes || []);

    const holdPatternScore = pearsonCorrelation(liveHZ, enrollHZ);
    const flightPatternScore = pearsonCorrelation(liveFZ, enrollFZ);
    const holdRatioScore = ratioSimilarity(liveK.holdTimes || [], enrollK.holdTimes || []);
    const durScore = safeDivRatio(liveK.totalDuration, enrollK.totalDuration);

    let mouseScore = null;
    if (lastLiveMouse && enrollmentMouse) {
      const liveVelZ   = lastLiveMouse.velocitiesZ   || zNormalize(lastLiveMouse.velocities   || []);
      const enrollVelZ = enrollmentMouse.velocitiesZ || zNormalize(enrollMouse.velocities || []);
      mouseScore = pearsonCorrelation(liveVelZ, enrollVelZ);
    }

    return {
      holdPattern: holdPatternScore,
      flightPattern: flightPatternScore,
      holdRatio: holdRatioScore,
      speedMatch: durScore,
      gesturePattern: mouseScore,
      final: lastAuthScore
    };
  }, [enrollmentKeystroke, lastLiveKeystroke, enrollmentMouse, lastLiveMouse, lastAuthScore]);

  // Prepare chart data for Timing DNA
  const chartData = useMemo(() => {
    if (!enrollmentKeystroke || !lastLiveKeystroke) return [];
    
    const maxLen = Math.max(enrollmentKeystroke.holdTimes.length, lastLiveKeystroke.holdTimes.length);
    const data = [];
    
    for (let i = 0; i < maxLen; i++) {
      data.push({
        index: i,
        enrolledHold: enrollmentKeystroke.holdTimes[i] || 0,
        liveHold: lastLiveKeystroke.holdTimes[i] || 0,
        enrolledFlight: enrollmentKeystroke.flightTimes[i] || 0,
        liveFlight: lastLiveKeystroke.flightTimes[i] || 0,
      });
    }
    return data;
  }, [enrollmentKeystroke, lastLiveKeystroke]);

  // Prepare full vector comparison (64-dim)
  const vectorComparison = useMemo(() => {
    if (!enrollmentVector || !lastLiveVector) return [];
    const data = [];
    for (let i = 0; i < 64; i++) {
      data.push({
        dim: i,
        enrolled: enrollmentVector[i],
        live: lastLiveVector[i]
      });
    }
    return data;
  }, [enrollmentVector, lastLiveVector]);

  if (!enrollmentVector) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white font-mono p-8">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">LAB ACCESS DENIED</h1>
          <p className="text-white/40 text-sm mb-8">No biometric enrollment data found on this device. Please enroll first to analyze DNA patterns.</p>
          <button onClick={() => navigate('/enroll')} className="border border-[#00FF4D] text-[#00FF4D] px-6 py-2 rounded-full text-xs uppercase tracking-widest">Enroll Profile</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f2] font-sans flex flex-col relative overflow-hidden text-black selection:bg-[#00FF4D] selection:text-black">
      <BinaryGlitchBackground />
      
      {/* Header */}
      <header className="p-8 md:px-12 flex items-center justify-between z-20 relative">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-xs font-bold tracking-[0.2em] uppercase hover:opacity-70 transition-opacity">← VAULTLESS</button>
          <span className="text-white/20">/</span>
          <span className="text-[10px] font-mono font-bold tracking-[0.3em] uppercase bg-black text-white px-3 py-1 rounded-full">Biometric Lab</span>
        </div>
        <div className="text-[10px] font-mono text-black/40">INTERNAL USE ONLY // V.1.0.4</div>
      </header>

      <main className="flex-1 px-8 md:px-12 pb-24 z-10 relative max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Summary Metrics */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-black border-2 border-black rounded-3xl p-8 text-white shadow-2xl"
            >
              <h3 className="text-[10px] font-mono tracking-[0.4em] text-[#00FF4D] uppercase mb-8">Authentication Math</h3>
              
              {stats ? (
                <div className="space-y-8">
                  <MetricRow label="Hold Pattern (Pearson)" value={stats.holdPattern} />
                  <MetricRow label="Flight Pattern (Pearson)" value={stats.flightPattern} />
                  <MetricRow label="Hold Ratio (Intensity)" value={stats.holdRatio} />
                  <MetricRow label="Temporal Match (Speed)" value={stats.speedMatch} />
                  {stats.gesturePattern !== null && (
                    <MetricRow label="Gesture Pattern (Mouse)" value={stats.gesturePattern} />
                  )}
                  
                  <div className="pt-8 border-t border-white/10">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Final Weighted Score</span>
                      <span className="text-2xl font-display font-bold text-[#00FF4D]">{(stats.final * 100).toFixed(2)}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.final * 100}%` }}
                        className="h-full bg-[#00FF4D]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-white/40 text-xs font-mono uppercase tracking-widest leading-relaxed">
                  <div className="text-3xl mb-4">⏳</div>
                  Awaiting Live Attempt<br/><br/>
                  <span className="text-[9px]">Perform an authentication or transaction to generate comparison metrics.</span>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right: Detailed Visualization */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border-2 border-black rounded-3xl p-8 shadow-xl min-h-[600px] flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
                <div className="flex bg-black/5 p-1 rounded-xl">
                  {['overview', 'timing', 'gestures', 'vectors'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                        activeTab === tab ? 'bg-black text-white' : 'text-black/40 hover:text-black'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00FF4D]" />
                    <span className="text-[9px] font-mono uppercase">Enrolled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#0088ff]" />
                    <span className="text-[9px] font-mono uppercase">Live Attempt</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-[400px] relative">
                {!lastLiveVector && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl border border-black/10">
                    <div className="text-center font-mono text-xs text-black/50 uppercase tracking-widest">
                      Perform authentication to view overlay
                    </div>
                  </div>
                )}
                <ResponsiveContainer width="100%" minHeight={400}>
                  {activeTab === 'overview' ? (
                    <BarChart data={[
                      { name: 'Hold Pattern', score: Math.max(0.05, stats?.holdPattern || 0) },
                      { name: 'Flight Pattern', score: Math.max(0.05, stats?.flightPattern || 0) },
                      { name: 'Intensity', score: Math.max(0.05, stats?.holdRatio || 0) },
                      { name: 'Speed', score: Math.max(0.05, stats?.speedMatch || 0) },
                      ...(stats?.gesturePattern !== null ? [{ name: 'Gestures', score: Math.max(0.05, stats?.gesturePattern || 0) }] : [])
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#000', opacity: 0.5, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 1]} hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '10px', fontFamily: 'monospace' }}
                        formatter={(value) => [(value * 100).toFixed(1) + '%', 'Similarity']}
                      />
                      <Bar dataKey="score" fill="#0088ff" radius={[4, 4, 0, 0]} barSize={40}>
                        {
                          [
                            { name: 'Hold Pattern', score: Math.max(0.05, stats?.holdPattern || 0) },
                            { name: 'Flight Pattern', score: Math.max(0.05, stats?.flightPattern || 0) },
                            { name: 'Intensity', score: Math.max(0.05, stats?.holdRatio || 0) },
                            { name: 'Speed', score: Math.max(0.05, stats?.speedMatch || 0) },
                            ...(stats?.gesturePattern !== null ? [{ name: 'Gestures', score: Math.max(0.05, stats?.gesturePattern || 0) }] : [])
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.score > 0.7 ? '#00FF4D' : entry.score > 0.4 ? '#0088ff' : '#ff0044'} />
                          ))
                        }
                      </Bar>
                    </BarChart>
                  ) : activeTab === 'timing' ? (
                    chartData.length > 0 ? (
                      <div className="flex flex-col h-full gap-4 relative">
                        <div className="flex-1 relative min-h-[200px] bg-white/5 border border-black/5 rounded-xl p-4">
                          <div className="absolute top-4 left-4 z-10 text-[10px] font-mono text-black/40 uppercase font-bold tracking-widest">Hold Times</div>
                          <ResponsiveContainer width="100%" height={180}>
                            <AreaChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorEnroll" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#00FF4D" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#00FF4D" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorLive" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#0088ff" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#0088ff" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                              <XAxis dataKey="index" hide />
                              <YAxis hide />
                              <Tooltip />
                              <Area type="monotone" dataKey="enrolledHold" stroke="#00FF4D" fillOpacity={1} fill="url(#colorEnroll)" strokeWidth={2} />
                              <Area type="monotone" dataKey="liveHold" stroke="#0088ff" fillOpacity={1} fill="url(#colorLive)" strokeWidth={2} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex-1 relative min-h-[200px] bg-white/5 border border-black/5 rounded-xl p-4">
                          <div className="absolute top-4 left-4 z-10 text-[10px] font-mono text-black/40 uppercase font-bold tracking-widest">Flight Times</div>
                          <ResponsiveContainer width="100%" height={180}>
                            <AreaChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                              <XAxis dataKey="index" hide />
                              <YAxis hide />
                              <Tooltip />
                              <Area type="monotone" dataKey="enrolledFlight" stroke="#00FF4D" fillOpacity={1} fill="url(#colorEnroll)" strokeWidth={2} />
                              <Area type="monotone" dataKey="liveFlight" stroke="#0088ff" fillOpacity={1} fill="url(#colorLive)" strokeWidth={2} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center font-mono text-xs text-black/50 uppercase tracking-widest">
                          Insufficient Keystroke Data
                        </div>
                      </div>
                    )
                  ) : activeTab === 'gestures' ? (
                    (enrollmentMouse?.velocities?.length > 0 || lastLiveMouse?.velocities?.length > 0) ? (
                      <div className="flex-1 relative min-h-[300px] bg-white/5 border border-black/5 rounded-xl p-4">
                        <div className="absolute top-4 left-4 z-10 text-[10px] font-mono text-black/40 uppercase font-bold tracking-widest">Mouse Velocity Over Time</div>
                        <ResponsiveContainer width="100%" height={260}>
                          <AreaChart data={
                            Array.from({ length: Math.max(enrollmentMouse?.velocities?.length || 0, lastLiveMouse?.velocities?.length || 0) }).map((_, i) => ({
                                index: i,
                                enrolled: enrollmentMouse?.velocities?.[i] || 0,
                                live: lastLiveMouse?.velocities?.[i] || 0
                              }))
                          } margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                            <XAxis dataKey="index" hide />
                            <YAxis hide />
                            <Tooltip />
                            <Area type="monotone" dataKey="enrolled" stroke="#00FF4D" fill="#00FF4D" fillOpacity={0.1} />
                            <Area type="monotone" dataKey="live" stroke="#0088ff" fill="#0088ff" fillOpacity={0.1} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center font-mono text-xs text-black/50 uppercase tracking-widest">
                          Insufficient Mouse Movement Data
                        </div>
                      </div>
                    )
                  ) : (
                    <BarChart data={vectorComparison}>
                      <XAxis dataKey="dim" hide />
                      <YAxis hide />
                      <Tooltip />
                      <Bar dataKey="enrolled" fill="#00FF4D" />
                      <Bar dataKey="live" fill="#0088ff" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-8 pt-8 border-t border-black/5">
                <div>
                  <div className="text-[9px] font-mono text-black/40 uppercase mb-2">Entropy Source</div>
                  <div className="text-xs font-bold uppercase tracking-widest">Behavioral DNA</div>
                </div>
                <div>
                  <div className="text-[9px] font-mono text-black/40 uppercase mb-2">Vector Size</div>
                  <div className="text-xs font-bold uppercase tracking-widest">64-Dimension Float32</div>
                </div>
                <div>
                  <div className="text-[9px] font-mono text-black/40 uppercase mb-2">Normalization</div>
                  <div className="text-xs font-bold uppercase tracking-widest">Standard Z-Score</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function MetricRow({ label, value }) {
  const score = ((value + 1) / 2) * 100; // Normalized for display
  return (
    <div className="group">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest group-hover:text-[#00FF4D] transition-colors">{label}</span>
        <span className="text-xs font-mono font-bold">{value.toFixed(4)}</span>
      </div>
      <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-white/20" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
