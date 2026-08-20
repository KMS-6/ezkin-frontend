export type LifeLogSource = 'automatic' | 'manual'

export type LifeLogMetricType =
  | 'sleep'
  | 'hrv'
  | 'active_energy_kcal'
  | 'temperature'
  | 'humidity'
  | 'uv'
  | 'pm25'
  | 'water'
  | 'diet'

export interface LifeLogEntry {
  id: string
  type: LifeLogMetricType
  label: string
  value: string
  unit?: string
  description?: string
  source: LifeLogSource
  sourceLabel: string
  collectedAt?: string
}

export interface LifeLogConnectionStatus {
  lifeDataConnected: boolean
  weatherConnected: boolean
}

export interface TodayLifeLog {
  dateLabel: string
  automaticCount: number
  connections: LifeLogConnectionStatus
  lifestyleEntries: LifeLogEntry[]
  environmentEntries: LifeLogEntry[]
  manualEntries: LifeLogEntry[]
  healthBaselineStatus?: 'building' | 'established'
}
