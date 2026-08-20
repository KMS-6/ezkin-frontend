import { getMockPersona } from '../mocks/personas'
import type { AnalysisEligibility } from '../types/analysis'
import type {
  AnalysisPeriod,
  AnalysisReport,
  PatternAnalysis,
  TriggerAnalysisDetail,
} from '../types/analysisReport'
import { getRecentTriggerAnalysisReference } from './skinScanService'
import { apiRequest } from './apiClient'
import { isDemoPersonaUser } from '../utils/appDateTime'

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'
const USE_ANALYSIS_API = import.meta.env.VITE_USE_ANALYSIS_API === 'true'
const REQUIRED_DATA_DAYS = 14

interface BackendEligibility {
  available_days: number
  required_days: number
  eligible: boolean
}

async function requestPatternAnalysis(scanId: string): Promise<PatternAnalysis | null> {
  try {
    return await apiRequest<PatternAnalysis>(`/pattern-analysis?scan_id=${encodeURIComponent(scanId)}`)
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 409) return null
    throw error
  }
}

export async function getAnalysisEligibility(userId: string): Promise<AnalysisEligibility> {
  if ((USE_ANALYSIS_API && isDemoPersonaUser(userId)) || !USE_MOCK_API) {
    const response = await apiRequest<BackendEligibility>('/analysis/eligibility')
    return {
      dataDays: response.available_days,
      requiredDays: response.required_days,
      eligible: response.eligible,
    }
  }

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
  if ((USE_ANALYSIS_API && isDemoPersonaUser(userId)) || !USE_MOCK_API) {
    const created = await apiRequest<{ report_id: string }>('/reports', {
      method: 'POST',
      body: JSON.stringify({ period_days: period, locale: 'ko-KR' }),
    })
    const report = await apiRequest<Omit<AnalysisReport, 'period'> & {
      period: { period_days: AnalysisPeriod }
    }>(`/reports/${created.report_id}`)
    return { ...report, period: report.period.period_days }
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
  if ((USE_ANALYSIS_API && isDemoPersonaUser(userId)) || !USE_MOCK_API) {
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
