export function isPwaServiceWorkerSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator
}

export async function registerPwaServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPwaServiceWorkerSupported()) return null

  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  } catch {
    return null
  }
}

export async function getPwaServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  if (!isPwaServiceWorkerSupported()) throw new Error('이 브라우저에서는 앱 알림을 사용할 수 없어요.')
  return navigator.serviceWorker.ready
}
