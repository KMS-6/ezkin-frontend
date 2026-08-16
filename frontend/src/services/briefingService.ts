import { todayBriefingMock } from '../mocks/briefing'
import { getMockPersona } from '../mocks/personas'
import type { BriefingData } from '../types/briefing'
import type { CareContextPreviewRequest, CareContextPreviewResponse } from '../types/careContext'
import { getSavedDietChoice } from './quickInputService'
import { getOnboardingProfile } from './onboardingService'
import { isCareContextApiEnabled, previewCareContext } from './careContextService'

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

type CareContextRequester = (
  request: CareContextPreviewRequest,
) => Promise<CareContextPreviewResponse>

interface CareContextBriefingOptions {
  enabled?: boolean
  requestPreview?: CareContextRequester
  userReportsDiscomfort?: boolean
}

function getMetricNumber(briefing: BriefingData, id: 'humidity' | 'uv'): number | undefined {
  const metric = briefing.metrics.find((item) => item.id === id && item.source === 'environment')
  if (!metric) return undefined
  const value = Number.parseFloat(metric.value.replace('%', '').trim())
  return Number.isFinite(value) ? value : undefined
}

function replaceEnvironmentFactors(
  briefing: BriefingData,
  environmentMetrics: BriefingData['metrics'],
  careContext?: CareContextPreviewResponse,
): BriefingData {
  const healthMetrics = briefing.metrics.filter((metric) => metric.source === 'health')
  return {
    ...briefing,
    contributingFactors: [...healthMetrics, ...environmentMetrics],
    careContext,
  }
}

function mapObservedEnvironmentFactors(
  careContext: CareContextPreviewResponse,
  humidity: number | undefined,
  uvIndex: number | undefined,
): BriefingData['metrics'] {
  const metrics = new Map<string, BriefingData['metrics'][number]>()

  careContext.observed_factors.forEach((factor) => {
    const type = factor.type.toLowerCase()
    if (humidity !== undefined && type.includes('humidity')) {
      metrics.set('humidity', {
        id: 'humidity',
        label: '습도',
        value: `${humidity}%`,
        icon: 'humidity',
        source: 'environment',
        description: factor.message,
      })
    }
    if (uvIndex !== undefined && type.includes('uv')) {
      metrics.set('uv', {
        id: 'uv',
        label: 'UV',
        value: String(uvIndex),
        icon: 'uv',
        source: 'environment',
        description: factor.message,
      })
    }
  })

  return [...metrics.values()]
}

export async function applyCareContextToBriefing(
  briefing: BriefingData,
  options: CareContextBriefingOptions = {},
): Promise<BriefingData> {
  const enabled = options.enabled ?? isCareContextApiEnabled()
  if (!enabled) return briefing

  const humidity = getMetricNumber(briefing, 'humidity')
  const uvIndex = getMetricNumber(briefing, 'uv')
  const userReportsDiscomfort = options.userReportsDiscomfort ?? false
  if (humidity === undefined && uvIndex === undefined && !userReportsDiscomfort) return briefing

  const request: CareContextPreviewRequest = {
    ...(humidity !== undefined ? { humidity } : {}),
    ...(uvIndex !== undefined ? { uv_index: uvIndex } : {}),
    user_reports_discomfort: userReportsDiscomfort,
  }

  try {
    const careContext = await (options.requestPreview ?? previewCareContext)(request)
    return replaceEnvironmentFactors(
      briefing,
      mapObservedEnvironmentFactors(careContext, humidity, uvIndex),
      careContext,
    )
  } catch {
    return replaceEnvironmentFactors(briefing, [])
  }
}

async function getBaseTodayBriefing(userId?: string): Promise<BriefingData> {
  if (USE_MOCK_API) {
    const profile = userId ? await getOnboardingProfile(userId) : null
    const persona = userId ? getMockPersona(userId) : null
    if (profile && persona) {
      const healthMetrics: BriefingData['metrics'] = profile.lifeDataConnected && persona.current_health
        ? [
            ...(persona.current_health.sleep_hours !== undefined ? [{
              id: 'sleep', label: '수면', value: `${persona.current_health.sleep_hours}h`, icon: 'sleep' as const,
              source: 'health' as const,
              description: persona.health_baseline?.sleep_hours !== undefined
                ? `평소 ${persona.health_baseline.sleep_hours}시간`
                : '현재 수면 기록이에요.',
            }] : []),
            ...(persona.current_health.hrv_ms !== undefined ? [{
              id: 'hrv', label: 'HRV', value: `${persona.current_health.hrv_ms} ms`, icon: 'hrv' as const,
              source: 'health' as const,
              description: persona.health_baseline?.hrv_ms !== undefined
                ? `14일 평균 ${persona.health_baseline.hrv_ms}ms보다 낮아요.`
                : '현재 HRV 기록이에요.',
            }] : []),
          ]
        : []
      const environmentMetrics: BriefingData['metrics'] = profile.weatherConnected ? [
        {
          id: 'humidity', label: '습도', value: `${persona.weather.humidity_percent}%`, icon: 'humidity',
          source: 'environment', description: `현재 습도 ${persona.weather.humidity_percent}%예요.`,
        },
        {
          id: 'uv', label: 'UV', value: String(persona.weather.uv_index), icon: 'uv',
          source: 'environment', description: `현재 UV 지수 ${persona.weather.uv_index}예요.`,
        },
      ] : []
      const riskLabels = {
        moderate: '피부 변화 관찰',
        high: '자극 가능성 높음',
        very_high: '오늘은 자극을 줄여요',
      }

      return {
        greeting: '좋은 아침이에요',
        dateLabel: '8월 15일',
        weather: {
          temperature: persona.weather.temperature_c,
          humidity: persona.weather.humidity_percent,
        },
        skinHeadline: persona.briefing.headline,
        riskLabel: riskLabels[persona.briefing.risk_level],
        summary: persona.briefing.summary,
        careTip: '오늘 가진 제품으로 필요한 단계만 챙겨요.',
        metrics: [...healthMetrics, ...environmentMetrics],
        syncedSources: [
          ...(healthMetrics.length ? ['수면', 'HRV'] : []),
          ...(environmentMetrics.length ? ['날씨', 'UV'] : []),
        ],
        syncedCount: healthMetrics.length + environmentMetrics.length,
        ...(userId ? { dietChoice: getSavedDietChoice(userId) ?? undefined } : {}),
      }
    }

    const baseMetrics = todayBriefingMock.metrics
      .filter((metric) => (
        metric.source === 'health' ? false : profile?.weatherConnected !== false
      ))
    const metrics = baseMetrics
    const summary = profile
      ? profile.weatherConnected
        ? '오늘 환경 흐름을 바탕으로 자극을 조금 줄여도 좋아요.'
        : '오늘은 자극적인 단계를 줄이고 피부를 편안하게 쉬어가세요.'
      : todayBriefingMock.summary
    return Promise.resolve({
      ...todayBriefingMock,
      metrics,
      summary,
      ...(userId ? { dietChoice: getSavedDietChoice(userId) ?? undefined } : {}),
    })
  }
  return request<BriefingData>('/briefing')
}

export async function getTodayBriefing(userId?: string): Promise<BriefingData> {
  const briefing = await getBaseTodayBriefing(userId)
  return isCareContextApiEnabled()
    ? replaceEnvironmentFactors(briefing, [])
    : briefing
}
