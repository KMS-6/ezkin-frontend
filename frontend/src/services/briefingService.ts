import { todayBriefingMock } from '../mocks/briefing'
import { getMockPersona } from '../mocks/personas'
import type { BriefingData } from '../types/briefing'
import type { CareContextPreviewRequest, CareContextPreviewResponse } from '../types/careContext'
import { getSavedDietChoice } from './quickInputService'
import { getOnboardingProfile } from './onboardingService'
import { isCareContextApiEnabled, previewCareContext } from './careContextService'
import { getCurrentGreeting, getTodayDateLabel, isDemoPersonaUser } from '../utils/appDateTime'
import { getCurrentWeatherData, type CurrentEnvironmentData } from './weatherDataService'
import { apiRequest } from './apiClient'
import { requireFeatureAvailable } from './userFeatureAvailability'

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'
const USE_BRIEFING_API = import.meta.env.VITE_USE_BRIEFING_API === 'true'

interface BackendBriefingReady {
  status: 'ready'
  date: string
  risk_level: string
  headline: string
  summary: string
  contributing_factors: Array<{ type: string; text: string }>
  data_coverage: Record<string, boolean>
  limitation_notice: string
}

interface BackendBriefingPending {
  status: 'pending'
  date: string
  generation_expected_at: string
  previous_briefing: { headline: string; risk_level: string } | null
}

function mapBackendBriefing(response: BackendBriefingReady | BackendBriefingPending): BriefingData {
  if (response.status === 'pending') {
    return {
      greeting: '좋은 아침이에요',
      dateLabel: response.date,
      weather: {},
      skinHeadline: response.previous_briefing?.headline ?? '오늘 브리핑을 준비하고 있어요.',
      riskLabel: '준비 중',
      summary: '데이터를 정리한 뒤 오늘의 케어를 알려드릴게요.',
      careTip: '잠시 후 다시 확인해주세요.',
      metrics: [],
      syncedSources: [],
      syncedCount: 0,
    }
  }

  const riskLabels: Record<string, string> = {
    low: '편안한 상태',
    moderate: '피부 변화 관찰',
    high: '자극 가능성 높음',
    very_high: '오늘은 자극을 줄여요',
  }
  const metrics: BriefingData['metrics'] = response.contributing_factors.map((factor, index) => {
    const environment = factor.type === 'weather' || factor.type.includes('humidity') || factor.type.includes('uv')
    return {
      id: `${factor.type}-${index}`,
      label: environment ? '환경' : '생활',
      value: factor.text,
      icon: environment ? 'humidity' : 'sleep',
      source: environment ? 'environment' : 'health',
      description: factor.text,
    }
  })
  const syncedSources = Object.entries(response.data_coverage)
    .filter(([, available]) => available)
    .map(([source]) => source)
  return {
    greeting: '좋은 아침이에요',
    dateLabel: response.date,
    weather: {},
    skinHeadline: response.headline,
    riskLabel: riskLabels[response.risk_level] ?? '오늘 상태',
    summary: response.summary,
    careTip: response.limitation_notice,
    metrics,
    contributingFactors: metrics,
    syncedSources,
    syncedCount: syncedSources.length,
  }
}

type CareContextRequester = (
  request: CareContextPreviewRequest,
) => Promise<CareContextPreviewResponse>

interface CareContextBriefingOptions {
  userId: string
  enabled?: boolean
  requestPreview?: CareContextRequester
  userReportsDiscomfort?: boolean
}

function getMetricNumber(briefing: BriefingData, id: 'humidity' | 'uv'): number | undefined {
  const metric = briefing.metrics.find((item) => item.id === id && item.source === 'environment')
  if (!metric) return id === 'humidity' ? briefing.weather.humidity : briefing.weather.uvIndex
  const value = Number.parseFloat(metric.value.replace('%', '').trim())
  return Number.isFinite(value) ? value : undefined
}

function mapCurrentEnvironmentMetrics(
  environment: CurrentEnvironmentData,
): BriefingData['metrics'] {
  return [
    ...(environment.humidityPercent !== undefined ? [{
      id: 'humidity',
      label: '습도',
      value: `${environment.humidityPercent}%`,
      icon: 'humidity' as const,
      source: 'environment' as const,
      description: `현재 습도 ${environment.humidityPercent}%예요.`,
    }] : []),
    ...(environment.uvIndex !== undefined ? [{
      id: 'uv',
      label: 'UV',
      value: String(environment.uvIndex),
      icon: 'uv' as const,
      source: 'environment' as const,
      description: `현재 UV 지수는 ${environment.uvIndex}예요.`,
    }] : []),
  ]
}

