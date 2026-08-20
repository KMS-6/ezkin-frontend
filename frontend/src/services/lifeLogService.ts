import type {
  LifeLogConnectionStatus,
  LifeLogEntry,
  TodayLifeLog,
} from '../types/lifeLog'
import { getTodayBriefing } from './briefingService'
import { getOnboardingProfile } from './onboardingService'
import { getTodayQuickInput } from './quickInputService'
import type { WaterChoice } from '../types/androidNotification'
import { getMockPersona } from '../mocks/personas'
import { formatDietChoice } from '../utils/dietChoice'
import { getTodayDateLabel, isDemoPersonaUser } from '../utils/appDateTime'
import { getCurrentWeatherData } from './weatherDataService'
import { getNormalHealthMockSnapshot } from './healthConnectionService'

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

function waterLabel(choice: WaterChoice): string {
  if (choice === 'under_3') return '3잔 미만'
  if (choice === '3_to_5') return '3~5잔'
  return '5잔 이상'
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
  const quickInput = getTodayQuickInput(userId)
  const dietChoice = quickInput?.dietChoice
  const waterChoice = quickInput?.waterChoice

  return [
    ...(waterChoice ? [{
      id: 'water',
      type: 'water' as const,
      label: '오늘 물',
      value: waterLabel(waterChoice),
      description: '오늘 알려준 내용이에요.',
      source: 'manual' as const,
      sourceLabel: '직접 알려줌',
    }] : []),
    ...(dietChoice ? [{
      id: 'diet',
      type: 'diet' as const,
      label: '오늘 식단',
      value: formatDietChoice(dietChoice),
      description: '이미 오늘 케어에 반영했어요.',
      source: 'manual' as const,
      sourceLabel: '직접 알려줌',
    }] : []),
  ]
}

export async function getTodayLifeLog(userId: string): Promise<TodayLifeLog> {
  if (!isDemoPersonaUser(userId) && !USE_MOCK_API) {
    return request<TodayLifeLog>('/life-logs/today')
  }

  const [connections, manualEntries] = await Promise.all([
    getConnectionStatus(userId),
    getTodayManualInputs(userId),
  ])
  const persona = getMockPersona(userId)
  const [briefing, currentEnvironment] = await Promise.all([
    persona ? getTodayBriefing(userId) : Promise.resolve(null),
    !persona && connections.weatherConnected
      ? getCurrentWeatherData(userId)
      : Promise.resolve(undefined),
  ])

  const healthSnapshot = persona?.current_health ?? (!persona ? getNormalHealthMockSnapshot() : undefined)
  const lifestyleEntries = connections.lifeDataConnected
    ? healthSnapshot
      ? [
          ...(healthSnapshot.sleep_hours !== undefined ? [automaticEntry({
            id: 'sleep',
            type: 'sleep',
            label: '수면',
            value: String(healthSnapshot.sleep_hours),
            unit: '시간',
            ...(persona?.health_baseline?.sleep_hours !== undefined
              ? { description: `평소 ${persona.health_baseline.sleep_hours}시간` }
              : {}),
          })] : []),
          ...(healthSnapshot.hrv_ms !== undefined ? [automaticEntry({
            id: 'hrv',
            type: 'hrv',
            label: 'HRV',
            value: String(healthSnapshot.hrv_ms),
            unit: 'ms',
            ...(persona?.health_baseline?.hrv_ms !== undefined
              ? { description: '14일 평균보다 약 35% 낮음' }
              : {}),
          })] : []),
          ...(healthSnapshot.active_energy_kcal !== undefined ? [automaticEntry({
            id: 'active-energy',
            type: 'active_energy_kcal',
            label: '활동',
            value: String(healthSnapshot.active_energy_kcal),
            unit: 'kcal',
          })] : []),
        ]
      : []
    : []

  const visibleLifestyleEntries = lifestyleEntries

  const environmentEntries = connections.weatherConnected
    ? [
        ...((briefing?.weather.temperature ?? currentEnvironment?.temperatureC) !== undefined ? [automaticEntry({
          id: 'temperature',
          type: 'temperature',
          label: '기온',
          value: String(briefing?.weather.temperature ?? currentEnvironment?.temperatureC),
          unit: '°C',
          description: '현재 위치의 오늘 기온',
        })] : []),
        ...((briefing?.weather.humidity ?? currentEnvironment?.humidityPercent) !== undefined ? [automaticEntry({
          id: 'humidity',
          type: 'humidity',
          label: '습도',
          value: `${briefing?.weather.humidity ?? currentEnvironment?.humidityPercent}%`,
          description: `현재 위치의 습도 ${briefing?.weather.humidity ?? currentEnvironment?.humidityPercent}%`,
        })] : []),
        ...((briefing?.weather.uvIndex ?? currentEnvironment?.uvIndex) !== undefined ? [automaticEntry({
          id: 'uv',
          type: 'uv',
          label: 'UV',
          value: String(briefing?.weather.uvIndex ?? currentEnvironment?.uvIndex),
          description: `현재 위치의 UV 지수 ${briefing?.weather.uvIndex ?? currentEnvironment?.uvIndex}`,
        })] : []),
      ]
    : []

  const visibleAutomaticCount = visibleLifestyleEntries.length + environmentEntries.length
  const automaticCount = connections.lifeDataConnected && connections.weatherConnected
    ? briefing?.syncedCount ?? visibleAutomaticCount
    : visibleAutomaticCount

  return {
    dateLabel: briefing?.dateLabel ?? getTodayDateLabel(userId),
    automaticCount,
    connections,
    lifestyleEntries: visibleLifestyleEntries,
    environmentEntries,
    manualEntries,
    healthBaselineStatus: connections.lifeDataConnected && visibleLifestyleEntries.length > 0
      ? persona?.baseline_established ? 'established' : 'building'
      : undefined,
  }
}
