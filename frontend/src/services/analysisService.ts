import { getMockPersona } from '../mocks/personas'
import type { AnalysisEligibility } from '../types/analysis'
import type {
  AnalysisPeriod,
  AnalysisReport,
  PatternAnalysis,
  TriggerAnalysisDetail,
} from '../types/analysisReport'
import { getRecentTriggerAnalysisReference } from './skinScanService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'
const TOKEN_KEY = 'ezkin:access-token'
const REQUIRED_DATA_DAYS = 14


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

  if (!response.ok) throw new Error('피부 패턴을 불러오지 못했어요.')
  return response.json() as Promise<T>
}

async function requestPatternAnalysis(scanId: string): Promise<PatternAnalysis | null> {
  if (!API_BASE_URL) throw new Error('API 주소가 설정되지 않았어요.')
  const token = localStorage.getItem(TOKEN_KEY)
  const response = await fetch(`${API_BASE_URL}/pattern-analysis?scan_id=${encodeURIComponent(scanId)}`, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (response.status === 409) return null
  if (!response.ok) throw new Error('피부 패턴을 불러오지 못했어요.')
  return response.json() as Promise<PatternAnalysis>
}

export async function getAnalysisEligibility(userId: string): Promise<AnalysisEligibility> {
  if (!USE_MOCK_API) return request<AnalysisEligibility>('/analysis/eligibility')

  const dataDays = getMockPersona(userId)?.service_usage_days ?? 1
  return Promise.resolve({
    dataDays,
    requiredDays: REQUIRED_DATA_DAYS,
    eligible: dataDays >= REQUIRED_DATA_DAYS,
  })
}

export async function getAnalysisReport(
  userId: string,
  period: AnalysisPeriod,
): Promise<AnalysisReport | null> {
  if (!USE_MOCK_API) {
    const created = await request<{ report_id: string }>('/reports', {
      method: 'POST',
      body: JSON.stringify({ period }),
    })
    return request<AnalysisReport>(`/reports/${created.report_id}`)
  }

  const report = getMockPersona(userId)?.reports[period]
  if (!report) return null

  return {
    ...report,
    observations: report.observations.map((item) => ({ ...item, evidence_ids: [...item.evidence_ids] })),
    patterns: report.patterns.map((item) => ({ ...item, evidence_ids: [...item.evidence_ids] })),
    recommendations: report.recommendations.map((item) => ({ ...item, evidence_ids: [...item.evidence_ids] })),
  }
}

export async function getPatternAnalysis(
  userId: string,
  scanId: string,
): Promise<TriggerAnalysisDetail | null> {
  if (!USE_MOCK_API) {
    return requestPatternAnalysis(scanId)
  }
  if (!scanId) return null
  const persona = getMockPersona(userId)
  if (persona) {
    const pattern = persona.pattern_analysis
    if (!pattern) return null
    return {
      ...pattern,
      window: { ...pattern.window },
      raw_facts: pattern.raw_facts.map((fact) => ({ ...fact })),
      observed_pattern: pattern.observed_pattern ? { ...pattern.observed_pattern } : null,
      common_knowledge: pattern.common_knowledge ? { ...pattern.common_knowledge } : null,
    }
  }

  const reference = getRecentTriggerAnalysisReference(userId)
  if (!reference || reference.scanId !== scanId) return null
  const end = new Date(reference.capturedAt)
  const start = new Date(end.getTime() - 72 * 60 * 60 * 1000)
  return {
    scan_id: scanId,
    window: { start: start.toISOString(), end: end.toISOString() },
    raw_facts: [],
    observed_pattern: null,
    common_knowledge: null,
    disclaimer: '통계적 인과관계나 의료 진단이 아닌 예방적 참고용 관찰입니다.',
  }
}

export const getTriggerAnalysisDetail = getPatternAnalysis
