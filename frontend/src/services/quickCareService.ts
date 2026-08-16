import type { ApiClientOptions } from './apiClient'
import { apiRequest } from './apiClient'
import type {
  QuickCareSafetyCheckRequest,
  QuickCareSafetyCheckResponse,
} from '../types/quickCare'

export class QuickCareServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'QuickCareServiceError'
  }
}

function isQuickCareSafetyCheckResponse(value: unknown): value is QuickCareSafetyCheckResponse {
  if (!value || typeof value !== 'object') return false
  const response = value as Record<string, unknown>
  return (
    (response.action === 'stop_ai_guidance' || response.action === 'continue_general_guidance')
    && typeof response.reply === 'string'
    && typeof response.professional_help_suggested === 'boolean'
  )
}

export async function checkQuickCareSafety(
  message: string,
  clientOptions?: ApiClientOptions,
): Promise<QuickCareSafetyCheckResponse> {
  const request: QuickCareSafetyCheckRequest = { message }
  const response = await apiRequest<unknown>('/quick-care/safety-check', {
    method: 'POST',
    body: JSON.stringify(request),
  }, clientOptions)

  if (!isQuickCareSafetyCheckResponse(response)) {
    throw new QuickCareServiceError('안전 확인 응답 형식이 올바르지 않아요.')
  }
  return response
}
