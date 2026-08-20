import type {
  SOSContext,
  SendSOSMessageRequest,
  SendSOSMessageResponse,
} from '../types/sos'
import type { ProductCategory } from '../types/product'
import type { QuickCareSafetyCheckResponse } from '../types/quickCare'
import { checkQuickCareSafety } from './quickCareService'
import { ApiClientError, apiRequest } from './apiClient'
import { isDemoPersonaUser } from '../utils/appDateTime'

export function isQuickCareApiEnabled(value = import.meta.env.VITE_USE_QUICK_CARE_API): boolean {
  return value === 'true'
}

const USE_QUICK_CARE_API = isQuickCareApiEnabled()
const USE_SOS_API = import.meta.env.VITE_USE_SOS_API === 'true'
const SOS_SESSION_KEY = 'ezkin:sos-session'

export type SOSServiceErrorCode = 'SAFETY_CHECK_FAILED' | 'GENERAL_RESPONSE_FAILED'

export class SOSServiceError extends Error {
  readonly code: SOSServiceErrorCode

  constructor(
    code: SOSServiceErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'SOSServiceError'
    this.code = code
  }
}

type SafetyCheck = (message: string) => Promise<QuickCareSafetyCheckResponse>
type GeneralResponder = (
  message: string,
  context: SOSContext,
) => SendSOSMessageResponse | Promise<SendSOSMessageResponse>

