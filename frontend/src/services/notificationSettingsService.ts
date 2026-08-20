import { apiRequest } from './apiClient'
import { isDemoPersonaUser } from '../utils/appDateTime'

const STORAGE_KEY = 'ezkin:notification-settings'

export interface NotificationSettings {
  morningBriefingEnabled: boolean
}

function readSettings(): Record<string, NotificationSettings> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, NotificationSettings>
  } catch {
    return {}
  }
}

export function getNotificationSettings(userId: string): NotificationSettings {
  return readSettings()[userId] ?? { morningBriefingEnabled: true }
}

export async function saveNotificationSettings(
  userId: string,
  settings: NotificationSettings,
): Promise<NotificationSettings> {
  if (
    import.meta.env.VITE_USE_NOTIFICATION_SETTINGS_API === 'true'
    && !isDemoPersonaUser(userId)
  ) {
    try {
      const response = await apiRequest<{ morning_briefing_enabled: boolean }>('/notifications/settings', {
        method: 'PATCH',
        body: JSON.stringify({ morning_briefing_enabled: settings.morningBriefingEnabled }),
      })
      settings = { morningBriefingEnabled: response.morning_briefing_enabled }
    } catch {
      // 데모 설정은 로컬에 먼저 보존하고 서버가 다시 연결되면 재동기화합니다.
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readSettings(), [userId]: settings }))
  return settings
}
