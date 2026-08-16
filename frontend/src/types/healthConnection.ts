export type HealthPermissionStatus =
  | 'not_requested'
  | 'requesting'
  | 'connected'
  | 'limited'
  | 'denied'
  | 'unavailable'

export interface HealthAvailableMetrics {
  sleep_hours: boolean
  hrv_ms: boolean
  active_energy_kcal: boolean
}

export interface HealthConnection {
  provider: 'apple_health' | 'demo'
  status: HealthPermissionStatus
  connectedAt?: string
  availableMetrics: HealthAvailableMetrics
}

export interface HealthDataSnapshot {
  collectedAt: string
  sleep_hours?: number
  hrv_ms?: number
  active_energy_kcal?: number
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
