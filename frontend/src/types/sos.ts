import type {
  Gender,
  HealthConcern,
  SkinConcern,
  SkinType,
} from './onboarding'
import type { ProductCategory, ProductRecommendationStatus } from './product'
import type { QuickCareSafetyAction } from './quickCare'

export type SOSMessageRole = 'user' | 'assistant'
export type SOSSafetyLevel = 'normal' | 'caution' | 'urgent'

export interface SOSMessage {
  id: string
  role: SOSMessageRole
  content: string
  createdAt: string
}

export interface SOSContext {
  userId: string
  userProfile?: {
    nickname?: string
    birthYear?: number
    gender?: Gender | null
    skinType?: SkinType
    selectedConcerns?: SkinConcern[]
    healthConcerns?: HealthConcern[]
  }
  today?: {
    skinStatus?: string
    sleep?: string
    humidity?: string
    uv?: string
    temperature?: number
    foodChoice?: string
  }
  products?: Array<{
    id: string
    name: string
    category: ProductCategory
    recommendationStatus?: ProductRecommendationStatus
  }>
  latestScan?: {
    overallStatus?: string
    observedAreas?: string[]
    summary?: string
  }
}

export interface SendSOSMessageRequest {
  message: string
  context: SOSContext
}

export interface SendSOSMessageResponse {
  message: string
  safetyLevel?: SOSSafetyLevel
  safetyGateAction?: QuickCareSafetyAction
  professionalHelpSuggested?: boolean
}
