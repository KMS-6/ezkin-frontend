export type HealthPermissionStatus =
  | 'not_requested'
  | 'requesting'
  | 'connected'
  | 'limited'
  | 'denied'
  | 'unavailable'

export interface HealthAvailableMetrics {
  sleep: boolean
  steps: boolean
  hrv: boolean
  activity: boolean
  cycle?: boolean
  skinTemperature?: boolean
}

export interface HealthConnection {
  provider: 'apple_health' | 'demo'
  status: HealthPermissionStatus
  connectedAt?: string
  availableMetrics: HealthAvailableMetrics
}

export interface HealthDataSnapshot {
  collectedAt: string
  sleep?: {
    durationMinutes: number
  }
  steps?: number
  hrv?: number
  activityMinutes?: number
  cyclePhase?: string
  skinTemperature?: number
}

/**
 * Future iOS boundary. The React web app does not implement this interface.
 * Apple Health -> Native connector -> Backend 1 -> EZkin frontend.
 */
export interface NativeHealthConnector {
  isAvailable(): Promise<boolean>
  requestAuthorization(): Promise<HealthConnection>
  getLatestSnapshot(): Promise<HealthDataSnapshot>
}
