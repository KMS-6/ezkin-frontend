import { productCatalog } from '../mocks/products'
import { todayProductRecommendations } from '../mocks/productRecommendations'
import { getMockPersona } from '../mocks/personas'
import { isDemoPersonaUser } from '../utils/appDateTime'
import type {
  Product,
  ProductWithRecommendation,
  RoutinePeriod,
  TodayShelfRoutine,
  TodayProductRecommendation,
} from '../types/product'
import { getOnboardingProfile, saveProducts } from './onboardingService'
import { apiRequest } from './apiClient'
import { hasNormalBackendIdentity } from './backendIdentityService'

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'
const USE_SHELF_API = import.meta.env.VITE_USE_SHELF_API === 'true'

interface BackendShelfProduct {
  id: string
  brand: string
  product_name: string
  product_type: string
  ingredients_raw: string[] | null
}

const liveProductsById = new Map<string, Product>()

function shouldUseLiveShelf(userId: string): boolean {
  return !isDemoPersonaUser(userId) && (USE_SHELF_API || !USE_MOCK_API)
}

function normalizeCategory(value: string): Product['category'] {
  if (value === 'moisturizer' || value === 'mask') return 'cream'
  if (value === 'cleanser' || value === 'toner' || value === 'serum' || value === 'sunscreen') return value
  return 'cream'
}

function backendProductToProduct(product: BackendShelfProduct): Product {
  const category = normalizeCategory(product.product_type)
  const labels: Record<Product['category'], string> = {
    cleanser: '클렌저', toner: '토너', serum: '세럼', cream: '크림', sunscreen: '선크림',
  }
  return {
    id: product.id,
    name: product.product_name,
    brand: product.brand,
    category,
    categoryLabel: labels[category],
    ingredients: product.ingredients_raw ?? [],
    usage: '제품 표시사항에 따라 사용해주세요.',
  }
}

function rememberLiveProducts(products: Product[]): Product[] {
  products.forEach((product) => liveProductsById.set(product.id, product))
  return products
}

function productToBackendCreate(product: Product) {
  return {
    brand: product.brand,
    product_name: product.name,
    product_type: product.category === 'cream' ? 'moisturizer' : product.category,
    ingredients_raw: product.ingredients,
    registration_source: 'manual',
  }
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
  // Backend에는 아직 사용자용 전체 제품 검색 Catalog API가 없어 기본 Catalog를 사용합니다.
  return Promise.resolve(productCatalog)
}

export async function getMyProducts(userId: string): Promise<Product[]> {
  const profile = await getOnboardingProfile(userId)
  const localProducts = productCatalog.filter((product) => profile.registeredProductIds.includes(product.id))
  if (shouldUseLiveShelf(userId)) {
    if (!hasNormalBackendIdentity(userId)) return localProducts
    try {
      const response = await apiRequest<{ items: BackendShelfProduct[] }>('/shelf/products')
      return rememberLiveProducts(response.items.map(backendProductToProduct))
    } catch {
      return localProducts
    }
  }
  return localProducts
}

export async function addMyProducts(userId: string, productIds: string[]): Promise<Product[]> {
  const profile = await getOnboardingProfile(userId)
  const registeredProductIds = [...new Set([...profile.registeredProductIds, ...productIds])]
  await saveProducts(userId, registeredProductIds)
  const localProducts = productCatalog.filter((product) => registeredProductIds.includes(product.id))
  if (shouldUseLiveShelf(userId)) {
    if (!hasNormalBackendIdentity(userId)) return localProducts
    const selected = productCatalog.filter((product) => productIds.includes(product.id))
    try {
      await Promise.all(selected.map((product) => apiRequest('/shelf/products', {
          method: 'POST',
          body: JSON.stringify(productToBackendCreate(product)),
        })))
      return getMyProducts(userId)
    } catch {
      return localProducts
    }
  }
  return localProducts
}

export async function syncPendingMyProducts(userId: string, productIds: string[]): Promise<Product[]> {
  if (!shouldUseLiveShelf(userId) || !hasNormalBackendIdentity(userId) || productIds.length === 0) {
    return getMyProducts(userId)
  }

  const existing = await getMyProducts(userId)
  const existingKeys = new Set(existing.map((product) => `${product.brand}\u0000${product.name}`))
  const missingIds = productCatalog
    .filter((product) => productIds.includes(product.id))
    .filter((product) => !existingKeys.has(`${product.brand}\u0000${product.name}`))
    .map((product) => product.id)
  if (missingIds.length === 0) return existing
  return addMyProducts(userId, missingIds)
}

export async function getProductDetail(productId: string): Promise<Product | null> {
  const cached = liveProductsById.get(productId)
  if (cached) return cached
  const catalogProduct = productCatalog.find((product) => product.id === productId)
  if (catalogProduct) return catalogProduct
  if (USE_SHELF_API || !USE_MOCK_API) {
    try {
      return backendProductToProduct(await apiRequest<BackendShelfProduct>(`/shelf/products/${productId}`))
    } catch {
      return null
    }
  }

  return null
}

export async function getTodayProductRecommendations(
  userId: string,
): Promise<ProductWithRecommendation[]> {
  const products = await getMyProducts(userId)
  const persona = getMockPersona(userId)
  const usesLiveShelf = shouldUseLiveShelf(userId)
  let recommendations: TodayProductRecommendation[]
  if (usesLiveShelf) {
    recommendations = products.map((product) => getMockRecommendation(product.id))
  } else {
    recommendations = persona?.product_recommendations ?? todayProductRecommendations
  }

  return products.map((product) => {
    const recommendation = recommendations.find((item) => item.productId === product.id)
    if (!recommendation && usesLiveShelf) {
      throw new Error('제품 추천 응답이 완전하지 않아요.')
    }

    return {
      product,
      recommendation: recommendation ?? (persona ? {
        productId: product.id,
        status: 'available',
        summary: '오늘 안내에 포함되지 않았어요.',
        reason: '현재 브리핑에서 별도 사용 안내가 없는 제품이에요.',
        recommendedTime: 'BOTH',
      } : getMockRecommendation(product.id)),
    }
  })
}

const categoryOrder: Record<Product['category'], number> = {
  cleanser: 0,
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
