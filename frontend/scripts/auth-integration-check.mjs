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
  const products = await server.ssrLoadModule('/src/services/productService.ts')
  const briefing = await server.ssrLoadModule('/src/services/briefingService.ts')
  const healthConnection = await server.ssrLoadModule('/src/services/healthConnectionService.ts')
  const lifeLog = await server.ssrLoadModule('/src/services/lifeLogService.ts')
  const skinScan = await server.ssrLoadModule('/src/services/skinScanService.ts')
  const productRecognition = await server.ssrLoadModule('/src/services/productRecognitionService.ts')
  const sosContext = await server.ssrLoadModule('/src/services/sosContextService.ts')
  const sos = await server.ssrLoadModule('/src/services/sosService.ts')

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

  await onboarding.saveCurrentStep(firstSignup.user.id, 2)
  await onboarding.saveBasicProfile(firstSignup.user.id, {
    nickname: '은지',
    birthYear: 2002,
    gender: 'female',
    healthConcerns: ['irregular_sleep', 'high_stress'],
  })
  await onboarding.saveCurrentStep(firstSignup.user.id, 3)
  await onboarding.saveSkinType(firstSignup.user.id, 'combination')
  await onboarding.saveConcerns(firstSignup.user.id, ['dryness'])
  const resumedProfile = await onboarding.getOnboardingProfile(firstSignup.user.id)
  assert(resumedProfile.currentStep === 3, 'onboarding did not resume at the saved step')
  assert(resumedProfile.nickname === '은지', 'profile input was not retained on resume')
  assert(resumedProfile.skinType === 'combination', 'skin baseline was not retained on resume')

  await onboarding.saveCurrentStep(firstSignup.user.id, 4)
  await products.addMyProducts(firstSignup.user.id, ['ceramide-cream'])
  await onboarding.saveCurrentStep(firstSignup.user.id, 5)
  await onboarding.saveConnectionSettings(firstSignup.user.id, {
    lifeDataConnected: true,
    weatherConnected: false,
  })
  await onboarding.completeOnboardingProfile(firstSignup.user.id)
  await auth.completeOnboarding()
  await auth.logout()

  const completedLogin = await auth.login({
    email: 'newuser1@ezkin.app',
    password: 'password123',
  })
  assert(completedLogin.user.onboardingCompleted === true, 'completed onboarding state was not retained')
  assert((await auth.getCurrentUser())?.id === firstSignup.user.id, 'current user was not restored after refresh')
  await briefing.saveDietChoice(firstSignup.user.id, 'spicy')
  assert(briefing.getSavedDietChoice(firstSignup.user.id) === 'spicy', 'user A diet choice was not saved')

  await auth.logout()
  const secondSignup = await auth.signup({
    email: 'newuser2@ezkin.app',
    password: 'different456',
  })
  await onboarding.saveCurrentStep(secondSignup.user.id, 2)
  await onboarding.saveBasicProfile(secondSignup.user.id, {
    nickname: '민지',
    healthConcerns: [],
  })
  await onboarding.saveCurrentStep(secondSignup.user.id, 3)
  await onboarding.saveSkinType(secondSignup.user.id, 'unknown')
  await onboarding.saveConcerns(secondSignup.user.id, ['sensitivity'])
  const secondProfile = await onboarding.getOnboardingProfile(secondSignup.user.id)
  const firstProfile = await onboarding.getOnboardingProfile(firstSignup.user.id)
  assert(secondProfile.nickname === '민지', 'user B nickname was not saved')
  assert(secondProfile.birthYear === undefined, 'optional birth year could not be skipped')
  assert(secondProfile.gender === null, 'optional gender could not be skipped')
  assert(secondProfile.skinType === 'unknown', 'unknown skin type was not saved')
  assert(firstProfile.nickname === '은지', 'user A profile was overwritten by user B')
  assert(secondProfile.selectedConcerns.includes('sensitivity'), 'user B profile was not saved')
  assert(!secondProfile.selectedConcerns.includes('dryness'), 'user A profile leaked into user B')
  assert(firstProfile.registeredProductIds.includes('ceramide-cream'), 'user A products were not retained')
  assert(briefing.getSavedDietChoice(secondSignup.user.id) === null, 'user A diet choice leaked into user B')

  const firstHealthConnection = await healthConnection.getHealthConnection(firstSignup.user.id)
  const secondHealthConnection = await healthConnection.getHealthConnection(secondSignup.user.id)
  assert(firstHealthConnection.status === 'connected', 'user A health connection was not restored')
  assert(secondHealthConnection.status === 'not_requested', 'user A health connection leaked into user B')

  await healthConnection.connectHealthData(secondSignup.user.id)
  const connectedSecondLifeLog = await lifeLog.getTodayLifeLog(secondSignup.user.id)
  assert(connectedSecondLifeLog.connections.lifeDataConnected === true, 'health connection did not reach Life Log')
  assert(connectedSecondLifeLog.lifestyleEntries.length > 0, 'connected Life Log did not show demo lifestyle data')

  await healthConnection.disconnectHealthData(secondSignup.user.id)
  const disconnectedSecondLifeLog = await lifeLog.getTodayLifeLog(secondSignup.user.id)
  const refreshedSecondConnection = await healthConnection.getHealthConnection(secondSignup.user.id)
  const unchangedFirstConnection = await healthConnection.getHealthConnection(firstSignup.user.id)
  assert(disconnectedSecondLifeLog.connections.lifeDataConnected === false, 'disconnected Life Log retained connection state')
  assert(disconnectedSecondLifeLog.lifestyleEntries.length === 0, 'disconnected Life Log exposed demo lifestyle values')
  assert(refreshedSecondConnection.status === 'not_requested', 'health disconnect was not retained after refresh')
  assert(unchangedFirstConnection.status === 'connected', 'user B health change overwrote user A')

  const firstSOSContext = await sosContext.getSOSContext(firstSignup.user.id)
  const secondSOSContext = await sosContext.getSOSContext(secondSignup.user.id)
  assert(firstSOSContext.userId === firstSignup.user.id, 'SOS context did not retain user A identity')
  assert(secondSOSContext.userId === secondSignup.user.id, 'SOS context did not retain user B identity')
  assert(firstSOSContext.userProfile.nickname === '은지', 'SOS context did not include user A profile')
  assert(secondSOSContext.userProfile.nickname === '민지', 'SOS context did not include user B profile')
  assert(firstSOSContext.products.some((product) => product.id === 'ceramide-cream'), 'SOS context did not include user A products')
  assert(secondSOSContext.products.length === 0, 'user A products leaked into user B SOS context')
  assert(firstSOSContext.today.foodChoice === '조금 자극적', 'SOS context did not reuse user A diet choice')
  assert(secondSOSContext.today.foodChoice === undefined, 'user A diet choice leaked into user B SOS context')

  const ownedProductResponse = await sos.sendSOSMessage({
    message: '갑자기 너무 건조해',
    context: firstSOSContext,
  })
  assert(ownedProductResponse.message.includes('세라마이드 크림'), 'SOS response did not reuse an owned recommended product')

  const noProductResponse = await sos.sendSOSMessage({
    message: '갑자기 너무 건조해',
    context: secondSOSContext,
  })
  assert(!noProductResponse.message.includes('세라마이드 크림'), 'SOS response named a product user B does not own')

  let sosErrorRejected = false
  try {
    await sos.sendSOSMessage({
      message: '__SOS_MOCK_ERROR__',
      context: firstSOSContext,
    })
  } catch {
    sosErrorRejected = true
  }
  assert(sosErrorRejected, 'SOS mock error path did not reject for retry handling')

  const demoImage = new Blob(['ezkin-demo-image'], { type: 'image/jpeg' })
  const skinResult = await skinScan.analyzeSkin(demoImage)
  assert(Boolean(skinResult.id && skinResult.capturedAt), 'skin scan result contract is incomplete')
  assert(Array.isArray(skinResult.observedAreas), 'skin scan result areas are not serializable')

  const catalog = await products.getProductCatalog()
  const recognitionResult = await productRecognition.recognizeProduct(demoImage, {
    source: 'library',
    availableProducts: catalog,
  })
  assert(recognitionResult.status === 'candidates', 'product recognition did not return candidate state')
  assert(recognitionResult.candidates.length > 0 && recognitionResult.candidates.length <= 3, 'product recognition candidate count is invalid')

  const storageKeys = Array.from({ length: storage.length }, (_, index) => storage.key(index) ?? '')
  assert(!storageKeys.some((key) => /scan|image|conversation|raw-health/i.test(key)), 'session-only or raw health data was persisted')

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
  const demoProfile = await onboarding.getOnboardingProfile(demoLogin.user.id)
  assert(demoProfile.skinType === 'combination', 'demo skin baseline was not provided')

  const storedProfiles = JSON.parse(storage.getItem('ezkin:onboarding-profiles') ?? '{}')
  storedProfiles['legacy-completed-user'] = {
    userId: 'legacy-completed-user',
    currentStep: 4,
    selectedConcerns: ['dryness'],
    registeredProductIds: [],
    lifeDataConnected: false,
    weatherConnected: false,
    completedAt: '2026-01-01T00:00:00.000Z',
  }
  storage.setItem('ezkin:onboarding-profiles', JSON.stringify(storedProfiles))
  const migratedProfile = await onboarding.getOnboardingProfile('legacy-completed-user')
  assert(migratedProfile.currentStep === 5, 'completed legacy profile was sent back into onboarding')
  assert(migratedProfile.skinType === 'unknown', 'legacy profile did not receive a safe skin type default')
  assert(Array.isArray(migratedProfile.healthConcerns), 'legacy profile did not receive health concern defaults')

  console.log('PASS signup → logout → login')
  console.log('PASS incomplete/completed onboarding retention and session restore')
  console.log('PASS persistent users, demo login, duplicate and invalid-password handling')
  console.log('PASS profile/skin resume, optional values, and unknown skin type')
  console.log('PASS user-specific onboarding and product data isolation')
  console.log('PASS user-specific diet choice and SOS context isolation')
  console.log('PASS user-specific health connect/disconnect, refresh, and Life Log visibility')
  console.log('PASS user-specific SOS context and owned-product-only mock responses')
  console.log('PASS SOS mock error path for message-preserving retry UI')
  console.log('PASS scan/product recognition contracts and session-only sensitive media')
  console.log('PASS completed legacy profile migration without re-onboarding')
} finally {
  await server.close()
}
