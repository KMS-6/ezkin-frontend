import { Check, Package } from 'lucide-react'
import type { Product } from '../../../types/product'
import { cn } from '../../../utils/cn'

interface ProductSelectorProps {
  products: Product[]
  selectedIds: string[]
  lockedIds?: string[]
  onToggle: (productId: string) => void
}

export function ProductSelector({
  products,
  selectedIds,
  lockedIds = [],
  onToggle,
}: ProductSelectorProps) {
  return (
    <div className="grid gap-2" aria-label="가지고 있는 제품 선택">
      {products.map((product) => {
        const isSelected = selectedIds.includes(product.id)
        const isLocked = lockedIds.includes(product.id)
        return (
          <button
            key={product.id}
            type="button"
            onClick={() => onToggle(product.id)}
            disabled={isLocked}
            className={cn(
              'flex min-h-[58px] items-center gap-3 rounded-[15px] border bg-white px-3.5 py-2.5 text-left transition duration-200',
              isSelected
                ? 'border-ez-primary bg-[#faf8ff]'
                : 'border-ez-border hover:border-[#cfc4ed]',
              isLocked && 'cursor-default opacity-75',
            )}
            aria-pressed={isSelected}
          >
            <span className={cn(
              'grid size-9 shrink-0 place-items-center rounded-xl',
              isSelected ? 'bg-ez-primary-soft text-ez-primary' : 'bg-[#f3f1f6] text-ez-muted',
            )}>
              <Package size={17} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="block truncate text-[14px] font-semibold text-ez-text">{product.name}</span>
                {isLocked && <span className="shrink-0 text-[10px] font-semibold text-ez-primary">등록됨</span>}
              </span>
              <span className="mt-0.5 block text-[11px] font-normal text-ez-muted">
                {product.categoryLabel} · {product.ingredients[0]}
              </span>
            </span>
            <span className={cn(
              'grid size-6 shrink-0 place-items-center rounded-full border transition',
              isSelected ? 'border-ez-primary bg-ez-primary text-white' : 'border-[#dcd6e4] text-transparent',
            )}>
              <Check size={13} strokeWidth={3} aria-hidden="true" />
            </span>
          </button>
        )
      })}
    </div>
  )
}
