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
    badge: '/icon-192.png',
    tag: `ezkin-briefing-preview-${Date.now()}`,
    data: { type: 'briefing', url: '/briefing' },
  })
}

type NotificationOptionsWithActions = NotificationOptions & {
  actions: Array<{ action: string; title: string }>
}

export async function showMealPreview(meal: 'lunch' | 'dinner', userId: string): Promise<void> {
  const registration = await navigator.serviceWorker.ready
  const options: NotificationOptionsWithActions = {
    body: '앱을 열지 않고 알림창에서 바로 골라주세요.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: `ezkin-meal-preview-${meal}-${Date.now()}`,
    actions: [
      { action: 'meal-usual', title: '평소처럼' },
      { action: 'meal-spicy', title: '조금 자극적' },
    ],
    data: {
      type: 'meal',
      meal,
      userId,
      demo: true,
      url: `/quick-input/meal?meal=${meal}`,
    },
  }
  await registration.showNotification(meal === 'lunch' ? '점심은 어땠어요?' : '저녁은 어땠어요?', options)
}

export async function showWaterPreview(userId: string): Promise<void> {
  const registration = await navigator.serviceWorker.ready
  const options: NotificationOptionsWithActions = {
    body: '앱을 열지 않고 알림창에서 바로 기록해요.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: `ezkin-water-preview-${Date.now()}`,
    actions: [
      { action: 'water-add', title: '+1잔' },
      { action: 'water-enough', title: '5잔 이상' },
    ],
    data: { type: 'water', userId, demo: true, url: '/lifelog' },
  }
  await registration.showNotification('오늘 물은 얼마나 마셨어요?', options)
}
