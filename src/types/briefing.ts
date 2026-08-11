export type BadgeTone = 'primary' | 'success' | 'warning' | 'neutral'

export interface WeatherSummary {
  temperature: number
  humidity: number
}

export interface BriefingMetric {
  id: string
  label: string
  value: string
  icon: 'sleep' | 'humidity' | 'uv'
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
  syncedSources: string[]
  syncedCount: number
}

export type DietChoice = 'usual' | 'spicy'
