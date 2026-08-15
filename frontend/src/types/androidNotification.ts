export type AndroidNotificationPermissionStatus =
  | 'prompt'
  | 'granted'
  | 'denied'
  | 'unsupported'

export type WaterChoice = 'under_3' | '3_to_5' | 'over_5'

export type NotificationDietChoice = 'clean' | 'normal' | 'stimulating'

export interface PendingQuickInputs {
  userId: string
  date: string
  createdAt: string
  waterChoice?: WaterChoice
  dietChoice?: NotificationDietChoice
}

export interface DailyQuickInput {
  userId: string
  date: string
  createdAt: string
  updatedAt: string
  waterChoice?: WaterChoice
  dietChoice?: NotificationDietChoice
}

export interface PendingNavigation {
  route?: string
}

export const QUICK_INPUT_SYNCED_EVENT = 'ezkin:quick-input-synced'
