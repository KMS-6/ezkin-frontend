import type {
  BasicProfile,
  ConnectionSettings,
  OnboardingProfile,
  OnboardingStep,
  SkinType,
  SkinConcern,
} from '../types/onboarding'
import { ACCESS_TOKEN_STORAGE_KEY, apiRequest } from './apiClient'
import { isDemoPersonaUser } from '../utils/appDateTime'

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'
const USE_ONBOARDING_API = import.meta.env.VITE_USE_ONBOARDING_API === 'true'
const PROFILE_STORAGE_KEY = 'ezkin:onboarding-profiles'

function shouldSyncOnboarding(userId: string): boolean {
  const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
  const hasBackendIdentity = Boolean(token && !token.startsWith('mock-token-'))
  return !isDemoPersonaUser(userId)
    && hasBackendIdentity
    && (USE_ONBOARDING_API || !USE_MOCK_API)
}

type ProfileUpdate = Partial<Omit<OnboardingProfile, 'userId'>>
type StoredOnboardingProfile = Partial<OnboardingProfile> & { userId?: string }

function createDefaultProfile(
  userId: string,
  _hasSavedProfile: boolean,
): OnboardingProfile {
  return {
    userId,
    currentStep: 1,
    onboardingVersion: 2,
    gender: null,
    healthConcerns: [],
    skinType: 'unknown',
    selectedConcerns: [],
    registeredProductIds: [],
    lifeDataConnected: false,
    weatherConnected: false,
  }
}

function resolveStep(savedProfile: StoredOnboardingProfile | undefined, defaultStep: OnboardingStep): OnboardingStep {
  if (!savedProfile) return defaultStep
  if (savedProfile.completedAt) return 5
  if (savedProfile.onboardingVersion === 2) {
    const step = savedProfile.currentStep ?? defaultStep
    return Math.min(5, Math.max(1, step)) as OnboardingStep
  }

  const legacyStep = savedProfile.currentStep ?? 1
  if (legacyStep <= 1) return 1
  if (legacyStep === 2) return 3
  if (legacyStep === 3) return 4
  return 5
}

function resolveMockProfile(userId: string, savedProfile?: StoredOnboardingProfile): OnboardingProfile {
  const defaultProfile = createDefaultProfile(userId, Boolean(savedProfile))
  const resolved: OnboardingProfile = {
    ...defaultProfile,
    ...savedProfile,
    userId,
    currentStep: resolveStep(savedProfile, defaultProfile.currentStep),
    onboardingVersion: 2,
    nickname: savedProfile?.nickname?.trim() || defaultProfile.nickname,
    birthYear: savedProfile?.birthYear ?? defaultProfile.birthYear,
    gender: savedProfile?.gender ?? defaultProfile.gender,
    healthConcerns: Array.isArray(savedProfile?.healthConcerns)
      ? savedProfile.healthConcerns
      : defaultProfile.healthConcerns,
    skinType: savedProfile?.skinType ?? defaultProfile.skinType,
    selectedConcerns: Array.isArray(savedProfile?.selectedConcerns)
      ? savedProfile.selectedConcerns
      : defaultProfile.selectedConcerns,
    registeredProductIds: Array.isArray(savedProfile?.registeredProductIds)
      ? savedProfile.registeredProductIds
      : defaultProfile.registeredProductIds,
  }

  return resolved
}

function readMockProfiles(): Record<string, StoredOnboardingProfile> {
  const saved = localStorage.getItem(PROFILE_STORAGE_KEY)
  if (!saved) return {}

  try {
    return JSON.parse(saved) as Record<string, StoredOnboardingProfile>
  } catch {
    return {}
  }
}

function updateMockProfile(userId: string, update: ProfileUpdate): OnboardingProfile {
  const profiles = readMockProfiles()
  const profile = {
    ...resolveMockProfile(userId, profiles[userId]),
    ...update,
    userId,
  }
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ ...profiles, [userId]: profile }))
  return profile
}

async function saveProfileUpdate(userId: string, update: ProfileUpdate): Promise<OnboardingProfile> {
  return Promise.resolve(updateMockProfile(userId, update))
}

export async function getOnboardingProfile(userId: string): Promise<OnboardingProfile> {
  return Promise.resolve(resolveMockProfile(userId, readMockProfiles()[userId]))
}

export function saveCurrentStep(userId: string, currentStep: OnboardingStep): Promise<OnboardingProfile> {
  return saveProfileUpdate(userId, { currentStep })
}

export function saveBasicProfile(
  userId: string,
  profile: Partial<BasicProfile>,
): Promise<OnboardingProfile> {
  return saveProfileUpdate(userId, profile)
}

export function saveSkinType(userId: string, skinType: SkinType): Promise<OnboardingProfile> {
  return saveProfileUpdate(userId, { skinType })
}

export function saveConcerns(userId: string, selectedConcerns: SkinConcern[]): Promise<OnboardingProfile> {
  return saveProfileUpdate(userId, { selectedConcerns })
}

export function saveProducts(userId: string, registeredProductIds: string[]): Promise<OnboardingProfile> {
  return saveProfileUpdate(userId, { registeredProductIds })
}

export function saveConnectionSettings(
  userId: string,
  settings: ConnectionSettings,
): Promise<OnboardingProfile> {
  return saveProfileUpdate(userId, settings).then(async (profile) => {
    if (shouldSyncOnboarding(userId)) {
      await Promise.all([
        apiRequest('/consents/apple_health', {
          method: 'PUT',
          body: JSON.stringify({ consented: settings.lifeDataConnected }),
        }, { personaId: userId }),
        apiRequest('/consents/weather_location', {
          method: 'PUT',
          body: JSON.stringify({ consented: settings.weatherConnected }),
        }, { personaId: userId }),
      ])
    }
    return profile
  })
}

export async function completeOnboardingProfile(userId: string): Promise<OnboardingProfile> {
  const profile = await saveProfileUpdate(userId, {
    currentStep: 5,
    completedAt: new Date().toISOString(),
  })
  if (shouldSyncOnboarding(userId)) {
    const concernMap: Partial<Record<SkinConcern, string>> = {
      breakouts: 'cn_acne',
      oiliness: 'cn_oily_tzone',
      dryness: 'cn_dryness',
    }
    const sync = apiRequest('/onboarding/profile', {
      method: 'POST',
      body: JSON.stringify({
        skin_concern_ids: profile.selectedConcerns
          .map((concern) => concernMap[concern])
          .filter((concern): concern is string => Boolean(concern)),
        birth_year: profile.birthYear ?? null,
        menstrual_cycle_tracking: profile.healthConcerns.includes('cycle_related'),
      }),
    }, { personaId: userId })
    if (isDemoPersonaUser(userId)) await sync.catch(() => undefined)
    else await sync
  }
  return profile
}

export function resetDemoOnboardingProfile(userId: string): Promise<void> {
  if (!USE_MOCK_API) {
    return Promise.reject(new Error('Demo 초기화는 Mock 환경에서만 사용할 수 있어요.'))
  }

  const profiles = readMockProfiles()
  if (!(userId in profiles)) return Promise.resolve()

  const nextProfiles = { ...profiles }
  delete nextProfiles[userId]
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfiles))
  return Promise.resolve()
}
