import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Camera, Images } from 'lucide-react'
import type { ProductCameraErrorCode } from '../../../types/productRecognition'
import { ProductCameraFrame } from './ProductCameraFrame'

interface ProductCameraCaptureProps {
  onReady: () => void
  onError: (code: ProductCameraErrorCode) => void
  onCaptured: (image: Blob) => void
  onFileSelected: (file: File) => void
}

export function ProductCameraCapture({
  onReady,
  onError,
  onCaptured,
  onFileSelected,
}: ProductCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isReady, setIsReady] = useState(false)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  useEffect(() => {
    let isActive = true

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        onError('unsupported')
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
        setIsReady(true)
        onReady()
      } catch (error) {
        if (!isActive) return
        stopCamera()
        onError(
          error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'SecurityError')
            ? 'permission_denied'
            : 'camera_unavailable',
        )
      }
    }

    void startCamera()
    return () => {
      isActive = false
      stopCamera()
    }
  }, [onError, onReady, stopCamera])

  const captureFrame = () => {
    const video = videoRef.current
    if (!video || !isReady || video.videoWidth === 0 || video.videoHeight === 0) return

    const maxWidth = 1280
    const scale = Math.min(1, maxWidth / video.videoWidth)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    const context = canvas.getContext('2d')
    if (!context) {
      onError('capture_failed')
      return
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) {
        onError('capture_failed')
        return
      }
      stopCamera()
      onCaptured(blob)
    }, 'image/jpeg', 0.9)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) {
      stopCamera()
      onFileSelected(file)
    }
  }

  return (
    <div className="pt-3 text-center">
      <ProductCameraFrame videoRef={videoRef} isLoading={!isReady} />
      <p className="mt-3 text-[12px] font-medium text-ez-text">제품명과 라벨이 프레임 안에 들어오게 해주세요.</p>

      <button
        type="button"
        onClick={captureFrame}
        disabled={!isReady}
        className="mx-auto mt-4 grid size-[68px] place-items-center rounded-full border-[5px] border-white bg-ez-primary shadow-[0_4px_14px_rgba(75,46,145,0.2)] transition active:scale-95 disabled:cursor-wait disabled:opacity-45"
        aria-label="제품 사진 촬영"
      >
        <Camera size={23} className="text-white" aria-hidden="true" />
      </button>

      <label className="mt-3 inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 px-4 text-[12px] font-semibold text-ez-primary">
        <Images size={15} aria-hidden="true" /> 사진에서 가져오기
        <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
      </label>
      <p className="mt-1 text-[11px] leading-4 text-ez-muted">현재 데모에서는 사진이 서버에 저장되지 않아요.</p>
    </div>
  )
}
