import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n/i18n.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register PWA Service Worker for Push Notifications
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const base = window.location.pathname.startsWith('/montealto') ? '/montealto' : '';
    navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).catch((err) => {
      console.warn('SW register:', err);
    });
  });
}
