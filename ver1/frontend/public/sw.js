const CACHE_NAME = 'ezkin-shell-v1'
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const requestUrl = new URL(event.request.url)
  const cacheableDestinations = ['script', 'style', 'image', 'font', 'manifest']
  if (requestUrl.origin !== self.location.origin || !cacheableDestinations.includes(event.request.destination)) return
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/index.html')))
    return
  }
  event.respondWith(
    caches.match(event.request).then(async (cached) => {
      if (cached) return cached
      const response = await fetch(event.request)
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME)
        await cache.put(event.request, response.clone())
      }
      return response
    }),
  )
})

self.addEventListener('push', (event) => {
  let payload = {}
  try { payload = event.data ? event.data.json() : {} } catch { payload = { body: event.data?.text() } }

  const type = payload.type || 'briefing'
  const defaultUrl = type === 'meal'
    ? `/quick-input/meal?meal=${encodeURIComponent(payload.meal || 'lunch')}`
    : '/briefing'

  event.waitUntil(self.registration.showNotification(payload.title || 'EZkin', {
    body: payload.body || '오늘 피부가 필요로 하는 케어를 확인해보세요.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.tag || `ezkin-${type}`,
    renotify: false,
    data: {
      type,
      meal: payload.meal || 'lunch',
      url: payload.url || defaultUrl,
    },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = new URL(event.notification.data?.url || '/home', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => new URL(client.url).origin === self.location.origin)
      if (existing) {
        existing.navigate(targetUrl)
        return existing.focus()
      }
      return self.clients.openWindow(targetUrl)
    }),
  )
})
