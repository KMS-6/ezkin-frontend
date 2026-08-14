import type {
  BasicProfile,
  ConnectionSettings,
  OnboardingProfile,
  OnboardingStep,
  SkinType,
  SkinConcern,
} from '../types/onboarding'
import { demo30DayProfileSeed } from '../mocks/onboarding'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'
const PROFILE_STORAGE_KEY = 'ezkin:onboarding-profiles'
const TOKEN_KEY = 'ezkin:access-token'
const DEMO_USER_ID = 'ezkin-demo-user'

type ProfileUpdate = Partial<Omit<OnboardingProfile, 'userId'>>
type StoredOnboardingProfile = Partial<OnboardingProfile> & { userId?: string }

function hasCompletedDemoSession(userId: string): boolean {
  if (userId !== DEMO_USER_ID) return false

  try {
    const savedSession = localStorage.getItem('ezkin:auth-session')
    if (!savedSession) return false
    const session = JSON.parse(savedSession) as { user?: { id?: string; onboardingCompleted?: boolean } }
    return session.user?.id === userId && session.user.onboardingCompleted === true
  } catch {
    return false
  }
}

function createDefaultProfile(
  userId: string,
  hasSavedProfile: boolean,
): OnboardingProfile {
  if (!hasSavedProfile && hasCompletedDemoSession(userId)) {
    return {
      userId,
      ...demo30DayProfileSeed,
    }
  }

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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) throw new Error('API 주소가 설정되지 않았어요.')

  const token = localStorage.getItem(TOKEN_KEY)
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) throw new Error('온보딩 정보를 저장하지 못했어요.')
  return response.json() as Promise<T>
}

async function saveProfileUpdate(userId: string, update: ProfileUpdate): Promise<OnboardingProfile> {
  if (USE_MOCK_API) return Promise.resolve(updateMockProfile(userId, update))

  return request<OnboardingProfile>('/users/me/onboarding', {
    method: 'PATCH',
    body: JSON.stringify(update),
  })
}

export async function getOnboardingProfile(userId: string): Promise<OnboardingProfile> {
  if (USE_MOCK_API) {
    return Promise.resolve(resolveMockProfile(userId, readMockProfiles()[userId]))
  }

  return request<OnboardingProfile>('/users/me/onboarding')
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
  return saveProfileUpdate(userId, settings)
}

export function completeOnboardingProfile(userId: string): Promise<OnboardingProfile> {
  return saveProfileUpdate(userId, {
    currentStep: 5,
    completedAt: new Date().toISOString(),
  })
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
