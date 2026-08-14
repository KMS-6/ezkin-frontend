import { todayBriefingMock } from '../mocks/briefing'
import type { BriefingData, DietChoice } from '../types/briefing'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'
const DIET_STORAGE_KEY = 'ezkin:diet-choices'
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

function readDietChoices(): Record<string, DietChoice> {
  const saved = localStorage.getItem(DIET_STORAGE_KEY)
  if (!saved) return {}

  try {
    return JSON.parse(saved) as Record<string, DietChoice>
  } catch {
    return {}
  }
}

export async function getTodayBriefing(): Promise<BriefingData> {
  if (USE_MOCK_API) return Promise.resolve(todayBriefingMock)
  return request<BriefingData>('/briefing')
}

export async function saveDietChoice(userId: string, choice: DietChoice): Promise<void> {
  if (USE_MOCK_API) {
    const choices = readDietChoices()
    localStorage.setItem(DIET_STORAGE_KEY, JSON.stringify({ ...choices, [userId]: choice }))
    return
  }

  await request<void>('/lifelog/diet', {
    method: 'POST',
    body: JSON.stringify({ choice }),
  })
}

export function getSavedDietChoice(userId: string): DietChoice | null {
  if (!USE_MOCK_API) return null
  const choice = readDietChoices()[userId]
  return choice === 'usual' || choice === 'spicy' ? choice : null
}

export function clearDemoDietChoice(userId: string): void {
  if (!USE_MOCK_API) return

  const choices = readDietChoices()
  if (!(userId in choices)) return

  const nextChoices = { ...choices }
  delete nextChoices[userId]
  localStorage.setItem(DIET_STORAGE_KEY, JSON.stringify(nextChoices))
}
