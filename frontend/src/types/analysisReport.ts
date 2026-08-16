export type AnalysisPeriod = 14 | 30
export type AnalysisReportStatus = 'processing' | 'completed' | 'failed'

export interface EvidenceStatement {
  text: string
  evidence_ids: string[]
}

export interface AnalysisReport {
  report_id: string
  status: AnalysisReportStatus
  period: AnalysisPeriod
  summary: string
  observations: EvidenceStatement[]
  patterns: EvidenceStatement[]
  recommendations: EvidenceStatement[]
  limitations: string
  safety_status: 'wellness_only'
  generated_at: string
}

export interface PatternAnalysisWindow {
  start: string
  end: string
}

export interface PatternRawFact {
  type: string
  text: string
}

export interface ObservedPattern {
  text: string
  sample_size: number
  match_count: number
}

export interface CommonKnowledgeClaim {
  claim_id: string
  version: number
  sentence: string
}

export interface PatternAnalysis {
  scan_id: string
  window: PatternAnalysisWindow
  raw_facts: PatternRawFact[]
  observed_pattern: ObservedPattern | null
  common_knowledge?: CommonKnowledgeClaim | null
  disclaimer: string
}

export type TriggerAnalysisDetail = Omit<PatternAnalysis, 'observed_pattern'> & {
  observed_pattern: ({
    text: string
  } & Partial<Pick<ObservedPattern, 'sample_size' | 'match_count'>>) | null
}
