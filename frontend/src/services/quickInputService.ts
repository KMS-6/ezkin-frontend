import type {
  DailyQuickInput,
  DailyManualMetricPayload,
  DietChoice,
  WaterChoice,
} from '../types/androidNotification'
import { QUICK_INPUT_SYNCED_EVENT } from '../types/androidNotification'
import { getTodayDateKey, isDemoPersonaUser } from '../utils/appDateTime'
import { apiRequest } from './apiClient'

const QUICK_INPUT_STORAGE_KEY = 'ezkin:daily-quick-inputs'
const LEGACY_WATER_STORAGE_KEY = 'ezkin:water-choices'
const LEGACY_DIET_STORAGE_KEY = 'ezkin:diet-choices'

type DailyQuickInputPatch = Pick<DailyQuickInput, 'waterChoice' | 'dietChoice'> & {
  createdAt?: string
}

export interface QuickInputTransport {
  save(payload: DailyManualMetricPayload & { date: string }): Promise<void>
}

export function isManualMetricsApiEnabled(
  value = import.meta.env.VITE_USE_MANUAL_METRICS_API,
): boolean {
  return value === 'true'
}

const backendQuickInputTransport: QuickInputTransport = {
  async save(payload) {
    if (!payload.water_intake_level) {
      // 현재 Backend 계약은 water_intake_level을 필수로 요구합니다.
      return
    }
    await apiRequest('/daily-metrics/manual', {
      method: 'POST',
      body: JSON.stringify({
        metric_date: payload.date,
        water_intake_level: payload.water_intake_level,
        ...(payload.diet_flag ? { diet_flag: payload.diet_flag } : {}),
      }),
    })
  },
}

type StoredDailyQuickInput = Omit<DailyQuickInput, 'waterChoice' | 'dietChoice'> & {
  waterChoice?: unknown
  dietChoice?: unknown
}

function recordKey(userId: string, date: string): string {
  return `${userId}:${date}`
}

function readRecord<T>(key: string): Record<string, T> {
  const saved = localStorage.getItem(key)
  if (!saved) return {}

  try {
    return JSON.parse(saved) as Record<string, T>
  } catch {
    return {}
  }
}

function readDailyQuickInputs(): Record<string, StoredDailyQuickInput> {
  return readRecord<StoredDailyQuickInput>(QUICK_INPUT_STORAGE_KEY)
}

function validWaterChoice(value: unknown): value is WaterChoice {
  return value === 'under_3' || value === '3_to_5' || value === 'over_5'
}

function normalizeStoredDietChoice(value: unknown): DietChoice | undefined {
  if (value === 'normal' || value === 'spicy' || value === 'late_night_meal') return value
  if (value === 'usual') return 'normal'
  return undefined
}

function getLegacyChoices(userId: string): DailyQuickInputPatch {
  const legacyWater = readRecord<unknown>(LEGACY_WATER_STORAGE_KEY)[userId]
  const legacyDiet = readRecord<unknown>(LEGACY_DIET_STORAGE_KEY)[userId]
  const dietChoice = normalizeStoredDietChoice(legacyDiet)

  return {
    ...(validWaterChoice(legacyWater) ? { waterChoice: legacyWater } : {}),
    ...(dietChoice ? { dietChoice } : {}),
  }
}

function migrateLegacyTodayRecord(userId: string, date: string): DailyQuickInput | null {
  const records = readDailyQuickInputs()
  const key = recordKey(userId, date)
  const existing = records[key]
  const legacy = getLegacyChoices(userId)
  const waterChoice = validWaterChoice(existing?.waterChoice)
    ? existing.waterChoice
    : legacy.waterChoice
  const hasStoredDiet = existing && Object.hasOwn(existing, 'dietChoice')
  const dietChoice = hasStoredDiet
    ? normalizeStoredDietChoice(existing.dietChoice)
    : legacy.dietChoice

  if (!existing && !waterChoice && !dietChoice) return null
  if (existing?.waterChoice === waterChoice && existing?.dietChoice === dietChoice) {
    return existing as DailyQuickInput
  }

  const now = new Date().toISOString()
  const migrated: DailyQuickInput = {
    userId,
    date,
    createdAt: typeof existing?.createdAt === 'string' ? existing.createdAt : now,
    updatedAt: typeof existing?.updatedAt === 'string' ? existing.updatedAt : now,
    ...(waterChoice ? { waterChoice } : {}),
    ...(dietChoice ? { dietChoice } : {}),
  }
  localStorage.setItem(QUICK_INPUT_STORAGE_KEY, JSON.stringify({ ...records, [key]: migrated }))
  return migrated
}

function emitQuickInputSync(record: DailyQuickInput): void {
  if (
    typeof window !== 'undefined'
    && typeof window.dispatchEvent === 'function'
    && typeof CustomEvent !== 'undefined'
  ) {
    window.dispatchEvent(new CustomEvent(QUICK_INPUT_SYNCED_EVENT, { detail: record }))
  }
}

