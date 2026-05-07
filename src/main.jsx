import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Enregistrer le Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      console.log('SW enregistré:', reg.scope)

      // Demander la permission push à l'installation si pas encore accordée
      if (Notification.permission === 'default') {
        // Attendre une interaction utilisateur avant de demander
        // (déclenché depuis la page Paramètres)
      }
    } catch (err) {
      console.error('SW erreur:', err)
    }
  })

  // Écouter les messages du SW pour la navigation
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type === 'NAVIGATE') {
      window.location.href = event.data.url
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)