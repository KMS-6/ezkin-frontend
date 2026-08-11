import type { ReactNode } from 'react'
import { EZkinLogo } from '../../../components/EZkinLogo'

interface AuthPageLayoutProps {
  title: string
  description: ReactNode
  children: ReactNode
}

export function AuthPageLayout({ title, description, children }: AuthPageLayoutProps) {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden px-6 pb-8 pt-7 sm:min-h-[calc(100vh-32px)]">
      <div className="pointer-events-none absolute -right-24 -top-20 size-60 rounded-full bg-[#eee8ff]" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-24 bottom-10 size-48 rounded-full bg-[#f2edff]/65" aria-hidden="true" />

      <div className="relative">
        <EZkinLogo />
      </div>

      <div className="relative my-auto py-10">
        <div className="mb-8">
          <h1 className="text-[25px] font-bold leading-[1.3] tracking-[-0.035em] text-ez-text">
            {title}
          </h1>
          <p className="mt-2 text-[14px] font-normal leading-6 text-ez-muted">{description}</p>
        </div>
        {children}
      </div>
    </main>
  )
}
