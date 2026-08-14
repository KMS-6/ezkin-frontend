import { productCatalog } from '../mocks/products'
import { todayProductRecommendations } from '../mocks/productRecommendations'
import type {
  Product,
  ProductWithRecommendation,
  RoutinePeriod,
  TodayShelfRoutine,
  TodayProductRecommendation,
} from '../types/product'
import { getOnboardingProfile, saveProducts } from './onboardingService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'
const TOKEN_KEY = 'ezkin:access-token'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) throw new Error('API 주소가 설정되지 않았어요.')

  const token = localStorage.getItem(TOKEN_KEY)
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) throw new Error('화장대 정보를 불러오지 못했어요.')
  return response.json() as Promise<T>
}

function getMockRecommendation(productId: string): TodayProductRecommendation {
  return todayProductRecommendations.find((item) => item.productId === productId) ?? {
    productId,
    status: 'available',
    summary: '오늘도 평소처럼 사용할 수 있어요.',
    reason: '오늘 상태에서 평소 루틴대로 가볍게 사용하기 좋아요.',
    recommendedTime: 'BOTH',
  }
}

export async function getProductCatalog(): Promise<Product[]> {
  if (USE_MOCK_API) return Promise.resolve(productCatalog)
  return request<Product[]>('/products/catalog')
}

export async function getMyProducts(userId: string): Promise<Product[]> {
  if (!USE_MOCK_API) return request<Product[]>('/users/me/products')

  const profile = await getOnboardingProfile(userId)
  const registeredIds = new Set(profile.registeredProductIds)
  return productCatalog.filter((product) => registeredIds.has(product.id))
}

export async function addMyProducts(userId: string, productIds: string[]): Promise<Product[]> {
  if (!USE_MOCK_API) {
    return request<Product[]>('/users/me/products', {
      method: 'POST',
      body: JSON.stringify({ productIds }),
    })
  }

  const profile = await getOnboardingProfile(userId)
  const registeredProductIds = [...new Set([...profile.registeredProductIds, ...productIds])]
  await saveProducts(userId, registeredProductIds)
  return productCatalog.filter((product) => registeredProductIds.includes(product.id))
}

export async function getProductDetail(productId: string): Promise<Product | null> {
  if (!USE_MOCK_API) {
    try {
      return await request<Product>(`/products/${productId}`)
    } catch {
      return null
    }
  }

  return Promise.resolve(productCatalog.find((product) => product.id === productId) ?? null)
}

export async function getTodayProductRecommendations(
  userId: string,
): Promise<ProductWithRecommendation[]> {
  const products = await getMyProducts(userId)
  const recommendations = USE_MOCK_API
    ? todayProductRecommendations
    : await request<TodayProductRecommendation[]>('/recommendations/today')

  return products.map((product) => {
    const recommendation = recommendations.find((item) => item.productId === product.id)
    if (!recommendation && !USE_MOCK_API) {
      throw new Error('제품 추천 응답이 완전하지 않아요.')
    }

    return {
      product,
      recommendation: recommendation ?? getMockRecommendation(product.id),
    }
  })
}

const categoryOrder: Record<Product['category'], number> = {
  toner: 1,
  serum: 2,
  cream: 3,
  sunscreen: 4,
}

function sortByRoutineStep(items: ProductWithRecommendation[]): ProductWithRecommendation[] {
  return [...items].sort((a, b) => {
    const aOrder = a.recommendation.routineStep ?? categoryOrder[a.product.category] * 10
    const bOrder = b.recommendation.routineStep ?? categoryOrder[b.product.category] * 10
    return aOrder - bOrder
  })
}

function matchesPeriod(item: ProductWithRecommendation, period: RoutinePeriod): boolean {
  const time = item.recommendation.recommendedTime
  return !time || time === 'BOTH' || time === period.toUpperCase()
}

export async function getTodayRoutineForUser(userId: string): Promise<TodayShelfRoutine> {
  const ownedRecommendations = await getTodayProductRecommendations(userId)
  const recommended = ownedRecommendations.filter(({ recommendation }) => recommendation.status === 'recommended')
  const available = ownedRecommendations.filter(({ recommendation }) => recommendation.status === 'available')

  const getPeriodRoutine = (period: RoutinePeriod) => {
    const recommendedForPeriod = sortByRoutineStep(recommended.filter((item) => matchesPeriod(item, period)))
    if (recommendedForPeriod.length > 0) {
      return { items: recommendedForPeriod, usedFallback: false }
    }

    return {
      items: sortByRoutineStep(available.filter((item) => matchesPeriod(item, period))),
      usedFallback: true,
    }
  }

  const am = getPeriodRoutine('am')
  const pm = getPeriodRoutine('pm')

  return {
    am: am.items,
    pm: pm.items,
    paused: sortByRoutineStep(
      ownedRecommendations.filter(({ recommendation }) => recommendation.status === 'pause'),
    ),
    shelfProductCount: ownedRecommendations.length,
    usedAvailableFallback: {
      am: am.usedFallback,
      pm: pm.usedFallback,
    },
  }
}
