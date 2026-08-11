import type {
  ConnectionSettings,
  OnboardingProfile,
  OnboardingStep,
  SkinConcern,
} from '../types/onboarding'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'
const PROFILE_STORAGE_KEY = 'ezkin:onboarding-profiles'
const TOKEN_KEY = 'ezkin:access-token'
const DEMO_USER_ID = 'ezkin-demo-user'

type ProfileUpdate = Partial<Omit<OnboardingProfile, 'userId'>>

function createDefaultProfile(userId: string): OnboardingProfile {
  if (userId === DEMO_USER_ID) {
    return {
      userId,
      currentStep: 4,
      selectedConcerns: ['dryness', 'sensitivity'],
      registeredProductIds: [
        'calming-toner',
        'hyaluronic-serum',
        'ceramide-cream',
        'retinol-serum',
        'spf50-sunscreen',
      ],
      lifeDataConnected: true,
      weatherConnected: true,
      completedAt: '2026-07-12T00:00:00.000Z',
    }
  }

  return {
    userId,
    currentStep: 1,
    selectedConcerns: [],
    registeredProductIds: [],
    lifeDataConnected: false,
    weatherConnected: false,
  }
}

function resolveMockProfile(userId: string, savedProfile?: OnboardingProfile): OnboardingProfile {
  const defaultProfile = createDefaultProfile(userId)
  if (!savedProfile || userId !== DEMO_USER_ID) return savedProfile ?? defaultProfile

  return {
    ...defaultProfile,
    ...savedProfile,
    currentStep: 4,
    selectedConcerns: savedProfile.selectedConcerns.length > 0
      ? savedProfile.selectedConcerns
      : defaultProfile.selectedConcerns,
    registeredProductIds: savedProfile.registeredProductIds.length > 0
      ? savedProfile.registeredProductIds
      : defaultProfile.registeredProductIds,
    lifeDataConnected: savedProfile.completedAt
      ? savedProfile.lifeDataConnected
      : defaultProfile.lifeDataConnected,
    weatherConnected: savedProfile.completedAt
      ? savedProfile.weatherConnected
      : defaultProfile.weatherConnected,
    completedAt: savedProfile.completedAt ?? defaultProfile.completedAt,
  }
}

function readMockProfiles(): Record<string, OnboardingProfile> {
  const saved = localStorage.getItem(PROFILE_STORAGE_KEY)
  if (!saved) return {}

  try {
    return JSON.parse(saved) as Record<string, OnboardingProfile>
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
    currentStep: 4,
    completedAt: new Date().toISOString(),
  })
}
