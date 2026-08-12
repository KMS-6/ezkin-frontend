import type {
  SOSContext,
  SendSOSMessageRequest,
  SendSOSMessageResponse,
} from '../types/sos'
import type { ProductCategory } from '../types/product'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'
const TOKEN_KEY = 'ezkin:access-token'

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
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

/**
 * Backend 2 contract: POST /sos/chat
 * Request = { message, context }, Response = { message, safetyLevel? }
 * Claude 호출과 Safety/추천 로직은 Backend 내부에서만 수행합니다.
 */
export async function sendSOSMessage(
  request: SendSOSMessageRequest,
): Promise<SendSOSMessageResponse> {
  const message = request.message.trim()
  if (!message) throw new Error('질문을 입력해주세요.')

  if (USE_MOCK_API) {
    await wait(850)
    if (message === '__SOS_MOCK_ERROR__') throw new Error('Mock SOS request failed.')
    return createMockResponse(message, request.context)
  }

  if (!API_BASE_URL) throw new Error('API 주소가 설정되지 않았어요.')
  const token = localStorage.getItem(TOKEN_KEY)
  const response = await fetch(`${API_BASE_URL}/sos/chat`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ ...request, message }),
  })

  if (!response.ok) throw new Error('SOS 답변을 불러오지 못했어요.')
  return response.json() as Promise<SendSOSMessageResponse>
}
