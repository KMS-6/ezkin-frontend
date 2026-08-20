import type { HealthAvailableMetrics } from '../types/healthConnection'

export function getAvailableHealthMetricLabels(metrics: HealthAvailableMetrics): string[] {
  return [
    metrics.sleep_hours ? '수면' : null,
    metrics.hrv_ms ? 'HRV' : null,
    metrics.active_energy_kcal ? '활동' : null,
  ].filter((label): label is string => Boolean(label))
}
