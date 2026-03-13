// ============================================================
// FILE: src/App.jsx
// ============================================================
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { VaultlessProvider } from './lib/VaultlessContext.jsx'
import Landing from './pages/Landing.jsx'
import Gmail from './pages/Gmail.jsx'
import Enroll from './pages/Enroll.jsx'
import Auth from './pages/Auth.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Ghost from './pages/Ghost.jsx'

export default function App() {
  const location = useLocation()

  return (
    <VaultlessProvider>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Landing />} />
          <Route path="/gmail" element={<Gmail />} />
          <Route path="/enroll" element={<Enroll />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ghost" element={<Ghost />} />
        </Routes>
      </AnimatePresence>
    </VaultlessProvider>
  )
}
