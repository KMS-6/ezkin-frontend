import type { AnalysisPeriod, AnalysisReport, TriggerAnalysisDetail } from './analysisReport'
import type { HealthDataSnapshot } from './healthConnection'
import type { Gender, HealthConcern, OnboardingProfile, SkinConcern, SkinType } from './onboarding'
import type { TodayProductRecommendation } from './product'

export type MockPersonaId = 'persona_long_term_yeonseo'
export type MockScenarioType = 'WATCH_LONG_TERM'

export interface MockPersonaData {
  persona_id: MockPersonaId
  scenario_type: MockScenarioType
  display_name: string
  birth_year: number
  gender: Gender
  service_usage_days: number
  watch_connected: boolean
  baseline_established: boolean
  health_concerns: HealthConcern[]
  skin_type: SkinType
  skin_concerns: SkinConcern[]
  product_ids: string[]
  product_recommendations: TodayProductRecommendation[]
  current_health?: HealthDataSnapshot
  health_baseline?: {
    sleep_hours?: number
    hrv_ms?: number
  }
  weather?: {
    observed_at: string
    temperature_c: number
    humidity_percent: number
    uv_index: number
  }
  skin_scan: {
    scan_id: string
    captured_at: string
  }
  briefing: {
    risk_level: 'moderate' | 'high' | 'very_high'
    headline: string
    summary: string
  }
  pattern_analysis: TriggerAnalysisDetail | null
  reports: Partial<Record<AnalysisPeriod, AnalysisReport>>
}

export type PersonaProfileSeed = Omit<OnboardingProfile, 'userId'>
