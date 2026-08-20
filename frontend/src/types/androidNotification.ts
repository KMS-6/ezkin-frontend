export type AndroidNotificationPermissionStatus =
  | 'prompt'
  | 'granted'
  | 'denied'
  | 'unsupported'

export type WaterChoice = 'under_3' | '3_to_5' | 'over_5'

export type WaterIntakeLevel =
  | 'under_3_glasses'
  | 'three_to_five_glasses'
  | 'over_5_glasses'

export type DietChoice = 'normal' | 'spicy' | 'late_night_meal'

export interface DailyManualMetricPayload {
  water_intake_level?: WaterIntakeLevel
  diet_flag?: DietChoice
}

export interface PendingQuickInputs {
  userId: string
  date: string
  createdAt: string
  waterChoice?: WaterChoice
  dietChoice?: DietChoice
}

export interface DailyQuickInput {
  userId: string
  date: string
  createdAt: string
  updatedAt: string
  waterChoice?: WaterChoice
  dietChoice?: DietChoice
}

export interface PendingNavigation {
  route?: string
}

export const QUICK_INPUT_SYNCED_EVENT = 'ezkin:quick-input-synced'
