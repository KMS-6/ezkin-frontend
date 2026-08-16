import { Link2Off } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../../../components/ui/Card'

interface ConnectionEmptyStateProps {
  kind: 'health' | 'environment'
}

export function ConnectionEmptyState({ kind }: ConnectionEmptyStateProps) {
  const isHealth = kind === 'health'
  return (
    <Card className="flex items-start gap-3.5 p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-[#f2eff7] text-ez-muted">
        <Link2Off size={18} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-ez-text">
          {isHealth ? '워치가 연결되어 있지 않아요.' : '날씨가 연결되어 있지 않아요.'}
        </p>
        <p className="mt-1 text-[12px] font-normal leading-5 text-ez-muted">
          {isHealth ? '수면과 HRV를 연결하면 피부 변화와 함께 볼 수 있어요.' : '연결하지 않아도 다른 기능은 그대로 사용할 수 있어요.'}
        </p>
        {isHealth && (
          <Link
            to="/settings"
            state={{ openHealthConnection: true }}
            className="mt-2 inline-flex min-h-9 items-center text-[12px] font-semibold text-ez-primary"
          >
            워치 연결하기
          </Link>
        )}
      </div>
    </Card>
  )
}
