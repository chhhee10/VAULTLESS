import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  useEffect(() => {
    // Typing animation logic from reference
    const phrase = "Secure my account";
    const el = document.getElementById('typed-phrase');
    if (el) {
      let i = 0;
      const interval = setInterval(() => {
        el.innerText = phrase.slice(0, i);
        i++;
        if (i > phrase.length) clearInterval(interval);
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    // Scroll reveal observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-wrapper">
      {/* NAV */}
      <nav>
        <a href="#" className="nav-logo">
          <svg className="hex-icon" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="14,2 25,8 25,20 14,26 3,20 3,8" fill="none" stroke="#00ff7f" strokeWidth="1.5"/>
            <polygon points="14,7 21,11 21,19 14,23 7,19 7,11" fill="rgba(0,255,127,0.1)" stroke="#00ff7f" strokeWidth="0.8"/>
            <circle cx="14" cy="15" r="2.5" fill="#00ff7f"/>
          </svg>
          VAULTLESS
        </a>
        <ul className="nav-links">
          <li><a href="#how">Protocol</a></li>
          <li><a href="#tech">Technology</a></li>
          <li><a href="#demo">Demo</a></li>
          <li><a href="#chain">Stack</a></li>
        </ul>
        <Link to="/enroll" className="nav-cta">Try Demo</Link>
      </nav>

      {/* SECTION 1: HERO */}
      <section id="hero">
        <div className="hero-bg-grid"></div>
        <div className="hero-hex-bg">
          <svg width="700" height="700" viewBox="0 0 700 700" fill="none">
            <polygon points="350,50 622,200 622,500 350,650 78,500 78,200" fill="none" stroke="#00ff7f" strokeWidth="1"/>
            <polygon points="350,120 562,237 562,463 350,580 138,463 138,237" fill="none" stroke="#00ff7f" strokeWidth="0.5"/>
            <polygon points="350,190 502,274 502,426 350,510 198,426 198,274" fill="none" stroke="#00ff7f" strokeWidth="0.5"/>
          </svg>
        </div>
        <div className="pulse-ring" style={{top:'50%', left:'50%', transform:'translate(-50%,-50%)'}}></div>
        <div className="hero-counter">001 / IDENTITY</div>
        <p className="hero-kicker">Gesture DNA Authentication</p>
        <h1 className="hero-headline">
          <span className="line-ghost">NO PASS</span>
          <span className="line-accent">WORD.</span>
          <span className="line-ghost">EVER.</span>
        </h1>
        <p className="hero-sub !mt-6 !mb-2">
          Your typing rhythm is your cryptographic key. It exists for milliseconds — never stored, never stolen.
        </p>
        <div className="typing-text !mt-4 !mb-8">
          <span id="typed-phrase">S</span><div className="typing-cursor"></div>
        </div>
        <div className="hero-actions !mt-0">
          <Link to="/enroll" className="btn-primary">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><polygon points="7,1 13,4 13,10 7,13 1,10 1,4" fill="none" stroke="currentColor" strokeWidth="1.2"/></svg>
            See It Live
          </Link>
          <a href="#how" className="btn-outline">How It Works</a>
        </div>
        <div className="hero-scroll-hint">
          <div className="scroll-line"></div>
          <span>Scroll</span>
        </div>
      </section>

      {/* MARQUEE STRIP */}
      <div className="marquee-strip">
        <div className="marquee-track">
          {[1,2,3,4,5,6].map(i => (
            <span key={i} className="marquee-item">
              <span className="marquee-dot"></span> BCH-64 ERROR CORRECTION
              <span className="marquee-dot"></span> SECURE SKETCH PROTOCOL
              <span className="marquee-dot"></span> SOLANA DEVNET VERIFIED
              <span className="marquee-dot"></span> ZERO STORAGE POLICY
            </span>
          ))}
        </div>
      </div>

      {/* SECTION 2: INTRO */}
      <section id="intro">
        <div className="intro-inner">
          <div className="intro-label reveal">The Protocol</div>
          <p className="intro-bigtext reveal">
            <em>80% of breaches</em> involve compromised passwords.<span className="dim"> We eliminated the password entirely.</span>
            The <em>micro-dynamics of how you type</em> — hold times, flight times, rhythm variance —
            <span className="dim">become a 256-bit cryptographic key that reconstructs only when</span>
            <em>you</em> are present.
          </p>
        </div>
      </section>

      {/* SECTION 3: HOW IT WORKS */}
      <section id="how">
        <div className="section-header">
          <h2 className="section-title reveal">How It<br/>Works</h2>
          <span className="section-count reveal">— 003 steps</span>
        </div>
        <div className="steps-grid">
          <div className="step reveal">
            <div className="step-num">01 — Capture</div>
            <svg className="step-icon" viewBox="0 0 48 48" fill="none">
              <polygon points="24,4 44,15 44,33 24,44 4,33 4,15" stroke="#00ff7f" strokeWidth="1" fill="rgba(0,255,127,0.05)"/>
              <rect x="17" y="20" width="3" height="10" fill="#00ff7f" rx="1"/>
              <rect x="22" y="16" width="3" height="14" fill="#00ff7f" rx="1" opacity=".6"/>
              <rect x="27" y="18" width="3" height="12" fill="#00ff7f" rx="1" opacity=".4"/>
            </svg>
            <h3 className="step-title">Keystroke DNA Sampling</h3>
            <p className="step-desc">10 typing samples of your enrollment phrase capture hold times, flight times, and rhythm variance into a Float32[64] biometric vector.</p>
            <span className="step-tag">behaviouralEngine.ts</span>
          </div>
          <div className="step reveal">
            <div className="step-num">02 — Extract</div>
            <svg className="step-icon" viewBox="0 0 48 48" fill="none">
              <polygon points="24,4 44,15 44,33 24,44 4,33 4,15" stroke="#00ff7f" strokeWidth="1" fill="rgba(0,255,127,0.05)"/>
              <circle cx="24" cy="24" r="8" stroke="#00ff7f" strokeWidth="1" strokeDasharray="3 2"/>
              <circle cx="24" cy="24" r="2" fill="#00ff7f"/>
            </svg>
            <h3 className="step-title">Fuzzy Key Extraction</h3>
            <p className="step-desc">BCH error-correcting codes + HKDF-SHA256 convert your vector into a stable 256-bit cryptographic key. The sketch is stored on Solana — the key never is.</p>
            <span className="step-tag">fuzzyExtractor.ts</span>
          </div>
          <div className="step reveal">
            <div className="step-num">03 — Authenticate</div>
            <svg className="step-icon" viewBox="0 0 48 48" fill="none">
              <polygon points="24,4 44,15 44,33 24,44 4,33 4,15" stroke="#00ff7f" strokeWidth="1" fill="rgba(0,255,127,0.05)"/>
              <path d="M17 24 L22 29 L31 19" stroke="#00ff7f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3 className="step-title">On-Chain Verification</h3>
            <p className="step-desc">One typing sample reconstructs the key. Commitment verified. Nullifier burned on Solana devnet. Access granted.</p>
            <span className="step-tag">solana.ts</span>
          </div>
        </div>
      </section>

      {/* SECTION 4: STATS */}
      <section id="stats">
        <div className="stats-bg-hex">
          <svg width="600" height="600" viewBox="0 0 600 600" fill="none">
            <polygon points="300,40 532,170 532,430 300,560 68,430 68,170" stroke="#00ff7f" strokeWidth="1"/>
          </svg>
        </div>
        <div className="stats-row">
          <div className="stat-item reveal">
            <span className="stat-number">98%</span>
            <span className="stat-label">Accuracy Rate</span>
          </div>
          <div className="stat-item reveal">
            <span className="stat-number">256bit</span>
            <span className="stat-label">Key Strength</span>
          </div>
          <div className="stat-item reveal">
            <span className="stat-number">0</span>
            <span className="stat-label">Passwords Stored</span>
          </div>
          <div className="stat-item reveal">
            <span className="stat-number">80%</span>
            <span className="stat-label">Breach Reduction</span>
          </div>
        </div>
      </section>

      {/* SECTION 5: TECH DEEP DIVE */}
      <section id="tech">
        <div className="tech-visual">
          <div className="tech-ring ring-1"></div>
          <div className="tech-ring ring-2"></div>
          <div className="tech-ring ring-3"></div>
          <div className="tech-dot" style={{top:'2%',left:'50%',transform:'translate(-50%,-50%)'}}></div>
          <div className="tech-dot" style={{top:'50%',right:'2%',transform:'translate(50%,-50%)'}}></div>
          <div className="tech-center">
            <svg width="180" height="180" viewBox="0 0 180 180" fill="none">
              <polygon points="90,16 158,54 158,126 90,164 22,126 22,54" fill="rgba(0,255,127,0.07)" stroke="#00ff7f" strokeWidth="1.5"/>
              <circle cx="90" cy="90" r="18" fill="rgba(0,255,127,0.15)" stroke="#00ff7f" strokeWidth="1"/>
              <circle cx="90" cy="90" r="6" fill="#00ff7f"/>
            </svg>
          </div>
        </div>

        <div className="tech-content">
          <p className="tech-label reveal">Under the Hood</p>
          <h2 className="tech-title reveal">Biometrics meet<br/>Cryptography</h2>
          <p className="tech-body reveal">
            The Gesture DNA system applies Fuzzy Extractor theory to keystroke biometrics. Your behavioral pattern is error-corrected and converted to a reproducible key by HKDF-SHA256.
          </p>
          <ul className="tech-bullets reveal">
            <li>Pearson correlation on hold/flight Z-scores</li>
            <li>BCH error-correction tolerates natural variation</li>
            <li>Stress detection triggers duress mode automatically</li>
            <li>Burned nullifiers prevent replay attacks on-chain</li>
          </ul>
        </div>
      </section>

      {/* SECTION 6: DEMO ACTS */}
      <section id="demo">
        <div className="section-header">
          <h2 className="section-title reveal">Three Acts.<br/>One Phrase.</h2>
          <span className="section-count reveal">— 005 demo</span>
        </div>
        <div className="acts-grid">
          <div className="act-card reveal">
            <div className="act-num">ACT 01 / ENROLL</div>
            <h3 className="act-title">Capture<br/><span>Your Rhythm</span></h3>
            <p className="act-body">Type "Secure my account" 3 times. The sketch stores to Solana. The key exists nowhere until you type again.</p>
            <div className="act-status auth"><div className="status-dot"></div> INITIALIZED</div>
          </div>
          <div className="act-card reveal">
            <div className="act-num">ACT 02 / AUTH</div>
            <h3 className="act-title">Verify<br/><span>Identity</span></h3>
            <p className="act-body">Type the phrase once. If the rhythm matches, the key reconstructs and unlocks the vault. Smooth and instant.</p>
            <div className="act-status auth"><div className="status-dot"></div> SUCCESS</div>
          </div>
          <div className="act-card reveal">
            <div className="act-num">ACT 03 / DURESS</div>
            <h3 className="act-title">Forced<br/><span>Entry</span></h3>
            <p className="act-body">If someone forces you to type, your stress changes your rhythm. The vault opens a decoy state with zero balance.</p>
            <div className="act-status duress"><div className="status-dot"></div> DECOY_TRIGGER</div>
          </div>
        </div>
      </section>

      {/* SECTION 7: CHAIN STACK */}
      <section id="chain">
        <div className="chain-inner">
          <h2 className="chain-title reveal">Engineered for<br/>Solana</h2>
          <p className="chain-sub reveal">Low latency, high security, and zero friction. The next generation of wallet security.</p>
          <div className="chain-logos reveal">
            <div className="chain-logo"><strong>SOLANA</strong> L1 SETTLEMENT</div>
            <div className="chain-logo"><strong>ANCHOR</strong> PDA LOGIC</div>
            <div className="chain-logo"><strong>ED25519</strong> SIGNATURES</div>
          </div>
        </div>
      </section>

      {/* SECTION 8: MANIFESTO */}
      <section id="manifesto">
        <div className="manifesto-bg">
          <svg width="800" height="400" viewBox="0 0 800 400" fill="none">
            <polygon points="400,0 800,200 400,400 0,200" fill="none" stroke="#00ff7f" strokeWidth="0.5" opacity="0.1"/>
          </svg>
        </div>
        <div className="manifesto-inner">
          <p className="manifesto-text reveal">
            "We believe security shouldn't be a trade-off for convenience. By using <em>behavioral DNA</em>, we turn <em>you</em> into the key. No master passwords, no seed phrases, just <em>human rhythm</em>."
          </p>
          <div className="manifesto-source reveal">VAULTLESS CORE TEAM</div>
        </div>
      </section>

      {/* SECTION 9: CTA */}
      <section id="cta">
        <p className="cta-label reveal">Ready to upgrade?</p>
        <h2 className="cta-title reveal">The future is <span className="green">Passwordless.</span></h2>
        <div className="cta-actions reveal">
          <Link to="/enroll" className="btn-primary">Initialize Vault</Link>
          <a href="https://github.com/chhhee10/VAULTLESS" className="btn-outline">Documentation</a>
        </div>
      </section>

      <footer>
        <a href="#" className="footer-logo">
          <svg className="hex-icon" viewBox="0 0 28 28" fill="none">
            <polygon points="14,2 25,8 25,20 14,26 3,20 3,8" fill="none" stroke="#00ff7f" strokeWidth="1.5"/>
          </svg>
          VAULTLESS
        </a>
        <div className="footer-info">© 2026 VAULTLESS PROTOCOL. ALL RIGHTS RESERVED.</div>
        <ul className="footer-links">
          <li><a href="https://github.com/chhhee10/VAULTLESS">GITHUB</a></li>
          <li><a href="#">DOCS</a></li>
        </ul>
      </footer>
    </div>
  );
};

export default Landing;
