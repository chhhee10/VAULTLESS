import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Fingerprint, Lock, Unlock, AlertTriangle, Activity } from 'lucide-react';
import { BehaviouralEngine } from '../lib/behaviouralEngine';

const PHRASE = "Secure my account";

const Auth = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'failed' | 'duress'>('idle');
  const [score, setScore] = useState(0);
  
  const engine = useRef(new BehaviouralEngine(PHRASE));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyUp = (e: React.KeyboardEvent) => {
    engine.current.onKeyUp(e.key);
    if (e.key === 'Enter') {
      if (input === PHRASE) verify();
      else {
        setStatus('failed');
        setTimeout(() => { setStatus('idle'); setInput(""); engine.current.reset(); }, 2000);
      }
    }
  };

  const verify = async () => {
    setStatus('verifying');
    const dna = engine.current.extractDNA();
    if (!dna) {
      setStatus('failed');
      setTimeout(() => { setStatus('idle'); setInput(""); engine.current.reset(); }, 2000);
      return;
    }

    // Similarity logic
    const similarity = BehaviouralEngine.calculateSimilarity(dna.metadata, dna.metadata); // Simulated match
    setScore(similarity);
    
    setTimeout(() => {
      if (similarity > 0.8) {
        setStatus('success');
        setTimeout(() => navigate('/dashboard'), 1500);
      } else if (similarity > 0.4) {
        setStatus('duress');
        setTimeout(() => navigate('/dashboard', { state: { duress: true } }), 2000);
      } else {
        setStatus('failed');
        setTimeout(() => { setStatus('idle'); setInput(""); engine.current.reset(); setScore(0); }, 3000);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background text-text flex flex-col items-center justify-center p-6 relative">
      <div className="hero-bg-grid opacity-10" />
      
      <Link to="/" className="fixed top-12 left-12 font-mono text-[11px] text-neon uppercase tracking-[0.3em] hover:opacity-70 transition-opacity">
        ← Abort.Auth
      </Link>

      <div className="relative z-10 w-full max-w-md text-center">
        {/* Scanner Ring */}
        <div className="relative w-64 h-64 mx-auto mb-16">
          <div className="absolute inset-0 border-4 border-neon/5 rounded-full" />
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <motion.circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke={status === 'failed' ? '#ff4444' : '#00ff7f'}
              strokeWidth="4"
              strokeDasharray="283"
              initial={{ strokeDashoffset: 283 }}
              animate={{ strokeDashoffset: 283 - (score * 283) }}
              transition={{ duration: 1, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {status === 'idle' && <Fingerprint className="w-12 h-12 text-neon animate-pulse" />}
            {status === 'verifying' && <Activity className="w-12 h-12 text-neon animate-spin" />}
            {status === 'success' && <Unlock className="w-12 h-12 text-neon" />}
            {status === 'duress' && <AlertTriangle className="w-12 h-12 text-amber-500" />}
            {status === 'failed' && <Lock className="w-12 h-12 text-red-500" />}
            
            <div className="mt-4 font-mono text-[10px] text-muted tracking-[0.4em] uppercase">
              {status === 'idle' && "Ready"}
              {status === 'verifying' && "Scanning"}
              {status === 'success' && "Verified"}
              {status === 'duress' && "Duress_Alert"}
              {status === 'failed' && "Reject_Mismatch"}
            </div>
          </div>
        </div>

        <h1 className="hero-headline !text-4xl !mb-8 uppercase">Authenticate <span className="text-neon">Identity</span></h1>
        
        <div className="bg-background2 border border-neon/10 p-8 clip-vault relative">
          <div className="font-mono text-[10px] text-muted uppercase tracking-[0.2em] mb-4">Verification_Input</div>
          <input
            ref={inputRef}
            type="password"
            className="w-full bg-background/50 border border-neon/20 py-4 px-6 text-center text-neon text-2xl outline-none clip-vault font-mono placeholder:opacity-10"
            placeholder="••••••••••••"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => engine.current.onKeyDown(e.key)}
            onKeyUp={handleKeyUp}
            disabled={status !== 'idle'}
            autoComplete="off"
          />
        </div>
        
        <div className="mt-8 font-mono text-[10px] text-muted uppercase tracking-[0.2em]">
          Match_Probability: <span className="text-neon">{(score * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
