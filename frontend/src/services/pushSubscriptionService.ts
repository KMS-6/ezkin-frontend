import { getPwaServiceWorkerRegistration } from './pwaService'

export interface PushSubscriptionPayload {
  endpoint: string
  expirationTime: number | null
  keys: {
    p256dh: string
    auth: string
  }
}

export interface PushSubscriptionTransport {
  register(subscription: PushSubscriptionPayload): Promise<void>
  unregister(endpoint: string): Promise<void>
}

function decodeVapidKey(value: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - value.length % 4) % 4)
  const decoded = atob((value + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0))
}

export function serializePushSubscription(subscription: PushSubscription): PushSubscriptionPayload {
  const json = subscription.toJSON()
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
    throw new Error('알림 구독 정보를 만들지 못했어요.')
  }
  return {
    endpoint: json.endpoint,
    expirationTime: subscription.expirationTime,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  }
}

export async function createPushSubscription(
  publicKey = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY as string | undefined,
): Promise<PushSubscriptionPayload> {
  if (!('PushManager' in window)) throw new Error('이 브라우저에서는 Web Push를 사용할 수 없어요.')
  if (!publicKey) throw new Error('Web Push 공개 키가 아직 설정되지 않았어요.')

  const registration = await getPwaServiceWorkerRegistration()
  const existing = await registration.pushManager.getSubscription()
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: decodeVapidKey(publicKey),
  })
  return serializePushSubscription(subscription)
}

export async function registerPushSubscription(
  transport: PushSubscriptionTransport,
  publicKey?: string,
): Promise<PushSubscriptionPayload> {
  const subscription = await createPushSubscription(publicKey)
  await transport.register(subscription)
  return subscription
}

export async function unregisterPushSubscription(transport: PushSubscriptionTransport): Promise<void> {
  const registration = await getPwaServiceWorkerRegistration()
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return
  await transport.unregister(subscription.endpoint)
  await subscription.unsubscribe()
}
