import { Camera } from 'lucide-react'
import { PrimaryButton } from '../../../components/ui/Button'

interface ScanActionProps {
  onStart: () => void
  disabled?: boolean
  label?: string
  status?: string
}

export function ScanAction({
  onStart,
  disabled = false,
  label = '3초 스캔 시작',
  status = '촬영 사진은 피부 분석을 위해 서버로 전송돼요.',
}: ScanActionProps) {
  return (
    <>
      <PrimaryButton
        type="button"
        fullWidth
        className="mt-5"
        onClick={onStart}
        disabled={disabled}
        icon={<Camera size={17} aria-hidden="true" />}
        aria-describedby="scan-placeholder-status"
      >
        {label}
      </PrimaryButton>
      <p id="scan-placeholder-status" className="mt-3 min-h-5 text-center text-[11px] font-medium text-ez-muted" role="status">
        {status}
      </p>
    </>
  )
}
