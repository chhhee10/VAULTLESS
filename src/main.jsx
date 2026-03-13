// ============================================================
// FILE: src/main.jsx
// ============================================================
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#0d0d0f',
            color: '#e8e8f0',
            border: '1px solid rgba(0,255,136,0.2)',
            borderRadius: '12px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#00ff88', secondary: '#000' },
          },
          error: {
            iconTheme: { primary: '#ff2d55', secondary: '#000' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
