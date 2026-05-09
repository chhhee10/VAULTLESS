import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

function renderFatal(message) {
  const rootEl = document.getElementById('root');
  if (!rootEl) return;
  rootEl.innerHTML = `
    <div style="min-height:100vh;background:#080808;color:#ff9a9a;font-family:monospace;display:flex;align-items:center;justify-content:center;padding:24px;">
      <div style="max-width:760px;background:#140b0b;border:1px solid #5c2a23;border-radius:10px;padding:18px 20px;line-height:1.6;">
        <div style="color:#ffd4d4;font-size:16px;font-weight:700;margin-bottom:8px;">VAULTLESS failed to load</div>
        <div style="white-space:pre-wrap;word-break:break-word;">${String(message)}</div>
        <div style="margin-top:10px;color:#ffb09f;">Try hard refresh (Ctrl/Cmd+Shift+R) and restart dev server.</div>
      </div>
    </div>
  `;
}

window.addEventListener('error', (e) => {
  renderFatal(e.error?.stack || e.message || 'Unknown runtime error');
});

window.addEventListener('unhandledrejection', (e) => {
  const reason = e.reason?.stack || e.reason?.message || String(e.reason || 'Unknown promise rejection');
  renderFatal(reason);
});

async function bootstrap() {
  try {
    const { default: App } = await import('./App');
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    renderFatal(err?.stack || err?.message || String(err));
  }
}

bootstrap();
