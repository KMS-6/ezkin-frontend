import { useEffect, useState } from 'react'
import { Bell, BellOff, Check, Send } from 'lucide-react'
import { AppHeader } from '../components/AppHeader'
import { PageContainer } from '../components/PageContainer'
import { PrimaryButton, SecondaryButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import {
  disablePushNotifications,
  enablePushNotifications,
  getNotificationPermission,
  hasPushSubscription,
  showBriefingPreview,
  showMealPreview,
  type NotificationPermissionState,
} from '../services/notificationService'

export function NotificationSettingsPage() {
  const [permission, setPermission] = useState<NotificationPermissionState>(() => getNotificationPermission())
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    void hasPushSubscription().then(setSubscribed).catch(() => setSubscribed(false))
  }, [])

  const enable = async () => {
    setBusy(true)
    setMessage(null)
    try {
      await enablePushNotifications()
      setPermission(getNotificationPermission())
      setSubscribed(true)
      setMessage('필요한 순간에만 조용히 알려드릴게요.')
    } catch (error) {
      setPermission(getNotificationPermission())
      setMessage(error instanceof Error ? error.message : '알림을 연결하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  const disable = async () => {
    setBusy(true)
    setMessage(null)
    try {
      await disablePushNotifications()
      setSubscribed(false)
      setMessage('알림을 껐어요. 앱은 그대로 사용할 수 있어요.')
    } catch {
      setMessage('알림 설정을 변경하지 못했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setBusy(false)
    }
  }

  const denied = permission === 'denied'
  const unsupported = permission === 'unsupported'

  return (
    <>
      <AppHeader title="알림 설정" backTo="/settings" />
      <PageContainer className="pt-3">
        <section className="pt-2 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-[20px] bg-ez-primary-soft text-ez-primary">
            {denied ? <BellOff size={25} aria-hidden="true" /> : <Bell size={25} aria-hidden="true" />}
          </span>
          <h1 className="mt-4 text-[21px] font-bold tracking-[-0.03em] text-ez-text">
            찾으러 오지 않아도 괜찮아요
          </h1>
          <p className="mx-auto mt-2 max-w-[310px] text-[13px] leading-6 text-ez-secondary">
            아침 브리핑과 식사 기록처럼 필요한 순간에만 EZkin이 먼저 알려드려요.
          </p>
        </section>

        <Card className="mt-6 overflow-hidden">
          <NotificationRow title="아침 하루 브리핑" description="오늘 피부 상태와 꼭 필요한 케어" />
          <NotificationRow title="점심 · 저녁 식사" description="알림에서 바로 들어와 한 번 탭으로 기록" />
        </Card>

        <p className="mt-4 text-center text-[11px] leading-5 text-ez-muted">
          물 섭취, 루틴 등 추가 알림은 보내지 않아요.<br />알림을 허용하지 않아도 모든 기능을 사용할 수 있어요.
        </p>

        {message && (
          <div className="mt-4 rounded-[14px] bg-ez-primary-soft px-4 py-3 text-center text-[12px] font-medium text-ez-primary-dark" role="status">
            {message}
          </div>
        )}

        {denied ? (
          <Card className="mt-5 p-4 text-center">
            <p className="text-[13px] font-semibold text-ez-text">브라우저에서 알림이 차단되어 있어요</p>
            <p className="mt-1 text-[12px] leading-5 text-ez-muted">주소창의 사이트 설정에서 알림을 허용하면 다시 연결할 수 있어요.</p>
          </Card>
        ) : unsupported ? (
          <Card className="mt-5 p-4 text-center text-[13px] text-ez-muted">이 브라우저에서는 Web Push를 지원하지 않아요.</Card>
        ) : subscribed ? (
          <div className="mt-5 grid gap-2">
            <SecondaryButton fullWidth onClick={() => void showBriefingPreview()} icon={<Send size={16} aria-hidden="true" />}>
              브리핑 알림 미리보기
            </SecondaryButton>
            <div className="grid grid-cols-2 gap-2">
              <SecondaryButton onClick={() => void showMealPreview('lunch')}>점심 알림 보기</SecondaryButton>
              <SecondaryButton onClick={() => void showMealPreview('dinner')}>저녁 알림 보기</SecondaryButton>
            </div>
            <button type="button" onClick={() => void disable()} disabled={busy} className="min-h-11 text-[12px] font-semibold text-ez-muted">
              알림 끄기
            </button>
          </div>
        ) : (
          <PrimaryButton fullWidth className="mt-5" onClick={() => void enable()} disabled={busy} icon={<Bell size={17} aria-hidden="true" />}>
            {busy ? '연결하는 중...' : '알림 받기'}
          </PrimaryButton>
        )}
      </PageContainer>
    </>
  )
}

function NotificationRow({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-[70px] items-center gap-3 px-4 py-3 [&+&]:border-t [&+&]:border-ez-border/70">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#e8f7f1] text-ez-success"><Check size={15} strokeWidth={2.5} /></span>
      <div>
        <p className="text-[13px] font-semibold text-ez-text">{title}</p>
        <p className="mt-0.5 text-[11px] text-ez-muted">{description}</p>
      </div>
    </div>
  )
}
