import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EZkinLogo } from './EZkinLogo'

interface AppHeaderProps {
  title?: string
  eyebrow?: string
  subtitle?: string
  backTo?: string
  trailing?: ReactNode
  showLogo?: boolean
}

export function AppHeader({
  title,
  eyebrow,
  subtitle,
  backTo,
  trailing,
  showLogo = false,
}: AppHeaderProps) {
  return (
    <header className="flex min-h-14 items-center justify-between gap-4 px-5 py-3">
      <div className="flex min-w-0 items-center gap-3">
        {backTo && (
          <Link
            to={backTo}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-ez-border bg-white text-ez-text transition hover:bg-ez-primary-soft"
            aria-label="뒤로 가기"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </Link>
        )}
        {showLogo ? (
          <EZkinLogo />
        ) : (
          <div className="min-w-0">
            {eyebrow && <p className="mb-0.5 text-xs font-semibold text-ez-primary">{eyebrow}</p>}
            {title && <h1 className="truncate text-lg font-bold tracking-[-0.025em] text-ez-text">{title}</h1>}
            {subtitle && <p className="mt-0.5 text-xs text-ez-muted">{subtitle}</p>}
          </div>
        )}
      </div>
      {trailing}
    </header>
  )
}
