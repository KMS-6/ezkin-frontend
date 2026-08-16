import { createServer } from 'vite'

class MemoryStorage {
  #values = new Map()

  get length() {
    return this.#values.size
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

function removeAllTestKeys(storage) {
  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index))
  keys.forEach((key) => {
    if (key) storage.removeItem(key)
  })
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
  const scenario = await server.ssrLoadModule('/src/services/demoScenarioService.ts')
  const onboarding = await server.ssrLoadModule('/src/services/onboardingService.ts')
  const products = await server.ssrLoadModule('/src/services/productService.ts')
  const briefing = await server.ssrLoadModule('/src/services/briefingService.ts')
  const health = await server.ssrLoadModule('/src/services/healthConnectionService.ts')
  const lifeLog = await server.ssrLoadModule('/src/services/lifeLogService.ts')
  const analysis = await server.ssrLoadModule('/src/services/analysisService.ts')
  const sosContext = await server.ssrLoadModule('/src/services/sosContextService.ts')
  const skinScan = await server.ssrLoadModule('/src/services/skinScanService.ts')
  const recognition = await server.ssrLoadModule('/src/services/productRecognitionService.ts')
  const backNavigation = await server.ssrLoadModule('/src/features/navigation/androidBackNavigation.ts')

  const automaticUser = await auth.getEntryUser()
  const firstUser = await scenario.resolveDemoScenarioEntryUser(automaticUser)
  const firstProfile = await onboarding.getOnboardingProfile(firstUser.id)
  const firstProducts = await products.getMyProducts(firstUser.id)
  const firstHealth = await health.getHealthConnection(firstUser.id)
  const firstEligibility = await analysis.getAnalysisEligibility(firstUser.id)
  const firstAnalysis = await analysis.getTriggerAnalysis(firstUser.id)

  assert(firstUser.id === scenario.DEMO_FIRST_USER_ID, 'first scenario did not use its isolated user id')
  assert(firstUser.onboardingCompleted === false, 'first scenario skipped onboarding')
  assert(!firstProfile.completedAt && firstProfile.currentStep === 1, 'first profile was not empty')
  assert(firstProducts.length === 0, 'first shelf exposed 30d products')
  assert(firstHealth.status === 'not_requested', 'first health data was connected')
  assert(firstEligibility.eligible === false && firstAnalysis === null, 'first analysis exposed 30d patterns')
  assert(scenario.getStoredDemoScenario() === 'first', 'first scenario was not persisted')

  await onboarding.saveBasicProfile(firstUser.id, {
    nickname: '입력했던 사용자',
    birthYear: 2000,
    gender: 'prefer_not_to_say',
    healthConcerns: ['irregular_sleep'],
  })
  await onboarding.saveSkinType(firstUser.id, 'dry')
  await onboarding.saveConcerns(firstUser.id, ['dryness'])
  await products.addMyProducts(firstUser.id, ['ceramide-cream'])
  await health.connectHealthData(firstUser.id)
  await onboarding.completeOnboardingProfile(firstUser.id)
  await briefing.saveDietChoice(firstUser.id, 'usual')

  const thirtyDayUser = await scenario.activateDemoScenario('30d')
  const thirtyDayProfile = await onboarding.getOnboardingProfile(thirtyDayUser.id)
  const thirtyDayProducts = await products.getMyProducts(thirtyDayUser.id)
  const thirtyDayHealth = await health.getHealthConnection(thirtyDayUser.id)
  const thirtyDayLifeLog = await lifeLog.getTodayLifeLog(thirtyDayUser.id)
  const thirtyDayEligibility = await analysis.getAnalysisEligibility(thirtyDayUser.id)
  const thirtyDayAnalysis = await analysis.getTriggerAnalysis(thirtyDayUser.id)
  const thirtyDaySOS = await sosContext.getSOSContext(thirtyDayUser.id)

  assert(thirtyDayUser.id === scenario.DEMO_30D_USER_ID, '30d scenario did not reuse the existing demo user id')
  assert(thirtyDayUser.onboardingCompleted === true && Boolean(thirtyDayProfile.completedAt), '30d onboarding was incomplete')
  assert(thirtyDayProfile.skinType === 'combination' && thirtyDayProfile.selectedConcerns.length > 0, '30d skin profile is missing')
  assert(thirtyDayProducts.length > 0, '30d shelf is empty')
  assert(thirtyDayHealth.status === 'connected', '30d health connection is missing')
  assert(thirtyDayLifeLog.lifestyleEntries.length > 0, '30d Life Log is empty')
  assert(thirtyDayEligibility.dataDays === 30 && thirtyDayEligibility.eligible, '30d eligibility is incorrect')
  assert(Boolean(thirtyDayAnalysis?.patterns.length), '30d trigger patterns are missing')
  assert(thirtyDaySOS.userId === thirtyDayUser.id && thirtyDaySOS.products.length > 0, '30d SOS context is incomplete')
  assert(briefing.getSavedDietChoice(thirtyDayUser.id) === null, 'first quick choice leaked into 30d')

