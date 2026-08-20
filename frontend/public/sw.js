const CACHE_NAME = 'ezkin-shell-v1'
const APP_SHELL = ['/', '/manifest.webmanifest', '/favicon.svg']

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
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request)
      if (cached) return cached
      if (event.request.mode === 'navigate') return caches.match('/')
      return Response.error()
    }),
  )
})

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data?.json() ?? {}
  } catch {
    payload = { body: event.data?.text() }
  }

  const route = typeof payload.route === 'string' && payload.route.startsWith('/')
    ? payload.route
    : '/home'
  event.waitUntil(self.registration.showNotification(payload.title || 'EZkin', {
    body: payload.body || '오늘 필요한 피부 관리를 확인해보세요.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: payload.tag || 'ezkin-care',
    data: { route },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const route = event.notification.data?.route || '/home'
  const targetUrl = new URL(route, self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      const existing = clients.find((client) => new URL(client.url).origin === self.location.origin)
      if (existing) {
        await existing.focus()
        if ('navigate' in existing) await existing.navigate(targetUrl)
        return
      }
      await self.clients.openWindow(targetUrl)
    }),
  )
})
