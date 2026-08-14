import { demoTriggerAnalysis } from '../mocks/analysis'
import type { AnalysisEligibility, TriggerAnalysis } from '../types/analysis'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'
const TOKEN_KEY = 'ezkin:access-token'
const DEMO_USER_ID = 'ezkin-demo-user'
const REQUIRED_DATA_DAYS = 14

const mockDataDaysByUser: Record<string, number> = {
  [DEMO_USER_ID]: 30,
}

async function request<T>(path: string): Promise<T> {
  if (!API_BASE_URL) throw new Error('API 주소가 설정되지 않았어요.')

  const token = localStorage.getItem(TOKEN_KEY)
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })

  if (!response.ok) throw new Error('피부 패턴을 불러오지 못했어요.')
  return response.json() as Promise<T>
}

export async function getAnalysisEligibility(userId: string): Promise<AnalysisEligibility> {
  if (!USE_MOCK_API) return request<AnalysisEligibility>('/analysis/eligibility')

  const dataDays = mockDataDaysByUser[userId] ?? 1
  return Promise.resolve({
    dataDays,
    requiredDays: REQUIRED_DATA_DAYS,
    eligible: dataDays >= REQUIRED_DATA_DAYS,
  })
}

export async function getTriggerAnalysis(userId: string): Promise<TriggerAnalysis | null> {
  if (!USE_MOCK_API) return request<TriggerAnalysis>('/analysis/triggers')

  const eligibility = await getAnalysisEligibility(userId)
  if (!eligibility.eligible) return null

  return Promise.resolve({
    ...demoTriggerAnalysis,
    dataDays: eligibility.dataDays,
    troubleEvents: demoTriggerAnalysis.troubleEvents.map((event) => ({ ...event })),
    patterns: demoTriggerAnalysis.patterns.map((pattern) => ({ ...pattern })),
    timeline: demoTriggerAnalysis.timeline.map((item) => ({ ...item })),
  })
}
