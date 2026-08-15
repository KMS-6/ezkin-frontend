import { todayBriefingMock } from '../mocks/briefing'
import type { BriefingData, DietChoice } from '../types/briefing'
import {
  clearDemoNotificationDietChoice,
  getSavedNotificationDietChoice,
  saveNotificationDietChoice,
} from './quickInputService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'
const TOKEN_KEY = 'ezkin:access-token'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) throw new Error('API 주소가 설정되지 않았어요.')
  const token = localStorage.getItem(TOKEN_KEY)
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) throw new Error('오늘 브리핑을 불러오지 못했어요.')
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function getTodayBriefing(userId?: string): Promise<BriefingData> {
  if (USE_MOCK_API) {
    return Promise.resolve({
      ...todayBriefingMock,
      ...(userId ? { dietChoice: getSavedNotificationDietChoice(userId) ?? undefined } : {}),
    })
  }
  return request<BriefingData>('/briefing')
}

export async function saveDietChoice(userId: string, choice: DietChoice): Promise<void> {
  if (USE_MOCK_API) {
    await saveNotificationDietChoice(
      userId,
      choice === 'spicy' ? 'stimulating' : 'normal',
    )
    return
  }

  await request<void>('/lifelog/diet', {
    method: 'POST',
    body: JSON.stringify({ choice }),
  })
}

export function getSavedDietChoice(userId: string): DietChoice | null {
  if (!USE_MOCK_API) return null
  const choice = getSavedNotificationDietChoice(userId)
  if (!choice) return null
  return choice === 'stimulating' ? 'spicy' : 'usual'
}

export function clearDemoDietChoice(userId: string): void {
  if (!USE_MOCK_API) return
  clearDemoNotificationDietChoice(userId)
}
