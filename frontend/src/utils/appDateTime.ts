import { getMockPersona } from '../mocks/personas'
import type { RoutinePeriod } from '../types/product'

const DEMO_DATE_KEY = '2026-08-15'
const DEMO_DATE_LABEL = '8월 15일'
const DEMO_GREETING = '좋은 아침이에요'
const WEEKDAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'] as const

export function isDemoPersonaUser(userId?: string): boolean {
  return Boolean(userId && getMockPersona(userId))
}

export function getDeviceLocalDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getTodayDateKey(userId: string, now = new Date()): string {
  return isDemoPersonaUser(userId) ? DEMO_DATE_KEY : getDeviceLocalDateKey(now)
}

export function getTodayDateLabel(userId?: string, now = new Date()): string {
  if (isDemoPersonaUser(userId)) return DEMO_DATE_LABEL
  return `${now.getMonth() + 1}월 ${now.getDate()}일 · ${WEEKDAYS[now.getDay()]}`
}

export function getCurrentGreeting(userId?: string, now = new Date()): string {
  if (isDemoPersonaUser(userId)) return DEMO_GREETING
  const hour = now.getHours()
  if (hour < 12) return '좋은 아침이에요'
  if (hour < 18) return '좋은 오후예요'
  return '편안한 저녁이에요'
}

export function getCurrentRoutinePeriod(userId?: string, now = new Date()): RoutinePeriod {
  if (isDemoPersonaUser(userId)) return 'am'
  return now.getHours() < 12 ? 'am' : 'pm'
}

export function getScanTimestamp(userId?: string, now = new Date()): string {
  const persona = userId ? getMockPersona(userId) : null
  return persona?.skin_scan.captured_at ?? now.toISOString()
}
