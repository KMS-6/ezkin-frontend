import { isDemoPersonaUser } from '../utils/appDateTime'

export type PersonaOnlyFeature = 'briefing' | 'skinScan' | 'analysis'

export class FeatureUnavailableError extends Error {
  readonly feature: PersonaOnlyFeature

  constructor(feature: PersonaOnlyFeature) {
    super('현재 일반 사용자 기능을 준비 중이에요.')
    this.name = 'FeatureUnavailableError'
    this.feature = feature
  }
}

export function isBriefingAvailableForUser(userId?: string): boolean {
  return isDemoPersonaUser(userId)
}

export function isSkinScanAvailableForUser(userId?: string): boolean {
  return Boolean(userId)
}

export function isAnalysisAvailableForUser(userId?: string): boolean {
  return isDemoPersonaUser(userId)
}

export function requireFeatureAvailable(
  feature: PersonaOnlyFeature,
  userId?: string,
): void {
  const available = feature === 'briefing'
    ? isBriefingAvailableForUser(userId)
    : feature === 'skinScan'
      ? isSkinScanAvailableForUser(userId)
      : isAnalysisAvailableForUser(userId)
  if (!available) throw new FeatureUnavailableError(feature)
}
