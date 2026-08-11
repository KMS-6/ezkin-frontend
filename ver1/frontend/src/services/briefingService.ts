import { todayBriefingMock } from '../mocks/briefing'
import type { BriefingData, DietChoice } from '../types/briefing'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const DIET_STORAGE_KEY = 'ezkin:diet-choices'

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
  if (!API_BASE_URL) return Promise.resolve(todayBriefingMock)

  const response = await fetch(`${API_BASE_URL}/briefing`)
  if (!response.ok) throw new Error('오늘 브리핑을 불러오지 못했어요.')
  return response.json() as Promise<BriefingData>
}

export async function saveDietChoice(userId: string, choice: DietChoice): Promise<void> {
  const choices = readDietChoices()
  localStorage.setItem(DIET_STORAGE_KEY, JSON.stringify({ ...choices, [userId]: choice }))
  if (!API_BASE_URL) return

  await fetch(`${API_BASE_URL}/lifelog/diet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ choice }),
  })
}

export function getSavedDietChoice(userId: string): DietChoice | null {
  const choice = readDietChoices()[userId]
  return choice === 'usual' || choice === 'spicy' ? choice : null
}