interface SOSFlowDependencies {
  safetyCheck?: SafetyCheck
  generalResponder?: GeneralResponder
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function getStoredSessionId(userId: string): string | null {
  try {
    const sessions = JSON.parse(localStorage.getItem(SOS_SESSION_KEY) ?? '{}') as Record<string, unknown>
    return typeof sessions[userId] === 'string' ? sessions[userId] : null
  } catch {
    return null
  }
}

function storeSessionId(userId: string, sessionId: string): void {
  let sessions: Record<string, unknown> = {}
  try {
    sessions = JSON.parse(localStorage.getItem(SOS_SESSION_KEY) ?? '{}') as Record<string, unknown>
  } catch {
    // 손상된 세션 저장소는 새 세션으로 교체합니다.
  }
  localStorage.setItem(SOS_SESSION_KEY, JSON.stringify({ ...sessions, [userId]: sessionId }))
}

function clearStoredSessionId(userId: string): void {
  let sessions: Record<string, unknown> = {}
  try {
    sessions = JSON.parse(localStorage.getItem(SOS_SESSION_KEY) ?? '{}') as Record<string, unknown>
  } catch {
    return
  }
  delete sessions[userId]
  localStorage.setItem(SOS_SESSION_KEY, JSON.stringify(sessions))
}

async function getOrCreateLiveSession(userId: string): Promise<string> {
  const stored = getStoredSessionId(userId)
  if (stored) return stored
  const created = await apiRequest<{ session_id: string }>('/sos/sessions', { method: 'POST' })
  storeSessionId(userId, created.session_id)
  return created.session_id
}

async function createLiveResponse(message: string, context: SOSContext): Promise<SendSOSMessageResponse> {
  const send = (sessionId: string) => apiRequest<{
    reply: string
    expert_referral_suggested: boolean
  }>(`/sos/sessions/${encodeURIComponent(sessionId)}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
  let sessionId = await getOrCreateLiveSession(context.userId)
  let response: Awaited<ReturnType<typeof send>>
  try {
    response = await send(sessionId)
  } catch (error) {
    if (!(error instanceof ApiClientError) || error.status !== 404) throw error
    clearStoredSessionId(context.userId)
    sessionId = await getOrCreateLiveSession(context.userId)
    response = await send(sessionId)
  }
  return {
    message: response.reply,
    professionalHelpSuggested: response.expert_referral_suggested,
  }
}

function ownedRecommendedProduct(context: SOSContext, category?: ProductCategory): string | null {
  const product = context.products?.find((item) => (
    item.recommendationStatus === 'recommended'
    && (!category || item.category === category)
  ))
  return product?.name ?? null
}

function createMockResponse(message: string, context: SOSContext): SendSOSMessageResponse {
  const normalized = message.toLowerCase()
  const moisturizer = ownedRecommendedProduct(context, 'cream')
  const ownedRetinol = context.products?.find((item) => item.name.includes('레티놀'))

  if (normalized.includes('레티놀')) {
    const ownedProductCopy = moisturizer
      ? `대신 가지고 있는 ${moisturizer}으로 가볍게 마무리해보세요.`
      : '대신 보습 중심으로 가볍게 마무리해보세요.'
    const retinolCopy = ownedRetinol ? '가지고 있는 레티놀은 오늘 하루 쉬어가도 좋아요.' : '오늘은 레티놀 단계를 쉬어가도 좋아요.'
    return { message: `오늘 피부는 조금 예민할 수 있어요. ${retinolCopy} ${ownedProductCopy}` }
  }

  if (normalized.includes('매운') || normalized.includes('라면') || normalized.includes('자극적')) {
    return {
      message: '한 번의 식사가 바로 피부 변화로 이어진다고 보긴 어려워요. 오늘은 평소 루틴을 너무 복잡하게 바꾸지 않아도 괜찮아요.',
    }
  }

  if (normalized.includes('건조') || normalized.includes('당겨')) {
    const productCopy = moisturizer
      ? `가지고 있는 ${moisturizer}을 보습 단계에 활용해보세요.`
      : '자극적인 단계는 줄이고 보습 중심으로 가볍게 관리해보세요.'
    return { message: `오늘은 공기가 건조한 편이라 피부도 당길 수 있어요. ${productCopy}` }
  }

  if (normalized.includes('수면') || normalized.includes('못 잤') || normalized.includes('4시간')) {
    return {
      message: '짧은 수면과 피부 변화가 같은 시기에 함께 보일 수 있어요. 오늘은 단계를 늘리기보다 보습·진정 중심으로 편하게 관리해보세요.',
    }
  }

  return {
    message: '지금 알려준 내용과 오늘 데이터를 함께 봤어요. 자극적인 단계는 잠시 줄이고 평소 쓰던 보습 제품으로 가볍게 관리해보세요. 불편함이 심하거나 계속되면 전문가에게 확인해주세요.',
    safetyLevel: 'normal',
  }
}

export async function resolveSOSMessageWithSafetyGate(
  request: SendSOSMessageRequest,
  useQuickCareApi: boolean,
  dependencies: SOSFlowDependencies = {},
): Promise<SendSOSMessageResponse> {
  const message = request.message.trim()
  if (!message) throw new Error('질문을 입력해주세요.')
  const generalResponder = dependencies.generalResponder ?? createMockResponse

  if (!useQuickCareApi) return generalResponder(message, request.context)

  let safetyResult: QuickCareSafetyCheckResponse
  try {
    safetyResult = await (dependencies.safetyCheck ?? checkQuickCareSafety)(message)
  } catch {
    throw new SOSServiceError('SAFETY_CHECK_FAILED', '안전 확인을 완료하지 못했어요.')
  }

  if (safetyResult.action === 'stop_ai_guidance') {
    return {
      message: safetyResult.reply,
      safetyGateAction: safetyResult.action,
      professionalHelpSuggested: safetyResult.professional_help_suggested,
    }
  }

  const response = await generalResponder(message, request.context)
  return {
    ...response,
    safetyGateAction: safetyResult.action,
    professionalHelpSuggested: safetyResult.professional_help_suggested,
  }
}

/**
 * Quick Care는 실백엔드 safety gate만 담당합니다.
 * 일반 SOS 답변은 해당 백엔드가 연결되기 전까지 기존 responder를 유지합니다.
 */
export async function sendSOSMessage(
  request: SendSOSMessageRequest,
): Promise<SendSOSMessageResponse> {
  const message = request.message.trim()
  if (!message) throw new Error('질문을 입력해주세요.')
  const useLiveSos = USE_SOS_API && !isDemoPersonaUser(request.context.userId)

  if (!USE_QUICK_CARE_API && !useLiveSos) {
    await wait(850)
    if (message === '__SOS_MOCK_ERROR__') {
      throw new SOSServiceError('GENERAL_RESPONSE_FAILED', 'SOS 답변을 불러오지 못했어요.')
    }
  }
  return resolveSOSMessageWithSafetyGate(
    { ...request, message },
    USE_QUICK_CARE_API,
    useLiveSos ? { generalResponder: createLiveResponse } : {},
  )
}
