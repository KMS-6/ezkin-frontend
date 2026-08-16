import type { AnalysisPeriod, AnalysisReport, TriggerAnalysisDetail } from './analysisReport'
import type { HealthDataSnapshot } from './healthConnection'
import type { HealthConcern, OnboardingProfile, SkinConcern, SkinType } from './onboarding'
import type { TodayProductRecommendation } from './product'

export type MockPersonaId = 'persona_a1_seoyeon' | 'persona_b1_eunji' | 'persona_c1_minjun'
export type MockScenarioType = 'NO_WATCH_FIRST_USE' | 'WATCH_FIRST_USE' | 'WATCH_LONG_TERM'

export interface MockPersonaData {
  persona_id: MockPersonaId
  scenario_type: MockScenarioType
  display_name: string
  birth_year: number
  service_usage_days: number
  watch_connected: boolean
  baseline_established: boolean
  health_concerns: HealthConcern[]
  skin_type: SkinType
  skin_concerns: SkinConcern[]
  product_ids: string[]
  product_recommendations: TodayProductRecommendation[]
  weather: {
    observed_at: string
    temperature_c: number
    humidity_percent: number
    uv_index: number
  }
  current_health?: HealthDataSnapshot
  health_baseline?: {
    sleep_hours?: number
    hrv_ms?: number
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
