import { createServer } from 'vite'

class MemoryStorage {
  #values = new Map()

  get length() {
    return this.#values.size
  }

  clear() {
    this.#values.clear()
  }

  getItem(key) {
    return this.#values.get(key) ?? null
  }

  key(index) {
    return [...this.#values.keys()][index] ?? null
  }

  removeItem(key) {
    this.#values.delete(key)
  }

  setItem(key, value) {
    this.#values.set(key, String(value))
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const storage = new MemoryStorage()
Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true })
Object.defineProperty(globalThis, 'window', { value: globalThis, configurable: true })

const server = await createServer({
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true },
})

try {
  const auth = await server.ssrLoadModule('/src/services/authService.ts')
  const onboarding = await server.ssrLoadModule('/src/services/onboardingService.ts')

  const firstSignup = await auth.signup({
    email: ' NewUser1@EZKIN.app ',
    password: 'password123',
  })
  assert(firstSignup.user.email === 'newuser1@ezkin.app', 'signup email was not normalized')
  assert(firstSignup.user.onboardingCompleted === false, 'new user must start onboarding incomplete')
  assert(await auth.getCurrentUser(), 'session was not restored after signup')

  await auth.logout()
  assert(storage.getItem('ezkin:auth-session') === null, 'logout did not clear the session')
  assert(storage.getItem('ezkin:access-token') === null, 'logout did not clear the token')
  assert(storage.getItem('ezkin:mock-users')?.includes('newuser1@ezkin.app'), 'logout removed the user store')

  const firstLogin = await auth.login({
    email: 'NEWUSER1@ezkin.app',
    password: 'password123',
  })
  assert(firstLogin.user.id === firstSignup.user.id, 'signup user could not log in again')
  assert(firstLogin.user.onboardingCompleted === false, 'incomplete onboarding state was not retained')

  await auth.completeOnboarding()
  await onboarding.saveConcerns(firstSignup.user.id, ['dryness'])
  await onboarding.saveProducts(firstSignup.user.id, ['ceramide-cream'])
  await auth.logout()

  const completedLogin = await auth.login({
    email: 'newuser1@ezkin.app',
    password: 'password123',
  })
  assert(completedLogin.user.onboardingCompleted === true, 'completed onboarding state was not retained')
  assert((await auth.getCurrentUser())?.id === firstSignup.user.id, 'current user was not restored after refresh')

  await auth.logout()
  const secondSignup = await auth.signup({
    email: 'newuser2@ezkin.app',
    password: 'different456',
  })
  await onboarding.saveConcerns(secondSignup.user.id, ['sensitivity'])
  const secondProfile = await onboarding.getOnboardingProfile(secondSignup.user.id)
  const firstProfile = await onboarding.getOnboardingProfile(firstSignup.user.id)
  assert(secondProfile.selectedConcerns.includes('sensitivity'), 'user B profile was not saved')
  assert(!secondProfile.selectedConcerns.includes('dryness'), 'user A profile leaked into user B')
  assert(firstProfile.registeredProductIds.includes('ceramide-cream'), 'user A products were not retained')

  await auth.logout()
  const firstLoginAgain = await auth.login({
    email: 'newuser1@ezkin.app',
    password: 'password123',
  })
  assert(firstLoginAgain.user.id !== secondSignup.user.id, 'user A and B accounts were mixed')

  let invalidCredentialsRejected = false
  try {
    await auth.login({ email: 'newuser1@ezkin.app', password: 'wrong-password' })
  } catch (error) {
    invalidCredentialsRejected = error?.code === 'INVALID_CREDENTIALS'
  }
  assert(invalidCredentialsRejected, 'wrong password was not rejected')

  let duplicateRejected = false
  try {
    await auth.signup({ email: ' NEWUSER1@ezkin.app ', password: 'password123' })
  } catch (error) {
    duplicateRejected = error?.code === 'EMAIL_IN_USE'
  }
  assert(duplicateRejected, 'normalized duplicate email was not rejected')

  await auth.logout()
  const demoLogin = await auth.login({ email: 'demo@ezkin.app', password: 'ezkin1234' })
  assert(demoLogin.user.id === 'ezkin-demo-user', 'demo account login failed')

  console.log('PASS signup → logout → login')
  console.log('PASS incomplete/completed onboarding retention and session restore')
  console.log('PASS persistent users, demo login, duplicate and invalid-password handling')
  console.log('PASS user-specific onboarding and product data isolation')
} finally {
  await server.close()
}
