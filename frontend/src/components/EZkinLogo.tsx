import symbolSrc from '../assets/brand/ezkin-symbol.png'
import wordmarkSrc from '../assets/brand/ezkin-wordmark.png'
import { cn } from '../utils/cn'

interface EZkinLogoProps {
  compact?: boolean
  size?: 'small' | 'medium' | 'large'
  stacked?: boolean
}

const symbolSize = {
  small: 'size-7 rounded-[9px]',
  medium: 'size-8 rounded-[10px]',
  large: 'size-24 rounded-[24px]',
}

const wordmarkSize = {
  small: 'h-8 w-16',
  medium: 'h-9 w-[74px]',
  large: 'h-16 w-32',
}

export function EZkinLogo({
  compact = false,
  size = 'medium',
  stacked = false,
}: EZkinLogoProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center',
        stacked ? 'flex-col gap-0' : 'gap-1.5',
      )}
      aria-label="EZkin"
    >
      <img
        src={symbolSrc}
        alt=""
        className={cn('shrink-0 object-contain', symbolSize[size])}
        aria-hidden="true"
      />
      {!compact && (
        <img
          src={wordmarkSrc}
          alt=""
          className={cn('shrink-0 object-contain', wordmarkSize[size])}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
