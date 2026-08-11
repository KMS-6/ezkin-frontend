export type OnboardingStep = 1 | 2 | 3 | 4

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

export interface ConnectionSettings {
  lifeDataConnected: boolean
  weatherConnected: boolean
}

export interface OnboardingProfile extends ConnectionSettings {
  userId: string
  currentStep: OnboardingStep
  selectedConcerns: SkinConcern[]
  registeredProductIds: string[]
  completedAt?: string
}
