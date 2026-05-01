// ============================================================
// FILE: src/components/PageShell.jsx
// ============================================================
export default function PageShell({ children, className = '' }) {
  return (
    <div
      className={`min-h-screen hex-bg radial-glow relative ${className}`}
      style={{ background: '#000000' }}
    >
      {/* CRT scanline overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-50"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
          mixBlendMode: 'overlay',
        }}
      />
      {/* Animated scan line */}
      <div className="scan-line" />
      {children}
    </div>
  )
}
