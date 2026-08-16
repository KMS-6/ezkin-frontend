export type CareMode =
  | 'basic'
  | 'moisture_focused'
  | 'soothing_focused'
  | 'uv_focused'
  | 'minimal_routine'

export interface CareContextPreviewRequest {
  humidity?: number | null
  uv_index?: number | null
  user_reports_discomfort: boolean
}

export interface CareContextObservedFactor {
  type: string
  message: string
}

export interface CareContextPreviewResponse {
  date: string
  care_mode: CareMode
  observed_factors: CareContextObservedFactor[]
  notice: string
}
