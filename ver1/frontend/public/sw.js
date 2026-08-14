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
    : type === 'water' ? '/lifelog' : '/briefing'
  const actions = type === 'meal'
    ? [{ action: 'meal-usual', title: '평소처럼' }, { action: 'meal-spicy', title: '조금 자극적' }]
    : type === 'water'
      ? [{ action: 'water-add', title: '+1잔' }, { action: 'water-enough', title: '5잔 이상' }]
      : []

  event.waitUntil(self.registration.showNotification(payload.title || 'EZkin', {
    body: payload.body || '오늘 피부가 필요로 하는 케어를 확인해보세요.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.tag || `ezkin-${type}`,
    renotify: false,
    actions,
    data: {
      type,
      meal: payload.meal || 'lunch',
      url: payload.url || defaultUrl,
      recordUrl: payload.recordUrl,
      actionToken: payload.actionToken,
      userId: payload.userId,
      demo: Boolean(payload.demo),
    },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action) {
    event.waitUntil(handleQuickAction(event.notification.data || {}, event.action))
    return
  }
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

async function handleQuickAction(data, action) {
  const input = createQuickInput(data, action)
  if (!input) return

  let saved = false
  if (data.demo) {
    await savePendingAction({ ...input, userId: data.userId || 'demo-user' })
    await notifyOpenClients()
    saved = true
  } else if (data.recordUrl) {
    try {
      const response = await fetch(data.recordUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(data.actionToken ? { Authorization: `Bearer ${data.actionToken}` } : {}),
        },
        body: JSON.stringify(input),
      })
      saved = response.ok
    } catch {
      saved = false
    }
  }

  await self.registration.showNotification(saved ? '기록했어요' : '기록을 완료하지 못했어요', {
    body: saved ? input.confirmation : '알림을 눌러 앱에서 한 번만 확인해주세요.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: `ezkin-action-result-${Date.now()}`,
    data: { url: saved ? '/lifelog' : data.url || '/home' },
  })
}

async function notifyOpenClients() {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  clients.forEach((client) => client.postMessage({ type: 'EZKIN_NOTIFICATION_ACTION_SAVED' }))
}

function createQuickInput(data, action) {
  const recordedAt = new Date().toISOString()
  if (action === 'meal-usual' || action === 'meal-spicy') {
    const choice = action === 'meal-usual' ? 'usual' : 'spicy'
    return {
      type: 'meal', meal: data.meal || 'lunch', choice, recordedAt,
      confirmation: choice === 'usual' ? '평소처럼 먹은 것으로 반영했어요.' : '조금 자극적인 식사로 반영했어요.',
    }
  }
  if (action === 'water-add' || action === 'water-enough') {
    const amount = action === 'water-add' ? 'one-glass' : 'five-plus'
    return {
      type: 'water', amount, recordedAt,
      confirmation: amount === 'one-glass' ? '물 한 잔을 추가했어요.' : '오늘 5잔 이상 마신 것으로 반영했어요.',
    }
  }
  return null
}

function savePendingAction(action) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ezkin-notification-actions', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('actions', { keyPath: 'id', autoIncrement: true })
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction('actions', 'readwrite')
      transaction.objectStore('actions').add(action)
      transaction.oncomplete = () => { database.close(); resolve() }
      transaction.onerror = () => { database.close(); reject(transaction.error) }
    }
  })
}
