import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import "@/lib/us-locale-override"
import './lib/i18n'
import { initBFCache } from '@/lib/bfcache'

initBFCache()

/** Leftover PWAs on localhost:3001 can serve stale Vite deps (duplicate React / Router). */
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  void (async () => {
    const registrations = await navigator.serviceWorker.getRegistrations()
    const cacheKeys = await caches.keys()
    if (registrations.length === 0 && cacheKeys.length === 0) return
    await Promise.all(registrations.map((registration) => registration.unregister()))
    await Promise.all(cacheKeys.map((key) => caches.delete(key)))
    window.location.reload()
  })()
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter 
      basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
