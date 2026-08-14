export type TriggerCategory = 'sleep' | 'humidity' | 'uv' | 'diet'
export type TroubleArea = 'forehead' | 'leftCheek' | 'rightCheek' | 'chin'

export interface TriggerPattern {
  id: string
  label: string
  score: number
  qualitativeLabel: string
  description: string
  category: TriggerCategory
}

export interface TroubleEvent {
  id: string
  dateLabel: string
  area: TroubleArea
  label: string
}

export interface TriggerTimelineItem {
  id: string
  offsetLabel: string
  dateLabel: string
  label: string
  value: string
  description: string
  kind: 'condition' | 'observation'
}

export interface AnalysisEligibility {
  dataDays: number
  requiredDays: number
  eligible: boolean
}

export interface TriggerAnalysis {
  period: string
  dataDays: number
  troubleEvents: TroubleEvent[]
  patterns: TriggerPattern[]
  timeline: TriggerTimelineItem[]
  summary: string
  suggestion: string
}
