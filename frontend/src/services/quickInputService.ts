import type {
  DailyQuickInput,
  NotificationDietChoice,
  WaterChoice,
} from '../types/androidNotification'
import { QUICK_INPUT_SYNCED_EVENT } from '../types/androidNotification'

const QUICK_INPUT_STORAGE_KEY = 'ezkin:daily-quick-inputs'
const LEGACY_WATER_STORAGE_KEY = 'ezkin:water-choices'
const LEGACY_DIET_STORAGE_KEY = 'ezkin:diet-choices'

type DailyQuickInputPatch = Pick<DailyQuickInput, 'waterChoice' | 'dietChoice'> & {
  createdAt?: string
}

function localDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

function readDailyQuickInputs(): Record<string, DailyQuickInput> {
  return readRecord<DailyQuickInput>(QUICK_INPUT_STORAGE_KEY)
}

function validWaterChoice(value: unknown): value is WaterChoice {
  return value === 'under_3' || value === '3_to_5' || value === 'over_5'
}

function validDietChoice(value: unknown): value is NotificationDietChoice {
  return value === 'clean' || value === 'normal' || value === 'stimulating'
}

function getLegacyChoices(userId: string): DailyQuickInputPatch {
  const legacyWater = readRecord<unknown>(LEGACY_WATER_STORAGE_KEY)[userId]
  const legacyDiet = readRecord<unknown>(LEGACY_DIET_STORAGE_KEY)[userId]

  return {
    ...(validWaterChoice(legacyWater) ? { waterChoice: legacyWater } : {}),
    ...(legacyDiet === 'usual' ? { dietChoice: 'normal' as const } : {}),
    ...(legacyDiet === 'spicy' ? { dietChoice: 'stimulating' as const } : {}),
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
  const dietChoice = validDietChoice(existing?.dietChoice)
    ? existing.dietChoice
    : legacy.dietChoice

  if (!waterChoice && !dietChoice) return existing ?? null
  if (existing?.waterChoice === waterChoice && existing?.dietChoice === dietChoice) return existing

  const now = new Date().toISOString()
  const migrated: DailyQuickInput = {
    userId,
    date,
    createdAt: existing?.createdAt ?? now,
    updatedAt: existing?.updatedAt ?? now,
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
  date = localDateKey(),
): DailyQuickInput | null {
  return migrateLegacyTodayRecord(userId, date)
}

export async function saveDailyQuickInput(
  userId: string,
  patch: DailyQuickInputPatch,
  date = localDateKey(),
): Promise<DailyQuickInput> {
  const records = readDailyQuickInputs()
  const key = recordKey(userId, date)
  const existing = migrateLegacyTodayRecord(userId, date)
  const now = new Date().toISOString()
  const next: DailyQuickInput = {
    userId,
    date,
    createdAt: existing?.createdAt ?? patch.createdAt ?? now,
    updatedAt: now,
    ...(existing?.waterChoice ? { waterChoice: existing.waterChoice } : {}),
    ...(existing?.dietChoice ? { dietChoice: existing.dietChoice } : {}),
    ...(patch.waterChoice ? { waterChoice: patch.waterChoice } : {}),
    ...(patch.dietChoice ? { dietChoice: patch.dietChoice } : {}),
  }

  localStorage.setItem(QUICK_INPUT_STORAGE_KEY, JSON.stringify({ ...records, [key]: next }))
  emitQuickInputSync(next)
  return next
}

export async function saveWaterChoice(
  userId: string,
  choice: WaterChoice,
  date = localDateKey(),
): Promise<DailyQuickInput> {
  return saveDailyQuickInput(userId, { waterChoice: choice }, date)
}

export async function saveNotificationDietChoice(
  userId: string,
  choice: NotificationDietChoice,
  date = localDateKey(),
): Promise<DailyQuickInput> {
  return saveDailyQuickInput(userId, { dietChoice: choice }, date)
}

export function getSavedWaterChoice(userId: string): WaterChoice | null {
  return getTodayQuickInput(userId)?.waterChoice ?? null
}

export function getSavedNotificationDietChoice(userId: string): NotificationDietChoice | null {
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
    const withoutWater: DailyQuickInput = { ...record }
    delete withoutWater.waterChoice
    return [key, withoutWater]
  }))
  localStorage.setItem(QUICK_INPUT_STORAGE_KEY, JSON.stringify(next))
  removeLegacyUserValue(LEGACY_WATER_STORAGE_KEY, userId)
}

export function clearDemoNotificationDietChoice(userId: string): void {
  const records = readDailyQuickInputs()
  const next = Object.fromEntries(Object.entries(records).map(([key, record]) => {
    if (record.userId !== userId) return [key, record]
    const withoutDiet: DailyQuickInput = { ...record }
    delete withoutDiet.dietChoice
    return [key, withoutDiet]
  }))
  localStorage.setItem(QUICK_INPUT_STORAGE_KEY, JSON.stringify(next))
  removeLegacyUserValue(LEGACY_DIET_STORAGE_KEY, userId)
}
