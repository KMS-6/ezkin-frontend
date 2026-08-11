import type { ReactNode } from 'react'

interface OnboardingStepLayoutProps {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer: ReactNode
}

export function OnboardingStepLayout({
  eyebrow,
  title,
  description,
  children,
  footer,
}: OnboardingStepLayoutProps) {
  return (
    <section className="flex min-h-full flex-1 flex-col">
      <header>
        {eyebrow && <p className="text-[11px] font-semibold text-ez-primary">{eyebrow}</p>}
        <h1 className="mt-1.5 text-[23px] font-bold leading-[1.38] tracking-[-0.035em] text-ez-text">
          {title}
        </h1>
        {description && (
          <p className="mt-2.5 text-[14px] font-normal leading-6 text-ez-muted">{description}</p>
        )}
      </header>
      {children && <div className="mt-6">{children}</div>}
      <footer className="mt-auto pt-7">{footer}</footer>
    </section>
  )
}
