import { createServer } from 'vite'

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

const storage = new MemoryStorage()
storage.setItem('ezkin:auth-session', JSON.stringify({
  user: { id: 'persona_a1_seoyeon' },
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
  const products = await server.ssrLoadModule('/src/services/productService.ts')
  const analysis = await server.ssrLoadModule('/src/services/analysisService.ts')
  const notifications = await server.ssrLoadModule('/src/services/notificationSettingsService.ts')
  const onboarding = await server.ssrLoadModule('/src/services/onboardingService.ts')
  const quickInput = await server.ssrLoadModule('/src/services/quickInputService.ts')
  const quickCare = await server.ssrLoadModule('/src/services/quickCareService.ts')
  const careContext = await server.ssrLoadModule('/src/services/careContextService.ts')

  const [today, shelf, eligibility, safety, context, settings] = await Promise.all([
    briefing.getTodayBriefing('persona_a1_seoyeon'),
    products.getMyProducts('persona_a1_seoyeon'),
    analysis.getAnalysisEligibility('persona_a1_seoyeon'),
    quickCare.checkQuickCareSafety('피부가 조금 건조해요.'),
    careContext.previewCareContext({ humidity: 35, uv_index: 4, user_reports_discomfort: false }),
    notifications.saveNotificationSettings('persona_a1_seoyeon', { morningBriefingEnabled: true }),
  ])
  await onboarding.saveConnectionSettings('persona_a1_seoyeon', {
    lifeDataConnected: false,
    weatherConnected: true,
  })
  await quickInput.saveWaterChoice('persona_a1_seoyeon', '3_to_5')
  const dailyInput = await quickInput.saveDietChoice('persona_a1_seoyeon', 'normal')

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
