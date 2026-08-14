import { demo30DayProfileSeed } from '../mocks/onboarding'
import type { User } from '../types/auth'
import type { DemoScenario, DemoScenarioOption } from '../types/demoScenario'
import type { OnboardingProfile } from '../types/onboarding'
import { activateDemoUser } from './authService'
import { clearDemoDietChoice } from './briefingService'
import {
  completeOnboardingProfile,
  getOnboardingProfile,
  resetDemoOnboardingProfile,
  saveBasicProfile,
  saveConcerns,
  saveConnectionSettings,
  saveProducts,
  saveSkinType,
} from './onboardingService'

const DEMO_SCENARIO_KEY = 'ezkin:demo-scenario'
export const DEMO_FIRST_USER_ID = 'ezkin-demo-first'
export const DEMO_30D_USER_ID = 'ezkin-demo-user'

export const demoScenarioOptions: DemoScenarioOption[] = [
  { id: 'first', label: '처음 시작', userId: DEMO_FIRST_USER_ID },
  { id: '30d', label: '30일 사용', userId: DEMO_30D_USER_ID },
]

export function isDemoScenarioEnabled(
  value = import.meta.env.VITE_ENABLE_DEMO_SCENARIO,
): boolean {
  return value !== 'false'
}

export function getStoredDemoScenario(): DemoScenario | null {
  const saved = localStorage.getItem(DEMO_SCENARIO_KEY)
  return saved === 'first' || saved === '30d' ? saved : null
}

export function getActiveDemoScenario(userId: string): DemoScenario | null {
  if (userId === DEMO_FIRST_USER_ID) return 'first'
  if (userId === DEMO_30D_USER_ID) return '30d'
  return getStoredDemoScenario()
}

function getScenarioOption(scenario: DemoScenario): DemoScenarioOption {
  return demoScenarioOptions.find((option) => option.id === scenario) ?? demoScenarioOptions[0]
}

async function ensureFirstScenarioData(reset = false): Promise<OnboardingProfile> {
  if (reset) {
    await resetDemoOnboardingProfile(DEMO_FIRST_USER_ID)
    clearDemoDietChoice(DEMO_FIRST_USER_ID)
  }
  return getOnboardingProfile(DEMO_FIRST_USER_ID)
}

async function ensure30DayScenarioData(): Promise<OnboardingProfile> {
  const profile = await getOnboardingProfile(DEMO_30D_USER_ID)
  if (profile.completedAt) return profile

  await saveBasicProfile(DEMO_30D_USER_ID, {
    nickname: profile.nickname ?? demo30DayProfileSeed.nickname,
    birthYear: profile.birthYear ?? demo30DayProfileSeed.birthYear,
    gender: profile.gender ?? demo30DayProfileSeed.gender,
    healthConcerns: profile.healthConcerns.length > 0
      ? profile.healthConcerns
      : demo30DayProfileSeed.healthConcerns,
  })
  await saveSkinType(
    DEMO_30D_USER_ID,
    profile.skinType === 'unknown' ? demo30DayProfileSeed.skinType : profile.skinType,
  )
  await saveConcerns(
    DEMO_30D_USER_ID,
    profile.selectedConcerns.length > 0
      ? profile.selectedConcerns
      : demo30DayProfileSeed.selectedConcerns,
  )
  await saveProducts(DEMO_30D_USER_ID, [
    ...new Set([...profile.registeredProductIds, ...demo30DayProfileSeed.registeredProductIds]),
  ])
  await saveConnectionSettings(DEMO_30D_USER_ID, {
    lifeDataConnected: true,
    weatherConnected: true,
  })
  await completeOnboardingProfile(DEMO_30D_USER_ID)
  return getOnboardingProfile(DEMO_30D_USER_ID)
}

export async function ensureDemoScenarioData(
  scenario: DemoScenario,
  options: { resetFirst?: boolean } = {},
): Promise<OnboardingProfile> {
  return scenario === 'first'
    ? ensureFirstScenarioData(Boolean(options.resetFirst))
    : ensure30DayScenarioData()
}

export async function activateDemoScenario(
  scenario: DemoScenario,
  options: { resetFirst?: boolean } = {},
): Promise<User> {
  if (!isDemoScenarioEnabled()) {
    throw new Error('Demo 시나리오가 비활성화되어 있어요.')
  }

  const option = getScenarioOption(scenario)
  const profile = await ensureDemoScenarioData(scenario, options)
  const user = await activateDemoUser({
    id: option.userId,
    email: scenario === 'first' ? 'first@demo.ezkin' : 'demo@ezkin.app',
    nickname: profile.nickname ?? (scenario === 'first' ? '처음 사용자' : 'EZkin'),
    onboardingCompleted: Boolean(profile.completedAt),
  })

  localStorage.setItem(DEMO_SCENARIO_KEY, scenario)
  return user
}

export async function resolveDemoScenarioEntryUser(
  currentUser: User | null,
): Promise<User | null> {
  if (!isDemoScenarioEnabled()) return currentUser

  const storedScenario = getStoredDemoScenario()
  if (storedScenario) {
    const expectedUserId = getScenarioOption(storedScenario).userId
    const canReuseCurrentUser = currentUser?.id === expectedUserId
      && (storedScenario === 'first' || currentUser.onboardingCompleted)
    return canReuseCurrentUser ? currentUser : activateDemoScenario(storedScenario)
  }

  if (!currentUser) return activateDemoScenario('first')
  if (currentUser.id === DEMO_FIRST_USER_ID) {
    localStorage.setItem(DEMO_SCENARIO_KEY, 'first')
    return currentUser
  }
  if (currentUser.id !== DEMO_30D_USER_ID) return currentUser

  const profile = await getOnboardingProfile(DEMO_30D_USER_ID)
  const inferredScenario: DemoScenario = profile.completedAt ? '30d' : 'first'
  return activateDemoScenario(inferredScenario)
}
