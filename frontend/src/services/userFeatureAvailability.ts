import { isDemoPersonaUser } from '../utils/appDateTime'

export type PersonaOnlyFeature = 'briefing' | 'skinScan' | 'analysis'

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'
const USE_BRIEFING_API = import.meta.env.VITE_USE_BRIEFING_API === 'true'
const USE_SKIN_SCAN_API = import.meta.env.VITE_USE_SKIN_SCAN_API === 'true'
const USE_ANALYSIS_API = import.meta.env.VITE_USE_ANALYSIS_API === 'true'

export class FeatureUnavailableError extends Error {
  readonly feature: PersonaOnlyFeature

  constructor(feature: PersonaOnlyFeature) {
    super('현재 일반 사용자 기능을 준비 중이에요.')
    this.name = 'FeatureUnavailableError'
    this.feature = feature
  }
}

export function isBriefingAvailableForUser(userId?: string): boolean {
  return Boolean(userId && (
    isDemoPersonaUser(userId)
    || USE_BRIEFING_API
    || !USE_MOCK_API
  ))
}

export function isSkinScanAvailableForUser(userId?: string): boolean {
  return Boolean(userId && (
    isDemoPersonaUser(userId)
    || USE_SKIN_SCAN_API
    || !USE_MOCK_API
  ))
}

export function isAnalysisAvailableForUser(userId?: string): boolean {
  return Boolean(userId && (
    isDemoPersonaUser(userId)
    || USE_ANALYSIS_API
    || !USE_MOCK_API
  ))
}

export function requireFeatureAvailable(
  feature: PersonaOnlyFeature,
  userId?: string,
): asserts userId is string {
  const available = feature === 'briefing'
    ? isBriefingAvailableForUser(userId)
    : feature === 'skinScan'
      ? isSkinScanAvailableForUser(userId)
      : isAnalysisAvailableForUser(userId)
  if (!available) throw new FeatureUnavailableError(feature)
}
