import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getRecommendedTimeLabel, getStatusPresentation } from '../../features/shelf/productPresentation'
import type { ProductWithRecommendation } from '../../types/product'
import { StatusBadge } from './StatusBadge'

interface ProductCardProps {
  item: ProductWithRecommendation
}

export function ProductCard({ item }: ProductCardProps) {
  const { product, recommendation } = item
  const status = getStatusPresentation(recommendation.status)

  return (
    <Link
      to={`/shelf/${product.id}`}
      className="flex min-h-[96px] items-center gap-3 rounded-[18px] border border-ez-border bg-white p-3.5 shadow-card transition hover:border-[#d5caef] active:scale-[0.99]"
    >
      <div className="relative grid size-14 shrink-0 place-items-end overflow-hidden rounded-2xl bg-gradient-to-br from-[#eee9ff] to-[#faf8ff] pb-2" aria-hidden="true">
        <span className="absolute left-2 top-2 size-5 rounded-full bg-white/80" />
        <span className="relative h-8 w-5 rounded-[6px] border border-[#cbbded] bg-white/80 shadow-[0_2px_5px_rgba(76,53,130,0.08)]">
          <span className="absolute -top-1 left-1/2 h-1.5 w-3 -translate-x-1/2 rounded-t-sm bg-ez-primary/70" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-ez-text">{product.name}</p>
        <p className="mt-0.5 text-[11px] font-medium text-ez-muted">{product.brand}</p>
        <div className="mt-2 flex min-w-0 items-center gap-2">
          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          <span className="text-[10px] font-medium text-ez-muted">{getRecommendedTimeLabel(recommendation.recommendedTime)}</span>
        </div>
      </div>
      <ChevronRight size={18} className="text-[#c6bfce]" aria-hidden="true" />
    </Link>
  )
}
