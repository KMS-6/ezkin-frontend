const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'
const PUBLIC_VAPID_KEY = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY
const TOKEN_KEY = 'ezkin:access-token'
const MOCK_SUBSCRIPTION_KEY = 'ezkin:push-subscription'
const MOCK_NOTIFICATION_ENABLED_KEY = 'ezkin:notifications-enabled'

export type NotificationPermissionState = NotificationPermission | 'unsupported'

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register('/sw.js')
  } catch (error) {
    console.warn('EZkin Service Worker registration failed.', error)
    return null
  }
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported'
  return Notification.permission
}

function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const bytes = atob(base64)
  return Uint8Array.from(bytes, (character) => character.charCodeAt(0))
}

async function sendSubscription(subscription: PushSubscription): Promise<void> {
  if (USE_MOCK_API) {
    localStorage.setItem(MOCK_SUBSCRIPTION_KEY, JSON.stringify(subscription.toJSON()))
    return
  }
  if (!API_BASE_URL) throw new Error('API 주소가 설정되지 않았어요.')
  const token = localStorage.getItem(TOKEN_KEY)
  const response = await fetch(`${API_BASE_URL}/push/subscriptions`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(subscription.toJSON()),
  })
  if (!response.ok) throw new Error('알림 연결 정보를 저장하지 못했어요.')
}

export async function enablePushNotifications(): Promise<PushSubscription | null> {
  if (getNotificationPermission() === 'unsupported') throw new Error('이 브라우저에서는 알림을 지원하지 않아요.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('알림 권한이 허용되지 않았어요.')
  if (!PUBLIC_VAPID_KEY) {
    if (USE_MOCK_API) {
      localStorage.setItem(MOCK_NOTIFICATION_ENABLED_KEY, 'true')
      return null
    }
    throw new Error('Web Push 공개 키가 설정되지 않았어요.')
  }

  const registration = await navigator.serviceWorker.ready
  const existing = await registration.pushManager.getSubscription()
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
  })
  await sendSubscription(subscription)
  return subscription
}

export async function hasPushSubscription(): Promise<boolean> {
  if (getNotificationPermission() !== 'granted') return false
  if (USE_MOCK_API && localStorage.getItem(MOCK_NOTIFICATION_ENABLED_KEY) === 'true') return true
  const registration = await navigator.serviceWorker.ready
  return Boolean(await registration.pushManager.getSubscription())
}

export async function disablePushNotifications(): Promise<void> {
  if (getNotificationPermission() === 'unsupported') return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()

  if (subscription && !USE_MOCK_API && API_BASE_URL) {
    const token = localStorage.getItem(TOKEN_KEY)
    await fetch(`${API_BASE_URL}/push/subscriptions`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    })
  }
  if (subscription) await subscription.unsubscribe()
  localStorage.removeItem(MOCK_SUBSCRIPTION_KEY)
  localStorage.removeItem(MOCK_NOTIFICATION_ENABLED_KEY)
}

export async function showBriefingPreview(): Promise<void> {
  const registration = await navigator.serviceWorker.ready
  await registration.showNotification('오늘은 피부를 조금 쉬게 해주세요.', {
    body: '수면이 짧고 공기가 건조했어요.',
    icon: '/icon-192.png',
    tag: 'ezkin-briefing-preview',
    data: { url: '/briefing' },
  })
}

export async function showMealPreview(meal: 'lunch' | 'dinner'): Promise<void> {
  const registration = await navigator.serviceWorker.ready
  await registration.showNotification(meal === 'lunch' ? '점심은 어땠어요?' : '저녁은 어땠어요?', {
    body: '눌러서 한 번만 선택하면 기록이 끝나요.',
    icon: '/icon-192.png',
    tag: `ezkin-meal-preview-${meal}`,
    data: {
      type: 'meal',
      meal,
      url: `/quick-input/meal?meal=${meal}`,
    },
  })
}
