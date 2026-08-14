import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../utils/cn'

interface StickyDetailHeaderProps {
  title: string
  backTo: string
  rightAction?: ReactNode
  showTitle?: boolean
}

export function StickyDetailHeader({
  title,
  backTo,
  rightAction,
  showTitle = true,
}: StickyDetailHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const updateScrolledState = () => setIsScrolled(window.scrollY > 8)
    updateScrolledState()
    window.addEventListener('scroll', updateScrolledState, { passive: true })
    return () => window.removeEventListener('scroll', updateScrolledState)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex min-h-14 items-center gap-3 border-b border-transparent bg-ez-bg/92 px-4 py-2 backdrop-blur-md sm:top-4',
        isScrolled && 'border-ez-border/80 shadow-[0_3px_12px_rgba(46,34,77,0.035)]',
      )}
    >
      <Link
        to={backTo}
        className="grid size-11 shrink-0 place-items-center rounded-full border border-ez-border bg-white text-ez-text transition hover:bg-ez-primary-soft"
        aria-label="뒤로 가기"
      >
        <ChevronLeft size={20} aria-hidden="true" />
      </Link>
      {showTitle && (
        <h1 className="min-w-0 flex-1 truncate text-[16px] font-semibold tracking-[-0.02em] text-ez-text">
          {title}
        </h1>
      )}
      {rightAction && <div className="ml-auto shrink-0">{rightAction}</div>}
    </header>
  )
}
