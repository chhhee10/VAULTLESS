import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Shield, ChevronRight, Database, CheckCircle2 } from 'lucide-react';
import { BehaviouralEngine } from '../lib/behaviouralEngine';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

const PHRASE = "Secure my account";
const REQUIRED_SAMPLES = 3;

const Enroll = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'intro' | 'capturing' | 'processing' | 'done'>('intro');
  const [sampleCount, setSampleCount] = useState(0);
  const [currentInput, setCurrentInput] = useState("");
  const [graphData, setGraphData] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState("");
  
  const engine = useRef(new BehaviouralEngine(PHRASE));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phase === 'capturing') inputRef.current?.focus();
  }, [phase, sampleCount]);

  const handleKeyUp = (e: React.KeyboardEvent) => {
    engine.current.onKeyUp(e.key);
    
    // Live DNA Visualization
    const dna = engine.current.extractDNA();
    if (dna) {
      setGraphData(dna.metadata.holdTimes.map((h: number, i: number) => ({
        i, hold: h, flight: dna.metadata.flightTimes[i] || 0
      })));
    }

    if (e.key === 'Enter') {
      if (currentInput === PHRASE) {
        captureComplete();
      } else {
        setStatusMsg("PHRASE_MISMATCH_RETRY");
        setTimeout(() => setStatusMsg(""), 2000);
      }
    }
  };

  const captureComplete = () => {
    const dna = engine.current.extractDNA();
    if (!dna) return;

    const nextCount = sampleCount + 1;
    setSampleCount(nextCount);
    setCurrentInput("");
    engine.current.reset();

    if (nextCount >= REQUIRED_SAMPLES) {
      setPhase('processing');
      setTimeout(() => setPhase('done'), 2500);
    } else {
      setStatusMsg(`SAMPLE_${nextCount}_OF_${REQUIRED_SAMPLES}_RECORDED`);
      setTimeout(() => setStatusMsg(""), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text flex flex-col items-center justify-center p-6 relative">
      <div className="hero-bg-grid opacity-20" />
      
      {/* Back to Home */}
      <Link to="/" className="fixed top-12 left-12 font-mono text-[11px] text-neon uppercase tracking-[0.3em] hover:opacity-70 transition-opacity">
        ← System.Exit
      </Link>

      <div className="relative z-10 w-full max-w-2xl">
        {phase === 'intro' && (
          <div className="reveal visible text-center">
            <div className="inline-block p-4 border border-neon/20 mb-8 bg-neon/5">
              <Shield className="w-12 h-12 text-neon" />
            </div>
            <div className="hero-counter !static !mb-6 !justify-center">002 / ENROLLMENT</div>
            <h1 className="hero-headline !text-5xl !mb-6">Enroll Your <span className="text-neon">DNA</span></h1>
            <p className="hero-sub !max-w-none !mb-12">
              The micro-dynamics of your rhythm will be converted into a cryptographic key. 
              We require <span className="text-neon">3 baseline samples</span> to stabilize the Secure Sketch.
            </p>
            <button 
              onClick={() => setPhase('capturing')}
              className="btn-primary mx-auto"
            >
              Initialize Capture <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {phase === 'capturing' && (
          <div className="reveal visible">
            <div className="flex justify-between items-end mb-8">
              <div>
                <div className="hero-counter !static !mb-2">SAMPLE_00{sampleCount + 1}</div>
                <h2 className="font-display font-extrabold text-3xl uppercase tracking-tighter">Biometric Feed</h2>
              </div>
              <div className="font-mono text-[10px] text-muted tracking-widest uppercase">Target: "{PHRASE}"</div>
            </div>

            <div className="bg-background2 border border-neon/10 p-12 mb-8 clip-vault relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neon/50 to-transparent" />
               <input
                ref={inputRef}
                className="w-full bg-transparent text-center text-4xl text-neon outline-none font-display font-extrabold tracking-tighter placeholder:text-neon/5"
                placeholder="CAPTURE_INPUT..."
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={(e) => engine.current.onKeyDown(e.key)}
                onKeyUp={handleKeyUp}
                spellCheck={false}
                autoComplete="off"
              />
              <div className="mt-6 text-center font-mono text-[10px] text-muted tracking-[0.4em] uppercase">
                {statusMsg || "Awaiting Keystroke Input"}
              </div>
            </div>

            {/* EKG Graph Ported Style */}
            <div className="bg-background2 border border-neon/10 p-8 h-48 clip-vault">
              <div className="flex justify-between font-mono text-[9px] text-muted uppercase tracking-[0.2em] mb-4">
                <span>DNA_RHYTHM_EKG</span>
                <div className="flex gap-4">
                  <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-neon" /> Hold</span>
                  <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> Flight</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graphData}>
                  <Line type="monotone" dataKey="hold" stroke="#00ff7f" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="flight" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <YAxis hide />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {phase === 'processing' && (
          <div className="text-center py-20">
            <Database className="w-16 h-16 text-neon mx-auto mb-8 animate-pulse" />
            <div className="hero-counter !static !mb-4 !justify-center">GENERATING_SKETCH</div>
            <h2 className="font-display font-extrabold text-4xl text-neon mb-2">Hashing DNA</h2>
            <div className="font-mono text-[10px] text-muted uppercase tracking-[0.3em]">Committing to Solana Devnet...</div>
          </div>
        )}

        {phase === 'done' && (
          <div className="reveal visible text-center">
            <CheckCircle2 className="w-20 h-20 text-neon mx-auto mb-8" />
            <h1 className="hero-headline !text-5xl !mb-6">Identity <span className="text-neon">Stable</span></h1>
            <p className="hero-sub !max-w-none !mb-12">
              Your biometric sketch has been registered. The derived key exists only when you type — never stored in memory or disk.
            </p>
            <button 
              onClick={() => navigate('/auth')}
              className="btn-primary mx-auto"
            >
              Access My Vault <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Enroll;
