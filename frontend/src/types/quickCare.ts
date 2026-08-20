export type QuickCareSafetyAction = 'stop_ai_guidance' | 'continue_general_guidance'

export interface QuickCareSafetyCheckRequest {
  message: string
}

export interface QuickCareSafetyCheckResponse {
  action: QuickCareSafetyAction
  reply: string
  professional_help_suggested: boolean
}
