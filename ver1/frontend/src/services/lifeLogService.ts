import { additionalEnvironmentMock, additionalLifestyleMock } from '../mocks/lifeLog'
import type { DietChoice } from '../types/briefing'
import type {
  LifeLogConnectionStatus,
  LifeLogEntry,
  TodayLifeLog,
} from '../types/lifeLog'
import { getSavedDietChoice, getTodayBriefing } from './briefingService'
import { getOnboardingProfile } from './onboardingService'
import { getTodayWaterGlasses } from './notificationActionService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'
const TOKEN_KEY = 'ezkin:access-token'

function automaticEntry(entry: Omit<LifeLogEntry, 'source' | 'sourceLabel'>): LifeLogEntry {
  return {
    ...entry,
    source: 'automatic',
    sourceLabel: '자동',
  }
}

function dietLabel(choice: DietChoice): string {
  return choice === 'spicy' ? '조금 자극적' : '평소처럼'
}

async function request<T>(path: string): Promise<T> {
  if (!API_BASE_URL) throw new Error('API 주소가 설정되지 않았어요.')

  const token = localStorage.getItem(TOKEN_KEY)
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })

  if (!response.ok) throw new Error('오늘의 라이프로그를 불러오지 못했어요.')
  return response.json() as Promise<T>
}

export async function getConnectionStatus(userId: string): Promise<LifeLogConnectionStatus> {
  const profile = await getOnboardingProfile(userId)

  return {
    lifeDataConnected: profile.lifeDataConnected,
    weatherConnected: profile.weatherConnected,
  }
}

export async function getTodayManualInputs(userId: string): Promise<LifeLogEntry[]> {
  const choice = getSavedDietChoice(userId)
  const waterGlasses = getTodayWaterGlasses(userId)
  return [
    ...(choice ? [{
    id: 'diet',
    type: 'diet' as const,
    label: '오늘 식단',
    value: dietLabel(choice),
    description: '이미 오늘 케어에 반영했어요.',
    source: 'manual' as const,
    sourceLabel: '직접 알려줌',
    }] : []),
    ...(waterGlasses > 0 ? [{
      id: 'water',
      type: 'water' as const,
      label: '오늘 물 섭취',
      value: `${waterGlasses}잔${waterGlasses >= 5 ? ' 이상' : ''}`,
      description: '알림에서 간단히 알려줬어요.',
      source: 'manual' as const,
      sourceLabel: '알림에서 알려줌',
    }] : []),
  ]
}

export async function getTodayLifeLog(userId: string): Promise<TodayLifeLog> {
  if (!USE_MOCK_API) return request<TodayLifeLog>('/life-logs/today')

  const [briefing, connections, manualEntries] = await Promise.all([
    getTodayBriefing(),
    getConnectionStatus(userId),
    getTodayManualInputs(userId),
  ])

  const sleep = briefing.metrics.find((metric) => metric.id === 'sleep')
  const humidity = briefing.metrics.find((metric) => metric.id === 'humidity')
  const uv = briefing.metrics.find((metric) => metric.id === 'uv')

  const lifestyleEntries = connections.lifeDataConnected
    ? [
        ...(sleep ? [automaticEntry({
          id: sleep.id,
          type: 'sleep',
          label: sleep.label,
          value: sleep.value,
          description: sleep.description,
        })] : []),
        ...additionalLifestyleMock.map(automaticEntry),
      ]
    : []

  const environmentEntries = connections.weatherConnected
    ? [
        automaticEntry({
          id: 'temperature',
          type: 'temperature',
          label: '기온',
          value: String(briefing.weather.temperature),
          unit: '°C',
          description: '현재 위치의 오늘 기온',
        }),
        ...(humidity ? [automaticEntry({
          id: humidity.id,
          type: 'humidity',
          label: humidity.label,
          value: humidity.value,
          description: humidity.description,
        })] : []),
        ...(uv ? [automaticEntry({
          id: uv.id,
          type: 'uv',
          label: uv.label,
          value: uv.value,
          description: uv.description,
        })] : []),
        ...additionalEnvironmentMock.map(automaticEntry),
      ]
    : []

  const visibleAutomaticCount = lifestyleEntries.length + environmentEntries.length
  const automaticCount = connections.lifeDataConnected && connections.weatherConnected
    ? briefing.syncedCount
    : visibleAutomaticCount

  return {
    dateLabel: briefing.dateLabel,
    automaticCount,
    connections,
    lifestyleEntries,
    environmentEntries,
    manualEntries,
  }
}
