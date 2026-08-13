import type { DietChoice } from '../types/briefing'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'
const TOKEN_KEY = 'ezkin:access-token'
const STORAGE_KEY = 'ezkin:meal-quick-inputs'
const DIET_STORAGE_KEY = 'ezkin:diet-choices'

export type MealPeriod = 'lunch' | 'dinner'

export interface MealQuickInput {
  userId: string
  meal: MealPeriod
  choice: DietChoice
  recordedAt: string
}

function getLocalDateKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function saveMealQuickInput(input: MealQuickInput): Promise<void> {
  if (USE_MOCK_API) {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as MealQuickInput[]
    const dateKey = getLocalDateKey(input.recordedAt)
    const withoutDuplicate = saved.filter((item) => !(
      item.userId === input.userId
      && item.meal === input.meal
      && getLocalDateKey(item.recordedAt) === dateKey
    ))
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...withoutDuplicate, input]))
    const dietChoices = JSON.parse(localStorage.getItem(DIET_STORAGE_KEY) || '{}') as Record<string, DietChoice>
    localStorage.setItem(DIET_STORAGE_KEY, JSON.stringify({ ...dietChoices, [input.userId]: input.choice }))
    return
  }
  if (!API_BASE_URL) throw new Error('API 주소가 설정되지 않았어요.')
  const token = localStorage.getItem(TOKEN_KEY)
  const response = await fetch(`${API_BASE_URL}/lifelog/meals`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ meal: input.meal, choice: input.choice, recordedAt: input.recordedAt }),
  })
  if (!response.ok) throw new Error('식사 기록을 저장하지 못했어요.')
}

export function getTodayMealQuickInput(userId: string, meal: MealPeriod): MealQuickInput | null {
  if (!USE_MOCK_API) return null
  const today = getLocalDateKey(new Date())
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as MealQuickInput[]
  return saved.find((item) => item.userId === userId && item.meal === meal && getLocalDateKey(item.recordedAt) === today) ?? null
}
