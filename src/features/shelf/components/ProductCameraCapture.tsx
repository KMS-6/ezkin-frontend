import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Camera, Images, LoaderCircle } from 'lucide-react'

interface ProductCameraCaptureProps {
  onCaptured: (image: Blob) => void
  onFileSelected: (file: File) => void
}

type CameraStatus = 'starting' | 'ready' | 'unavailable'

export function ProductCameraCapture({
  onCaptured,
  onFileSelected,
}: ProductCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<CameraStatus>('starting')
  const [message, setMessage] = useState('카메라를 준비하고 있어요.')

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  useEffect(() => {
    let isActive = true

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('unavailable')
        setMessage('이 브라우저에서는 카메라를 바로 열 수 없어요.')
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' } },
        })

        if (!isActive) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setStatus('ready')
      } catch (cameraError) {
        if (!isActive) return
        setStatus('unavailable')
        setMessage(
          cameraError instanceof DOMException && cameraError.name === 'NotAllowedError'
            ? '카메라 권한이 꺼져 있어요. 사진에서 가져와도 괜찮아요.'
            : '카메라를 열지 못했어요. 사진에서 가져와도 괜찮아요.',
        )
      }
    }

    void startCamera()
    return () => {
      isActive = false
      stopCamera()
    }
  }, [stopCamera])

  const captureFrame = () => {
    const video = videoRef.current
    if (!video || status !== 'ready' || video.videoWidth === 0) return

    const maxWidth = 1280
    const scale = Math.min(1, maxWidth / video.videoWidth)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    const context = canvas.getContext('2d')
    if (!context) return

    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) return
      stopCamera()
      onCaptured(blob)
    }, 'image/jpeg', 0.9)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) onFileSelected(file)
  }

  return (
    <div className="pt-3 text-center">
      <div className="relative mx-auto aspect-[3/4] w-full max-w-[300px] overflow-hidden rounded-[24px] bg-[#27212f]">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`h-full w-full object-cover ${status === 'unavailable' ? 'hidden' : ''}`}
          aria-label="제품 촬영 카메라 미리보기"
        />

        {status === 'starting' && (
          <div className="absolute inset-0 grid place-items-center text-white" role="status">
            <div>
              <LoaderCircle className="mx-auto animate-spin" size={24} aria-hidden="true" />
              <p className="mt-3 text-[12px] font-medium">{message}</p>
            </div>
          </div>
        )}

        {status === 'unavailable' && (
          <div className="absolute inset-0 grid place-items-center px-7 text-white" role="status">
            <div>
              <Camera className="mx-auto opacity-75" size={26} aria-hidden="true" />
              <p className="mt-3 text-[13px] font-medium leading-5">{message}</p>
            </div>
          </div>
        )}

        <span className="pointer-events-none absolute inset-[12%] rounded-[22px] border border-white/75" />
        <span className="pointer-events-none absolute left-1/2 top-1/2 h-px w-8 -translate-x-1/2 bg-white/55" />
        <span className="pointer-events-none absolute left-1/2 top-1/2 h-8 w-px -translate-y-1/2 bg-white/55" />
      </div>

      <p className="mt-3 text-[12px] font-medium text-ez-text">제품명과 라벨이 프레임 안에 들어오게 해주세요.</p>

      {status !== 'unavailable' && (
        <button
          type="button"
          onClick={captureFrame}
          disabled={status !== 'ready'}
          className="mx-auto mt-4 grid size-[68px] place-items-center rounded-full border-[5px] border-white bg-ez-primary shadow-[0_4px_14px_rgba(75,46,145,0.2)] transition active:scale-95 disabled:cursor-wait disabled:opacity-45"
          aria-label="제품 사진 촬영"
        >
          <Camera size={23} className="text-white" aria-hidden="true" />
        </button>
      )}

      <label className="mt-3 inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 px-4 text-[12px] font-semibold text-ez-primary">
        <Images size={15} aria-hidden="true" /> 사진에서 가져오기
        <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
      </label>
      <p className="mt-1 text-[11px] leading-4 text-ez-muted">현재 데모에서는 사진이 서버에 저장되지 않아요.</p>
    </div>
  )
}
