const CACHE_NAME = 'egabegna-v1'
const OFFLINE_URLS = ['/', '/connexion', '/dashboard']

// ── Installation ──────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(OFFLINE_URLS).catch(() => {})
    })
  )
  self.skipWaiting()
})

// ── Activation ────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch — Cache First pour assets statiques ─
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return
  if (event.request.url.includes('/api/')) return  // ne pas cacher les appels API

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      })
    }).catch(() => caches.match('/'))
  )
})

// ── Push notifications ────────────────────────
self.addEventListener('push', event => {
  let payload = { title: 'Egabégna', body: 'Nouvelle alerte.', url: '/signalements' }

  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() }
    }
  } catch { }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body:    payload.body,
      icon:    '/icons/icon-192x192.png',
      badge:   '/icons/icon-192x192.png',
      tag:     payload.tag || 'egabegna-alerte',
      renotify: true,
      data:    { url: payload.url || '/signalements' },
      actions: [
        { action: 'voir',    title: 'Voir les signalements' },
        { action: 'fermer',  title: 'Fermer' },
      ],
      vibrate: [200, 100, 200],
    })
  )
})

// ── Clic sur notification ─────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close()

  const url = event.notification.data?.url || '/signalements'

  if (event.action === 'fermer') return

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Si une fenêtre est déjà ouverte → naviguer dedans
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus()
          client.postMessage({ type: 'NAVIGATE', url })
          return
        }
      }
      // Sinon → ouvrir une nouvelle fenêtre
      return clients.openWindow(url)
    })
  )
})