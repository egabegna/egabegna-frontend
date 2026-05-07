import { useEffect, useCallback } from 'react'
import signalementService from '../services/signalementService'

export function usePushNotifications() {

  const notifierSignalementCritique = useCallback(async (signalement) => {
    if (Notification.permission !== 'granted') return
    if (!('serviceWorker' in navigator)) return

    try {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification(`🔴 ${signalement.type.replace(/_/g, ' ')}`, {
        body:  signalement.message,
        icon:  '/icons/icon-192x192.png',
        tag:   `signal-${signalement.id}`,
        data:  { url: '/signalements' },
        actions: [{ action: 'voir', title: 'Voir les signalements' }],
        vibrate: [300, 100, 300],
      })
    } catch (err) {
      console.error('Push notification error:', err)
    }
  }, [])

  // Polling signalements critiques non lus toutes les 60s
  useEffect(() => {
    if (Notification.permission !== 'granted') return

    const check = async () => {
      try {
        const res = await signalementService.liste({
          niveau: 'critique',
          lu:     'false',
        })
        const critiques = res.data.results || res.data
        critiques.forEach(s => notifierSignalementCritique(s))
      } catch { }
    }

    check()
    const interval = setInterval(check, 60000)
    return () => clearInterval(interval)
  }, [notifierSignalementCritique])

  return { notifierSignalementCritique }
}