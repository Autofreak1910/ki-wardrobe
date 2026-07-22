self.addEventListener('push', function(event) {
  if (!event.data) return
  const data = event.data.json()

  const title = data.title || 'KiWardrobe'
  const options = {
    body: data.body || '',
    icon: '/icon-512.png',
    badge: '/icon-512.png',
    data: { url: data.url || '/' },
    vibrate: [100, 50, 100],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.navigate(url).then(() => client.focus())
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

self.addEventListener('install', function(event) {
  self.skipWaiting()
})

self.addEventListener('activate', function(event) {
  event.waitUntil(clients.claim())
})