import { Sparkles } from 'lucide-react'

interface ShelfSummaryProps {
  totalCount: number
  recommendedCount: number
  pauseCount: number
}

export function ShelfSummary({ totalCount, recommendedCount, pauseCount }: ShelfSummaryProps) {
  return (
    <section className="rounded-[20px] bg-gradient-to-br from-[#eee9ff] to-[#f9f7ff] p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium text-ez-muted">내 제품 {totalCount}개</p>
          <p className="mt-1 text-[14px] font-semibold text-ez-text">
            오늘 추천 {recommendedCount} · 쉬기 {pauseCount}
          </p>
        </div>
        <span className="grid size-9 place-items-center rounded-[13px] bg-white/80 text-ez-primary">
          <Sparkles size={17} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 border-t border-white/80 pt-3 text-[12px] font-medium leading-5 text-ez-primary-dark">
        새로 살 필요 없이 오늘은 이 조합이면 충분해요.
      </p>
    </section>
  )
}
