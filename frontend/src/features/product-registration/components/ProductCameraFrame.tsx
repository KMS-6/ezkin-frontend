import type { RefObject } from 'react'
import { PackageSearch } from 'lucide-react'

interface ProductCameraFrameProps {
  compact?: boolean
  videoRef?: RefObject<HTMLVideoElement | null>
  isLoading?: boolean
}

export function ProductCameraFrame({
  compact = false,
  videoRef,
  isLoading = false,
}: ProductCameraFrameProps) {
  if (videoRef) {
    return (
      <div className="relative mx-auto aspect-[3/4] w-full max-w-[300px] overflow-hidden rounded-[24px] bg-[#27212f]">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
          aria-label="제품 촬영 후면 카메라 미리보기"
        />
        <span className="pointer-events-none absolute inset-[12%] rounded-[22px] border border-white/80" />
        <span className="pointer-events-none absolute left-[12%] top-[12%] size-10 rounded-tl-[16px] border-l-2 border-t-2 border-white" />
        <span className="pointer-events-none absolute right-[12%] top-[12%] size-10 rounded-tr-[16px] border-r-2 border-t-2 border-white" />
        <span className="pointer-events-none absolute bottom-[12%] left-[12%] size-10 rounded-bl-[16px] border-b-2 border-l-2 border-white" />
        <span className="pointer-events-none absolute bottom-[12%] right-[12%] size-10 rounded-br-[16px] border-b-2 border-r-2 border-white" />
        <span className="pointer-events-none absolute left-1/2 top-1/2 h-px w-8 -translate-x-1/2 bg-white/55" />
        <span className="pointer-events-none absolute left-1/2 top-1/2 h-8 w-px -translate-y-1/2 bg-white/55" />
        {isLoading && (
          <span className="absolute inset-0 grid place-items-center bg-[#27212f]/70 text-[12px] font-medium text-white" role="status">
            카메라를 준비하고 있어요.
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      className={compact
        ? 'relative mx-auto h-32 w-28 rounded-[18px] bg-gradient-to-b from-[#f4f0ff] to-white'
        : 'relative mx-auto h-[260px] w-full max-w-[300px] rounded-[24px] bg-gradient-to-b from-[#e9e1ff] to-[#f8f6ff]'}
      role="img"
      aria-label="화장품 앞면 촬영 가이드"
    >
      {!compact && (
        <>
          <span className="absolute left-4 top-4 h-10 w-10 rounded-tl-[14px] border-l-2 border-t-2 border-ez-primary/55" />
          <span className="absolute right-4 top-4 h-10 w-10 rounded-tr-[14px] border-r-2 border-t-2 border-ez-primary/55" />
          <span className="absolute bottom-4 left-4 h-10 w-10 rounded-bl-[14px] border-b-2 border-l-2 border-ez-primary/55" />
          <span className="absolute bottom-4 right-4 h-10 w-10 rounded-br-[14px] border-b-2 border-r-2 border-ez-primary/55" />
        </>
      )}

      <div className="absolute left-1/2 top-1/2 flex h-[68%] w-[42%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[16px] border border-ez-primary/30 bg-white/85 shadow-[0_8px_22px_rgba(75,46,145,0.08)]">
        <span className="absolute -top-3 left-1/2 h-4 w-1/2 -translate-x-1/2 rounded-t-md bg-ez-primary/55" />
        <PackageSearch size={compact ? 20 : 27} strokeWidth={1.5} className="text-ez-primary/70" aria-hidden="true" />
        <span className="mt-3 h-1 w-1/2 rounded bg-ez-primary/20" />
        <span className="mt-2 h-1 w-2/3 rounded bg-ez-primary/15" />
        <span className="mt-2 h-1 w-1/3 rounded bg-ez-primary/15" />
      </div>
    </div>
  )
}
