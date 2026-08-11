import { ChevronRight, PackageOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PrimaryButton } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import type { RoutinePeriod, TodayShelfRoutine } from '../../../types/product'
import { cn } from '../../../utils/cn'

interface BriefingRoutineProps {
  data: TodayShelfRoutine
  period: RoutinePeriod
  onPeriodChange: (period: RoutinePeriod) => void
}

export function BriefingRoutine({ data, period, onPeriodChange }: BriefingRoutineProps) {
  const items = data[period]
  const isShelfEmpty = data.shelfProductCount === 0
  const isFallback = data.usedAvailableFallback[period]
  const routineCaption = isShelfEmpty
    ? '내 제품을 알려주면 조합을 정리해드릴게요.'
    : isFallback
      ? '오늘은 루틴을 단순하게 가져가도 좋아요.'
      : null

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold tracking-[-0.025em] text-ez-text">그래서 오늘은 이렇게</h2>
          {routineCaption && <p className="mt-1 text-[12px] font-normal text-ez-muted">{routineCaption}</p>}
        </div>
        {!isShelfEmpty && (
          <div className="flex rounded-[10px] bg-[#eeecf2] p-0.5" role="group" aria-label="오전 또는 오후 루틴 선택">
            {(['am', 'pm'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onPeriodChange(value)}
                className={cn(
                  'min-w-10 rounded-lg px-2 py-1.5 text-[11px] font-semibold uppercase text-ez-muted transition',
                  period === value && 'bg-white text-ez-primary shadow-[0_1px_4px_rgba(35,26,55,0.06)]',
                )}
                aria-pressed={period === value}
              >
                {value}
              </button>
            ))}
          </div>
        )}
      </div>

      {isShelfEmpty ? (
        <Card className="px-5 py-6 text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-[15px] bg-ez-primary-soft text-ez-primary">
            <PackageOpen size={21} aria-hidden="true" />
          </span>
          <h3 className="mt-3 text-[15px] font-semibold text-ez-text">아직 내 화장대가 비어 있어요.</h3>
          <p className="mx-auto mt-1.5 max-w-[280px] text-[12px] leading-5 text-ez-muted">
            가지고 있는 제품을 알려주면 오늘 상태에 맞는 조합을 정리해드릴게요.
          </p>
          <PrimaryButton to="/shelf" className="mt-4 min-h-10" icon={<ChevronRight size={15} aria-hidden="true" />}>
            내 화장대 등록하기
          </PrimaryButton>
        </Card>
      ) : items.length === 0 ? (
        <Card className="px-5 py-5">
          <p className="text-[14px] font-semibold text-ez-text">오늘은 루틴을 단순하게 가져가도 좋아요.</p>
          <p className="mt-1.5 text-[12px] leading-5 text-ez-muted">가진 제품을 더하지 않고 피부를 편안하게 쉬어가도 괜찮아요.</p>
        </Card>
      ) : (
        <Card className="divide-y divide-ez-border/80 overflow-hidden">
          {items.map((item, index) => (
            <Link
              key={item.product.id}
              to={`/shelf/${item.product.id}`}
              className="flex items-center gap-3.5 px-4 py-3.5 transition hover:bg-[#fbfaff]"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ez-primary-soft text-[11px] font-semibold text-ez-primary">
                {String(item.recommendation.routineStep ?? index + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold text-ez-text">{item.product.name}</span>
                <span className="mt-0.5 block truncate text-[11px] font-normal text-ez-muted">{item.recommendation.summary}</span>
              </span>
              <ChevronRight size={17} className="shrink-0 text-[#c6bfce]" aria-hidden="true" />
            </Link>
          ))}
        </Card>
      )}
    </section>
  )
}

interface BriefingPauseProps {
  data: TodayShelfRoutine
}

export function BriefingPause({ data }: BriefingPauseProps) {
  if (data.paused.length === 0) return null

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-[17px] font-bold tracking-[-0.025em] text-ez-text">오늘은 잠깐 쉬어요</h2>
        <p className="mt-1 text-[12px] font-normal text-ez-muted">사용 금지가 아니라 오늘만 자극을 조금 덜어보는 선택이에요.</p>
      </div>
      <Card className="divide-y divide-ez-border/80 overflow-hidden bg-[#fbfaff]">
        {data.paused.map((item) => (
          <Link
            key={item.product.id}
            to={`/shelf/${item.product.id}`}
            className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-ez-primary-soft/40"
          >
            <span className="size-2 shrink-0 rounded-full bg-[#b6a5dd]" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-ez-text">{item.product.name}</span>
              <span className="mt-1 block text-[11px] font-normal leading-5 text-ez-muted">{item.recommendation.reason}</span>
            </span>
            <ChevronRight size={17} className="shrink-0 text-[#c6bfce]" aria-hidden="true" />
          </Link>
        ))}
      </Card>
    </section>
  )
}
