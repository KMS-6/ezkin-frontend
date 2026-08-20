import { createServer } from 'vite'
import { readFile } from 'node:fs/promises'

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
  define: {
    'import.meta.env.VITE_ENABLE_DEMO_SCENARIO': JSON.stringify('true'),
    'import.meta.env.VITE_USE_MOCK_API': JSON.stringify('true'),
    'import.meta.env.VITE_USE_QUICK_CARE_API': JSON.stringify('true'),
    'import.meta.env.VITE_USE_CARE_CONTEXT_API': JSON.stringify('false'),
    'import.meta.env.VITE_USE_MANUAL_METRICS_API': JSON.stringify('false'),
    'import.meta.env.VITE_USE_BRIEFING_API': JSON.stringify('false'),
    'import.meta.env.VITE_USE_ANALYSIS_API': JSON.stringify('false'),
    'import.meta.env.VITE_USE_SKIN_SCAN_API': JSON.stringify('false'),
    'import.meta.env.VITE_USE_SHELF_API': JSON.stringify('false'),
    'import.meta.env.VITE_USE_SOS_API': JSON.stringify('false'),
    'import.meta.env.VITE_USE_ONBOARDING_API': JSON.stringify('false'),
    'import.meta.env.VITE_USE_NOTIFICATION_SETTINGS_API': JSON.stringify('false'),
  },
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
  const quickInput = await server.ssrLoadModule('/src/services/quickInputService.ts')
  const scanCountdown = await server.ssrLoadModule('/src/features/scan/scanCountdown.ts')
  const healthMetrics = await server.ssrLoadModule('/src/utils/healthMetrics.ts')
  const weatherConnection = await server.ssrLoadModule('/src/services/weatherConnectionService.ts')
  const weatherData = await server.ssrLoadModule('/src/services/weatherDataService.ts')
  const quickCare = await server.ssrLoadModule('/src/services/quickCareService.ts')
  const careContext = await server.ssrLoadModule('/src/services/careContextService.ts')
  const sosService = await server.ssrLoadModule('/src/services/sosService.ts')
  const appDateTime = await server.ssrLoadModule('/src/utils/appDateTime.ts')

  const automaticUser = await auth.getEntryUser()
  const freshNormalUser = await scenario.resolveDemoScenarioEntryUser(automaticUser)
  const freshNormalProfile = await onboarding.getOnboardingProfile(freshNormalUser.id)
  assert(freshNormalUser.id === scenario.NORMAL_USER_ID && !freshNormalUser.onboardingCompleted, 'Demo OFF did not start with the stable fresh user')
  assert(freshNormalProfile.currentStep === 1 && !freshNormalProfile.completedAt, 'Demo OFF skipped fresh onboarding')
  assert((await products.getMyProducts(freshNormalUser.id)).length === 0, 'Persona cosmetics leaked into the fresh normal user')
  assert((await health.getHealthConnection(freshNormalUser.id)).status === 'not_requested', 'Persona Health state leaked into the fresh normal user')
  assert((await analysis.getAnalysisReport(freshNormalUser.id, 14)) === null, 'Persona Report leaked into the fresh normal user')
  assert((await analysis.getTriggerAnalysisDetail(freshNormalUser.id, 'scn_c1_20')) === null, 'Persona Pattern leaked into the fresh normal user')
  assert(quickInput.getTodayQuickInput(freshNormalUser.id) === null, 'Persona quick input leaked into the fresh normal user')
  assert(scenario.getStoredDemoScenario() === null, 'Demo OFF was stored as a Persona scenario')
  const normalLocalTime = new Date(2026, 0, 2, 19, 30, 0)
  assert(appDateTime.getTodayDateKey(freshNormalUser.id, normalLocalTime) === '2026-01-02', 'normal user today key does not use the device-local calendar date')
  assert(appDateTime.getTodayDateLabel(freshNormalUser.id, normalLocalTime) === '1월 2일 · 금요일', 'normal user date label is not device-local')
  assert(appDateTime.getCurrentGreeting(freshNormalUser.id, normalLocalTime) === '편안한 저녁이에요', 'normal user greeting does not use local time')
  assert(appDateTime.getCurrentRoutinePeriod(freshNormalUser.id, normalLocalTime) === 'pm', 'normal user routine period does not use local time')
  assert(appDateTime.getScanTimestamp(freshNormalUser.id, normalLocalTime) === normalLocalTime.toISOString(), 'normal user timestamp does not represent the current device time')
  const normalBriefing = await briefing.getTodayBriefing(freshNormalUser.id)
  assert(normalBriefing.dateLabel === appDateTime.getTodayDateLabel(freshNormalUser.id) && normalBriefing.greeting === appDateTime.getCurrentGreeting(freshNormalUser.id), 'normal Home briefing retained a fixed demo date or greeting')
  const connectedEmptyHealthUserId = 'connected-empty-health-user'
  await onboarding.saveConnectionSettings(connectedEmptyHealthUserId, {
    lifeDataConnected: true,
    weatherConnected: false,
  })
  const connectedEmptyHealthLifeLog = await lifeLog.getTodayLifeLog(connectedEmptyHealthUserId)
  assert(connectedEmptyHealthLifeLog.connections.lifeDataConnected, 'normal connected Watch state was not preserved')
  assert(connectedEmptyHealthLifeLog.lifestyleEntries.length === 0, 'normal connected Watch fabricated Health values')
  assert(connectedEmptyHealthLifeLog.healthBaselineStatus === undefined, 'normal connected Watch without Health data incorrectly started a baseline')
  const nonBlockingWeatherUserId = 'non-blocking-weather-user'
  const nonBlockingStartedAt = Date.now()
  const nonBlockingWeather = await weatherData.getCurrentWeatherData(nonBlockingWeatherUserId, {
    positionRequester: () => new Promise(() => {}),
  })
  assert(nonBlockingWeather === undefined && Date.now() - nonBlockingStartedAt < 100, 'missing weather data blocked initial Home/Life Log rendering')
  weatherData.clearCurrentWeatherData(nonBlockingWeatherUserId)
  const weatherSettingsUserId = 'settings-weather-user'
  await onboarding.completeOnboardingProfile(weatherSettingsUserId)
  const skippedWeatherProfile = await onboarding.getOnboardingProfile(weatherSettingsUserId)
  assert(Boolean(skippedWeatherProfile.completedAt) && !skippedWeatherProfile.weatherConnected, 'weather onboarding skip state was not preserved')
  assert((await lifeLog.getTodayLifeLog(weatherSettingsUserId)).environmentEntries.length === 0, 'disconnected weather fabricated Environment values')

  let explicitWeatherPermissionRequests = 0
  const deniedWeatherRequest = weatherConnection.connectWeatherData(weatherSettingsUserId, async () => {
    explicitWeatherPermissionRequests += 1
    return 'denied'
  })
  assert(explicitWeatherPermissionRequests === 1, 'normal weather permission request lost the synchronous click activation')
  const deniedWeather = await deniedWeatherRequest
  assert(deniedWeather.status === 'denied' && !deniedWeather.profile.weatherConnected, 'denied location permission connected weather data')

  const unavailableWeather = await weatherConnection.connectWeatherData(weatherSettingsUserId, async () => 'unavailable')
  assert(unavailableWeather.status === 'unavailable' && !unavailableWeather.profile.weatherConnected, 'unavailable location permission connected weather data')
  const connectedWeather = await weatherConnection.connectWeatherData(weatherSettingsUserId, async () => 'granted')
  assert(connectedWeather.status === 'granted' && connectedWeather.profile.weatherConnected, 'Settings could not connect weather after onboarding skip')
  assert((await onboarding.getOnboardingProfile(weatherSettingsUserId)).weatherConnected, 'successful weather connection did not persist in Settings state')
  assert((await lifeLog.getTodayLifeLog(weatherSettingsUserId)).environmentEntries.length === 0, 'location permission fabricated weather provider values')

  let weatherProviderUrl = ''
  let weatherProviderCalls = 0
  const currentEnvironment = await weatherData.refreshCurrentWeatherData(weatherSettingsUserId, {
    now: () => new Date(),
    positionRequester: async () => ({ coords: { latitude: 37.5665, longitude: 126.978 } }),
    fetcher: async (input) => {
      weatherProviderCalls += 1
      weatherProviderUrl = String(input)
      return new Response(JSON.stringify({
        current: {
          time: '2026-08-17T18:30',
          temperature_2m: 31.4,
          relative_humidity_2m: 57,
          uv_index: 3.2,
        },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    },
  })
  assert(weatherProviderUrl.startsWith('https://api.open-meteo.com/v1/forecast?'), 'normal weather did not use Open-Meteo')
  const weatherProviderRequest = new URL(weatherProviderUrl)
  assert(weatherProviderRequest.searchParams.get('current') === 'temperature_2m,relative_humidity_2m,uv_index' && weatherProviderRequest.searchParams.get('timezone') === 'auto', 'Open-Meteo current fields or timezone are incorrect')
  assert(currentEnvironment?.temperatureC === 31.4 && currentEnvironment.humidityPercent === 57 && currentEnvironment.uvIndex === 3.2, 'Open-Meteo response was not mapped to the environment domain')
  const realWeatherBriefing = await briefing.getTodayBriefing(weatherSettingsUserId)
  const realWeatherLifeLog = await lifeLog.getTodayLifeLog(weatherSettingsUserId)
  const normalRenderedFactors = realWeatherBriefing.contributingFactors ?? realWeatherBriefing.metrics
  assert(realWeatherBriefing.weather.temperature === 31.4 && realWeatherBriefing.weather.humidity === 57 && realWeatherBriefing.weather.uvIndex === 3.2, 'Home/Briefing did not reuse the current environment data')
  assert(realWeatherLifeLog.environmentEntries.map((entry) => entry.value).join(',') === '31.4,57%,3.2', 'Life Log did not show the same temperature, humidity, and UV')
  assert(normalRenderedFactors.some((item) => item.source === 'environment' && item.id === 'humidity' && item.value === '57%') && normalRenderedFactors.some((item) => item.id === 'uv' && item.value === '3.2'), 'normal Home/Briefing hid real Environment factors')
  assert(!normalRenderedFactors.some((item) => item.source === 'health') && (await products.getMyProducts(weatherSettingsUserId)).length === 0, 'Environment rendering incorrectly depended on Health or owned products')
  assert(weatherProviderCalls === 1, 'Home/Life Log duplicated the cached Open-Meteo request')
  let realWeatherCareRequest = null
  const realWeatherCareBriefing = await briefing.applyCareContextToBriefing(realWeatherBriefing, {
    enabled: true,
    requestPreview: async (request) => {
      realWeatherCareRequest = request
      return {
        date: '2026-08-17',
        care_mode: 'basic',
        observed_factors: [],
        notice: '생활·환경 데이터를 사용한 비의료적 참고 정보입니다.',
      }
    },
  })
  assert(realWeatherCareRequest?.humidity === 57 && realWeatherCareRequest?.uv_index === 3.2, 'Care Context did not receive the same real humidity and UV')
  assert(realWeatherCareBriefing.contributingFactors.some((item) => item.id === 'humidity' && item.value === '57%') && realWeatherCareBriefing.contributingFactors.some((item) => item.id === 'uv' && item.value === '3.2'), 'Care Context with no selected factors hid valid real Environment data')
  const storedWeather = storage.getItem(`ezkin:current-environment:${weatherSettingsUserId}`) ?? ''
  assert(!/latitude|longitude|37\.5665|126\.978/.test(storedWeather), 'location coordinates were persisted with environment data')
  const reconciledWeather = await weatherConnection.reconcileWeatherConnectionPermission(weatherSettingsUserId, async () => 'prompt')
  assert(!reconciledWeather.weatherConnected, 'stored weather consent incorrectly skipped a real permission request')
  await weatherConnection.connectWeatherData(weatherSettingsUserId, async () => 'granted')
  weatherData.clearCurrentWeatherData(weatherSettingsUserId)
  let weatherProviderFailed = false
  try {
    await weatherData.refreshCurrentWeatherData(weatherSettingsUserId, {
      positionRequester: async () => ({ coords: { latitude: 37.5665, longitude: 126.978 } }),
      fetcher: async () => { throw new Error('provider unavailable') },
    })
  } catch {
    weatherProviderFailed = true
  }
  assert(weatherProviderFailed && (await onboarding.getOnboardingProfile(weatherSettingsUserId)).weatherConnected, 'weather failure incorrectly changed permission consent')
  assert((await lifeLog.getTodayLifeLog(weatherSettingsUserId)).environmentEntries.length === 0, 'weather failure generated fake Environment values')
  await weatherConnection.disconnectWeatherData(weatherSettingsUserId)
  assert(!(await onboarding.getOnboardingProfile(weatherSettingsUserId)).weatherConnected, 'weather disconnect did not persist')
  assert((await lifeLog.getTodayLifeLog(weatherSettingsUserId)).environmentEntries.length === 0, 'weather values remained visible after disconnect')

  await onboarding.saveBasicProfile(freshNormalUser.id, { nickname: '일반 사용자', birthYear: 2000 })
  await onboarding.saveSkinType(freshNormalUser.id, 'dry')
  await onboarding.saveConcerns(freshNormalUser.id, ['dryness'])
  await products.addMyProducts(freshNormalUser.id, ['hyaluronic-serum'])
  await onboarding.completeOnboardingProfile(freshNormalUser.id)
  await auth.completeOnboarding()
  await quickInput.saveDietChoice(freshNormalUser.id, 'normal')
  const completedNormalUser = await scenario.resolveDemoScenarioEntryUser(await auth.getEntryUser())
  assert(completedNormalUser.id === freshNormalUser.id && completedNormalUser.onboardingCompleted, 'completed normal onboarding was not restored')

  const userA = await scenario.activateDemoScenario('A')
  const profileA = await onboarding.getOnboardingProfile(userA.id)
  const productsA = await products.getMyProducts(userA.id)
  const healthA = await health.getHealthConnection(userA.id)
  const lifeLogA = await lifeLog.getTodayLifeLog(userA.id)
  const reportA = await analysis.getAnalysisReport(userA.id, 14)
  const patternA = await analysis.getTriggerAnalysisDetail(userA.id, 'scn_a1_01')
  const briefingA = await briefing.getTodayBriefing(userA.id)

  assert(userA.id === scenario.DEMO_A_USER_ID && profileA.nickname === '박서연', 'A did not map to A1')
  assert(userA.onboardingCompleted === true && briefingA.weather.temperature === 29 && briefingA.weather.humidity === 48, 'A1 profile/briefing values are incorrect')
  assert(productsA.map((item) => item.id).includes('prod_toner_e_niacinamide'), 'A1 cosmetics were not used')
  assert(healthA.status === 'not_requested' && lifeLogA.lifestyleEntries.length === 0, 'A fabricated connected Health data')
  assert(healthMetrics.getAvailableHealthMetricLabels(healthA.availableMetrics).length === 0, 'A exposed unavailable Health metrics')
  assert(lifeLogA.environmentEntries.map((item) => item.label).join(',') === '기온,습도,UV', 'Environment did not preserve all raw metrics')
  assert(lifeLogA.environmentEntries.map((item) => item.value).join(',') === '29,48%,7', 'A1 Environment values were not used')
  assert(!briefingA.metrics.some((item) => item.id === 'temperature'), 'Briefing incorrectly promoted temperature to a contributing factor')
  assert(reportA === null, 'A fabricated a longitudinal report')
  assert(patternA === null, 'A exposed Pattern Analysis without an available completed result')
  assert(skinScan.getRecentTriggerAnalysisReference(userA.id) === null, 'A exposed a previous Pattern reference')
  assert(scenario.getStoredDemoScenario() === 'A', 'A scenario was not persisted')
  let demoWeatherPermissionRequests = 0
  const demoWeatherConnection = await weatherConnection.connectWeatherData(userA.id, async () => {
    demoWeatherPermissionRequests += 1
    return 'denied'
  })
  assert(demoWeatherPermissionRequests === 0 && demoWeatherConnection.profile.weatherConnected, 'Demo A requested real location or lost fixed environment data')
  let demoWeatherPositionRequests = 0
  let demoWeatherProviderRequests = 0
  const demoProviderResult = await weatherData.refreshCurrentWeatherData(userA.id, {
    positionRequester: async () => {
      demoWeatherPositionRequests += 1
      return { coords: { latitude: 0, longitude: 0 } }
    },
    fetcher: async () => {
      demoWeatherProviderRequests += 1
      throw new Error('Demo must not request Open-Meteo')
    },
  })
  assert(demoProviderResult === undefined && demoWeatherPositionRequests === 0 && demoWeatherProviderRequests === 0, 'Demo A called real location or Open-Meteo')
  await quickInput.saveDietChoice(userA.id, 'normal')
  assert(appDateTime.getTodayDateKey(userA.id, normalLocalTime) === '2026-08-15', 'A persona demo date changed with the device clock')
  assert(appDateTime.getTodayDateLabel(userA.id, normalLocalTime) === '8월 15일' && appDateTime.getCurrentGreeting(userA.id, normalLocalTime) === '좋은 아침이에요', 'A persona Home date or greeting changed')
  assert(appDateTime.getCurrentRoutinePeriod(userA.id, normalLocalTime) === 'am', 'A persona routine period changed with the device clock')
  assert(quickInput.getTodayQuickInput(userA.id)?.date === '2026-08-15', 'persona Quick Input did not keep the fixed demo date')

  const userB = await scenario.activateDemoScenario('B')
  const profileB = await onboarding.getOnboardingProfile(userB.id)
  const productsB = await products.getMyProducts(userB.id)
  const healthB = await health.getHealthConnection(userB.id)
  const lifeLogB = await lifeLog.getTodayLifeLog(userB.id)
  const patternB = await analysis.getTriggerAnalysisDetail(userB.id, 'scn_b1_01')
  const briefingB = await briefing.getTodayBriefing(userB.id)

  assert(userB.id === scenario.DEMO_B_USER_ID && profileB.nickname === '이은지', 'B did not map to B1')
  assert(briefingB.metrics.some((item) => item.id === 'sleep' && item.value === '4.5h'), 'B1 Briefing sleep is incorrect')
  assert(productsB.map((item) => item.id).includes('prod_ampoule_a_vitc'), 'B1 cosmetics were not used')
  assert(healthB.status === 'connected' && healthMetrics.getAvailableHealthMetricLabels(healthB.availableMetrics).join(',') === '수면,HRV', 'B Health availability is incorrect')
  assert(lifeLogB.healthBaselineStatus === 'building', 'B baseline was incorrectly established')
  assert(lifeLogB.lifestyleEntries.some((item) => item.type === 'sleep' && item.value === '4.5'), 'B1 sleep was not used')
  assert(lifeLogB.lifestyleEntries.some((item) => item.type === 'hrv' && item.value === '28'), 'B1 HRV was not used')
  assert(lifeLogB.lifestyleEntries.every((item) => !item.description), 'B showed a personal baseline comparison')
  assert(!lifeLogB.lifestyleEntries.some((item) => item.type === 'active_energy_kcal'), 'B fabricated active energy')
  assert((await analysis.getAnalysisReport(userB.id, 14)) === null, 'B fabricated a report')
  assert(patternB === null, 'B exposed Pattern Analysis without an available completed result')
  assert(skinScan.getRecentTriggerAnalysisReference(userB.id) === null, 'B exposed a previous Pattern reference')
  assert(quickInput.getSavedDietChoice(userB.id) === null, 'A quick input leaked into B')

  const userC = await scenario.activateDemoScenario('C')
  const profileC = await onboarding.getOnboardingProfile(userC.id)
  const productsC = await products.getMyProducts(userC.id)
  const healthC = await health.getHealthConnection(userC.id)
  const lifeLogC = await lifeLog.getTodayLifeLog(userC.id)
  const eligibilityC = await analysis.getAnalysisEligibility(userC.id)
  const report14 = await analysis.getAnalysisReport(userC.id, 14)
  const report30 = await analysis.getAnalysisReport(userC.id, 30)
  const patternC = await analysis.getTriggerAnalysisDetail(userC.id, 'scn_c1_20')
  const sosC = await sosContext.getSOSContext(userC.id)
  const briefingC = await briefing.getTodayBriefing(userC.id)

  let careContextRequestUrl = ''
  let careContextRequestBody = null
  const directCareContext = await careContext.previewCareContext({
    humidity: 23,
    uv_index: 2.5,
    user_reports_discomfort: false,
  }, {
    baseUrl: 'http://127.0.0.1:8000/api/v1',
    fetcher: async (input, init) => {
      careContextRequestUrl = String(input)
      careContextRequestBody = JSON.parse(String(init?.body))
      return new Response(JSON.stringify({
        date: '2026-08-17',
        care_mode: 'moisture_focused',
        observed_factors: [{ type: 'low_humidity', message: '오늘 습도가 낮아요.' }],
        notice: '생활·환경 데이터를 활용한 비의료적 참고 정보입니다.',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    },
  })
  assert(careContextRequestUrl === 'http://127.0.0.1:8000/api/v1/care-contexts/preview', 'Care Context did not use the centralized API path')
  assert(careContextRequestBody?.humidity === 23 && careContextRequestBody?.uv_index === 2.5 && careContextRequestBody?.user_reports_discomfort === false, 'Care Context request contract is incorrect')
  assert(directCareContext.care_mode === 'moisture_focused', 'low humidity Care Context mode was not preserved')

  let timedOutCareContext = false
  let careContextAbortObserved = false
  try {
    await careContext.previewCareContext({
      humidity: 23,
      user_reports_discomfort: false,
    }, {
      baseUrl: 'http://127.0.0.1:8000/api/v1',
      timeoutMs: 10,
      fetcher: async (_input, init) => new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          careContextAbortObserved = true
          reject(new DOMException('aborted', 'AbortError'))
        }, { once: true })
      }),
    })
  } catch {
    timedOutCareContext = true
  }
  assert(timedOutCareContext && careContextAbortObserved, 'Care Context timeout did not abort the pending request')

  let briefingCareRequest = null
  const careEnabledBriefingC = await briefing.applyCareContextToBriefing(briefingC, {
    enabled: true,
    requestPreview: async (request) => {
      briefingCareRequest = request
      return directCareContext
    },
  })
  assert(briefingCareRequest?.humidity === 23 && briefingCareRequest?.uv_index === 2.5 && briefingCareRequest?.user_reports_discomfort === false, 'Briefing fabricated or omitted Care Context input')
  assert(careEnabledBriefingC.metrics === briefingC.metrics, 'Care Context replaced raw Briefing metrics used by Life Log')
  assert(careEnabledBriefingC.contributingFactors.some((item) => item.id === 'hrv'), 'Care Context removed existing Health factors')
  assert(careEnabledBriefingC.contributingFactors.some((item) => item.id === 'humidity' && item.description === '오늘 습도가 낮아요.'), 'Briefing environment factor did not come from backend observed_factors')
  assert(careEnabledBriefingC.careContext?.care_mode === 'moisture_focused', 'Briefing did not preserve backend care_mode')

  const uvFocusedBriefing = await briefing.applyCareContextToBriefing(briefingA, {
    enabled: true,
    requestPreview: async (request) => {
      assert(request.uv_index === 7, 'current UV value was not sent to Care Context')
      return {
        date: '2026-08-17',
        care_mode: 'uv_focused',
        observed_factors: [{ type: 'high_uv', message: '오늘 자외선 지수가 높아요.' }],
        notice: '생활·환경 데이터를 활용한 비의료적 참고 정보입니다.',
      }
    },
  })
  assert(uvFocusedBriefing.careContext?.care_mode === 'uv_focused' && uvFocusedBriefing.contributingFactors.some((item) => item.id === 'uv'), 'high UV Care Context was not integrated')

  const noEnvironmentBriefing = {
    ...briefingC,
    weather: {},
    metrics: briefingC.metrics.filter((item) => item.source === 'health'),
  }
  let missingEnvironmentCalls = 0
  const missingEnvironmentResult = await briefing.applyCareContextToBriefing(noEnvironmentBriefing, {
    enabled: true,
    requestPreview: async () => {
      missingEnvironmentCalls += 1
      throw new Error('must not be called')
    },
  })
  assert(missingEnvironmentCalls === 0 && missingEnvironmentResult === noEnvironmentBriefing, 'missing environment values were fabricated to call Care Context')

  const failedCareContextBriefing = await briefing.applyCareContextToBriefing(briefingC, {
    enabled: true,
    requestPreview: async () => { throw new Error('backend unavailable') },
  })
  assert(failedCareContextBriefing.contributingFactors.some((item) => item.id === 'sleep') && failedCareContextBriefing.contributingFactors.some((item) => item.id === 'humidity' && item.value === '23%'), 'failed Care Context blocked Health or hid valid raw environment data')
  assert(failedCareContextBriefing.contributingFactors.filter((item) => item.source === 'environment').every((item) => briefingC.metrics.some((rawMetric) => rawMetric.id === item.id && rawMetric.value === item.value)), 'failed Care Context fabricated Environment values')

  let disabledCareContextCalls = 0
  const careDisabledBriefing = await briefing.applyCareContextToBriefing(briefingC, {
    enabled: false,
    requestPreview: async () => {
      disabledCareContextCalls += 1
      return directCareContext
    },
  })
  assert(careDisabledBriefing === briefingC && disabledCareContextCalls === 0, 'disabled Care Context changed existing mock Briefing behavior')
  assert(careContext.isCareContextApiEnabled('false') === false && careContext.isCareContextApiEnabled('true') === true, 'VITE_USE_CARE_CONTEXT_API string parsing is incorrect')

  assert(userC.id === scenario.DEMO_C_USER_ID && profileC.nickname === '최민준', 'C did not map to C1')
  assert(briefingC.skinHeadline === '오늘은 피부가 조금 예민해 보여요.', 'C1 Home headline overstates a measured skin-barrier condition')
  assert(briefingC.metrics.some((item) => item.id === 'hrv' && item.value === '33 ms'), 'C1 Briefing HRV is incorrect')
  assert(productsC.length === 7 && productsC.some((item) => item.id === 'prod_cream_f_panthenol'), 'C1 cosmetics were not used')
  assert(healthC.status === 'connected' && lifeLogC.healthBaselineStatus === 'established', 'C baseline is missing')
  assert(lifeLogC.lifestyleEntries.some((item) => item.type === 'sleep' && item.description === '평소 6.1시간'), 'C sleep baseline is missing')
  assert(lifeLogC.lifestyleEntries.some((item) => item.type === 'hrv' && item.description?.includes('14일 평균')), 'C HRV baseline is missing')
  assert(!lifeLogC.lifestyleEntries.some((item) => item.type === 'active_energy_kcal'), 'C fabricated active energy')
  assert(eligibilityC.dataDays === 190 && eligibilityC.eligible, 'C1 history length is incorrect')
  assert(report14?.status === 'completed' && report14.report_id === 'report_c1_14d', 'C report schema is incorrect')
  assert(report14?.recommendations[0]?.text === '수면과 HRV가 낮은 날의 피부 변화를 계속 함께 살펴보세요.', 'C Report recommendation became a product-specific daily routine')
  assert(report30?.status === 'completed' && report30.report_id === 'report_c1_30d', 'C long-term 30-day report is missing')
  assert(report30?.period === 30 && report30.patterns.length > 0, 'C 30-day report does not contain a long-term pattern')
  assert(patternC?.scan_id === 'scn_c1_20' && patternC.raw_facts.length === 2, 'C pattern contract is incorrect')
  assert(patternC.raw_facts.map((fact) => fact.type).join(',') === 'sleep,hrv', 'C Pattern fabricated an unsupported humidity fact')
  assert(patternC?.observed_pattern?.text === '수면이 짧고 HRV가 낮았던 시기에 홍조 상승이 함께 관찰됐어요.', 'C Pattern does not align its observed text with the supported raw facts')
  assert(patternC.observed_pattern.sample_size === undefined && patternC.observed_pattern.match_count === undefined, 'C fabricated Pattern occurrence counts')
  assert(!('timeline' in patternC) && !('target_skin_event' in patternC) && !('next_action' in patternC), 'frontend-only Pattern fields remain')
  assert(sosC.userId === userC.id && sosC.products.length > 0, 'C SOS context is incomplete')
  assert(healthMetrics.getAvailableHealthMetricLabels({ sleep_hours: true, hrv_ms: true, active_energy_kcal: true }).join(',') === '수면,HRV,활동', 'optional active energy cannot be represented')

  let mockSafetyCalls = 0
  const mockSOSResponse = await sosService.resolveSOSMessageWithSafetyGate({ message: '레티놀 써도 돼?', context: sosC }, false, {
    safetyCheck: async () => {
      mockSafetyCalls += 1
      throw new Error('mock mode must not call Quick Care')
    },
  })
  assert(mockSafetyCalls === 0 && mockSOSResponse.message.includes('레티놀'), 'mock mode did not preserve the existing SOS response flow')

  const originalFetch = globalThis.fetch
  let dedicatedFlagRequestUrl = ''
  let dedicatedFlagResponse = null
  try {
    globalThis.fetch = async (input) => {
      dedicatedFlagRequestUrl = String(input)
      return new Response(JSON.stringify({
        action: 'stop_ai_guidance',
        reply: '전용 Quick Care safety gate 응답',
        professional_help_suggested: true,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    dedicatedFlagResponse = await sosService.sendSOSMessage({ message: '긴급한 증상이 있어', context: sosC })
  } finally {
    globalThis.fetch = originalFetch
  }
  assert(dedicatedFlagRequestUrl.endsWith('/api/v1/quick-care/safety-check') && dedicatedFlagResponse?.message === '전용 Quick Care safety gate 응답', 'dedicated Quick Care flag did not trigger the live safety-check while global mock mode was enabled')

  let liveRequestUrl = ''
  let liveRequestBody = null
  let stopGeneralCalls = 0
  const stopSOSResponse = await sosService.resolveSOSMessageWithSafetyGate({ message: '증상이 너무 심해', context: sosC }, true, {
    safetyCheck: (message) => quickCare.checkQuickCareSafety(message, {
      baseUrl: 'http://127.0.0.1:8000/api/v1',
      fetcher: async (input, init) => {
        liveRequestUrl = String(input)
        liveRequestBody = JSON.parse(String(init?.body))
        return new Response(JSON.stringify({
          action: 'stop_ai_guidance',
          reply: '지금은 일반 안내를 멈추고 전문가의 도움을 확인해주세요.',
          professional_help_suggested: true,
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      },
    }),
    generalResponder: () => {
      stopGeneralCalls += 1
      return { message: '이 응답은 표시되면 안 돼요.' }
    },
  })
  assert(liveRequestUrl === 'http://127.0.0.1:8000/api/v1/quick-care/safety-check' && liveRequestBody?.message === '증상이 너무 심해', 'live mode did not POST the Quick Care safety-check contract')
  assert(stopGeneralCalls === 0 && stopSOSResponse.message === '지금은 일반 안내를 멈추고 전문가의 도움을 확인해주세요.', 'stop_ai_guidance continued the general chatbot')
  assert(stopSOSResponse.professionalHelpSuggested === true, 'professional_help_suggested was not preserved')

  let continueGeneralCalls = 0
  const continuedSOSResponse = await sosService.resolveSOSMessageWithSafetyGate({ message: '오늘 건조해', context: sosC }, true, {
    safetyCheck: async () => ({
      action: 'continue_general_guidance',
      reply: '일반 안내를 계속할 수 있어요.',
      professional_help_suggested: false,
    }),
    generalResponder: () => {
      continueGeneralCalls += 1
      return { message: '기존 SOS 일반 안내' }
    },
  })
  assert(continueGeneralCalls === 1 && continuedSOSResponse.message === '기존 SOS 일반 안내', 'continue_general_guidance did not continue the existing SOS responder')

  let failedSafetyError = null
  let failedGeneralCalls = 0
  try {
    await sosService.resolveSOSMessageWithSafetyGate({ message: '확인해줘', context: sosC }, true, {
      safetyCheck: async () => { throw new Error('network failed') },
      generalResponder: () => {
        failedGeneralCalls += 1
        return { message: '가짜 안전 결과' }
      },
    })
  } catch (error) {
    failedSafetyError = error
  }
  assert(failedSafetyError?.code === 'SAFETY_CHECK_FAILED' && failedGeneralCalls === 0, 'failed safety-check silently produced a fake safe response')
  assert(sosService.isQuickCareApiEnabled('false') === false && sosService.isQuickCareApiEnabled('true') === true, 'VITE_USE_QUICK_CARE_API string parsing is incorrect')

  const reopenedReference = skinScan.getRecentTriggerAnalysisReference(userC.id)
  assert(reopenedReference?.scanId === 'scn_c1_20', 'C previous Pattern reference is missing')
  assert((await analysis.getTriggerAnalysisDetail(userC.id, reopenedReference.scanId))?.scan_id === 'scn_c1_20', 'previous Pattern did not reopen by scan id')
  assert((await analysis.getTriggerAnalysisDetail(userC.id, 'demo-scan-result'))?.scan_id === 'scn_c1_20', 'C inline scan did not reuse the latest completed Pattern target')

  const restoredNormalUser = await scenario.activateNormalMode()
  const restoredNormalProducts = await products.getMyProducts(restoredNormalUser.id)
  assert(restoredNormalUser.id === freshNormalUser.id && restoredNormalUser.onboardingCompleted, 'C to Demo OFF did not restore the completed normal user')
  assert(restoredNormalProducts.map((item) => item.id).join(',') === 'hyaluronic-serum', 'C cosmetics leaked into normal storage')
  assert((await health.getHealthConnection(restoredNormalUser.id)).status === 'not_requested', 'C Health state leaked into normal storage')
  assert((await analysis.getAnalysisReport(restoredNormalUser.id, 14)) === null, 'C Report leaked into normal storage')
  assert(quickInput.getSavedDietChoice(restoredNormalUser.id) === 'normal', 'normal quick input was not restored')
  assert(scenario.getStoredDemoScenario() === null, 'Demo OFF retained a Persona selection')

  await scenario.activateDemoScenario('C')
  const refreshedUser = await scenario.resolveDemoScenarioEntryUser(await auth.getEntryUser())
  assert(refreshedUser.id === userC.id, 'scenario selection was not retained on refresh')
  assert((await products.getMyProducts(refreshedUser.id)).length === productsC.length, 'C seed duplicated or reset products')
  assert((await analysis.getTriggerAnalysisDetail(refreshedUser.id, 'scn_c1_20'))?.observed_pattern?.text === patternC.observed_pattern.text, 'C Pattern was not restored after Demo OFF')
  assert(scenario.isDemoScenarioEnabled('false') === false, 'false env flag did not disable demo scenarios')
  assert(scenario.isDemoScenarioEnabled('true') === true, 'true env flag did not enable demo scenarios')
  assert(scenario.isDemoScenarioEnabled('fasle') === false, 'invalid env values must not enable demo scenarios')

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
  assert(quickInput.getSavedDietChoice(existingUserId) === 'spicy', 'existing quick choice was replaced')

  const demoImage = new Blob(['ezkin-demo-image'], { type: 'image/jpeg' })
  const scanStartedAt = Date.now()
  const skinResult = await skinScan.analyzeSkin(demoImage, existingUserId)
  skinScan.rememberLatestSkinScanResult(existingUserId, skinResult)
  const recentTriggerReference = skinScan.getRecentTriggerAnalysisReference(existingUserId)
  const reopenedTrigger = recentTriggerReference
    ? await analysis.getTriggerAnalysisDetail(existingUserId, recentTriggerReference.scanId)
    : null
  const catalog = await products.getProductCatalog()
  const recognitionResult = await recognition.recognizeProduct(demoImage, {
    source: 'library',
    availableProducts: catalog,
  })
  assert(Boolean(skinResult.id && skinResult.capturedAt), 'skin scan contract regressed')
  assert(new Date(skinResult.capturedAt).getTime() >= scanStartedAt, 'normal user scan timestamp is not current')
  assert(appDateTime.getScanTimestamp(userC.id, normalLocalTime) === '2026-08-14T08:00:00Z', 'C persona scan timestamp no longer uses fixed persona data')
  assert(recentTriggerReference?.scanId === skinResult.id && reopenedTrigger?.scan_id === skinResult.id, 'completed Pattern Analysis could not be reopened without rescanning')
  assert(recognitionResult.candidates.length > 0 && recognitionResult.candidates.length <= 3, 'product recognition contract regressed')

  const storageKeys = Array.from({ length: storage.length }, (_, index) => storage.key(index) ?? '')
  assert(!storageKeys.some((key) => /scan|image|conversation|raw-health/i.test(key)), 'session-only sensitive data was persisted')
  assert(scanCountdown.SCAN_COUNTDOWN_NUMBER_MS >= 600 && scanCountdown.SCAN_COUNTDOWN_NUMBER_MS <= 800, 'countdown numbers are outside the expected timing range')
  assert(scanCountdown.getScanCountdownDelay(1) < 250, 'countdown keeps an unnecessary full-second delay after 1')
  const contractUserId = 'diet-contract-user'
  const finalDietChoices = ['normal', 'spicy', 'late_night_meal']
  for (const [index, dietChoice] of finalDietChoices.entries()) {
    const date = `2026-08-${20 + index}`
    await quickInput.saveDietChoice(contractUserId, dietChoice, date)
    const saved = quickInput.getTodayQuickInput(contractUserId, date)
    const payload = quickInput.toDailyManualMetricPayload(saved)
    assert(saved?.dietChoice === dietChoice, `${dietChoice} did not round-trip through daily storage`)
    assert(payload.diet_flag === dietChoice, `${dietChoice} did not pass through the backend DTO`)
  }

  const waterPayloads = [
    ['under_3', 'under_3_glasses'],
    ['3_to_5', 'three_to_five_glasses'],
    ['over_5', 'over_5_glasses'],
  ]
  for (const [waterChoice, expected] of waterPayloads) {
    const payload = quickInput.toDailyManualMetricPayload({
      userId: contractUserId,
      date: '2026-08-23',
      createdAt: '2026-08-23T00:00:00.000Z',
      updatedAt: '2026-08-23T00:00:00.000Z',
      waterChoice,
    })
    assert(payload.water_intake_level === expected, `${waterChoice} water mapping regressed`)
  }

  const legacyUserId = 'legacy-diet-user'
  const existingDailyRecords = JSON.parse(storage.getItem('ezkin:daily-quick-inputs') ?? '{}')
  storage.setItem('ezkin:daily-quick-inputs', JSON.stringify({
    ...existingDailyRecords,
    [`${legacyUserId}:2026-08-24`]: {
      userId: legacyUserId, date: '2026-08-24', createdAt: '2026-08-24T00:00:00.000Z', updatedAt: '2026-08-24T00:00:00.000Z', dietChoice: 'usual',
    },
    [`${legacyUserId}:2026-08-25`]: {
      userId: legacyUserId, date: '2026-08-25', createdAt: '2026-08-25T00:00:00.000Z', updatedAt: '2026-08-25T00:00:00.000Z', dietChoice: 'spicy',
    },
    [`${legacyUserId}:2026-08-26`]: {
      userId: legacyUserId, date: '2026-08-26', createdAt: '2026-08-26T00:00:00.000Z', updatedAt: '2026-08-26T00:00:00.000Z', waterChoice: '3_to_5', dietChoice: 'clean',
    },
    [`${legacyUserId}:2026-08-27`]: {
      userId: legacyUserId, date: '2026-08-27', createdAt: '2026-08-27T00:00:00.000Z', updatedAt: '2026-08-27T00:00:00.000Z', waterChoice: 'over_5', dietChoice: 'stimulating',
    },
  }))
  assert(quickInput.getTodayQuickInput(legacyUserId, '2026-08-24')?.dietChoice === 'normal', 'legacy usual did not migrate to normal')
  assert(quickInput.getTodayQuickInput(legacyUserId, '2026-08-25')?.dietChoice === 'spicy', 'legacy spicy was not preserved')
  const cleanLegacy = quickInput.getTodayQuickInput(legacyUserId, '2026-08-26')
  const stimulatingLegacy = quickInput.getTodayQuickInput(legacyUserId, '2026-08-27')
  assert(cleanLegacy?.waterChoice === '3_to_5' && !cleanLegacy.dietChoice, 'legacy clean was not unset while preserving water')
  assert(stimulatingLegacy?.waterChoice === 'over_5' && !stimulatingLegacy.dietChoice, 'legacy stimulating was not unset while preserving water')

  await quickInput.saveWaterChoice(contractUserId, '3_to_5')
  await quickInput.saveDietChoice(contractUserId, 'late_night_meal')
  const sharedDailyRecord = quickInput.getTodayQuickInput(contractUserId)
  const manualEntries = await lifeLog.getTodayManualInputs(contractUserId)
  assert(sharedDailyRecord?.waterChoice === '3_to_5' && sharedDailyRecord.dietChoice === 'late_night_meal', 'Home quick inputs did not share one daily record')
  assert(manualEntries.some((entry) => entry.type === 'diet' && entry.value === '야식'), 'Life Log did not render the shared diet value')

  const nativeHelperSource = await readFile(new URL('../android/app/src/main/java/com/wize/ezkin/EzkinNotificationHelper.java', import.meta.url), 'utf8')
  const nativeReceiverSource = await readFile(new URL('../android/app/src/main/java/com/wize/ezkin/EzkinNotificationReceiver.java', import.meta.url), 'utf8')
  const analysisPageSource = await readFile(new URL('../src/pages/AnalysisReportPage.tsx', import.meta.url), 'utf8')
  const scanPageSource = await readFile(new URL('../src/pages/ScanPage.tsx', import.meta.url), 'utf8')
  const metricGroupSource = await readFile(new URL('../src/features/lifelog/components/LifeLogMetricGroup.tsx', import.meta.url), 'utf8')
  const analysisServiceSource = await readFile(new URL('../src/services/analysisService.ts', import.meta.url), 'utf8')
  const analysisTypeSource = await readFile(new URL('../src/types/analysisReport.ts', import.meta.url), 'utf8')
  const demoSwitchSource = await readFile(new URL('../src/features/demo/DemoScenarioSwitch.tsx', import.meta.url), 'utf8')
  const notificationSectionSource = await readFile(new URL('../src/features/notifications/AndroidNotificationTestSection.tsx', import.meta.url), 'utf8')
  const notificationServiceSource = await readFile(new URL('../src/services/androidNotificationService.ts', import.meta.url), 'utf8')
  const settingsPageSource = await readFile(new URL('../src/pages/SettingsPage.tsx', import.meta.url), 'utf8')
  const lifeLogPageSource = await readFile(new URL('../src/pages/LifeLogPage.tsx', import.meta.url), 'utf8')
  const weatherSheetSource = await readFile(new URL('../src/features/weather/components/WeatherConnectionSheet.tsx', import.meta.url), 'utf8')
  const weatherConnectionSource = await readFile(new URL('../src/services/weatherConnectionService.ts', import.meta.url), 'utf8')
  const weatherDataSource = await readFile(new URL('../src/services/weatherDataService.ts', import.meta.url), 'utf8')
  const androidLocationBridgeSource = await readFile(new URL('../src/services/androidLocationBridge.ts', import.meta.url), 'utf8')
  const onboardingPageSource = await readFile(new URL('../src/features/onboarding/OnboardingPage.tsx', import.meta.url), 'utf8')
  const androidManifestSource = await readFile(new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url), 'utf8')
  const androidLocationPluginSource = await readFile(new URL('../android/app/src/main/java/com/wize/ezkin/EzkinLocationPlugin.java', import.meta.url), 'utf8')
  const androidMainActivitySource = await readFile(new URL('../android/app/src/main/java/com/wize/ezkin/MainActivity.java', import.meta.url), 'utf8')
  const sosPageSource = await readFile(new URL('../src/pages/SOSPage.tsx', import.meta.url), 'utf8')
  const quickCareServiceSource = await readFile(new URL('../src/services/quickCareService.ts', import.meta.url), 'utf8')
  const sosServiceSource = await readFile(new URL('../src/services/sosService.ts', import.meta.url), 'utf8')
  const careContextServiceSource = await readFile(new URL('../src/services/careContextService.ts', import.meta.url), 'utf8')
  const briefingServiceSource = await readFile(new URL('../src/services/briefingService.ts', import.meta.url), 'utf8')
  const homePageSource = await readFile(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')
  assert(['평소대로', '매운 음식', '야식'].every((label) => nativeHelperSource.includes(label)), 'native diet action labels are incomplete')
  assert(['"normal"', '"spicy"', '"late_night_meal"'].every((value) => nativeReceiverSource.includes(value)), 'native pending diet values do not match the final contract')
  assert(!/ACTION_DIET_CLEAN|ACTION_DIET_STIMULATING/.test(`${nativeHelperSource}${nativeReceiverSource}`), 'legacy native diet actions remain active')
  assert(analysisPageSource.includes('다시 보기') && analysisPageSource.includes('아직 확인할 트리거 분석이 없어요.'), 'Analysis does not expose both recent-trigger and calm empty states')
  assert(metricGroupSource.includes('grid-cols-3') && metricGroupSource.includes('divide-x'), 'Environment is not a three-column card')
  assert(scanPageSource.includes('<PatternAnalysisContent analysis={patternAnalysis} />') && !scanPageSource.includes('변화 전 72시간 보기'), 'Pattern Analysis is not inline below the Scan result')
  assert(!/D-3|D-2|D-1|targetSkinEvent|nextAction/.test(analysisServiceSource), 'frontend-generated Pattern facts remain in the service')
  assert(['scan_id', 'raw_facts', 'observed_pattern', 'report_id', 'evidence_ids'].every((field) => analysisTypeSource.includes(field)), 'Analysis API-shaped fields are incomplete')
  assert(analysisTypeSource.includes('sample_size: number') && analysisTypeSource.includes('match_count: number'), 'API Pattern occurrence counts are not required')
  assert(analysisTypeSource.includes("Partial<Pick<ObservedPattern, 'sample_size' | 'match_count'>>"), 'demo Pattern presentation cannot omit unavailable occurrence counts')
  assert(!/targetSkinEvent|nextAction|ReportTimelinePoint|skinSummary/.test(analysisTypeSource), 'deprecated Analysis API fields remain required')
  assert(demoSwitchSource.includes('일반 사용자') && demoSwitchSource.includes('activateNormalMode'), 'Settings does not expose an explicit Demo OFF control')
  assert(scenario.isDemoScenarioEnabled('true') === true, 'demo flag true hid notification test controls')
  assert(scenario.isDemoScenarioEnabled('false') === false, 'demo flag false exposed notification test controls')
  assert(notificationSectionSource.includes('const showTestControls = isDemoScenarioEnabled()') && notificationSectionSource.includes('showTestControls &&') && notificationSectionSource.includes('>알림</h2>') && !notificationSectionSource.includes('알림 테스트'), 'notification test controls are not conditionally removed')
  assert(['requestNotificationPermission', 'addNotificationTapListener', 'consumePendingNotificationRoute'].every((name) => notificationServiceSource.includes(name)), 'real notification permission or routing features regressed')
  assert(settingsPageSource.includes('title="워치"') && lifeLogPageSource.includes('워치 연결됨') && !`${settingsPageSource}${lifeLogPageSource}`.includes('위치 연결'), 'wearable connection UI does not consistently use 워치')
  assert(settingsPageSource.includes("{connected ? '연결됨' : '연결하기'}") && settingsPageSource.includes('inline-flex shrink-0 items-center gap-1 whitespace-nowrap'), 'connection rows do not share one non-wrapping status/action treatment')
  assert(settingsPageSource.includes('onClick={onOpenHealthConnection}') && settingsPageSource.includes('onClick={onOpenWeatherConnection}'), 'Settings connection rows are not both clickable')
  assert(weatherSheetSource.includes('날씨 데이터를 연결할까요?') && weatherSheetSource.includes('연결하지 않아도 다른 기능은 그대로 사용할 수 있어요.'), 'weather consent UI is missing optional-connection guidance')
  assert(weatherConnectionSource.includes('navigator.geolocation.getCurrentPosition') && /const permissionRequest = requestPermission\(\)[\s\S]{0,120}const currentProfile = await getOnboardingProfile\(userId\)/.test(weatherConnectionSource), 'weather permission is not requested directly from the user action')
  assert(onboardingPageSource.includes('connectWeatherData(user.id)') && !onboardingPageSource.includes('weatherConnected: !profile.weatherConnected'), 'Onboarding still toggles weather consent without requesting permission')
  assert(androidManifestSource.includes('android.permission.ACCESS_COARSE_LOCATION') && androidManifestSource.includes('android.permission.ACCESS_FINE_LOCATION'), 'Android location permissions are not declared for WebView geolocation')
  assert(weatherConnectionSource.includes('usesAndroidNativeLocation()') && weatherConnectionSource.includes('androidLocationBridge.requestCurrentPosition()'), 'Android weather permission does not use the native location bridge')
  assert(androidMainActivitySource.includes('registerPlugin(EzkinLocationPlugin.class)'), 'Android location bridge is not registered')
  assert(androidLocationPluginSource.includes('requestPermissionForAliases') && androidLocationPluginSource.includes('LocationManager'), 'Android location bridge does not request runtime permission and resolve a device location')
  assert(androidLocationPluginSource.includes('positionResult(location)') && androidLocationPluginSource.includes('location.getLatitude()') && androidLocationPluginSource.includes('location.getLongitude()'), 'Android location bridge does not return transient coordinates')
  assert(!/SharedPreferences|sessionStorage|Log\./.test(androidLocationPluginSource), 'Android location bridge persists or logs coordinates')
  assert(!/localStorage|sessionStorage|console\./.test(weatherConnectionSource), 'weather consent persists or logs transient coordinates')
  assert(weatherDataSource.includes('https://api.open-meteo.com/v1/forecast') && /temperature_2m,relative_humidity_2m,uv_index/.test(weatherDataSource) && /timezone: 'auto'/.test(weatherDataSource), 'weather data service does not use the Open-Meteo current contract')
  assert(androidLocationBridgeSource.includes("registerPlugin<EzkinLocationPlugin>('EzkinLocation')") && weatherDataSource.includes('androidLocationBridge.requestCurrentPosition()') && weatherDataSource.includes("Capacitor.getPlatform() === 'android'"), 'weather data service does not use the single transient native Android bridge')
  assert(/refreshCurrentWeatherData[\s\S]{0,300}if \(isDemoPersonaUser\(userId\)\) return undefined[\s\S]{0,300}positionRequester/.test(weatherDataSource), 'Demo persona guard does not precede real location access')
  assert(weatherDataSource.includes('CapacitorWebFetch') && weatherDataSource.includes('WEATHER_REQUEST_TIMEOUT_MS = 3_000') && !weatherDataSource.includes('console.'), 'Android weather request logging or timeout is incorrect')
  assert(quickCareServiceSource.includes("apiRequest<unknown>('/quick-care/safety-check'") && !sosPageSource.includes('fetch('), 'Quick Care does not follow UI → service → api client')
  assert(sosServiceSource.includes('import.meta.env.VITE_USE_QUICK_CARE_API') && !sosServiceSource.includes('VITE_USE_MOCK_API'), 'Quick Care mode selection still depends on the global mock flag')
  assert(careContextServiceSource.includes('import.meta.env.VITE_USE_CARE_CONTEXT_API') && !careContextServiceSource.includes('VITE_USE_MOCK_API'), 'Care Context mode selection depends on the global mock flag')
  assert(careContextServiceSource.includes("apiRequest<unknown>('/care-contexts/preview'") && !briefingServiceSource.includes("fetch(`${API_BASE_URL}/care-contexts"), 'Care Context does not follow service to api client architecture')
  assert(careContextServiceSource.includes('CARE_CONTEXT_TIMEOUT_MS = 1_500') && careContextServiceSource.includes('controller.abort()'), 'Care Context does not enforce the 1.5 second abort timeout')
  assert(homePageSource.indexOf('setBriefing(briefingData)') < homePageSource.lastIndexOf('applyCareContextToBriefing(briefingData)'), 'Home waits for Care Context before rendering the base Briefing')
  assert(sosPageSource.includes('지금은 답변을 준비하지 못했어요.\\n잠시 후 다시 시도해 주세요.') && sosPageSource.includes('failedRequest.message'), 'SOS safety-check failure does not preserve the polished retryable message')

  assert(backNavigation.resolveAndroidBackAction({ pathname: '/shelf/ceramide-cream', previousPathname: '/shelf', canGoBack: true }) === 'back', 'product detail back did not use route history')
  assert(backNavigation.resolveAndroidBackAction({ pathname: '/settings', previousPathname: '/home', canGoBack: true }) === 'back', 'settings back did not use route history')
  assert(backNavigation.resolveAndroidBackAction({ pathname: '/briefing', previousPathname: '/', canGoBack: true }) === 'home', 'direct briefing back did not fall back to home')
  assert(backNavigation.resolveAndroidBackAction({ pathname: '/scan', canGoBack: false }) === 'home', 'direct scan back did not fall back to home')
  assert(backNavigation.resolveAndroidBackAction({ pathname: '/home', previousPathname: '/shelf', canGoBack: true }) === 'stay', 'home back did not stay in the app')
  assert(backNavigation.resolveAndroidBackAction({ pathname: '/onboarding', canGoBack: false }) === 'stay', 'onboarding first step did not stay in the app')

  console.log('PASS A/B/C map to A1/B1/C1 through one persona model')
  console.log('PASS Demo OFF fresh onboarding, completed-user restore, and Persona isolation')
  console.log('PASS A disconnected, B building baseline, C established baseline')
  console.log('PASS persona-specific Health, Environment, Shelf, Report, Pattern, and SOS data')
  console.log('PASS A/B/C isolation and scenario persistence')
  console.log('PASS demo env flag true/false contract')
  console.log('PASS demo-only notification test controls and normal notification settings')
  console.log('PASS existing non-demo user id and data retention')
  console.log('PASS scan/product recognition regression')
  console.log('PASS Android back route history, deep-link fallback, and home stay decisions')
  console.log('PASS API-shaped Report and Pattern Analysis remain separate')
  console.log('PASS final diet enum, lossless legacy migration, native actions, and shared daily record')
  console.log('PASS fast scan countdown, inline/reopen Pattern flow, Environment columns, and Watch contracts')
  console.log('PASS Quick Care live safety gate, mock continuation, stop/continue actions, and retryable failure')
  console.log('PASS Care Context dedicated flag, typed API, Briefing factors, missing data, and non-blocking failure')
  console.log('PASS normal Open-Meteo mapping, shared Environment inputs, provider failure, coordinate privacy, and Demo isolation')
} finally {
  await server.close()
}
