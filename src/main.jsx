import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'leaflet/dist/leaflet.css'
import './styles/index.css'

// Performance measurement: Mark app initialization start
if (typeof window !== 'undefined' && window.performance) {
  window.performance.mark('app-init-start')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Performance measurement: Mark app initialization end
if (typeof window !== 'undefined' && window.performance) {
  window.performance.mark('app-init-end')
  window.performance.measure('app-init', 'app-init-start', 'app-init-end')
  
  // Log initial load time
  window.addEventListener('load', () => {
    const navTiming = performance.getEntriesByType('navigation')[0]
    if (navTiming) {
      const loadTime = navTiming.loadEventEnd - navTiming.fetchStart
      console.log(`[Performance] Initial page load: ${(loadTime / 1000).toFixed(2)}s`)
      console.log(`[Performance] Target: < 3s | Status: ${loadTime < 3000 ? '✅ PASS' : '❌ FAIL'}`)
    }
  })
}

