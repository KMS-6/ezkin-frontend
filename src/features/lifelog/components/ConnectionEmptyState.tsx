import { Link2Off } from 'lucide-react'
import { Card } from '../../../components/ui/Card'

interface ConnectionEmptyStateProps {
  kind: '생활 데이터' | '날씨'
}

export function ConnectionEmptyState({ kind }: ConnectionEmptyStateProps) {
  return (
    <Card className="flex items-start gap-3.5 p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-[#f2eff7] text-ez-muted">
        <Link2Off size={18} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <div>
        <p className="text-[14px] font-semibold text-ez-text">
          아직 연결된 {kind}가 많지 않아요.
        </p>
        <p className="mt-1 text-[12px] font-normal leading-5 text-ez-muted">
          괜찮아요. 연결하지 않아도 EZkin은 사용할 수 있어요.
        </p>
        <p className="mt-1 text-[11px] font-medium text-ez-primary">
          연결하면 매일 직접 입력하지 않아도 돼요.
        </p>
      </div>
    </Card>
  )
}
