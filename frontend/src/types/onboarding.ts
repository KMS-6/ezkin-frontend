export type OnboardingStep = 1 | 2 | 3 | 4 | 5

export type Gender = 'female' | 'male' | 'other' | 'prefer_not_to_say'

export type HealthConcern =
  | 'irregular_sleep'
  | 'high_stress'
  | 'cycle_related'
  | 'allergy_sensitivity'
  | 'none'

export type SkinType = 'dry' | 'oily' | 'combination' | 'normal' | 'unknown'

export type SkinConcern =
  | 'breakouts'
  | 'dryness'
  | 'oiliness'
  | 'redness'
  | 'sensitivity'
  | 'texture'
  | 'dullness'

export interface ConcernOption {
  id: SkinConcern
  label: string
}

export interface BasicProfile {
  nickname?: string
  birthYear?: number
  gender: Gender | null
  healthConcerns: HealthConcern[]
}

export interface ConnectionSettings {
  lifeDataConnected: boolean
  weatherConnected: boolean
}

export interface OnboardingProfile extends ConnectionSettings, BasicProfile {
  userId: string
  currentStep: OnboardingStep
  onboardingVersion: 2
  skinType: SkinType
  selectedConcerns: SkinConcern[]
  registeredProductIds: string[]
  completedAt?: string
}
