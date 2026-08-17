import { Capacitor, registerPlugin } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { PluginListenerHandle } from '@capacitor/core'
import { getTodayBriefing } from './briefingService'
import { getTodayRoutineForUser } from './productService'
import { saveDailyQuickInput } from './quickInputService'
import type {
  AndroidNotificationPermissionStatus,
  PendingNavigation,
  PendingQuickInputs,
} from '../types/androidNotification'
import { getTodayDateKey } from '../utils/appDateTime'

const CHANNEL_ID = 'ezkin-daily-care'
const MORNING_NOTIFICATION_ID = 2101
const WEEKLY_SCAN_NOTIFICATION_ID = 2301
const TEST_DELAY_MS = 4_000

interface EzkinNotificationNativePlugin {
  ensureNotificationChannel(): Promise<void>
  scheduleEveningQuickInputTest(options: {
    userId: string
    date: string
    delayMs: number
  }): Promise<void>
  consumePendingQuickInputs(): Promise<PendingQuickInputs>
  consumePendingNavigation(): Promise<PendingNavigation>
}

const EzkinNotificationNative = registerPlugin<EzkinNotificationNativePlugin>('EzkinNotification')

export function isAndroidNotificationAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

function mapPermission(display: string): AndroidNotificationPermissionStatus {
  if (display === 'granted') return 'granted'
  if (display === 'denied') return 'denied'
  return 'prompt'
}

export async function getNotificationPermissionStatus(): Promise<AndroidNotificationPermissionStatus> {
  if (!isAndroidNotificationAvailable()) return 'unsupported'
  const permission = await LocalNotifications.checkPermissions()
  return mapPermission(permission.display)
}

export async function requestNotificationPermission(): Promise<AndroidNotificationPermissionStatus> {
  if (!isAndroidNotificationAvailable()) return 'unsupported'

  const current = await getNotificationPermissionStatus()
  if (current === 'granted' || current === 'denied') return current

  const permission = await LocalNotifications.requestPermissions()
  return mapPermission(permission.display)
}

async function requireNotificationPermission(): Promise<void> {
  const current = await getNotificationPermissionStatus()
  const next = current === 'prompt' ? await requestNotificationPermission() : current
  if (next !== 'granted') throw new Error('알림 권한을 허용해주세요.')
}

async function ensureNotificationChannel(): Promise<void> {
  if (!isAndroidNotificationAvailable()) return
  await EzkinNotificationNative.ensureNotificationChannel()
}

function scheduledAt(): Date {
  return new Date(Date.now() + TEST_DELAY_MS)
}

export async function sendMorningBriefingTestNotification(userId: string): Promise<void> {
  await requireNotificationPermission()
  await ensureNotificationChannel()

  const [briefing, routine] = await Promise.all([
    getTodayBriefing(userId),
    getTodayRoutineForUser(userId),
  ])
  const pausedNames = routine.paused.map(({ product }) => product.name)
  const careNames = routine.am.map(({ product }) => product.name)
  const collapsedRoutine = careNames.length > 0
    ? careNames.join(' → ')
    : '보습·진정 중심으로 가볍게 관리해요'
  const routineLines = careNames.length > 0
    ? careNames.map((name) => `• ${name}`)
    : ['• 보습·진정 중심으로 단순하게 관리해요']
  const pauseLine = pausedNames.length > 0
    ? `오늘은 ${pausedNames.join(' · ')} 쉬어가요.`
    : '오늘은 자극적인 단계는 쉬어가요.'

  await LocalNotifications.schedule({
    notifications: [{
      id: MORNING_NOTIFICATION_ID,
      title: '오늘 아침은 이 순서로 발라요 🌿',
      body: collapsedRoutine,
      largeBody: `오늘 아침 케어\n\n${routineLines.join('\n')}\n\n${pauseLine}\n\n${briefing.summary}`,
      summaryText: '오늘 아침 케어',
      channelId: CHANNEL_ID,
      smallIcon: 'ic_stat_ezkin',
      iconColor: '#6C4CCF',
      foreground: true,
      schedule: { at: scheduledAt() },
      isExactNotification: false,
      extra: { route: '/briefing', kind: 'morning-briefing' },
    }],
  })
}

export async function sendEveningQuickInputTestNotification(userId: string): Promise<void> {
  await requireNotificationPermission()
  await ensureNotificationChannel()
  await EzkinNotificationNative.scheduleEveningQuickInputTest({
    userId,
    date: getTodayDateKey(userId),
    delayMs: TEST_DELAY_MS,
  })
}

export async function sendWeeklyScanTestNotification(): Promise<void> {
  await requireNotificationPermission()
  await ensureNotificationChannel()

  await LocalNotifications.schedule({
    notifications: [{
      id: WEEKLY_SCAN_NOTIFICATION_ID,
      title: '이번 주 피부 변화를 확인해볼까요? 📷',
      body: '세안 후 자연광에서 피부 사진을 찍어주세요.',
      largeBody: '변화가 궁금할 때만 확인해도 괜찮아요. 세안 후 자연광에서 정면 사진을 찍어주세요.',
      summaryText: '주간 피부 스캔',
      channelId: CHANNEL_ID,
      smallIcon: 'ic_stat_ezkin',
      iconColor: '#6C4CCF',
      foreground: true,
      schedule: { at: scheduledAt() },
      isExactNotification: false,
      extra: { route: '/scan', kind: 'weekly-scan' },
    }],
  })
}

export async function synchronizePendingQuickInputs(): Promise<PendingQuickInputs | null> {
  if (!isAndroidNotificationAvailable()) return null
  const pending = await EzkinNotificationNative.consumePendingQuickInputs()
  if (!pending.userId) return null

  if (pending.waterChoice || pending.dietChoice) {
    await saveDailyQuickInput(
      pending.userId,
      {
        ...(pending.waterChoice ? { waterChoice: pending.waterChoice } : {}),
        ...(pending.dietChoice ? { dietChoice: pending.dietChoice } : {}),
        ...(pending.createdAt ? { createdAt: pending.createdAt } : {}),
      },
      pending.date,
    )
  }
  return pending
}

export async function consumePendingNotificationRoute(): Promise<string | null> {
  if (!isAndroidNotificationAvailable()) return null
  const pending = await EzkinNotificationNative.consumePendingNavigation()
  return pending.route?.startsWith('/') ? pending.route : null
}

export async function addNotificationTapListener(
  listener: (route: string) => void,
): Promise<PluginListenerHandle | null> {
  if (!isAndroidNotificationAvailable()) return null

  return LocalNotifications.addListener('localNotificationActionPerformed', ({ actionId, notification }) => {
    const extra = notification.extra as { route?: unknown } | undefined
    if (actionId === 'tap' && typeof extra?.route === 'string' && extra.route.startsWith('/')) {
      listener(extra.route)
    }
  })
}