  const firstAgain = await scenario.activateDemoScenario('first', { resetFirst: true })
  const resetFirstProfile = await onboarding.getOnboardingProfile(firstAgain.id)
  assert(firstAgain.id === firstUser.id, 'switching back changed the first user id')
  assert(firstAgain.onboardingCompleted === false, 'reset first user did not return to onboarding')
  assert(!resetFirstProfile.completedAt && resetFirstProfile.currentStep === 1, 'first onboarding was not reset')
  assert(resetFirstProfile.skinType === 'unknown' && resetFirstProfile.selectedConcerns.length === 0, 'first skin input was not reset')
  assert((await products.getMyProducts(firstAgain.id)).length === 0, 'first products were not reset')
  assert((await health.getHealthConnection(firstAgain.id)).status === 'not_requested', 'first health state was not reset')
  assert(briefing.getSavedDietChoice(firstAgain.id) === null, 'first quick choice was not reset')

  await scenario.activateDemoScenario('30d')
  const refreshedUser = await scenario.resolveDemoScenarioEntryUser(await auth.getEntryUser())
  assert(refreshedUser.id === thirtyDayUser.id, 'scenario selection was not retained on refresh')
  assert((await products.getMyProducts(refreshedUser.id)).length === thirtyDayProducts.length, '30d seed duplicated or reset products')
  assert(scenario.isDemoScenarioEnabled('false') === false, 'false env flag did not disable demo scenarios')
  assert(scenario.isDemoScenarioEnabled('true') === true, 'true env flag did not enable demo scenarios')

  removeAllTestKeys(storage)
  const existingUserId = 'existing-user-42'
  storage.setItem('ezkin:auth-session', JSON.stringify({
    user: {
      id: existingUserId,
      email: 'existing@ezkin.app',
      nickname: '기존 사용자',
      onboardingCompleted: true,
    },
    accessToken: 'existing-token',
  }))
  storage.setItem('ezkin:onboarding-profiles', JSON.stringify({
    [existingUserId]: {
      userId: existingUserId,
      currentStep: 5,
      onboardingVersion: 2,
      nickname: '기존 사용자',
      gender: null,
      healthConcerns: [],
      skinType: 'dry',
      selectedConcerns: ['dryness'],
      registeredProductIds: ['hyaluronic-serum'],
      lifeDataConnected: false,
      weatherConnected: true,
      completedAt: '2026-08-01T00:00:00.000Z',
    },
  }))
  storage.setItem('ezkin:diet-choices', JSON.stringify({ [existingUserId]: 'spicy' }))

  const existingUser = await scenario.resolveDemoScenarioEntryUser(await auth.getEntryUser())
  assert(existingUser.id === existingUserId, 'existing non-demo user id was replaced')
  assert((await onboarding.getOnboardingProfile(existingUserId)).skinType === 'dry', 'existing skin data was replaced')
  assert((await products.getMyProducts(existingUserId))[0]?.id === 'hyaluronic-serum', 'existing shelf was replaced')
  assert(briefing.getSavedDietChoice(existingUserId) === 'spicy', 'existing quick choice was replaced')

  const demoImage = new Blob(['ezkin-demo-image'], { type: 'image/jpeg' })
  const skinResult = await skinScan.analyzeSkin(demoImage)
  const catalog = await products.getProductCatalog()
  const recognitionResult = await recognition.recognizeProduct(demoImage, {
    source: 'library',
    availableProducts: catalog,
  })
  assert(Boolean(skinResult.id && skinResult.capturedAt), 'skin scan contract regressed')
  assert(recognitionResult.candidates.length > 0 && recognitionResult.candidates.length <= 3, 'product recognition contract regressed')

  const storageKeys = Array.from({ length: storage.length }, (_, index) => storage.key(index) ?? '')
  assert(!storageKeys.some((key) => /scan|image|conversation|raw-health/i.test(key)), 'session-only sensitive data was persisted')

  assert(backNavigation.resolveAndroidBackAction({ pathname: '/shelf/ceramide-cream', previousPathname: '/shelf', canGoBack: true }) === 'back', 'product detail back did not use route history')
  assert(backNavigation.resolveAndroidBackAction({ pathname: '/settings', previousPathname: '/home', canGoBack: true }) === 'back', 'settings back did not use route history')
  assert(backNavigation.resolveAndroidBackAction({ pathname: '/briefing', previousPathname: '/', canGoBack: true }) === 'home', 'direct briefing back did not fall back to home')
  assert(backNavigation.resolveAndroidBackAction({ pathname: '/scan', canGoBack: false }) === 'home', 'direct scan back did not fall back to home')
  assert(backNavigation.resolveAndroidBackAction({ pathname: '/home', previousPathname: '/shelf', canGoBack: true }) === 'stay', 'home back did not stay in the app')
  assert(backNavigation.resolveAndroidBackAction({ pathname: '/onboarding', canGoBack: false }) === 'stay', 'onboarding first step did not stay in the app')

  console.log('PASS first → Splash destination Onboarding')
  console.log('PASS first shelf empty, health disconnected, analysis insufficient')
  console.log('PASS 30d → Splash destination Home')
  console.log('PASS 30d profile, shelf, health, Life Log, analysis, and SOS context')
  console.log('PASS first → 30d → first fresh onboarding reset and data isolation')
  console.log('PASS scenario persistence and idempotent 30d seed')
  console.log('PASS demo env flag true/false contract')
  console.log('PASS existing non-demo user id and data retention')
  console.log('PASS scan/product recognition regression')
  console.log('PASS Android back route history, deep-link fallback, and home stay decisions')
} finally {
  await server.close()
}
