import { Info } from 'lucide-react'

interface DisclaimerProps {
  children: string
}

export function Disclaimer({ children }: DisclaimerProps) {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-[#f3f1f7] px-3 py-2.5 text-[11px] leading-4 text-ez-muted">
      <Info size={14} className="mt-px shrink-0" aria-hidden="true" />
      {children}
    </p>
  )
}
