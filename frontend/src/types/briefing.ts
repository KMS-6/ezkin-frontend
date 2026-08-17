import type { DietChoice } from './androidNotification'
import type { CareContextPreviewResponse } from './careContext'

export type BadgeTone = 'primary' | 'success' | 'warning' | 'neutral'

export interface WeatherSummary {
  temperature?: number
  humidity?: number
  uvIndex?: number
}

export interface BriefingMetric {
  id: string
  label: string
  value: string
  icon: 'sleep' | 'hrv' | 'humidity' | 'uv'
  source: 'health' | 'environment'
  description: string
}

export interface RoutineStep {
  id: string
  name: string
  instruction: string
  badge: string
  badgeTone: BadgeTone
}

export interface RoutineSet {
  am: RoutineStep[]
  pm: RoutineStep[]
}

export interface BriefingData {
  greeting: string
  weather: WeatherSummary
  dateLabel: string
  skinHeadline: string
  riskLabel: string
  summary: string
  careTip: string
  metrics: BriefingMetric[]
  contributingFactors?: BriefingMetric[]
  syncedSources: string[]
  syncedCount: number
  dietChoice?: DietChoice
  careContext?: CareContextPreviewResponse
}
