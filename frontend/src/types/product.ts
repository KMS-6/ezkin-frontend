export type ProductCategory = 'cleanser' | 'toner' | 'serum' | 'cream' | 'sunscreen'

export interface Product {
  id: string
  name: string
  brand: string
  category: ProductCategory
  categoryLabel: string
  ingredients: string[]
  usage: string
}

export type ProductRecommendationStatus = 'recommended' | 'available' | 'pause'
export type RecommendedTime = 'AM' | 'PM' | 'BOTH'

export interface TodayProductRecommendation {
  productId: string
  status: ProductRecommendationStatus
  summary: string
  reason: string
  recommendedTime?: RecommendedTime
  routineStep?: number
  tomorrowNote?: string
}

export interface ProductWithRecommendation {
  product: Product
  recommendation: TodayProductRecommendation
}

export type RoutinePeriod = 'am' | 'pm'

export interface TodayShelfRoutine {
  am: ProductWithRecommendation[]
  pm: ProductWithRecommendation[]
  paused: ProductWithRecommendation[]
  shelfProductCount: number
  usedAvailableFallback: Record<RoutinePeriod, boolean>
}
