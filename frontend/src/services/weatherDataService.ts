import { Capacitor } from '@capacitor/core'
import { androidLocationBridge } from './androidLocationBridge'

export interface CurrentEnvironmentData {
  observedAt: string
  temperatureC?: number
  humidityPercent?: number
  uvIndex?: number
}

export interface TransientWeatherPosition {
  coords: {
    latitude: number
    longitude: number
  }
}

export interface WeatherDataServiceOptions {
  fetcher?: typeof fetch
  now?: () => Date
  position?: TransientWeatherPosition
  positionRequester?: () => Promise<TransientWeatherPosition>
}

interface StoredWeatherData {
  fetchedAt: string
  environment: CurrentEnvironmentData
}

interface OpenMeteoCurrentResponse {
  current?: {
    time?: unknown
    temperature_2m?: unknown
    relative_humidity_2m?: unknown
    uv_index?: unknown
  }
}

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast'
const WEATHER_STORAGE_PREFIX = 'ezkin:current-environment:'
const WEATHER_CACHE_TTL_MS = 30 * 60 * 1000
const WEATHER_REQUEST_TIMEOUT_MS = 3_000
const inFlightRequests = new Map<string, Promise<CurrentEnvironmentData | undefined>>()

function storageKey(userId: string): string {
  return `${WEATHER_STORAGE_PREFIX}${userId}`
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function isEnvironmentData(value: unknown): value is CurrentEnvironmentData {
  if (!value || typeof value !== 'object') return false
  const data = value as Record<string, unknown>
  return typeof data.observedAt === 'string'
    && (data.temperatureC === undefined || finiteNumber(data.temperatureC) !== undefined)
    && (data.humidityPercent === undefined || finiteNumber(data.humidityPercent) !== undefined)
    && (data.uvIndex === undefined || finiteNumber(data.uvIndex) !== undefined)
    && [data.temperatureC, data.humidityPercent, data.uvIndex].some((item) => item !== undefined)
}

function readStoredWeatherData(userId: string): StoredWeatherData | undefined {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return undefined
    const stored = JSON.parse(raw) as Partial<StoredWeatherData>
    if (typeof stored.fetchedAt !== 'string' || !isEnvironmentData(stored.environment)) return undefined
    return { fetchedAt: stored.fetchedAt, environment: stored.environment }
  } catch {
    return undefined
  }
}

function isFresh(stored: StoredWeatherData, now: Date): boolean {
  const fetchedAt = new Date(stored.fetchedAt).getTime()
  return Number.isFinite(fetchedAt) && now.getTime() - fetchedAt < WEATHER_CACHE_TTL_MS
}

function saveWeatherData(userId: string, environment: CurrentEnvironmentData, now: Date): void {
  const stored: StoredWeatherData = {
    fetchedAt: now.toISOString(),
    environment,
  }
  localStorage.setItem(storageKey(userId), JSON.stringify(stored))
}

async function requestCurrentPosition(): Promise<TransientWeatherPosition> {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    const result = await androidLocationBridge.requestCurrentPosition()
    if (
      result.status !== 'granted'
      || !Number.isFinite(result.latitude)
      || !Number.isFinite(result.longitude)
    ) throw new Error('Current location is unavailable.')

    return {
      coords: {
        latitude: result.latitude as number,
        longitude: result.longitude as number,
      },
    }
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Current location is unavailable.')
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10_000,
      maximumAge: 10 * 60 * 1000,
    })
  })
}

function getWeatherFetch(): typeof fetch {
  if (typeof window !== 'undefined') {
    const webFetch = (window as Window & { CapacitorWebFetch?: typeof fetch }).CapacitorWebFetch
    if (webFetch) return webFetch.bind(window)
  }
  return fetch
}

async function requestOpenMeteoWeather(
  position: TransientWeatherPosition,
  fetcher: typeof fetch,
  now: Date,
): Promise<CurrentEnvironmentData> {
  const params = new URLSearchParams({
    latitude: String(position.coords.latitude),
    longitude: String(position.coords.longitude),
    current: 'temperature_2m,relative_humidity_2m,uv_index',
    timezone: 'auto',
  })
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), WEATHER_REQUEST_TIMEOUT_MS)
  let response: Response
  try {
    response = await fetcher(`${OPEN_METEO_URL}?${params.toString()}`, {
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeoutId)
  }
  if (!response.ok) throw new Error('Weather provider request failed.')

  const payload = await response.json() as OpenMeteoCurrentResponse
  const current = payload.current
  const temperatureC = finiteNumber(current?.temperature_2m)
  const humidityPercent = finiteNumber(current?.relative_humidity_2m)
  const uvIndex = finiteNumber(current?.uv_index)
  if (temperatureC === undefined && humidityPercent === undefined && uvIndex === undefined) {
    throw new Error('Weather provider returned no current environment data.')
  }

  return {
    observedAt: typeof current?.time === 'string' ? current.time : now.toISOString(),
    ...(temperatureC !== undefined ? { temperatureC } : {}),
    ...(humidityPercent !== undefined ? { humidityPercent } : {}),
    ...(uvIndex !== undefined ? { uvIndex } : {}),
  }
}

export async function refreshCurrentWeatherData(
  userId: string,
  options: WeatherDataServiceOptions = {},
): Promise<CurrentEnvironmentData | undefined> {
  const now = options.now?.() ?? new Date()
  const position = options.position ?? await (options.positionRequester ?? requestCurrentPosition)()
  const environment = await requestOpenMeteoWeather(position, options.fetcher ?? getWeatherFetch(), now)
  saveWeatherData(userId, environment, now)
  return environment
}

export async function getCurrentWeatherData(
  userId: string,
  options: WeatherDataServiceOptions = {},
): Promise<CurrentEnvironmentData | undefined> {
  const now = options.now?.() ?? new Date()
  const stored = readStoredWeatherData(userId)
  const freshEnvironment = stored && isFresh(stored, now) ? stored.environment : undefined
  if (!freshEnvironment) {
    const pending = inFlightRequests.get(userId)
    if (!pending) {
      const request = refreshCurrentWeatherData(userId, options)
        .catch(() => undefined)
        .finally(() => inFlightRequests.delete(userId))
      inFlightRequests.set(userId, request)
    }
  }

  return freshEnvironment
}

export function clearCurrentWeatherData(userId: string): void {
  localStorage.removeItem(storageKey(userId))
  inFlightRequests.delete(userId)
}
