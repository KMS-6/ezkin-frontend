import { useEffect } from 'react'
import { Check, CloudSun, LoaderCircle, X } from 'lucide-react'
import { PrimaryButton, SecondaryButton } from '../../../components/ui/Button'

interface WeatherConnectionSheetProps {
  connected: boolean
  isBusy: boolean
  error: string | null
  onClose: () => void
  onConnect: () => void
  onDisconnect: () => void
}

export function WeatherConnectionSheet({
  connected,
  isBusy,
  error,
  onClose,
  onConnect,
  onDisconnect,
}: WeatherConnectionSheetProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isBusy) onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isBusy, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#191525]/25 sm:items-center sm:p-4" role="presentation" onMouseDown={() => !isBusy && onClose()}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="weather-connection-title"
        className="w-full max-w-[430px] rounded-t-[24px] border border-ez-border bg-ez-bg p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-[0_-8px_40px_rgba(46,34,77,0.12)] sm:rounded-[24px]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-ez-primary">날씨 데이터</p>
          <button type="button" onClick={onClose} disabled={isBusy} className="grid size-10 place-items-center rounded-full text-ez-muted hover:bg-ez-primary-soft" aria-label="날씨 데이터 관리 닫기">
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        <div className="pt-3">
          <span className={`grid size-12 place-items-center rounded-[16px] ${connected ? 'bg-[#eaf8f2] text-ez-success' : 'bg-ez-primary-soft text-ez-primary'}`}>
            {connected ? <Check size={22} aria-hidden="true" /> : <CloudSun size={22} aria-hidden="true" />}
          </span>
          <h2 id="weather-connection-title" className="mt-4 text-[19px] font-bold tracking-[-0.025em] text-ez-text">
            {connected ? '날씨 데이터가 연결됐어요.' : '날씨 데이터를 연결할까요?'}
          </h2>
          <p className="mt-2 text-[13px] leading-5 text-ez-muted">
            {connected ? '현재 위치의 기온 · 습도 · UV를 함께 보고 있어요.' : '현재 위치를 허용하면 기온 · 습도 · UV를 반영해요.'}
          </p>
          <p className="mt-3 text-[11px] leading-5 text-ez-muted">연결하지 않아도 다른 기능은 그대로 사용할 수 있어요.</p>
          {error && <p className="mt-3 text-[12px] text-ez-danger" role="alert">{error}</p>}

          {connected ? (
            <SecondaryButton type="button" fullWidth className="mt-5" onClick={onDisconnect} disabled={isBusy}>
              {isBusy ? '연결 끊는 중' : '연결 끊기'}
            </SecondaryButton>
          ) : (
            <>
              <PrimaryButton type="button" fullWidth className="mt-5" onClick={onConnect} disabled={isBusy} icon={isBusy ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : undefined}>
                {isBusy ? '연결하고 있어요' : '날씨 데이터 연결'}
              </PrimaryButton>
              <SecondaryButton type="button" fullWidth className="mt-2" onClick={onClose} disabled={isBusy}>나중에</SecondaryButton>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