async function applyCurrentEnvironment(
  briefing: BriefingData,
  userId?: string,
): Promise<BriefingData> {
  if (!userId) return briefing

  const profile = await getOnboardingProfile(userId)
  const healthMetrics = briefing.metrics.filter((metric) => metric.source === 'health')
  const environment = profile.weatherConnected
    ? await getCurrentWeatherData(userId)
    : undefined
  const environmentMetrics = environment ? mapCurrentEnvironmentMetrics(environment) : []

  return {
    ...briefing,
    weather: environment
      ? {
          ...(environment.temperatureC !== undefined ? { temperature: environment.temperatureC } : {}),
          ...(environment.humidityPercent !== undefined ? { humidity: environment.humidityPercent } : {}),
          ...(environment.uvIndex !== undefined ? { uvIndex: environment.uvIndex } : {}),
        }
      : {},
    metrics: [...healthMetrics, ...environmentMetrics],
    syncedSources: [
      ...healthMetrics.map((metric) => metric.label),
      ...(environmentMetrics.length ? ['날씨'] : []),
    ],
    syncedCount: healthMetrics.length + environmentMetrics.length,
  }
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

function mergeEnvironmentFactors(
  briefing: BriefingData,
  observedMetrics: BriefingData['metrics'],
): BriefingData['metrics'] {
  const metrics = new Map(
    briefing.metrics
      .filter((metric) => metric.source === 'environment')
      .map((metric) => [metric.id, metric]),
  )
  observedMetrics.forEach((metric) => metrics.set(metric.id, metric))
  return [...metrics.values()]
}

export async function applyCareContextToBriefing(
  briefing: BriefingData,
  options: CareContextBriefingOptions,
): Promise<BriefingData> {
  if (isDemoPersonaUser(options.userId)) return briefing
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
    const observedMetrics = mapObservedEnvironmentFactors(careContext, humidity, uvIndex)
    return replaceEnvironmentFactors(
      briefing,
      mergeEnvironmentFactors(briefing, observedMetrics),
      careContext,
    )
  } catch {
    return replaceEnvironmentFactors(briefing, mergeEnvironmentFactors(briefing, []))
  }
}

async function getMockTodayBriefing(userId?: string): Promise<BriefingData> {
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
    const riskLabels = {
      moderate: '피부 변화 관찰',
      high: '자극 가능성 높음',
      very_high: '오늘은 자극을 줄여요',
    }

    return {
      greeting: '좋은 아침이에요',
      dateLabel: '8월 15일',
      weather: {},
      skinHeadline: persona.briefing.headline,
      riskLabel: riskLabels[persona.briefing.risk_level],
      summary: persona.briefing.summary,
      careTip: '오늘 가진 제품으로 필요한 단계만 챙겨요.',
      metrics: healthMetrics,
      syncedSources: [
        ...(healthMetrics.length ? ['수면', 'HRV'] : []),
      ],
      syncedCount: healthMetrics.length,
      ...(userId ? { dietChoice: getSavedDietChoice(userId) ?? undefined } : {}),
    }
  }

  const metrics: BriefingData['metrics'] = []
  const summary = profile
    ? '오늘은 자극적인 단계를 줄이고 피부를 편안하게 쉬어가세요.'
    : todayBriefingMock.summary
  return Promise.resolve({
    ...todayBriefingMock,
    weather: {},
    metrics,
    summary,
    ...(userId ? { dietChoice: getSavedDietChoice(userId) ?? undefined } : {}),
  })
}

async function getBaseTodayBriefing(userId?: string): Promise<BriefingData> {
  requireFeatureAvailable('briefing', userId)
  const useLiveBriefing = !isDemoPersonaUser(userId) && (USE_BRIEFING_API || !USE_MOCK_API)
  if (!useLiveBriefing) return getMockTodayBriefing(userId)
  const response = await apiRequest<BackendBriefingReady | BackendBriefingPending>('/briefings/today')
  return mapBackendBriefing(response)
}

export async function getTodayBriefing(userId?: string): Promise<BriefingData> {
  const briefing = await applyCurrentEnvironment(await getBaseTodayBriefing(userId), userId)
  const datedBriefing = isDemoPersonaUser(userId)
    ? briefing
    : {
        ...briefing,
        greeting: getCurrentGreeting(userId),
        dateLabel: getTodayDateLabel(userId),
      }
  return datedBriefing
}
