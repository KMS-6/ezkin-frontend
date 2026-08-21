import { createServer, loadEnv } from 'vite'

class MemoryStorage {
  #values = new Map()

  getItem(key) {
    return this.#values.get(key) ?? null
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

const env = loadEnv('development', process.cwd(), '')
const requiredLiveFlags = [
  'VITE_USE_ONBOARDING_API',
  'VITE_USE_SHELF_API',
  'VITE_USE_QUICK_CARE_API',
  'VITE_USE_CARE_CONTEXT_API',
  'VITE_USE_MANUAL_METRICS_API',
  'VITE_USE_BRIEFING_API',
  'VITE_USE_ANALYSIS_API',
  'VITE_USE_NOTIFICATION_SETTINGS_API',
]
assert(env.VITE_API_BASE_URL, 'VITE_API_BASE_URL is required for the live API smoke test')
assert(
  requiredLiveFlags.every((name) => env[name] === 'true'),
  `Enable every live API flag before running the smoke test: ${requiredLiveFlags.join(', ')}`,
)

const smokeUserId = `ezkin-live-smoke-user-${Date.now()}`
const storage = new MemoryStorage()
storage.setItem('ezkin:auth-session', JSON.stringify({
  user: { id: smokeUserId },
}))
Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true })
Object.defineProperty(globalThis, 'window', { value: globalThis, configurable: true })

const server = await createServer({
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true },
})

try {
  const briefing = await server.ssrLoadModule('/src/services/briefingService.ts')
  const backendIdentity = await server.ssrLoadModule('/src/services/backendIdentityService.ts')
  const products = await server.ssrLoadModule('/src/services/productService.ts')
  const analysis = await server.ssrLoadModule('/src/services/analysisService.ts')
  const notifications = await server.ssrLoadModule('/src/services/notificationSettingsService.ts')
  const onboarding = await server.ssrLoadModule('/src/services/onboardingService.ts')
  const quickInput = await server.ssrLoadModule('/src/services/quickInputService.ts')
  const quickCare = await server.ssrLoadModule('/src/services/quickCareService.ts')
  const careContext = await server.ssrLoadModule('/src/services/careContextService.ts')

  await backendIdentity.ensureNormalBackendIdentity({
    id: smokeUserId,
    email: '',
    nickname: 'API Smoke',
    onboardingCompleted: true,
  }, 'API Smoke')
  await onboarding.saveConnectionSettings(smokeUserId, {
    lifeDataConnected: false,
    weatherConnected: true,
  })
  await onboarding.completeOnboardingProfile(smokeUserId)

  const [today, shelf, eligibility, safety, context, settings] = await Promise.all([
    briefing.getTodayBriefing(smokeUserId),
    products.getMyProducts(smokeUserId),
    analysis.getAnalysisEligibility(smokeUserId),
    quickCare.checkQuickCareSafety('피부가 조금 건조해요.'),
    careContext.previewCareContext({ humidity: 35, uv_index: 4, user_reports_discomfort: false }),
    notifications.saveNotificationSettings(smokeUserId, { morningBriefingEnabled: true }),
  ])
  await quickInput.saveWaterChoice(smokeUserId, '3_to_5')
  const dailyInput = await quickInput.saveDietChoice(smokeUserId, 'normal')

  assert(typeof today.skinHeadline === 'string', 'Briefing response mapping failed')
  assert(Array.isArray(shelf), 'Shelf response mapping failed')
  assert(typeof eligibility.eligible === 'boolean', 'Analysis eligibility mapping failed')
  assert(typeof safety.reply === 'string', 'Quick Care response mapping failed')
  assert(typeof context.care_mode === 'string', 'Care Context response mapping failed')
  assert(settings.morningBriefingEnabled === true, 'Notification settings mapping failed')
  assert(dailyInput.waterChoice === '3_to_5' && dailyInput.dietChoice === 'normal', 'Manual metrics mapping failed')

  console.log('PASS live Briefing, Shelf, Analysis, Notification, Onboarding, Manual Metrics, Quick Care, and Care Context APIs')
} finally {
  await server.close()
}
