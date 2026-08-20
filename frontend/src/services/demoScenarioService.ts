import { getMockPersona, getPersonaProfileSeed } from '../mocks/personas'
import type { User } from '../types/auth'
import type { DemoScenario, DemoScenarioOption, ExperienceMode } from '../types/demoScenario'
import type { OnboardingProfile } from '../types/onboarding'
import { activateLocalUser, getCurrentUser } from './authService'
import {
  clearActiveBackendToken,
  restoreNormalBackendIdentity,
} from './backendIdentityService'
import {
  createDefaultNormalUser,
  normalizeNormalUserIdentity,
} from './normalUserIdentityService'
import {
  clearDemoQuickInputs,
  getTodayQuickInput,
  saveDailyQuickInput,
} from './quickInputService'
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
export { NORMAL_USER_ID } from './normalUserIdentityService'
export const DEMO_LONG_TERM_USER_ID = 'persona_long_term_yeonseo'
export const SUBMISSION_DEMO_SCENARIO: DemoScenario = 'long_term'

export const demoScenarioOptions: DemoScenarioOption[] = [
  {
    id: 'long_term',
    label: '장기 사용자 데모',
    description: '30일 이상 사용한 사용자의 누적 분석 경험을 미리 확인합니다.',
    userId: DEMO_LONG_TERM_USER_ID,
    personaId: 'LONG_TERM',
  },
]

export function isDemoScenarioEnabled(
  value = import.meta.env.VITE_ENABLE_DEMO_SCENARIO,
): boolean {
  return value === 'true'
}

export function getStoredExperienceMode(): ExperienceMode {
  const saved = localStorage.getItem(DEMO_SCENARIO_KEY)
  if (saved === 'long_term' || saved === 'C' || saved === '30d') {
    localStorage.setItem(DEMO_SCENARIO_KEY, 'long_term')
    return 'long_term'
  }
  if (saved === 'normal') return 'normal'

  const initialMode: ExperienceMode = 'normal'
  localStorage.setItem(DEMO_SCENARIO_KEY, initialMode)
  return initialMode
}

export function getStoredDemoScenario(): DemoScenario | null {
  return getStoredExperienceMode() === 'long_term' ? 'long_term' : null
}

export function getActiveDemoScenario(): DemoScenario | null {
  return getStoredDemoScenario()
}

function isPersonaUserId(userId: string): boolean {
  return userId.startsWith('persona_')
}

function rememberNormalUser(user: User): void {
  if (isPersonaUserId(user.id)) return
  localStorage.setItem(NORMAL_USER_KEY, JSON.stringify(normalizeNormalUserIdentity(user)))
}

function getRememberedNormalUser(): User {
  const saved = localStorage.getItem(NORMAL_USER_KEY)
  if (saved) {
    try {
      const user = JSON.parse(saved) as User
      if (typeof user.id === 'string' && !isPersonaUserId(user.id)) {
        return normalizeNormalUserIdentity(user)
      }
    } catch {
      // Fall back to the stable local identity.
    }
  }

  return createDefaultNormalUser()
}

export async function activateNormalMode(): Promise<User> {
  localStorage.setItem(DEMO_SCENARIO_KEY, 'normal')
  const rememberedUser = getRememberedNormalUser()
  const profile = await getOnboardingProfile(rememberedUser.id)
  const user = {
    ...rememberedUser,
    nickname: profile.nickname ?? rememberedUser.nickname,
    onboardingCompleted: Boolean(profile.completedAt),
  }
  rememberNormalUser(user)
  const activatedUser = await activateLocalUser(user)
  restoreNormalBackendIdentity(user.id)
  return activatedUser
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
  if (!getTodayQuickInput(userId)) {
    await saveDailyQuickInput(userId, {
      waterChoice: '3_to_5',
      dietChoice: 'normal',
    })
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
  const currentUser = await getCurrentUser()
  if (currentUser && !isPersonaUserId(currentUser.id)) {
    rememberNormalUser(currentUser)
  }

  const option = getScenarioOption(scenario)
  const profile = await ensureDemoScenarioData(scenario, options)
  const user = await activateLocalUser({
    id: option.userId,
    email: `${option.personaId.toLowerCase()}@demo.ezkin`,
    nickname: profile.nickname,
    onboardingCompleted: Boolean(profile.completedAt),
  })

  clearActiveBackendToken()

  localStorage.setItem(DEMO_SCENARIO_KEY, scenario)
  return user
}

export async function resolveOnboardingCompletionTarget(
  currentUser: User,
): Promise<{ mode: ExperienceMode; user: User }> {
  localStorage.setItem(DEMO_SCENARIO_KEY, 'normal')
  rememberNormalUser(currentUser)
  return {
    mode: 'normal',
    user: currentUser,
  }
}

export async function resolveDemoScenarioEntryUser(
  currentUser: User | null,
): Promise<User | null> {
  if (getStoredExperienceMode() === 'long_term') {
    const expectedUserId = getScenarioOption(SUBMISSION_DEMO_SCENARIO).userId
    return currentUser?.id === expectedUserId && currentUser.onboardingCompleted
      ? currentUser
      : activateDemoScenario(SUBMISSION_DEMO_SCENARIO)
  }

  if (currentUser && !isPersonaUserId(currentUser.id)) rememberNormalUser(currentUser)
  return activateNormalMode()
}
