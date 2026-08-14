import type { DietChoice } from '../types/briefing'

const DATABASE_NAME = 'ezkin-notification-actions'
const STORE_NAME = 'actions'
const DIET_STORAGE_KEY = 'ezkin:diet-choices'
const WATER_STORAGE_KEY = 'ezkin:water-intake'

interface PendingMealAction {
  id: number
  type: 'meal'
  userId: string
  choice: DietChoice
  recordedAt: string
}

interface PendingWaterAction {
  id: number
  type: 'water'
  userId: string
  amount: 'one-glass' | 'five-plus'
  recordedAt: string
}

type PendingAction = PendingMealAction | PendingWaterAction

function localDateKey(value: string): string {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function syncPendingNotificationActions(): Promise<void> {
  if (!('indexedDB' in window)) return
  const database = await openDatabase()
  const actions = await new Promise<PendingAction[]>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll()
    request.onsuccess = () => resolve(request.result as PendingAction[])
    request.onerror = () => reject(request.error)
  })

  for (const action of actions) {
    if (action.type === 'meal') {
      const saved = JSON.parse(localStorage.getItem(DIET_STORAGE_KEY) || '{}') as Record<string, DietChoice>
      localStorage.setItem(DIET_STORAGE_KEY, JSON.stringify({ ...saved, [action.userId]: action.choice }))
    } else {
      const key = `${action.userId}:${localDateKey(action.recordedAt)}`
      const saved = JSON.parse(localStorage.getItem(WATER_STORAGE_KEY) || '{}') as Record<string, number>
      const next = action.amount === 'five-plus' ? Math.max(saved[key] ?? 0, 5) : (saved[key] ?? 0) + 1
      localStorage.setItem(WATER_STORAGE_KEY, JSON.stringify({ ...saved, [key]: next }))
    }
  }

  if (actions.length > 0) {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).clear()
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }
  database.close()
}

export function getTodayWaterGlasses(userId: string): number {
  const now = new Date()
  const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const saved = JSON.parse(localStorage.getItem(WATER_STORAGE_KEY) || '{}') as Record<string, number>
  return saved[`${userId}:${dateKey}`] ?? 0
}

export function listenForNotificationActions(): void {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type !== 'EZKIN_NOTIFICATION_ACTION_SAVED') return
    void syncPendingNotificationActions().then(() => {
      window.dispatchEvent(new Event('ezkin:life-log-updated'))
    })
  })
}
