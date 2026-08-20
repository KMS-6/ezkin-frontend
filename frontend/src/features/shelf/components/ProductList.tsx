import { ProductCard } from '../../../components/ui/ProductCard'
import type { ProductWithRecommendation } from '../../../types/product'

interface ProductListProps {
  title: string
  description?: string
  items: ProductWithRecommendation[]
  soft?: boolean
}

export function ProductList({ title, description, items, soft = false }: ProductListProps) {
  if (items.length === 0) return null

  return (
    <section className={soft ? 'rounded-[22px] bg-[#f3f0f8] px-3 py-4' : ''}>
      <div className="mb-3 px-0.5">
        <h2 className="text-[17px] font-bold tracking-[-0.025em] text-ez-text">{title}</h2>
        {description && <p className="mt-1 text-[12px] leading-5 text-ez-muted">{description}</p>}
      </div>
      <div className="space-y-2.5">
        {items.map((item) => <ProductCard key={item.product.id} item={item} />)}
      </div>
    </section>
  )
}
