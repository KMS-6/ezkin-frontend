import { Activity, Check, LoaderCircle } from 'lucide-react'
import type { HealthPermissionStatus } from '../../../types/healthConnection'
import { cn } from '../../../utils/cn'

interface HealthConnectionCardProps {
  status: HealthPermissionStatus
  onConnect: () => void
}

export function HealthConnectionCard({ status, onConnect }: HealthConnectionCardProps) {
  const isConnected = status === 'connected' || status === 'limited'
  const isRequesting = status === 'requesting'
  const needsRetry = status === 'denied' || status === 'unavailable'

  return (
    <div className={cn(
      'rounded-[18px] border bg-white p-4 transition duration-200',
      isConnected ? 'border-[#cec2ef]' : 'border-ez-border',
    )}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-ez-primary-soft text-ez-primary">
          <Activity size={19} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold text-ez-text">생활 데이터</h2>
          <p className="mt-0.5 text-[12px] font-medium text-ez-primary">
            {isConnected ? '수면 · 활동 · HRV' : '수면과 활동을 자동으로 반영해요.'}
          </p>
          <p className="mt-2 text-[12px] leading-5 text-ez-muted">
            {needsRetry ? '지금은 연결하지 않아도 괜찮아요.' : '허용한 정보만 가져오고 언제든 연결을 끊을 수 있어요.'}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onConnect}
        disabled={isConnected || isRequesting}
        className={cn(
          'mt-3 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl text-[12px] font-semibold transition disabled:cursor-default',
          isConnected
            ? 'bg-[#eaf8f2] text-[#287d61]'
            : 'bg-ez-primary-soft text-ez-primary hover:bg-[#e4dcff]',
        )}
      >
        {isRequesting && <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />}
        {isConnected && <Check size={14} strokeWidth={2.8} aria-hidden="true" />}
        {isRequesting ? '연결하고 있어요' : isConnected ? '생활 데이터 연결됨' : needsRetry ? '나중에 다시 연결' : '연결하기'}
      </button>
      {!isConnected && (
        <p className="mt-2 text-center text-[10px] text-ez-muted">현재 웹 데모에서는 Demo 생활 데이터를 연결해요.</p>
      )}
    </div>
  )
}
