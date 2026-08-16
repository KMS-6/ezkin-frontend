import { getMockPersona, getPersonaProfileSeed } from '../mocks/personas'
import type { User } from '../types/auth'
import type { DemoScenario, DemoScenarioOption } from '../types/demoScenario'
import type { OnboardingProfile } from '../types/onboarding'
import { activateLocalUser, getCurrentUser } from './authService'
import { clearDemoQuickInputs } from './quickInputService'
import {
  clearRecentTriggerAnalysisReference,
  rememberTriggerAnalysisReference,
} from './skinScanService'
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
const NORMAL_USER_KEY = 'ezkin:normal-user'
export const NORMAL_USER_ID = 'ezkin-demo-user'
export const DEMO_A_USER_ID = 'persona_a1_seoyeon'
export const DEMO_B_USER_ID = 'persona_b1_eunji'
export const DEMO_C_USER_ID = 'persona_c1_minjun'

export const demoScenarioOptions: DemoScenarioOption[] = [
  { id: 'A', label: '워치 없음 · 첫 사용', userId: DEMO_A_USER_ID, personaId: 'A1' },
  { id: 'B', label: '워치 연결 · 첫 사용', userId: DEMO_B_USER_ID, personaId: 'B1' },
  { id: 'C', label: '워치 연결 · 장기 사용', userId: DEMO_C_USER_ID, personaId: 'C1' },
]

export function isDemoScenarioEnabled(
  value = import.meta.env.VITE_ENABLE_DEMO_SCENARIO,
): boolean {
  return value === 'true'
}

export function getStoredDemoScenario(): DemoScenario | null {
  const saved = localStorage.getItem(DEMO_SCENARIO_KEY)
  const scenario = saved === 'A' || saved === 'B' || saved === 'C'
    ? saved
    : saved === 'first'
      ? 'A'
      : saved === '30d'
        ? 'C'
        : null
  if (scenario) localStorage.setItem(DEMO_SCENARIO_KEY, scenario)
  return scenario
}

export function getActiveDemoScenario(userId: string): DemoScenario | null {
  if (userId === DEMO_A_USER_ID) return 'A'
  if (userId === DEMO_B_USER_ID) return 'B'
  if (userId === DEMO_C_USER_ID) return 'C'
  return null
}

function isPersonaUserId(userId: string): boolean {
  return userId === DEMO_A_USER_ID || userId === DEMO_B_USER_ID || userId === DEMO_C_USER_ID
}

function rememberNormalUser(user: User): void {
  if (isPersonaUserId(user.id)) return
  localStorage.setItem(NORMAL_USER_KEY, JSON.stringify(user))
}

function getRememberedNormalUser(): User {
  const saved = localStorage.getItem(NORMAL_USER_KEY)
  if (saved) {
    try {
      const user = JSON.parse(saved) as User
      if (typeof user.id === 'string' && !isPersonaUserId(user.id)) return user
    } catch {
      // Fall back to the stable local identity.
    }
  }

  return {
    id: NORMAL_USER_ID,
    email: 'local@ezkin.app',
    onboardingCompleted: false,
  }
}

export async function activateNormalMode(): Promise<User> {
  localStorage.removeItem(DEMO_SCENARIO_KEY)
  const rememberedUser = getRememberedNormalUser()
  const profile = await getOnboardingProfile(rememberedUser.id)
  const user = {
    ...rememberedUser,
    nickname: profile.nickname ?? rememberedUser.nickname,
    onboardingCompleted: Boolean(profile.completedAt),
  }
  rememberNormalUser(user)
  return activateLocalUser(user)
}

function getScenarioOption(scenario: DemoScenario): DemoScenarioOption {
  return demoScenarioOptions.find((option) => option.id === scenario) ?? demoScenarioOptions[0]
}

async function seedPersonaProfile(userId: string, reset = false): Promise<OnboardingProfile> {
  const persona = getMockPersona(userId)
  if (!persona) throw new Error('Demo persona를 찾지 못했어요.')

  if (reset) {
    await resetDemoOnboardingProfile(userId)
    clearDemoQuickInputs(userId)
    clearRecentTriggerAnalysisReference(userId)
  }

  const profile = await getOnboardingProfile(userId)
  if (!profile.completedAt || reset) {
    const seed = getPersonaProfileSeed(persona)
    await saveBasicProfile(userId, {
      nickname: seed.nickname,
      birthYear: seed.birthYear,
      gender: seed.gender,
      healthConcerns: seed.healthConcerns,
    })
    await saveSkinType(userId, seed.skinType)
    await saveConcerns(userId, seed.selectedConcerns)
    await saveProducts(userId, seed.registeredProductIds)
    await saveConnectionSettings(userId, {
      lifeDataConnected: seed.lifeDataConnected,
      weatherConnected: seed.weatherConnected,
    })
    await completeOnboardingProfile(userId)
  }

  if (persona.pattern_analysis) {
    rememberTriggerAnalysisReference(userId, {
      scanId: persona.pattern_analysis.scan_id,
      capturedAt: persona.skin_scan.captured_at,
    })
  } else {
    clearRecentTriggerAnalysisReference(userId)
  }
  return getOnboardingProfile(userId)
}

export async function ensureDemoScenarioData(
  scenario: DemoScenario,
  options: { reset?: boolean } = {},
): Promise<OnboardingProfile> {
  return seedPersonaProfile(getScenarioOption(scenario).userId, Boolean(options.reset))
}

export async function activateDemoScenario(
  scenario: DemoScenario,
  options: { reset?: boolean } = {},
): Promise<User> {
  if (!isDemoScenarioEnabled()) {
    throw new Error('Demo 시나리오가 비활성화되어 있어요.')
  }

  const currentUser = await getCurrentUser()
  if (currentUser) rememberNormalUser(currentUser)

  const option = getScenarioOption(scenario)
  const profile = await ensureDemoScenarioData(scenario, options)
  const user = await activateLocalUser({
    id: option.userId,
    email: `${option.personaId.toLowerCase()}@demo.ezkin`,
    nickname: profile.nickname,
    onboardingCompleted: Boolean(profile.completedAt),
  })

  localStorage.setItem(DEMO_SCENARIO_KEY, scenario)
  return user
}

export async function resolveDemoScenarioEntryUser(
  currentUser: User | null,
): Promise<User | null> {
  if (!isDemoScenarioEnabled()) {
    return currentUser && !isPersonaUserId(currentUser.id) ? currentUser : activateNormalMode()
  }

  const storedScenario = getStoredDemoScenario()
  if (storedScenario) {
    const expectedUserId = getScenarioOption(storedScenario).userId
    const canReuseCurrentUser = currentUser?.id === expectedUserId && currentUser.onboardingCompleted
    return canReuseCurrentUser ? currentUser : activateDemoScenario(storedScenario)
  }

  const activeScenario = currentUser ? getActiveDemoScenario(currentUser.id) : null
  if (activeScenario) {
    localStorage.setItem(DEMO_SCENARIO_KEY, activeScenario)
    return currentUser
  }

  if (currentUser && !isPersonaUserId(currentUser.id)) {
    rememberNormalUser(currentUser)
    return currentUser
  }
  return activateNormalMode()
}
