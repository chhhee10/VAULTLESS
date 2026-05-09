// ============================================================
// FILE: src/components/DataStream.jsx
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const LABELS = ['VECTOR_WRITE', 'HASH_COMMIT', 'NULLIFIER_GEN', 'CHAIN_SYNC', 'DNA_CAPTURE', 'SIG_VERIFY', 'ENTROPY_READ']

function randomHex(len = 8) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

export default function DataStream({ active = true }) {
  const [lines, setLines] = useState([])
  const idCounter = useRef(0)

  useEffect(() => {
    if (!active) return
    const interval = setInterval(() => {
      const label = LABELS[Math.floor(Math.random() * LABELS.length)]
      const hex = randomHex(8)
      const id = ++idCounter.current
      setLines(prev => [...prev.slice(-7), { id, hex, label }])
    }, 200)
    return () => clearInterval(interval)
  }, [active])

  return (
    <div
      className="w-full overflow-hidden relative"
      style={{
        height: '120px',
        background: 'rgba(0,0,0,0.6)',
        borderRadius: '8px',
        border: '1px solid rgba(0,255,136,0.08)',
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
      }}
    >
      <div className="p-2 flex flex-col-reverse gap-0.5">
        <AnimatePresence>
          {lines.map(line => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 0.7, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                color: '#00ff88',
                whiteSpace: 'nowrap',
                letterSpacing: '0.05em',
              }}
            >
              <span style={{ opacity: 0.5 }}>0x{line.hex}</span>
              <span style={{ color: '#00d4ff', marginLeft: '12px', opacity: 0.6 }}>{line.label}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
