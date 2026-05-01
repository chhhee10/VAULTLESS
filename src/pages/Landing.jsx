import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useVaultless } from "../lib/VaultlessContext";
import { useViewport } from "../hooks/useViewport";
import HexLoader from "../components/HexLoader";

export default function Landing() {
  const navigate = useNavigate();
  const { demoMode, setDemoMode } = useVaultless();
  const { isMobile } = useViewport();
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);

  // particles run immediately — landing page is alive under the loader
  useEffect(() => {
    window.scrollTo(0, 0);
    const cleanup = animateParticles(canvasRef.current);
    return cleanup;
  }, []);

  const handleLoaderFinish = useCallback(() => setLoading(false), []);
  const ui = {
    demoToggle: isMobile ? { ...s.demoToggle, top: 'auto', bottom: 16, right: 12, left: 12, justifyContent: 'space-between', padding: '8px 12px' } : s.demoToggle,
    hero: isMobile ? { ...s.hero, padding: '96px 16px 104px' } : s.hero,
    badge: isMobile ? { ...s.badge, marginBottom: 28, padding: '7px 14px' } : s.badge,
    badgeText: isMobile ? { ...s.badgeText, fontSize: 10, letterSpacing: 2 } : s.badgeText,
    sub: isMobile ? { ...s.sub, fontSize: 13, letterSpacing: '0.05em', marginBottom: 34 } : s.sub,
    ctaPrimary: isMobile ? { ...s.ctaPrimary, width: '100%', maxWidth: 320, padding: '14px 20px' } : s.ctaPrimary,
    glitchBlock: isMobile ? { ...s.glitchBlock, marginBottom: 40 } : s.glitchBlock,
    glitchLine: isMobile ? { ...s.glitchLine, fontSize: 11, letterSpacing: '0.1em' } : s.glitchLine,
    card: isMobile ? { ...s.card, flex: '1 1 100%', maxWidth: '100%', padding: '22px 18px' } : s.card,
    statsBar: isMobile ? { ...s.statsBar, flexDirection: 'column', padding: '18px 16px', gap: 0, alignItems: 'stretch' } : s.statsBar,
    statWrap: isMobile ? { width: '100%' } : { display: 'flex', alignItems: 'center' },
    stat: isMobile ? { ...s.stat, padding: '18px 0' } : s.stat,
    statNum: isMobile ? { ...s.statNum, fontSize: 32 } : s.statNum,
    statLabel: isMobile ? { ...s.statLabel, fontSize: 14, lineHeight: 1.5, maxWidth: '100%' } : s.statLabel,
    statDivider: isMobile ? { ...s.statDivider, width: '100%', height: 1 } : s.statDivider,
  };

  return (
    <>
      {/* Loader sits on top, landing page always rendered underneath */}
      {loading && <HexLoader onFinish={handleLoaderFinish} />}

      <div style={s.root}>
        <canvas ref={canvasRef} style={s.canvas} />
        <div style={s.scanline} />

        <div style={ui.demoToggle}>
          <span style={s.demoLabel}>DEMO MODE</span>
          <button
            style={{ ...s.toggle, background: demoMode ? '#00ff88' : '#333' }}
            onClick={() => setDemoMode(!demoMode)}
          >
            {demoMode ? 'ON' : 'OFF'}
          </button>
        </div>

        <div style={ui.hero}>

          <div style={ui.badge}>
            <span style={s.badgeDot} />
            <span style={ui.badgeText}>LIVE ON ETHEREUM SEPOLIA</span>
          </div>

          <h1 style={s.headline}>
            <span style={s.hl1}>Your password</span>
            <br />
            <span style={s.hl2}>is how you move.</span>
          </h1>

          <p style={ui.sub}>
            Password can be stolen. Behaviours can't.
          </p>

          <div style={s.actions}>
            <button
              style={ui.ctaPrimary}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              onClick={() => navigate('/gmail')}
            >
              Get Started →
            </button>
          </div>

          <div style={ui.glitchBlock}>
            <p style={{ ...ui.glitchLine, animation: 'flicker 3.5s infinite 0.5s' }}>
              Your password is already dead.
            </p>
            <p style={ui.glitchLine}>
              Welcome to{' '}
              <span
                id="glitch-vaultless"
                data-text="VAULTLESS"
                style={{
                  color: '#00ff88',
                  fontWeight: 700,
                  letterSpacing: '0.3em',
                  position: 'relative',
                  display: 'inline-block',
                  animation: 'glitch1 2.5s infinite, flicker 3.5s infinite',
                }}
              >
                VAULTLESS
              </span>.
            </p>
          </div>

          <div style={s.cards}>
            {[
              {
                title: 'Behavioural DNA',
                desc: 'Keystroke timing + mouse dynamics. 64-dimensional vector unique to you. No biometric stored anywhere.',
                tag: 'Float32Array[64]',
                tagColor: '#00d4ff',
              },
              {
                title: 'Ethereum Trust Layer',
                desc: 'Every auth event, failed attempt, and duress trigger logged permanently on Sepolia. Immutable. Public. Forever.',
                tag: 'keccak256 · Sepolia',
                tagColor: '#00d4ff',
              },
              {
                title: 'Anti-Coercion Protocol',
                desc: 'Stress signature detected in rhythm. Ghost session loads. Blockchain records the attack.',
                tag: 'DuressActivated · On-chain',
                tagColor: '#ff6b35',
              },
            ].map(card => (
              <div
                key={card.title}
                style={ui.card}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 30px rgba(0,255,136,0.5)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,136,0.2)'}
              >
                <div style={s.cardTopEdge} />
                <div style={{ color: '#00ff88', fontSize: 20, marginBottom: 12 }}>⬡</div>
                <div style={s.cardTitle}>{card.title}</div>
                <div style={s.cardDesc}>{card.desc}</div>
                <div style={{ ...s.cardTag, color: card.tagColor }}>{card.tag}</div>
              </div>
            ))}
          </div>

          <div style={ui.statsBar}>
            {[
              { num: '4.5B', label: 'records breached in 2023' },
              { num: '0', label: 'records stored in VAULTLESS' },
              { num: '∞', label: 'every auth on-chain forever' },
            ].map((stat, i) => (
              <div key={stat.label} style={ui.statWrap}>
                {i > 0 && <div style={ui.statDivider} />}
                <div style={ui.stat}>
                  <div style={ui.statNum}>{stat.num}</div>
                  <div style={ui.statLabel}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

        </div>

        <style>{`
          @keyframes glitch1 {
            0%,78%,100% { clip-path: none; transform: none; }
            79% { clip-path: polygon(0 20%, 100% 20%, 100% 40%, 0 40%); transform: translateX(-6px); }
            80% { clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%); transform: translateX(6px); }
            81% { clip-path: polygon(0 10%, 100% 10%, 100% 30%, 0 30%); transform: translateX(-3px); }
            82% { clip-path: polygon(0 50%, 100% 50%, 100% 70%, 0 70%); transform: translateX(5px); }
            83% { clip-path: none; transform: translateX(-2px); }
            84% { clip-path: polygon(0 30%, 100% 30%, 100% 50%, 0 50%); transform: translateX(4px); }
            85% { clip-path: none; transform: none; }
          }
          @keyframes glitch2 {
            0%,78%,100% { opacity: 0; }
            79% { opacity: 1; transform: translateX(5px); color: #ff0040; }
            80% { transform: translateX(-5px); color: #00ffff; }
            81% { opacity: 1; transform: translateX(3px); color: #ff0040; }
            82% { transform: translateX(-4px); color: #00ffff; }
            83% { opacity: 0; }
            84% { opacity: 1; transform: translateX(2px); color: #ff0040; }
            85% { opacity: 0; }
          }
          @keyframes flicker {
            0%,70%,100% { opacity: 1; }
            71% { opacity: 0.3; }
            72% { opacity: 1; }
            73% { opacity: 0.5; }
            74% { opacity: 1; }
            75% { opacity: 0.2; }
            76% { opacity: 1; }
          }
          #glitch-vaultless::before {
            content: attr(data-text);
            position: absolute;
            left: 0; top: 0;
            color: #00ff88;
            letter-spacing: 0.3em;
            animation: glitch2 2.5s infinite;
            pointer-events: none;
          }
        `}</style>
      </div>
    </>
  );
}

function animateParticles(canvas) {
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');
  let animId;
  const mouse = { x: null, y: null };

  const onMouseMove = (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  };
  window.addEventListener("mousemove", onMouseMove);

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const particles = Array.from({ length: 180 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.8,
    vy: (Math.random() - 0.5) * 0.8,
    r: Math.random() * 1.8 + 0.6,
    cyan: Math.random() < 0.1,
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      if (mouse.x && mouse.y) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          p.x += dx * 0.02;
          p.y += dy * 0.02;
        }
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.cyan ? 'rgba(0,212,255,0.6)' : 'rgba(0,255,136,0.65)';
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(0,255,136,${0.08 * (1 - dist / 150)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    animId = requestAnimationFrame(draw);
  }

  draw();

  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    window.removeEventListener('mousemove', onMouseMove);
  };
}

const s = {
  root: {
    minHeight: '100vh',
    background: '#0a0a0c',
    color: '#e8e8f0',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    position: 'relative',
    zIndex: 1,
    overflowX: 'hidden',
  },
  canvas: {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: 0,
  },
  scanline: {
    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1,
    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
  },
  demoToggle: {
    position: 'fixed', top: 20, right: 20, zIndex: 100,
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(0,255,136,0.25)',
    borderRadius: 8, padding: '8px 14px',
    boxShadow: '0 0 18px rgba(0,255,136,0.2)',
  },
  demoLabel: {
    color: 'rgba(255,255,255,0.75)', fontSize: 11,
    letterSpacing: 2, fontFamily: "'Courier New', monospace",
  },
  toggle: {
    border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer',
    fontSize: 11, fontWeight: 700, color: '#111', letterSpacing: 1,
    transition: 'background 0.3s',
  },
  hero: {
    position: 'relative', zIndex: 2,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    textAlign: 'center', padding: '80px 24px 80px',
    maxWidth: 960, margin: '0 auto',
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)',
    borderRadius: 100, padding: '7px 18px', marginBottom: 44,
  },
  badgeDot: {
    width: 8, height: 8, borderRadius: '50%',
    background: '#00ff88', boxShadow: '0 0 8px #00ff88',
  },
  badgeText: {
    fontFamily: "'Courier New', monospace",
    fontSize: 12, color: '#00ff88', letterSpacing: 3,
  },
  headline: { margin: '0 0 28px', lineHeight: 1.05 },
  hl1: {
    display: 'block',
    fontSize: 'clamp(48px, 8vw, 88px)',
    fontWeight: 700, color: '#e8e8f0', letterSpacing: '-0.03em',
  },
  hl2: {
    display: 'block',
    fontSize: 'clamp(48px, 8vw, 88px)',
    fontWeight: 700, letterSpacing: '-0.03em',
    background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  sub: {
    fontFamily: "'Courier New', monospace",
    color: '#ffffff', fontSize: 16, lineHeight: 1.7,
    maxWidth: 640, marginBottom: 48, fontWeight: 400,
    letterSpacing: '0.08em', textTransform: 'uppercase',
  },
  actions: {
    display: 'flex', gap: 14, marginBottom: 28,
    flexWrap: 'wrap', justifyContent: 'center',
  },
  ctaPrimary: {
    background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
    color: '#000', border: 'none', padding: '15px 36px',
    fontSize: 15, fontWeight: 700, letterSpacing: '0.04em',
    cursor: 'pointer', borderRadius: 10,
    boxShadow: '0 0 24px rgba(0,255,136,0.3)',
    transition: 'opacity 0.2s',
  },
  glitchBlock: {
    marginBottom: 56, marginTop: 4, textAlign: 'center',
  },
  glitchLine: {
    fontFamily: "'Courier New', monospace",
    color: 'rgba(255,255,255,0.75)', fontSize: 13,
    letterSpacing: '0.15em', textTransform: 'uppercase',
    margin: '0 0 6px',
  },
  cards: {
    display: 'flex', gap: 20, flexWrap: 'wrap',
    justifyContent: 'center', marginBottom: 64, width: '100%',
  },
  card: {
    flex: '1 1 240px', maxWidth: 290,
    position: 'relative', borderRadius: 16, overflow: 'hidden',
    padding: '28px 24px', textAlign: 'left',
    background: 'linear-gradient(135deg, rgba(13,13,15,0.95), rgba(20,20,24,0.95))',
    border: '1px solid rgba(0,255,136,0.12)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    transition: 'box-shadow 0.3s ease',
  },
  cardTopEdge: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(0,255,136,0.4), transparent)',
  },
  cardTitle: {
    color: '#00ff88', fontSize: 14, fontWeight: 700,
    letterSpacing: '0.04em', marginBottom: 10,
  },
  cardDesc: { color: '#ffffff', fontSize: 13, lineHeight: 1.7, marginBottom: 16 },
  cardTag: { fontFamily: "'Courier New', monospace", fontSize: 11, opacity: 0.85 },
  statsBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexWrap: 'wrap',
    background: 'rgba(13,13,15,0.85)',
    border: '1px solid rgba(0,255,136,0.08)',
    borderRadius: 16, padding: '32px 40px', width: '100%',
  },
  stat: { textAlign: 'center', padding: '0 44px' },
  statNum: {
    fontSize: 42, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 6,
    background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  statDivider: { width: 1, height: 40, background: 'rgba(0,255,136,0.2)' },
};
