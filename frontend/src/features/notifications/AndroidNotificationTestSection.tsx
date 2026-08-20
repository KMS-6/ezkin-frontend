import { useEffect, useState } from 'react'
import { Bell, CalendarClock, Check, ScanFace, Sunrise } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { isDemoScenarioEnabled } from '../../services/demoScenarioService'
import {
  getNotificationPermissionStatus,
  isNotificationAvailable,
  requestNotificationPermission,
  sendEveningQuickInputTestNotification,
  sendMorningBriefingTestNotification,
  sendWeeklyScanTestNotification,
} from '../../services/androidNotificationService'
import type { AndroidNotificationPermissionStatus } from '../../types/androidNotification'
import { getNotificationSettings, saveNotificationSettings } from '../../services/notificationSettingsService'

interface AndroidNotificationTestSectionProps {
  userId: string
}

type TestKind = 'morning' | 'evening' | 'scan'

const permissionLabels: Record<AndroidNotificationPermissionStatus, string> = {
  prompt: '허용 안 됨',
  granted: '허용됨',
  denied: '허용 안 됨',
  unsupported: '이 환경에서는 사용 불가',
}

export function AndroidNotificationTestSection({ userId }: AndroidNotificationTestSectionProps) {
  const showTestControls = isDemoScenarioEnabled()
  const isAvailable = isNotificationAvailable()
  const [permission, setPermission] = useState<AndroidNotificationPermissionStatus>(
    isAvailable ? 'prompt' : 'unsupported',
  )
  const [busy, setBusy] = useState<'permission' | TestKind | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [morningEnabled, setMorningEnabled] = useState(
    () => getNotificationSettings(userId).morningBriefingEnabled,
  )

  useEffect(() => {
    let isActive = true
    void getNotificationPermissionStatus().then((status) => {
      if (isActive) setPermission(status)
    })
    return () => {
      isActive = false
    }
  }, [])

  const handlePermission = async () => {
    setBusy('permission')
    setFeedback(null)
    try {
      const status = await requestNotificationPermission()
      setPermission(status)
      setFeedback(status === 'granted' ? '알림을 받을 수 있어요.' : '기기 설정에서 알림을 허용해주세요.')
    } catch {
      setFeedback('알림 권한을 확인하지 못했어요.')
    } finally {
      setBusy(null)
    }
  }

  const handleTest = async (kind: TestKind) => {
    setBusy(kind)
    setFeedback(null)
    try {
      if (kind === 'morning') await sendMorningBriefingTestNotification(userId)
      if (kind === 'evening') await sendEveningQuickInputTestNotification(userId)
      if (kind === 'scan') await sendWeeklyScanTestNotification()
      setPermission('granted')
      setFeedback('약 4초 뒤 알림이 도착해요.')
    } catch (error) {
      setPermission(await getNotificationPermissionStatus())
      setFeedback(error instanceof Error ? error.message : '알림을 보내지 못했어요.')
    } finally {
      setBusy(null)
    }
  }

  const isDisabled = !isAvailable || busy !== null

  const handleMorningSetting = async () => {
    if (busy !== null) return
    const next = !morningEnabled
    setBusy('morning')
    setFeedback(null)
    try {
      const saved = await saveNotificationSettings(userId, { morningBriefingEnabled: next })
      setMorningEnabled(saved.morningBriefingEnabled)
      setFeedback(saved.morningBriefingEnabled ? '아침 브리핑 알림을 켰어요.' : '아침 브리핑 알림을 껐어요.')
    } catch {
      setFeedback('알림 설정을 저장하지 못했어요.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="mt-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[16px] font-bold text-ez-text">알림</h2>
        <span className={permission === 'granted'
          ? 'inline-flex items-center gap-1 text-[11px] font-semibold text-ez-success'
          : 'text-[11px] font-medium text-ez-muted'}>
          {permission === 'granted' && <Check size={12} strokeWidth={2.5} aria-hidden="true" />}
          {permissionLabels[permission]}
        </span>
      </div>

      <Card className="mt-3 overflow-hidden">
        <NotificationActionRow
          icon={<Bell size={17} aria-hidden="true" />}
          title={permission === 'granted' ? '알림 권한 허용됨' : '알림 권한 허용'}
          description={isAvailable ? '버튼을 눌렀을 때만 권한을 요청해요.' : 'Android 앱 또는 PWA에서 사용할 수 있어요.'}
          disabled={!isAvailable || busy !== null || permission === 'granted'}
          busy={busy === 'permission'}
          actionLabel={permission === 'granted' ? '허용됨' : '허용'}
          onClick={() => void handlePermission()}
        />
        <NotificationActionRow
          icon={<Sunrise size={17} aria-hidden="true" />}
          title="아침 브리핑 받기"
          description="하루에 한 번, 필요한 케어만 알려드려요."
          disabled={busy !== null}
          busy={busy === 'morning'}
          actionLabel={morningEnabled ? '켜짐' : '꺼짐'}
          onClick={() => void handleMorningSetting()}
        />
        {showTestControls && (
          <>
            <NotificationActionRow
              icon={<Sunrise size={17} aria-hidden="true" />}
              title="아침 브리핑 알림"
              description="펼치면 오늘 루틴까지 보여요."
              disabled={isDisabled}
              busy={busy === 'morning'}
              onClick={() => void handleTest('morning')}
            />
            <NotificationActionRow
              icon={<CalendarClock size={17} aria-hidden="true" />}
              title="저녁 기록 알림"
              description="물과 식단을 알림에서 바로 선택해요."
              disabled={isDisabled}
              busy={busy === 'evening'}
              onClick={() => void handleTest('evening')}
            />
            <NotificationActionRow
              icon={<ScanFace size={17} aria-hidden="true" />}
              title="주간 피부 스캔 알림"
              description="알림을 누르면 피부 스캔으로 이동해요."
              disabled={isDisabled}
              busy={busy === 'scan'}
              onClick={() => void handleTest('scan')}
            />
          </>
        )}
      </Card>

      {feedback && (
        <p className="mt-2 px-1 text-[11px] font-medium text-ez-muted" role="status">
          {feedback}
        </p>
      )}
    </section>
  )
}

function NotificationActionRow({
  icon,
  title,
  description,
  disabled,
  busy,
  actionLabel = '테스트',
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description?: string
  disabled: boolean
  busy: boolean
  actionLabel?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="flex min-h-[68px] w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-ez-primary-soft/35 disabled:cursor-not-allowed disabled:opacity-55 [&+&]:border-t [&+&]:border-ez-border/70"
      disabled={disabled}
      onClick={onClick}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-ez-primary-soft text-ez-primary">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-ez-text">{title}</span>
        {description && (
          <span className="mt-0.5 block text-[11px] font-normal text-ez-muted">{description}</span>
        )}
      </span>
      <span className="text-[11px] font-semibold text-ez-primary">{busy ? '준비 중' : actionLabel}</span>
    </button>
  )
}
