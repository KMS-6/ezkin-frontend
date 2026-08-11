import { Camera } from 'lucide-react'
import { PrimaryButton } from '../../../components/ui/Button'

interface ScanActionProps {
  isPlaceholderVisible: boolean
  onStart: () => void
}

export function ScanAction({ isPlaceholderVisible, onStart }: ScanActionProps) {
  return (
    <>
      <PrimaryButton
        type="button"
        fullWidth
        className="mt-5"
        onClick={onStart}
        icon={<Camera size={17} aria-hidden="true" />}
        aria-describedby="scan-placeholder-status"
      >
        3초 스캔 시작
      </PrimaryButton>
      <p id="scan-placeholder-status" className="mt-3 min-h-5 text-center text-[11px] font-medium text-ez-muted" role="status">
        {isPlaceholderVisible ? '카메라 기능 연결을 준비하고 있어요.' : '촬영한 이미지는 현재 저장되지 않아요.'}
      </p>
    </>
  )
}
