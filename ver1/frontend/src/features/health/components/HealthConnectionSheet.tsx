import { useEffect, useState } from 'react'
import { Activity, Check, LoaderCircle, X } from 'lucide-react'
import { PrimaryButton, SecondaryButton } from '../../../components/ui/Button'
import type { HealthConnection } from '../../../types/healthConnection'

interface HealthConnectionSheetProps {
  connection: HealthConnection
  isBusy: boolean
  error: string | null
  onClose: () => void
  onConnect: () => void
  onDisconnect: () => void
}

export function HealthConnectionSheet({
  connection,
  isBusy,
  error,
  onClose,
  onConnect,
  onDisconnect,
}: HealthConnectionSheetProps) {
  const [isConfirmingDisconnect, setIsConfirmingDisconnect] = useState(false)
  const isConnected = connection.status === 'connected' || connection.status === 'limited'
  const connectedMetrics = [
    connection.availableMetrics.sleep ? '수면' : null,
    connection.availableMetrics.steps ? '걸음 · 활동' : null,
    connection.availableMetrics.hrv ? 'HRV' : null,
    connection.availableMetrics.activity ? '운동량' : null,
  ].filter((metric): metric is string => Boolean(metric))
  const visibleMetrics = isConnected ? connectedMetrics : ['수면', '걸음 · 활동', 'HRV', '운동량']

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#191525]/25 px-0 sm:items-center sm:p-4" role="presentation" onMouseDown={() => !isBusy && onClose()}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="health-connection-title"
        className="w-full max-w-[430px] rounded-t-[24px] border border-ez-border bg-ez-bg p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-[0_-8px_40px_rgba(46,34,77,0.12)] sm:rounded-[24px]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-ez-primary">생활 데이터</p>
          <button type="button" onClick={onClose} disabled={isBusy} className="grid size-10 place-items-center rounded-full text-ez-muted hover:bg-ez-primary-soft" aria-label="연결 관리 닫기">
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        {isConfirmingDisconnect ? (
          <div className="pt-3">
            <h2 id="health-connection-title" className="text-[19px] font-bold tracking-[-0.025em] text-ez-text">생활 데이터 연결을 끊을까요?</h2>
            <p className="mt-2 text-[13px] leading-5 text-ez-muted">Apple Health의 데이터는 지워지지 않고 EZkin과의 연결만 끊어요.</p>
            {error && <p className="mt-3 text-[12px] text-ez-danger" role="alert">{error}</p>}
            <PrimaryButton type="button" fullWidth className="mt-5 bg-ez-danger hover:bg-[#cf5964]" onClick={onDisconnect} disabled={isBusy} icon={isBusy ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : undefined}>
              {isBusy ? '연결 끊는 중' : '연결 끊기'}
            </PrimaryButton>
            <SecondaryButton type="button" fullWidth className="mt-2" onClick={() => setIsConfirmingDisconnect(false)} disabled={isBusy}>취소</SecondaryButton>
          </div>
        ) : (
          <div className="pt-3">
            <span className={`grid size-12 place-items-center rounded-[16px] ${isConnected ? 'bg-[#eaf8f2] text-ez-success' : 'bg-ez-primary-soft text-ez-primary'}`}>
              {isConnected ? <Check size={22} aria-hidden="true" /> : <Activity size={22} aria-hidden="true" />}
            </span>
            <h2 id="health-connection-title" className="mt-4 text-[19px] font-bold tracking-[-0.025em] text-ez-text">
              {isConnected ? '생활 데이터가 연결됐어요.' : '생활 데이터를 연결할까요?'}
            </h2>
            <p className="mt-2 text-[13px] leading-5 text-ez-muted">
              {isConnected ? `${connectedMetrics.join(' · ')}을 함께 보고 있어요.` : '매일 기록하지 않아도 수면과 활동 흐름을 함께 볼 수 있어요.'}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2" aria-label="사용할 생활 데이터">
              {visibleMetrics.map((metric) => (
                <div key={metric} className="rounded-[12px] border border-ez-border bg-white px-3 py-2.5 text-[12px] font-medium text-ez-text">{metric}</div>
              ))}
            </div>
            <p className="mt-4 text-[11px] leading-5 text-ez-muted">허용한 정보만 가져와요. 언제든 연결을 끊을 수 있어요.</p>
            {!isConnected && <p className="mt-1 text-[10px] text-ez-muted">웹 데모에서는 예시 데이터를 연결해요.</p>}
            {error && <p className="mt-3 text-[12px] text-ez-danger" role="alert">{error}</p>}

            {isConnected ? (
              <SecondaryButton type="button" fullWidth className="mt-5 text-ez-danger" onClick={() => setIsConfirmingDisconnect(true)}>EZkin과 연결 끊기</SecondaryButton>
            ) : (
              <PrimaryButton type="button" fullWidth className="mt-5" onClick={onConnect} disabled={isBusy} icon={isBusy ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : undefined}>
                {isBusy ? '연결하고 있어요' : '생활 데이터 연결'}
              </PrimaryButton>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
