import { Sparkles } from 'lucide-react'

interface EZkinLogoProps {
  compact?: boolean
}

export function EZkinLogo({ compact = false }: EZkinLogoProps) {
  return (
    <div className="flex items-center gap-2" aria-label="EZkin">
      <span className="grid size-8 place-items-center rounded-xl bg-ez-primary text-white shadow-[0_6px_16px_rgba(108,76,207,0.22)]">
        <Sparkles size={16} strokeWidth={2.2} aria-hidden="true" />
      </span>
      {!compact && (
        <span className="text-[21px] font-extrabold tracking-[-0.06em] text-ez-text">
          EZ<span className="text-ez-primary">kin</span>
        </span>
      )}
    </div>
  )
}