export function getTodayQuickInput(
  userId: string,
  date = getTodayDateKey(userId),
): DailyQuickInput | null {
  return migrateLegacyTodayRecord(userId, date)
}

export async function saveDailyQuickInput(
  userId: string,
  patch: DailyQuickInputPatch,
  date = getTodayDateKey(userId),
): Promise<DailyQuickInput> {
  const records = readDailyQuickInputs()
  const key = recordKey(userId, date)
  const existing = migrateLegacyTodayRecord(userId, date)
  const now = new Date().toISOString()
  const patchDietChoice = normalizeStoredDietChoice(patch.dietChoice)
  const next: DailyQuickInput = {
    userId,
    date,
    createdAt: existing?.createdAt ?? patch.createdAt ?? now,
    updatedAt: now,
    ...(existing?.waterChoice ? { waterChoice: existing.waterChoice } : {}),
    ...(existing?.dietChoice ? { dietChoice: existing.dietChoice } : {}),
    ...(patch.waterChoice ? { waterChoice: patch.waterChoice } : {}),
    ...(patchDietChoice ? { dietChoice: patchDietChoice } : {}),
  }

  localStorage.setItem(QUICK_INPUT_STORAGE_KEY, JSON.stringify({ ...records, [key]: next }))
  if (isManualMetricsApiEnabled() && !isDemoPersonaUser(userId)) {
    try {
      await syncDailyQuickInput(next, backendQuickInputTransport)
    } catch {
      // 사용자 입력은 기기에 보존하고, Backend 동기화는 연결 가능할 때 다시 시도합니다.
    }
  }
  emitQuickInputSync(next)
  return next
}

export function toDailyManualMetricPayload(input: DailyQuickInput): DailyManualMetricPayload {
  const waterMap = {
    under_3: 'under_3_glasses',
    '3_to_5': 'three_to_five_glasses',
    over_5: 'over_5_glasses',
  } as const

  return {
    ...(input.waterChoice ? { water_intake_level: waterMap[input.waterChoice] } : {}),
    ...(input.dietChoice ? { diet_flag: input.dietChoice } : {}),
  }
}

export async function syncDailyQuickInput(
  input: DailyQuickInput,
  transport: QuickInputTransport,
): Promise<void> {
  await transport.save({
    date: input.date,
    ...toDailyManualMetricPayload(input),
  })
}

export async function saveWaterChoice(
  userId: string,
  choice: WaterChoice,
  date = getTodayDateKey(userId),
): Promise<DailyQuickInput> {
  return saveDailyQuickInput(userId, { waterChoice: choice }, date)
}

export async function saveDietChoice(
  userId: string,
  choice: DietChoice,
  date = getTodayDateKey(userId),
): Promise<DailyQuickInput> {
  return saveDailyQuickInput(userId, { dietChoice: choice }, date)
}

export function getSavedWaterChoice(userId: string): WaterChoice | null {
  return getTodayQuickInput(userId)?.waterChoice ?? null
}

export function getSavedDietChoice(userId: string): DietChoice | null {
  return getTodayQuickInput(userId)?.dietChoice ?? null
}

function removeLegacyUserValue(key: string, userId: string): void {
  const values = readRecord<unknown>(key)
  if (!(userId in values)) return
  const next = { ...values }
  delete next[userId]
  localStorage.setItem(key, JSON.stringify(next))
}

export function clearDemoQuickInputs(userId: string): void {
  const records = readDailyQuickInputs()
  const next = Object.fromEntries(
    Object.entries(records).filter(([, record]) => record.userId !== userId),
  )
  localStorage.setItem(QUICK_INPUT_STORAGE_KEY, JSON.stringify(next))
  removeLegacyUserValue(LEGACY_WATER_STORAGE_KEY, userId)
  removeLegacyUserValue(LEGACY_DIET_STORAGE_KEY, userId)
}

export function clearDemoWaterChoice(userId: string): void {
  const records = readDailyQuickInputs()
  const next = Object.fromEntries(Object.entries(records).map(([key, record]) => {
    if (record.userId !== userId) return [key, record]
    const withoutWater = { ...record }
    delete withoutWater.waterChoice
    return [key, withoutWater]
  }))
  localStorage.setItem(QUICK_INPUT_STORAGE_KEY, JSON.stringify(next))
  removeLegacyUserValue(LEGACY_WATER_STORAGE_KEY, userId)
}

export function clearDemoDietChoice(userId: string): void {
  const records = readDailyQuickInputs()
  const next = Object.fromEntries(Object.entries(records).map(([key, record]) => {
    if (record.userId !== userId) return [key, record]
    const withoutDiet = { ...record }
    delete withoutDiet.dietChoice
    return [key, withoutDiet]
  }))
  localStorage.setItem(QUICK_INPUT_STORAGE_KEY, JSON.stringify(next))
  removeLegacyUserValue(LEGACY_DIET_STORAGE_KEY, userId)
}
