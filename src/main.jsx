import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/Dashboard.css'
import App from './App.jsx'

// Register service worker for PWA
import { registerSW } from 'virtual:pwa-register'

// Register the service worker with automatic updates
registerSW({
  onNeedRefresh() {
    console.log('New content available, will update on next visit');
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
