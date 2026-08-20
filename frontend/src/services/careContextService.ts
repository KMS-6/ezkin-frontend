import type { ApiClientOptions } from './apiClient'
import { apiRequest } from './apiClient'
import type {
  CareContextPreviewRequest,
  CareContextPreviewResponse,
  CareMode,
} from '../types/careContext'

const CARE_MODES: ReadonlySet<CareMode> = new Set([
  'basic',
  'moisture_focused',
  'soothing_focused',
  'uv_focused',
  'minimal_routine',
])
const CARE_CONTEXT_TIMEOUT_MS = 1_500

interface CareContextClientOptions extends ApiClientOptions {
  timeoutMs?: number
}

export class CareContextServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CareContextServiceError'
  }
}

export function isCareContextApiEnabled(
  value = import.meta.env.VITE_USE_CARE_CONTEXT_API,
): boolean {
  return value === 'true'
}

function isCareContextPreviewResponse(value: unknown): value is CareContextPreviewResponse {
  if (!value || typeof value !== 'object') return false
  const response = value as Record<string, unknown>
  if (
    typeof response.date !== 'string'
    || typeof response.care_mode !== 'string'
    || !CARE_MODES.has(response.care_mode as CareMode)
    || !Array.isArray(response.observed_factors)
    || typeof response.notice !== 'string'
  ) return false

  return response.observed_factors.every((factor) => {
    if (!factor || typeof factor !== 'object') return false
    const item = factor as Record<string, unknown>
    return typeof item.type === 'string' && typeof item.message === 'string'
  })
}

export async function previewCareContext(
  request: CareContextPreviewRequest,
  clientOptions: CareContextClientOptions = {},
): Promise<CareContextPreviewResponse> {
  const { timeoutMs = CARE_CONTEXT_TIMEOUT_MS, ...apiClientOptions } = clientOptions
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  let response: unknown
  try {
    response = await apiRequest<unknown>('/care-contexts/preview', {
      method: 'POST',
      body: JSON.stringify(request),
      signal: controller.signal,
    }, apiClientOptions)
  } catch (error) {
    controller.abort()
    throw error
  } finally {
    clearTimeout(timeoutId)
  }

  if (!isCareContextPreviewResponse(response)) {
    throw new CareContextServiceError('케어 컨텍스트 응답 형식이 올바르지 않아요.')
  }
  return response
}
